---
title: "Clustering and Dimensionality Reduction"
date: 2020-03-13
slug: "Clustering-and-Dimensionality-Reduction"
categories: ["机器学习"]
tags: ["机器学习", "非监督学习", "维度下降"]
---

## Clustering

终于步入到了，非监督学习，前面所涉及到的课程，全部都是监督学习。

所谓监督学习与非监督学习之间的区别，最简单的区别就是前者有标签值，后者没有标签值。

就像下面两副图片  
![](/2020/03/13/Clustering-and-Dimensionality-Reduction/1.png)

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/2.png)

二者的区别就一目了然

课上，就直接将这群没有标签值的数据 叫做 cluster。 意思是每一个数据都是没有差别，其举的例子，在应用上有 市场分管，社交网络，天文学，还有很多。

但是，每一个数据本身的特征会使有相近特征的人互相靠近，举个例子，社交网络上，你加的好友，大多数是你的亲人，你的现实生活中的朋友，这些都是你现实中的社交网络

那么，如何将给定的数据进行一个有效的分类呢？

这个时候就引出了 K-means算法

通过给出的一大堆数据点，随机选取标签点，然后根据与标签的相对距离，来完成一个近似的分类过程

这里给出三张图片来完成这样一个过程：

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/3.png)

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/4.png)

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/5.png)

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/6.png)

在这个算法里，输入的是 K个族群分布标签，和训练集

下面就是这个算法的全过程了

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/7.png)

翻译成中文的意思

1. 随机选取K个标签数据
2. 然后再去遍历每一个数据，计算与哪一个标签值是最近的，并且将其归类
3. 归类结束之后，计算每一群的均值，并且试图将其最小化

一直重复2，3，一直到mean值最小为止

其的应用就主要体现在了 衣服的选择上

人类去选择衣服，根据身高体重划分衣服为 S，M，L码

### K-mean的优化方式

```python
Randomly initialize K cluster centroids mu(1), mu(2), ..., mu(K)
Repeat:
   for i = 1 to m:
      c(i):= index (from 1 to K) of cluster centroid closest to x(i)
   for k = 1 to K:
      mu(k):= average (mean) of points assigned to cluster k
```

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/8.png)

算法分为两个步骤，第一个for循环是赋值步骤，即：对于每一个样例i，计算其应该属于的类。第二个for循环是聚类中心的移动，即：对于每一个类 K重新计算该类的质心。  
在K-means算法中的变量在上面已经被标明。

回顾刚才给出的，k-mean均值迭代算法，我们知道，第一个循环是用于减小 ${c}^{(i)}$ 引起的代价，而第二个循环则是用于减小  引起代价。迭代的过程一定会减小代价函数，要不然就是出现了错误。

### 随机初始化

在运行K-均值算法的之前，我们首先要随机初始化所有的聚类中心点，下面介绍怎样做：

- 我们应该选择 K < m，即聚类中心点的个数要小于所有训练集实例的数量
- 随机选择 K 个训练实例。
- 令 K 个聚类中心分别与这 K个训练实例相等

K-均值的一个问题在于它有可能会停留在**一个局部最小值处**，而这取决于初始化的情况。为了解决这个问题，我们通常需要多次运行K-均值算法，每一次都重新进行随机初始化，最后再比较多次运行K-均值的结果，选择代价函数最小的结果。这种方法在K较小的时候（2—10）还是可行的，但是K如果较大，这么做也可能不会有明显地改善。

```python
for i = 1 to 100:
   randomly initialize k-means
   run k-means to get 'c' and 'm'
   compute the cost function (distortion) J(c,m)
pick the clustering that gave us the lowest cost
```

### 选择聚类数

K的选择往往是任意的或者说是模糊不清的，通常是需要根据不同的问题人工进行选择的。选择的时候我们需要思考运用K-均值算法聚类的动机是什么，然后选择能最好服务于该目的标聚类数。

一般都是什么问题，就需要去怎么考虑的选择聚类数

当人们在讨论，选择聚类数目的方法时，有一个可能会谈及的方法叫作“肘部法则”。将代价J和聚类K画在图中。代价函数会随着K的增加而降低然后趋于平缓，我们要做的就是找到J开始趋于平缓时的K。然而很多时候，曲线经常是很平缓的，这时的肘部就很不明显。（note：J一般都是随着K的增加而降低，但如果K出现了错误的局部最优则会导致不一样的结果）。

这个地方需要去注意的是： 等到cost函数值稳定了之后再记入相关的函数中：

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/9.png)

## Dimensionality Reduction

### 使用降维的动机

有几个不同的的原因使你可能想要做降维。一是数据压缩，如果我们有大量多余的数据时，我们可能想降低特征的维度，为此可以找到两个高度相关的特征，将其画出图像然后做一条直线来同时描述这两个特征。二是数据可视化，因为数据超过三维就很难可视化了，因此有时候需要将维度下降到3或者以下来达到可视化的目的。

### 主成分分析问题

主成分分析(PCA)是最常见的降维算法。其定义是想把数据从n维降到k维（k小于n），就在这个空间里面找k个单位向量来表示数据，使得数据点投影到这个面上的误差最小。如下例子：2到1和3到2：

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/10.png)

在二维变成一维的时候

虽然同是一条直线拟合，但PCA和线性回归是不同的：

- 计算loss的方式有所不同
- PCA没有标签Y（非监督）

### PCA算法

PCA 减少 n 维到 k 维：

1. 均值归一化。我们需要计算出所有特征的均值，然后令x_j=x_j-μ_j。如果特征是在不同的数量级上，我们还需要将其除以标准差$σ^2$。
2. 计算协方差矩阵（covariance matrix）$Σ ：\sum=\frac {1}{m}\sum^{n}_{i=1}\left( x^{(i)}\right) \left( x^{(i)}\right) ^{T}$
3. 计算协方差矩阵Σ的特征向量（eigenvectors）  
在 Octave 里我们可以利用奇异值分解（singular value decomposition）来求解，[U, S, V]= svd(sigma)。  
$\Sigma=\frac {1}{m}\sum^{n}_{i=1}\left( x^{(i)}\right) \left( x^{(i)}\right) ^{T}$

对于一个 n×n 维度的矩阵，上式中的 U 是一个具有与数据之间最小投射误差的方向向量构成的矩阵。如果我们希望将数据从 n 维降至 k 维，我们只需要从U中选取前k个向量，获得一个n×k维度的矩阵，我们$U_{reduce}$用表示，然后通过如下计算获得要求的新特征向量

$z^{(i)}=U^{T}_{reduce}*x^{(i)}$

其中x是n×1维的，因此结果为 k×1 维度。我们不对方差特征进行处理。

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/11.png)

### 选择主成分的数量

在PCA算法中我们把n维特征变量降维到k维特征变量。这个数字k也被称作主成分的数量或者说是我们保留的主成分的数量。我们先来思考两个值：

- PCA所做的是尽量最小化平均平方映射误差(Average Squared Projection Error)。
- 我还要定义一下数据的总变差(Total Variation)。它的意思是 “平均来看我的训练样本距离零向量多远？

我们把两个数的比值作为衡量PCA算法的有效性

定义一个阈值然后实验k，看看那个最小的k合适。计算步骤如

![](/2020/03/13/Clustering-and-Dimensionality-Reduction/12.png)

这里有个技巧：svd函数会返回一个对角矩阵S，他的元素可以很快的计算这个阈值。

### 主成分分析法的应用建议

PCA算法主要有以下用途：

- 压缩：
  - 减少内存和磁盘的占用
  - 提升算法的速度
- 可视化：
  - 降维到二维或者三维

有些人觉的PCA也可以用来防止过拟合，但是这是不对的。**应该用正则化**。正则化使用y标签最小化损失函数，使用了y标签信息。而PCA只单纯的看x的分部就删除了一些特征，损失率很多信息。另一个常见的错误是，默认地将主要成分分析作为学习过程中的一部分，这虽然很多时候有效果，最好还是从所有原始特征开始，只在有必要的时候（**算法运行太慢或者占用太多内存**）才考虑采用主要成分分析。
