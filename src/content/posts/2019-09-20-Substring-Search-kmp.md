---
title: "Substring Search --- kmp"
date: 2019-09-20
slug: "Substring-Search-kmp"
categories: ["算法"]
tags: ["算法", "java", "字符串", "kmp"]
---

## Substring Search

这里主要讲的是**kmp算法**。

### java from the course of algorithm

#### Introduction

在长度为 N 的文本里寻找长度为 M 的模式（子串），典型情况是 N >> M。

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801230900919-1725939841.png)

这里就需要扩展两种做法，暴力与kmp算法了。

#### Brute Force

首先先来看一下暴力查找。

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801230913345-679738515.png)

就暴力地两个循环，查找文本的每个位置，最坏情况下需要近似**MN**次字符比较

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801230928182-823845050.png)

```java
public static int search(String pat, String txt) {
    int M = pat.length();
    int N = txt.length();
    for (int i = 0; i <= N - M; i++) {
        int j;
        for (j = 0; j < M; j++)
            if (txt.charAt(i + j) != pat.charAt(j))
                break;
        if (j == M) return i;    // index in txt where pattern starts
        return N;    // not found
    }
}
```

暴力算法大多数情况下会跑的特别慢，因为建立在纯暴力的做法，会存在很多回退的情况，于是就会跑的很慢。

所以暴力算法并不是总能满足我们的需求，我们希望有线性时间级别的性能保证，希望避免在文本流中回退。

#### Knuth-Morris-Pratt

KMP算法就可以解决上面所说的问题，不用回退，最多也就访问一次就可以解决问题

首先先要了解一个名词

**Deterministic Finite State Automaton**

确定型有穷（状态）自动机（DFA），是一个抽象的字符串查找机器。

- 状态数目是有穷的（包括初始状态和终结状态）。
- 每个状态对每个字符有且仅有一个转移。
- 转移到终结状态则接受这个字符串，即含有我们寻找的子串（模式）。

其中 dfa[i][j] 表示状态 j 遇到字符 i 会转移到下一个状态，并不包括终结状态。

现在查找子串就很简单啦，一开始在初始状态，文本流读到哪个字符就往哪条路走，要是走到了终结状态，也就表示找到了子串。像我们这样构造的 DFA，走到状态几，就说明已经匹配了多少个字符其实，所以走到终结状态就表示全部匹配。

就像这样

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180806171432655-228466052.png)

```java
public int seach (String txt) {
    int i,j,N = txt.length();
    for (i = 0, j = 0; i < N && j < M; i++) 
        j = dfa[txt.chaAt(i)][j];
    if (j == M) return i - M;
    //这种情况就是没有找到
    else return N;
}
```

以上的匹配过程特别轻松，重要的就是下面构造dfa这个数组的过程。

#### Construct DFA

1. 匹配情况

匹配的时候转移就特别好办，直接进行到下一个状态就可以了。

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180806171446315-1202770884.png)

1. 不匹配的情况

关键在不匹配时该如何转移。

假设在状态 j 时读到的下一个字符 c 不等于要找的子串的第 j + 1 个字符（pat.charAt(j)，从 0 标号），那么这个时候，我们从文本流中最近读出的 j - 1 个字符即为 pat[1..j - 1] + c，就是暴力算法要重新扫描的部分。

当前首字母到状态 j 出现了不匹配，按暴力算法该丢弃它从下一个字母再开始，即 pat[1]，再一路重新扫描到 c。所以，现在状态 j 遇到 c 该怎么转移，实际上和字符串 pat[1.. j - 1] + c 在 DFA 中所到状态碰到 c 的转移目标一样才对。于是我们这么计算 dfa[c][j]：在 DFA 上模拟 pat[1.. j - 1]，然后直接取字符 c 的转移。

下面举个例子 计算状态5的时候 如何去考虑字符A 和 字符B的转移

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180806171501965-420417384.png)

具体可以看下面的代码，因为这里存在一个 restart state 直接用 x来表示，因为这里的状态有的时候可以直接转移初始状态

```java
public KMP (String pat) {
    this.pat = pat;
    M = pat.length();
    dfa = new int [R][M];
    //设置初始状态
    //这里的版本就是构造有限类型的自动机，帮助记录状态迁移
    dfa[pat.chaAt(0)][0] = 1;
    for (int x = 0, j = 1; j < M; j++) {
        for (int c = 0; c < R; c++)
            dfa[c][j] = dfa[c][x];
        dfa[pat.charAt(j)][j] = j + 1;
        x = dfa[pat.charAt(j)][x];
    }
}
```

不过这个算法的复杂度 优化之后 也达到了 (o(M) + o(N)) * 字母表

于是 C++ 版本里面会再次进行优化

注：  这里还有两张算法  
**Boyer-Moore** 与 **Rabin-Karp**

这个[博客](https://www.cnblogs.com/mingyueanyao/p/9404556.html)中有详细的讲解，就不再重复记录了。

### C++ from some template in acm

当上面的有限型自动机优化的版本，最后导致的结果就是 每一都得遍历一遍字母表 所以有没有其他办法来进行优化呢

所以就有了 改进的kmp算法  
利用 模式串中的 最长前缀与最长后缀的关系来构造next数组

就像这个样子

![](https://img-blog.csdn.net/2018100519473444?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM3OTY5NDMz/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

于是这里就先讲解一下

#### 构造next数组的过程

我们规定任何一个串，next[1]=0。(不用next[0]，与串的所有对应)，仍是一张动图搞定问题：

![](https://img-blog.csdn.net/20181005223221225?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM3OTY5NDMz/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

通过把next值“看”出来，我们再来分析next值，这就很容易得到超级有名的公式了，这个式子对后面的算法理解很重要！所以先要看懂这个式子，如果上面的内容通下来了，这个应该很容易看懂了：

![](https://img-blog.csdn.net/20181005224812581?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM3OTY5NDMz/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

首先是构造next数组的过程。

#### 代码如下：

```c++
int getNext(string p) {
    int lenp = p.size();
    next[0] = -1;
    int j = -1;
    int i = 0;
    while (i < lenp - 1) {
        if (j == -1 || p[j] == p[i]) {
            next[++i] = ++j;
        }
        else j = next[j];
    }
}
```

当然 这样写next数组是完全没有问题，但是 如果有一种情况p[next[j]] == p[j] 当出现这样的情况该如何解决呢？直接看图。

比如，如果用之前的next 数组方法求模式串“abab”的next 数组，可得其next 数组为-1 0 0 1（0 0 1 2整体右移一位，初值赋为-1），当它跟下图中的文本串去匹配的时候，发现b跟c失配，于是模式串右移j - next[j] = 3 - 1 =2位。

![](http://hi.csdn.net/attachment/201106/14/8394323_1308075859Zfue.jpg)

右移2位后，b又跟c失配。事实上，因为在上一步的匹配中，已经得知p[3] = b，与s[3] = c失配，而右移两位之后，让p[ next[3] ] = p[1] = b 再跟s[3]匹配时，必然失配。问题出在哪呢？

![](http://hi.csdn.net/attachment/201106/14/8394323_13080758591kyV.jpg)

问题出在不该出现p[j] = p[ next[j] ]。为什么呢？理由是：当p[j] != s[i] 时，下次匹配必然是p[ next [j]] 跟s[i]匹配，如果p[j] = p[ next[j] ]，必然导致后一步匹配失败（因为p[j]已经跟s[i]失配，然后你还用跟p[j]等同的值p[next[j]]去跟s[i]匹配，很显然，必然失配），所以不能允许p[j] = p[ next[j ]]。如果出现了p[j] = p[ next[j] ]咋办呢？如果出现了，则需要再次递归，即令next[j] = next[ next[j] ]。

所以就需要更改一下 下面的代码

```c++
int getNext(string p) {
    int lenp = p.size();
    next[0] = -1;
    int j = -1;
    int i = 0;
    while (i < lenp - 1) {
        if (j == -1 || p[j] == p[i]) {

            //重点就在下面这个地方
            i++;
            j++;
            if (p[i] != p[j]) next[i] = j;
            //这个地方就放入其继续进入递归。
            else next[i] = next[j];
        }
        else j = next[j];
    }
}
```

后面就只剩下一开始匹配过程了。

```c++
int kmp (string s,string p) {
    int i = 0,j = 0;
    int slen = s.size();
    int plen = p.size();
    while (i < slen && j < plen) {
        if (j == -1 || s[i] = p[j]) {
            i ++ ;
            j ++ ;
        }
        else j = next[j];
    }
    if (j == plen) return i - j;
    else return -1;
}
```

后面还有两种拓展类型的算法  
BM算法 与 sunday算法  
这两种算法 有时间的情况下再来总结

这里直接贴出网址  
[博客](https://blog.csdn.net/v_july_v/article/details/7041827)
