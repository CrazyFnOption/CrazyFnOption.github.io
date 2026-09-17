---
title: "effective java item 3"
date: 2019-03-15
slug: "effective-java-item-3"
categories: ["java"]
tags: ["java", "effective-java"]
---

### Item 3: Enforce the singleton property with a private constructor or an enum type

> A singleton is simply a class that is instantiated exactly once [Gamma95]. Single- tons typically represent either a stateless object such as a function (Item 24) or a system component that is intrinsically unique.

首先先解释一下 singleton 这个是表示一个类只会被实例化一次的类，一般用于一些函数类型的功能，以及某些一同的独一无二的重要组成成分。

> There are two common ways to implement singletons. Both are based on keeping the constructor private and exporting a public static member to provide access to the sole instance. In one approach, the member is a final field

现在有两种办法去实现这种单实例的情况，基于保证其的构造函数私有化，和输出公开静态成员来保护唯一的实例，一般这个实例都是final的变量。

```java
// Singleton with public final field 
public class Elvis { 
    public static final Elvis INSTANCE = new Elvis(); 
    private Elvis() { ... } 
    public void leaveTheBuilding() { ... } 
}
```

以上的例子就是在静态加载的过程中就直接调用这个实例类的函数，外部无法直接去构造这个类，所以也就直接造成这个类只能够被访问一次。

> In the second approach to implementing singletons, the public member is a static factory method

第二种方法获得这种单实例化的类，直接使用一个get类型的函数，也可以使用一种你那个懒惰标记的方法，直到调用的时候才开始实例化这个类。

> One advantage of the static factory approach is that it gives you the flexibility to change your mind about whether the class is a singleton without changing its API. The factory method returns the sole instance, but it could be modified to return, say, a separate instance for each thread that invokes it.

第一个函数就是给你灵活性去改变这个类是否是单实例化，其的静态工厂方法是返回这个类的唯一实例，但是其很容易被修改，比如说为每一次调用该方法的线程返回一个唯一的实例。

> A second advantage is that you can write a generic singleton factory if your application requires it (Item 30). A final advantage of using a static factory is that a method reference can be used as a supplier, for example Elvis::instance is a Supplier. Unless one of these advantages is relevant, the public field approach is preferable

第二个好事就是你可以写一个泛型类型的单实例化类，如果你的应用就此要求的话。就此的方法可以把这个单实例化当成一种提供者。

> To make a singleton class that uses either of these approaches serializable (Chapter 12), it is not sufficient merely to add implements Serializable to its declaration. To maintain the singleton guarantee, declare all instance fields transient and provide a readResolve method (Item 89). Otherwise, each time a serialized instance is deserialized, a new instance will be created, leading, in the case of our example, to spurious Elvis sightings.

为了保证每一次访问到类里面的，去获得一个”只读函数“，这样就防止每一次访问到这个类的时候不会再生成一个新的类，确确实实的保证了类的单一性。

> A third way to implement a singleton is to declare a single-element enum:

第三种方法实现单实例化是生成一个单个元素的枚举类

> This approach is similar to the public field approach, but it is more concise, provides the serialization machinery for free, and provides an ironclad guarantee against multiple instantiation, even in the face of sophisticated serialization or reflection attacks. This approach may feel a bit unnatural, but a single-element enum type is often the best way to implement a singleton.

这种类型的方法就是类似于类的变量方法，但是这个更精细，提供的机器内存消耗几乎就是免费的，并且提供（这里后面的一句话 英文没怎么看懂 自动标红）。 这种方法可能有点不自然，但是这种方法往往是实现这种单实例化最好的方法。

> Note that you can’t use this approach if your singleton must extend a superclass other than Enum (though you can declare an enum to implement interfaces).

记住如果你需要用单实例化类去继承一个类的话，那么就不能使用这种单枚举的方法了。  
其的样例代码如下：  
1  
2  
3  
4  
5  
6  
7  
// Enum singleton - the preferred approach   
public enum Elvis {   
    INSTANCE;   
    public void leaveTheBuilding() {   
        ...   
    }   
}
