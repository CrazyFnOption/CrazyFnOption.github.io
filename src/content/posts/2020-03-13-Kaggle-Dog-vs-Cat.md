---
title: "Kaggle Dog vs Cat"
date: 2020-03-13
slug: "Kaggle-Dog-vs-Cat"
categories: ["机器学习"]
tags: ["深度学习", "Pytorch", "卷积网络"]
---

这是我接触的第一个Kaggle上面的比赛使用深度学习框架去完成，毕竟是一个图片识别的问题

原题目[在这里](https://www.kaggle.com/c/dogs-vs-cats/overview)

The training archive contains 25,000 images of dogs and cats. Train your algorithm on these files and predict the labels for test1.zip (1 = dog, 0 = cat).

其实说白了，这道题也是比较简单的一道图片的二分类问题，最终的目的就是要输出这张图片究竟是狗狗还是猫猫

按照 步骤来做，以下的步骤基于**深度学习框架 Pytorch**

### 数据处理

这里是直接去封装成一个dataset来读取操作图片

下面给出代码：

```python
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms as T
import os

class DogVsCat(Dataset):
    def __init__(self, root, transforms, train, test):
        self.test = test
        imgs = [os.path.join(root, img) for img in os.listdir(root)]

        if self.test:
            # ...../data/1001.jpg
            imgs = sorted(imgs, key=lambda x: int(x.split('.')[-2].split('/')[-1]))
            self.imgs = imgs
        else:
            # ...../data/dog.1001.jpg
            imgs = sorted(imgs, key=lambda x: int(x.split('.')[-2]))
        imgs_num = len(imgs)

        if self.test: pass
        elif train:
            self.imgs = imgs[:int(0.7 * imgs_num)]
        else :
            self.imgs = imgs[int(0.7 * imgs_num):]

        if transforms is None:
            normalize = T.Normalize(mean=[0.485, 0.456, 0.406],std=[0.229, 0.224, 0.225])

            if self.test or not train:
                self.transforms = T.Compose([
                    T.Resize(224),
                    T.CenterCrop(224),
                    T.ToTensor(),
                    normalize
                ])
            else :
                self.transforms = T.Compose([
                    T.Resize(256),
                    T.RandomResizedCrop(224),
                    T.RandomHorizontalFlip(),
                    T.ToTensor(),
                    normalize
                ])

    def __getitem__(self, index):
        img_path = self.imgs[index]
        # return the label if you get img
        if self.test:
            # ...../data/1001.jpg
            label = int(img_path.split('.')[-2].split('/')[-1])
        else :
            # ...../data/dog.1001.jpg
            # dog : 1 , cat : 0
            label = 1 if 'dog' in img_path else 0
        img = Image.open(img_path)
        img = self.transforms(img)
        return img, label
    
    def __len__(self):
        return len(self.imgs)
```

需要注意的三个地方

- 在getitem里面再去将图片保存在内存里，其他的时候保存图片的路径，并且进行排序
- 区分以下图片的测试集，与训练集，验证集，label返回的值，图片数量，以及图片优化都有所不同
- 最后一次写的时候竟然还是忘记在读取图片的过程中进行一个优化

当处理完数据，并且封装了一个相应的数据集合之后，接下来的任务就是 建立卷积网络模型，这里应用的是包的深度学习网络，并且采取的预训练参数

当然，如果自己去调试一个模型的话，可能要花上一个月左右的时间，所以这里直接借用其他人的模型，来帮助自己进行调试相关的模型。

```python
import torch as t
from torchvision.models import squeezenet1_1
from torch.optim import Adam
from torch import nn
import time

class SqueezeNet(nn.Module):
    def __init__(self, num_classes=2):
        super(SqueezeNet, self).__init__()
        self.model_name = 'squeezenet'
        self.model = squeezenet1_1(pretrained=True)
        self.num_classes = num_classes
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.5),
            # 相当于全链接层
            nn.Conv2d(512, num_classes, 1),
            nn.ReLU(True),
            nn.AvgPool2d(13, stride=1)
        )

    def forward(self, x):
        return self.model(x)

    def get_optim(self, lr, weight_decay):
        # 这里使用的是预训练模型，所以只有优化后面的参数即可
        return Adam(self.model.classifier.parameters(),lr=lr, weight_decay=weight_decay)

    def load(self, path):
        self.load_state_dict(t.load(path))

    def save(self, name=None):
        if (name is None):
            prefix = 'checkpoints/' + self.model_name + '_'
            name = time.strftime(prefix + '%m%d_%H:%M:%S.pth')
        t.save(self.state_dict(), name)
        def load(self, path):
            self.load_state_dict(t.load(path))

    def save(self, name=None):
        if (name is None):
            prefix = 'checkpoints/' + self.model_name + '_'
            name = time.strftime(prefix + '%m%d_%H:%M:%S.pth')
        t.save(self.state_dict(), name)
        return name
```

同样要记住两点

- 记住在优化的过程中所有的 in_feature 与 out_feature 必须一一对应清楚
- 由于这里直接使用了预训练模型，所以就直接优化后面的模型就可以了

接下来就可以开始着手写 配置函数和主函数了

```python
import torch as t
import os
import ipdb
import tqdm
import fire
import warnings
from torchnet import meter
from torch.utils.data import DataLoader
from torch import nn
import csv
from dataset import DogVsCat
from model import SqueezeNet
from utils import Visualizer

class Config(object):
    env = 'Dog or Cat'

    train_root = './data/train'
    test_root = './data/test1'
    load_model_path = None
    use_gpu = False

    lr = 0.001
    lr_decay = 0.5
    weight_decay = 0e-5
    batch_size = 32
    num_works = 4

    max_epoch = 10
    plot_every = 20
    debug_path = 'tmp/debug'
    device = None

opt = Config()

def test(**kwargs):
    for k, v in kwargs.items():
        if not hasattr(opt, k):
            warnings.warn("Warning: opt has not attribut %s" % k)
        setattr(opt, k, v)
    model = SqueezeNet()
    if opt.load_model_path:
        model.load(opt.load_model_path)
    device = t.device('cuda') if opt.use_gpu else t.device('cpu')
    model.to(opt.device)

    test_data = DogVsCat(opt.test_root,train=False,test=True)
    test_dataloader = DataLoader(test_data,batch_size=opt.batch_size,shuffle=False,num_workers=opt.num_works)
    results = []

    for ii,(data, label) in tqdm.tqdm(enumerate(test_dataloader)):
        input = data.to(opt.device)
        score = model(input)
        probability = t.nn.functional.softmax(score,dim=1)[:,0].detach().tolist()
        if ii == 0 :
            print(score)

        res = [(path_.item(), probability_) for path_,probability_ in zip(label, probability)]
        results.append(res)
    with open('result.csv','w') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'label'])
        writer.writerows(results)

def train(**kwargs):

    for k, v in kwargs.items():
        setattr(opt, k, v)

    opt.device = t.device('cuda') if opt.use_gpu else t.device('cpu')

    vis = Visualizer(env=opt.env)
    train_dataset = DogVsCat(opt.train_root, train=True, test=False)
    train_dataloader = DataLoader(train_dataset, batch_size=opt.batch_size, shuffle=True, num_workers=opt.num_works)

    cv_dataset = DogVsCat(opt.train_root, train=False, test=False)
    cv_dataloader = DataLoader(cv_dataset, batch_size=opt.batch_size, shuffle=False, num_workers=opt.num_works)

    model = SqueezeNet()
    if opt.load_model_path:
        model.load(opt.load_model_path)
    model.to(opt.device)

    criterion = nn.CrossEntropyLoss()
    lr = opt.lr
    optim = model.get_optim(lr=lr, weight_decay=opt.weight_decay)

    loss_meter = meter.AverageValueMeter()
    confusion_matrix = meter.ConfusionMeter(2)  # 二分类问题，所以就使用这样的写法
    previous_loss = 1e10
    # 训练集操作
    for epoch in range(opt.max_epoch):
        loss_meter.reset()
        confusion_matrix.reset()

        for ii, (data, label) in tqdm.tqdm(enumerate(train_dataloader)):
            input = data.to(opt.device)
            target = label.to(opt.device)
            output = model(input)
            optim.zero_grad()
            loss = criterion(output, target)
            loss.backward()
            optim.step()

            loss_meter.add(loss.item())
            confusion_matrix.add(output.detach(), target.detach())

            if (ii + 1) % opt.plot_every == 0:
                vis.plot('loss', loss_meter.value()[0])

                if os.path.exists(opt.debug_path):
                    ipdb.set_trace()

        model.save()
        # 验证集开始验证
        cv_val, cv_accuracy = val(model, cv_dataloader)
        vis.plot('val_accuracy', cv_accuracy)
        vis.log("epoch:{epoch},lr:{lr},loss:{loss},train_cm:{train_cm},val_cm:{val_cm}".format(
            epoch=epoch, loss=loss_meter.value()[0], val_cm=str(cv_val), train_cm=str(confusion_matrix.value()),
            lr=opt.lr))

        if loss_meter.value()[0] > previous_loss:
            lr = lr * opt.lr_decay
            for param_group in optim.param_groups:
                param_group['lr'] = lr
        previous_loss = loss_meter.value()[0]

def val(model, cv_dataloader):
    model.eval()
    confusion_matrix = meter.ConfusionMeter(2)
    for ii, (data, label) in tqdm.tqdm(enumerate(cv_dataloader)):
        input = data.to(opt.device)
        target = label.to(opt.device)
        output = model(input)
        confusion_matrix.add(output.detach().squeeze(), target.type(t.LongTensor))

    model.train()
    cv_val = confusion_matrix.value()
    cv_accuracy = 100 * (cv_val[0][0] + cv_val[1][1] / cv_val.sum())
    return cv_val, cv_accuracy

if __name__ == '__main__':
    fire.Fire()
```

总体来说代码还是比较简单的，由于对py的语法不是特别熟悉，所以需要注意五个地方

- 注意**kwargs 需要将其的item拿出来赋值，要不然就必须全部赋值
- 这里混淆矩阵有办法帮着看而分类问题
- 时时刻刻都要注意代码运行的地方到底实在cpu还是在gpu
- 记住对特征值的处理才能够得到答案
- 也是最重要的一点，上面模型生成结果之后，需要去应用softmax进行一个二分类问题
