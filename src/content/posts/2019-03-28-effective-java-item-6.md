---
title: "effective java item 6"
date: 2019-03-28
slug: "effective-java-item-6"
categories: ["java"]
tags: ["算法", "java", "effective-java"]
---

## Item 6: Avoid creating unnecessary objects

> It is often appropriate to reuse a single object instead of creating a new function- ally equivalent object each time it is needed. Reuse can be both faster and more stylish. An object can always be reused if it is immutable

去反复的使用一个单一的对象，而不是再次创建一个新对象再需要的时候这样的做法是非常合适的。重复使用可以同时很快有符合现代规则。然后一个对象可以被总是反复使用如果其是不变的话。

下面有一个基本简单的例子

```java
String s = new String("bikini");  // DON'T DO THIS!
String s = "bikini";
```

前者是不可以采取的，因为其新建了两个对象，并且第二个新建的对象直接赋值给第一个新建的对象，而后者可取的地方就在于其直接赋值给了第一个对象，不存在创建一个新的对象。

> You can often avoid creating unnecessary objects by using static factory meth- ods (Item 1) in preference to constructors on immutable classes that provide both.

你可以经常通过用静态的工厂方法禁止创建一个不必要的对象而不是使用不会改变的类或者是一个构造器。

> For example, the factory method Boolean.valueOf(String) is preferable to the constructor Boolean(String), which was deprecated in Java 9. The constructor must create a new object each time it’s called, while the factory method is never required to do so and won’t in practice.

这里举个例子，工厂方法就像上面提供的相比于其的构造函数而言，不需要再每次调用的时候构建一个新的对象，而且如果反复利用的是一个不变的对象的话，你可以保证的是，找个对象永远都不会改变。

> Unfortunately, it’s not always obvious when you’re creating such an object. Suppose you want to write a method to determine whether a string is a valid Roman numeral. Here’s the easiest way to do this using a regular expression

不幸的是，当你创建一个这样的对象的时候不总是那么的明显，假设你想要写一个方法去判断一个字符串是否是罗马数字，下面有一个简单的办法来进行判断：  
1  
2  
3  
4  
// Performance can be greatly improved!   
static boolean isRomanNumeral(String s) {   
    return s.matches("^(?=.)M*(C[MD]|D?C{0,3})" + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$");   
}

> While String.matches is the easiest way to check if a string matches a regular expression, it’s not suitable for repeated use in performance-critical situations.

这通常是一个最简单的方法去判断是否一个字符串去包含常规的语法操作，然而其并不适合多次使用即多次调用的场景下面。

> The problem is that it internally creates a Pattern instance for the regular expression and uses it only once, after which it becomes eligible for garbage collection. Creating a Pattern instance is expensive because it requires compiling the regular expression into a finite state machine.

而这个的问题就在于其创建了一个Pattern的实例给相应的正则表达式，而且仅仅只是使用了一次，然后就直接被java垃圾回收器给回收了，而创建一个Pattern的实例的代价是非常昂贵的，因为其需要compiling这个正则表达式到相应的机器里面去。

```java
// Reusing expensive object for improved performance 
public class RomanNumerals { 
    private static final Pattern ROMAN = Pattern.compile( "^(?=.)M*(C[MD]|D?C{0,3})" + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$"); 
    static boolean isRomanNumeral(String s) { 
        return ROMAN.matcher(s).matches(); 
    } 
}
```

> If the class containing the improved version of the isRomanNumeral method is initialized but the method is never invoked, the field ROMAN will be initialized needlessly. It would be possible to eliminate the initialization by lazily initializing the field (Item 83) the first time the isRomanNumeral method is invoked, but this is not recommended. As is often the case with lazy initialization, it would compli- cate the implementation with no measurable performance improvement (Item 67).

还有一种优化的方案就在于，如果上面这个类永远都没有被调用的话，那么上面直接设置成静态的成员变量就会出现构造对象的浪费，意思就是如果没有被调用就会有浪费，于是有一种方法就是按照之前的单实例化类那样，在构造函数里面加上，如果被调用了，那么就会创建一个final的对象。

> Another way to create unnecessary objects is autoboxing, which allows the programmer to mix primitive and boxed primitive types, boxing and unboxing automatically as needed. Autoboxing blurs but does not erase the distinction between primitive and boxed primitive types.

还存在一种方式去创建一些不必要的对象，就是自动打包行为，就是将原生的类型，自动打包成了封装类型，这样也会造成许多不需要的对象，有些对象仅仅只是使用了一次。就像下面这个例子：  
1  
2  
3  
4  
5  
6  
7  
// Hideously slow! Can you spot the object creation?   
private static long sum() {   
    Long sum = 0L;   
    for (long i = 0; i <= Integer.MAX_VALUE; i++)   
        sum += i;   
    return sum;   
}

上面的这个例子就是在加法的时候使long的类型自动包装成一个Long类型，这样则造成了很多不必要的开销。

> The present item says, “Don’t create a new object when you should reuse an existing one,”while Item 50 says, “Don’t reuse an existing object when you should create a new one.” Note that the penalty for reusing an object when defensive copying is called for is far greater than the penalty for needlessly creating a duplicate object. Failing to make defensive copies where required can lead to insidious bugs and security holes; creating objects unnecessarily merely affects style and performance.

总而言之，当你可以并且应该重复利用一个已经存在的一个对象的时候，不要重复创建一个新的对象，而第五十条提醒的是 当你需要一个新的对象的时候不要去重复引用一个存在的旧对象。记住一些保护性质copy实际上是并不可取的，这个在后面会涉及到，其实这里与C++里面的知识有点吻合，关于左值引用与右值引用的知识。
