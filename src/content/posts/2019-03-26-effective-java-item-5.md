---
title: "effective java item 5"
date: 2019-03-26
slug: "effective-java-item-5"
categories: ["java"]
tags: ["算法", "java", "effective-java"]
---

### Item 5: Prefer dependency injection to hardwiring resources

> Many classes depend on one or more underlying resources. For example, a spell checker depends on a dictionary. It is not uncommon to see such classes imple- mented as static utility classes (Item 4):

有一些类依赖一些潜在的资源，就像一个字符串检查器 依靠字典，所以也就不是很特殊见到一些类被翻译成静态的工具类。

> Similarly, it’s not uncommon to see them implemented as singletons (Item 3):

就像一些类直接被翻译成单一实例类。

```java
// Inappropriate use of singleton - inflexible & untestable! 
public class SpellChecker { 
    private final Lexicon dictionary = ...; 
    private SpellChecker(...) {} 
    public static INSTANCE = new SpellChecker(...); 
    public boolean isValid(String word) { ... } 
    public List<String> suggestions(String typo) { ... } 
}
```

> Static utility classes and singletons are inappropriate for classes whose behavior is parameterized by an underlying resource.

静态的工具类和单一实体类，会在存在多种参数替换给基础资源，（就像上面的检查器有多种版本的字典资源一样），那么这些类就会变得特别不合适。

> A simple pattern that satisfies this requirement is to pass the resource into the constructor when creating a new instance. This is one form of dependency injection: the dictionary is a dependency of the spell checker and is injected into the spell checker when it is created.

只有一种办法就是在构建的时候 构建函数里面直接给予相应的构造器，这样既维护了单实例化，又解决了上面多版本的问题。

```java
// Dependency injection provides flexibility and testability 
public class SpellChecker { 
    private final Lexicon dictionary; 
    public SpellChecker(Lexicon dictionary) { 
        this.dictionary = Objects.requireNonNull(dictionary);
    } 
    public boolean isValid(String word) { ... } 
    public List<String> suggestions(String typo) { ... } 
}
```

> In summary, do not use a singleton or static utility class to implement a class that depends on one or more underlying resources whose behavior affects that of the class, and do not have the class create these resources directly. Instead, pass the resources, or factories to create them, into the constructor (or static factory or builder). This practice, known as dependency injection, will greatly enhance the flexibility, reusability, and testability of a class.

总而言之，不要在实现一个静态工具类或者一个单实例类的时候的同时去实现一个多个资源替换的类，这样会影响其他的类，并且违背了这个类最先开始的本意，好的解决办法就是在类的构造函数里面加上该资源或者带上该工厂方法。

另外对于上面一个函数进行讲解  
Objects.requireNonNull;  
其的代码形式如下：

```java
public static <T> T requireNonNull(T obj) {
    if (obj == null)
        throw new NullPointerException();
   return obj;
}
```
