---
title: "SeamCarver"
date: 2019-09-10
slug: "SeamCarver"
categories: ["算法"]
tags: ["算法", "java", "普林斯顿算法大作业"]
---

### 题目

[题目链接](https://coursera.cs.princeton.edu/algs4/assignments/seam/specification.php)

**题目详图**  
![1](/2019/09/10/SeamCarver/1.png)  
![2](/2019/09/10/SeamCarver/2.png)  
![3](/2019/09/10/SeamCarver/3.png)  
![4](/2019/09/10/SeamCarver/4.png)  
![5](/2019/09/10/SeamCarver/5.png)  
![6](/2019/09/10/SeamCarver/6.png)

### 解析

这道题是我这几次做这个java大作业里面，还特别有意思的一次作业，主要是这次介绍的这个算法特别流弊，感觉特别常见，就是发现于2007年的算法，并且应用于 Photoshop内核的算法，用于图片的拉伸与缩放。

先开始是作为最短路里面的算法出现，感觉特别的懵逼，因为完全不知道该怎么下手，不过后面就好很多了，意思就是使用一个特定的公式，将每一个像素点与周围8个方向的点的差异相联系，作为整个像素点的权值，然后从不同于拉伸的方向，从顶部到底部找一条像素点权值最小的路线，然后将这条路线进行删除，最后便得到结果。

然后找最短路的办法，这里使用的就是 对每一个点，至上而下的松弛，最终得到结果，这次作业只是看着有点吓人，但是其实还是特别简单的。

```java
import edu.princeton.cs.algs4.Picture;

public class SeamCarver {

    //这里图像会发生改变，所以这里不能直接写定义成不变量
    private int width;
    private int height;
    private int [][] picture;
    private double [][] energy;

    // create a seam carver object based on the given picture
    public SeamCarver(Picture picture) {
        if (picture == null) throw new IllegalArgumentException();
        this.height = picture.height();
        this.width = picture.width();

        this.picture = new int [width][height];

        for (int i = 0; i < this.width; i++) {
            for (int j = 0; j < this.height; j++) {
                this.picture[i][j] = picture.getRGB(i, j);
            }
        }
        renewenergy();
    }

    private void validateindex(int col, int row) {
        if (row < 0 || row >= height || col < 0 || col >= width) {
            throw new IllegalArgumentException("Wrong index");
        }
        return;
    }

    private void renewenergy() {
        energy = new double[width][height];
        for (int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                calculatenergy(i, j);
            }
        }
    }

    private void calculatenergy(int x, int y) {
        validateindex(x, y);
        if (x == 0 || y == 0 || x == width - 1 || y == height - 1) {
            energy[x][y] = 1000.0;
            return;
        }
        int rgbUp = picture[x][y - 1];
        int rgbDown = picture[x][y + 1];
        int rgbLeft = picture[x - 1][y];
        int rgbRight = picture[x + 1][y];

        double rx = Math.pow(((rgbLeft >> 16) & 0xFF) - ((rgbRight >> 16) & 0xFF), 2);
        double gx = Math.pow(((rgbLeft >> 8) & 0xFF) - ((rgbRight >> 8) & 0xFF), 2);
        double bx = Math.pow(((rgbLeft >> 0) & 0xFF) - ((rgbRight >> 0) & 0xFF), 2);

        double ry = Math.pow(((rgbUp >> 16) & 0xFF) - ((rgbDown >> 16) & 0xFF), 2);
        double gy = Math.pow(((rgbUp >> 8) & 0xFF) - ((rgbDown >> 8) & 0xFF), 2);
        double by = Math.pow(((rgbUp >> 0) & 0xFF) - ((rgbDown >> 0) & 0xFF), 2);

        energy[x][y] =  Math.sqrt(rx + gx + bx + ry + gy + by);
        return;
    }

    public Picture picture() {
        Picture tmp = new Picture(width, height);
        for (int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                tmp.setRGB(i, j, picture[i][j]);
            }
        }
        return tmp;
    }

    public int width() {
        return width;
    }

    public int height() {
        return height;
    }

    public double energy(int x, int y) {
        validateindex(x, y);
        return energy[x][y];
    }

    private void transform() {
        int temp = height;
        height = width;
        width = temp;

        double [][] en = new double[width][height];
        int [][] p = new int[width][height];
        for (int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                en[i][j] = energy[j][i];
                p[i][j] = picture[j][i];
            }
        }
        energy = en;
        picture = p;
    }

    public int[] findHorizontalSeam() {
        transform();
        int [] res = findVerticalSeam();
        transform();
        return res;
    }

    private void relaxVertical(double[][] disTo, int[][]edgeTo, int x, int y) {
        validateindex(x, y);
        if (disTo[x][y + 1] > disTo[x][y] + energy[x][y + 1]) {
            disTo[x][y + 1] = disTo[x][y] + energy[x][y + 1];
            edgeTo[x][y + 1] = x;
        }

        if (x > 0 && disTo[x - 1][y + 1] > disTo[x][y] + energy[x - 1][y + 1]) {
            disTo[x - 1][y + 1] = disTo[x][y] + energy[x - 1][y + 1];
            edgeTo[x - 1][y + 1] = x;
        }

        if (x < width - 1 && disTo[x + 1][y + 1] > disTo[x][y] + energy[x + 1][y + 1]) {
            disTo[x + 1][y + 1] = disTo[x][y] + energy[x + 1][y + 1];
            edgeTo[x + 1][y + 1] = x;
        }
    }

    public int[] findVerticalSeam() {
        int [] seam = new int[height];
        double [][] disTo = new double [width][height];
        int [][] edgeTo = new int [width][height];

        for (int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                if (j == 0) disTo[i][j] = energy[i][j];
                else disTo[i][j] = Double.POSITIVE_INFINITY;
            }
        }

        //这里的顺序错了，因为 这里比较特殊的是矩阵的存法，所以必须将循环翻过来进行存取
        for (int j = 0; j < height - 1; j++) {
            for (int i = 0; i < width; i++) {
                relaxVertical(disTo, edgeTo, i, j);
            }
        }

        double min = Double.POSITIVE_INFINITY;
        int index = -1;
        for (int i = 0; i < width; i++) {
            if (min > disTo[i][height - 1]) {
                min = disTo[i][height - 1];
                index = i;
            }
        }
        seam[height - 1] = index;
        for (int i = height - 2; i >= 0; i--) {
            index = edgeTo[index][i + 1];
            seam[i] = index;
        }

        return seam;
    }

    // remove horizontal seam from current picture
    public void removeHorizontalSeam(int[] seam) {
        transform();
        removeVerticalSeam(seam);
        transform();
    }

    private void check(int[] seam) {
        if (width <= 1 || seam == null || seam.length != height) {
            throw new IllegalArgumentException();
        }
        for (int i = 0; i < height; i++) {
            if (seam[i] < 0 || seam[i] > width - 1) {
                throw new IllegalArgumentException();
            }
            if (i > 0 && Math.abs(seam[i - 1] - seam[i]) > 1) {
                throw new IllegalArgumentException();
            }
        }
    }

    // remove vertical seam from current picture
    public void removeVerticalSeam(int[] seam) {
        check(seam);
        int min = Integer.MAX_VALUE;
        int max = 0;
        for (int i = 0; i < height; i++) {
            if (seam[i] > max) max = seam[i];
            if (seam[i] < min) min = seam[i];
            //这个地方可以直接该位置上将每一个位置的元素进行变化
            for (int j = seam[i]; j < width - 1; j++) {
                picture[j][i] = picture[j + 1][i];
            }
        }

        width = width - 1;
        if (min > 0) min--;
        if (max > width - 1) max = width - 1;

        for (int j = 0; j < height; j++) {
            for (int i = min; i <= max; i++) {
                calculatenergy(i, j);
            }
            for (int i = max + 1; i < width - 1; i++) {
                energy[i][j] = energy[i + 1][j];
            }
        }
    }
}
```

不过这里需要自己重温一下 上一周的作业 就是图的api这些部分，有的只是会用c++跑，用Java总是感觉有点力不从心，希望后面尽快熟悉起来。
