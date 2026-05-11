#!/usr/bin/env python3
"""
build-book-pdf.py — build a static, weasyprint-friendly HTML of the
*Your Money Is Broken* book by concatenating the chapters from
~/agfarms/papers/book/, then convert to PDF.

Output:
  ~/agfarms/gianyrox/public/your-money-is-broken.pdf

Why this exists: the reader at gianyrox/book/index.html is a JS SPA that
loads chapter markdown from an embedded JSON constant. Weasyprint has
no JS engine, so it can only see the empty shell. We bypass the SPA and
render straight from the markdown files.

Deps: pip install weasyprint markdown
"""

import os
import re
import sys
from pathlib import Path

try:
    import markdown
except ImportError:
    sys.exit("pip install markdown")

try:
    from weasyprint import HTML
except ImportError:
    sys.exit("pip install weasyprint")

# Single source of truth for chapter order — mirrors ~/agfarms/papers/build.py
CHAPTERS = [
    ("prologue", "Prologue"),
    ("ch1", "Chapter 1 — A Stablecoin Utopia"),
    ("ch2", "Chapter 2"),
    ("ch3a", "Chapter 3 · Part A"),
    ("ch3b", "Chapter 3 · Part B"),
    ("ch3c", "Chapter 3 · Part C"),
    ("ch4a", "Chapter 4 · Part A"),
    ("ch4b", "Chapter 4 · Part B"),
    ("ch4c", "Chapter 4 · Part C"),
    ("ch4d", "Chapter 4 · Part D"),
    ("ch5a", "Chapter 5 · Part A"),
    ("ch5b", "Chapter 5 · Part B"),
    ("ch5c", "Chapter 5 · Part C"),
    ("ch5d", "Chapter 5 · Part D"),
    ("ch5e", "Chapter 5 · Part E"),
    ("ch6", "Chapter 6"),
    ("appendices", "Appendices"),
    ("characters", "Characters"),
]

BOOK_DIR = Path.home() / "agfarms" / "papers" / "book"
OUT_PDF = Path(__file__).resolve().parent.parent / "public" / "your-money-is-broken.pdf"

CSS = """
@page { size: A4; margin: 2cm 2.2cm; }
body {
  font-family: 'Merriweather', Georgia, serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #2c2c2c;
}
.cover {
  text-align: center;
  page-break-after: always;
  padding-top: 4cm;
}
.cover .title { font-size: 28pt; font-weight: 900; margin-bottom: .4cm; color: #264653; }
.cover .subtitle { font-size: 14pt; color: #6b6b6b; font-style: italic; }
.cover .meta { margin-top: 2cm; font-size: 10pt; color: #8b8b8b; }
h1 { font-size: 22pt; color: #264653; margin: 1.2em 0 .4em; page-break-before: always; }
h2 { font-size: 15pt; color: #2a9d8f; margin-top: 1.1em; }
h3 { font-size: 12pt; color: #264653; margin-top: 1em; }
p { margin: .35em 0; }
blockquote {
  border-left: 3px solid #2a9d8f;
  margin: .8em 0;
  padding: .2em 1em;
  color: #555;
  font-style: italic;
}
em { color: #555; }
strong { color: #264653; }
.footnote {
  font-size: 9pt;
  color: #6b6b6b;
  border-top: 1px solid #ddd;
  padding-top: .3em;
  margin-top: 2em;
}
.toc-entry { margin: .4em 0; }
"""

def slurp(name: str) -> str:
    p = BOOK_DIR / f"{name}.md"
    if not p.exists(): return ""
    return p.read_text(encoding="utf-8")

def build_html() -> str:
    pieces = []
    pieces.append('<div class="cover">')
    pieces.append('  <div class="title">Your Money Is Broken</div>')
    pieces.append('  <div class="subtitle">A field report from the stablecoin world</div>')
    pieces.append('  <div class="meta">Gianangelo Dichio · AGFarms · 2026</div>')
    pieces.append('</div>')
    pieces.append('<h1>Table of Contents</h1>')
    pieces.append('<div class="toc">')
    for cid, title in CHAPTERS:
        pieces.append(f'  <div class="toc-entry">{title}</div>')
    pieces.append('</div>')
    md = markdown.Markdown(extensions=['extra', 'footnotes', 'sane_lists'])
    for cid, _title in CHAPTERS:
        raw = slurp(cid)
        if not raw:
            continue
        pieces.append(md.convert(raw))
        md.reset()
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{''.join(pieces)}</body></html>"

def main():
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    html_str = build_html()
    HTML(string=html_str).write_pdf(str(OUT_PDF))
    print(f"✓ wrote {OUT_PDF} ({OUT_PDF.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
