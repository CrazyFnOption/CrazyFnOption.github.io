/**
 * 构建后修正：把输出路径里被百分号编码的 `%23` 还原成字面 `#`。
 *
 * 为什么需要这一步
 * ----------------
 * 旧站有一篇文章的 slug 含 `#`：
 *   `条款02：尽量以const,enum,inline 替换掉#define`
 * Hexo 生成的目录名是**字面 `#`**，Hexo 产出的链接写作 `...替换掉%23define/`。
 * 服务器解析 URL 时把 `%23` 解码回 `#`，正好命中那个目录。
 *
 * Astro 则不同：它把 `#` 百分号编码后**写进了目录名**，产出
 * `...替换掉%23define`。于是服务器解码 `%23` → `#`，去找不到叫 `#define`
 * 的目录（实际叫 `%23define`），结果 404 —— 旧链接失效。
 *
 * 实测：这一篇是全站 108 篇里唯一受影响的。
 * 处理方式是构建后把目录名改回字面 `#`，与旧站输出完全一致。
 */

import { readdirSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

/** 需要还原的百分号编码 → 字面字符 */
const DECODE = { '%23': '#' };

let renamed = 0;

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const name of entries) {
    const full = join(dir, name);
    const fixed = Object.entries(DECODE).reduce(
      (acc, [enc, ch]) => acc.split(enc).join(ch),
      name,
    );

    // 先把子目录处理完，再改名自身（避免改完名字后路径变了）
    if (statSync(full).isDirectory()) walk(full);

    if (fixed !== name) {
      const target = join(dir, fixed);
      renameSync(full, target);
      renamed++;
      console.log(`  修正 ${name} → ${fixed}`);
    }
  }
}

walk(DIST);

if (renamed > 0) {
  console.log(`\n已修正 ${renamed} 个被编码的路径名。`);
} else {
  console.log('无需修正（没有百分号编码的路径名）。');
}
