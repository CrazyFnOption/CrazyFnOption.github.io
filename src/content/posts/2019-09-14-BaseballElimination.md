---
title: "BaseballElimination"
date: 2019-09-14
slug: "BaseballElimination"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法课"]
---

### [题目链接](https://coursera.cs.princeton.edu/algs4/assignments/baseball/specification.php)

### 题目

![1](/2019/09/14/BaseballElimination/1.png)  
![2](/2019/09/14/BaseballElimination/2.png)  
![3](/2019/09/14/BaseballElimination/3.png)  
![4](/2019/09/14/BaseballElimination/4.png)  
![5](/2019/09/14/BaseballElimination/5.png)

### 解析

#### 题目意思

给你n支队伍，然后每一个队伍有三个参数，赢得比赛，输的比赛，以及还有多少场比赛没打，然后再给一个所有剩余比赛的示意图，来表示剩余比赛谁与谁去打。获胜条件是 只有一支队伍胜利，其余的全部直接被淘汰。

现在需要做的是评估其中的一支队伍是否被淘汰。

**淘汰方式有两种**

- 第一种，评估队伍的最大获胜数，（算上其还没有打的比赛全部赢），还是没有某些队伍已经获取的胜利比赛数多，那么则可以说这个队伍已经被淘汰了。
- 第二种，需要建立一个最大流的图，然后通过最大流的图，来判断是否已经在数学上被淘汰了。

#### 最大流的建立方法

这里一共需要建立 2 + n - 1 + $C_{2}^{n - 1}\textrm{}$ 个节，分别是源点与汇点，加上队伍节点与比赛节点，就像下面这一张图

![](https://coursera.cs.princeton.edu/algs4/assignments/baseball/baseball.png)

```
如上图所示，评判方式，如果从S点出发的边里
流量都等于容量的话，那么 此时的flow 一定等同于 最大流，
说明其他队伍用了九牛二虎之力所做到的最好的结果也就是与评估队伍打成平手。

而如果flow大于最大流，则说明，有一些从s出发的边并没有达到容量，
再还有比赛没有打完的时候，就已经有队伍分数跟评估队伍的分数一样了，则说明评估队伍已经被淘汰了。
```

### 代码如下

```java
package Programming_Assignment_8;

import edu.princeton.cs.algs4.FlowEdge;
import edu.princeton.cs.algs4.FlowNetwork;
import edu.princeton.cs.algs4.FordFulkerson;
import edu.princeton.cs.algs4.In;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

public class BaseballElimination {

    private int flows;
    private final int[] win;
    private final int[] lose;
    private final int[] left;
    private final int[][] remain;
    private String[] teams;
    private final int teamnum;
    private HashMap<Integer,Integer>pos;
    private final HashMap<String, Integer> map;
    private HashSet<String> set;

    private int allv;
    private int gameTeams;

    public BaseballElimination(String filename) {
        if (filename == null) throw new IllegalArgumentException("Wrong file name...");
        In in = new In(filename);
        teamnum = Integer.parseInt(in.readLine());
        teams = new String[teamnum];
        map = new HashMap<String, Integer>();
        win = new int[teamnum];
        lose = new int [teamnum];
        left = new int[teamnum];
        remain = new int[teamnum][teamnum];

        int tot = 0;
        while (in.hasNextLine()) {
            String readline = in.readLine().trim();
            String []token = readline.split(" +");
            map.put(token[0], tot);

            teams[tot] = token[0];
            win[tot] = Integer.parseInt(token[1]);
            lose[tot] = Integer.parseInt(token[2]);
            left[tot] = Integer.parseInt(token[3]);

            for (int i = 0; i < teamnum; i++) {
                if (i == tot) remain[tot][i] = 0;
                else remain[tot][i] = Integer.parseInt(token[4 + i]);
            }
            tot++;
        }
    }

    public int numberOfTeams() {
        return teamnum;
    }

    public Iterable<String> teams() {
        return map.keySet();
    }

    public int wins(String team) {
        valid(team);
        Integer id = map.get(team);
        return win[id];
    }
    public int losses(String team) {
        valid(team);
        Integer id = map.get(team);
        return lose[id];
    }

    public int remaining(String team) {
        valid(team);
        Integer id = map.get(team);
        return left[id];
    }

    public int against(String team1, String team2) {
        valid(team1);
        valid(team2);
        Integer id1 = map.get(team1);
        Integer id2 = map.get(team2);
        return remain[id1][id2];
    }

    private FlowNetwork buildFlowNetwrok(String team) {
        valid(team);
        Integer id = map.get(team);

        int most = win[id] + left[id];

        gameTeams = (teamnum - 1) * (teamnum - 2) / 2;
        allv = gameTeams + teamnum - 1 + 2;
        flows = 0;

        pos = new HashMap<>();
        int s = 0, t = allv - 1;
        int gameIndex = 1; //比赛结点
        int indexi = gameTeams;// 球队节点
        int indexj = indexi;
        double max = Double.POSITIVE_INFINITY;

        FlowNetwork flowNetwork = new FlowNetwork(allv);
        for (int i = 0; i < teamnum; i++) {
            if (id == i) continue;
            indexi++;
            indexj = indexi;
            if(win[i] > most) return null;

            for (int j = i + 1; j < teamnum; j++) {
                if (j == id) continue;
                indexj++;
                flows += remain[i][j];
                flowNetwork.addEdge(new FlowEdge(s,gameIndex,remain[i][j]));
                flowNetwork.addEdge(new FlowEdge(gameIndex,indexi,max));
                flowNetwork.addEdge(new FlowEdge(gameIndex,indexj,max));
                gameIndex++;
            }
            pos.put(indexi,i);

            flowNetwork.addEdge(new FlowEdge(indexi,t,most - win[i]));
        }

        return flowNetwork;
    }

    private void valid(String team) {
        if (team == null) throw new IllegalArgumentException("Wrong teams");
        if (!map.containsKey(team)) throw new IllegalArgumentException("Not in the team");
    }

    public boolean isEliminated(String team) {
       valid(team);
       FlowNetwork flowNetwork = buildFlowNetwrok(team);
       int id = map.get(team);

       if (flowNetwork == null) {
           set = new HashSet<>();
           for (int i = 0; i < teamnum; i++) {
                if (id == i) continue;
                if (win[id] + left[id] < win[i]) {
                    set.add(teams[i]);
                }
           }
           return true;
       }

       FordFulkerson fordFulkerson = new FordFulkerson(flowNetwork,0,allv - 1);

       if (flows > fordFulkerson.value()) {
           set = new HashSet<>();
           for (int i = gameTeams + 1; i < allv - 1 ;i++) {
               //其实这个地方是一直弄不清楚这个函数，主要是弄不清 为什么这个点在最小割上面 就可以证明出 来自s点的边 流量不等于容量
               //查阅了相关资料，最后发现，其实 这里incut 就相当于割边直接将整张图一分为2，这里是靠近源点s的
               //换言之，就是在跑完最后一遍寻找增广路的时候，是否会有在其剩余的路径上，意思就是 当我查看队伍的点的时候，只要没有剩余的流量，就一定不会遍历到这个点上
               if (fordFulkerson.inCut(i)) {
                   int Id = pos.get(i);
                   set.add(teams[Id]);
               }
           }

           return true;
       }
        return false;

    }

    public Iterable<String> certificateOfElimination(String team)  {
        valid(team);
        if (isEliminated(team)) return set;
        return null;
    }

}
```

**注意上面所说的位置，incut 这里就是标记是否有位置还有剩余，当最后一次在找增广路的时候，那么这些位置就是没有满的位置**

### 总结

觉得这次大作业做的特别诡异，主要是题目好了好久时间才理解其真正的意思，还有可能是对于最大流的概念理解的还是不够透彻，这就是我个人的问题，接下来所需要做的就是 下一次的大作业，以及好好理解一下 最大流 最小割定理之间的变化。
