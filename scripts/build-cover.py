#!/usr/bin/env python3
"""
build-cover.py — Pixel-exact book cover compositor for Your Money Is Broken.

After 6 rounds of fighting gpt-image-1's interpretation of "the gradient
should be in the bottom 30%, hashes throughout, author name big", switching
to programmatic rendering for total control. AI handles only the dollar
bill (which it does well with the real $1 reference).

Layout (every percentage is HARD — no AI hand-waving):
  0–6%    margin
  6–18%   TITLE
  20–25%  SUBTITLE
  25–32%  cream breathing space
  32–57%  DOLLAR BILL (centered, ~64% canvas width)
  57–70%  cream breathing space (more)
  70–100% TEAL GRADIENT zone + dense hash field + AUTHOR BYLINE at bottom

Run:
  python3 scripts/build-cover.py
  python3 scripts/build-cover.py --gradient-start 72 --hash-rows 35
"""

import argparse
import random
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("pip install Pillow")

REPO = Path(__file__).resolve().parent.parent
COVER_DIR = REPO / "public" / "cover"
FONTS_DIR = COVER_DIR / "_fonts"

W, H = 1024, 1536                   # Cover dimensions
CREAM = (250, 246, 235)             # Page background
CHARCOAL = (26, 26, 26)             # Title
GREY_MID = (85, 85, 85)             # Subtitle
TEAL_DEEP = (29, 111, 99)           # Bottom of gradient
TEAL_MID = (42, 157, 143)           # Hash text base color
CREAM_FAINT = (240, 232, 215)       # Faintest cream for blending

FONT_TITLE = FONTS_DIR / "Playfair-Black.ttf"
FONT_TITLE_ITALIC = FONTS_DIR / "Playfair-Italic.ttf"
FONT_SANS = FONTS_DIR / "Inter.ttf"
FONT_MONO = FONTS_DIR / "JetBrainsMono.ttf"

# Hash fragments to scatter through the teal field
HASHES = [
    "0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0", "0x7df0...0926",
    "0xe9c2...b471", "0xa173...8b4d", "0x0a13", "0xc857", "0xd4f0",
    "0x7df0", "0xe926", "0xa1f3", "0xb471", "0xddf0", "0xaf12", "0x6f3c",
    "0x9e2a", "0xf501", "c857", "d4f0", "7df0", "e926", "a1f3", "b471",
    "8b4d", "ddf0", "aaf3", "9e2a", "0x4b1c...e9c2", "0xfab3...77d1",
]

def load_font(path, size):
    return ImageFont.truetype(str(path), size)

def draw_centered(draw, text, font, y, fill, anchor="mt"):
    bbox = draw.textbbox((0, 0), text, font=font, anchor="lt")
    text_w = bbox[2] - bbox[0]
    draw.text((W // 2, y), text, font=font, fill=fill, anchor=anchor)
    return bbox

def render_teal_gradient(canvas, start_y, end_y):
    """Render the vertical teal gradient from start_y → end_y on canvas.
    Above start_y: untouched (cream stays). Within zone: smooth lerp from
    cream-faint to deep teal."""
    px = canvas.load()
    for y in range(start_y, end_y):
        t = (y - start_y) / max(1, end_y - start_y - 1)
        # Ease-in curve so gradient feels weighted to the bottom
        t = t ** 0.85
        r = int(CREAM_FAINT[0] * (1 - t) + TEAL_DEEP[0] * t)
        g = int(CREAM_FAINT[1] * (1 - t) + TEAL_DEEP[1] * t)
        b = int(CREAM_FAINT[2] * (1 - t) + TEAL_DEEP[2] * t)
        for x in range(W):
            # Preserve cream where the canvas already has the bill etc.
            existing = px[x, y]
            # Only fill where the canvas is currently cream
            if existing[:3] == CREAM:
                px[x, y] = (r, g, b, 255) if len(existing) == 4 else (r, g, b)

def render_hashes(canvas, top_y, bottom_y, rows=28, seed=42):
    """Densely scatter hash text across the teal zone. Density + size
    progress from sparse/small at top to dense/larger at bottom. Each
    hash draws atop the teal gradient with varying opacity."""
    random.seed(seed)
    draw = ImageDraw.Draw(canvas, mode="RGBA")
    row_height = (bottom_y - top_y) / rows
    for i in range(rows):
        y = top_y + int(i * row_height)
        t = i / max(1, rows - 1)  # 0 at top, 1 at bottom
        # Density progression: # of hashes per row scales from 3 → 18
        n = int(3 + 15 * t)
        # Size progression: small at top → bigger at bottom
        size = int(11 + 6 * t)
        font = load_font(FONT_MONO, size)
        # Opacity: faint at top → bright at bottom
        alpha = int(120 + 100 * t)
        # Distribute n hashes across the row width with jitter
        slot_w = W / n
        for j in range(n):
            cx = int(j * slot_w + random.uniform(0, slot_w))
            cy = y + random.randint(-3, 3)
            hash_text = random.choice(HASHES)
            # Add a slight color jitter
            r = TEAL_MID[0] + random.randint(-15, 15)
            g = TEAL_MID[1] + random.randint(-15, 15)
            b = TEAL_MID[2] + random.randint(-15, 15)
            # Some hashes very faint (background fillers), some bright
            local_alpha = alpha + random.randint(-50, 50)
            local_alpha = max(60, min(255, local_alpha))
            color = (max(0, r), max(0, g), max(0, b), local_alpha)
            draw.text((cx, cy), hash_text, font=font, fill=color)

def render_drip_column(canvas, bill_bottom_y, gradient_start_y):
    """The signature vertical drip from the bill into the gradient zone.
    Hash text falling vertically, getting larger and brighter as it
    descends. This drip is in addition to the dense hash field."""
    draw = ImageDraw.Draw(canvas, mode="RGBA")
    drip_top = bill_bottom_y + 12
    drip_bottom = gradient_start_y + 80   # extends slightly into gradient
    n = 7
    samples = ["0xa1f3...e9c2", "0xb471", "0xc857", "0xd4f0", "0x7df0",
               "0xa173", "0x0926"]
    for i in range(n):
        t = i / (n - 1)
        y = int(drip_top + t * (drip_bottom - drip_top))
        size = int(18 + 4 * t)
        font = load_font(FONT_MONO, size)
        alpha = int(180 + 50 * t)
        text = samples[i % len(samples)]
        bbox = draw.textbbox((0, 0), text, font=font, anchor="lt")
        text_w = bbox[2] - bbox[0]
        draw.text(((W - text_w) // 2, y), text, font=font,
                  fill=(TEAL_MID[0], TEAL_MID[1], TEAL_MID[2], alpha))

def composite_bill(canvas, bill_path, top_y, target_w_pct=0.66):
    """Drop the dollar bill onto the canvas. Trim outer cream margins,
    then KEY OUT the remaining background-cream pixels (replace with
    canvas-cream so there's no visible color seam)."""
    bill = Image.open(bill_path).convert("RGB")
    # Sample background corners and decide trim bbox
    bbox = trim_cream_bbox(bill)
    if bbox:
        bill = bill.crop(bbox)
    # Replace any remaining background-cream pixels (within tolerance of
    # the bill's outer cream sample) with the canvas's exact CREAM color
    bill = recolor_background(bill, target=CREAM, tolerance=30)
    target_w = int(W * target_w_pct)
    target_h = int(bill.size[1] * target_w / bill.size[0])
    bill = bill.resize((target_w, target_h), Image.LANCZOS)
    x = (W - target_w) // 2
    canvas.paste(bill, (x, top_y))
    return top_y + target_h

def recolor_background(img, target, tolerance=30):
    """Replace pixels that are close to the corner-cream color with the
    given target color. Operates only on pixels OUTSIDE the bill's
    visual bounds (corners area) — uses connected-component-style flood
    from the corners inward."""
    out = img.copy()
    px = out.load()
    w, h = out.size
    # Use the corner sample as the reference background
    samples = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    avg = (sum(s[0] for s in samples) // 4,
           sum(s[1] for s in samples) // 4,
           sum(s[2] for s in samples) // 4)
    # Flood from each corner replacing matching pixels with target
    from collections import deque
    visited = set()
    queue = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= w or y >= h:
            continue
        visited.add((x, y))
        r, g, b = px[x, y][:3]
        if (abs(r - avg[0]) <= tolerance and
            abs(g - avg[1]) <= tolerance and
            abs(b - avg[2]) <= tolerance):
            px[x, y] = target
            queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return out

def trim_cream_bbox(img, tolerance=40):
    """Find the bounding box of non-cream pixels in img. Tolerance is
    permissive — AI-rendered bills have a slightly different cream than
    the canvas (e.g. (245, 240, 225) vs our (250, 246, 235)). Sample
    the corner pixel and use IT as the reference cream rather than
    the canvas constant."""
    px = img.load()
    w, h = img.size
    # Sample the actual background color from the four corners (avg)
    samples = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    avg = (
        sum(s[0] for s in samples) // 4,
        sum(s[1] for s in samples) // 4,
        sum(s[2] for s in samples) // 4,
    )
    is_cream = lambda r, g, b: (
        abs(r - avg[0]) <= tolerance and
        abs(g - avg[1]) <= tolerance and
        abs(b - avg[2]) <= tolerance
    )
    # Find top edge
    top = 0
    for y in range(h):
        row_has_content = False
        for x in range(0, w, 4):
            if not is_cream(*px[x, y][:3]):
                row_has_content = True; break
        if row_has_content: top = y; break
    # Bottom
    bot = h - 1
    for y in range(h - 1, -1, -1):
        row_has_content = False
        for x in range(0, w, 4):
            if not is_cream(*px[x, y][:3]):
                row_has_content = True; break
        if row_has_content: bot = y; break
    # Left
    left = 0
    for x in range(w):
        col_has_content = False
        for y in range(0, h, 4):
            if not is_cream(*px[x, y][:3]):
                col_has_content = True; break
        if col_has_content: left = x; break
    # Right
    right = w - 1
    for x in range(w - 1, -1, -1):
        col_has_content = False
        for y in range(0, h, 4):
            if not is_cream(*px[x, y][:3]):
                col_has_content = True; break
        if col_has_content: right = x; break
    # Pad by a few pixels to keep some bill bleed
    pad = 4
    return (max(0, left - pad), max(0, top - pad),
            min(w, right + pad), min(h, bot + pad))

def extract_bill_from(src_path, out_path):
    """Best-effort crop of the bill from an existing optimal cover."""
    img = Image.open(src_path).convert("RGB")
    # Heuristic crop: from existing optimal* covers, bill sits roughly
    # at y ~370–650 of a 1024×1536 canvas, x ~150–870
    bbox = (140, 360, 880, 680)
    bill = img.crop(bbox)
    bill.save(out_path)
    return out_path

def build(args):
    # Layout y-coordinates as percentages of H
    pct = lambda p: int(H * p / 100)
    TITLE_Y = pct(8)
    SUBTITLE_Y = pct(20)
    BILL_TOP_Y = pct(34)
    GRADIENT_TOP_Y = pct(args.gradient_start)
    AUTHOR_Y = pct(91)

    canvas = Image.new("RGB", (W, H), CREAM)

    # 1. Title
    title_font = load_font(FONT_TITLE, 105)
    draw = ImageDraw.Draw(canvas)
    # Title spans 2 lines: "YOUR MONEY" / "IS BROKEN"
    line1 = "YOUR MONEY"
    line2 = "IS BROKEN"
    bbox1 = draw.textbbox((0, 0), line1, font=title_font, anchor="lt")
    bbox2 = draw.textbbox((0, 0), line2, font=title_font, anchor="lt")
    draw.text((W // 2, TITLE_Y), line1, font=title_font, fill=CHARCOAL, anchor="mt")
    draw.text((W // 2, TITLE_Y + (bbox1[3] - bbox1[1]) + 4), line2, font=title_font, fill=CHARCOAL, anchor="mt")

    # 2. Subtitle — Playfair Italic at proper book size (~50pt)
    sub_font = load_font(FONT_TITLE_ITALIC, 50)
    sub_line1 = "How Stablecoins Bridge"
    sub_line2 = "Slow Money to Fast Money"
    draw.text((W // 2, SUBTITLE_Y), sub_line1, font=sub_font, fill=GREY_MID, anchor="mt")
    sub_bbox = draw.textbbox((0, 0), sub_line1, font=sub_font, anchor="lt")
    draw.text((W // 2, SUBTITLE_Y + (sub_bbox[3] - sub_bbox[1]) + 8), sub_line2, font=sub_font, fill=GREY_MID, anchor="mt")

    # 3. Bill
    bill_path = args.bill_image or (COVER_DIR / "_refs" / "bill-extracted.png")
    if not bill_path.exists():
        # Extract from optimal-v3 if no explicit bill provided
        src = COVER_DIR / "optimal-v3.png"
        extract_bill_from(src, bill_path)
    bill_bottom = composite_bill(canvas, bill_path, BILL_TOP_Y, target_w_pct=0.70)

    # 4. Teal gradient — ONLY in the specified zone
    render_teal_gradient(canvas, GRADIENT_TOP_Y, H)

    # 5. Dense hash field across the gradient zone
    render_hashes(canvas, GRADIENT_TOP_Y + 10, H - 30, rows=args.hash_rows)

    # 6. The signature drip from bill into gradient (more visible column)
    render_drip_column(canvas, bill_bottom, GRADIENT_TOP_Y)

    # 7. Author byline — properly large per book standards (~6% of H)
    # Convert to RGBA so the dark band alpha-blends correctly with the
    # underlying hash field.
    canvas_rgba = canvas.convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(overlay)
    author_font = load_font(FONT_SANS, 68)
    author_text = "G I A N Y   R O X"
    bbox = bd.textbbox((0, 0), author_text, font=author_font, anchor="lt")
    text_h = bbox[3] - bbox[1]
    # Solid dark teal band behind byline so it reads clean against hashes
    band_y0 = AUTHOR_Y - 12
    band_y1 = AUTHOR_Y + text_h + 32
    bd.rectangle((0, band_y0, W, band_y1), fill=(15, 60, 55, 220))
    # Draw the byline in cream on top of the overlay
    bd.text((W // 2, AUTHOR_Y), author_text, font=author_font,
            fill=(250, 246, 235, 255), anchor="mt")
    canvas_rgba = Image.alpha_composite(canvas_rgba, overlay)
    canvas = canvas_rgba.convert("RGB")
    draw = ImageDraw.Draw(canvas)  # rebind for any later usage

    out = COVER_DIR / args.out
    # canvas may have been rebound to RGB above — save it
    if canvas.mode != "RGB":
        canvas = canvas.convert("RGB")
    canvas.save(out, "PNG")
    print(f"✓ wrote {out} ({out.stat().st_size // 1024} KB)")
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gradient-start", type=int, default=70,
                    help="Percentage of cover height where teal gradient starts (default 70)")
    ap.add_argument("--hash-rows", type=int, default=28,
                    help="Number of hash text rows in the gradient zone (default 28)")
    ap.add_argument("--bill-image", type=Path, default=None,
                    help="Path to dollar bill PNG (with alpha or cream bg). Default: extract from optimal-v3.")
    ap.add_argument("--out", default="final.png", help="Output filename inside public/cover/")
    args = ap.parse_args()
    build(args)

if __name__ == "__main__":
    main()
