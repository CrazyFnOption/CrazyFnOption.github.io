---
title: "effective java item 2"
date: 2019-03-14
slug: "effective-java-item-2"
categories: ["java"]
tags: ["java", "effective-java"]
---

### Item 2: Consider a builder when faced with many constructor parameters

条款二 当面临许多构造参数的时候，建议考虑一下一个构造器(builder)

> What sort of constructors or static factories should you write for such a class? Traditionally, programmers have used the telescoping constructor pattern, in which you provide a constructor with only the required parameters, another with a single optional parameter, a third with two optional parameters, and so on, culmi- nating in a constructor with all the optional parameters.

经常会遇到构造函数中有多个参数，而这些参数，如果按照标准的方法来写的话，会特别的麻烦，于是就采用C++中的委托构造函数，利用其中一个构造函数，为其他所有的构造函数构造，相当于起到了一个构造器的作用(builder)

> Typically this constructor invocation will require many parameters that you don’t want to set, but you’re forced to pass a value for them anyway. In this case, we passed a value of 0 for fat.

很多时候你不想设置那么多的参数，最简单的一个办法是给这个成员直接设置0。

> In short, the telescoping constructor pattern works, but it is hard to write client code when there are many parameters, and harder still to read it. The reader is left wondering what all those values mean and must carefully count parameters to find out. Long sequences of identically typed parameters can cause subtle bugs. If the client accidentally reverses two such parameters, the compiler won’t complain, but the program will misbehave at runtime (Item 51).

简而言之，这种委托构造函数虽然可行，但是客户在写代码的时候很容易写错，就算写对了，也很难读出来，并且也会出现一种情况就是当参数够多的时候，写错了参数的顺序，这样造成的错误，编译器是不会轻易报错的。所以这里就很难被找出来。

> A second alternative when you’re faced with many optional parameters in a constructor is the JavaBeans pattern, in which you call a parameterless construc- tor to create the object and then call setter methods to set each required parameter and each optional parameter of interest

还有第二种办法就是 给每一个私有成员设置一个set函数，一个外围的函数直接可以作用到内部私有成员，并且直接设置其的值。

> Unfortunately, the JavaBeans pattern has serious disadvantages of its own.Because construction is split across multiple calls, a JavaBean may be in an inconsistent state partway through its construction. The class does not have the option of enforcing consistency merely by checking the validity of the constructor parameters. Attempting to use an object when it’s in an inconsistent state may cause failures that are far removed from the code containing the bug and hence difficult to debug.

不幸的是，这种模式的代码写法，将构造过程与赋值过程分开，也就意味着，当构造对象并没有赋值的时候会造成错误，另外，其还会在写一个immutable类的时候花费额外的工作保证线程安全。

> Luckily, there is a third alternative that combines the safety of the telescoping constructor pattern with the readability of the JavaBeans pattern. It is a form of the Builder pattern [Gamma95]. Instead of making the desired object directly, the client calls a constructor (or static factory) with all of the required parameters and gets a builder object. Then the client calls setter-like methods on the builder object to set each optional parameter of interest. Finally, the client calls a parameterless build method to generate the object, which is typically immutable.

幸运的是 这里存在第三种构造方式，结合上述两种方法的优点，并且保证了线程安全，也不会有过多的参数的麻烦。按照下述的例子，直接在内的内部构造一个静态的builder的类，用一个其他的类来构造这个类，第一解决了immutable的问题，其次也解决了参数不能特意的问题。

> This client code is easy to write and, more importantly, easy to read. The Builder pattern simulates named optional parameters as found in Python and Scala.
>
> > NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8) .calories(100).sodium(35).carbohydrate(27).build();  
> > Check invariants involving multiple parameters in the constructor invoked by the build method. To ensure these invariants against attack, do the checks on object fields after copying parameters from the builder (Item 50). If a check fails, throw an IllegalArgumentException (Item 72) whose detail message indicates which parameters are invalid (Item 75).

这样的做法会造成代码清晰可读，并且最重要的是，可以在构造器这个类型里面进行一个check函数进行异常检查。

> The Builder pattern is well suited to class hierarchies. Use a parallel hier- archy of builders, each nested in the corresponding class. Abstract classes have abstract builders; concrete classes have concrete builders.

这种构造模式，其实特别有利于类型继承，利用相应的类内的构造器帮助进行构造。  
一般利用像如下形式的构造方法即可：记住这个地方时直接用过build 来返回外部的那个类。

**NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8) .calories(100).sodium(35).carbohydrate(27).build();**

> Here are two concrete subclasses of Pizza, one of which represents a standard New-York-style pizza, the other a calzone.

后面的两种模式属于继承过程中出现的构造，注意构造的这个构造器 一定要满足如下形式。  
最重要的是下面继承处的处理，调用基类的构造器 super(builder);  
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
public class NyPizza extends Pizza {   
    public enum Size { SMALL, MEDIUM, LARGE }   
    private final Size size;   
    public static class Builder extends Pizza.Builder<Builder> {   
        private final Size size;   
        public Builder(Size size) {   
            this.size = Objects.requireNonNull(size);   
            }   
        @Override public NyPizza build() {   
            return new NyPizza(this);   
            }   
        @Override protected Builder self() {   
            return this;   
            }   
        }   
    private NyPizza(Builder builder) { super(builder);   
    size = builder.size;   
    }   
}   
public class Calzone extends Pizza {   
    private final boolean sauceInside;   
    public static class Builder extends Pizza.Builder<Builder> {   
        private boolean sauceInside = false; // Default   
        public Builder sauceInside() {   
            sauceInside = true; return this;   
        }   
        @Override public Calzone build() {   
            return new Calzone(this);   
        }   
        @Override protected Builder self() {   
            return this;   
        }   
    }   
    private Calzone(Builder builder) {   
        super(builder); sauceInside = builder.sauceInside;   
        }   
    }

> This technique, wherein a subclass method is declared to return a subtype of the return type declared in the super- class, is known as covariant return typing. It allows clients to use these builders without the need for casting.

这项技术返回的类都是隶属于该类的，这样做的好处可以允许客户使用这些类而不需要使用转型。

> A single builder can be used repeatedly to build multiple objects. The parameters of the builder can be tweaked between invocations of the build method to vary the objects that are created. A builder can fill in some fields automatically upon object creation, such as a serial number that increases each time an object is created.

由于是静态的类，所以只需要被构造一次，却可以造成多次使用，这里就是其的好处，，而这个构造器可以在这个对象被创建之后自动赋值。，比较方便。

> The Builder pattern has disadvantages as well. In order to create an object, you must first create its builder. While the cost of creating this builder is unlikely to be noticeable in practice, it could be a problem in performance-critical situations. Also, the Builder pattern is more verbose than the telescoping constructor pattern

其存在的坏处就在于，其写出来的代码非常的复杂和冗杂，对于只有一点参数的构造器而言，完全没有这样写的必要，但是对于先开始只有一点参数，但是后面则变成很多参数的工程来说第一次使用这种构造器方便以后来写。

> In summary, the Builder pattern is a good choice when designing classes whose constructors or static factories would have more than a handful of parameters

总而言之，使用这种办法的方便在于大工程，且一个类的构造参数过多的情况，即解决了参数冗杂的问题，又再次解决了类不能final的问题。
