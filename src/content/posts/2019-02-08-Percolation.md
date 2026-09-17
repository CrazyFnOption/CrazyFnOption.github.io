---
title: "Percolation"
date: 2019-02-08
slug: "Percolation"
categories: ["算法"]
tags: ["数据结构", "java", "普林斯顿算法课"]
---

## Programming Assignment 1: Percolation

第一次提交这样的全英文大作业，先开始完全看不懂题目，然后在网上看懂题目之后，于是写代码的时候也是混乱的，完全不知道该怎么用，看了别人提交的写了之后，自己也提交了几次，都是60分70分左右，到最后才发现数组的溢出，以及java输入输出的一些问题。

## 接下来看题目

**首先先看英文版的题目**

![11](/2019/02/08/Percolation/11.png)  
![12](/2019/02/08/Percolation/12.png)

**看懂的大神可以不用看下面的中文版的题目了：**

通过蒙特卡洛模拟方法来估计渗流阈值。

Percolation. 给一个有随机分布的绝缘和金属材料的组成的复合系统。例如我们想知道哪些部分必须是金属材料才能让这个复合系统是一个电导体。或者在一个多孔的地形，在表面有水或者油，在什么情况下水或者油能够从最表面渗透到最底层。科学家把这种过程的模型叫做Percolation。

The model. 在Assignment中，用一个NxN的格子表示percolation系统，每一个格子是打开或者关闭，打开是白色关闭是黑色。如果一个格子是full，首先他必须是打开额，然后表示从最顶上通过相连(4方向)的打开的格子可以渗透到这个位置。当一个系统是percolates，表示能从最顶层渗透到最底层，也就是说，最底层存在打开的格子是full。

![13](/2019/02/08/Percolation/13.png)

The Problem. 研究人员对一下的问题感兴趣，如果每一个格子是独立的，并且被打开的概率为p，那么系统percolates的概率是多少？p=0，percolates概率为0，p=100，percolates的概率为100。下图是20x20和100x100格子的概率p的分布：

![14](/2019/02/08/Percolation/14.png)

当N足够大时, 有一个阈值P*, 使得当p < p*时候，任意的N*N网格，几乎不能被渗透, 并且当p > p*, 基本能够被渗透。p*没有准确的数值解。任务是写一个计算估计p*的算法。

题目给出了两个样版分别作为题目开始写的两个类：

```java
public class Percolation {
   public Percolation(int N)              // create N-by-N grid, with all sites blocked
   public void open(int i, int j)         // open site (row i, column j) if it is not already
   public boolean isOpen(int i, int j)    // is site (row i, column j) open?
   public boolean isFull(int i, int j)    // is site (row i, column j) full?
   public boolean percolates()            // does the system percolate?
}
```

```java
public class PercolationStats {
   public PercolationStats(int n, int trials)    // perform trials independent experiments on an n-by-n grid
   public double mean()                          // sample mean of percolation threshold
   public double stddev()                        // sample standard deviation of percolation threshold
   public double confidenceLo()                  // low  endpoint of 95% confidence interval
   public double confidenceHi()                  // high endpoint of 95% confidence interval

   public static void main(String[] args)        // test client (described below)
}
```

## 第一部分建立起一个数学模型来模拟这个系统

### **class Percolation**

```java
import edu.princeton.cs.algs4.WeightedQuickUnionUF;

public class Percolation {
    //建立两个并查集 来控制 backwash 的虚拟节点所产生的问题
    private WeightedQuickUnionUF uf;
    private WeightedQuickUnionUF backwash;
    //打开的数目
    private int num;
    //这里用一维数组来表示整张图
    private boolean[] percolation;
    //总数目
    private int len;

    public Percolation(int n) {
        if (n < 1) throw new IllegalArgumentException("Illeagal Argument");
        len = n;
        percolation = new boolean[n * n + 2];
        uf = new WeightedQuickUnionUF(n * n + 2);
        backwash = new WeightedQuickUnionUF(n * n + 1);
        num = 0;
        for (int i = 1;i < n * n + 1; i++){
            percolation[i] = false;
        }
        percolation[0] = percolation[n * n + 1] = true;
    }

    private void check(int i,int j){
        if (i < 1 || i > len || j < 1 || j > len)
            throw new IllegalArgumentException("out of the range");
    }

    private int get_position(int i,int j) {
        return (i - 1) * len + j;
    }

    public void open(int row, int col) {
        check(row,col);
        if (isOpen(row,col)) return;
        int index = get_position(row,col);
        percolation[index] = true;
        num++;
        //处理虚拟节点与实际中的点的关系
        //并且同时处理一下前后左右点之间的关系
        if (row == 1){
            uf.union(0,index);
            backwash.union(0,index);
        }
        else if (isOpen(index - len)){
            uf.union(index,index - len);
            backwash.union(index,index - len);
        }

        if (row == len) uf.union(len * len + 1,index);
        else if (isOpen(index + len)){
            uf.union(index,index + len);
            backwash.union(index,index + len);
        }

        if (col != 1 && isOpen(index - 1)){
            uf.union(index,index - 1);
            backwash.union(index,index - 1);
        }

        if (col != len && isOpen(index + 1)){
            uf.union(index,index + 1);
            backwash.union(index,index + 1);
        }
    }
    private boolean isOpen(int x){
        return percolation[x];
    }

    public boolean isOpen(int row, int col){
        check(row,col);
        return isOpen(get_position(row,col));
    }

    public boolean isFull(int row, int col){
        check(row,col);
        int index = get_position(row,col);
        if (backwash.connected(index,0))
            return true;
        return false;
    }
    public int numberOfOpenSites(){
        return num;
    }
    public boolean percolates(){
        return uf.connected(0,len * len + 1);
    }
}
```

关于以上这个类 其实最初思考之处，完全就是借鉴并查集的思想，使用一个数组来存储当前的模块有没有被打开，然后根据这个模块进行改变，然后再使用并查集将第一个与当前位置相连接，前后左右都打开就相当于链接了，然后根据遍历就可以找出是否会遍历到最后一个位置去了。

**上面所说的办法有些麻烦，有一种方法所产生的两个问题，也就是上面所使用的方法**  
使用虚拟节点，相当于预设一个起点和一个终点，最后只需要判断起点与终点是否是并查集相连接的即可

1. 并查集的使用方法，可以直接写一个类也可以使用自带好的类型。
2. 会产生终点处的backwash问题，意思就是终点位置可能会与许多没有连接到起点的支点相连接，所以采用的解决办法就是使用两个并查集。

## 第二部分就是 解决数据的位置

估计percolation的阈值，初始化时候格子都是关闭的，随机寻找一个关闭的位置打开，直到系统可以渗透为止，打开的格子比上总格子数就是阈值。

![15](/2019/02/08/Percolation/15.jpg)  
**运用一下这些公式：**  
![16](/2019/02/08/Percolation/16.png)

这个问题仅仅就是数学处理的问题，以及控制格式上面的输入输出。

### **class PercolationStats**

```java
import edu.princeton.cs.algs4.StdIn;
import edu.princeton.cs.algs4.StdOut;
import edu.princeton.cs.algs4.StdRandom;
import edu.princeton.cs.algs4.StdStats;
import edu.princeton.cs.algs4.Stopwatch;

public class PercolationStats {

    private double[] results; // estimated threshold for each trial
    private double avg;
    private double std;

    public PercolationStats(int n, int trials){

        if(n <= 0 || trials <= 0) throw new IllegalArgumentException();

        results = new double[trials];
        for(int i = 0; i < trials; i++){
            int step = 0;
            Percolation pr = new Percolation(n);
            while(!pr.percolates()){
                int row = StdRandom.uniform(n) + 1;
                int col = StdRandom.uniform(n) + 1;
                if(!pr.isOpen(row, col)){
                    pr.open(row, col);
                    step++;
                }
            }
            results[i] = (double)step / (n * n);
        }

        this.avg = StdStats.mean(results);
        this.std = StdStats.stddev(results);

    }

    public static void main(String[] args){

        StdOut.printf("%-25s\n", "Please input 2 integers");
        int N = StdIn.readInt();
        int T = StdIn.readInt();

        Stopwatch wt = new Stopwatch();

        PercolationStats ps = new PercolationStats(N, T);

        // elapsed CPU time in seconds
        double elapsed = wt.elapsedTime();

        StdOut.printf("%-25s= %.15f\n", "elapsed CPU time", elapsed);
        StdOut.printf("%-25s= %.7f\n", "mean", ps.mean());
        StdOut.printf("%-25s= %.17f\n", "stddev", ps.stddev());
        StdOut.printf("%-25s= [%.15f, %.15f]\n", "%95 confidence interval",
                ps.confidenceLo(), ps.confidenceHi());
    }

    public double mean(){
        return this.avg;
    }

    public double stddev(){
        return this.std;
    }

    public double confidenceLo(){
        return mean() - 1.96 * stddev() / Math.sqrt(results.length);
    }

    public double confidenceHi(){
        return mean() + 1.96 * stddev() / Math.sqrt(results.length);
    }

}
```
