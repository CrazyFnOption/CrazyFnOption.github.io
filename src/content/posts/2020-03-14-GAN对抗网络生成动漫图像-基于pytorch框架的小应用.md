---
title: "GAN对抗网络生成动漫图像---基于pytorch框架的小应用"
date: 2020-03-14
slug: "GAN对抗网络生成动漫图像-基于pytorch框架的小应用"
categories: ["机器学习"]
tags: ["深度学习", "Pytorch", "对抗网络GAN"]
---

### 介绍

这是在pytorch教程上面一个简单的应用，利用对抗网络生成图像生成动漫图像

该类网络 分成两个结构模型： 捕获数据分布的生成模型G，和估计样本来自训练数据的概率的判别模型D

G的训练就是将D的错误最大化，GAN主要针对的是生成类的模型

目前，深度学习的领域的图像生成、风格迁移，图像变化，图像描述，无监督学习，甚至强化学习领域都能看到GAN的影子。

目前深度学习领域可以分为两大类：

其一是检测识别，比如图像分类，目标识别，此类模型主要有VGG，GoogLenet，Residual net等，几乎所有的网络都是基于识别的

其二是图像生成，即解决如何从一些数据里生成图像，生成类模型主要有深度信念网络DBN，变分zibianmaqiVAE。而某种程度上，GAN的生成能力远超过DBN、VAE。经过改进后的GAN足以生成以假乱真的图像。

机器学习的模型大体可分为两类：生成模型（Generative model）和判别模型（Discriminative model）。

判别模型需要输入变量，通过某种模型来预测。

生成模型是给定某种隐含信息，来随机产生观测数据。

### GAN原理

GAN基本原理：以生成图片为例。假设我们有两个网络：G(Generator)和D(Discriminator)。他们的功能分别为：

G：一个生成图片的网络，它接收一个随机噪声z，通过这个噪声生成图片，记做G(z)；

D：一个判别网络，判别一张图片是不是“真实的”。它的输入参数是x，x代表一张图片，输出D(x)代表x为真实图片的概率。

如果为1，就带包100%是真实的图片，而输出为0，就代表不可能是真实图片。

在训练过程中，生成网络G的目标就是尽量生成真实的图片去欺骗判别网络D，而D的目标就是尽量把G生成的图片和真实的图片分别开来。这样，G和D构成了一个动态的“博弈”。

理想状态下，G可以生成足以“以假乱真”的图片G(z)。 对D来说。它难以判定G生成的图片究竟是不是真实的。这样我们的目的就达到了

这样我们就可以得到一个生成式的模型，可以用它来生成图片

![](/2020/03/14/GAN对抗网络生成动漫图像-基于pytorch框架的小应用/1.png)

其中G为生成模型，D为判别模型。

GAN的大概流程是：G以随机噪声作为输入，生成一张图像G(z)，暂且不管生成质量多好，然后D以G(z)和真实图像x作为输入，对G(z)和x做一个二分类，检测谁是真实图像，谁是生成的假图像。

举一个最简单的例子

A为卖假钞的团队  B为抓假钞的警察

A最先开始没有经验，所以一开始做出来的假钞很没有水准，而B一开始也没有能力辨别假钞，所以一开始对A制造出来的假钞没有太大敌意，全盘接受。

于是B开始慢慢学习，久而久之发现不太对劲，于是开始钻研假钞。最后发现，A团队研制假钞，所以开始追杀A。

这个时候A发现自己的假钞被识别出来了，于是加大研究力度，研究出了更不容易被发现的假钞  
然后B也被绕进去了，于是也开始研究反假钞…

于是就一直这样重复进行博弈，最后我们得到的训练模型是 一个可以完美生成“真的”假钞的技术

**以上只是举个小小的例子，帮助理解GAN，我坚决拥护中国共产党**

下面 回到本次小应用上面，

### 模型

这里也是同样存在两个模型，

- 一个模型用来接受一个随机的一维噪音维度，并且生成一系列动漫头像。
- 一个是用来接受动漫头像，并且用于判断其是否是真正的动漫头像。

接下来，请看模型的代码：

```python
from torch import nn

class Net_G(nn.Module):
    def __init__(self, opt):
        super(Net_G,self).__init__()

        ngf = opt.ngf # 卷积层中间用来描述给予图像的特征

        self.net = nn.Sequential(
            # 100 * 1 * 1 -> (ngf * 8) * 4 * 4
            nn.ConvTranspose2d(opt.nc, ngf*8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(ngf * 8),
            nn.ReLU(True),

            # (ngf * 8) * 4 * 4 -> (ngf * 4) * 8 * 8
            nn.ConvTranspose2d(ngf*8, ngf*4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf * 4),
            nn.ReLU(True),

            # (ngf * 4) * 8 * 8 -> (ngf * 2) * 16 * 16
            nn.ConvTranspose2d(ngf*4, ngf*2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf*2),
            nn.ReLU(True),

            # (ngf * 2) * 16 * 16 -> ngf * 32 * 32
            nn.ConvTranspose2d(ngf*2, ngf, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf),
            nn.ReLU(True),

            # ngf * 32 * 32 -> 3 * 96 * 96
            nn.ConvTranspose2d(ngf, 3, 5, 3, 1, bias=False),
            nn.Tanh()
        )

    def forward(self, x):
        return self.net(x)

class Net_D(nn.Module):
    def __init__(self, opt):
        super(Net_D,self).__init__()
        ndf = opt.ndf

        self.net = nn.Sequential(
            # 3 * 96 * 96 -> ndf * 32 * 32
            nn.Conv2d(3, ndf, 5, 3, 1, bias=False),
            nn.BatchNorm2d(ndf),
            nn.LeakyReLU(0.2,True),

            # ndf * 32 * 32 -> (ndf * 2) * 16 * 16
            nn.Conv2d(ndf, ndf*2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf*2),
            nn.LeakyReLU(0.2,True),

            # (ndf * 2) * 16 * 16 -> (ndf * 4) * 8 * 8
            nn.Conv2d(ndf*2, ndf*4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf*4),
            nn.LeakyReLU(0.2, True),

            # (ndf * 4) * 8 * 8 -> (ndf*8) * 4 * 4
            nn.Conv2d(ndf*4, ndf*8, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf*8),
            nn.LeakyReLU(0.2, True),

            # (ndf*8) * 4 * 4 -> 100 * 1 * 1,
            nn.Conv2d(ndf*8, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.net(x).view(-1)
```

上面这段代码需要注意四点

- 仔细看网络其实是对称的，并且图片的维度应该是 m *nc* n * n, nc表示通道数，n表示图片尺寸
- Conv2d 卷积层是一个将图片变成特征的过程，而ConvTranspose2d则是将特征变成图片的过程，参数都是类似的过程，另外计算公式正好就是恰恰相反 (fs - kerner_size + 2*padding) / stride 后者的公式就是将其倒过来就可以
- 不需要bias的原因是因为在BatchNorm2d中已经进行了参数归一化的过程

模型有了，接下来就是处理数据图片

### 数据

这里就不像之前一样专门封装一个数据集，上次封装数据集，是因为在取出数据的时候，需要对标签值，进行一个处理，（也就是对Y值进行一个处理），而这次全部都是图片数据，且不需要做一些额外的处理，所以直接使用即可

这里直接使用的是ImageFolder类，帮助处理相关图片文件夹群

```python
transforms = tv.transforms.Compose([
        tv.transforms.Resize(opt.image_size),
        tv.transforms.CenterCrop(opt.image_size),
        tv.transforms.ToTensor(),
        tv.transforms.Normalize((0.5,0.5,0.5),(0.5,0.5,0.5))
    ])
    dataset = tv.datasets.ImageFolder(opt.data_path,transform=transforms)
    dataloader = DataLoader(dataset,
                            opt.batch_size,
                            shuffle=True,
                            num_workers=opt.num_works,
                            drop_last=True)
```

### 主模块

前面都算是简单的环节，其实主要困难在配置函数和主类中

接下里请看代码

```python
class Config(object):
    data_path = 'data/'
    num_works = 4
    image_size = 96
    batch_size = 256
    max_epoch = 200
    lr1 = 2e-4
    lr2 = 2e-4
    beta1 = 0.5
    gpu = False
    nc = 100
    ngf = 64
    ndf = 64

    save_path = 'imgs/'
    vis = True
    env='GAN'
    plot_every = 20

    debug_file = '/tmp/debug'
    d_every = 1
    g_every = 5
    save_every = 10
    netd_path = None
    netg_path = None

    gen_img = 'result.png'
    gen_num = 64
    gen_search_num = 512
    gen_mean = 0
    gen_std = 1

opt = Config()
```

```python
import os
import tqdm
import fire
import ipdb
import visdom
import torch as t
import torchvision as tv
from torch.autograd import Variable as V
from models import Net_G,Net_D
from config import opt
from visualize import Visualize
from torch.utils.data import DataLoader
from torchnet.meter import AverageValueMeter

def train(**kwargs):
    global vis, fix_fake_img
    for k_,v_ in kwargs.items():
        setattr(opt, k_, v_)
    device = t.device('cuda') if opt.gpu else t.device('cpu')

    vv = visdom.Visdom(env='image')
    print(opt.netd_path)
    print(opt.netg_path)
    if opt.vis:
        from visualize import Visualize
        vis = Visualize(opt.env)

    transforms = tv.transforms.Compose([
        tv.transforms.Resize(opt.image_size),
        tv.transforms.CenterCrop(opt.image_size),
        tv.transforms.ToTensor(),
        tv.transforms.Normalize((0.5,0.5,0.5),(0.5,0.5,0.5))
    ])
    dataset = tv.datasets.ImageFolder(opt.data_path,transform=transforms)
    dataloader = DataLoader(dataset,
                            opt.batch_size,
                            shuffle=True,
                            num_workers=opt.num_works,
                            drop_last=True)

    net_g,net_d = Net_G(opt),Net_D(opt)
    if opt.netd_path:
        net_d.load_state_dict(t.load(opt.netd_path, map_location=lambda storage, loc: storage))
    if opt.netg_path:
        net_g.load_state_dict(t.load(opt.netg_path, map_location=lambda storage, loc:storage))

    net_g.to(device)
    net_d.to(device)

    optimizer_g = t.optim.Adam(net_g.parameters(), opt.lr1, betas=(opt.beta1, 0.999))
    optimizer_d = t.optim.Adam(net_d.parameters(), opt.lr2, betas=(opt.beta1, 0.999))

    criterion = t.nn.BCELoss().to(device)

    true_labels = V(t.ones(opt.batch_size).to(device))
    fake_labels = V(t.zeros(opt.batch_size).to(device))
    noises = V(t.randn(opt.batch_size, opt.nc, 1, 1).to(device))
    fix_noises = V(t.randn(opt.batch_size, opt.nc, 1, 1).to(device))

    error_d_meter = AverageValueMeter()
    error_g_meter = AverageValueMeter()

    epochs = range(opt.max_epoch)
    for epoch in epochs:
        for ii, (img,_) in tqdm.tqdm(enumerate(dataloader)):
            real_img = img.to(device)

            if ii % opt.d_every == 0:
                optimizer_d.zero_grad()
                output = net_d(real_img)
                error_d_real = criterion(output,true_labels)
                error_d_real.backward()

                noises.data.copy_(t.randn(opt.batch_size, opt.nc, 1, 1))
                fake_img = net_g(noises).detach()
                output = net_d(fake_img)
                error_d_fake = criterion(output, fake_labels)
                error_d_fake.backward()
                optimizer_d.step()
                error_d = error_d_fake + error_d_real
                error_d_meter.add(error_d.item())

            if ii % opt.g_every == 0:
                optimizer_g.zero_grad()
                noises.data.copy_(t.randn(opt.batch_size, opt.nc, 1, 1))
                fake_img = net_g(noises)
                output = net_d(fake_img)
                error_g = criterion(output, true_labels)
                error_g.backward()
                optimizer_g.step()
                error_g_meter.add(error_g.item())

            if opt.vis and ii % opt.plot_every == opt.plot_every - 1:
                if os.path.exists(opt.debug_file):
                    ipdb.set_trace()
                fix_fake_img = net_g(fix_noises)
                # vis.img('fixfake',fix_fake_img.detach().data.cpu().numpy()[:64] * 0.5 + 0.5)
                # vis.img('real', (real_img.cpu().numpy()[:64] * 0.5 + 0.5))
                vv.images(fix_fake_img.detach().cpu().numpy()[:64] * 0.5 + 0.5, win='fixfake')
                vv.images(real_img.data.cpu().numpy()[:64] * 0.5 + 0.5, win='real')

                vis.plot('errord', error_d_meter.value()[0])
                vis.plot('errorg', error_g_meter.value()[0])
            print("current epoch: %d" % epoch)
        if (epoch + 1) % opt.save_every == 0:
            tv.utils.save_image(fix_fake_img.data[:64], '%s/%s.png' %(opt.save_path, epoch)
                                , normalize=True,range=(-1,1))
            t.save(net_g.state_dict(),'checkpoints/netg_%s.pth' % epoch)
            t.save(net_d.state_dict(),'checkpoints/netd_%s.pth' % epoch)
            error_g_meter.reset()
            error_d_meter.reset()

def generate(**kwargs):
    for k,v in kwargs.items():
        setattr(opt, k, v)

    device = t.device('cuda') if opt.gpu else t.device('cpu')
    net_g,net_d = Net_G(opt).eval(),Net_D(opt).eval()
    noises = t.randn(opt.gen_search_num, opt.nc, 1, 1).normal_(opt.gen_mean, opt.gen_std)
    noises = noises.to(device)

    net_g.load_state_dict(t.load(opt.netg_path, map_location=lambda storage,loc:storage))
    net_d.load_state_dict(t.load(opt.netd_path, map_location=lambda storage,loc:storage))
    net_g.to(device)
    net_d.to(device)

    fake_img = net_g(noises)
    scores = net_d(fake_img).detach()

    indexs = scores.topk(opt.gen_num)[1]
    result = []

    for ii in indexs:
        result.append(fake_img.data[ii])

    tv.utils.save_image(t.stack(result), opt.gen_num, normalize=True, range=(-1,1))

if __name__ == '__main__':
    fire.Fire()
```

关于这个主模块中，同样也有五点需要注意

- 关于Adam优化器中的beta1 最好为0.8到0.9 而beta2最好为0.999， 而在这里前者用的是0.5，可能是研究出来的结果
- 这里需要几个标签来辅助训练，真标签与假标签，真标签用来与判定模型训练绑定，而假标签需要与生成模型训练绑定，然后在需要两个随机生成的噪声维度，一个是每次都需要去变化，另一个是不用变化，并且时时可视化生成器生成的最终效果的。
- 训练过程就是分为两个流程：训练判别模型和训练生成模型
  - 将真照片放到判别模型中，并且让结果与真标签对比的得到loss，而在此过程中同时还需要将生成器生成的假图片同样放到判别模型中去判假（与假标签进行联动），在词过程中得到两种loss，相加为判别器的loss
  - 将随机噪音输入到生成模型中，并且让其对比训练，以得到假意乱真的图片
- 在训练的过程中，使用了detach函数，因为A模型的输出做为了B模型的输入，因为不想反向传播甚至梯度下降的时候影响到A模型，所以这里就直接将A模型直接分离。
- 在生成函数中 用生成模型生成的图片，交给判定模型去判别，并且选出近似度最高的几个图形，并且输出。 其实说白了，判别模型在生成图片的时候不会给予直接或者间接的帮助，只能够在最后判定的过程中选出最相像的模型。
