---
title: "Machine Learning: Programming Exercise 1: Linear Regression"
date: 2020-01-20
slug: "Machine-Learning-Programming-Exercise-1-Linear-Regression"
categories: ["机器学习"]
tags: ["机器学习", "线性回归"]
---

## 知识梗概

```
这一周首先一开始就直接介绍，机器学习以及深度学习的相关概念，介绍了两个概念 一个是监督学习，另一个就是非监督学习，简要的区分了上述两种基本学习的形式。

以下重点关注了线性回归，分为了两个部分来讲解，首先是一个参数的线性回归方程，另外一个就是多个参数的线性回归方程。
```

## 机器学习的介绍

总的来说，简而言之就是通过数据来预测，识别，分类。 （目前自己所能接触到的地方）

**监督学习**

1. 房价的预测，通过数据来整合出特征量，然后模拟出函数（假设），最后通过给出的特征量来得出房价
2. 癌症肿瘤检测，通过数据来根据肿瘤大小，进行一个分类，然后下次预测检测肿瘤大小判断良性或者恶性。

总结： 监督学习就是每一个数据都会有一个结果量（标签量）来和其他数据进行区分，比如房价的特征量最终的结果是房价的多少，肿瘤的大小决定了是否为良性。 需要一个结果标签量

**非监督学习**

人群分类，天文数据分析，市场比重分析

这一类的数据不需要结果标签量来区分彼此，每一个其他量没有其他的分别。主要用于没有区分的数据，进行相互组合及分类。

## 线性回归

线性回归属于监督学习。

### 线性回归一个参数

具体的步骤就是  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/1.png)

所以接下来的步骤就是要得出这个假设函数。

所以接下来引出了**cost function （代价函数）**

![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/2.png)

现在已经得出了代价函数，接下来就是需要通过使代价函数最小来模拟出假设函数。

**Gradient descent（梯度下降）**

就像下图一样可以直接得出  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/3.png)

梯度下降的算法如下图所示  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/4.png)

注意注意 梯度下降算法 必须要同时进行，如果没有同时进行，那么不算数。

并且在$\alpha$的选择上，一定要适合，不然的话就会造成以下的后果，不过一般这种情况题目会提前给予相应的情况。

![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/5.png)

最终将上述两者结合起来

梯度下降算法如下  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/6.png)

以上就被称为：“Batch” Gradient Descent。（后面的章节会着重讲到）

### 线性回归多个参数

由于之前 只有一个参数就能够模拟出相应的假设，但是现在有更复杂的徒刑，需要更多的参数

就想着样子：  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/7.png)

所以更改下来 新的梯度下降算法，便成为了这个：  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/8.png)

### 参数缩放以及归一化

由于多个参数之后，有的特征量与其他的特征量相比，过于大了，所以现在需要采用的是 参数缩放将参数除以其的范围，限制在0到1之间。

**归一化**  
![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/10.png)

减去平均值 然后再除上最大范围

**正确的选择\alpha的值**

选择参数的时候可以灵活一点 就想这样

![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/11.png)

**Normal Equation**

第二种计算线性回归的方法

![](/2020/01/20/Machine-Learning-Programming-Exercise-1-Linear-Regression/12.png)

## 作业要求

```
作业就是要求使用matlab 运用线性代数的知识，来模拟线性回归，已经上传到github上面，这里就不再重复叙述了。后面有时间，使用pytorch来重新练习一遍。  
```

·
