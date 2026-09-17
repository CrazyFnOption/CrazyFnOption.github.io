---
title: "Kaggle Titanic 生存预测"
date: 2020-03-11
slug: "Kaggle-Titanic-生存预测"
categories: ["机器学习"]
tags: ["机器学习", "Kaggle"]
---

这是一篇入门的kaggle的初级案例。

本来自己第一遍去做的时候，发现预测的正确率只能够达到77%，经过了无数次调参，最后也只能到达79%，于是自己决定花点时间按照流程写一遍，并且记录下来

题目比较具有趣味性。给你两个数据集合，其中一个有标签值，另外一个没有标签值，然后给出了姓名，性别，船费，年龄，以及船仓位相关的数据

然后预测这个人是否能够存活

按照相关的步骤来：

### 分析题目

首先这道题就是一个让你预测test数据组里面的人能否存活，其实就是一个二分类问题，如果存活最后的结果输出1，如果没有存活，那么最后的结果输出0

确认这是一个二分类问题，接下来就可以去整理数据了

### 数据总览

Titanic 生存模型预测，其中包含了两组数据：train.csv 和 test.csv，分别为训练集合和测试集合。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 下面这函数就是在jupyter notbook里面，
# 可以不必写show函数，可以直接显示出来
%matplotlib inline
```

运用pandas里面的函数，去进行观测数据，并且开始着手数据的处理

```python
train_data = pd.read_csv('data/train.csv')
test_data = pd.read_csv('data/test.csv')

sns.set_style('whitegrid')
train_data.head()
```

![](/2020/03/11/Kaggle-Titanic-生存预测/1.jpg)

```python
train_data.info()
print("-" * 40)
test_data.info()
```

```python
<class 'pandas.core.frame.DataFrame'>
    RangeIndex: 891 entries, 0 to 890
    Data columns (total 12 columns):
    PassengerId    891 non-null int64
    Survived       891 non-null int64
    Pclass         891 non-null int64
    Name           891 non-null object
    Sex            891 non-null object
    Age            714 non-null float64
    SibSp          891 non-null int64
    Parch          891 non-null int64
    Ticket         891 non-null object
    Fare           891 non-null float64
    Cabin          204 non-null object
    Embarked       889 non-null object
    dtypes: float64(2), int64(5), object(5)
    memory usage: 83.6+ KB
    ----------------------------------------
    <class 'pandas.core.frame.DataFrame'>
    RangeIndex: 418 entries, 0 to 417
    Data columns (total 11 columns):
    PassengerId    418 non-null int64
    Pclass         418 non-null int64
    Name           418 non-null object
    Sex            418 non-null object
    Age            332 non-null float64
    SibSp          418 non-null int64
    Parch          418 non-null int64
    Ticket         418 non-null object
    Fare           417 non-null float64
    Cabin          91 non-null object
    Embarked       418 non-null object
    dtypes: float64(2), int64(4), object(5)
    memory usage: 36.0+ KB
```

从上面我们可以看出，Age、Cabin、Embarked、Fare几个特征存在缺失值。

绘制存活的比例：

下面先来一个可视化：  
1  
train_data['Survived'].value_counts().plot.pie(autopct = '%1.2f%%')

![](/2020/03/11/Kaggle-Titanic-生存预测/2.jpg)

由上面这张图，我们可以得知 活下来的人与没有活下来的人总体比例，就开始对数据有一个整体的认知

### 数据处理

接下来，我们就要开始准备数据的处理，一般数据存在的问题，要么就是离群点问题，要么就是缺失值问题，要么就是数据变换的问题。

#### 数值变换

**变量转换的目的是将数据转换为适用于模型使用的数据，不同模型接受不同类型的数据，Scikit-learn要求数据都是数字型numeric，所以我们要将一些非数字型的原始数据转换为数字型numeric。**

所有的数据可以分为两类：

1. 定性(Quantitative)变量可以以某种方式排序，Age就是一个很好的列子。
2. 定量(Qualitative)变量描述了物体的某一（不能被数学表示的）方面，Embarked就是一个例子。

针对上面不可以被数学数字表示的数据，下面采取：

##### Dummy Variables

就是类别变量或者二元变量，当qualitative variable是一些频繁出现的几个独立变量时，Dummy Variables比较适合使用。我们以Embarked为例，Embarked只包含三个值’S’,’C’,’Q’，我们可以使用下面的代码将其转换为dummies:

```python
embark_dummies  = pd.get_dummies(train_data['Embarked'])
train_data = train_data.join(embark_dummies)
train_data.drop(['Embarked'], axis=1,inplace=True)

embark_dummies = train_data[['S', 'C', 'Q']]
embark_dummies.head()
```

![](/2020/03/11/Kaggle-Titanic-生存预测/3.jpg)

其实上面的这种方法有点特别像RNN中词向量。给每一个词加上相应的特征，应用one-hot编码形式

##### Factorizing

dummy不好处理Cabin（船舱号）这种标称属性，因为他出现的变量比较多。所以Pandas有一个方法叫做factorize()，它可以创建一些数字，来表示类别变量，对每一个类别映射一个ID，这种映射最后只生成一个特征，不像dummy那样生成多个特征。

```python
# Replace missing values with "U0"
train_data['Cabin'][train_data.Cabin.isnull()] = 'U0'
# create feature for the alphabetical part of the cabin number
train_data['CabinLetter'] = train_data['Cabin'].map( lambda x : re.compile("([a-zA-Z]+)").search(x).group())
# convert the distinct cabin letters with incremental integer values
train_data['CabinLetter'] = pd.factorize(train_data['CabinLetter'])[0]

train_data['CabinLetter'].head()
```

````python
 0    0
 1    1
 2    0
 3    1
 4    0
 Name: CabinLetter, dtype: int64
``` 

##### Scaling
Scaling可以将一个很大范围的数值映射到一个很小的范围(通常是-1 - 1，或则是0 - 1)，很多情况下我们需要将数值做Scaling使其范围大小一样，否则大范围数值特征将会由更高的权重。比如：Age的范围可能只是0-100，而income的范围可能是0-10000000，在某些对数组大小敏感的模型中会影响其结果。

下面对Age进行Scaling：

```python
from sklearn import preprocessing

assert np.size(train_data['Age']) == 891
# StandardScaler will subtract the mean from each value then scale to the unit variance
scaler = preprocessing.StandardScaler()
train_data['Age_scaled'] = scaler.fit_transform(train_data['Age'].values.reshape(-1, 1))
````

```python
train_data['Age_scaled'].head()
```

```python
0   -0.558449
1    0.606773
2   -0.267144
3    0.388293
4    0.388293
Name: Age_scaled, dtype: float64
```

##### Binning

Binning通过观察“邻居”(即周围的值)将连续数据离散化。存储的值被分布到一些“桶”或“箱“”中，就像直方图的bin将数据划分成几块一样。下面的代码对Fare进行Binning。

```python
# Divide all fares into quartiles
train_data['Fare_bin'] = pd.qcut(train_data['Fare'], 5)
train_data['Fare_bin'].head()
```

```python
0      (-0.001, 7.854]
1    (39.688, 512.329]
2        (7.854, 10.5]
3    (39.688, 512.329]
4        (7.854, 10.5]
Name: Fare_bin, dtype: category
Categories (5, interval[float64]): [(-0.001, 7.854] < (7.854, 10.5] < (10.5, 21.679] < (21.679, 39.688] < (39.688, 512.329]]
```

一般这里比较好的使用这个算法的位置是给范围值进行等级的划分，这样以来，然而就会有更好的结果

在将数据Bining化后，要么将数据factorize化，要么dummies化。

```python
# factorize
train_data['Fare_bin_id'] = pd.factorize(train_data['Fare_bin'])[0]

# dummies
fare_bin_dummies_df = pd.get_dummies(train_data['Fare_bin']).rename(columns=lambda x: 'Fare_' + str(x))
train_data = pd.concat([train_data, fare_bin_dummies_df], axis=1)
```

#### 缺失值处理

一些机器学习算法能够处理缺失值，比如神经网络，一些则不能。对于缺失值，一般有以下几种处理方法：

- 如果数据集很多，但有很少的缺失值，可以删掉带缺失值的行；
- 如果该属性相对学习来说不是很重要，可以对缺失值赋均值或者众数。比如在哪儿上船Embarked这一属性（共有三个上船地点），缺失俩值，可以用众数赋值

因为“Embarked”项的缺失值不多，所以这里我们以众数来填充：

```python
combined_train_test['Embarked'].fillna(combined_train_test['Embarked'].mode().iloc[0], inplace=True)
```

对于三种不同的港口，由上面介绍的数值转换，我们知道可以有两种特征处理方式：dummy和facrorizing。因为只有三个港口，所以我们可以直接用dummy来处理：

```python
# 为了后面的特征分析，这里我们将 Embarked 特征进行facrorizing
combined_train_test['Embarked'] = pd.factorize(combined_train_test['Embarked'])[0]

# 使用 pd.get_dummies 获取one-hot 编码
emb_dummies_df = pd.get_dummies(combined_train_test['Embarked'], prefix=combined_train_test[['Embarked']].columns[0])
combined_train_test = pd.concat([combined_train_test, emb_dummies_df], axis=1)
```

因为Age项的缺失值较多，所以不能直接填充age的众数或者平均数。

常见的有两种对年龄的填充方式：一种是根据Title中的称呼，如Mr，Master、Miss等称呼不同类别的人的平均年龄来填充；一种是综合几项如Sex、Title、Pclass等其他没有缺失值的项，使用机器学习算法来预测Age。

这里我们使用后者来处理。以Age为目标值，将Age完整的项作为训练集，将Age缺失的项作为测试集。

```python
missing_age_df = pd.DataFrame(combined_train_test[
 ['Age', 'Embarked', 'Sex', 'Title', 'Name_length', 'Family_Size', 'Family_Size_Category','Fare', 'Fare_bin_id', 'Pclass']])

missing_age_train = missing_age_df[missing_age_df['Age'].notnull()]
missing_age_test = missing_age_df[missing_age_df['Age'].isnull()]

missing_age_test.head()
```

![](/2020/03/11/Kaggle-Titanic-生存预测/4.jpg)

建立Age的预测模型，我们可以多模型预测，然后再做模型的融合，提高预测的精度。

```python
from sklearn import ensemble
from sklearn import model_selection
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.ensemble import RandomForestRegressor

def fill_missing_age(missing_age_train, missing_age_test):
    missing_age_X_train = missing_age_train.drop(['Age'], axis=1)
    missing_age_Y_train = missing_age_train['Age']
    missing_age_X_test = missing_age_test.drop(['Age'], axis=1)

    # model 1  gbm
    gbm_reg = GradientBoostingRegressor(random_state=42)
    gbm_reg_param_grid = {'n_estimators': [2000], 'max_depth': [4], 'learning_rate': [0.01], 'max_features': [3]}
    gbm_reg_grid = model_selection.GridSearchCV(gbm_reg, gbm_reg_param_grid, cv=10, n_jobs=25, verbose=1, scoring='neg_mean_squared_error')
    gbm_reg_grid.fit(missing_age_X_train, missing_age_Y_train)
    print('Age feature Best GB Params:' + str(gbm_reg_grid.best_params_))
    print('Age feature Best GB Score:' + str(gbm_reg_grid.best_score_))
    print('GB Train Error for "Age" Feature Regressor:' + str(gbm_reg_grid.score(missing_age_X_train, missing_age_Y_train)))
    missing_age_test.loc[:, 'Age_GB'] = gbm_reg_grid.predict(missing_age_X_test)
    print(missing_age_test['Age_GB'][:4])
    
    # model 2 rf
    rf_reg = RandomForestRegressor()
    rf_reg_param_grid = {'n_estimators': [200], 'max_depth': [5], 'random_state': [0]}
    rf_reg_grid = model_selection.GridSearchCV(rf_reg, rf_reg_param_grid, cv=10, n_jobs=25, verbose=1, scoring='neg_mean_squared_error')
    rf_reg_grid.fit(missing_age_X_train, missing_age_Y_train)
    print('Age feature Best RF Params:' + str(rf_reg_grid.best_params_))
    print('Age feature Best RF Score:' + str(rf_reg_grid.best_score_))
    print('RF Train Error for "Age" Feature Regressor' + str(rf_reg_grid.score(missing_age_X_train, missing_age_Y_train)))
    missing_age_test.loc[:, 'Age_RF'] = rf_reg_grid.predict(missing_age_X_test)
    print(missing_age_test['Age_RF'][:4])

    # two models merge
    print('shape1', missing_age_test['Age'].shape, missing_age_test[['Age_GB', 'Age_RF']].mode(axis=1).shape)
    # missing_age_test['Age'] = missing_age_test[['Age_GB', 'Age_LR']].mode(axis=1)

    missing_age_test.loc[:, 'Age'] = np.mean([missing_age_test['Age_GB'], missing_age_test['Age_RF']])
    print(missing_age_test['Age'][:4])

    missing_age_test.drop(['Age_GB', 'Age_RF'], axis=1, inplace=True)

    return missing_age_test
```

利用融合模型预测的结果填充Age的缺失值：

其实这个地方需要注意的，上面是将trainset与testset进行一个有效的拼接

```python
combined_train_test.loc[(combined_train_test.Age.isnull()), 'Age'] = fill_missing_age(missing_age_train, missing_age_test)
```

```python
Fitting 10 folds for each of 1 candidates, totalling 10 fits

 [Parallel(n_jobs=25)]: Done   5 out of  10 | elapsed:    3.9s remaining:    3.9s
 [Parallel(n_jobs=25)]: Done  10 out of  10 | elapsed:    6.9s finished

 Age feature Best GB Params:{'n_estimators': 2000, 'learning_rate': 0.01, 'max_features': 3, 'max_depth': 4}
 Age feature Best GB Score:-130.295677599
 GB Train Error for "Age" Feature Regressor:-64.6566961723
 5     35.773942
 17    31.489153
 19    34.113840
 26    28.621281
 Name: Age_GB, dtype: float64
 Fitting 10 folds for each of 1 candidates, totalling 10 fits

 [Parallel(n_jobs=25)]: Done   5 out of  10 | elapsed:    6.2s remaining:    6.2s
 [Parallel(n_jobs=25)]: Done  10 out of  10 | elapsed:   10.7s finished

 Age feature Best RF Params:{'n_estimators': 200, 'random_state': 0, 'max_depth': 5}
 Age feature Best RF Score:-119.094956052
 RF Train Error for "Age" Feature Regressor-96.0603148448
 5     33.459421
 17    33.076798
 19    34.855942
 26    28.146718
 Name: Age_RF, dtype: float64
 shape1 (263,) (263, 2)
 5     30.000675
 17    30.000675
 19    30.000675
 26    30.000675
 Name: Age, dtype: float64
```

最后一项缺失值处理

因为Cabin项的缺失值确实太多了，我们很难对其进行分析，或者预测。所以这里我们可以直接将Cabin这一项特征去除。但通过上面的分析，可以知道，该特征信息的有无也与生存率有一定的关系，所以这里我们暂时保留该特征，并将其分为有和无两类。

```python
combined_train_test.loc[combined_train_test.Cabin.isnull(), 'Cabin'] = 'U0'
combined_train_test['Cabin'] = combined_train_test['Cabin'].apply(lambda x: 0 if x == 'U0' else 1)
```

### 特征处理

上面已经处理了一些数据，现在我需要增强一些特征，以便与后面特征的变化

#### Sex

对Sex也进行one-hot编码，也就是dummy处理：

```python
# 为了后面的特征分析，这里我们也将 Sex 特征进行facrorizing
combined_train_test['Sex'] = pd.factorize(combined_train_test['Sex'])[0]

sex_dummies_df = pd.get_dummies(combined_train_test['Sex'], prefix=combined_train_test[['Sex']].columns[0])
combined_train_test = pd.concat([combined_train_test, sex_dummies_df], axis=1)
```

#### Name

首先先从名字中提取各种称呼：

```python
# what is each person's title? 
combined_train_test['Title'] = combined_train_test['Name'].map(lambda x: re.compile(", (.*?)\.").findall(x)[0])
```

将各式称呼进行统一化处理：  
1  
2  
3  
4  
5  
6  
7  
8  
9  
title_Dict = {}  
title_Dict.update(dict.fromkeys(['Capt', 'Col', 'Major', 'Dr', 'Rev'], 'Officer'))  
title_Dict.update(dict.fromkeys(['Don', 'Sir', 'the Countess', 'Dona', 'Lady'], 'Royalty'))  
title_Dict.update(dict.fromkeys(['Mme', 'Ms', 'Mrs'], 'Mrs'))  
title_Dict.update(dict.fromkeys(['Mlle', 'Miss'], 'Miss'))  
title_Dict.update(dict.fromkeys(['Mr'], 'Mr'))  
title_Dict.update(dict.fromkeys(['Master','Jonkheer'], 'Master'))  
  
combined_train_test['Title'] = combined_train_test['Title'].map(title_Dict)

使用dummy对不同的称呼进行分列：

```python
# 为了后面的特征分析，这里我们也将 Title 特征进行facrorizing
combined_train_test['Title'] = pd.factorize(combined_train_test['Title'])[0]

title_dummies_df = pd.get_dummies(combined_train_test['Title'], prefix=combined_train_test[['Title']].columns[0])
combined_train_test = pd.concat([combined_train_test, title_dummies_df], axis=1)
```

下面开始就不准备贴代码了，可以去GitHub上面去看

#### Fare

由前面分析可以知道，Fare项在测试数据中缺少一个值，所以需要对该值进行填充。

我们按照一二三等舱各自的均价来填充：

下面transform将函数np.mean应用到各个group中

通过对Ticket数据的分析，我们可以看到部分票号数据有重复，同时结合亲属人数及名字的数据，和票价船舱等级对比，我们可以知道购买的票中有家庭票和团体票，所以我们需要将团体票的票价分配到每个人的头上。

使用binning给票价分等级，对于5个等级的票价我们也可以继续使用dummy为票价等级分列。

#### Pclass

这里是神来之笔，我看到别人在这个地方有出奇的特征增强方法：

Pclass这一项，其实已经可以不用继续处理了，我们只需要将其转换为dummy形式即可。

但是为了更好的分析问题，我们这里假设对于不同等级的船舱，各船舱内部的票价也说明了各等级舱的位置，那么也就很有可能与逃生的顺序有关系。所以这里分出每等舱里的高价和低价位。

#### Parch and SibSp

对于这两个参数，大佬们的处理就是 **将这两个特征整合成一个特征，牛逼了大佬**

### 特征间相关性分析

我们挑选一些主要的特征，生成特征之间的关联图，查看特征与特征之间的相关性：  
将上述所有特征去看看相互之间的关系或者与结果之间的关系

```python
Correlation = pd.DataFrame(combined_train_test[
 ['Embarked', 'Sex', 'Title', 'Name_length', 'Family_Size', 'Family_Size_Category','Fare', 'Fare_bin_id', 'Pclass', 
  'Pclass_Fare_Category', 'Age', 'Ticket_Letter', 'Cabin']])
```

```python
colormap = plt.cm.viridis
plt.figure(figsize=(14,12))
plt.title('Pearson Correlation of Features', y=1.05, size=15)
sns.heatmap(Correlation.astype(float).corr(),linewidths=0.1,vmax=1.0, square=True, cmap=colormap, linecolor='white', annot=True)
```

![](/2020/03/11/Kaggle-Titanic-生存预测/5.jpg)

**特征之间的数据分布图**

```python
g = sns.pairplot(combined_train_test[[u'Survived', u'Pclass', u'Sex', u'Age', u'Fare', u'Embarked',
    u'Family_Size', u'Title', u'Ticket_Letter']], hue='Survived', palette = 'seismic',size=1.2,diag_kind = 'kde',diag_kws=dict(shade=True),plot_kws=dict(s=10) )
g.set(xticklabels=[])
```

![](/2020/03/11/Kaggle-Titanic-生存预测/6.jpg)

#### 输入模型前的一些处理

这里我们将Age和fare进行**正则化**：

```python
scale_age_fare = preprocessing.StandardScaler().fit(combined_train_test[['Age','Fare', 'Name_length']])
combined_train_test[['Age','Fare', 'Name_length']] = scale_age_fare.transform(combined_train_test[['Age','Fare', 'Name_length']])
```

丢弃掉一些无用的特征

对于上面的特征工程中，我们从一些原始的特征中提取出了很多要融合到模型中的特征，但是我们需要剔除那些原本的我们用不到的或者非数值特征。

**首先对我们的数据先进行一下备份，以便后期的再次分析：**

```python
combined_data_backup = combined_train_test
combined_train_test.drop(['PassengerId', 'Embarked', 'Sex', 'Name', 'Title', 'Fare_bin_id', 'Pclass_Fare_Category', 
                       'Parch', 'SibSp', 'Family_Size_Category', 'Ticket'],axis=1,inplace=True)
```

将训练数据和测试数据分开：

```python
train_data = combined_train_test[:891]
test_data = combined_train_test[891:]

titanic_train_data_X = train_data.drop(['Survived'],axis=1)
titanic_train_data_Y = train_data['Survived']
titanic_test_data_X = test_data.drop(['Survived'],axis=1)

titanic_train_data_X.shape
```

### 模型融合以及测试

需要按照下面的这些步骤来进行：

#### 利用不同的模型来对特征进行筛选，选出较为重要的特征：

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import AdaBoostClassifier
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier

def get_top_n_features(titanic_train_data_X, titanic_train_data_Y, top_n_features):

    # random forest
    rf_est = RandomForestClassifier(random_state=0)
    rf_param_grid = {'n_estimators': [500], 'min_samples_split': [2, 3], 'max_depth': [20]}
    rf_grid = model_selection.GridSearchCV(rf_est, rf_param_grid, n_jobs=25, cv=10, verbose=1)
    rf_grid.fit(titanic_train_data_X, titanic_train_data_Y)
    print('Top N Features Best RF Params:' + str(rf_grid.best_params_))
    print('Top N Features Best RF Score:' + str(rf_grid.best_score_))
    print('Top N Features RF Train Score:' + str(rf_grid.score(titanic_train_data_X, titanic_train_data_Y)))
    feature_imp_sorted_rf = pd.DataFrame({'feature': list(titanic_train_data_X),
                                          'importance': rf_grid.best_estimator_.feature_importances_}).sort_values('importance', ascending=False)
    features_top_n_rf = feature_imp_sorted_rf.head(top_n_features)['feature']
    print('Sample 10 Features from RF Classifier')
    print(str(features_top_n_rf[:10]))

    # AdaBoost
    ada_est =AdaBoostClassifier(random_state=0)
    ada_param_grid = {'n_estimators': [500], 'learning_rate': [0.01, 0.1]}
    ada_grid = model_selection.GridSearchCV(ada_est, ada_param_grid, n_jobs=25, cv=10, verbose=1)
    ada_grid.fit(titanic_train_data_X, titanic_train_data_Y)
    print('Top N Features Best Ada Params:' + str(ada_grid.best_params_))
    print('Top N Features Best Ada Score:' + str(ada_grid.best_score_))
    print('Top N Features Ada Train Score:' + str(ada_grid.score(titanic_train_data_X, titanic_train_data_Y)))
    feature_imp_sorted_ada = pd.DataFrame({'feature': list(titanic_train_data_X),
                                           'importance': ada_grid.best_estimator_.feature_importances_}).sort_values('importance', ascending=False)
    features_top_n_ada = feature_imp_sorted_ada.head(top_n_features)['feature']
    print('Sample 10 Feature from Ada Classifier:')
    print(str(features_top_n_ada[:10]))

    # ExtraTree
    et_est = ExtraTreesClassifier(random_state=0)
    et_param_grid = {'n_estimators': [500], 'min_samples_split': [3, 4], 'max_depth': [20]}
    et_grid = model_selection.GridSearchCV(et_est, et_param_grid, n_jobs=25, cv=10, verbose=1)
    et_grid.fit(titanic_train_data_X, titanic_train_data_Y)
    print('Top N Features Best ET Params:' + str(et_grid.best_params_))
    print('Top N Features Best ET Score:' + str(et_grid.best_score_))
    print('Top N Features ET Train Score:' + str(et_grid.score(titanic_train_data_X, titanic_train_data_Y)))
    feature_imp_sorted_et = pd.DataFrame({'feature': list(titanic_train_data_X),
                                          'importance': et_grid.best_estimator_.feature_importances_}).sort_values('importance', ascending=False)
    features_top_n_et = feature_imp_sorted_et.head(top_n_features)['feature']
    print('Sample 10 Features from ET Classifier:')
    print(str(features_top_n_et[:10]))
    
    # GradientBoosting
    gb_est =GradientBoostingClassifier(random_state=0)
    gb_param_grid = {'n_estimators': [500], 'learning_rate': [0.01, 0.1], 'max_depth': [20]}
    gb_grid = model_selection.GridSearchCV(gb_est, gb_param_grid, n_jobs=25, cv=10, verbose=1)
    gb_grid.fit(titanic_train_data_X, titanic_train_data_Y)
    print('Top N Features Best GB Params:' + str(gb_grid.best_params_))
    print('Top N Features Best GB Score:' + str(gb_grid.best_score_))
    print('Top N Features GB Train Score:' + str(gb_grid.score(titanic_train_data_X, titanic_train_data_Y)))
    feature_imp_sorted_gb = pd.DataFrame({'feature': list(titanic_train_data_X),
                                           'importance': gb_grid.best_estimator_.feature_importances_}).sort_values('importance', ascending=False)
    features_top_n_gb = feature_imp_sorted_gb.head(top_n_features)['feature']
    print('Sample 10 Feature from GB Classifier:')
    print(str(features_top_n_gb[:10]))
    
    # DecisionTree
    dt_est = DecisionTreeClassifier(random_state=0)
    dt_param_grid = {'min_samples_split': [2, 4], 'max_depth': [20]}
    dt_grid = model_selection.GridSearchCV(dt_est, dt_param_grid, n_jobs=25, cv=10, verbose=1)
    dt_grid.fit(titanic_train_data_X, titanic_train_data_Y)
    print('Top N Features Best DT Params:' + str(dt_grid.best_params_))
    print('Top N Features Best DT Score:' + str(dt_grid.best_score_))
    print('Top N Features DT Train Score:' + str(dt_grid.score(titanic_train_data_X, titanic_train_data_Y)))
    feature_imp_sorted_dt = pd.DataFrame({'feature': list(titanic_train_data_X),
                                          'importance': dt_grid.best_estimator_.feature_importances_}).sort_values('importance', ascending=False)
    features_top_n_dt = feature_imp_sorted_dt.head(top_n_features)['feature']
    print('Sample 10 Features from DT Classifier:')
    print(str(features_top_n_dt[:10]))
    
    # merge the three models
    features_top_n = pd.concat([features_top_n_rf, features_top_n_ada, features_top_n_et, features_top_n_gb, features_top_n_dt], 
                               ignore_index=True).drop_duplicates()
    
    features_importance = pd.concat([feature_imp_sorted_rf, feature_imp_sorted_ada, feature_imp_sorted_et, 
                                   feature_imp_sorted_gb, feature_imp_sorted_dt],ignore_index=True)
    
    return features_top_n , features_importance
```

上面的代码不需要看着害怕，其实无非就是调用一些神奇的函数而已，上面的代码就是在 多个模型中去寻找重要的特征，并且进行排序，为后面模型训练作出贡献。

#### 依据我们筛选出的特征构建训练集和测试集

但如果在进行特征工程的过程中，产生了大量的特征，而特征与特征之间会存在一定的相关性。太多的特征一方面会影响模型训练的速度，另一方面也可能会使得模型过拟合。所以在特征太多的情况下，我们可以利用不同的模型对特征进行筛选，选取出我们想要的前n个特征。

```python
feature_to_pick = 30
feature_top_n, feature_importance = get_top_n_features(titanic_train_data_X, titanic_train_data_Y, feature_to_pick)
titanic_train_data_X = pd.DataFrame(titanic_train_data_X[feature_top_n])
titanic_test_data_X = pd.DataFrame(titanic_test_data_X[feature_top_n])
```

```python
Fitting 10 folds for each of 2 candidates, totalling 20 fits

 [Parallel(n_jobs=25)]: Done  13 out of  20 | elapsed:   13.7s remaining:    7.3s
 [Parallel(n_jobs=25)]: Done  20 out of  20 | elapsed:   19.2s finished

 Top N Features Best RF Params:{'n_estimators': 500, 'min_samples_split': 3, 'max_depth': 20}
 Top N Features Best RF Score:0.822671156004
 Top N Features RF Train Score:0.979797979798
 Sample 10 Features from RF Classifier
 15      Name_length
 0               Age
 2              Fare
 7             Sex_0
 9           Title_0
 8             Sex_1
 27      Family_Size
 3            Pclass
 31    Ticket_Letter
 11          Title_2
 Name: feature, dtype: object
 Fitting 10 folds for each of 2 candidates, totalling 20 fits

 [Parallel(n_jobs=25)]: Done  13 out of  20 | elapsed:   10.3s remaining:    5.5s
 [Parallel(n_jobs=25)]: Done  20 out of  20 | elapsed:   14.9s finished

 Top N Features Best Ada Params:{'n_estimators': 500, 'learning_rate': 0.01}
 Top N Features Best Ada Score:0.81593714927
 Top N Features Ada Train Score:0.820426487093
 Sample 10 Feature from Ada Classifier:
 9                    Title_0
 2                       Fare
 27               Family_Size
 7                      Sex_0
 3                     Pclass
 28    Family_Size_Category_0
 1                      Cabin
 8                      Sex_1
 15               Name_length
 0                        Age
 Name: feature, dtype: object
 Fitting 10 folds for each of 2 candidates, totalling 20 fits

 [Parallel(n_jobs=25)]: Done  13 out of  20 | elapsed:    9.8s remaining:    5.3s
 [Parallel(n_jobs=25)]: Done  20 out of  20 | elapsed:   14.2s finished

 Top N Features Best ET Params:{'n_estimators': 500, 'min_samples_split': 4, 'max_depth': 20}
 Top N Features Best ET Score:0.828282828283
 Top N Features ET Train Score:0.971941638608
 Sample 10 Features from ET Classifier:
 9           Title_0
 8             Sex_1
 7             Sex_0
 15      Name_length
 0               Age
 2              Fare
 1             Cabin
 31    Ticket_Letter
 11          Title_2
 10          Title_1
 Name: feature, dtype: object
 Fitting 10 folds for each of 2 candidates, totalling 20 fits

 [Parallel(n_jobs=25)]: Done  13 out of  20 | elapsed:   25.9s remaining:   13.9s
 [Parallel(n_jobs=25)]: Done  20 out of  20 | elapsed:   27.9s finished

 Top N Features Best GB Params:{'n_estimators': 500, 'learning_rate': 0.1, 'max_depth': 20}
 Top N Features Best GB Score:0.789001122334
 Top N Features GB Train Score:0.996632996633
 Sample 10 Feature from GB Classifier:
 0               Age
 2              Fare
 15      Name_length
 31    Ticket_Letter
 9           Title_0
 27      Family_Size
 23         Pclass_2
 3            Pclass
 18           Fare_2
 14          Title_5
 Name: feature, dtype: object
 Fitting 10 folds for each of 2 candidates, totalling 20 fits

 [Parallel(n_jobs=25)]: Done  13 out of  20 | elapsed:    6.3s remaining:    3.3s
 [Parallel(n_jobs=25)]: Done  20 out of  20 | elapsed:    9.6s finished

 Top N Features Best DT Params:{'min_samples_split': 4, 'max_depth': 20}
 Top N Features Best DT Score:0.784511784512
 Top N Features DT Train Score:0.959595959596
 Sample 10 Features from DT Classifier:
 9           Title_0
 0               Age
 2              Fare
 15      Name_length
 27      Family_Size
 14          Title_5
 26         Pclass_5
 3            Pclass
 31    Ticket_Letter
 23         Pclass_2
 Name: feature, dtype: object
```

上面就是对之前的一个函数进行的一个调整

用视图可视化不同算法筛选的特征排序：

```python
rf_feature_imp = feature_importance[:10]
Ada_feature_imp = feature_importance[32:32+10].reset_index(drop=True)

# make importances relative to max importance
rf_feature_importance = 100.0 * (rf_feature_imp['importance'] / rf_feature_imp['importance'].max())
Ada_feature_importance = 100.0 * (Ada_feature_imp['importance'] / Ada_feature_imp['importance'].max())

# Get the indexes of all features over the importance threshold
rf_important_idx = np.where(rf_feature_importance)[0]
Ada_important_idx = np.where(Ada_feature_importance)[0]

# Adapted from Gradient Boosting regression
pos = np.arange(rf_important_idx.shape[0]) + .5

plt.figure(1, figsize = (18, 8))

plt.subplot(121)
plt.barh(pos, rf_feature_importance[rf_important_idx][::-1])
plt.yticks(pos, rf_feature_imp['feature'][::-1])
plt.xlabel('Relative Importance')
plt.title('RandomForest Feature Importance')

plt.subplot(122)
plt.barh(pos, Ada_feature_importance[Ada_important_idx][::-1])
plt.yticks(pos, Ada_feature_imp['feature'][::-1])
plt.xlabel('Relative Importance')
plt.title('AdaBoost Feature Importance')

plt.show()
```

![](/2020/03/11/Kaggle-Titanic-生存预测/7.jpg)

#### 模型融合

前面已经训练了多个模型，这个时候就可以直接展开融合了。

常见的模型融合方法有：Bagging、Boosting、Stacking、Blending

常见的相关介绍，直接去看笔记中

**Stacking框架融合:**

这里我们使用了两层的模型融合，Level 1使用了：RandomForest、AdaBoost、ExtraTrees、GBDT、DecisionTree、KNN、SVM ，一共7个模型，Level 2使用了XGBoost使用第一层预测的结果作为特征对最终的结果进行预测。

1. Stacking框架是堆叠使用基础分类器的预测作为对二级模型的训练的输入。 然而，我们不能简单地在全部训练数据上训练基本模型，产生预测，输出用于第二层的训练。如果我们在Train Data上训练，然后在Train Data上预测，就会造成标签泄露。为了避免标签泄露，我们需要对每个基学习器使用K-fold，将K个模型对Valid Set的预测结果拼起来，作为下一层学习器的输入。 所以这里我们建立输出K-fold预测的方法：1  
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
from sklearn.model_selection import KFold  
  
# Some useful parameters which will come in handy later on  
ntrain = titanic_train_data_X.shape[0]  
ntest = titanic_test_data_X.shape[0]  
SEED = 0 # for reproducibility  
NFOLDS = 7 # set folds for out-of-fold prediction  
kf = KFold(n_splits = NFOLDS, random_state=SEED, shuffle=False)  
  
def get_out_fold(clf, x_train, y_train, x_test):  
    oof_train = np.zeros((ntrain,))  
    oof_test = np.zeros((ntest,))  
    oof_test_skf = np.empty((NFOLDS, ntest))  
  
    for i, (train_index, test_index) in enumerate(kf.split(x_train)):  
        x_tr = x_train[train_index]  
        y_tr = y_train[train_index]  
        x_te = x_train[test_index]  
  
        clf.fit(x_tr, y_tr)  
  
        oof_train[test_index] = clf.predict(x_te)  
        oof_test_skf[i, :] = clf.predict(x_test)  
  
    oof_test[:] = oof_test_skf.mean(axis=0)  
    return oof_train.reshape(-1, 1), oof_test.reshape(-1, 1)

```
构建不同的基学习器，这里我们使用了RandomForest、AdaBoost、ExtraTrees、GBDT、DecisionTree、KNN、SVM 七个基学习器：（这里的模型可以使用如上面的GridSearch方法对模型的超参数进行搜索选择）

上面GridSearch就是对参数的搜索选择

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
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC

rf = RandomForestClassifier(n_estimators=500, warm_start=True, max_features='sqrt',max_depth=6, 
                            min_samples_split=3, min_samples_leaf=2, n_jobs=-1, verbose=0)

ada = AdaBoostClassifier(n_estimators=500, learning_rate=0.1)

et = ExtraTreesClassifier(n_estimators=500, n_jobs=-1, max_depth=8, min_samples_leaf=2, verbose=0)

gb = GradientBoostingClassifier(n_estimators=500, learning_rate=0.008, min_samples_split=3, min_samples_leaf=2, max_depth=5, verbose=0)

dt = DecisionTreeClassifier(max_depth=8)

knn = KNeighborsClassifier(n_neighbors = 2)

svm = SVC(kernel='linear', C=0.025)

将pandas转换为arrays：
1
2
3
x_train = titanic_train_data_X.values # Creates an array of the train data
x_test = titanic_test_data_X.values # Creats an array of the test data
y_train = titanic_train_data_Y.values
1
2
3
4
5
6
7
rf_oof_train, rf_oof_test = get_out_fold(rf, x_train, y_train, x_test) # Random Forest
ada_oof_train, ada_oof_test = get_out_fold(ada, x_train, y_train, x_test) # AdaBoost 
et_oof_train, et_oof_test = get_out_fold(et, x_train, y_train, x_test) # Extra Trees
gb_oof_train, gb_oof_test = get_out_fold(gb, x_train, y_train, x_test) # Gradient Boost
dt_oof_train, dt_oof_test = get_out_fold(dt, x_train, y_train, x_test) # Decision Tree
knn_oof_train, knn_oof_test = get_out_fold(knn, x_train, y_train, x_test) # KNeighbors
svm_oof_train, svm_oof_test = get_out_fold(svm, x_train, y_train, x_test) # Support Vector
```

1. 预测并提交文件。我们利用XGBoost，使用第一层预测的结果作为特征对最终的结果进行预测。1  
2  
3  
4  
5  
from xgboost import XGBClassifier  
  
gbm = XGBClassifier( n_estimators= 2000, max_depth= 4, min_child_weight= 2, gamma=0.9, subsample=0.8,   
                    colsample_bytree=0.8, objective= 'binary:logistic', nthread= -1, scale_pos_weight=1).fit(x_train, y_train)  
predictions = gbm.predict(x_test)  
1  
2  
StackingSubmission = pd.DataFrame({'PassengerId': PassengerId, 'Survived': predictions})  
StackingSubmission.to_csv('StackingSubmission.csv',index=False,sep=',')

最后的步骤就是验证了

### 验证：学习曲线

在我们对数据不断地进行特征工程，产生的特征越来越多，用大量的特征对模型进行训练，会使我们的训练集拟合得越来越好，但同时也可能会逐渐丧失泛化能力，从而在测试数据上表现不佳，发生过拟合现象。

当然我们建立的模型可能不仅在预测集上表型不好，也很可能是因为在训练集上的表现就不佳，处于欠拟合状态。

**所以我们通过学习曲线观察模型处于什么样的状态。从而决定对模型进行如何的操作。当然，我们把验证放到最后，并不是是这一步是在最后去做。对于我们的Stacking框架中第一层的各个基学习器我们都应该对其学习曲线进行观察，从而去更好地调节超参数，进而得到更好的最终结果。**

```python
from sklearn.learning_curve import learning_curve

def plot_learning_curve(estimator, title, X, y, ylim=None, cv=None,
                        n_jobs=1, train_sizes=np.linspace(.1, 1.0, 5), verbose=0):
    plt.figure()
    plt.title(title)
    if ylim is not None:
        plt.ylim(*ylim)
    plt.xlabel("Training examples")
    plt.ylabel("Score")
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=cv, n_jobs=n_jobs, train_sizes=train_sizes)
    train_scores_mean = np.mean(train_scores, axis=1)
    train_scores_std = np.std(train_scores, axis=1)
    test_scores_mean = np.mean(test_scores, axis=1)
    test_scores_std = np.std(test_scores, axis=1)
    plt.grid()

    plt.fill_between(train_sizes, train_scores_mean - train_scores_std,
                     train_scores_mean + train_scores_std, alpha=0.1,
                     color="r")
    plt.fill_between(train_sizes, test_scores_mean - test_scores_std,
                     test_scores_mean + test_scores_std, alpha=0.1, color="g")
    plt.plot(train_sizes, train_scores_mean, 'o-', color="r",
             label="Training score")
    plt.plot(train_sizes, test_scores_mean, 'o-', color="g",
             label="Cross-validation score")

    plt.legend(loc="best")
    return plt
```

逐一观察不同模型的学习曲线

```python
X = x_train
Y = y_train

# RandomForest
rf_parameters = {'n_jobs': -1, 'n_estimators': 500, 'warm_start': True, 'max_depth': 6, 'min_samples_leaf': 2, 
              'max_features' : 'sqrt','verbose': 0}

# AdaBoost
ada_parameters = {'n_estimators':500, 'learning_rate':0.1}

# ExtraTrees
et_parameters = {'n_jobs': -1, 'n_estimators':500, 'max_depth': 8, 'min_samples_leaf': 2, 'verbose': 0}

# GradientBoosting
gb_parameters = {'n_estimators': 500, 'max_depth': 5, 'min_samples_leaf': 2, 'verbose': 0}

# DecisionTree
dt_parameters = {'max_depth':8}

# KNeighbors
knn_parameters = {'n_neighbors':2}

# SVM
svm_parameters = {'kernel':'linear', 'C':0.025}

# XGB
gbm_parameters = {'n_estimators': 2000, 'max_depth': 4, 'min_child_weight': 2, 'gamma':0.9, 'subsample':0.8, 
               'colsample_bytree':0.8, 'objective': 'binary:logistic', 'nthread':-1, 'scale_pos_weight':1}
```

```python
title = "Learning Curves"
plot_learning_curve(RandomForestClassifier(**rf_parameters), title, X, Y, cv=None,  n_jobs=4, train_sizes=[50, 100, 150, 200, 250, 350, 400, 450, 500])
plt.show()
```

![](/2020/03/11/Kaggle-Titanic-生存预测/8.jpg)

提交结果终于到达了87左右了，后面还是可以尝试一下在模型融合这里慢慢加强。

但是 后面就是无尽无尽的调整参数的过程咯
