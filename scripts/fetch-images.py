#!/usr/bin/env python3
"""从 GitHub Pages CDN 并发下载旧文引用的图片到 public/，保持原路径。

保持原路径的意义：Markdown 里的引用形如 /2019/09/10/WordNet/1.png，
落到 public/ 下即是同名路径，Astro 直接按根路径提供，**URL 与旧站完全一致**。
"""
import re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = 'https://crazyfnoption.github.io'
PROJECT = Path(__file__).resolve().parent.parent
PUBLIC = PROJECT / 'public'

paths = set()
for md in (PROJECT / 'src' / 'content' / 'posts').glob('*.md'):
    for m in re.finditer(r'!\[[^\]]*\]\(([^)]+)\)', md.read_text(encoding='utf-8')):
        src = m.group(1)
        if src.startswith(('http://', 'https://', 'data:')):
            continue
        paths.add(urllib.parse.unquote(src.split('?')[0]).lstrip('/'))
paths = sorted(paths)

def fetch(rel):
    dst = PUBLIC / rel
    if dst.exists() and dst.stat().st_size > 0:
        return (rel, 'skip', dst.stat().st_size)
    dst.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + '/' + urllib.parse.quote(rel)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if not data:
                raise ValueError('空文件')
            dst.write_bytes(data)
            return (rel, 'ok', len(data))
        except Exception as e:
            if attempt == 2:
                return (rel, f'FAIL {e}', 0)
            time.sleep(2 * (attempt + 1))

t0 = time.time(); ok = skip = fail = 0; total = 0; fails = []
with ThreadPoolExecutor(max_workers=10) as ex:
    for i, (rel, status, size) in enumerate(ex.map(fetch, paths), 1):
        if status == 'ok': ok += 1; total += size
        elif status == 'skip': skip += 1
        else: fail += 1; fails.append((rel, status))
        if i % 50 == 0:
            print(f'  进度 {i}/{len(paths)}  已下载 {total/1048576:.1f}MB  {time.time()-t0:.0f}s', flush=True)

print(f'\n成功 {ok} / 跳过 {skip} / 失败 {fail}  共 {total/1048576:.1f}MB  耗时 {time.time()-t0:.0f}s')
for r, s in fails[:20]: print('  ✗', r, s)
sys.exit(1 if fail else 0)
