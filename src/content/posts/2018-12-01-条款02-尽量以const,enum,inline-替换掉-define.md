---
title: "条款02：尽量以const,enum,inline 替换掉#define"
date: 2018-12-01
slug: "条款02：尽量以const,enum,inline 替换掉#define"
categories: ["C"]
tags: ["c", "effective-C"]
archived: true
---

### **这个条款其实也就相当于宁可编译器替换预处理器比较好**

---

#### 1. 对于单纯常量而言，使用 const 对象或者是 enums 比 #define 更加省时间

- 时间上更为节省 作为一个语言常量而不是名称记号，由于在函数体中分配了内存，追寻起来消耗的时间比在函数中使用名称记号所花的时间更少，因为有实处更容易寻找，不像名称记号，可能有的时候并没有进入到记号表中。
- 还有一些其他的只能使用 const 情况 定义常量指针和类的专属常量
