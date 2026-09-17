import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * 取文章列表，默认**不含归档**。
 *
 * 归档文章（旧站的 Effective C++ 条款系列）不进首页列表、归档页与 sitemap，
 * 但直链仍然可访问 —— 见 src/pages/[year]/[month]/[day]/[slug].astro。
 * 排序必须显式做：Astro 生成的集合顺序是不确定的。
 */
export async function getPosts(includeArchived = false): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) =>
    includeArchived ? true : !data.archived,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 按年份分组，供归档页使用。年份倒序，年内日期倒序。 */
export function groupByYear(posts: Post[]): Array<[number, Post[]]> {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.date.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/** 统计分类及其文章数，按数量倒序。 */
export function collectCategories(posts: Post[]): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const c of p.data.categories) map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** 统计标签及其文章数，按数量倒序。 */
export function collectTags(posts: Post[]): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * 从正文生成摘要。旧站文章大多没有独立的 description 字段，
 * 缺失时截取正文纯文本前 N 字。
 */
export function excerptOf(post: Post, maxLen = 140): string {
  if (post.data.description) return post.data.description;
  const raw = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')      // 代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/[#>*`_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return raw.length > maxLen ? raw.slice(0, maxLen) + '…' : raw;
}

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 把正文里的非内容部分（代码块、图片、链接语法）剥掉 */
function plainText(body: string): string {
  return (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_~|-]/g, ' ');
}

/**
 * 字数统计。
 *
 * 中文按**字符**计，英文按**单词**计 —— 直接用 `split(/\s+/)` 会把一整段中文
 * 当成一个「词」，数字会小得离谱。这是中文博客字数统计最常见的错误。
 */
export function wordCount(post: Post): number {
  const text = plainText(post.body);
  const cjk = (text.match(/[一-龥぀-ヿ]/g) ?? []).length;
  const words = (text.replace(/[一-龥぀-ヿ]/g, ' ').match(/[A-Za-z0-9]+/g) ?? [])
    .length;
  return cjk + words;
}

/** 阅读时长（分钟）。中文阅读速度按 350 字/分钟估算。 */
export function readingTime(post: Post): number {
  return Math.max(1, Math.round(wordCount(post) / 350));
}

/** 字数展示：超过 1000 用 k */
export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** 从渲染后的标题列表生成目录树（最多两级，避免目录过长） */
export interface TocItem {
  depth: number;
  slug: string;
  text: string;
}

export function buildToc(headings: Array<{ depth: number; slug: string; text: string }>): TocItem[] {
  return headings
    .filter((h) => h.depth >= 2 && h.depth <= 4)
    .map((h) => ({ depth: h.depth, slug: h.slug, text: h.text }));
}
