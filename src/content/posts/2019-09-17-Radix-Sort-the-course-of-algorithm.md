---
title: "Radix Sort --- the course of algorithm"
date: 2019-09-17
slug: "Radix-Sort-the-course-of-algorithm"
categories: ["算法"]
tags: ["算法", "java", "字符串"]
---

## 基数排序

[课程地址](https://www.coursera.org/learn/algorithms-part2/supplement/v5gBy/lecture-slides)

### String in java

#### Char Data Type

C 语言中的字符数据类型占一个字节（8 比特），最多只能表示 256 个字符。支持 7 位的标准 ASCII(American Standard Code for Information Interchange，美国标准信息交换编码)，最高位用于奇偶校验。或是拓展的 ASCII，最高位用来确定附加的 128 个特殊的字符。

而java中的字符数据类型占两个字节，支持16位的Unicode编码。

#### String Data Type

java String api

![api](https://images2018.cnblogs.com/blog/886021/201807/886021-20180721162521004-905655523.png)

接下来就是java中两种字符串类型的比较，一种是String，另外一种就是StringBuilder 这两种之间的区别就在于 一个是内部可变，另外一种就是内部不可变。

然而 还有一种StringBuffer 这种与前面后者的相比就是线程安全与否的区别了。

### Key-indexed counting

因为一般字符串中基于排序的比较 基本上至少都是需要NlgN的比较，然后有一种基数比较的办法诞生，称作**键索引计数比较法**

设想有个数组 a = {d, a, c, f, f, b, d, b, f, b, e, a} 要排序，知道总共有 6 个不同的字母，要先统计它们出现的频数。

字母 a 的键为 0 （a[i] - ‘a’），出现的次数在 count 数组中的索引为键值加一。

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180721174333877-1881107237.png)

**java implements**

```java
int R = 6;
int N = a.length;
int[] count = new int[R + 1];

for (int i = 0; i < N; i++)
    count[a[i] - 'a' + 1]++;

//遍历一遍count数组
for (int i = 0; i < R; i++)
    count[i + 1] += count[i];

//现在 count 数组中保存的即对应字母在排好序的数组中开始的索引值，像两个 d 应该放在 a[6] 和 a[7]。
char[] aux = new char[N];
for (int i = 0; i < N; i++)
    aux[count[a[i] - 'a']++] = a[i];
```

辅助数组 aux 借助 count 数组找到了每个 a[i] 的位置。注意 count 数组在这一步中还会改变，每次要加一，下次相同的 a[i] 就会放在下一个位置。所以这个算法也是稳定的（stable），相同元素间的相对顺序不会改变。

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180721174344508-415087789.png)

最后把 aux 数组一个个赋值回原数组，即完成了排序。

键索引计数法排序只需要几个一重循环，不需要比较，只要 R 在 N 的一个常数因子范围内，它就是一个线性时间级别的排序方法。

### LSD Radix Sort

低位优先排序，就是将等长的字符串进行排序，必须是等长的字符串进行排序，需要做的是从右向左进行排序

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180723155344760-2032525065.png)

这个排序是稳定的，相同键之间的相对顺序是不会改变的，意思就是在i前面的，在i + 1排完字后，依然还是在i前面，如果是相同键的情况下。

#### LSD: Java Implementation

```java
public class LSD {
    public static void sort(String []a,int w) {
        int R = 256;
        int N = a.length;
        String[] aux = new String[N];

        //从后往前面依次进行排序
        for (int d = w - 1; d >= 0; d--) {
            int[] count = new int [R + 1];

            for (int i = 0; i < N; i++)
                count[a[i].charAt(d) + 1] ++;
            for (int r = 0; r < R; r++) 
                count[r + 1] += count[r];
            for (int i = 0; i < N; i++)
                aux[count[a[i].charAt(d)]++] = a[i];
            for (int i = 0; i < N; i++)
                a[i] = aux[i];
        }
    }
}
```

**对于典型的应用,R(基数)远小于N(总数),对定长(W)的字符串排序的时间是MN级别。**

### MSD Radix Sort

高位排序，有别于低位排序的是，其可以对不等长的字符串进行排序，从左向右进行一位一位的扫描，然后再递归的对子字符串进行基数排序。

就像这样：  
![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180723172529187-913394612.png)

因为涉及到递归，所以必须得设置一下递归出口，用一下函数直接设置递归出口

```java
private static int charAt(String s, int d) {
    if (d < s.length) return s.charAt(d);
    else return -1;
}
```

#### MSD: Java Implementation

由于上面多了一个键，所以现在count的数组大小必须是R + 2

```java
public static void sort(String[] a) {
    aux = new String[a.length];
    sort(a, aux, 0, a.length - 1, 0);
}

private static void sort(String[] a, String[] aux, int lo, int hi, int d) {
    if (hi <= lo) return;
    int[] count = new int[R + 2];
    for (int i = lo; i <= hi; i++)
        count[charAt(a[i], d) + 2]++;
    for (int r = 0; r < R + 1; r++)
        count[r + 1] += count[r];
    for (int i = lo; i <= h; i++)
        aux[count[charAt(a[i], d) + 1]++] = a[i];
    for (int i = lo; i <= hi; i++)
        a[i] = aux[i -lo];

    // sort R subarrays recursively
    for (int r = 0; r < R; r++)
        sort(a, aux, lo + count[r], lo + count[r + 1] - 1, d + 1);
}

//另外用于辅助的数组aux可以重复使用，但是每一次都需要新的count数组，不仅耗费空间，还需要时间去初始化，所以对于小型的子数组，可以直接使用插入排序直接进行改善

public static void sort(String[] a, int lo, int hi, int d) {
    for (int i = lo; i <= hi; i++)
        for (int j = i; j > lo && less(a[j], a[j - 1], d); j--)
            exch(a, j, j -1);
}

private static boolean less(String v, String w, int d) {
    return v.substring(d).compareTo(w.substring(d)) < 0;
}
```

MSD算法的性能取决于要输入的数据，最坏的情况下需要检查的所有的字符，和LSD一样都是线性的时间级别。  
![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180723204033182-1142104535.png)

### 3-way Radix Quicksort

三相切分的思想其实很简单，基于MSD的思想，加入了快排，将第一个字符串的首字母，进行切分，分成大于，小于，等于该字母的组合，然后再分别进入到子字符串中进行递归使用。

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180724163107802-1133643500.png)

#### 3-way String Quicksort: Java Implementation

```java
private static void sort(String[] a) {
    sort(a, 0, a.length - 1, 0);
}

private static void sort(String []a, int lo, int hi, int d) {
    if (lo >= hi) return;
    int lt = lo, gt = hi;
    int v = charAt(a[lo], d);
    int i = lo + 1;
    while (i <= gt) {
        int t = charAt(a[i], d);
        if (t < v) exch(a, lt++, i++);
        else if (t > v) exch(a,i,gt--);
        else i++;
    }

    //这里是再次比较前面的数组进行三相切分。
    sort(a, lo, lt - 1, d);
    //这里的意思第一个字母是相同的，所以可以开始递归第二个字母了
    if (v >= 0) sort(a, lt, gt, d + 1); 
    sort(a, gt + 1, hi, d);
}
```

### Suffix Arrays

字符串后缀数组 有很多应用，比如关键词查找，最长重复子字符等等。

```java
public static String[] suffixes(String s) {
    int N = s.length();
    String[] suffixes = new String[N];
    for (int i = 0; i < N; i++)
        suffixes[i] = s.substring(i, N);
    return suffixes;
}
```

对于后缀数组进行排序，就可以把相同的字符串给安排到一起了，这样的话查找关键词也就快了很多。

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180727212115060-421776584.png)

就像这样，最长重复子字符串也差不多  
![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180727212127781-214870736.png)

#### LRS: Java Implementation

```java
public String lrs(String s) {
    int N = s.length();

    String[] suffixes = new String[N];
    for (int i = 0; i < N; i++)
        suffixes[i] =s.substring(i, N);

    Arrays.sort(suffixes);

    String lrs = "";
    for (int i = 0; i < N - 1; i++) {
        // compute longest common prefix
        // between adjacent suffixes insorted order
        int len = lcp(suffixes[i], suffixes[i + 1]);
        if (len > lrs.length())
           lrs = suffixes[i].substring(0, len);
    }
    return lrs;
}
```

不过最坏的情况,应该会达到 n$^{2}$。  
因为输入字符串重复时，需要很多次比较才能完成排序，所以这里介绍了另外一种算法 Manber-Myer MSD 算法

有兴趣的话 可以自己去查一查 这里就不在多说了。

本篇文章借鉴该[博客](https://www.cnblogs.com/mingyueanyao/p/9347094.html)

若侵删。
