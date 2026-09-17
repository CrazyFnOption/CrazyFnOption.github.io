---
title: "effective java item 1"
date: 2019-03-13
slug: "effective-java-item-1"
categories: ["java"]
tags: ["java", "effective-java"]
---

## Item 1: Consider static factory methods instead of constructors

前面几个条款的内容是关于创建和销毁对象。

> The traditional way for a class to allow a client to obtain an instance is to provide a public constructor. There is another technique that should be a part of every programmer’s toolkit. A class can provide a public static factory method, which is simply a static method that returns an instance of the class. Here’s a simple example from Boolean (the boxed primitive class for boolean). This method translates a boolean primitive value into a Boolean object reference:

考虑直接用一个静态的方法来完成构造函数的功能，比如接受一个对象，然后通过这个对象来构造一个新的对象。

> A class can provide its clients with static factory methods instead of, or in addition to, public constructors. Providing a static factory method instead of a public constructor has both advantages and disadvantages.

提供一个静态方法作为构造函数的有额外相对于提供公开构造函数的好处以及坏处。

---

> One advantage of static factory methods is that, unlike constructors, they have names. If the parameters to a constructor do not, in and of themselves, describe the object being returned, a static factory with a well-chosen name is easier to use and the resulting client code easier to read.

第一个好处是静态的函数有独特的名字而构造函数没有名字，通过名字将构造函数的参数进行一个分类显示的更加耐用。

> the constructor BigInteger(int, int, Random), which returns a BigInteger that is probably prime, would have been better expressed as a static factory method named BigInteger.probablePrime.

就像大整数类在里面就有一个构造一个趋近于自己值的质数的大整数类，然后这里直接用名字命名显得更加方便。

> Because they have names, static factory methods don’t share the restriction discussed in the previous paragraph. In cases where a class seems to require multiple constructors with the same signature, replace the constructors with static factory methods and carefully chosen names to highlight their differences.

有的时候一些公开构造函数的参数类型，以及参数的顺序，代表着不同的构造函数，这样会容易弄混淆，于是这也是体现名字第二个好的地方。

---

> A second advantage of static factory methods is that, unlike constructors, they are not required to create a new object each time they’re invoked.

第二个好处就是相比于构造函数每次在被call的时候，会构造一个新的对象，而静态方法有的时候则会节省下这一笔开销。就像之前举了一个例子，Boolean.valueOf 从来没有构造一个新的对象。

> . Instance control allows a class to guarantee that it is a singleton (Item 3) or noninstantiable (Item 4). Also, it allows an immutable value class (Item 17) to make the guarantee that no two equal instances exist: a.equals(b) if and only if a == b. This is the basis of the Flyweight pattern . Enum types (Item 34) provide this guarantee.

这种实例化重复使用一个对象，得到的两个好处，第一个好处就是保证其是一个singleton,另一个好处，就是保证在调用equal函数的时候只能允许相等的条件只会有一个，那么就可以直接使用==号进行操作，从而进行性能上面的提升。

---

> A third advantage of static factory methods is that, unlike constructors, they can return an object of any subtype of their return type. This gives you great flexibility in choosing the class of the returned object.

而其的第三点好处就体现在其的返回值可以为任意该类型的子类型对象，这样在类型的返回的时候会提供很大的灵活性。

> One application of this flexibility is that an API can return objects without making their classes public. Hiding implementation classes in this fashion leads to a very compact API.

而其中的第一点应用就在于返回API接口的时候可以不需要将这个类弄成公开的，隐藏其的实现。

> For example, the Java Collections Framework has forty-five utility implementations of its interfaces, providing unmodifiable collections, synchronized collections, and the like. Nearly all of these implemen- tations are exported via static factory methods in one noninstantiable class (java.util.Collections). The classes of the returned objects are all nonpublic.

java在实现其的接口的时候，在接口里面采用静态的方法，导出的类往往都是没有公有化的，这样实现了 类的实现过程的隐藏。

> one for each convenience implemen- tation. It is not just the bulk of the API that is reduced but the conceptual weight: the number and difficulty of the concepts that programmers must master in order to use the API. The programmer knows that the returned object has precisely the API specified by its interface, so there is no need to read additional class docu- mentation for the implementation class. Furthermore, using such a static factory method requires the client to refer to the returned object by interface rather than implementation class, which is generally good practice (Item 64).

开发者在接口的使用过程中，通过其的返回类型可以逐渐了解到其API的真实用途，这样来就不需要阅读额外的开发者文档。

> As of Java 8, the restriction that interfaces cannot contain static methods was eliminated, so there is typically little reason to provide a noninstantiable compan- ion class for an interface. Many public static members that would have been at home in such a class should instead be put in the interface itself. Note, however, that it may still be necessary to put the bulk of the implementation code behind these static methods in a separate package-private class. This is because Java 8 requires all static members of an interface to be public. Java 9 allows private static methods, but static fields and static member classes are still required to be public.

java8的时候就同样将 接口里面不能放静态类型的函数规定给消除了，所以这个时候就没有理由去提供一个不可实例化的类给一个接口了，而许多静态成员应该被放在这样一个接口本身里，记住，现在还是最重要的是将实现的代码放在这些静态实现方法之后。这是因为java8 所有的静态成员都必须公开，而java9 则允许私有的静态函数，其他则是公开的。

---

> A fourth advantage of static factories is that the class of the returned object can vary from call to call as a function of the input parameters. Any sub- type of the declared return type is permissible. The class of the returned object can also vary from release to release.

第四个好处就在于返回的子类型中可以根据参数的形式来进行改变 一一对应的关系，这里举出了一个enumset的例子 （我看的不是很懂 所以这里标红，以后有时间再次来了解一下。）

---

> A fifth advantage of static factories is that the class of the returned object need not exist when the class containing the method is written. Such flexible static factory methods form the basis of service provider frameworks, like the Java Database Connectivity API (JDBC). A service provider framework is a system in which providers implement a service, and the system makes the implementations available to clients, decoupling the clients from the implementations.

第五个好处就是当类中包含的函数已经被写了，然后这返回对象不需要存在，（这一点也没有看懂，等以后拜读了中文版再来解释，手动标红）

---

> The main limitation of providing only static factory methods is that classes without public or protected constructors cannot be subclassed. For example, it is impossible to subclass any of the convenience implementation classes in the Collections Framework. Arguably this can be a blessing in disguise because it encourages programmers to use composition instead of inheritance (Item 18), and is required for immutable types (Item 17).

其实这个地方最大的一个局限的地方就在于，如果一个类没有公开或者保护的构造函数的话 那么这个类是不允许被继承的，意思就是对于被静态函数得来的类，因为不具有公开的构造函数 所以不能够被子类化。

> A second shortcoming of static factory methods is that they are hard for programmers to find. They do not stand out in API documentation in the way that constructors do, so it can be difficult to figure out how to instantiate a class that provides static factory methods instead of constructors.

第二个缺点就在于可能开发者会很不容易找到这些静态方法，而且他们不会像平常构造函数一样，所以很难理解实例化一个类提供的静态函数而不是此构造函数。

不过有一些静态函数的样例 类似的模板 可以自己在书中去查找。

> In summary, static factory methods and public constructors both have their uses, and it pays to understand their relative merits. Often static factories are preferable, so avoid the reflex to provide public constructors without first consid- ering static factories.

总之 两种构造函数都有相应的好处与坏处，具体样例具体分析。
