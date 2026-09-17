#!/usr/bin/env node
/**
 * 新建文章脚手架。
 *
 *   npm run new "文章标题"
 *   npm run new "文章标题" -- --category 随笔 --tags 读书,随想
 *
 * 作用：按 `content.config.ts` 的 schema 生成一份 frontmatter 正确的骨架，
 * 省得手写出错 —— schema 校验不过的话，构建会直接失败。
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url).pathname;

// ---- 解析参数：第一个非选项参数是标题，其余是 --key value ----
const argv = process.argv.slice(2);
const title = argv.find((a) => !a.startsWith('--'));

function opt(name, fallback = '') {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

if (!title) {
  console.error(`
用法：
  npm run new "文章标题"
  npm run new "文章标题" -- --category 随笔 --tags 读书,随想

可选：
  --category <分类>     单个分类，留空则不设
  --tags <a,b,c>        逗号分隔
  --slug <自定义slug>   默认取标题
  --date <YYYY-MM-DD>   默认今天
  --archived            标记为归档（不在列表显示，直链可访问）
`);
  process.exit(1);
}

/**
 * 文件名清洗：与迁移脚本 extract-hexo.py 的 safe_filename 保持一致。
 * `#` 会被当成 URL 片段符导致构建读不到文件；空格、全角冒号同理要换掉。
 * 注意：**只清洗文件名，frontmatter 里的 slug 保持原样**（它决定 URL）。
 */
function safeFilename(s) {
  return s
    .replace(/[#/\\]/g, '-')
    .replace(/[：:]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const slug = opt('slug', title);
const date = opt('date', new Date().toISOString().slice(0, 10));
const category = opt('category');
const tags = opt('tags')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);
const archived = argv.includes('--archived');

const yamlStr = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

const fm = ['---', `title: ${yamlStr(title)}`, `date: ${date}`, `slug: ${yamlStr(slug)}`];
if (category) fm.push(`categories: [${yamlStr(category)}]`);
if (tags.length) fm.push(`tags: [${tags.map(yamlStr).join(', ')}]`);
if (archived) fm.push('archived: true');
fm.push('---');

// ---- 文件名：日期 + 清洗过的 slug；重名则加序号 ----
const base = `${date}-${safeFilename(slug)}`;
let filename = `${base}.md`;
let n = 2;
while (existsSync(join(POSTS_DIR, filename))) {
  filename = `${base}-${n++}.md`;
}

const body = `

正文从这里开始……

## 小标题

- 列表项

\`\`\`python
# 代码块会自动带语言标签和复制按钮
print("hello")
\`\`\`
`;

writeFileSync(join(POSTS_DIR, filename), fm.join('\n') + '\n' + body, 'utf-8');

console.log(`
✅ 已创建 ${filename}

   路径  src/content/posts/${filename}
   网址  /${date.replaceAll('-', '/')}/${slug}/

下一步：
   1. 写正文          直接编辑这个文件
   2. 本地预览        npm run dev      （改完自动刷新）
   3. 发布            npm run publish  （自动提交并推送，Actions 会部署）
`);

// 顺带列出当前分类，省得写错导致分类页多出一个孤零零的入口
try {
  const cats = new Set();
  for (const f of readdirSync(POSTS_DIR).filter((n) => n.endsWith('.md'))) {
    const m = /^categories: \[(.*)\]$/m.exec(readFileSync(join(POSTS_DIR, f), 'utf-8'));
    if (m) {
      for (const c of m[1].split(',')) {
        const clean = c.replace(/"/g, '').trim();
        if (clean) cats.add(clean);
      }
    }
  }
  if (cats.size) console.log(`   现有分类：${[...cats].join('、')}\n`);
} catch {
  /* 列不出来不影响主流程 */
}
