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
FONT_BODY = FONTS_DIR / "EBGaramond.ttf"         # roman body
FONT_BODY_ITALIC = FONTS_DIR / "EBGaramond-Italic.ttf"   # italic for emphasis/quote
FONT_ITALIC = FONTS_DIR / "Playfair-Italic.ttf"  # kept for pull quote only
FONT_SANS = FONTS_DIR / "Inter.ttf"
FONT_MONO = FONTS_DIR / "JetBrainsMono.ttf"

# Back-cover copy — every sentence ends with a period.
PULL_QUOTE = "“A field report from inside the digital dollar economy.”"

# Marketing blurb — clean paragraphs, every sentence properly punctuated.
# Rewritten 2026-05-12 to flow as full sentences instead of fragment lists.
BLURB_PARAGRAPHS = [
    "Four cities. Four people. The same invisible infrastructure — "
    "from Bogotá to Harare to Lagos to a rooftop in Buenos Aires.",
    "When the old banking pipes break, the people who feel it first are "
    "the ones moving money across borders. Pablo in Bogotá sends his "
    "mother medicine money in ninety seconds for under two dollars. "
    "Mercy in Harare protects a women's savings club from fifty-six "
    "percent inflation by parking the pot in a digital dollar. Femi in "
    "Lagos closes a hundred-thousand-dollar supplier deal from the back "
    "of a parked car.",
    "This is what happens when stablecoins quietly become the bridge "
    "from slow money to fast money. Not the speculation side of crypto. "
    "The side that just works.",
]

AUTHOR_BIO = (
    "GIANY ROX is the founder of AGFarms, a venture studio shipping "
    "more than sixteen products from a single terminal. His writing on "
    "math, money, and the future of work has appeared on Medium for years."
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

def draw_paragraph(draw, text, font, x, y, max_w, color, line_spacing=1.32, justified=False):
    """Render a paragraph wrapped + LEFT-ALIGNED. Returns the y position
    after the last line.

    Justification removed entirely — drawing per-word breaks OpenType
    layout context (kerning, ligatures, contextual alternates) and was
    causing certain words to render at the wrong weight/size. Pillow's
    text engine renders the full line as one shaped run when given a
    single string; we preserve that.
    """
    _ = justified  # accepted for backward compatibility; ignored
    lines = wrap_text(text, font, max_w, draw)
    sample_bbox = draw.textbbox((0, 0), "Mg", font=font, anchor="lt")
    line_h = (sample_bbox[3] - sample_bbox[1]) * line_spacing
    for ln in lines:
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
    """Clean white rectangle reserved for KDP's auto-inserted EAN-13 barcode.
    KDP places the real barcode for ISBN 9798196679834 in this area at print.
    We leave it blank — no fake bars, no placeholder text — per KDP's cover
    formatting guide (Section: "Barcode area"). Just a clean white rectangle
    sized 2" × 1.2" at the proper position in the bottom-right of the back
    cover, scaled here to the 1024×1536 source canvas (~340 × 195 px = ~33%
    of width, which matches KDP's 2"/6" ratio after upscale to print)."""
    draw.rectangle((x, y, x + w, y + h), fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    # Tiny human-readable ISBN under the barcode area, in light grey so it
    # doesn't fight the auto-inserted barcode if KDP places its own digits.
    font_lbl = load_font(FONT_SANS, 11)
    draw.text((x + w // 2, y + h + 8), "ISBN 979-8-1966798-3-4",
              font=font_lbl, fill=(170, 170, 170), anchor="mm")

def main():
    pct = lambda p: int(H * p / 100)

    # Use the empty template (generated from front-hd by gpt-image-1) as
    # the canvas so the back panel's gradient + hash field matches the
    # front EXACTLY. Falls back to a cream blank if the template is
    # missing (you can regenerate it with `node scripts/gen-empty-template.mjs`).
    template_path = COVER_DIR / "_refs" / "empty-template.png"
    if template_path.exists():
        canvas = Image.open(template_path).convert("RGBA")
        # Ensure template is the expected size; resample if not
        if canvas.size != (W, H):
            canvas = canvas.resize((W, H), Image.LANCZOS)
    else:
        canvas = Image.new("RGBA", (W, H), CREAM + (255,))
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

    # 3. MARKETING BLURB — EB Garamond roman, left-aligned to preserve
    # OpenType layout context.
    body_font = load_font(FONT_BODY, 30)
    body_color = CHARCOAL
    y_pos = pct(30)
    paragraph_gap = 22
    for paragraph in BLURB_PARAGRAPHS:
        y_pos = draw_paragraph(draw, paragraph, body_font, MARGIN, y_pos,
                                CONTENT_W, body_color,
                                line_spacing=1.40)
        y_pos += paragraph_gap

    # 4. AUTHOR BIO — italic EB Garamond, positioned IN the teal zone
    # near the bottom, rendered in cream/white for proper contrast.
    # Editorial back-cover convention: bio sits over the dark backdrop
    # just above the publisher mark + barcode.
    bio_font = load_font(FONT_BODY_ITALIC, 22)
    # Render bio bottom-anchored, just above the ISBN/AGFarms strip
    bio_lines = wrap_text(AUTHOR_BIO, bio_font, CONTENT_W, draw)
    sample_bbox = draw.textbbox((0, 0), "Mg", font=bio_font, anchor="lt")
    bio_line_h = (sample_bbox[3] - sample_bbox[1]) * 1.40
    bio_block_h = bio_line_h * len(bio_lines)
    # Bio sits well ABOVE the KDP barcode region. The barcode reservation
    # spans roughly y=H-250 to y=H-50 (200px tall + 80px text gap below the
    # publisher mark). So bio must end above y=H-280 with comfortable margin.
    bio_y = H - 320 - bio_block_h  # bio ends 320px from bottom (clear of barcode)
    for ln in bio_lines:
        draw.text((MARGIN, int(bio_y)), ln, font=bio_font,
                  fill=(248, 240, 220), anchor="lt")
        bio_y += bio_line_h

    # 5. ISBN placeholder and Publisher mark in the teal zone of the template
    # KDP auto-overlays the real EAN-13 barcode for ISBN 9798196679834 in
    # the bottom-right of the back cover at print. We leave clean negative
    # space there — no white box, no fake bars, no placeholder text. KDP
    # places its own white background + barcode + digits at print time.
    draw = ImageDraw.Draw(canvas)

    publisher_font = load_font(FONT_SANS, 24)
    draw.text((MARGIN, H - 80), "A G F A R M S",
              font=publisher_font, fill=(255, 255, 255), anchor="lm")

    # NO additional hash rendering — the template already has the full
    # hash field matching the front. We only added text on top.

    # Save
    out = COVER_DIR / "back-hd.png"
    canvas.convert("RGB").save(out, "PNG")
    print(f"✓ wrote {out} ({out.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
