#!/usr/bin/env python3
"""
build-kdp-wrap.py — compose the full KDP paperback cover wrap from the
existing front + back panels + a derived spine.

KDP 6×9 paperback dimensions (white paper, 117 pages):
  Spine width = pages × 0.002252 inch = 117 × 0.002252 = 0.2635" ≈ 0.264"
  Trim: 6 × 9 inches each panel
  Bleed: 0.125" on all 4 outer edges
  Total wrap dimensions:
     Width  = bleed + back + spine + front + bleed
            = 0.125 + 6 + 0.264 + 6 + 0.125 = 12.514"
     Height = bleed + 9 + bleed = 9.25"

At 300 DPI:
     Width  px = 12.514 × 300 = 3754
     Height px = 9.25  × 300 = 2775

Output: public/cover/kdp-wrap.pdf (KDP requires PDF or PNG; PDF preferred
with embedded fonts).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
COVER_DIR = REPO / "public" / "cover"
FONTS_DIR = COVER_DIR / "_fonts"

# Dimensions in inches
PAGE_COUNT = 117
SPINE_INCHES = round(PAGE_COUNT * 0.002252, 4)        # 0.2635"
BLEED_INCHES = 0.125
PANEL_W_INCHES = 6.0
PANEL_H_INCHES = 9.0
DPI = 300

# px
SPINE_PX = int(SPINE_INCHES * DPI)
BLEED_PX = int(BLEED_INCHES * DPI)
PANEL_W_PX = int(PANEL_W_INCHES * DPI)
PANEL_H_PX = int(PANEL_H_INCHES * DPI)
WRAP_W_PX = BLEED_PX * 2 + PANEL_W_PX * 2 + SPINE_PX
WRAP_H_PX = BLEED_PX * 2 + PANEL_H_PX

CREAM = (250, 246, 235)
CHARCOAL = (26, 26, 26)
GREY_MID = (85, 85, 85)
TEAL_DEEP = (29, 111, 99)

def load_font(path, size):
    return ImageFont.truetype(str(path), size)

def fit_panel(img_path, target_w, target_h):
    """Open a panel image and resize so it FILLS (cover-crop) target dims."""
    img = Image.open(img_path).convert("RGB")
    src_ratio = img.size[0] / img.size[1]
    target_ratio = target_w / target_h
    if src_ratio > target_ratio:
        # Source wider — crop horizontally
        new_w = int(img.size[1] * target_ratio)
        x = (img.size[0] - new_w) // 2
        img = img.crop((x, 0, x + new_w, img.size[1]))
    else:
        new_h = int(img.size[0] / target_ratio)
        y = (img.size[1] - new_h) // 2
        img = img.crop((0, y, img.size[0], y + new_h))
    return img.resize((target_w, target_h), Image.LANCZOS)

def draw_spine(target_w, target_h):
    """Render the spine using a vertical slice of the empty template
    (same gpt-image-1 stripped front cover used for the back panel) as
    the canvas, so the spine's gradient + hash field is pixel-identical
    to the front and back. Falls back to a programmatic gradient if
    the template isn't found.

    Title + subtitle + author are typeset horizontally on a tall canvas
    then rotated 90° clockwise so they read bottom-to-top on the spine
    (standard English book direction). Lay out with explicit absolute
    coordinates so they never collide.
    """
    template_path = COVER_DIR / "_refs" / "empty-template.png"
    if template_path.exists():
        tpl = Image.open(template_path).convert("RGB")
        # Take a vertical slice from the horizontal center of the template
        # — width ~150px (so the gradient + scattered hashes are visible).
        slice_w = 150
        cx = tpl.size[0] // 2
        slice_box = (cx - slice_w // 2, 0, cx + slice_w // 2, tpl.size[1])
        slice_img = tpl.crop(slice_box)
        # Resize that slice to the spine dimensions
        img = slice_img.resize((target_w, target_h), Image.LANCZOS)
    else:
        img = Image.new("RGB", (target_w, target_h), CREAM)
        px = img.load()
        gradient_start = int(target_h * 0.70)
        for y in range(gradient_start, target_h):
            t = (y - gradient_start) / max(1, target_h - gradient_start - 1)
            t = t ** 0.85
            r = int(CREAM[0] * (1 - t) + TEAL_DEEP[0] * t)
            g = int(CREAM[1] * (1 - t) + TEAL_DEEP[1] * t)
            b = int(CREAM[2] * (1 - t) + TEAL_DEEP[2] * t)
            for x in range(target_w):
                px[x, y] = (r, g, b)

    # Build a tall horizontal canvas (target_h × target_w) — width and
    # height swapped — render the text horizontally, then rotate 90°
    # clockwise to get the final spine.
    tall = Image.new("RGB", (target_h, target_w), (0, 0, 0))
    tall_alpha = Image.new("L", (target_h, target_w), 0)
    td = ImageDraw.Draw(tall)
    ta = ImageDraw.Draw(tall_alpha)

    # Title font scaled to ~65% of spine width
    title_size = max(18, int(target_w * 0.55))
    title_font = load_font(FONTS_DIR / "Playfair-Black.ttf", title_size)
    title = "YOUR MONEY IS BROKEN"
    # Subtitle in italic, smaller — placed AFTER the title with a gap
    subtitle_size = max(12, int(target_w * 0.28))
    subtitle_font = load_font(FONTS_DIR / "Playfair-Italic.ttf", subtitle_size)
    subtitle = "How Stablecoins Bridge Slow Money to Fast Money"
    # Author smaller still
    author_size = max(12, int(target_w * 0.32))
    author_font = load_font(FONTS_DIR / "Inter.ttf", author_size)
    author = "GIANY ROX"

    # Layout horizontally on the tall canvas:
    #   left margin → TITLE → gap → SUBTITLE → big gap → AUTHOR → right margin
    margin = int(target_h * 0.06)
    cy = target_w // 2  # vertical center on the rotated spine (i.e. spine center horizontally)

    # Measure pieces
    def text_w(text, font):
        bbox = td.textbbox((0, 0), text, font=font, anchor="lm")
        return bbox[2] - bbox[0]

    title_w = text_w(title, title_font)
    subtitle_w = text_w(subtitle, subtitle_font)
    author_w = text_w(author, author_font)

    # Author sits to the RIGHT (bottom of spine when rotated)
    author_x = target_h - margin
    td.text((author_x, cy), author, font=author_font, fill=CHARCOAL, anchor="rm")
    ta.text((author_x, cy), author, font=author_font, fill=255, anchor="rm")

    # Title sits on the LEFT (top of spine when rotated)
    title_x = margin
    td.text((title_x, cy), title, font=title_font, fill=CHARCOAL, anchor="lm")
    ta.text((title_x, cy), title, font=title_font, fill=255, anchor="lm")

    # Subtitle sits IMMEDIATELY after title, smaller, italic
    subtitle_x = title_x + title_w + int(target_h * 0.03)
    td.text((subtitle_x, cy), subtitle, font=subtitle_font, fill=GREY_MID, anchor="lm")
    ta.text((subtitle_x, cy), subtitle, font=subtitle_font, fill=255, anchor="lm")

    # Rotate 90° clockwise to make the spine vertical
    # In PIL, .rotate(90) is counter-clockwise. We want CLOCKWISE so
    # title reads bottom-to-top (standard English book spine direction).
    rotated_text = tall.rotate(-90, expand=True)
    rotated_alpha = tall_alpha.rotate(-90, expand=True)

    # Composite: paste rotated_text onto img using rotated_alpha as mask
    img.paste(rotated_text, (0, 0), rotated_alpha)
    return img

def main():
    print(f"KDP wrap dims: {WRAP_W_PX}×{WRAP_H_PX} px at {DPI}dpi")
    print(f"  spine: {SPINE_PX}px ({SPINE_INCHES}\")")
    print(f"  panel: {PANEL_W_PX}×{PANEL_H_PX}px each")
    print(f"  bleed: {BLEED_PX}px each side")

    wrap = Image.new("RGB", (WRAP_W_PX, WRAP_H_PX), CREAM)

    # Back panel — fills the left portion (after left bleed)
    back_full_w = BLEED_PX + PANEL_W_PX     # back panel extends into the bleed
    back_full_h = BLEED_PX * 2 + PANEL_H_PX
    back = fit_panel(COVER_DIR / "back-hd.png", back_full_w, back_full_h)
    wrap.paste(back, (0, 0))

    # Spine
    spine_x = back_full_w
    spine = draw_spine(SPINE_PX, back_full_h)
    wrap.paste(spine, (spine_x, 0))

    # Front panel — fills the right portion (extends into the right bleed)
    front_full_w = PANEL_W_PX + BLEED_PX
    front = fit_panel(COVER_DIR / "front-hd.png", front_full_w, back_full_h)
    wrap.paste(front, (spine_x + SPINE_PX, 0))

    out_png = COVER_DIR / "kdp-wrap.png"
    wrap.save(out_png, "PNG", dpi=(DPI, DPI))
    print(f"\n✓ {out_png} ({out_png.stat().st_size // 1024} KB, {DPI}dpi)")

    # Also export as PDF (KDP accepts both)
    out_pdf = COVER_DIR / "kdp-wrap.pdf"
    wrap.save(out_pdf, "PDF", resolution=DPI)
    print(f"✓ {out_pdf}")

if __name__ == "__main__":
    main()
