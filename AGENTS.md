## Development

已确认的外观（2026-10-18）：A 布局＋「纸感手记」。保持宽正文与单一右侧栏；目录和作者信息共享侧栏，窄屏目录默认折叠。具体设计约束见 `docs/维护笔记.md`。 作者简介统一左对齐，头像与名字横排、统计弱化；友情链接独立分区，首页（含分页）与文章页作者面板不展示友情链接。先给方案、用户确认后实施；实施完成后给可直接打开的真实本地预览，推送仍逐次确认。

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
