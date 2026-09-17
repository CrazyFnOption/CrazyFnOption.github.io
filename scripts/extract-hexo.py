#!/usr/bin/env python3
"""
从 Hexo 渲染产物中抢救文章，还原为 Markdown。

背景：原 Hexo 源码（~/user_blog）已丢失，GitHub 仓库里只剩 `hexo deploy`
推上去的渲染 HTML。本脚本从渲染结果反推 Markdown。

设计要点（踩过的坑，改动前先读）：
  1. **禁用正则提取正文** —— articleBody 是嵌套 div，正则必然出错。
     实测同一篇用正则抽出 0 字、用解析器抽出 5995 字。
  2. **零丢失断言** —— 每篇提取后校验长度，任何异常立即中止。
     静默丢文章是本项目最严重的失败模式。
  3. 代码块是 <figure class="highlight <lang>"><table> 结构，**含行号 gutter 列**，
     必须只取 td.code，否则行号会混进代码。
  4. 图片按**原路径**复制到 public/，URL 与旧站完全一致。

用法：
    python3 scripts/extract-hexo.py --src /tmp/hexo-old-blog [--check]
"""

import argparse
import html.parser
import re
import shutil
import sys
import urllib.parse
from pathlib import Path

# 硬阈值：低于此长度视为**提取失败**（正常文章不会这么短），立即中止。
# 取值依据：实测旧站最短的真实文章是 52 字（Effective C++ 条款23），
# 而提取失败会产出近 0 字。设在 40 能可靠区分两者。
MIN_BODY_CHARS = 40

# 软阈值：低于此长度只是**内容单薄**，不视为失败，但要在报告里点名。
# 27 篇 Effective C++ 条款笔记多在 50–550 字之间，属已知情况。
THIN_BODY_CHARS = 200

VOID_TAGS = {"br", "img", "hr", "meta", "link", "input", "source", "col", "area", "base"}

# 归入归档的文章（标题匹配任一即 archived: true）。
#
# 依据（2026-09-17 实测，非臆断）：Effective C++ 条款系列 27 篇是
# 2018-12-01 同一天批量导入的读书摘要，正文普遍只有 50–550 字，
# 其中 11 篇不足 200 字（最短 52 字，作者自称「就简单讲两句」）。
# 内容薄、高度同质，且本质是版权书籍的内容摘要。
# 归档 ≠ 删除：文件保留、直链可访，只是不进首页列表与归档页。
ARCHIVED_PATTERNS = [r"^条款\d+"]


def is_archived(title: str) -> bool:
    return any(re.match(p, title.strip()) for p in ARCHIVED_PATTERNS)


class Node:
    """极简 DOM 节点。tag 为 '#text' 时 content 存文本。"""

    __slots__ = ("tag", "attrs", "children", "text")

    def __init__(self, tag, attrs=None, text=""):
        self.tag = tag
        self.attrs = attrs or {}
        self.children = []
        self.text = text

    def find(self, tag=None, cls=None):
        """深度优先找第一个匹配的子节点。"""
        for c in self.children:
            if c.tag == tag or tag is None:
                if cls is None or cls in (c.attrs.get("class") or "").split():
                    return c
                r = c.find(tag, cls)
                if r:
                    return r
            else:
                r = c.find(tag, cls)
                if r:
                    return r
        return None

    def find_all(self, tag):
        out = []
        for c in self.children:
            if c.tag == tag:
                out.append(c)
            out.extend(c.find_all(tag))
        return out

    def get_text(self):
        if self.tag == "#text":
            return self.text
        return "".join(c.get_text() for c in self.children)

    def classes(self):
        return (self.attrs.get("class") or "").split()


class TreeBuilder(html.parser.HTMLParser):
    """把 HTML 片段构建成 Node 树。比正则可靠得多。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, dict(attrs)))

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return
        # 未匹配的闭合标签：忽略（Hexo 产物中偶有，不影响正文）

    def handle_data(self, data):
        if data.strip() or "\n" not in data:
            self.stack[-1].children.append(Node("#text", text=data))


def extract_body(page_html: str):
    """按 div 嵌套深度精确截取 div[itemprop=articleBody]。"""
    builder = TreeBuilder()
    builder.feed(page_html)
    return find_article_body(builder.root)


def find_article_body(node):
    for c in node.children:
        if c.tag == "div" and c.attrs.get("itemprop") == "articleBody":
            return c
        r = find_article_body(c)
        if r:
            return r
    return None


# ---------------------------------------------------------------- 渲染

def pre_to_text(pre: Node) -> str:
    """把 <pre> 内的 <span class=line>…</span><br> 还原成多行文本。"""
    parts = []

    def walk(n):
        for c in n.children:
            if c.tag == "br":
                parts.append("\n")
            elif c.tag == "#text":
                parts.append(c.text)
            else:
                walk(c)

    walk(pre)
    text = "".join(parts)
    text = text.replace(" ", " ")
    return text.rstrip("\n")


def render_highlight(fig: Node) -> str:
    """<figure class="highlight <lang>"> → 围栏代码块，只取 td.code（剥掉行号）。"""
    lang = ""
    for c in fig.classes():
        if c != "highlight":
            lang = c
            break
    # Hexo 把代码放在 td.code 里；td.gutter 是行号，必须排除
    code_td = None
    for td in fig.find_all("td"):
        if "code" in td.classes():
            code_td = td
            break
    pre = (code_td or fig).find("pre")
    if pre is None:
        return ""
    code = pre_to_text(pre).strip("\n")
    fence = "```"
    while fence in code:  # 代码里含 ``` 时加长围栏
        fence += "`"
    return f"{fence}{lang}\n{code}\n{fence}\n\n"


def render_table(tbl: Node) -> str:
    """普通表格 → GFM 表格；结构异常则退回原始思路（渲染为纯文本行）。"""
    rows = []
    for tr in tbl.find_all("tr"):
        cells = [c.get_text().strip().replace("|", "\\|").replace("\n", " ")
                 for c in tr.children if c.tag in ("td", "th")]
        if cells:
            rows.append(cells)
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |",
           "| " + " | ".join(["---"] * width) + " |"]
    for r in rows[1:]:
        out.append("| " + " | ".join(r) + " |")
    return "\n".join(out) + "\n\n"


INLINE_WRAP = {"strong": "**", "b": "**", "em": "*", "i": "*", "del": "~~", "s": "~~"}


def render_inline(nodes) -> str:
    out = []
    for n in nodes:
        if n.tag == "#text":
            out.append(n.text)
        elif n.tag in INLINE_WRAP:
            inner = render_inline(n.children).strip()
            out.append(f"{INLINE_WRAP[n.tag]}{inner}{INLINE_WRAP[n.tag]}" if inner else "")
        elif n.tag == "code":
            inner = n.get_text()
            out.append(f"`{inner}`" if inner else "")
        elif n.tag == "br":
            out.append("  \n")
        elif n.tag == "a":
            href = n.attrs.get("href", "")
            # 标题锚点（<a class="headerlink">）是空的，丢弃
            if "headerlink" in n.classes():
                continue
            text = render_inline(n.children).strip()
            if not text:
                continue
            out.append(f"[{text}]({href})" if href else text)
        elif n.tag == "img":
            src = n.attrs.get("src", "")
            alt = n.attrs.get("alt", "")
            out.append(f"![{alt}]({src})")
        elif n.tag == "span":
            out.append(render_inline(n.children))
        else:
            out.append(render_inline(n.children))
    return "".join(out)


def render_blocks(nodes) -> str:
    out = []

    def emit_block(s):
        if s:
            out.append(s.rstrip() + "\n\n")

    for n in nodes:
        t = n.tag
        if t == "#text":
            s = n.text.strip()
            if s:
                emit_block(s)
        elif t in ("h1", "h2", "h3", "h4", "h5", "h6"):
            level = int(t[1])
            text = render_inline(n.children).strip()
            if text:
                emit_block("#" * level + " " + text)
        elif t == "p":
            text = render_inline(n.children).strip()
            if text:
                emit_block(text)
        elif t == "figure":
            if "highlight" in n.classes():
                out.append(render_highlight(n))
            else:
                # 图片 figure（可能带 figcaption）
                cap = n.find("figcaption")
                body = render_blocks([c for c in n.children if c.tag != "figcaption"])
                out.append(body)
                if cap:
                    cap_text = render_inline(cap.children).strip()
                    if cap_text:
                        emit_block(f"*{cap_text}*")
        elif t == "blockquote":
            inner = render_blocks(n.children).strip()
            if inner:
                quoted = "\n".join("> " + line if line.strip() else ">"
                                   for line in inner.split("\n"))
                emit_block(quoted)
        elif t in ("ul", "ol"):
            ordered = t == "ol"
            lines = []
            for i, li in enumerate([c for c in n.children if c.tag == "li"], 1):
                # li 内可能有嵌套列表，先取纯文本层
                nested = [c for c in li.children if c.tag in ("ul", "ol")]
                shallow = [c for c in li.children if c.tag not in ("ul", "ol")]
                text = render_inline(shallow).strip()
                bullet = f"{i}." if ordered else "-"
                lines.append(f"{bullet} {text}")
                for sub in nested:
                    sub_md = render_blocks([sub]).strip()
                    lines.extend("  " + l for l in sub_md.split("\n") if l.strip())
            emit_block("\n".join(lines))
        elif t == "hr":
            emit_block("---")
        elif t == "table":
            out.append(render_table(n))
        elif t == "pre":
            emit_block("```\n" + pre_to_text(n) + "\n```")
        elif t in ("div", "section", "article", "span"):
            out.append(render_blocks(n.children))
        elif t in ("script", "style"):
            continue
        else:
            text = render_inline(n.children).strip()
            if text:
                emit_block(text)

    return "".join(out)


# ---------------------------------------------------------------- 元数据

def parse_meta(page_html: str, rel_path: str):
    """从页面提取标题与发布日期；标题以渲染 HTML 为准。"""
    m = re.search(r"<title>(.*?)</title>", page_html, re.S)
    raw_title = m.group(1).strip() if m else ""
    # 去掉 " | 站点名" 后缀
    title = re.split(r"\s*\|\s*", raw_title)[0].strip()

    parts = rel_path.split("/")
    year, month, day = parts[0], parts[1], parts[2]
    slug = urllib.parse.unquote(parts[3])

    # 优先用页面里的发布时间（含时分），否则退回路径日期
    dm = re.search(r'"datePublished"\s*:\s*"([^"]+)"', page_html)
    if dm:
        date = dm.group(1)[:10]
    else:
        date = f"{year}-{month}-{day}"
    return title, date, slug


def parse_terms(page_html: str):
    """提取分类与标签。

    直接按链接 href 抽取，比解析 post-meta 的 DOM 结构稳得多：
        <a href="/categories/机器学习/" ...><span itemprop="name">机器学习</span></a>
        <a href="/tags/深度学习/" rel="tag">深度学习</a>

    导航栏里的 /tags/ 与 /categories/（无 slug）不会误匹配，因为正则要求斜杠间有内容。
    """
    cats = [urllib.parse.unquote(c).strip()
            for c in re.findall(r'href="/categories/([^"/]+)/"', page_html)]
    tags = [urllib.parse.unquote(t).strip()
            for t in re.findall(r'href="/tags/([^"/]+)/"', page_html)]
    # 去重且保持原顺序
    return list(dict.fromkeys(cats)), list(dict.fromkeys(tags))


def html_unescape(s):
    import html as _h
    return _h.unescape(s)


# ---------------------------------------------------------------- 主流程

def yaml_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def safe_filename(s: str) -> str:
    """把 slug 变成安全的文件名。

    旧站的 slug 里混着 `#`、全角冒号、空格等字符 —— 例如
    `条款02：尽量以const,enum,inline 替换掉#define`。`#` 会被当成 URL 片段符，
    导致 Astro 的 glob loader 读文件时路径被截断（实测报 ENOENT）。

    **只清洗文件名，不动 frontmatter 里的 slug** —— 后者用于还原旧 URL，
    必须逐字保留。
    """
    s = s.replace("#", "-").replace("/", "-").replace("\\", "-")
    s = s.replace("：", "-").replace(":", "-")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="/tmp/hexo-old-blog", help="克隆下来的旧站目录")
    ap.add_argument("--out", default=None, help="输出根目录（默认项目根的 src/content/posts）")
    ap.add_argument("--check", action="store_true", help="只校验，不写文件")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.is_dir():
        sys.exit(f"❌ 源目录不存在：{src}（先 git clone 旧站仓库）")

    project = Path(__file__).resolve().parent.parent
    posts_dir = Path(args.out) if args.out else project / "src" / "content" / "posts"
    public_dir = project / "public"

    # 收集所有文章页面
    pages = []
    for p in sorted(src.rglob("index.html")):
        rel = p.relative_to(src)
        parts = rel.parts
        # 只要 YYYY/MM/DD/<slug>/index.html 结构
        if len(parts) == 5 and re.fullmatch(r"\d{4}", parts[0]) \
                and re.fullmatch(r"\d{2}", parts[1]) and re.fullmatch(r"\d{2}", parts[2]):
            pages.append(p)

    if not pages:
        sys.exit(f"❌ 在 {src} 下没找到任何 YYYY/MM/DD/<slug>/index.html")
    print(f"发现 {len(pages)} 篇文章页面\n")

    if not args.check:
        posts_dir.mkdir(parents=True, exist_ok=True)

    ok, failed, thin = 0, [], []
    total_images = 0
    written: dict[str, str] = {}  # 文件名 → 来源路径，用于检测冲突

    for page in pages:
        rel = page.relative_to(src)
        rel_path = "/".join(rel.parts[:-1])  # 去掉 index.html
        page_html = page.read_text(encoding="utf-8", errors="ignore")

        body = extract_body(page_html)
        if body is None:
            failed.append((rel_path, "未找到 articleBody"))
            continue

        md = render_blocks(body.children).strip()
        # 折叠多余空行
        md = re.sub(r"\n{3,}", "\n\n", md)

        plain_len = len(re.sub(r"\s+", "", body.get_text()))
        if plain_len < MIN_BODY_CHARS:
            failed.append((rel_path, f"正文仅 {plain_len} 字（低于硬阈值 {MIN_BODY_CHARS}，疑似提取失败）"))
            continue
        if plain_len < THIN_BODY_CHARS:
            thin.append((rel_path, plain_len))

        title, date, slug = parse_meta(page_html, rel_path)
        cats, tags = parse_terms(page_html)

        # 图片：按原路径复制到 public/，URL 与旧站一致
        img_count = 0
        if not args.check:
            for img in body.find_all("img"):
                s = img.attrs.get("src", "")
                if not s or s.startswith(("http://", "https://", "data:")):
                    continue
                clean = urllib.parse.unquote(s.split("?")[0]).lstrip("/")
                srcfile = src / clean
                if srcfile.is_file():
                    dst = public_dir / clean
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    if not dst.exists():
                        shutil.copy2(srcfile, dst)
                    img_count += 1
        total_images += img_count

        if not args.check:
            fm = ["---", f"title: {yaml_str(title)}", f"date: {date}",
                  f"slug: {yaml_str(slug)}"]
            if cats:
                fm.append("categories: [" + ", ".join(yaml_str(c) for c in cats) + "]")
            if tags:
                fm.append("tags: [" + ", ".join(yaml_str(t) for t in tags) + "]")
            if is_archived(title):
                fm.append("archived: true")
            fm.append("---")
            y, mo, dy = rel_path.split("/")[:3]
            fname = f"{y}-{mo}-{dy}-{safe_filename(slug)}.md"
            if fname in written:
                failed.append((rel_path, f"文件名冲突：{fname} 已被 {written[fname]} 占用"))
                continue
            written[fname] = rel_path
            (posts_dir / fname).write_text(
                "\n".join(fm) + "\n\n" + md + "\n", encoding="utf-8"
            )

        ok += 1

    print(f"✅ 成功提取 {ok} / {len(pages)} 篇")
    print(f"   复制图片 {total_images} 张")

    if thin:
        print(f"\n⚠️  {len(thin)} 篇内容单薄（< {THIN_BODY_CHARS} 字）—— 非失败，仅点名：")
        for p, n in sorted(thin, key=lambda x: x[1]):
            print(f"   {n:>5} 字  {urllib.parse.unquote(p.split('/', 3)[-1])}")

    if failed:
        print(f"\n❌ 失败 {len(failed)} 篇：")
        for p, why in failed:
            print(f"   {p} —— {why}")
        sys.exit(1)
    if ok != len(pages):
        sys.exit(f"❌ 数量不符：预期 {len(pages)}，实际 {ok}")
    print("\n✅ 零丢失校验通过：全部文章均已提取。")


if __name__ == "__main__":
    main()
