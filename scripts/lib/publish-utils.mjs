/**
 * 发布流程共用工具。
 *
 * 这里只放确定性逻辑：路径校验、文件哈希、frontmatter 读取、dist 路由核对。
 * 内容判断仍由人（或模型）在 prepare 摘要里完成。
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const MANIFEST_PATH = join(ROOT, '.astro/blog-publish-plan.json');
export const REPO_SLUG = 'CrazyFnOption/CrazyFnOption.github.io';
export const SITE_URL = 'https://crazyfnoption.github.io';
export const BRANCH = 'master';

/** 这些目录永远不能进入发布清单。 */
const FORBIDDEN_PREFIXES = ['node_modules/', 'dist/', '.astro/', '.git/'];

export function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

export function checkNodeVersion() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) {
    fail(`需要 Node >= 22.12，当前是 ${process.versions.node}。请把 Node 22 放到 PATH 前面。`);
  }
}

/** 运行 git 并捕获输出；失败默认直接终止。 */
export function git(args, { allowFail = false, trim = true } = {}) {
  try {
    const output = execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return trim ? output.trim() : output;
  } catch (error) {
    if (allowFail) return null;
    const detail = error.stderr?.toString().trim() || error.message;
    fail(`git ${args.join(' ')} 失败：${detail}`);
  }
}

/** 运行 git，把输出直接给用户看（用于 push 这类需要进度输出的命令）。 */
export function gitRun(args) {
  execFileSync('git', args, { cwd: ROOT, stdio: 'inherit' });
}

export function toRelative(absPath) {
  return relative(ROOT, absPath).split(sep).join('/');
}

export function sha256File(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

/**
 * 把用户传进来的路径解析成仓库内的相对路径，并拒绝目录和生成目录。
 */
export function resolvePublishPath(input) {
  const absPath = resolve(ROOT, input);
  if (absPath !== ROOT && !absPath.startsWith(ROOT + sep)) {
    fail(`路径不在仓库内：${input}`);
  }

  const relPath = toRelative(absPath);
  if (FORBIDDEN_PREFIXES.some((prefix) => relPath.startsWith(prefix))) {
    fail(`不能发布生成目录或依赖目录：${relPath}`);
  }
  if (existsSync(absPath) && statSync(absPath).isDirectory()) {
    fail(`只接受文件，不接受目录：${relPath}`);
  }
  return { absPath, relPath };
}

export function walkFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function unquote(value) {
  const text = value.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

/** 只提取发布检查需要的字段；schema 校验仍由 Astro 构建负责。 */
function readFrontmatterFields(absPath) {
  const text = readFileSync(absPath, 'utf8');
  const block = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!block) fail(`${toRelative(absPath)} 没有可识别的 frontmatter`);

  const fields = {};
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (match) fields[match[1]] = unquote(match[2]);
  }
  return fields;
}

/**
 * 从文章 frontmatter 推导路由，并与 dist 实际产物逐篇核对。
 *
 * 归档文章也必须有产物（直链仍可访问），所以这里不区分 archived。
 */
export function collectPostRoutes() {
  const postsDir = join(ROOT, 'src/content/posts');
  if (!existsSync(postsDir)) fail('找不到 src/content/posts');

  const files = walkFiles(postsDir).filter((file) => file.endsWith('.md'));
  const posts = files.map((file) => {
    const fields = readFrontmatterFields(file);
    const date = fields.date ?? '';
    const slug = fields.slug ?? '';

    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) fail(`${toRelative(file)} 的 date 无法解析：${date || '(缺失)'}`);
    if (!slug) fail(`${toRelative(file)} 缺少 slug`);

    const [, year, month, day] = dateMatch;
    return {
      file: toRelative(file),
      title: fields.title ?? '',
      archived: fields.archived === 'true',
      route: `/${year}/${month}/${day}/${slug}/`,
    };
  });

  const seen = new Map();
  for (const post of posts) {
    const other = seen.get(post.route);
    if (other) fail(`路由重复：${post.route}\n  ${other}\n  ${post.file}`);
    seen.set(post.route, post.file);
  }

  return posts;
}

/** 核对每篇文章在 dist 里都有 index.html。 */
export function verifyBuiltRoutes(posts) {
  const missing = posts.filter(
    (post) => !existsSync(join(ROOT, 'dist', post.route.slice(1), 'index.html')),
  );
  if (missing.length) {
    const lines = missing.slice(0, 10).map((post) => `  ${post.route}  ← ${post.file}`);
    fail(`构建产物缺少 ${missing.length} 条文章路由：\n${lines.join('\n')}`);
  }

  const requiredPages = [
    'index.html',
    'archives/index.html',
    'tags/index.html',
    'categories/index.html',
    'about/index.html',
    'rss.xml',
  ];
  const missingPages = requiredPages.filter((page) => !existsSync(join(ROOT, 'dist', page)));
  if (missingPages.length) fail(`构建产物缺少页面：${missingPages.join(', ')}`);
}
