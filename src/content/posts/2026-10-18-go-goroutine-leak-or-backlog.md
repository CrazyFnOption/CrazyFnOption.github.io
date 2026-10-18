---
title: "goroutine 数量上涨：如何区分泄漏与并发积压"
date: 2026-10-18
slug: "go-goroutine-leak-or-backlog"
categories: ["Go"]
tags: ["Go", "并发", "pprof"]
description: "goroutine 多是一种症状。结合生命周期、任务进出速率和负载撤除后的变化，区分无法退出与任务过多。"
---

Go 排障练习里有两类场景，表面上都表现为 goroutine 数量上涨、内存占用增加，修复方向却不同。

一类是 goroutine 已经没有完成业务的机会，却一直等在那里；另一类是任务仍然能够完成，但系统同时接纳了太多任务。前者需要修复退出路径，后者需要约束并发与任务接纳。

## 两段代码，两种问题

第一种情况：请求方提前离开，后台任务仍向一个无人接收的 channel 发送结果。

```go
result := make(chan string)
go func() {
    result <- query()
}()

select {
case v := <-result:
    use(v)
case <-ctx.Done():
    return
}
```

假设 `query()` 最终返回，而请求已经因取消退出，发送就可能一直阻塞。问题发生在结果交付阶段：goroutine 已没有合理的完成路径。

第二种情况：每收到一个任务就创建一个 goroutine，没有限制同时执行的任务数。

```go
for job := range jobs {
    go process(job)
}
```

假设单个 `process` 都能正常结束，只是处理速度跟不上输入速度，那么数量上涨首先意味着在途任务积压。这些 goroutine 未必泄漏，但资源耗尽仍然可能发生。

## 先观察负载与生命周期

| 观察点 | 无法退出的 goroutine | 并发积压 |
|---|---|---|
| 任务是否还有正常推进路径 | 常见情况是缺少接收者、退出信号或可完成条件 | 仍可推进，但等待或处理时间较长 |
| 停止新增任务之后 | 旧任务可能仍无法退出 | 在下游持续可用的前提下，任务应逐步完成 |
| 首要修复方向 | 修复取消、收发协议与资源释放 | 限制并发、限制队列、设置接纳策略 |

这张表是排查方向，不是仅凭外观就能定性的判定器。一次快照里停在 `time.Sleep` 不代表一定安全，停在 channel 上也不代表一定泄漏；有些后台 goroutine 本来就应该长期等待。

## 用多次栈快照找到可疑群体

如果程序已经提供了 pprof HTTP 入口，可以先获取 goroutine 栈：

```bash
curl -fsS 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=2' -o goroutines.txt
```

这条命令只抓取已有入口；它不会替程序开启 pprof。文本格式与参数见 [net/http/pprof 文档](https://pkg.go.dev/net/http/pprof)，profile 的用途见 [runtime/pprof 文档](https://pkg.go.dev/runtime/pprof)。

检查时，不只看总数，还要按业务调用栈分组：哪些栈在增长？是否集中在某个发送点、锁或外部调用？

然后在已知负载条件下观察变化，例如停止新增任务后，等待合理的完成时间，再取一次快照。与此同时记录接纳数、完成数、取消数、队列长度和处理耗时。栈说明“停在哪里”，任务指标帮助判断“为什么仍然停在那里”。

观察时还需要注意：下游无限等待、重试不断创建新任务、任务彼此依赖等情况，会让积压与泄漏混在一起。数量没有下降时，要继续核对退出条件，而不是立即给它贴上某一种标签。

## 修复退出路径

对发送阻塞的情况，需要明确接收方离开后，发送者如何结束。常见措施包括把取消信号传到慢操作，并让发送也支持取消：

```go
value, err := query(ctx)
if err != nil {
    return
}
select {
case result <- value:
case <-ctx.Done():
    return
}
```

这里仍有前提：`query(ctx)` 必须真正支持取消。只把参数写进签名，不会自动中断工作。流水线中发送者的退出问题，可以参考 [Go 官方流水线与取消文章](https://go.dev/blog/pipelines)。

给结果 channel 加缓冲只适用于能明确限定结果数量的场景；它不能替代整条调用链的生命周期设计。

## 约束并发与接纳

对仍可完成、但数量过多的任务，要同时考虑“正在执行多少”和“等待执行多少”。

固定 worker 池、信号量或 `errgroup.SetLimit` 可以限制执行并发；有界队列配合阻塞、拒绝或超时策略，才能进一步约束等待任务。`SetLimit` 的具体行为见 [errgroup 文档](https://pkg.go.dev/golang.org/x/sync/errgroup)。

一个常见遗漏是先创建 goroutine，再让它在内部等待配额：实际工作并发虽然受限，等待配额的 goroutine 却仍可能持续增长。配额应尽量在创建任务 goroutine 前获取，或由固定数量的 worker 消费任务。

并发上限可以限制泄漏造成的扩散，但不能补上缺失的退出路径；修好取消机制，也不能保证突发输入不会挤满系统。排障时需要分别验证这两个目标：任务能结束，任务数量也受控。
