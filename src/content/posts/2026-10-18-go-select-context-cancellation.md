---
title: "Go 的 select 为什么没有及时响应取消？"
date: 2026-10-18
slug: "go-select-context-cancellation"
categories: ["Go"]
tags: ["Go", "并发", "context"]
description: "从发送表达式的求值时机出发，区分取消等待、取消发送和取消慢操作，并检查转发链路里的阻塞点。"
---

整理 Go 并发学习记录时，一个很容易看漏的细节是：代码里写了 `case <-ctx.Done()`，不代表 goroutine 能随时响应取消。

```go
select {
case result <- slowQuery():
case <-ctx.Done():
    return
}
```

直觉上，这像是在同时等待“查询完成”和“取消”。实际执行顺序却包含一个前置步骤：先调用 `slowQuery()`，拿到待发送的值，再决定哪次通信可以执行。

## 发送表达式会先求值

进入 `select` 时，发送语句的右侧表达式会被求值。因此，`slowQuery()` 如果阻塞，分支选择也要等它返回。相关规则见 [Go 语言规范的 select 章节](https://go.dev/ref/spec#Select_statements)。

下面的完整示例先取消 context，再进入 `select`，仍然会执行慢操作：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func slowQuery() string {
    fmt.Println("slowQuery 开始")
    time.Sleep(100 * time.Millisecond)
    fmt.Println("slowQuery 结束")
    return "result"
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    cancel()

    result := make(chan string) // 没有接收者，发送不会就绪
    select {
    case result <- slowQuery():
        fmt.Println("发送成功")
    case <-ctx.Done():
        fmt.Println("响应取消")
    }
}
```

输出顺序是：

```text
slowQuery 开始
slowQuery 结束
响应取消
```

这里的 100 毫秒是演示用的等待，不是性能测量。更直接的观察是：context 已经取消，慢操作仍然被调用了。

## 嵌套接收也可能阻塞分支选择

同样的问题会出现在：

```go
select {
case out <- <-in:
case <-ctx.Done():
    return
}
```

`<-in` 是发送值表达式的一部分。如果 `in` 没有数据，它会阻塞求值，取消分支就没有机会参与选择。

把接收拆出来后，还要检查后续发送。下面的 `out <- v` 如果无人接收，依然可能卡住：

```go
select {
case v := <-in:
    out <- v
case <-ctx.Done():
    return
}
```

一次 `select` 只协调它自身的通信，不会自动保护分支体里的另一次阻塞操作。

## 接收和发送都要有退出路径

一个支持取消的转发函数可以这样写：

```go
func forward(ctx context.Context, in <-chan string, out chan<- string) {
    for {
        select {
        case <-ctx.Done():
            return
        case v, ok := <-in:
            if !ok {
                return
            }
            select {
            case out <- v:
            case <-ctx.Done():
                return
            }
        }
    }
}
```

这个函数只负责转发，不关闭调用者传入的 `out`。输出 channel 由谁关闭，应由整个流水线的生命周期约定决定。Go 官方的 [流水线与取消文章](https://go.dev/blog/pipelines) 讨论了发送者无法退出时的处理方式。

## 停止等待与停止工作是两件事

如果底层操作不接收 context，外层放弃等待后，它仍然可能继续运行。

对于“一个后台任务只发送一次结果”的特定模型，容量为 1 的结果 channel 可以避免任务完成后因无人接收而阻塞。但它不能中断任务本身；如果任务会发送多次，容量为 1 也不能保证退出。

要让慢操作提前结束，需要它真正检查 context，或者调用支持取消的下游接口。例如：

```go
func slowQueryContext(ctx context.Context) (string, error) {
    timer := time.NewTimer(100 * time.Millisecond)
    defer timer.Stop()

    select {
    case <-ctx.Done():
        return "", ctx.Err()
    case <-timer.C:
        return "result", nil
    }
}
```

这里把等待本身写成可取消操作。实际数据库查询可以使用 `QueryContext`，但仍要结合驱动和下游行为判断取消效果。关于数据库操作的 context 传递，见 [Go 官方取消数据库操作指南](https://go.dev/doc/database/cancel-operations)。

context 是协作式取消机制，不会强制杀死 goroutine。取消何时生效，取决于执行路径何时检查信号。具体契约见 [context 包文档](https://pkg.go.dev/context)。

还有一个边界：当发送和取消同时就绪时，`select` 不保证优先取消。如果业务要求取消后绝不能再提交结果，就需要额外的生命周期协调，不能只依赖两个 case 的书写顺序。

检查这类代码时，可以沿调用链依次问：慢操作能否取消？接收能否退出？发送能否退出？谁负责等待后台任务结束？这些问题比单纯确认“有没有写 `ctx.Done()`”更接近实际行为。
