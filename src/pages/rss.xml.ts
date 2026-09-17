import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, excerptOf } from '../lib/posts';
import { postPath, SITE } from '../site.config';

export async function GET(context: APIContext) {
  const posts = await getPosts(false);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: excerptOf(post, 200),
      link: postPath(post.data.date, post.data.slug),
      categories: [...post.data.categories, ...post.data.tags],
    })),
    customData: '<language>zh-cn</language>',
  });
}
