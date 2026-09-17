---
title: "CollinearPoint"
date: 2019-02-24
slug: "CollinearPoint"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法课"]
---

## CollinearPoint——-普林斯顿第三周大作业

第三周的大作业 有点意思，基于排序的一次简单优化，先看题目。

![11](/2019/02/24/CollinearPoint/11.png)  
![22](/2019/02/24/CollinearPoint/22.png)  
![33](/2019/02/24/CollinearPoint/33.png)  
![44](/2019/02/24/CollinearPoint/44.png)

一步一步来，根据题目首先写出一个点的类，这个类要包含比较，并且，要包含求出两个类之间斜率的方法。  
**Point.java**  
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
package Programming_Assignment_3;  
  
import edu.princeton.cs.algs4.StdDraw;  
import edu.princeton.cs.algs4.StdRandom;  
import java.util.Arrays;  
import java.util.Comparator;  
  
public class Point implements Comparable<Point> {  
    private final int x;  
    private final int y;  
  
    public Point(int x, int y) {  
        this.x = x;  
        this.y = y;  
    }  
  
    public void draw() {  
        StdDraw.point(x,y);  
    }  
  
    public   void drawTo(Point that) {  
        StdDraw.line(x,y,that.x,that.y);  
    }  
  
    public String toString() {  
        return "(" + x + ", " + y + ")";  
    }  
  
    public int compareTo(Point that) {  
        if (y > that.y)         return 1;  
        else if (y < that.y)    return -1;  
        else if (x > that.x)    return 1;  
        else if (x < that.x)    return -1;  
        else return 0;  
    }  
  
    public double slopeTo(Point that)  
    {  
        if (x == that.x)  
        {  
            if (y == that.y) return Double.NEGATIVE_INFINITY;  
            else             return Double.POSITIVE_INFINITY;  
        }  
        if (y == that.y) return 0 / 1.0;  
        return (y - that.y) * 1.0 / (x - that.x);  
  
    }  
  
    private class SlopeOrder implements Comparator<Point>{  
        public int compare(Point p, Point q)  
        {  
            if (slopeTo(p) < slopeTo(q)) return -1;  
            if (slopeTo(p) > slopeTo(q)) return +1;  
            return 0;  
        }  
    }  
  
    public Comparator<Point> slopeOrder() {  
        return new  SlopeOrder();  
    }  
  
    public static void main(String[] args)  
    {  
        int x0 = Integer.parseInt(args[0]);  
        int y0 = Integer.parseInt(args[1]);  
        int n = Integer.parseInt(args[2]);  
  
        StdDraw.setCanvasSize(800, 800);  
        StdDraw.setXscale(0, 50);  
        StdDraw.setYscale(0, 50);  
        StdDraw.setPenRadius(0.005);  
        StdDraw.enableDoubleBuffering();  
  
        Point[] points = new Point[n];  
  
        for (int i = 0; i < n; i++)  
        {  
            int x = StdRandom.uniform(50);  
            int y = StdRandom.uniform(50);  
            points[i] = new Point(x, y);  
            points[i].draw();  
        }  
        // draw p = (x0, x1) in red  
        Point p = new Point(x0, y0);  
  
        StdDraw.setPenColor(StdDraw.RED);  
        StdDraw.setPenRadius(0.02);  
        p.draw();  
        // draw line segments from p to each point, one at a time, in polar order  
        StdDraw.setPenRadius();  
        StdDraw.setPenColor(StdDraw.BLUE);  
        Arrays.sort(points, p.slopeOrder());  
        for (int i = 0; i < n; i++)  
        {  
            p.drawTo(points[i]);  
            StdDraw.show();  
            StdDraw.pause(100);  
        }  
    }  
  
}

接下来就是直线的类，这两个类都比较简单，这里就直接贴出代码  
**LineSegment.java**  
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
package Programming_Assignment_3;  
  
public class LineSegment {  
    private final Point a;  
    private final Point b;  
  
    public LineSegment(Point p, Point q) {  
        if (p == null || q == null)  
            throw new java.lang.IllegalArgumentException();  
        a = p;  
        b = q;  
    }  
    public void draw() {  
        a.drawTo(b);  
    }  
  
    public String toString() {  
        return a + " -> " + b;  
    }  
  
    public int hasCode() {  
        throw new UnsupportedOperationException();  
    }  
}

最后就是问题的求解方法。  
问题 需要知道平面上的点，有哪些点是在一条直线上的，第一种方法，暴力法，直接用四种循环写出答案。

**BruteCollinearPoints.java**  
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
package Programming_Assignment_3;  
  
import java.util.ArrayList;  
import java.util.Arrays;  
  
public class BruteCollinearPoints {  
  
    private Point[] copies;  
    private ArrayList<LineSegment> lineSegments = new ArrayList<LineSegment>();  
  
    // finds all line segments containing 4 points  
    public BruteCollinearPoints(final Point[] points) {  
  
        if (points == null)  
            throw new java.lang.IllegalArgumentException();  
  
        copies = new Point[points.length];  
        for (int i = 0; i < points.length; i++) {  
            copies[i] = points[i];  
        }  
  
        // sort by y-coordinate  
        // the endpoints are the first and last points  
        Arrays.sort(copies);  
  
        // after sort then can check if duplicate  
        for (int i = 0; i < copies.length - 1; i++)  
            if (copies[i].compareTo(copies[i+1]) == 0)  
                throw new java.lang.IllegalArgumentException();  
  
        for (int ip = 0; ip < copies.length-3; ip++) {  
            for (int iq = ip + 1; iq < copies.length-2; iq++) {  
                double slopeP2Q = copies[ip].slopeTo(copies[iq]);  
                for (int ir = iq + 1; ir < copies.length-1; ir++) {  
                    double slopeQ2R = copies[iq].slopeTo(copies[ir]);  
                    if (slopeP2Q != slopeQ2R) continue;  
                    for (int is = ir + 1; is < copies.length; is++) {  
                        double slopeR2S = copies[ir].slopeTo(copies[is]);  
                        // if 3 of 4's slopes are equal then 4 points are colllinear  
                        if (slopeP2Q == slopeR2S)  
                            lineSegments.add(new LineSegment(copies[ip], copies[is]));  
                    }  
                }  
            }  
        }  
    }  
  
    // the number of line segments  
    public int numberOfSegments() {  
        return lineSegments.size();  
    }  
  
    // the line segments  
    public LineSegment[] segments() {  
        LineSegment[] result = new LineSegment[lineSegments.size()];  
        for (int i = 0; i < lineSegments.size(); i++) {  
            result[i] = lineSegments.get(i);  
        }  
        return result;  
    }

优化的方法就是基于排序，将每一个点都与已经排好序的点集进行比较，按照一定的顺序进行比较可以省略很多。  
**FastCollinearPoints.java**  
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
  
package Programming_Assignment_3;  
  
import java.util.ArrayList;  
import java.util.Arrays;  
  
public class FastCollinearPoints {  
  
    private Point[] copies;  
    private ArrayList<LineSegment> lineSegments = new ArrayList<LineSegment>();  
  
    // finds all line segments containing 4 or more points  
    public FastCollinearPoints(Point[] points) {  
        if (points == null)  
            throw new java.lang.IllegalArgumentException();  
  
        copies = new Point[points.length];  
        for (int i = 0; i < points.length; i++) {  
            copies[i] = points[i];  
        }  
  
        // sort by y-coordinate  
        // the endpoints are the first and last points  
        Arrays.sort(copies);  
  
        // after sort then can check if duplicate  
        for (int i = 0; i < copies.length - 1; i++)  
            if (copies[i].compareTo(copies[i+1]) == 0)  
                throw new java.lang.IllegalArgumentException();  
  
        for (int i = 0; i < copies.length - 1; i++) {  
            Point origin = copies[i];             // Think of p as the origin.  
            double[] slopes = new double[copies.length - 1 - i];  
            Point[] others = new Point[copies.length - 1 - i];  
  
            for (int j = 0; j < copies.length - 1 - i; j++)  
                others[j] = copies[j + 1 + i];  
  
            // For each other point q, determine the slope it makes with p  
            for (int j = 0; j < others.length; j++)  
                slopes[j] = origin.slopeTo(others[j]);  
  
            // Sort the points according to the slopes they makes with p  
            Arrays.sort(others, origin.slopeOrder());  
  
            Arrays.sort(slopes);  
            // Check if any 3 (or more) adjacent points in the  
            // sorted order have equal slopes with respect to p  
            // If so, these points, together with p, are collinear  
            for (int cnt_same = 0, j = 0; j < slopes.length - 1; j++) {  
                if (slopes[j] == slopes[j+1]) {  
                    cnt_same++;  
                }  
                if (cnt_same >= 2) {  
                    lineSegments.add(new LineSegment(origin, others[j + 1]));  
                    break;  
                }  
            }  
        }  
    }  
  
    // the number of line segments  
    public int numberOfSegments() {  
        return lineSegments.size();  
    }  
  
    // the line segments  
    public LineSegment[] segments() {  
        LineSegment[] result = new LineSegment[lineSegments.size()];  
        for (int i = 0; i < lineSegments.size(); i++) {  
            result[i] = lineSegments.get(i);  
        }  
        return result;  
    }  
}

## 总结

由于暴力做法运算了很多原本不需要的循环，相当于是做了很多重复功，所以不招收待见，而基于优化的版本进行了优化，所以在实际应用中是可取的。
