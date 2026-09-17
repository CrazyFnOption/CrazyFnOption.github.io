// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/site.config.ts';

// https://astro.build/config
export default defineConfig({
  /**
   * 站点地址。sitemap、RSS 与 canonical 链接都依赖它，
   * 必须与 GitHub Pages 实际地址一致。
   */
  site: SITE.url,

  /**
   * 静态输出 + 尾斜杠。旧站 URL 形如 /2020/03/15/<slug>/（带尾斜杠），
   * 保持 trailingSlash: 'always' 才能让新旧链接完全对应。
   */
  trailingSlash: 'always',
  build: { format: 'directory' },

  integrations: [sitemap()],
});
