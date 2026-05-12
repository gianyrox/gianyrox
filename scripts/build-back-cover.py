#!/usr/bin/env python3
"""
build-back-cover.py — programmatic back cover for *Your Money Is Broken*.

After gpt-image-1 produced a back panel with missing periods, overlapping
text, and inconsistent gradient, switching to pure PIL composition.
Pillow draws every glyph and pixel, so punctuation + spacing are guaranteed.

Layout (top → bottom):
   0–10%   margin
  10–22%   pull quote (italic Playfair, large)
  22–28%   subtle hairline separator
  28–62%   marketing blurb (body serif, justified, multi-paragraph)
  62–68%   author bio (Playfair Italic small)
  68–100%  teal gradient zone with:
              - scattered hash text matching the front cover
              - ISBN barcode placeholder (white rectangle, bottom-right)
              - AGFarms publisher mark (sans-serif uppercase, bottom-left)

Output: public/cover/back-hd.png (1024×1536)
"""

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
COVER_DIR = REPO / "public" / "cover"
FONTS_DIR = COVER_DIR / "_fonts"

W, H = 1024, 1536
CREAM = (250, 246, 235)
CHARCOAL = (26, 26, 26)
GREY_MID = (85, 85, 85)
GREY_FAINT = (130, 130, 130)
TEAL_DEEP = (29, 111, 99)
TEAL_MID = (42, 157, 143)
CREAM_FAINT = (240, 232, 215)

FONT_TITLE = FONTS_DIR / "Playfair-Black.ttf"
FONT_ITALIC = FONTS_DIR / "Playfair-Italic.ttf"
FONT_SANS = FONTS_DIR / "Inter.ttf"
FONT_MONO = FONTS_DIR / "JetBrainsMono.ttf"

# Back-cover copy — every sentence ends with a period.
PULL_QUOTE = "“A field report from inside the digital dollar economy.”"

# Marketing blurb — clean paragraphs, every sentence properly punctuated.
BLURB_PARAGRAPHS = [
    "Four cities. Four people. The same invisible infrastructure.",
    "Bogotá. Harare. Lagos. A rooftop in Buenos Aires.",
    "When the old banking pipes break, the people who feel it first are "
    "the ones moving money across borders.",
    "Pablo in Bogotá sends his mother medicine money in ninety seconds "
    "for under two dollars. Mercy in Harare protects a women’s savings "
    "club from fifty-six percent inflation by parking the pot in a "
    "digital dollar. Femi in Lagos closes a hundred-thousand-dollar "
    "supplier deal from the back of a parked car.",
    "This is what happens when stablecoins quietly become the bridge "
    "from slow money to fast money. Not the speculation side of crypto. "
    "The side that just works.",
]

AUTHOR_BIO = (
    "GIANY ROX is the founder of AGFarms, a venture studio shipping "
    "more than sixteen products from a single terminal. His writing on "
    "math, money, and the future of work has appeared on Medium for "
    "years."
)

# Hash fragments for the gradient zone
HASHES = [
    "0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0", "0x7df0...0926",
    "0xe9c2...b471", "0xa173", "0x8b4d", "0x0a13", "c857", "d4f0", "7df0",
    "e926", "a1f3", "b471", "ddf0", "aaf3",
]

# ────────── helpers ──────────

def load_font(path, size):
    return ImageFont.truetype(str(path), size)

def wrap_text(text, font, max_w, draw):
    """Word-wrap text into lines that fit within max_w using the font's
    measured advance width."""
    words = text.split()
    lines, cur = [], []
    for w in words:
        cand = " ".join(cur + [w])
        bbox = draw.textbbox((0, 0), cand, font=font, anchor="lt")
        if bbox[2] - bbox[0] > max_w and cur:
            lines.append(" ".join(cur))
            cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append(" ".join(cur))
    return lines

def draw_justified_line(draw, text, font, x, y, line_width, color, is_last=False):
    """Render a line of text justified to fit line_width (last line left-aligned)."""
    words = text.split()
    if len(words) == 1 or is_last:
        draw.text((x, y), text, font=font, fill=color, anchor="lt")
        return
    # Calculate natural width
    word_widths = []
    for w in words:
        bbox = draw.textbbox((0, 0), w, font=font, anchor="lt")
        word_widths.append(bbox[2] - bbox[0])
    natural_w = sum(word_widths)
    space_count = len(words) - 1
    target_space = (line_width - natural_w) / space_count
    cur_x = x
    for i, (w, ww) in enumerate(zip(words, word_widths)):
        draw.text((cur_x, y), w, font=font, fill=color, anchor="lt")
        cur_x += ww
        if i < space_count:
            cur_x += target_space

def draw_paragraph(draw, text, font, x, y, max_w, color, line_spacing=1.32, justified=True):
    """Render a paragraph wrapped + optionally justified. Returns the y
    position after the last line."""
    lines = wrap_text(text, font, max_w, draw)
    # Get one line's metric height
    sample_bbox = draw.textbbox((0, 0), "Mg", font=font, anchor="lt")
    line_h = (sample_bbox[3] - sample_bbox[1]) * line_spacing
    for i, ln in enumerate(lines):
        is_last = (i == len(lines) - 1)
        if justified:
            draw_justified_line(draw, ln, font, x, int(y), max_w, color, is_last)
        else:
            draw.text((x, int(y)), ln, font=font, fill=color, anchor="lt")
        y += line_h
    return y

def render_teal_gradient(canvas, start_y, end_y):
    """Same cream→teal vertical gradient as the front cover."""
    px = canvas.load()
    for y in range(start_y, end_y):
        t = (y - start_y) / max(1, end_y - start_y - 1)
        t = t ** 0.85
        r = int(CREAM_FAINT[0] * (1 - t) + TEAL_DEEP[0] * t)
        g = int(CREAM_FAINT[1] * (1 - t) + TEAL_DEEP[1] * t)
        b = int(CREAM_FAINT[2] * (1 - t) + TEAL_DEEP[2] * t)
        for x in range(W):
            existing = px[x, y]
            if existing[:3] == CREAM:
                px[x, y] = (r, g, b, 255) if len(existing) == 4 else (r, g, b)

def render_hashes(canvas, top_y, bottom_y, rows=22, seed=137, exclude_rect=None):
    """Scatter hash text through the teal zone, avoiding exclude_rect."""
    random.seed(seed)
    draw = ImageDraw.Draw(canvas, mode="RGBA")
    row_height = (bottom_y - top_y) / rows
    for i in range(rows):
        y = top_y + int(i * row_height)
        t = i / max(1, rows - 1)
        n = int(3 + 12 * t)
        size = int(11 + 5 * t)
        font = load_font(FONT_MONO, size)
        alpha = int(120 + 100 * t)
        slot_w = W / n
        for j in range(n):
            cx = int(j * slot_w + random.uniform(0, slot_w))
            cy = y + random.randint(-3, 3)
            # Skip placement inside the excluded rectangle (ISBN/publisher)
            if exclude_rect:
                ex0, ey0, ex1, ey1 = exclude_rect
                if ex0 <= cx <= ex1 and ey0 <= cy <= ey1:
                    continue
            text = random.choice(HASHES)
            r = TEAL_MID[0] + random.randint(-15, 15)
            g = TEAL_MID[1] + random.randint(-15, 15)
            b = TEAL_MID[2] + random.randint(-15, 15)
            local_alpha = alpha + random.randint(-50, 50)
            local_alpha = max(60, min(255, local_alpha))
            draw.text((cx, cy), text, font=font,
                      fill=(max(0, r), max(0, g), max(0, b), local_alpha))

def draw_isbn_placeholder(draw, x, y, w, h):
    """White rectangle with 'ISBN' label — placeholder for the real barcode."""
    # White background
    draw.rectangle((x, y, x + w, y + h), fill=(255, 255, 255), outline=(200, 200, 200), width=2)
    # Fake barcode lines
    bar_y0 = y + 10
    bar_y1 = y + int(h * 0.55)
    bar_x = x + 10
    random.seed(7)
    while bar_x < x + w - 10:
        bw = random.choice([1, 1, 2, 2, 3, 4])
        if bar_x + bw < x + w - 10:
            draw.rectangle((bar_x, bar_y0, bar_x + bw, bar_y1), fill=(0, 0, 0))
        bar_x += bw + random.choice([1, 2, 2, 3])
    # ISBN label
    font_lbl = load_font(FONT_SANS, 13)
    draw.text((x + w // 2, y + h - 18), "ISBN 979-8-XXXXXXX-X-X",
              font=font_lbl, fill=(60, 60, 60), anchor="mm")

def main():
    pct = lambda p: int(H * p / 100)
    canvas = Image.new("RGB", (W, H), CREAM).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    MARGIN = 80  # left/right margin
    CONTENT_W = W - 2 * MARGIN

    # 1. PULL QUOTE (top 10%–22%)
    quote_font = load_font(FONT_ITALIC, 42)
    quote_y = pct(11)
    draw_paragraph(draw, PULL_QUOTE, quote_font, MARGIN, quote_y, CONTENT_W,
                   GREY_MID, line_spacing=1.20, justified=False)

    # 2. Thin separator
    sep_y = pct(26)
    draw.line((MARGIN, sep_y, W - MARGIN, sep_y), fill=(200, 195, 180), width=2)

    # 3. MARKETING BLURB (body serif, justified, paragraph spacing)
    body_font = load_font(FONT_ITALIC, 28)  # Playfair italic at body size
    body_color = CHARCOAL
    y_pos = pct(30)
    paragraph_gap = 18
    for paragraph in BLURB_PARAGRAPHS:
        y_pos = draw_paragraph(draw, paragraph, body_font, MARGIN, y_pos,
                                CONTENT_W, body_color,
                                line_spacing=1.40, justified=True)
        y_pos += paragraph_gap

    # 4. AUTHOR BIO (italic, smaller)
    bio_font = load_font(FONT_ITALIC, 22)
    bio_y = pct(70)
    draw_paragraph(draw, AUTHOR_BIO, bio_font, MARGIN, bio_y, CONTENT_W,
                   GREY_MID, line_spacing=1.40, justified=False)

    # 5. Teal gradient zone — starts at 82% (lower than front to leave
    # room for text above)
    grad_start = pct(82)
    render_teal_gradient(canvas, grad_start, H)

    # 6. ISBN placeholder and Publisher mark in the teal zone
    isbn_w, isbn_h = 220, 110
    isbn_x = W - MARGIN - isbn_w
    isbn_y = H - 130
    draw = ImageDraw.Draw(canvas)
    draw_isbn_placeholder(draw, isbn_x, isbn_y, isbn_w, isbn_h)

    publisher_font = load_font(FONT_SANS, 24)
    draw.text((MARGIN, H - 80), "A G F A R M S",
              font=publisher_font, fill=(255, 255, 255), anchor="lm")

    # 7. Scatter hashes in the teal zone, avoiding the ISBN + publisher area
    exclude = (isbn_x - 20, isbn_y - 10, isbn_x + isbn_w + 20, isbn_y + isbn_h + 10)
    render_hashes(canvas, grad_start + 30, H - 30, rows=18,
                  exclude_rect=exclude)

    # Save
    out = COVER_DIR / "back-hd.png"
    canvas.convert("RGB").save(out, "PNG")
    print(f"✓ wrote {out} ({out.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
