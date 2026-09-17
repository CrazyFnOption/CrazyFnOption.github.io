import rss from '@astrojs/rss';
import { marked } from 'marked';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { postPath, SITE } from '../site.config';

/**
 * 全文 RSS。
 *
 * 旧站只推摘要，读者必须跳回站内才能看全文。现在多数博客推全文 ——
 * 对订阅读者更友好，也是 RSS 本来的用法。
 *
 * 注意：图片用的是站内绝对路径（/2019/...），在阅读器里会 404，
 * 故转成绝对 URL 再输出。
 */
export async function GET(context: APIContext) {
  const posts = await getPosts(false);
  const site = (context.site ?? SITE.url).toString().replace(/\/$/, '');

  const items = await Promise.all(
    posts.map(async (post) => {
      const html = await marked.parse(post.body ?? '');
      // 站内绝对路径 → 完整 URL，否则阅读器里图片全挂
      const absolute = html.replace(
        /(src|href)="\/([^"]*)"/g,
        (_m, attr, rest) => `${attr}="${site}/${rest}"`,
      );

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description ?? post.data.title,
        link: postPath(post.data.date, post.data.slug),
        categories: [...post.data.categories, ...post.data.tags],
        content: absolute,
      };
    }),
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    items,
    customData: '<language>zh-cn</language>',
  });
}
