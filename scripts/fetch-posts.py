#!/usr/bin/env python3
"""从 GitHub Pages CDN 并发拉取旧站的 108 篇文章 HTML。

GitHub 的 git 协议与 codeload 今天都很慢（15 KB/s），但 Pages 的 Fastly CDN 稳定可达。
产物按旧站目录结构落到 SRC，供 extract-hexo.py 使用。
"""
import sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SRC = Path('/tmp/hexo-old-blog')
BASE = 'https://crazyfnoption.github.io'
PATHS = [l.strip() for l in open('/tmp/blogs.txt') if l.strip()]

def fetch(rel):
    """rel 形如 2020/03/15/<slug>/index.html"""
    slug_path = rel[:-len('index.html')]          # 去掉 index.html → 目录形式
    url = BASE + '/' + urllib.parse.quote(slug_path)
    dst = SRC / rel
    if dst.exists() and dst.stat().st_size > 5000:
        return (rel, 'skip', dst.stat().st_size)
    dst.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if len(data) < 5000:
                raise ValueError(f'内容过短 {len(data)} 字节')
            dst.write_bytes(data)
            return (rel, 'ok', len(data))
        except Exception as e:
            if attempt == 2:
                return (rel, f'FAIL: {e}', 0)
            time.sleep(2 * (attempt + 1))

t0 = time.time()
done = fail = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for rel, status, size in ex.map(fetch, PATHS):
        if status == 'ok':
            done += 1; print(f'  ✓ {size:>7,}  {urllib.parse.unquote(rel)}')
        elif status == 'skip':
            done += 1
        else:
            fail += 1; print(f'  ✗ {status}  {urllib.parse.unquote(rel)}')

print(f'\n成功 {done} / {len(PATHS)}，失败 {fail}，耗时 {time.time()-t0:.0f}s')
sys.exit(1 if fail else 0)
