#!/usr/bin/env node
/**
 * 发布第二步：按 prepare 生成的清单提交、推送，并等待部署完成。
 *
 *   npm run publish -- "提交说明"
 *   npm run publish -- --dry-run
 *
 * 提交前会再次核对文件哈希，确保 prepare 之后内容没有变化。
 * 推送后等待对应 commit 的 Actions 结束，再抽查线上页面。
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';

import {
  MANIFEST_PATH,
  REPO_SLUG,
  ROOT,
  SITE_URL,
  checkNodeVersion,
  fail,
  git,
  gitRun,
  sha256File,
} from './lib/publish-utils.mjs';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const message = argv.filter((arg) => arg !== '--dry-run').join(' ').trim()
  || `content: 更新 ${new Date().toISOString().slice(0, 10)}`;

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`
用法：
  npm run publish -- "提交说明"
  npm run publish -- --dry-run

发布前先运行 npm run publish:prepare -- <文件...> 生成清单。
`.trim());
  process.exit(0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    fail('没有发布清单。先运行 npm run publish:prepare -- <文件...>');
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    fail(`发布清单无法解析：${error.message}`);
  }
}

function verifyManifest(manifest) {
  if (manifest.version !== 1) fail(`不认识的清单版本：${manifest.version}`);

  const head = git(['rev-parse', 'HEAD']);
  if (head !== manifest.baseHead) {
    fail('prepare 之后有新的提交，清单已过期。请重新运行 publish:prepare。');
  }

  for (const file of manifest.files) {
    const absPath = `${ROOT}/${file.path}`;
    if (file.sha256 === null) {
      if (existsSync(absPath)) fail(`${file.path} 在 prepare 后又被重新创建，请重新 prepare`);
    } else {
      if (!existsSync(absPath)) fail(`${file.path} 在 prepare 后消失，请重新 prepare`);
      if (sha256File(absPath) !== file.sha256) {
        fail(`${file.path} 在 prepare 后内容有变化，请重新 prepare`);
      }
    }

    const status = git(['status', '--porcelain=v1', '-z', '--', file.path]);
    if (!status) fail(`${file.path} 已经没有待提交的改动，清单已过期`);
  }

  const staged = git(['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean);
  if (staged.length) {
    fail(`暂存区已有 ${staged.length} 个文件，请先处理：\n  ${staged.join('\n  ')}`);
  }
}

function stageExactly(manifest) {
  const paths = manifest.files.map((file) => file.path);
  git(['add', '-A', '--', ...paths]);

  const staged = git(['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean).sort();
  const expected = [...paths].sort();
  if (staged.length !== expected.length || staged.some((path, i) => path !== expected[i])) {
    fail(`暂存结果与清单不一致：\n  清单：${expected.join(', ')}\n  实际：${staged.join(', ')}`);
  }
}

async function githubApi(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'blog-publish-script',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

async function waitForRun(sha) {
  const deadline = Date.now() + 10 * 60 * 1000;
  let last = '';

  while (Date.now() < deadline) {
    let data;
    try {
      data = await githubApi(
        `/repos/${REPO_SLUG}/actions/workflows/deploy.yml/runs?head_sha=${sha}&per_page=5`,
      );
    } catch (error) {
      console.warn(`      ! 无法查询 Actions（${error.message}），改用线上检查判断`);
      return null;
    }

    const run = data.workflow_runs?.find((item) => item.head_sha === sha);
    if (run) {
      const state = `${run.status}${run.conclusion ? `/${run.conclusion}` : ''}`;
      if (state !== last) {
        console.log(`      Actions: ${state}`);
        last = state;
      }
      if (run.status === 'completed') return run;
    }
    // 未登录的 GitHub API 限速是每小时 60 次；20 秒一次足够覆盖一次部署。
    await sleep(20000);
  }
  return { timedOut: true };
}

async function fetchOk(url) {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}_=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache' },
  });
  const body = response.ok ? await response.text() : '';
  return { ok: response.ok, status: response.status, body };
}

async function verifyLive(manifest) {
  const urls = [
    { url: `${SITE_URL}/`, mustContain: 'Magical Bean' },
    ...manifest.changedPostRoutes.map((post) => ({
      url: `${SITE_URL}${post.route}`,
      mustContain: '<html',
    })),
  ];

  const pending = new Set(urls.map((item) => item.url));
  const deadline = Date.now() + 3 * 60 * 1000;
  let lastError = '';

  while (Date.now() < deadline && pending.size) {
    for (const item of urls) {
      if (!pending.has(item.url)) continue;
      try {
        const result = await fetchOk(item.url);
        if (result.ok && result.body.includes(item.mustContain)) pending.delete(item.url);
        else lastError = `${item.url} → HTTP ${result.status}`;
      } catch (error) {
        lastError = `${item.url} → ${error.message}`;
      }
    }
    if (pending.size) await sleep(10000);
  }

  return { ok: pending.size === 0, pending: [...pending], lastError };
}

checkNodeVersion();
const manifest = loadManifest();
verifyManifest(manifest);

console.log(`\n准备发布 ${manifest.files.length} 个文件（基于 ${manifest.baseHead.slice(0, 8)}）`);
for (const file of manifest.files) console.log(`  ${file.status.padStart(2)}  ${file.path}`);
console.log(`提交说明：${message}`);

if (dryRun) {
  console.log('\n✓ dry-run：清单、哈希与暂存区检查通过，没有提交或推送。\n');
  process.exit(0);
}

// 1. 提交 ---------------------------------------------------------------
console.log('\n[1/3] 提交…');
stageExactly(manifest);
try {
  gitRun(['commit', '-m', message]);
} catch {
  fail('提交失败，文件仍留在暂存区。处理后重新运行 npm run publish。');
}
const sha = git(['rev-parse', 'HEAD']);
console.log(`      ✓ ${git(['log', '-1', '--format=%h %s'])}`);
// 提交后清单已完成使命；保留它只会让下一次发布误以为还能重放。
try {
  rmSync(MANIFEST_PATH, { force: true });
} catch {
  // 清单清理失败不影响发布本身。
}

// 2. 推送 ---------------------------------------------------------------
console.log('\n[2/3] 推送…');
try {
  gitRun(['push', 'origin', 'master']);
} catch {
  fail(`推送失败，提交 ${sha.slice(0, 8)} 仍在本地。修好网络或凭据后再执行 git push origin master。`);
}

// 3. 等待部署并核对线上 ------------------------------------------------
console.log('\n[3/3] 等待部署…');
const run = await waitForRun(sha);

if (run?.timedOut) {
  console.error('\n⚠️  已推送，但 10 分钟内没有等到 Actions 结果。');
  console.error(`   https://github.com/${REPO_SLUG}/actions`);
  process.exit(2);
}

if (run && run.conclusion !== 'success') {
  console.error(`\n❌ Actions 失败：${run.conclusion}`);
  console.error(`   ${run.html_url}`);
  process.exit(1);
}

const live = await verifyLive(manifest);
if (!live.ok) {
  console.error(`\n⚠️  已推送并部署，但线上抽查未通过：${live.lastError}`);
  for (const url of live.pending) console.error(`   未确认：${url}`);
  process.exit(2);
}

console.log(`\n✅ 已发布 ${sha.slice(0, 8)}`);
console.log(`   首页 200${manifest.changedPostRoutes.length ? `，${manifest.changedPostRoutes.length} 篇文章 200` : ''}`);
console.log(`   ${SITE_URL}/\n`);
