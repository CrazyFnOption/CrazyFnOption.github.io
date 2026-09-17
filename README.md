# Magical Bean — 个人博客

王舒啸的个人博客源码。迁移自 2015 年建立的 Hexo 站，2026-09-17 重建于 Astro。

- **线上地址**：https://crazyfnoption.github.io/
- **仓库**：`CrazyFnOption/CrazyFnOption.github.io`（源码即部署源，构建产物不入库）

---

## 为什么重建

旧站用 Hexo 3.9.0 + NexT 主题，最后一次部署停在 2021-01-06。

**出问题的地方**：GitHub 仓库里只有 `hexo deploy` 推上去的**渲染产物**，源码目录 `~/user_blog` 后来从本机消失了 —— 也就是说，**源码丢了，只剩渲染结果**。2026 年重建时，只能从渲染后的 HTML 反推 Markdown。

**这次的结构保证不会再重演**：文章以纯 Markdown 存在本仓库，GitHub Actions 直接构建发布到 Pages，**构建产物不提交**。仓库里永远只有源码。

---

## 本地开发

### 环境要求

**Node ≥ 22.12.0**（Astro 7 的硬性要求）。

本机系统 Node 是 20.x（上面挂着别的工具），**不要升级它**。已另装 keg-only 的 `node@22`：

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

### 命令

```bash
npm install          # 装依赖（走 npmmirror，见 .npmrc）
npm run dev          # 本地开发服务器
npm run build        # 构建到 dist/
npm run preview      # 预览构建结果
```

---

## 目录结构

```
src/
├── content/posts/       # 全部文章，纯 Markdown + frontmatter
├── content.config.ts    # 文章 schema（字段写错会直接构建失败）
├── site.config.ts       # 站点标题、作者、菜单、URL
├── layouts/             # 页面骨架
├── components/          # 侧栏、文章列表项
├── lib/posts.ts         # 取文章、分组、统计、摘要
├── pages/               # 路由（见下）
└── styles/global.css    # 全部样式（复刻旧站 NexT Mist 配色）

public/                  # 静态资源，旧文图片按**原路径**存放
scripts/
├── extract-hexo.py      # 从旧站渲染 HTML 反推 Markdown（一次性）
├── fetch-posts.py       # 从 CDN 拉旧站文章 HTML（一次性）
└── fetch-images.py      # 从 CDN 拉旧站图片（一次性）
```

### 路由与 URL

**URL 结构与旧站逐字一致**，这是硬约束 —— 旧外链和搜索引擎收录都指向它：

| 页面 | 路径 | 文件 |
|------|------|------|
| 首页 / 分页 | `/`、`/page/2/` | `pages/index.astro`、`pages/page/[page].astro` |
| **文章** | `/<年>/<月>/<日>/<slug>/` | `pages/[year]/[month]/[day]/[slug].astro` |
| 归档 | `/archives/` | `pages/archives.astro` |
| 标签 | `/tags/`、`/tags/<标签>/` | `pages/tags/` |
| 分类 | `/categories/`、`/categories/<分类>/` | `pages/categories/` |
| 关于 | `/about/` | `pages/about.astro` |
| RSS | `/rss.xml` | `pages/rss.xml.ts` |

改路由前先想清楚：**改了就是全站死链。**

---

## 日常使用（写文章 / 改简介 / 发布）

### 写一篇新文章

```bash
npm run new "文章标题"
npm run new "文章标题" -- --category 随笔 --tags 读书,随想
```

会在 `src/content/posts/` 下生成 frontmatter 正确的骨架，直接编辑正文即可。

可选参数：`--category <分类>`、`--tags a,b,c`、`--slug <自定义>`、`--date <YYYY-MM-DD>`、`--archived`。

> 命令会自动清洗文件名里的 `#`、空格、全角冒号等字符（这些会导致构建读不到文件），
> 但 **frontmatter 里的 `slug` 保持原样** —— 它决定文章 URL，不能随便动。

### 本地预览

```bash
npm run dev          # http://localhost:4321，改完自动刷新
```

> 注意：`npm run preview` 用的是 Astro 自带的简易静态服务器，**不解码中文 URL**，
> 中文标题的文章会 404。那**不是站点坏了**，别被误导。

### 发布

```bash
npm run publish -- "新增文章：XXX"
```

会**先本地构建校验**（frontmatter 写错会在这里被拦住，而不是推上去让 Actions 失败），
再提交推送。Actions 自动部署，约 1-2 分钟上线。

### 改简介 / 站点信息

都在 **`src/site.config.ts`** 一个文件里：

| 想改什么 | 改哪一行 |
|---|---|
| 侧栏那行简介 | `bio:` |
| 站点标题（左上角） | `title:` |
| SEO 描述 | `description:` |
| 作者名 | `author:` |
| 头像 | `avatar:`（换 `public/images/` 下的图） |
| 导航菜单 | `menu:` —— **当前刻意只留 4 项**，加减前先看下面的说明 |
| 社交链接 | `social:` |
| 友情链接 | `links:` |

### frontmatter 字段

```markdown
---
title: "文章标题"          # 必填
date: 2026-09-18           # 必填
slug: "my-new-post"        # 必填，决定 URL，尽量别用中文标点
categories: ["随笔"]        # 可选
tags: ["标签A", "标签B"]     # 可选
archived: false            # 可选，true 则不进列表但直链可访
description: "摘要"         # 可选，缺省时自动截取正文
---
```

**`title` / `date` / `slug` 是必填的** —— 缺了会让 schema 校验失败、构建直接报错。
用 `npm run new` 生成就不会漏。

`archived: true` 的文章不出现在首页、归档页和 sitemap，但直链仍可访问。
旧站的 27 篇 Effective C++ 条款笔记就是这样处理的。

图片放 `public/` 下，用根路径引用：`![说明](/images/foo.png)`。

### ⚠️ 改导航前必读

导航**刻意只有 4 项**（首页 / 归档 / 标签 / 关于），这是有意的设计决定：

- `Sitemap` 是给爬虫的 XML，在页脚，不要放回导航
- `Categories` 与 `Tags` 内容严重重叠（分类 6 组、标签 67 个），页面保留但**不占导航位**
- 首页没有 H1（只有卡片列表）是**有意为之** —— 它和内页共用同一套容器语言，
  差异读起来是设计而非遗漏，**别给它加标题**

---

## 部署

推送到 `master` 分支即自动部署（`.github/workflows/deploy.yml`）：

1. `npm ci` → `npm run build`
2. 产物上传为 Pages artifact
3. 部署到 GitHub Pages

仓库的 Pages 源设置为 **GitHub Actions**（不是分支）。

---

## 本次迁移的记录

迁移脚本与踩过的坑见 `scripts/extract-hexo.py` 顶部的注释。三条关键教训：

1. **提取正文不能用正则** —— `articleBody` 是嵌套 div，正则必然出错。实测同一篇用正则抽出 0 字、用 HTML 解析器抽出 5995 字。
2. **必须有零丢失断言** —— 脚本内置校验，任一篇异常立即中止。静默丢文章是这类迁移最严重的失败模式。
3. **CDN 比 git 协议快得多** —— 迁移当天 `git clone` 15 KB/s、codeload 同样龟速，而 GitHub Pages 的 Fastly CDN 稳定可用，108 篇 74 秒拉完。

`npm` 官方源在本机不可达（实测超时），故 `.npmrc` 指向国内镜像。
