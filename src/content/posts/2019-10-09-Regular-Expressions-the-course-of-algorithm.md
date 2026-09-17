---
title: "Regular Expressions --- the course of algorithm"
date: 2019-10-09
slug: "Regular-Expressions-the-course-of-algorithm"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法课"]
---

## Regular Expressions

### 正则表达式

在文本中查找子字符串只是寻找一个单一的字符串，但经常的我们可能不知道这个字符串的完整信息，或是寻找的是吻合某种模式的一些字符串，即所谓 模式匹配（Pattern Matching）。

正则表达式（Regular Expressions） 就是用来描述模式的，表示符合某种模式的字符串的集合（可能是无限的），它有下面几种基本操作：

![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/1.png)

就是普通的正则表达式里面的操作。

连接、或、闭包和括号，都不难理解。其中闭包表示若干个自身连接，可以是零个。

然后他一般有以下这些缩略方式

![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/2.png)

关于完整的正则表达式 可以去看看

[正则表达式速查表](https://www.jb51.net/tools/regexsc.htm)

[基本上常用的正则表达式](https://blog.csdn.net/carechere/article/details/52315728)

因为之前接触过正则表达式，所以这个地方也就不再多余赘述了。

### REs And NFAs

其实，正则表达式和确定型有穷自动机间存在着二元性（duality），即 Kleene 定理所说：对任意 DFA 存在着描述同样字符串集合的正则表达式，对任意正则表达式存在着识别同样字符串集合的 DFA。

就像之前学习KMP的时候构造的DFA，这里其实也可以构造一个DFA，就像这样  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/3.png)

当然应用在KMP上面的DFA是线性时间的性能保证，但是这个办法并不可行，因为正则表达式对应的DFA的状态数目可能是指数级的。

于是，就来了解一下 非确定型有限状态自动机，状态之间的转移并不是确定的。

- 正则表达式用括号括起。
- 正则每个符号对应 NFA 一个状态，再加个接受状态。
- 接受空串𝜖，不扫描下个字符而直接改变状态（下图红线），不确定性所在。
- 扫描字符，匹配转移到一下个状态（下图黑线）。
- 在扫描完全部文本字符后，如果有 任一 转移序列到达接受状态，则匹配成功。

![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/4.png)

### NFA-construction

首先先讲一下它的构造过程

最先开始的状态，最后一个位置表示完成匹配  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/5.png)

所有字符直接指向下一个  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/6.png)

括号或者空的，就直接往下面指就行了  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/7.png)

闭包，比较巧妙  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/8.png)

不过分两种情况，例子里面的就是第一种情况  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/9.png)

符号 ‘|’  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/10.png)

最后再来两个空转移  
![](/2019/10/09/Regular-Expressions-the-course-of-algorithm/11.png)

当然，在完成上面的构造的过程中，需要借助数据结构栈，碰到左括号或者‘|’的时候就直接将其的编号压到栈内，碰到右括号就弹出栈顶，如果对于的是其他东西，就直接根据上面的图来顺应结果，具体看代码。

```java
// 这里就是直接用有向图来进行表示。
private Digraph buildNFA() {
    Digraph g = new Digraph(M + 1); // 顶点数加1
    Stack<Integer> ops = new Stack<Integer>();
    for (int i = 0; i < M; i++) {
        int lp = i;
        if (re[i] == '(' || re[i] == '|') ops.push(i);
        else if (re[i] == ')') {
            int or = ops.pop();
            if (re[or] == '|') {
                lp = ops.pop();
                g.addEdge(lp, or + 1);
                g.addEdge(or + 1, lp);
            }
            else lp = or;
        }
        if (i < M - 1 && re[i + 1] == '*') {
            g.addEdge(lp, i + 1);
            g.addEdge(i + 1, lp);
        }
        if (re[i] == '(' || re[i] == '*' || re[i] == ')')
            g.addEdge(i, i + 1);
    }
    return g;
}
```

### NFA-simulation

首先我们这样来表示 NFA：用整数 0 到 M（正则长度）来标号状态（像上图），用数组 re 来存储正则表达式，用有向图来存储空转移

至于怎么模拟 NFA 输入文本运行，感觉类似广搜，维护每一步所有可能走到的状态，下一步再拓展这些状态，要是文本流结束那步的状态里包含接受状态，就表示匹配成功。例图：

```java
public class NFA {
    private char[] re;    // match transitions
    private Digraph G;    // epsilon transition digraph
    private int M;        // number of states

    public NFA(String regexp) {
        M = regexp.length();
        re = regexp.toCharArray();    
        G = buildEpsilonTransitionDigraph();
    }

    public boolean recognizes(String txt) {
        // states reachable from start by epsilon transitions
        Bag<Integer> pc = new Bag<Integer>();
        DirectedDFS dfs = new DirectedDFS(G, 0);
        for (int v = 0; v < G.V(); v++)
            if (dfs.marked(v)) pc.add(v);

        for (int i = 0; i < txt.length(); i++) {
            // states reachable after scanning past txt.charAt(i)
            Bag<Integer> match = new Bag<Integer>();
            for (int v : pc) {
                if (v == M) continue;
                // 匹配时直接加上下一个状态
                if ((re[v] == txt.charAt(i)) || re[v] == '.')
                    match.add(v + 1);
            }

            //最坏的结果就是 match 重新复制了一遍上述的全部
            dfs = new DirectedDFS(G, match);    // 拓展上一步的所有状态
            pc = new Bag<Integer>();
            for (int v = 0; v < G.V(); v++)
                if (dfs.marked(v)) pc.add(v);
        }

        // accept if can end in state M
        for (int v : pc)
            if (v == M) return true;
        return false;
    }
}
```

图文 大部分借鉴 [博客](https://www.cnblogs.com/mingyueanyao/p/9495243.html)

若侵权，必删。
