---
title: "Permutation"
date: 2019-02-24
slug: "Permutation"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法课"]
---

# Permutation———普林斯顿算法大作业第二次

总的来说第二次算法大作业比较简单，实现以下双端队列，以及随机出队的队列。  
鉴于这个难度系数，我这里直接写了两种，基于数组与基于链表两种方式，首先先看题目。

![1](/2019/02/24/Permutation/11.png)  
![2](/2019/02/24/Permutation/22.png)

由于比较简单 这里不多说 直接开始贴代码。

**Deque**  
1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  
40  
41  
42  
43  
44  
45  
46  
47  
48  
49  
50  
51  
52  
53  
54  
55  
56  
57  
58  
59  
60  
61  
62  
63  
64  
65  
66  
67  
68  
69  
70  
71  
72  
73  
74  
75  
76  
77  
78  
79  
80  
81  
82  
83  
84  
85  
86  
87  
88  
89  
90  
91  
92  
93  
94  
95  
96  
97  
98  
99  
100  
101  
102  
103  
104  
105  
106  
107  
108  
109  
110  
111  
112  
113  
114  
115  
116  
117  
118  
119  
120  
121  
122  
123  
124  
125  
126  
127  
128  
129  
130  
131  
package Programming_Assignment_2;  
  
import java.util.Iterator;  
import java.util.NoSuchElementException;  
  
public class Deque<Item> implements Iterable<Item> {  
  
    private Node first,last;  
    private int size;  
  
    private class Node {  
        Item item;  
        Node next;  
        Node previous;  
        Node (Item i){  
            item = i;  
            next = null;  
            previous = null;  
        }  
    }  
  
    public Deque() {  
        first = last = null;  
        size = 0;  
    }  
  
    public boolean isEmpty() {  
        return size == 0;  
    }  
  
    public int size() {  
        return size;  
    }  
  
    public void addFirst(Item item) {  
        if (item == null){  
            throw new IllegalArgumentException();  
        }  
        Node oldFirst = first;  
        first = new Node(item);  
        first.previous = null;  
        if (isEmpty()){  
            last = first;  
            first.next = null;  
        }  
        else {  
            first.next = oldFirst;  
            oldFirst.previous = first;  
        }  
        size++;  
    }  
    public void addLast(Item item) {  
        if (item == null){  
            throw new IllegalArgumentException();  
        }  
        Node tmp = new Node(item);  
        tmp.next = null;  
        if (isEmpty()){  
            first = tmp;  
            last = tmp;  
            last.previous = null;  
        }  
        else {  
            last.next = tmp;  
            tmp.previous = last;  
            last = tmp;  
        }  
        size++;  
    }  
  
    public Item removeFirst() {  
        if (isEmpty()){  
            throw new NoSuchElementException();  
        }  
        Item cnt = first.item;  
        first = first.next;  
        size--;  
        if (isEmpty()) {  
             last = first =null;  
        }  
        else {  
            first.previous = null;  
        }  
        return cnt;  
    }  
  
    public Item removeLast() {  
        if (isEmpty()){  
            throw new NoSuchElementException();  
        }  
        Item cnt = last.item;  
        last = last.previous;  
        size--;  
        if (isEmpty()){  
            first = last = null;  
        }  
        else {  
            last.next = null;  
        }  
        return cnt;  
    }  
  
    public Iterator<Item> iterator() {  
        return new DequeIterator(first);  
    }  
  
    private class DequeIterator implements Iterator<Item>{  
        private Node current;  
  
        public DequeIterator(Node first) {  
            current = first;  
        }  
  
        public boolean hasNext(){  
            return current != null;  
        }  
  
        public void remove() {  
            throw new UnsupportedOperationException();  
        }  
  
        public Item next(){  
            if (!hasNext()){  
                throw new NoSuchElementException();  
            }  
            Item cnt = current.item;  
            current = current.next;  
            return cnt;  
        }  
    }  
}

**RandomizedQueue**  
1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  
40  
41  
42  
43  
44  
45  
46  
47  
48  
49  
50  
51  
52  
53  
54  
55  
56  
57  
58  
59  
60  
61  
62  
63  
64  
65  
66  
67  
68  
69  
70  
71  
72  
73  
74  
75  
76  
77  
78  
79  
80  
81  
82  
83  
84  
85  
86  
87  
88  
89  
90  
91  
92  
93  
94  
95  
96  
97  
98  
99  
100  
101  
102  
103  
104  
105  
106  
107  
108  
109  
package Programming_Assignment_2;  
  
import java.util.Iterator;  
import java.util.NoSuchElementException;  
import java.lang.UnsupportedOperationException;  
import edu.princeton.cs.algs4.StdRandom;  
  
  
//原本最初的打算是直接用链表进行实现的，  
//但是后来才发现性能要求迭代器的next的方法必须是常数时间，  
//而用链表实现不了，所以改用数组实现。  
  
public class RandomizedQueue<Item> implements Iterable<Item> {  
    private Item[] array;  
    private int size;  
  
    public RandomizedQueue(){  
        size = 0;  
        array = (Item[]) new Object[1];  
    }  
  
    public boolean isEmpty() {  
        return size == 0;  
    }  
  
    public int size() {  
        return size;  
    }  
  
    private void check() {  
        if (size >= array.length){  
            resize(array.length * 2);  
        }  
  
        else if (size < array.length / 4){  
            resize(array.length / 2);  
        }  
    }  
  
    private void resize(int n) {  
        Item[] tmp = (Item[]) new Object[n];  
        for (int i = 0;i < size;i++){  
            tmp[i] = array[i];  
        }  
        array = tmp;  
    }  
  
    public void enqueue(Item item) {  
        if (item == null)  
            throw new IllegalArgumentException("wrong input");  
        check();  
        array[size++] = item;  
    }  
  
    public Item dequeue() {  
        if (isEmpty())  
            throw new NoSuchElementException();  
        int random = StdRandom.uniform(size);  
        Item cnt =array[random];  
        array[random] = array[size - 1];  
        array[--size] = null;  
        check();  
        return cnt;  
    }  
  
    public Item sample() {  
        if (isEmpty())  
            throw new NoSuchElementException();  
        return array[StdRandom.uniform(size)];  
    }  
  
    public Iterator<Item> iterator() {  
        return new RandomIterator();  
    }  
  
    private class RandomIterator implements Iterator<Item> {  
        private int rank;  
        private Item[] iarray;  
  
        public RandomIterator() {  
            rank = size;  
            iarray = (Item[]) new Object[rank];  
            for (int i = 0;i < rank;i++){  
                iarray[i] = array[i];  
            }  
        }  
  
        public boolean hasNext() {  
            return rank > 0;  
        }  
  
        public void remove(){  
            throw new UnsupportedOperationException();  
        }  
  
        public Item next (){  
            if (!hasNext())  
                throw new NoSuchElementException();  
            int random = StdRandom.uniform(rank);  
            rank--;  
            Item item = iarray[random];  
            iarray[random] = iarray[rank];  
            //这里需要注意的是 与上面直接在原数组上面操作的区别就在于不能直接令后面等于null  
            //如 iarray[rank] = null 这样造成的后果是多用几次迭代器使用不了了。  
            iarray[rank] = null;  
            return item;  
        }  
    }  
}

**Permutation**

```java
package Programming_Assignment_2;

import edu.princeton.cs.algs4.StdIn;

public class Permutation {
    public static void main(String[] args) {
        RandomizedQueue<String> rq = new RandomizedQueue<String>();
        int k = Integer.parseInt(args[0]);
        while (!StdIn.isEmpty()) {
            rq.enqueue(StdIn.readString());
            // System.out.println(StdIn.readString());
        }
        while (k > 0) {
            System.out.println(rq.dequeue());
            k--;
        }
    }
}
```
