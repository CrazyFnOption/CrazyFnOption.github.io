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

## 写新文章

在 `src/content/posts/` 下建 `.md` 文件，frontmatter 必填 `title`、`date`、`slug`：

```markdown
---
title: "文章标题"
date: 2026-09-18
slug: "my-new-post"
categories: ["随笔"]
tags: ["标签A", "标签B"]
archived: false
---

正文……
```

`archived: true` 的文章**不出现在首页列表、归档页和 sitemap**，但直链仍可访问。
旧站的 27 篇 Effective C++ 条款笔记就是这样处理的（内容薄、同质化重）。

图片放 `public/` 下，用根路径引用：`![说明](/images/foo.png)`。

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
