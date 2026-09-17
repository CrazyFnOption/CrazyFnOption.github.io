---
title: "effective java item 4"
date: 2019-03-16
slug: "effective-java-item-4"
categories: ["java"]
tags: ["effective-java"]
---

### Item 4: Enforce noninstantiability with a private constructor

强迫不能实例化的类，拥有一个私有的构造函数。

> Occasionally you’ll want to write a class that is just a grouping of static methods and static fields. Such classes have acquired a bad reputation because some people abuse them to avoid thinking in terms of objects, but they do have valid uses.

也许有的时候，你需要写一个类，拥有一些静态的变量与函数，而当有人给这些类实例化的时候，这些类往往就具有一些不太好的口碑。因为这些类并不是当成对象，仅仅只是当成一个工具。

> (As of Java 8, you can also put such methods in the interface, assuming it’s yours to modify.) Lastly, such classes can be used to group methods on a final class, since you can’t put them in a subclass

在java8的时候你可以把一些函数直接放在接口里面，而最近一些类可以帮用做是一系列的函数群，不过你不能将他们放到可以继承的子类里面去。

> Such utility classes were not designed to be instantiated: an instance would be nonsensical. In the absence of explicit constructors, however, the compiler pro- vides a public, parameterless default constructor. To a user, this constructor is indistinguishable from any other.

而一些功能类型的类不是被设计成可实例化的，是因为实例化往往没有意思，而这个时候编译器会自动的提供公开且没有参数的构造函数，对于客户及其使用者而言，必须使这类构造函数隐藏起来。

> Attempting to enforce noninstantiability by making a class abstract does not work. The class can be subclassed and the subclass instantiated.

然后仅仅只是强迫这些类变成抽象类是完全达不到效果的，因为这些类还会被继承，而继承其的子类往往还会被实例化。

> A default construc- tor is generated only if a class contains no explicit constructors, so a class can be made noninstantiable by including a private constructor:

然后最后的结果就是只能给类安置一个私有的构造函数才能避免以上问题。

就像如下代码：  
1  
2  
3  
4  
5  
6  
7  
8  
// Noninstantiable utility class   
public class UtilityClass {   
    // Suppress default constructor for noninstantiability   
    private UtilityClass() {   
        throw new AssertionError();   
    }   
    ...// Remainder omitted   
}
