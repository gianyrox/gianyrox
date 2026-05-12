#!/usr/bin/env node
// gen-cover-optimal-v2.mjs — Round 8 refinements per founder 2026-05-12:
//   1. Gradient starts TOO HIGH currently — push it down so there is
//      generous cream space around the bill (only bottom ~35% is teal)
//   2. Dollar bill — more ripped / damaged tear edges, frayed paper,
//      slight curl where torn, more visual damage
//   3. Washington's face — fully accurate to reference (don't redraw)
//   4. Author name "GIANY ROX" — significantly larger, follow proper
//      book-cover typography standards (~25-30% of title height)
//
// Book design proportions (6×9 trade paperback standard):
//   - Title (~75-90pt) takes ~10-12% of cover height
//   - Subtitle (~28-32pt) takes ~4-5%
//   - Author byline (~36-42pt) takes ~5-6% — currently way too small
//   - Hero element (the bill) takes ~25-30%
//   - Generous whitespace between all elements

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Book cover refinement. Use the FIRST reference for composition + style.
Use the SECOND reference (real US $1 bill) for the dollar — render it
with full engraving fidelity. Do NOT redraw Washington's portrait;
preserve the engraving lines, his hair, collar, expression exactly.

PROPER BOOK COVER PROPORTIONS (6×9 trade paperback standard):

1. TITLE block — top 12% of cover, with 6% top margin above it
   "YOUR MONEY IS BROKEN"
   Bold transitional serif (Sapiens UK / GT Sectra / Bodoni style).
   Heavy weight. Slightly condensed. High contrast. Charcoal #1a1a1a.

2. SUBTITLE block — 2% below title, 5% tall
   "How Stablecoins Bridge Slow Money to Fast Money"
   Same serif family, italic, lighter weight, medium grey #555.

3. CREAM BREATHING SPACE — 4–6% of cover height between subtitle and bill

4. DOLLAR BILL — centered horizontally, ~28% of cover height, real $1
   proportions (~2.61:1 wider than tall).
   Critical: bill is TORN with VISIBLE DAMAGE.
   - Jagged, frayed paper edges along the vertical tear line
   - Small loose paper fibers visible at the tear
   - Slight curl/lift where the tear edges peel away from each other
   - The two halves slightly offset — left half a hair lower than right,
     or vice versa, suggesting the tear is recent and dynamic
   - Soft natural shadow under the bill
   - Subtle wear at the bill corners (slight crease lines), but not so
     much that the bill looks unusable — just photographically real

5. CREAM BREATHING SPACE — 3–5% of cover height between bill and the
   start of the teal gradient

6. TEAL GRADIENT ZONE — starts about 60% down the cover (NOT at 50%).
   Only the BOTTOM 35–40% of the cover is teal. The gradient transitions
   from cream at its top edge into deep teal #1d6f63 at the very bottom.

   Inside the teal gradient zone:
   - One thin teal hash strand bridges the tear on the bill (above this
     zone): "0xa1f3...e9c2"
   - The full teal gradient zone is FILLED with overlapping monospace
     hash text. Not a thin column — the entire teal area, edge to edge,
     top of gradient to bottom.
   - Multiple horizontal rows (20–30) of small hash fragments at varying
     sizes, opacities, and slight angles
   - Sparse and small at the top of the gradient (just below the bill);
     dense and brighter at the bottom (around the author byline)
   - Hash fragments: "0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0",
     "0x0926", "0xe9c2", "0xa173", "0x8b4d", "c857", "d4f0", "7df0",
     "e926", "a1f3", "b471"

7. AUTHOR BYLINE — at the bottom of the cover, with ~4% bottom margin
   "GIANY ROX"
   Humanist sans-serif (Inter / Source Sans 3 / Founders Grotesk).
   Uppercase, generously letter-spaced (~0.15em).
   CRITICAL: significantly LARGER than in the reference image —
   approximately 5–6% of cover height (currently it's about 3%, which
   is too small for proper book design). Should read confidently from
   3 meters away on a bookshelf.
   Color: cream/white, punching cleanly out of the dense teal hash
   field that surrounds it.

DOLLAR BILL ACCURACY CHECKLIST:
- Washington portrait fully matches the second reference image's
  engraving (don't redraw)
- "FEDERAL RESERVE NOTE" centered at top of bill, correctly spelled
- "THE UNITED STATES OF AMERICA" below it, correctly spelled
- "ONE DOLLAR" at bottom of bill, correctly spelled
- Corner numerals "1" on all four corners
- Serial number "L11180916G" (or similar real serial format) visible
- Green Treasury seal on the right (with eagle and shield detail)
- Black Federal Reserve seal on the left with the letter "L"
- The engraved scrollwork around the portrait intact
- ONE means a single, fully formed and clearly readable word

OVERALL AESTHETIC:
- Penguin Press / Sapiens shelf editorial
- NO crypto-bro, NO neon, NO laser eyes
- Cream #faf6eb everywhere there is no other element
- The cream space around the bill must be GENEROUS, not cramped
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const compRef = await readFile(join(OUT_DIR, 'optimal.png'));
  const dollarRef = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log('→ rendering optimal-v2 (~$0.17)');

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', PROMPT);
  form.append('image[]', new Blob([compRef], { type: 'image/png' }), 'composition.png');
  form.append('image[]', new Blob([dollarRef], { type: 'image/png' }), 'dollar.png');
  form.append('n', '1');
  form.append('size', '1024x1536');
  form.append('quality', 'high');
  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) { console.error(`OpenAI ${r.status}:`, (await r.text()).slice(0, 300)); process.exit(1); }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) { console.error('no b64'); process.exit(1); }
  const out = join(OUT_DIR, 'optimal-v2.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
