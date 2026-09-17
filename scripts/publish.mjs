#!/usr/bin/env node
/**
 * 发布：先本地构建校验，再提交推送。
 *
 *   npm run publish -- "新增文章：XXX"
 *
 * 为什么先构建：frontmatter 写错（缺 title/slug、日期格式不对）会让
 * Astro 的 schema 校验直接失败。在本地拦住，好过推上去等 Actions 报错。
 *
 * 推送后 GitHub Actions 会自动构建并部署，约 1-2 分钟上线。
 */

import { execSync } from 'node:child_process';

const message = process.argv.slice(2).join(' ').trim() || `content: 更新 ${new Date().toISOString().slice(0, 10)}`;

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function capture(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

// ---------- 1. 构建校验 ----------
console.log('\n[1/4] 构建校验…');
try {
  run('npm run build', { stdio: 'pipe' });
  console.log('      ✓ 构建通过');
} catch (e) {
  console.error('\n❌ 构建失败，未推送。请先修好上面的错误。');
  if (e.stdout) console.error(e.stdout.toString().split('\n').slice(-25).join('\n'));
  process.exit(1);
}

// ---------- 2. 暂存 ----------
console.log('\n[2/4] 暂存改动…');
run('git add -A');

const staged = capture('git diff --cached --name-only');
if (!staged) {
  console.log('      ✓ 没有需要提交的改动');
  process.exit(0);
}

// 兜底检查：构建产物和依赖绝不能进仓库
const forbidden = staged
  .split('\n')
  .filter((f) => /^(node_modules|dist|\.astro)\//.test(f));
if (forbidden.length) {
  console.error(`\n❌ 暂存区含不该提交的目录（${forbidden.length} 个文件），已中止：`);
  forbidden.slice(0, 5).forEach((f) => console.error('     ' + f));
  console.error('   请检查 .gitignore。');
  process.exit(1);
}

const changed = staged.split('\n').length;
console.log(`      ✓ ${changed} 个文件`);

// ---------- 3. 提交 ----------
console.log('\n[3/4] 提交…');
run(`git commit -q -m ${JSON.stringify(message)}`);
console.log('      ✓ ' + capture('git log -1 --format=%h %s'));

// ---------- 4. 推送 ----------
console.log('\n[4/4] 推送到 GitHub…');
run('git push origin master');

console.log(`
✅ 已推送。GitHub Actions 正在构建部署，约 1-2 分钟后上线：
   https://crazyfnoption.github.io/

   查看构建进度：gh run list --repo CrazyFnOption/CrazyFnOption.github.io --limit 1
`);
