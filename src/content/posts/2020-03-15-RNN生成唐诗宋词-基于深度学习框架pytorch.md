---
title: "RNN生成唐诗宋词-基于深度学习框架pytorch"
date: 2020-03-15
slug: "RNN生成唐诗宋词-基于深度学习框架pytorch"
categories: ["机器学习"]
tags: ["深度学习", "Pytorch", "RNN"]
---

这次是基于RNN深度学习模型应用的一个小模型，通过训练大量的唐诗宋词的例子，将学习其中内部逻辑，并且根据给出的开头诗词和风格诗句，来生成自己的诗歌，并且还有是否生成藏头诗的限定哦

还是按照相应的步骤一次次的来

### 数据总揽以及处理

这里有两种数据，一种是没有经过处理的原始数据，也就是 全部都是诗歌文字，没有半点处理。  
第二种就是经过处理之后的数据。

这里不做要求了解处理数据的内容，因为不属于模型构建的内容，所以可以跳过哦。

处理的过程分为以下几种

- 给每句诗词将开头结尾都加上特定的标识符号。
- 将诗句的作者，题目，作为该诗词的属性，不作为诗词的内容展览出。
- 注意诗词内容中，不仅仅是文字，还有标点符号的编码都需要修改以下

下面贴出处理数据的代码：

```python
import sys
import os
import json
import re
import numpy as np

def _parseRawData(author=None, constrain=None, src='./chinese-poetry/json/simplified', category="poet.tang"):
    """
    code from https://github.com/justdark/pytorch-poetry-gen/blob/master/dataHandler.py
    处理json文件，返回诗歌内容
    @param: author： 作者名字
    @param: constrain: 长度限制
    @param: src: json 文件存放路径
    @param: category: 类别，有poet.song 和 poet.tang

    返回 data：list
        ['床前明月光，疑是地上霜，举头望明月，低头思故乡。',
         '一去二三里，烟村四五家，亭台六七座，八九十支花。',
        .........
        ]
    """

    def sentenceParse(para):
        # para 形如 "-181-村橋路不端，數里就迴湍。積壤連涇脉，高林上笋竿。早嘗甘蔗淡，
        # 生摘琵琶酸。（「琵琶」，嚴壽澄校《張祜詩集》云：疑「枇杷」之誤。）
        # 好是去塵俗，煙花長一欄。"
        result, number = re.subn(u"（.*）", "", para)
        result, number = re.subn(u"{.*}", "", result)
        result, number = re.subn(u"《.*》", "", result)
        result, number = re.subn(u"《.*》", "", result)
        result, number = re.subn(u"[\]\[]", "", result)
        r = ""
        for s in result:
            if s not in set('0123456789-'):
                r += s
        r, number = re.subn(u"。。", u"。", r)
        return r

    def handleJson(file):
        # print file
        rst = []
        data = json.loads(open(file).read())
        for poetry in data:
            pdata = ""
            if (author is not None and poetry.get("author") != author):
                continue
            p = poetry.get("paragraphs")
            flag = False
            for s in p:
                sp = re.split(u"[，！。]", s)
                for tr in sp:
                    if constrain is not None and len(tr) != constrain and len(tr) != 0:
                        flag = True
                        break
                    if flag:
                        break
            if flag:
                continue
            for sentence in poetry.get("paragraphs"):
                pdata += sentence
            pdata = sentenceParse(pdata)
            if pdata != "":
                rst.append(pdata)
        return rst

    data = []
    for filename in os.listdir(src):
        if filename.startswith(category):
            data.extend(handleJson(src + filename))
    return data

def pad_sequences(sequences,
                  maxlen=None,
                  dtype='int32',
                  padding='pre',
                  truncating='pre',
                  value=0.):
    """
    code from keras
    Pads each sequence to the same length (length of the longest sequence).
    If maxlen is provided, any sequence longer
    than maxlen is truncated to maxlen.
    Truncation happens off either the beginning (default) or
    the end of the sequence.
    Supports post-padding and pre-padding (default).
    Arguments:
        sequences: list of lists where each element is a sequence
        maxlen: int, maximum length
        dtype: type to cast the resulting sequence.
        padding: 'pre' or 'post', pad either before or after each sequence.
        truncating: 'pre' or 'post', remove values from sequences larger than
            maxlen either in the beginning or in the end of the sequence
        value: float, value to pad the sequences to the desired value.
    Returns:
        x: numpy array with dimensions (number_of_sequences, maxlen)
    Raises:
        ValueError: in case of invalid values for `truncating` or `padding`,
            or in case of invalid shape for a `sequences` entry.
    """
    if not hasattr(sequences, '__len__'):
        raise ValueError('`sequences` must be iterable.')
    lengths = []
    for x in sequences:
        if not hasattr(x, '__len__'):
            raise ValueError('`sequences` must be a list of iterables. '
                             'Found non-iterable: ' + str(x))
        lengths.append(len(x))

    num_samples = len(sequences)
    if maxlen is None:
        maxlen = np.max(lengths)

    # take the sample shape from the first non empty sequence
    # checking for consistency in the main loop below.
    sample_shape = tuple()
    for s in sequences:
        if len(s) > 0:  # pylint: disable=g-explicit-length-test
            sample_shape = np.asarray(s).shape[1:]
            break

    x = (np.ones((num_samples, maxlen) + sample_shape) * value).astype(dtype)
    for idx, s in enumerate(sequences):
        if not len(s):  # pylint: disable=g-explicit-length-test
            continue  # empty list/array was found
        if truncating == 'pre':
            trunc = s[-maxlen:]  # pylint: disable=invalid-unary-operand-type
        elif truncating == 'post':
            trunc = s[:maxlen]
        else:
            raise ValueError('Truncating type "%s" not understood' % truncating)

        # check `trunc` has expected shape
        trunc = np.asarray(trunc, dtype=dtype)
        if trunc.shape[1:] != sample_shape:
            raise ValueError(
                'Shape of sample %s of sequence at position %s is different from '
                'expected shape %s'
                % (trunc.shape[1:], idx, sample_shape))

        if padding == 'post':
            x[idx, :len(trunc)] = trunc
        elif padding == 'pre':
            x[idx, -len(trunc):] = trunc
        else:
            raise ValueError('Padding type "%s" not understood' % padding)
    return x

def get_data(opt):
    """
    @param opt 配置选项 Config对象
    @return word2ix: dict,每个字对应的序号，形如u'月'->100
    @return ix2word: dict,每个序号对应的字，形如'100'->u'月'
    @return data: numpy数组，每一行是一首诗对应的字的下标
    """
    if os.path.exists(opt.pickle_path):
        data = np.load(opt.pickle_path, allow_pickle=True)
        data, word2ix, ix2word = data['data'], data['word2ix'].item(), data['ix2word'].item()
        return data, word2ix, ix2word

    # 如果没有处理好的二进制文件，则处理原始的json文件
    data = _parseRawData(opt.author, opt.constrain, opt.data_path, opt.category)
    words = {_word for _sentence in data for _word in _sentence}
    word2ix = {_word: _ix for _ix, _word in enumerate(words)}
    word2ix['<EOP>'] = len(word2ix)  # 终止标识符
    word2ix['<START>'] = len(word2ix)  # 起始标识符
    word2ix['</s>'] = len(word2ix)  # 空格
    ix2word = {_ix: _word for _word, _ix in list(word2ix.items())}

    # 为每首诗歌加上起始符和终止符
    for i in range(len(data)):
        data[i] = ["<START>"] + list(data[i]) + ["<EOP>"]

    # 将每首诗歌保存的内容由‘字’变成‘数’
    # 形如[春,江,花,月,夜]变成[1,2,3,4,5]
    new_data = [[word2ix[_word] for _word in _sentence]
                for _sentence in data]

    # 诗歌长度不够opt.maxlen的在前面补空格，超过的，删除末尾的
    pad_data = pad_sequences(new_data,
                             maxlen=opt.maxlen,
                             padding='pre',
                             truncating='post',
                             value=len(word2ix) - 1)

    # 保存成二进制文件
    np.savez_compressed(opt.pickle_path,
                        data=pad_data,
                        word2ix=word2ix,
                        ix2word=ix2word)
    return pad_data, word2ix, ix2word
```

这里按照步骤详细的说明一下 处理生数据的过程：  
因为生图片格式为json，相当于一个大型字典，所以首先是要把这个大型数据进行一个处理。

- 首先分好相应的类别，比如，特定的作者，特定的朝代类别，并且提取出相应的内容，并且在遍历的过程中一步一步的检测，有没有字数限制，作者限制之类的。
- 然后对内容进行限制，这个时候就要用到特定的包 **re** 正则表达式的包，把所有的注释，所有一切稀奇古怪的字符全部删除替换掉。
- 将每一个字进行一个编号，放入不可以重复的set中，并且建立起相应的映射，并且在每一句诗词的开始与结尾都加上标识符号
- 给每一首诗的长度进行限制，多的截断，少的加上padding，并且直接变成一个numpy里的数据
- 不过这里我多了一个疑问，最后输出来的数据的形状是 batch_size *max_len* words_in_len ??? 我就没有懂，最后不就是最长max_len吗？

这个问题留到后面去解决，经过我过多的研究，我认为应该是代码错了，这个地方不应该去管每一句有多少词语的事情，明明一个二维数组，却变成了一个三维数组，真的有点搞笑

好了好长时间去看上面那个问题，结果确定了应该是错了的，编写这个代码的人 真的不用心呀

接下来 就到模型的构建了，唯一需要注意的是各个参数的设置

### 模型构建

```python
import torch as t
from torch import nn
from torch.nn import functional as F

class PoetModel(nn.Module):
    def __init__(self, vocab_size, word_vec, hidden_dim):
        super(PoetModel, self).__init__()
        # 之前一直不太理解这里的隐藏纬度是什么意思，后面就知道了用于描述状态的节点数
        self.hidden_dim = hidden_dim
        self.embeddings = nn.Embedding(vocab_size, word_vec)
        self.lstm = nn.LSTM(word_vec, self.hidden_dim, num_layers=2)
        self.linear1 = nn.Linear(self.hidden_dim, vocab_size)

    def forward(self, input, hidden=None):
        seq_len, batch_size = input.size()
        if hidden is None:
            h_0 = input.data.new(2, batch_size, self.hidden_dim).fill_(0).float()
            c_0 = input.data.new(2, batch_size, self.hidden_dim).fill_(0).float()
        else:
            h_0,c_0 = hidden
        embeds = self.embeddings(input)
        output, hidden = self.lstm(embeds, (h_0, c_0))
        output = self.linear1(output.view(seq_len * batch_size, -1))
        return output, hidden
```

三点注意：

- Embedding 过程介绍的是所有词语的个数和词向量的个数，这里的词向量是需要自己去学习的词向量
- lstm中的 hidden_dim 指的就是在这个模型中隐藏元的计算个数，后面num_layers就指的是模型层数咯
- 当时在写这个线性层数的时候，我也最终考虑了好久，线性层 x_feature 和 y_feature 可以直接这样写，最后输出的一定是m_batch * y_feature，这里就是所有的词语数，还有 这里的h0，c0需要保留，应该包含了记忆系数，或者是忘记系数。
- ho,co的形状必须是（num_layer， batch_size， hidden_dim（隐藏计算机元））

接下来便是主模块和处理类

### 主模块和处理类：

```python
class Config(object):
    pickle_path = 'data/tang.npz'
    author = None
    constrain = None
    category = 'poet.tang'
    lr = 1e-3
    weight_dacay = 1e-4
    use_gpu = False
    max_epoch = 251
    batch_size = 128
    maxlen = 125
    plot_erevy = 20
    env = 'poetry'
    max_gen_len = 200       # 生成诗歌的长度
    debug_file = '/tmp/debug'
    model_prefix = 'checkpoints/tang'

    acrostic = False
    model_path = 'checkpoints/tang_model'
    prefix_words = None
    start_words = None

opt = Config()
```

```python
import ipdb
import tqdm
import sys
import fire
import os
import torch as t
import torch.utils.data
from data import get_data
from model import PoetModel
from torch import nn
from utils import Visualizer
from torchnet import meter
from config import opt

def train(**kwargs):
    for k, v in kwargs.items():
        setattr(opt, k, v)
    opt.device = t.device('cuda') if opt.use_gpu else t.device('cpu')
    vis = Visualizer(env=opt.env)

    data, word2ix, ix2word = get_data(opt)
    data = t.from_numpy(data)
    dataloader = t.utils.data.DataLoader(data, batch_size=opt.batch_size, shuffle=True, num_workers=1)

    model = PoetModel(len(word2ix), 128, 256)
    optim = t.optim.Adam(model.parameters(), lr= opt.lr)
    criterion = nn.CrossEntropyLoss()

    if opt.model_path:
        model.load_state_dict(t.load(opt.model_path))
    model.to(opt.device)

    loss_meter = meter.AverageValueMeter()

    for epoch in range(opt.max_epoch):
        loss_meter.reset()
        for ii, data_ in tqdm.tqdm(enumerate(dataloader)):
            data_ = data_.long().transpose(1, 0).contiguous()
            data_ = data_.to(opt.device)
            optim.zero_grad()
            input_, target_ = data_[:-1, :], data_[1:,:]
            output_, _ = model(input_)
            loss = criterion(output_, target_.view(-1))
            loss.backward()
            optim.step()

            # 这里必须写上item() 因为生成的是Tensor类型，防止动态图的显存会炸
            loss_meter.add(loss.item())

            if (ii + 1) % opt.plot_erevy == 0:
                if os.path.exists(opt.debug_file):
                    ipdb.set_trace()

                vis.plot('loss', loss_meter.value()[0])
                poetrys = [[ix2word[_word] for _word in data_[:, _iii].tolist()]
                          for _iii in range(data_.shape[1])][:16]
                vis.text('</br>'.join([''.join(poetry) for poetry in poetrys]), win=u'origin_poem')

                gen_poetries = []
                #接下来就是验证 模型在训练过程中生成的诗词
                for word in list(u'春江花月夜凉如水'):
                    gen_poetry = ''.join(generate(model, word, ix2word, word2ix))
                    gen_poetries.append(gen_poetry)

                vis.text('</br>'.join([''.join(poetry) for poetry in gen_poetries]), win=u'gen_poem')

        t.save(model.state_dict(), '%s_%s.pth' %(opt.model_prefix, epoch))

def gen(**kwargs):
    for k, v in kwargs.items():
        setattr(opt, k, v)
    data, word2ix, ix2word = get_data(opt)
    device = t.device('cuda') if opt.use_gpu else t.device('cpu')
    model = PoetModel(len(word2ix), 128, 256)
    model.load_state_dict(t.load(opt.model_path, map_location= lambda s, _: s))
    model.to(device)

    # 处理字符串
    # 并且考虑到两个版本之间的差异，将其兼容了一下
    if sys.version_info.major  == 3:
        if opt.start_words.isprintable():
            start_words = opt.start_words
            prefix_words = opt.prefix_words
        else:
            start_words = opt.start_words.encode('ascii', 'surrogateescape').decode('utf8')
            prefix_words = opt.prefix_words.encode('ascii', 'surrogateescape').decode('utf8') if opt.prefix_words else None
    else:
        start_words = opt.start_words.decode('utf8')
        prefix_words = opt.prefix_words.decode('utf8') if opt.prefix_words else None

    start_words = opt.start_words.replace(',', u'，').replace('?', u'？').replace('.', u'。')
    gen_poetry = gen_acrostic if opt.acrostic else generate
    result = gen_poetry(model, start_words, ix2word, word2ix, prefix_words)
    print(''.join(result))

def generate(model, start_words, ix2word, word2ix, prefix_words= None):
    result = list(start_words)
    start_words_len = len(start_words)
    input = t.Tensor([word2ix['<START>']]).view(1,1).long()
    if opt.use_gpu : input = input.cuda()
    else: input = input.cpu()
    hidden = None

    if prefix_words is not None:
        for word in prefix_words:
            output, hidden = model(input, hidden)
            input = input.data.new([word2ix[word]]).view(1, 1)

    for i in range(opt.max_gen_len):
        output, hidden = model(input, hidden)
        if i < start_words_len:
            w = result[i]
            input = input.data.new([word2ix[w]]).view(1, 1)
        else:
            top_index = output.data[0].topk(1)[1][0].item()
            w = ix2word[top_index]
            result.append(w)
            input = input.data.new([top_index]).view(1, 1)
        if w == '<EOP>':
            del result[-1]
            break
    return result

def gen_acrostic(model, start_words, ix2word, word2ix, prefix_words= None):
    result = []
    start_word_len = len(start_words)
    input = (t.Tensor([word2ix['<START>']]).view(1, 1).long())
    if opt.use_gpu: input = input.cuda()
    hidden = None
    index = 0
    # 这里与前面相比 主要是多了一个 向前的词汇
    pre_word = '<START>'

    if prefix_words:
        for word in prefix_words:
            output, hidden = model(input, hidden)
            input = input.data.new([word2ix[word]]).view(1, 1)

    for i in range(opt.max_gen_len):
        output, hidden = model(input, hidden)
        top_index = output.data[0].topk(1)[1][0].item()
        w = ix2word[top_index]

        if pre_word in {u'。', u'！', '<START>'} :
            if index == start_word_len :
                # 这里就已经将藏头诗全部给用完了
                break
            else:
                w = start_words[index]
                index += 1
                input = (input.data.new([word2ix[w]])).view(1, 1)
        else:
            input = input.data.new([word2ix[w]]).view(1, 1)
        result.append(w)
        pre_word = w
    return result

if __name__ == '__main__':
    fire.Fire()
```

![](/2020/03/15/RNN生成唐诗宋词-基于深度学习框架pytorch/1.jpg)

三点需要总结

- 模型中的veb_size 指的集合中的词语，不是词向量，也不是所有的词语
- 上面的这些输入输出的参数形状一定要弄清楚
- python的encode 和 decode有点奇怪start_words.encode(‘ascii’, ‘surrogateescape’).decode(‘utf8’)
- 后面生成过程中input的形状一定要改成view，并且要实时注意更新，更新的前一个文字的值
- 后面使用的topk（n）返回n个元祖 值和index取出来要item
- 关于这里训练的原理，就是为了使预测的下一个值贴近真实的下一个值
- CrossEntropyLoss target只需要一个标量就行了，其的维度一定是和score的第一维度相同
