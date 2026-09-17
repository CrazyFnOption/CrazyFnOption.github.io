---
title: "Data Compression --- the course of algorithm"
date: 2019-10-10
slug: "Data-Compression-the-course-of-algorithm"
categories: ["算法"]
tags: ["java", "普林斯顿算法课", "数据压缩"]
---

## 数据压缩

### introduction

压缩数据可以节省存储数据需要的空间和传输数据需要的时间，虽然摩尔定律说集成芯片上的晶体管每 18-24 个月翻一倍，帕金森定律说数据会自己拓展来填满可用空间，但数据压缩还是最经济的做法。

数据压缩的基本模型如下，很简单，压缩和解压，压缩率即 C(B) 和 B 的比特数之比。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/1.png)

数据压缩对象的本质实际上就是将二进制文件，抽象层次为比特流， 下面直接给出了相应读写二进制的类

![](/2019/10/10/Data-Compression-the-course-of-algorithm/2.png)  
这里 java的默认处理是基于8位字节流  
![](/2019/10/10/Data-Compression-the-course-of-algorithm/3.png)

这里我举出一个简单的数据压缩的例子

将日期 12/31/1990 这个字符串进行压缩

![](/2019/10/10/Data-Compression-the-course-of-algorithm/4.png)

上面就可以轻而易举的看出来 压缩的好处。  
第一张图就是原来的写法，第二张图就是将其换成int类型进行压缩  
第三张图  
则按照特定的压缩进行压缩

**这里需要注意的是，并不存在通用的压缩算法**

当然，这里存在一种可以供人类阅读的比特流形式，这个被称为 转储。  
下面图，就是一些例子：

![](/2019/10/10/Data-Compression-the-course-of-algorithm/5.png)

BinaryDump 将比特流按 0 和 1 输出来；HexDump 将比特流组织成 8 位并用两位的 16 进制数表示；PictureDump 则将比特流变为 Picture 对象，其中白色像素表示 0，黑色像素表示 1。

### run-length Coding

游程编码，就是专门用来处理冗杂的数据，他是通过计算重复的个数，来最终决定压缩的形式，就像下图：

![](/2019/10/10/Data-Compression-the-course-of-algorithm/6.png)

上面这里就是用的4位计数，而下面的代码则是使用了8位计数。

```java
public class RunLength {
    private final static int R = 256;    // maximum run-length conut
    private final static int lgR = 8;    // number of bits per conut

    public static void compress() {
        char cnt = 0;
        boolean b, old = false;
        while (!BinaryStdIn.isEmpty()) {
            b = BinaryStdIn.readBoolean();
            if (b != old) {
                BinaryStdOut.write(cnt);
                cnt = 0;
                old = !old;
            } else {
                // 由于这个地方是八位计数，所以最大的限制也就是255
                if (cnt == 255) {
                    BinaryStdOut.write(cnt);
                    cnt = 0;
                    BinaryStdOut.write(cnt);
                }
            }
            cnt++;
        }
        BinaryStdOut.write(cnt);
        BinaryStdOut.close();
    }

    public static void expand() {
        boolean bit = false;
        while (!BinaryStdIn.isEmpty()) {
            int run = BinaryStdIn.readInt(lgR); // read 8-bit conut from standard input
            for (int i = 0; i < run; i++)
                BinaryStdOut.write(bit);        // write 1 bit to standard output
            bit = !bit;
        }
        BinaryStdOut.close();                  // pad 0s for byte alignment
    }
}
```

这种策略专门对付经常出现的，冗杂的比特流是十分有效的，游程编码的一个应用就是压缩位图，位图被广泛的用于保存图片和扫描文档。

就像这张图，左边经过压缩之后极大程度上小了很多。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/7.png)

这里的游程编码不适用于含有大量短游程的输入，而不是所有我们希望压缩的比特都能像上面一样重复个数多，且冗杂。所以接下来我们就介绍两种适用于多种类型的文件压缩算法。

### Huffman Compression

哈夫曼压缩

这里直接介绍了一个摩斯密码，但是像摩斯密码这一类的编码很容易产生多义性，所以密码之间还有一定的间隙隔开。

多义性的本质原因是有些字符的编码是其它字符编码的前缀，所以才可能会有不同的解读。而有种特殊的变长编码——前缀码（prefix-free code），字符编码肯定不是其它字符编码的前缀，也就不存在多义性的问题。

这里表示这种前缀码，可以很自然的使用字典树来进行表示

![](/2019/10/10/Data-Compression-the-course-of-algorithm/8.png)

### 节点代码

这里直接用代码表示：

```java
private static class Node implements Comparable<Node> {
    private final char ch;    // used only for leaf nodes
    private final int freq;   // used only for compress
    private final Node left, right;

    public Node(char ch, int freq, Node left, Node right) {
        this.ch = ch;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }

    private boolean isLeaf() {
        return left == null && right == null;
    }

    public int compareTo(Node that) {
        return this.freq - that.freq;
    }
}
```

字符频率在下面生成最优前缀码的时候会使用到。

当然，在下面使用前，得将这个表示前缀码的字典树一样给压缩进入到比特流，而这里就直接使用前序遍历了。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/9.png)

当然，需要将叶子节点与其他的节点区分开来的话，到叶子节点的时候会先输出一个true，意思就是1，而其他的节点则是0，附在开头的Trie相对就会显得很小，没有什么关系。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/10.png)

上面已经将压缩字典树，以及解压缩字典树都讲到了，接下来就是构造这个前缀码字典树了。

实际上，哈夫曼的做法很好描述：首先你要知道字符出现的频率，然后每次挑两个最小的加起来，加起来的值再和原来的那些一起重复挑两个最小的加起来，从下往上接成 Trie。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/11.png)

### 构造代码

```java
private static Node buildTrie(int[] freq) {
    MinPQ<Node> pq = new MinPQ<Node>();
    for (char i = 0; i < R; i++)
        if (freq[i] > 0)
            pq.insert(New Node(i, freq[i], null, null));

    // merge two smallest tries
    while (pq.size() > 1) {
        Node x = pq.delMin();
        Node y = pq.delMin();
        Node parent = new Node('\0', x.freq + y.freq, x, y);
        // 这里有点类似于广搜的操作，这样的做法就是直接将每一个最小的值弄出来，然后分别给其设置父亲节点
        pq.insert(parent);
    }

    // 最后一定一定就是根节点了。
    return pa.delMin();
}
```

### 最优解证明

这个地方目前对自己不作要求，贴两个网址

[文字讲解](https://www.cnblogs.com/mingyueanyao/p/9516423.html)

[视频讲解](https://www.coursera.org/lecture/algorithms/058ha-fu-man-suan-fa-de-zheng-que-xing-zheng-ming-nLQya)

### LZW-compression

LZW 压缩算法是自适应性的（adaptive）模型，在读入文本的时候学习并更新模型，不需要将模型附在比特流中用于解压，但解压的时候只能从文本开头开始。

### 压缩例子

展开和压缩类似，有下面几个步骤：

创建符号表，但这次编码为键，对应的字符串为值。  
初始化符号表，加入单个字符的键值对。  
从压缩文件读入 W 位的编码，输出编码对应的字符串。  
预读下一个编码，得到下个字符，类似地更新符号表。  
重复上两步直到读入结束编码。  
例图即展开上面压缩形成的编码。

![](/2019/10/10/Data-Compression-the-course-of-algorithm/12.png)

一开始读入 8 位编码 41，从符号表可知对应字符串 A，输出 A 后预读下一个编码 42，对应 B，于是往符号表中加入新键值对 (81, AB)；现在读到编码 42，输出 B 并预读 52 得到 R，所以加入 (82, BR) … 直到读入编码 80，表示文件结束。

似乎展开和压缩差不多，甚至更简单，因为不需要找最长前缀，符号表直接用数组简单实现。但是，展开有时会碰到一个特殊的情况：

![](/2019/10/10/Data-Compression-the-course-of-algorithm/13.png)

压缩字符串 ABABABA 编码成 41 42 81 83 80，现在对这编码进行展开。编码 41 输出 A，预读 42 后加入 (81, AB) 更新符号表；编码 42 输出 B，预读 81 知道下个字符是 A，加入 (82, BA)；编码 81 输出 AB，预读 83 卡住，因为符号表中还没有这个键。

但是，这种时候我们还是可以知道 AB 的下一个字符是什么的。假设 AB 后面的字符分别为 𝑐1，𝑐2，𝑐3，卡住的时候（更新要加入的编码和预读到的编码一样）肯定有 AB𝑐1=𝑐1𝑐2𝑐3,所以下个字符即 A，加入 (83, ABA) 即可。

```java
public static void expand() {
    int i;                                      // 当前更新符号表要加入的编码
    String[] st = new String[L];

    for (i = 0; i < R; i++)
        st[i] = "" + (char) i;
    st[i++] = " ";                             // 例图中表示文件结束的 0x80

    int codeword = BinaryStdIn.readInt(W);
    String val = st[codeword];
    while (true) {
        BinaryStdOut.write(val);
        codeword = BinaryStdIn.readInt(W);    // 预读的编码
        if (codeword == R) break;
        String s = st[codeword];
        if (i == codeword)                   // 要加入的编码和预读的编码相同
            s = val + val.charAt(0);
        if (i < L)
            st[i++] = val + s.charAt(0);
        val = s;
    }
    BinaryStdOut.close();
}
```

关于第二种压缩方式 有点不是很好理解，可以配合算法视频课一起食用，这里就可以不用传输模型展开压缩，编码文件了。
