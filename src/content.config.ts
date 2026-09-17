import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 文章集合。
 *
 * 迁移自旧 Hexo 站（2015–2020，108 篇）。frontmatter 字段由
 * `scripts/extract-hexo.py` 从旧站渲染 HTML 反推生成。
 *
 * schema 是**校验**不是装饰：任何一篇 frontmatter 写错，构建直接失败。
 * 宁可构建失败，也不要静默产出一篇坏页面。
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),

    date: z.coerce.date(),

    /**
     * 旧站 URL 里的 slug。**必须有** —— 文章路由按
     * `/<年>/<月>/<日>/<slug>/` 生成，与旧站逐字一致，否则外链和
     * 搜索引擎收录全废。不能从文件名反推（slug 里本身含连字符）。
     */
    slug: z.string(),

    /** 分类，通常一个；用于归档页分组 */
    categories: z.array(z.string()).default([]),

    /** 标签，可多个；用于标签页与文章页底部 */
    tags: z.array(z.string()).default([]),

    /**
     * 归档：文章不删除、直链仍可访问，只是不出现在首页列表与归档页，
     * 也不进 sitemap。改回 false 即可重新放出。
     */
    archived: z.boolean().default(false),

    /** 可选摘要；缺省时由正文自动截取 */
    description: z.string().optional(),
  }),
});

export const collections = { posts };
