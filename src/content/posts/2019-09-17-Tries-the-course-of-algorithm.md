---
title: "Tries --- the course of algorithm"
date: 2019-09-17
slug: "Tries-the-course-of-algorithm"
categories: ["算法"]
tags: ["算法", "java", "字符串"]
---

## 单词查找树(字典树)

首先先贴出 要实现的api:

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180729171733111-1117062077.png)

### R-way Tries

这里实现的要点就是在每一个node类里面加入一个数组去记录每一个字符可能存在的node 意思就是 256个 算上所有ASCII里面的

这里就不贴出具体函数表示功能的示意图了。

#### Tries: Java implementaion

```java
public class TriesST<Value> {
    private static final int R = 256;
    private Node root = new Node();

    private static class Node {
        private Object value;
        private Node[] next = new Node[R]; 
    }

    public void put (String key, Value val) {
        root = put(root, key, val, 0);
    }

    private Node put(Node x, String key, Value val, int d) {
        if (x == null) x = new Node();
        if (d == key.length()) {
            x.val = val;
            return x;
        }
        char c = key.charAt(d);
        x.next[c] = put(x.next[c], key, val, d + 1);
        return x;
    }

    public boolean contains (String key) {
        return get(key) != null;
    }

    public Value get(String key) {
        Node x = get(root, key, 0);
        if (x == null) return null;
        return (Value)x.val;
    }

    private Node get(Node x, String key, int d) {
        if (x == null) return null;
        if (d == key.length()) return x;
        char c = key.charAt(d);
        return get(x.next[c], key, d + 1);
    }
}
```

总的来说，上面这个算法可以很快匹配到字符串，但是特别郎芬空间，因为其有很多误用的空节点，并且空链接也太多了。

#### Tries: deletion

删除单词查找树中的某个字符串时，首先要找到它，然后把最后一个节点的值置空，再递归删除没有非空链接的空值节点。例子：

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180729171843615-47757674.png)

这里没有例子，就直接给出相应的图了。

### Ternary Search Tries

这里有点借鉴快排的思想，将每一个节点分成三个链接，大于，小于，等于  
三向单词查找树，如图：

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180730211441659-95166443.png)

这里也不再详细讲解其插入，构造，删除的过程了，类似于前面。

#### TST: Java implementation

```java
public class TST<Value> {
    private Node root;

    private class Node {
        private Value val;
        private char c;
        private Node left, mid, right;
    }

    public void put(String key, Value val) {
        root = put(root, key, val, 0);
    }

    private Node put(Node x, String key, Value val, int d) {
        char c = key.charAt(d);
        if (x == null) {
            x = new Node();
            x.c = c;
        }
        if (c < x.c) x.left = put(x.left, key, val, d);
        else if (c > x.c) x.right = put(x.right, key, val, d);
        else if (d < key.length() - 1) x.mid = put(x.mid, key, val, d + 1);
        else x.val = val;
        return x;
    }

    public boolean contains(String key) {
        return get(key) != null;
    }

    public Value get(String key) {
        Node x = get(root, key, 0);
        if (x == null) return null;
        return x.val;
    }

    private Node get(Node x, String key, int d) {
        if (x == null) return null;
        char c = key.charAt(d);
        if (c < x.c) return get(x.left, key, d);
        else if (c > x.c) return get(x.right, key, d);
        else if (d < key.length() - 1) return get(x.mid, key, d + 1);
        else return x;
    }
}
```

TST的复杂度其实有点时候是和红黑是相当，查找的效率有的时候是跟哈希的符号表也差不多，所以可能通过相应的平衡操作来保持其的性能。

**不过有的时候还可以将其与R-way tries 结合起来**

![](https://images2018.cnblogs.com/blog/886021/201807/886021-20180731115403647-1725352123.png)

上面虽然空间上面会多花一点，但是查找性能会大大提升。

### Character-based Operations

#### Keys

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801101623633-226094687.png)

返回其的所有的存储的字符串 就像中序遍历这棵树

```java
public Iterable<String> keys() {
    Queue<String> queue = new Queue<String>();
    collect(root, "", queue);
    return queue;
}

// prefix: sequence of characters on path from root to x
private void collect(Node x, String prefix, Queue<String> q) {
    if (x == null) return;
    //只有在满足了这个条件才会入队。
    if (x. val != null) q.enqueue(prefix);
    for (char c = 0; c < R; c++)
        collect(x.next[c], prefix + c, q);
}
```

#### Prefix

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801101645088-790496881.png)

```java
public Iterable<String> keyWithPrefix(String prefix) {
    Queue<String> queue = new Queue<String>();
    // x: root of subtrie for all strings
    // beginning with given prefix
    Node x = get(root, prefix, 0);
    collect(x, prefix, queue);
    return queue;
}
```

#### Longest Prefix

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801101657607-1814743932.png)

![](https://images2018.cnblogs.com/blog/886021/201808/886021-20180801101711263-980961056.png)

```java
public String longestPrefixOf(String query) {
    int length = search(root, query, 0, 0);
    return query.substring(0, length);
}

private int search(Node x, String query, int d, int length) {
    if (x == null) return length;
    if (x.val != null) length = d;
    if ( d == query.length()) return length;
    char c = query.charAt(d);
    return search(x.next[c], query, d + 1, length);
}
```

后面继续提到了 前缀树与后缀树。

参考该[博客](https://www.cnblogs.com/mingyueanyao/p/9386004.html)

**侵删**
