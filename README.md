# Magical Bean

王舒啸的个人博客源码。建于 2015 年，2026 年从 Hexo 迁移重建于 Astro。

- **线上**：https://crazyfnoption.github.io/
- **内容**：108 篇文章，2015–2020 年间写作，主题集中在算法与数据结构、机器学习与深度学习

## 技术栈

| | |
|---|---|
| 框架 | [Astro](https://astro.build) 7.x，静态输出 |
| 内容 | Markdown + frontmatter，由 Content Collections 做 schema 校验 |
| 搜索 | [Pagefind](https://pagefind.app)（构建期生成索引，纯静态全文检索） |
| 部署 | GitHub Actions → GitHub Pages |

文章是纯 Markdown 文件，与渲染框架解耦 —— 更换技术栈时内容可以直接搬走。

## 本地运行

需要 **Node ≥ 22.12.0**（Astro 7 的硬性要求）。

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/
```

> `npm run preview` 用的是 Astro 自带的简易静态服务器，**不解码中文 URL**，
> 中文标题的文章会 404。那不是站点问题，本地验证请用 `npm run dev`。

## 目录结构

```
src/
├── content/posts/       文章（纯 Markdown）
├── content.config.ts    文章 schema —— 字段写错会让构建直接失败
├── site.config.ts       站点标题、作者、导航、社交链接
├── layouts/ components/ 页面骨架与组件
├── lib/posts.ts         取文章、分组、统计、摘要、目录
├── pages/               路由
└── styles/global.css    全部样式（含亮/暗双主题变量）

public/                  静态资源；文章图片按**原路径**存放，URL 与旧站一致
scripts/                 迁移脚本与写作脚手架
docs/                    写作手册与维护笔记（见下）
```

### URL 结构

**与旧站逐字一致，这是硬约束** —— 旧外链与搜索引擎收录都指向它：

| 页面 | 路径 |
|---|---|
| 文章 | `/<年>/<月>/<日>/<slug>/` |
| 归档 | `/archives/` |
| 标签 / 分类 | `/tags/`、`/categories/` |
| 关于 | `/about/` |
| RSS | `/rss.xml` |

## 部署

推送到 `master` 即自动部署（`.github/workflows/deploy.yml`）：Actions 跑 `npm ci` → `npm run build`，产物上传为 Pages artifact。

**构建产物不入库** —— 仓库里永远只有源码。仓库的 Pages 源设置为 **GitHub Actions**（不是分支）。

## 文档

- **[写作与发布](docs/写作与发布.md)** —— 新增文章、修改简介、发布上线
- **[维护笔记](docs/维护笔记.md)** —— 迁移记录、设计决策、踩过的坑
