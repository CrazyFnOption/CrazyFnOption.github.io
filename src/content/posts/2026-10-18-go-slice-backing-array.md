---
title: "Go 小切片为什么会保留大数组？"
date: 2026-10-18
slug: "go-slice-backing-array"
categories: ["Go"]
tags: ["Go", "slice", "内存"]
description: "len 和 cap 描述切片的访问范围，不决定底层数组何时回收。理解三下标切片与独立复制各自解决的问题。"
---

如果只需要一块大缓冲区的前 16 个字节，下面这段代码看起来已经足够：

```go
var header []byte

func remember() {
    buf := make([]byte, 64<<20)
    // 假设这里已经填入业务数据。
    header = buf[:16]
}
```

`header` 的长度只有 16，但它仍然引用原来的底层数组。如果它长期存活，这块 64 MiB 的数组也可能被一并保留。

## 切片复制的是描述信息

理解 slice 时，可以把它看成对底层数组的一段描述：从哪里开始、当前长度是多少、向后还能扩展多大。赋值或切片操作不会因此复制所有元素。

```go
buf := []byte{10, 20, 30, 40}
header := buf[:2]
header[0] = 99
fmt.Println(buf) // [99 20 30 40]
```

`header` 和 `buf` 的重叠范围共享存储。这种关系也解释了内存保留：只要仍有活跃引用指向底层数组，它就可能需要继续存活。Go 官方的 [slice 说明](https://go.dev/blog/slices-intro) 专门讨论了小切片保留完整数组的问题。

## 三下标切片限制容量，但不复制元素

一种容易误用的改法是：

```go
header = buf[:16:16]
```

完整切片表达式 `s[low:high:max]` 的长度是 `high-low`，容量是 `max-low`。本例中，`len(header)` 和 `cap(header)` 都变成了 16，但底层数组仍然共享。公式见 [完整切片表达式规范](https://go.dev/ref/spec#Full_slice_expressions)。

三种写法的区别是：

| 写法 | 长度 | 容量 | 是否引用原来的大数组 |
|---|---:|---:|---|
| `buf[:16]` | 16 | 64 MiB | 是 |
| `buf[:16:16]` | 16 | 16 | 是 |
| 新建 16 字节切片后 `copy` | 16 | 16 | 否 |

容量限制的价值在于约束后续扩展。例如，对 `buf[:16:16]` 再 append 一个元素，现有容量不足，就需要分配新数组。但在发生这次分配前，原来的引用关系没有改变。

## 一个可以直接运行的对照

```go
package main

import "fmt"

func main() {
    buf := []byte{10, 20, 30, 40}
    view := buf[:2:2]
    copied := make([]byte, len(view))
    copy(copied, view)

    view[0] = 99
    fmt.Println("共享修改:", buf)
    fmt.Println("独立副本:", copied)

    view = append(view, 50) // 原 view 的容量只有 2
    view[0] = 77
    fmt.Println("扩容后原数组:", buf)
    fmt.Println("扩容后新切片:", view)
}
```

输出是：

```text
共享修改: [99 20 30 40]
独立副本: [10 20]
扩容后原数组: [99 20 30 40]
扩容后新切片: [77 20 50]
```

这个对照区分了三个时刻：限制容量后仍共享；显式复制后独立；容量不足的 append 产生新存储。这里不假定新切片具体会扩容到多少，代码只依赖容量不足时的语义。

## 想长期保留一小段，就显式复制

对于开头的场景，可以改成：

```go
var header []byte

func remember() {
    buf := make([]byte, 64<<20)
    // 假设这里已经填入业务数据。
    header = make([]byte, 16)
    copy(header, buf[:16])
}
```

这样 `header` 指向独立的小数组。函数返回后，如果没有其它活跃引用，原来的大数组便具备回收条件。

“具备回收条件”不意味着进程内存会立刻下降。对象回收与运行时向操作系统归还内存涉及不同环节，不能仅凭一次 RSS 读数断言复制无效。关于 Go 堆与内存管理的背景，见 [Go GC 指南](https://go.dev/doc/gc-guide)。

这个取舍也有成本：复制需要额外分配和数据搬运。短期处理、且原始缓冲区本来就需要存活时，共享切片往往合适；小片段要进入长期缓存，而原始大数组不再需要时，独立复制更值得考虑。
