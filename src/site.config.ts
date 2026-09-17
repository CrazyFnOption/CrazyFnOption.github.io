/**
 * 站点配置。
 *
 * 这些值迁移自旧 Hexo 站（NexT 主题），**按旧站实际呈现逐项核对过**，
 * 避免迁移后站点标题/菜单/作者/友链发生变化。
 */

export const SITE = {
  /** 站点标题（旧站原名，勿随意改） */
  title: 'Magical Bean',
  description: '王舒啸的个人博客 —— 算法、机器学习、读书与成长记录',
  author: '五光君',
  /** 头像，取自旧站 /images/good.jpg */
  avatar: '/images/good.jpg',

  /** 侧栏一句话简介 */
  bio: '记录算法、机器学习与读书',

  /** 社交分享时的默认卡片图 */
  ogImage: '/images/good.jpg',

  /** 部署地址；sitemap 与 RSS 依赖它，必须与 GitHub Pages 实际地址一致 */
  url: 'https://crazyfnoption.github.io',

  /** 顶部横向菜单（旧站菜单顺序：Home / About / Tags / Categories / Archives / Sitemap） */
  menu: [
    { label: 'Home', href: '/', icon: 'fa-home' },
    { label: 'About', href: '/about/', icon: 'fa-user' },
    { label: 'Tags', href: '/tags/', icon: 'fa-tags' },
    { label: 'Categories', href: '/categories/', icon: 'fa-th' },
    { label: 'Archives', href: '/archives/', icon: 'fa-archive' },
    { label: 'Sitemap', href: '/sitemap-index.xml', icon: 'fa-sitemap' },
  ],

  /** 社交链接。侧栏渲染为图标按钮，label 同时作为 title 与无障碍标签 */
  social: [
    { label: 'GitHub', href: 'https://github.com/CrazyFnOption', icon: 'fa-github' },
    { label: 'E-Mail', href: 'mailto:wsx1128@outlook.com', icon: 'fa-envelope' },
    { label: 'RSS', href: '/rss.xml', icon: 'fa-rss' },
  ],

  /**
   * 友情链接（旧站侧栏「Links」区块）。
   * 注：旧站配置里「印记中文」指向的是 v2ex 地址，明显是笔误，
   * 这里改为其真实站点 docschina.org。
   */
  links: [
    { label: 'V2EX', href: 'https://www.v2ex.com/' },
    { label: '印记中文', href: 'https://docschina.org/' },
    { label: '掘金酱', href: 'http://e.xitu.io/' },
  ],
} as const;

/** 每页文章数（首页列表分页） */
export const POSTS_PER_PAGE = 10;

/**
 * 文章在站内的路径，**必须与旧站逐字一致**：
 *   /<年>/<月>/<日>/<slug>/
 * 旧外链与搜索引擎收录都指向这个结构，改了就是全站死链。
 */
export function postPath(date: Date, slug: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `/${y}/${m}/${d}/${slug}/`;
}
