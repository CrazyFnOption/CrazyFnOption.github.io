---
title: "BoggleSolver"
date: 2019-09-28
slug: "BoggleSolver"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法大作业"]
---

### [题目](https://coursera.cs.princeton.edu/algs4/assignments/boggle/specification.php)

![1](/2019/09/28/BoggleSolver/1.png)  
![2](/2019/09/28/BoggleSolver/2.png)  
![3](/2019/09/28/BoggleSolver/3.png)  
![4](/2019/09/28/BoggleSolver/4.png)  
![5](/2019/09/28/BoggleSolver/5.png)

### 解析

这道题的意思就是 给你一个四乘以四的方块，然后再这个方块里面遍历所有能到的位置，八个方向，每个位置只能走一次，方块上面各有一个字母，走过每一个字母之后构成一个单词，然后看这个单词最后在不在字典中，且能得到多少分？

![](https://coursera.cs.princeton.edu/algs4/assignments/boggle/pins.png)

最先开始的想法，是用一个bfs，然后将每一个遍历每一个单词，然后再讲每一个单词放入到其中进行判断，这样的话，时间复杂度会特别高，没一个单词都要遍历全部位置，并且 一些单词没有的前缀，**比如，没有Y 开头的单词的话，那么我在从Y这里开始走的话，会浪费特别多的精力。**

所以，看了一下解析，是直接用字典树去存储，然后遍历位置，就相当于遍历字典树一样。

找时间得重新写一下。自己做的很不对的地方就在于，自己用的bfs，注意的是这个状态并不是循序渐进的变化，而是每一个状态都不一样，如果要用bfs的话，那么每一个状态都要存进去大量的东西重置，所以，这就是不准确的地方。

### 贴代码

```java
import edu.princeton.cs.algs4.Bag;

import java.util.HashSet;
import edu.princeton.cs.algs4.Stack;

public class BoggleSolver
{
    //自己建立的 字典树，这样方便后面dfs查询的时候的剪枝。
    private Node root;
    private BoggleBoard board;
    private int col,row;
    private HashSet<String> allwords;
    private Bag<Integer>[] adj;
    private boolean[] vis;
    private Stack<Integer> dice;

    private class Node {
        int val = 0;
        private Node[] next = new Node[26];
    }

    public BoggleSolver(String[] dictionary) {
        root = new Node();
        for (int i = 0; i < dictionary.length; i++) {
            put(dictionary[i]);
        }
    }

    private void put(String word) {
        root = put(root, word, 0);
    }

    //这里就是直接构造出一个字典树，通过这个字典树来存储所有字符，并且剪枝dfs。
    private Node put(Node x, String word, int d) {
        if (x == null) x = new Node();
        if (d == word.length()) {
            x.val = 1;
            return x;
        }
        int c = word.charAt(d) - 'A';
        x.next[c] = put(x.next[c], word, d + 1);
        return x;
    }

    private int get(String word) {
        Node x = get(root, word, 0);
        if (x == null) return 0;
        return x.val;
    }

    private Node get(Node x, String word, int d) {
        if (x == null) return null;
        if (d == word.length()) return x;
        int c = word.charAt(d) - 'A';
        return get(x.next[c], word, d + 1);
    }

    private boolean check(int i, int j) {
        return i >= 0 && i < row && j >= 0 && j < col;
    }

    public Iterable<String> getAllValidWords(BoggleBoard board) {
        this.board = board;
        allwords = new HashSet<>();
        row = board.rows();
        col = board.cols();
        //这个地方的写法需要注意一下。
        adj = (Bag<Integer>[]) new Bag[row * col];

        for (int i = 0; i < row; i++) {
            for (int j = 0; j < col; j++) {
                int v = i * col + j;
                adj[v] = new Bag<Integer>();
                //这里就相当于图论里面的建立边，直接给后面dfs提供条件
                if (check(i - 1, j)) adj[v].add((i - 1) * col + j);
                if (check(i + 1, j)) adj[v].add((i + 1) * col + j);
                if (check(i, j - 1)) adj[v].add(i * col + j - 1);
                if (check(i, j + 1)) adj[v].add(i * col + j + 1);
                if (check(i + 1, j - 1)) adj[v].add((i + 1) * col + j - 1);
                if (check(i + 1, j + 1)) adj[v].add((i + 1) * col + j + 1);
                if (check(i - 1, j - 1)) adj[v].add((i - 1) * col + j - 1);
                if (check(i - 1, j + 1)) adj[v].add((i - 1) * col + j + 1);
            }
        }

        //接下来就到了 dfs搜图的时候
        //最先开始我个人的想法是在这个地方用bfs来进行，当时发现到后面存在很多的问题，比如时间复杂度是特别高的。

        for(int i = 0; i < row * col; i++) {
            vis = new boolean[row * col];
            dice = new Stack<Integer>();
            vis[i] = true;
            dice.push(i);
            //这个地方需要留意的是 root在这里并没有其他的含义
            char c = getLetter(i);
            if (c == 'Q') dfs(i, root.next['Q' - 'A'].next['U' - 'A'], "QU", dice);
            else dfs(i, root.next[c - 'A'], c + "", dice);
            //由于这个地方前面就直接重新定义了，所以就不需要采用清空操作了。
        }
        return allwords;
    }

    private char getLetter(int v) {
        return board.getLetter(v / col , v % col);
    }

    private void dfs(int v, Node x, String prefix, Stack<Integer>dices) {
        if (prefix.length() > 2 && x != null && x.val == 1) {
            allwords.add(prefix);
        }

        for (int w : adj[v]) {
            char c = getLetter(w);
            if (!vis[w] && x != null && x.next[c - 'A'] != null) {
                dice.push(w);
                vis[w] = true;

                if (c == 'Q') {
                    dfs(w, x.next['Q' - 'A'].next['U' - 'A'], prefix + "QU", dice);
                }
                else dfs(w, x.next[c - 'A'], prefix + c, dice);

                int d = dice.pop();
                vis[d] = false;
            }
        }
    }

    public int scoreOf(String word) {
        if (get(word) == 0)
            return 0;
        else {
            int len = word.length();
            if (len <= 2) return 0;
            else if(len == 3 || len == 4) return 1;
            else if (len == 5) return 2;
            else if (len == 6) return 3;
            else if (len == 7) return 5;
            else return 11;
        }
    }

}
```

当然，这次的作业后面还有后续，后续的地方就是 直接构成一个框架进行写，直接将这个游戏具象化，等自己熟悉了之后，再将代码贴出来。
