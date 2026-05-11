#!/usr/bin/env python3
"""
build-book-pdf.py — build *Your Money Is Broken* as a static PDF.

Two output profiles:
  • --trim web   → A4 reader (default). Used by the gianyrox.com PDF
                   download. Light front matter, generous margins.
  • --trim 6x9   → KDP-ready paperback/hardcover trim. Full front matter
                   (half-title, title page, copyright, dedication, TOC),
                   inside gutter for binding, page numbers excluded
                   (KDP auto-numbers). Embeds Merriweather + Source Sans 3.

Outputs:
  public/your-money-is-broken.pdf       (web profile, default)
  public/your-money-is-broken-kdp.pdf   (--trim 6x9 → this filename)

Source: ~/agfarms/papers/book/*.md  (18 chapters, markdown).
"""

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

REPO = Path(__file__).resolve().parent.parent
BOOK_DIR = Path.home() / "agfarms" / "papers" / "book"

TITLE = "Your Money Is Broken"
SUBTITLE = "A Field Report from the Stablecoin World"
AUTHOR = "Gianangelo Dichio"
PUBLISHER = "AGFarms"
YEAR = "2026"

# ─── CSS profiles ──────────────────────────────────────────────────────

CSS_WEB = """
@page { size: A4; margin: 2cm 2.2cm; }
body { font-family: 'Merriweather', Georgia, serif; font-size: 11pt;
       line-height: 1.55; color: #2c2c2c; }
.cover { text-align: center; page-break-after: always; padding-top: 4cm; }
.cover .title { font-size: 28pt; font-weight: 900; margin-bottom: .4cm; color: #264653; }
.cover .subtitle { font-size: 14pt; color: #6b6b6b; font-style: italic; }
.cover .meta { margin-top: 2cm; font-size: 10pt; color: #8b8b8b; }
h1 { font-size: 22pt; color: #264653; margin: 1.2em 0 .4em; page-break-before: always; }
h2 { font-size: 15pt; color: #2a9d8f; margin-top: 1.1em; }
h3 { font-size: 12pt; color: #264653; margin-top: 1em; }
p { margin: .35em 0; }
blockquote { border-left: 3px solid #2a9d8f; margin: .8em 0; padding: .2em 1em;
             color: #555; font-style: italic; }
em { color: #555; } strong { color: #264653; }
.footnote { font-size: 9pt; color: #6b6b6b; border-top: 1px solid #ddd;
            padding-top: .3em; margin-top: 2em; }
.toc-entry { margin: .4em 0; }
"""

# KDP 6×9 paperback. KDP requires:
#   - Outside margin >= 0.5"
#   - Inside (gutter) margin scales with page count:
#     151-300 pages → 0.75"
#   - Top/bottom margin >= 0.5"
#
# Cover gets uploaded separately via KDP cover calculator — this PDF is
# interior pages only.
CSS_6x9 = """
@page :first {
  size: 6in 9in;
  margin: 1in 0.75in 1in 0.5in;
}
@page {
  size: 6in 9in;
  margin: 0.75in 0.5in 0.75in 0.75in;
  @bottom-center {
    content: counter(page);
    font-family: 'Merriweather', Georgia, serif;
    font-size: 9pt;
    color: #555;
  }
}
@page :left  { margin: 0.75in 0.75in 0.75in 0.5in; }   /* binding on right */
@page :right { margin: 0.75in 0.5in 0.75in 0.75in; }   /* binding on left  */

body { font-family: 'Merriweather', Georgia, serif; font-size: 10.5pt;
       line-height: 1.5; color: #1a1a1a; counter-reset: page 1; }
.no-page-num { page: nopage; }
@page nopage { @bottom-center { content: ""; } }

.half-title { text-align: center; padding-top: 3in; page-break-after: always; }
.half-title .title-line {
  font-family: 'Source Sans 3', sans-serif; font-size: 26pt; font-weight: 900;
  letter-spacing: -0.02em; color: #1a1a1a;
}
.title-page { text-align: center; padding-top: 1.8in; page-break-after: always; }
.title-page .title {
  font-family: 'Source Sans 3', sans-serif; font-size: 38pt; font-weight: 900;
  letter-spacing: -0.02em; line-height: 1.05; color: #1a1a1a;
}
.title-page .subtitle {
  margin-top: .55in; font-size: 14pt; font-style: italic; color: #555;
  font-family: 'Merriweather', Georgia, serif;
}
.title-page .author {
  position: absolute; bottom: 1.2in; left: 0; right: 0;
  font-family: 'Source Sans 3', sans-serif; font-size: 13pt;
  letter-spacing: 0.04em; text-transform: uppercase; color: #1a1a1a;
}
.copyright { padding-top: 5in; font-size: 9pt; color: #444; line-height: 1.45;
             page-break-after: always; }
.copyright p { margin: .3em 0; }
.dedication { text-align: center; padding-top: 4in; font-style: italic;
              color: #555; font-size: 11pt; page-break-after: always; }
.toc { page-break-after: always; }
.toc-title { font-family: 'Source Sans 3', sans-serif; font-size: 14pt;
             text-transform: uppercase; letter-spacing: 0.1em; color: #1a1a1a;
             margin-bottom: .4in; text-align: center; }
.toc-entry { margin: 0.18em 0; font-size: 10.5pt; color: #1a1a1a; }
.toc-entry .num { color: #666; font-feature-settings: "tnum"; }
h1 {
  font-family: 'Source Sans 3', sans-serif; font-size: 20pt; font-weight: 900;
  letter-spacing: -0.015em; color: #1a1a1a; margin: 1.6em 0 .5em;
  page-break-before: always;
}
h2 { font-family: 'Source Sans 3', sans-serif; font-size: 13pt; font-weight: 700;
     color: #1a1a1a; margin-top: 1.2em; }
h3 { font-size: 11pt; font-weight: 700; color: #1a1a1a; margin-top: .9em; }
p { margin: 0; text-indent: 1.2em; }
p:first-of-type, h1 + p, h2 + p, h3 + p, blockquote + p, hr + p,
.no-indent, .no-indent p { text-indent: 0; }
blockquote { border-left: 2px solid #999; margin: .6em 1em; padding: .2em .8em;
             color: #444; font-style: italic; font-size: 10pt; }
em { color: #444; }
hr { border: none; text-align: center; margin: 1.2em 0; }
hr::before { content: "* * *"; letter-spacing: .5em; color: #666; font-size: 10pt; }
sup, sub { font-size: 70%; }
.footnote { font-size: 8.5pt; color: #555; }
"""

# ─── content builders ──────────────────────────────────────────────────

def slurp(name):
    p = BOOK_DIR / f"{name}.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""

def web_front_matter():
    return f"""
<div class="cover">
  <div class="title">{TITLE}</div>
  <div class="subtitle">{SUBTITLE}</div>
  <div class="meta">{AUTHOR} · {PUBLISHER} · {YEAR}</div>
</div>
<h1>Table of Contents</h1>
<div class="toc">
{''.join(f'<div class="toc-entry">{t}</div>' for _, t in CHAPTERS)}
</div>
"""

def kdp_front_matter():
    # Standard publishing-industry front matter, in order:
    #   1. Half-title (title alone, recto)
    #   2. (blank verso)
    #   3. Title page (full title + subtitle + author, recto)
    #   4. Copyright (verso)
    #   5. Dedication (recto)
    #   6. (blank verso)
    #   7. Table of Contents (recto)
    # Each <div class="page-break-after: always"> on a recto creates a
    # blank verso automatically since the next recto-only element forces
    # an odd page.
    isbn_placeholder = "ISBN: 979-8-XXXXXXX-X-X (paperback)"
    toc_lines = ''.join(f'<div class="toc-entry">{t}</div>' for _, t in CHAPTERS)
    return f"""
<section class="no-page-num">
  <div class="half-title"><div class="title-line">{TITLE}</div></div>
  <div class="title-page">
    <div class="title">{TITLE}</div>
    <div class="subtitle">{SUBTITLE}</div>
    <div class="author">{AUTHOR}</div>
  </div>
  <div class="copyright">
    <p>Copyright © {YEAR} {AUTHOR}.</p>
    <p>All rights reserved.</p>
    <p>{PUBLISHER}, an imprint of AGFarms LLC.</p>
    <p>First edition: {YEAR}.</p>
    <p>{isbn_placeholder}</p>
    <p>Printed in the United States of America.</p>
    <p>No part of this publication may be reproduced, distributed, or transmitted in any form
       or by any means without the prior written permission of the publisher, except in the
       case of brief quotations embodied in critical reviews and certain other noncommercial
       uses permitted by copyright law.</p>
    <p style="margin-top:1.2em">Cover design: AGFarms.</p>
    <p>Interior design: AGFarms, set in Merriweather and Source Sans 3.</p>
    <p style="margin-top:1.2em">For inquiries, contact gianyrox@gmail.com.</p>
  </div>
  <div class="dedication">For everyone who waited a week for money to arrive.</div>
</section>
<div class="toc">
  <div class="toc-title">Contents</div>
  {toc_lines}
</div>
"""

def build_html(profile):
    if profile == "6x9":
        front = kdp_front_matter()
        css = CSS_6x9
    else:
        front = web_front_matter()
        css = CSS_WEB
    pieces = [front]
    md = markdown.Markdown(extensions=['extra', 'footnotes', 'sane_lists'])
    for cid, _t in CHAPTERS:
        raw = slurp(cid)
        if not raw:
            continue
        pieces.append(md.convert(raw))
        md.reset()
    return (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<link rel='preconnect' href='https://fonts.googleapis.com'>"
        "<link href='https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Source+Sans+3:wght@400;600;700;800;900&display=swap' rel='stylesheet'>"
        f"<style>{css}</style></head><body>"
        + "".join(pieces)
        + "</body></html>"
    )

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--trim", choices=["web", "6x9"], default="web")
    ap.add_argument("--out", help="explicit output path")
    args = ap.parse_args()

    if args.out:
        out = Path(args.out)
    elif args.trim == "6x9":
        out = REPO / "public" / "your-money-is-broken-kdp.pdf"
    else:
        out = REPO / "public" / "your-money-is-broken.pdf"

    out.parent.mkdir(parents=True, exist_ok=True)
    html = build_html(args.trim)
    HTML(string=html).write_pdf(str(out))
    print(f"✓ wrote {out} ({out.stat().st_size // 1024} KB · trim={args.trim})")

if __name__ == "__main__":
    main()
