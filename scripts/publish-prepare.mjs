#!/usr/bin/env node
/**
 * 发布第一步：固定待提交文件，构建并核对路由，生成可审阅的清单。
 *
 *   npm run publish:prepare -- <文件...>
 *
 * 只接收显式列出的文件，避免 `git add -A` 把无关改动一起带走。
 * 这一步不会提交、不会推送。
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import {
  BRANCH,
  MANIFEST_PATH,
  ROOT,
  checkNodeVersion,
  collectPostRoutes,
  fail,
  git,
  resolvePublishPath,
  sha256File,
  verifyBuiltRoutes,
} from './lib/publish-utils.mjs';

const USAGE = `
用法：
  npm run publish:prepare -- <文件...>

例：
  npm run publish:prepare -- src/content/posts/2026-10-20-foo.md public/images/foo.png

只列出本次要发布的文件；未列出的改动不会进入清单。
`;

checkNodeVersion();

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  if (args.length === 0) {
    const changes = git(['status', '--porcelain=v1', '--untracked-files=all'], { trim: false })
      .replace(/\n+$/, '');
    if (changes) {
      console.log('\n当前有改动的文件：');
      for (const line of changes.split('\n')) {
        const code = line.slice(0, 2).trim() || '??';
        console.log(` ${code.padStart(2)}  ${line.slice(3)}`);
      }
    } else {
      console.log('\n当前没有未提交的改动。');
    }
  }
  console.log(USAGE.trim());
  process.exit(args.length === 0 ? 1 : 0);
}

// 1. 校验清单 -------------------------------------------------------------
const entries = args.map((arg) => {
  const { absPath, relPath } = resolvePublishPath(arg);
  const tracked = git(['ls-files', '--error-unmatch', '--', relPath], { allowFail: true }) !== null;
  const exists = existsSync(absPath);

  if (!exists && !tracked) fail(`文件不存在且不是仓库文件：${relPath}`);

  const status = git(['status', '--porcelain=v1', '-z', '--', relPath]);
  if (!status) fail(`${relPath} 没有待发布的改动（已与 HEAD 一致）`);

  const code = status.slice(0, 2).trim() || 'M';
  return {
    path: relPath,
    status: code,
    sha256: exists ? sha256File(absPath) : null,
  };
});

const uniquePaths = new Set(entries.map((entry) => entry.path));
if (uniquePaths.size !== entries.length) fail('清单里有重复文件');

console.log('\n[1/3] 构建…');
const build = spawnSync('npm', ['run', 'build'], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (build.status !== 0) {
  const output = `${build.stdout ?? ''}${build.stderr ?? ''}`.trimEnd().split('\n');
  console.error(output.slice(-25).join('\n'));
  fail('构建失败，未生成发布清单');
}
console.log('      ✓ 构建通过');

// 2. 路由核对 -------------------------------------------------------------
console.log('\n[2/3] 路由核对…');
const posts = collectPostRoutes();
verifyBuiltRoutes(posts);
const archived = posts.filter((post) => post.archived);
console.log(`      ✓ ${posts.length} 篇文章（含归档 ${archived.length} 篇），路由全部存在且无重复`);

// 3. 生成清单 -------------------------------------------------------------
console.log('\n[3/3] 生成清单…');
const changedPosts = posts
  .filter((post) => uniquePaths.has(post.file))
  .map(({ file, route, title }) => ({ file, route, title }));

const manifest = {
  version: 1,
  createdAt: new Date().toISOString(),
  baseHead: git(['rev-parse', 'HEAD']),
  branch: BRANCH,
  files: entries,
  changedPostRoutes: changedPosts,
  counts: {
    posts: posts.length,
    archived: archived.length,
    routes: posts.length,
    changedPosts: changedPosts.length,
  },
};

mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`      ✓ ${entries.length} 个文件`);
for (const entry of entries) console.log(`        ${entry.status.padStart(2)}  ${entry.path}`);
console.log(`\n清单已写入 ${MANIFEST_PATH.replace(`${ROOT}/`, '')}`);
console.log('下一步：npm run publish -- "提交说明"\n');
