---
title: "Image_Caption 基于pytorch深度学习框架的图像描述"
date: 2020-03-15
slug: "Image-Caption-基于pytorch深度学习框架的图像描述"
categories: ["机器学习"]
tags: ["深度学习", "Pytorch", "图像描述"]
---

这次的项目就提升了很大的难度，基本上是将所学的全部进行一个应用。 将卷积网络和循环网络进行一个结合

卷积网络 提取图片特征

循环网络 根据提取特征输出对图片的描述

下面 请看代码

还是老规矩，按照步骤一点一点的进行下去

### 数据总揽及处理

这次的数据包含图片 以及 对图片的描述 （5句话，可以随机选择一句）

这里对数据的处理也是两个方法，处理生数据或者是处理已经预处理数据

这里两个都贴出来

**数据的预处理**

```python
import torch as t
import numpy as np
import json
import jieba
import tqdm

class Config:
    annotation_file = 'caption_train_annotations_20170902.json'
    unknown = '</UNKNOWN>'
    end = '</EOS>'
    padding = '</PAD>'
    max_words = 10000
    min_appear = 2
    save_path = 'caption.pth'

def process(**kwargs):
    opt = Config()
    for k, v in kwargs.items():
        setattr(opt, k, v)

    with open(opt.annotation_file) as f:
        data = json.load(f)

    id2ix = {item['image_id']: ix for ix, item in enumerate(data)}
    ix2id = {ix: pic for pic, ix in id2ix.items()}
    assert id2ix[ix2id[10]] == 10

    captions = [item['caption'] for item in data]
    cut_captions = [[list(jieba.cut(ii, cut_all=False) for ii in item)] for item in tqdm.tqdm(captions)]

    word_nums = {}  # 每一个词出现的次数

    # 这里的语法结构很神奇，需要后面自己去加深一下理解
    # 下面就是过滤低频词语
    def update(word_nums):
        def fun(word):
            word_nums[word] = word_nums.get(word, 0) + 1  # 每出现一次就增加一次
            return None
        return fun

    lambda_ = update(word_nums)
    # 需要去测试一下，这一句是否与下面一句是相同的效果
    #_ = {[[lambda_(word) for word in sentence] for sentence in sentences]for sentences in cut_captions}
    _ = {lambda_(word) for sentences in cut_captions for sentence in sentences for word in sentence}
    word_nums_list = sorted([(num, word) for word, num in word_nums.items()], reverse=True)  # 倒序排列
    # 排在前1w个高频词汇 直接将其放入到可以操作的字典李
    words = [word[1] for word in word_nums_list[:opt.max_words] if word[0] >= opt.min_appear]
    words = [opt.unknown, opt.padding, opt.end] + words
    word2ix = {word: ix for ix, word in enumerate(words)}
    ix2word = {ix: word for word, ix in word2ix.items()}
    assert word2ix[ix2word[123]] == 123

    #这里default的意思就是如果不存在 就返回opt.unknown
    ix_captions = [[[word2ix.get(word, default=word2ix.get(opt.unknown)) for word in sentence] for sentence in item] for item in cut_captions]

    readme = u"""
    word：词
    ix:index
    id:图片名
    caption: 分词之后的描述，通过ix2word可以获得原始中文词
    """
    results = {
        'caption': ix_captions,
        'word2ix': word2ix,
        'ix2word': ix2word,
        'ix2id': ix2id,
        'id2ix': id2ix,
        'padding': '</PAD>',
        'end': '</EOS>',
        'readme': readme
    }
    t.save(results, opt.save_path)
    print('save file in %s' % opt.save_path)

    def test(ix, ix2= 4):
        results = t.load(opt.save_path)
        ix2word = results['ix2word']
        examples = results['caption'][ix][4] # 第ix张图的第四句话
        sentences_p = (''.join([ix2word[ii] for ii in examples]))
        sentences_r = data[ix]['caption'][ix2]
        assert sentences_p == sentences_r, 'test failed'
    test(1000)
    print('test success')
```

以后自己要学会怎么去处理数据，因为可能数据不再睡提供好了的。

注意这里的语料库，结巴分词，直接将词语分好，然后你自己再去选择相应出现频率最高的词语，作为词语的词语嵌入的训练集，加快进度

**Caption数据处理**

```python
import torch as t
from torch.utils import data
import os
from PIL import Image
import torchvision as tv
import numpy as np

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def create_collate_fn(padding, eos, max_length=50):

    """
        将多个样本拼接在一起成一个batch
        输入： list of data，形如
        [(img1, cap1, index1), (img2, cap2, index2) ....]

        拼接策略如下：
        - batch中每个样本的描述长度都是在变化的，不丢弃任何一个词\
          选取长度最长的句子，将所有句子pad成一样长
        - 长度不够的用</PAD>在结尾PAD
        - 没有START标识符
        - 如果长度刚好和词一样，那么就没有</EOS>

        返回：
        - imgs(Tensor): batch_size*2048(2048这里就是卷积层最后的结果)
        - cap_tensor(Tensor): batch_size*max_length
        - lengths(list of int): 长度为batch_size
        - index(list of int): 长度为batch_size
        """

    def collate_fn(img_cap):
        img_cap.sort(key=lambda p: len(p[1]), reverse=True)
        imgs, caps, indexs = zip(*img_cap)
        imgs = t.cat([img.unsqueeze(0) for img in imgs], 0)
        # 限制最大不能超过50个词 一句话，如果超过就修建成50个词
        lengths = [min(len(c) + 1, max_length) for c in caps]
        batch_length = max(lengths)
        # 直接先创建一个空向量
        cap_tensor = t.LongTensor(batch_length, len(caps)).fill_(padding)
        for i, c in enumerate(caps):
            end_cap = lengths[i] - 1
            if end_cap < batch_length:
                cap_tensor[end_cap, i] = eos
            cap_tensor[:end_cap, i].copy_(c[:end_cap])
        return (imgs, (cap_tensor, lengths), indexs)

    return collate_fn

class CaptionDataset(data.Dataset):
    def __init__(self, opt):
        self.opt = opt
        data = t.load(opt.caption_data_path)
        word2ix = data['word2ix']
        self.captions = data['caption']
        self.padding = word2ix.get(data.get('padding'))
        self.end = word2ix.get(data.get('end'))
        self._data = data
        self.ix2id = data['ix2id']
        self.all_imgs = t.load(opt.img_feature_path)
        self.train(True)

    def __getitem__(self, index):
        """
        返回：
        - img: 图像features 2048的向量
        - caption: 描述，形如LongTensor([1,3,5,2]),长度取决于描述长度
        - index: 下标，图像的序号，可以通过ix2id[index]获取对应图片文件名
        """
        index = index + self._start
        img = self.all_imgs[index]

        caption = self.captions[index]
        # 5句描述随机选一句
        rdn_index = np.random.choice(len(caption), 1)[0]
        caption = caption[rdn_index]
        return img, t.LongTensor(caption), index

    def __len__(self):
        return self.len_

    def train(self, training=True):
        self.training = training
        if self.training:
            self._start = 0
            self.len_ = len(self._data) - 10000
        else :
            self._start = len(self._data) - 10000
            self.len_ = 10000

def get_dataloader(opt):
    dataset = CaptionDataset(opt)
    dataloader = data.DataLoader(dataset,
                                 batch_size=opt.batch_size,
                                 shuffle=opt.shuffle,
                                 num_workers=opt.num_workers,
                                 collate_fn=create_collate_fn(dataset.padding, dataset.end))
    return dataloader
```

- collate_fn在加载图片的时候，可以自定义加载方式, **我们目前的理解就是与处理图片的transforms是一样的，只不过一个对图片，一个是对其他数据**

下面就是对图片进行一个 预处理咯

**ImageData**

```python
from config import Config
import tqdm
import torch as t
from torch.autograd import Variable
import torchvision as tv
from torch.utils import data
import os
from PIL import Image
import numpy as np

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
normalize = tv.transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)

class CaptionDataset(data.Dataset):
    def __init__(self, opt):
        self.transforms = tv.transforms.Compose([
            tv.transforms.Resize(256),
            tv.transforms.CenterCrop(256),
            tv.transforms.ToTensor(),
            normalize
        ])

        data = t.load(opt.caption_data_path)
        self.ix2id = data['ix2id']

        self.imgs = [os.path.join(opt.img_path, self.ix2id[ix]) for ix in range(len(self.ix2id))]

    def __getitem__(self, index):
        img = Image.open(self.imgs[index]).convert('RGB')
        img = self.transforms(img)
        return img, index

def get_loader(opt):
    dataset = CaptionDataset(opt.caption_data_path)
    dataloader = data.DataLoader(dataset,
                                 batch_size=opt.batch_size,
                                 shuffle=False, # 这里是需要与后面描述那一块的图像进行比对校准，所以不能打乱
                                 num_workers=opt.num_workers
                                 )
    return dataloader

def extract():
    opt = Config()
    t.set_grad_enabled(False)
    dataloader = get_loader(opt)
    results = t.Tensor(len(dataloader.dataset), 2048).fill_(0)
    batch_size = opt.batch_size

    resnet50 = tv.models.resnet50(pretrained=True)
    del resnet50.fc
    resnet50.fc = lambda x:x
    if opt.use_gpu:
        resnet50.cuda()

    for ii, (imgs, indexs) in tqdm.tqdm(enumerate(dataloader)):
        assert indexs[0] == batch_size * ii
        if opt.use_gpu:
            imgs = imgs.cuda()
        features = resnet50(imgs)
        results[batch_size*ii : batch_size*(ii+1),:] = features.data.cpu()

    t.save(results, 'results.pth')
```

- 注意这个地方是 将预训练模型中的模型拿来改一改就可以直接用来提取特征了
- 这里由于图片后面要与caption 一一对应，所以就不能够打乱顺序
- 保险起见，这里将梯度下降的按钮关掉

下面就是处理模型的时候咯

### 模型处理

```python
import torch as t
import torchvision as tv
from utils.beam_search import CaptionGenerator
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence
import time

class CaptionModel(nn.Module):
    def __init__(self, opt, word2ix, ix2word):
        super(CaptionModel, self).__init__()
        self.ix2word = ix2word
        self.word2ix = word2ix
        self.opt = opt
        self.fc = nn.Linear(2048, opt.rnn_hidden)

        self.rnn = nn.LSTM(opt.embedding_dim, opt.rnn_hidden, num_layers=opt.num_layers)
        self.classifier = nn.Linear(opt.rnn_hidden, len(word2ix))
        #  其的参数为 所有词语以及词语的词向量
        self.embedding = nn.Embedding(len(word2ix), opt.embedding_dim)

    def forward(self, img_feats, captions, lengths):
        # 将相应的图片解释加入到256维的词向量
        # seq * batch_size * word_vec
        embeddings = self.embedding(captions)
        # 将图片根据全链接层得到256维的向量
        # 1 * batch_size * 256
        img_feats = self.fc(img_feats).unsqueeze(0)
        # 这里直接将图片的信息直接看作成 第一个词的词向量
        # 记住cat的作用是将tuple或者list中的tensor链接在一起
        embeddings = t.cat([img_feats, embeddings], 0)

        pack_embeddings = pack_padded_sequence(embeddings, lengths)
        output, state = self.rnn(pack_embeddings)
        pred = self.classifier(output[0])
        return pred, state

    def generate(self, img, eos_token='</EOS>', beam_size=3, max_caption_length=30,
                 length_normalization_factor=0.0):
        cap_gen = CaptionGenerator(embedder=self.embedding,
                                   rnn=self.rnn,
                                   classifier=self.classifier,
                                   eos_id=self.word2ix[eos_token],
                                   beam_size=beam_size,
                                   max_caption_length=max_caption_length,
                                   length_normalization_factor=length_normalization_factor)

        if next(self.parameters()).is_cuda:
            img = img.cuda()
        # img.size = 1 * 2048
        img = img.unsqueeze(0)
        # img.size = 1 * 1 * 2048
        img = self.fc(img).unsqueeze(0)
        # img.size = 1 * 1 * 256
        sentences, score = cap_gen.beam_search(img)
        sentences = [sent for sent in sentences]
        res = sentences[score.index(max(score))]
        del res[-1]
        res = ''.join([self.ix2word[ii.item()] for ii in res]) + u'。'
        return res

    def save(self, path=None, **kwargs):
        if path is None:
            path = '{prefix}_{time}'.format(prefix=self.opt.prefix,
                                            time=time.strftime('%m%d_%H%M'))
        states = self.states()
        states.update(kwargs)
        t.save(states, path)
        return path

    def load(self, path, load_opt=False):
        data = t.load(path, map_location=lambda s, l: s)
        state_dict = data['state_dict']
        self.load_state_dict(state_dict)

        if load_opt:
            for k, v in data['opt'].items():
                setattr(self.opt, k, v)

        return self

    def get_optimizer(self, lr):
        return t.optim.Adam(self.parameters(), lr=lr)

    # 将模型的一切进行一个封装
    def state(self):
        opt_state_dict = {
            attr: getattr(self.opt, attr)
            for attr in dir(self.opt)
            if not attr.startswith('__')
        }

        return {
            'state_dict':self.state_dict(),
            'opt': opt_state_dict
        }
```

- 直接将生成函数封装到模型类内部，后面好方便调试
- 这里全链接层是想将图片直接作为第一个词语来进入到RNN的模型中，但是RNN的模型是256，所以需要加上一个全链接层去转换以下，就相当于第一个词的词向量
- 这里用到了Beam Seach的 生成的时候帮助选择，“全局最优点 ”

utils 封装了一个visdom的封装类，另一个就是beam search 算法类了。

### Beam search 算法模块

```python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import torch as t
from torch.autograd import Variable
from torch.nn.functional import log_softmax
import heapq

class Caption(object):
    def __init__(self, sentence, state, logprob, score, metadata=None):
        self.sentence = sentence
        self.state = state
        self.logprob = logprob
        self.score = score
        self.metadata = metadata

    # 在 python3 上已经被移除了
    # 下面是新的写法，只需要写两个 小于或等于
    def __cmp__(self, other):
        assert isinstance(other, Caption)
        if self.score == other.score:
            return 0
        elif self.score < other.score:
            return -1
        else:
            return 1

    def __lt__(self, other):
        assert isinstance(other, Caption)
        return self.score < other.score

    def __eq__(self, other):
        assert isinstance(other, Caption)
        return self.score == other.score

class TopN(object):
    def __init__(self, n):
        self._n = n
        self._data = []

    def size(self):
        assert self._data is not None
        return len(self._data)

    def push(self, x):
        assert self._data is not None
        if len(self._data) < self._n:
            heapq.heappush(self._data, x)
        else:
            heapq.heappushpop(self._data, x)

    def extract(self, sort=False):
        assert self._data is not None
        data = self._data
        self._data = None
        if sort:
            data.sort(reverse=True)
        return data

    def reset(self):
        self._data = []

class CaptionGenerator(object):
    def __init__(self, embedder, rnn, classifier, eos_id, beam_size=3,
                 max_caption_length=20, length_normalization_factor=0.0):
        self.embedder = embedder
        self.rnn = rnn
        self.classifier = classifier
        self.eos_id = eos_id
        self.beam_size = beam_size
        self.max_caption_length = max_caption_length
        self.length_normalization_factor = length_normalization_factor

    def beam_search(self, rnn_input, initial_state=None):
        """Runs beam search caption generation on a single image.
        Args:
          initial_state: An initial state for the recurrent model
        Returns:
          A list of Caption sorted by descending score.
        """

        def get_topk_words(embeddings, state):
            output, new_states = self.rnn(embeddings, state)
            output = self.classifier(output.squeeze(0))
            logprobs = log_softmax(output, dim=1)
            logprobs, words = logprobs.topk(self.beam_size, 1)
            return words.data, logprobs.data, new_states

        partial_captions = TopN(self.beam_size)
        complete_captions = TopN(self.beam_size)

        words, logprobs, new_state = get_topk_words(rnn_input, initial_state)
        for k in range(self.beam_size):
            cap = Caption(
                sentence=[words[0, k]],
                state=new_state,
                logprob=logprobs[0, k],
                score=logprobs[0, k])
            partial_captions.push(cap)

        for _ in range(self.max_caption_length - 1):
            partial_captions_list = partial_captions.extract()
            partial_captions.reset()

            input_feed = t.LongTensor([c.sentence[-1] for c in partial_captions_list])
            if rnn_input.is_cuda:
                input_feed = input_feed.cuda()

            input_feed.detach_()
            state_feed = [c.state for c in partial_captions_list]

            # 这个地方可以重点关注一下
            if isinstance(state_feed[0], tuple):
                # 这个地方为什么会用到 t.cat
                state_feed_h, state_feed_c = zip(*state_feed)
                state_feed = (t.cat(state_feed_h, 1),
                              t.cat(state_feed_c, 1))
            else:
                state_feed = t.cat(state_feed, 1)

            embeddings = self.embedder(input_feed).view(1, len(input_feed), -1)
            words, logprobs, new_states = get_topk_words(embeddings, state_feed)

            for i, partial_caption in enumerate(partial_captions_list):
                if isinstance(new_states, tuple):
                    state = (new_states[0].narrow(1, i, 1),
                             new_states[1].narrow(1, i, 1))
                else:
                    state = new_states[i]

                for k in range(self.beam_size):
                    w = words[i, k]
                    sentence = partial_caption.sentence + [w]
                    logprob = partial_caption.logprob + logprobs[i, k]
                    score = logprob
                    if w == self.eos_id:
                        if self.length_normalization_factor > 0:
                            score /= len(sentence)**self.length_normalization_factor
                        beam = Caption(sentence, state, logprob, score)
                        complete_captions.push(beam)
                    else:
                        beam = Caption(sentence, state, logprob, score)
                        partial_captions.push(beam)
            if partial_captions.size() == 0:
                break
        if not complete_captions.size():
            complete_captions = partial_captions

        caps = complete_captions.extract(sort=True)

        return [c.sentence for c in caps], [c.score for c in caps]
```

- 基于优先队列的堆实现的，注意一下这里py3之后的版本不通用的比较器
- **上面说重点关注的地方有时间去看看，在选择数据之后的操作，弄不清楚。**

### visdom封装模块

```python
import visdom
import time
import torchvision as tv
import numpy as np

class Visualizer():
    def __init__(self, env='default', **kwargs):
        self.vis = visdom.Visdom(env=env, **kwargs)
        self.index = {}
        self.log_text = ''

    def reinit(self, env='default', **kwargs):
        self.vis = visdom.Visdom(env=env, **kwargs)
        return self

    def plot_many(self, d):
        for k, v in d.items():
            self.plot(k, v)

    def img_many(self, d):
        for k, v in d.items():
            self.img(k, v)

    def plot(self, name, y):
        x = self.index.get(name, 0)
        self.vis.line(Y=np.array([y]), X=np.array([x]),
                      win=name,
                      opts=dict(title=name),
                      update=None if x == 0 else 'append'
                      )
        self.index[name] = x + 1

    def img(self, name, img_, caption=None):
        if len(img_.size()) < 3:
            img_ = img_.cpu().unsqueeze(0)
        self.vis.image(img_.cpu(),
                       win=name,
                       opts=dict(title=name, caption=caption)
                       )

    def img_grid_many(self, d):
        for k, v in d.items():
            self.img_grid(k, v)

    def img_grid(self, name, input_3d):
        self.img(name, tv.utils.make_grid(
            input_3d.cpu()[0].unsqueeze(1).clamp(max=1, min=0)))

    def log(self, info, win='log_text'):
        self.log_text += ('[{time}] {info} <br>'.format(
            time=time.strftime('%m%d_%H%M%S'),
            info=info))
        self.vis.text(self.log_text, win=win)

    def __getattr__(self, name):
        return getattr(self.vis, name)
```

这个地方没什么好讲的，直接用就行了，工具而已

### 主模块和配置类

```python
class Config:
    caption_data_path = 'caption.pth'
    img_path = None

    img_feature_path = 'result.pth'
    scale_size = 300
    img_size = 224
    batch_size = 8
    shuffle = True
    num_workers = 4
    rnn_hidden = 256
    embedding_dim = 256
    num_layers = 2
    share_embedding_weights = False

    prefix = 'checkpoints/caption'
    env='caption'
    plot_every=10
    debug_file='/tmp/debug'

    model_ckpt = "ImageCaption"
    lr = 1e-3
    use_gpu = False
    epoch = 1

    test_img = 'example.jpeg'
    test_prefix = 'img/'
```

```python
import torch as t
import os
import torchvision as tv
from torchnet import meter
import tqdm
import ipdb
import fire
from torch.nn.utils.rnn import pack_padded_sequence
from model import CaptionModel
from config import Config
from utils.visualize import Visualizer
from data import get_dataloader
from PIL import Image

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def generate(**kwargs):
    opt = Config()
    for k, v in kwargs.items():
        setattr(opt, k, v)
    device=t.device('cuda') if opt.use_gpu else t.device('cpu')
    data = t.load(opt.caption_data_path, map_location=lambda s, l: s)
    word2ix, ix2word = data['word2ix'], data['ix2word']

    normalize = tv.transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    transforms = tv.transforms.Compose([
        tv.transforms.Resize(opt.scale_size),
        tv.transforms.CenterCrop(opt.img_size),
        tv.transforms.ToTensor(),
        normalize
    ])

    img = Image.open(opt.test_prefix + opt.test_img)
    img = transforms(img).unsqueeze(0)

    # 用resnet50来提取图片特征
    resnet50 = tv.models.resnet50(False).eval()
    resnet50.load_state_dict(t.load("checkpoints/resnet50-19c8e357.pth"))
    del resnet50.fc
    resnet50.fc = lambda x: x
    resnet50.to(device)
    img = img.to(device)
    img_feats = resnet50(img).detach()

    # Caption模型
    model = CaptionModel(opt, word2ix, ix2word)
    model = model.load(opt.model_ckpt).eval()
    model.to(device)

    results = model.generate(img_feats.data[0])
    print(results)

def train(**kwargs):
    opt = Config()
    for k, v in kwargs.items():
        setattr(opt, k, v)
    device=t.device('cuda') if opt.use_gpu else t.device('cpu')

    opt.caption_data_path = 'caption.pth'  # 原始数据
    opt.test_img = ''  # 输入图片
    # 数据
    vis = Visualizer(env=opt.env)
    dataloader = get_dataloader(opt)
    _data = dataloader.dataset._data
    word2ix, ix2word = _data['word2ix'], _data['ix2word']
    # 模型
    model = CaptionModel(opt, word2ix, ix2word)
    if opt.model_ckpt:
        model.load(opt.model_ckpt)
    optimizer = model.get_optimizer(opt.lr)
    criterion = t.nn.CrossEntropyLoss()
    model.to(device)
    # 统计
    loss_meter = meter.AverageValueMeter()

    for epoch in range(opt.epoch):
        loss_meter.reset()
        for ii, (imgs, (captions, lengths), indexes) in tqdm.tqdm(enumerate(dataloader)):
            # 训练
            optimizer.zero_grad()
            imgs = imgs.to(device)
            captions = captions.to(device)
            input_captions = captions[:-1]
            target_captions = pack_padded_sequence(captions, lengths)[0]
            score, _ = model(imgs, input_captions, lengths)
            loss = criterion(score, target_captions)
            loss.backward()
            optimizer.step()
            loss_meter.add(loss.item())

            # 可视化
            if (ii + 1) % opt.plot_every == 0:
                if os.path.exists(opt.debug_file):
                    ipdb.set_trace()

                vis.plot('loss', loss_meter.value()[0])

                # 可视化原始图片 + 可视化人工的描述语句
                raw_img = _data['ix2id'][indexes[0]]
                img_path = opt.img_path + raw_img
                raw_img = Image.open(img_path).convert('RGB')
                raw_img = tv.transforms.ToTensor()(raw_img)

                raw_caption = captions.data[:, 0]
                raw_caption = ''.join([_data['ix2word'][ii] for ii in raw_caption])
                vis.text(raw_caption, u'raw_caption')
                vis.img('raw', raw_img, caption=raw_caption)

                # 可视化网络生成的描述语句
                results = model.generate(imgs.data[0])
                vis.text('</br>'.join(results), u'caption')
        model.save()

if __name__ == '__main__':
    fire.Fire()
```

- pack_padded_sequence 这里有一个这样的包装，是自动为你封装好数据的长短，它不仅保证长度相同，并且在内部有优化加速。直接防止padding也加入到了模型中去计算。

**花时间深入了解以下 beam search**
