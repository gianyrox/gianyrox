#!/usr/bin/env node
// gen-cover-optimal-v3.mjs — Round 9.
// Two critical fixes from v2:
//   1. Teal gradient starts WAY lower — only the bottom 25-30% of the
//      cover is teal. Bill sits with generous cream space above AND
//      below it. Gradient begins ~65-70% down the cover, not 50-60%.
//   2. Hash density at the level of optimal.png (v1) — many overlapping
//      hash text fragments throughout the entire teal zone. NOT sparse.
//
// Feeding BOTH previous attempts as references so gpt-image-1 sees:
//   - optimal.png    → for the hash density to restore
//   - optimal-v2.png → for the title/author/bill sizing that worked
// + the real $1 reference for bill fidelity.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Book cover refinement. THREE reference images:
  - First reference (composition): match the HASH DENSITY of this image
    in the teal zone. Many overlapping hash text fragments, NOT sparse.
  - Second reference (sizing): match the TITLE / SUBTITLE / AUTHOR NAME
    SIZING + the cream space around the bill from this image.
  - Third reference (dollar): render the dollar with full engraving
    fidelity from this real US $1 bill. Do NOT redraw Washington.

CRITICAL LAYOUT — proportions must match this exactly:

  0%   ─── TOP OF COVER ───
  6%   start of TITLE block
       "YOUR MONEY IS BROKEN" — bold transitional serif, charcoal,
       takes ~10% of cover height
  18%  end of title
  20%  start of SUBTITLE
       "How Stablecoins Bridge Slow Money to Fast Money" — italic
       serif, lighter, takes ~5%
  25%  end of subtitle
  30%  cream breathing space
  32%  TOP of DOLLAR BILL
       real US $1, real 2.61:1 proportions, TORN VERTICALLY through
       the middle with VISIBLY FRAYED EDGES (jagged paper, loose
       fibers, slight curl on the torn edges)
  57%  BOTTOM of DOLLAR BILL (so the bill is ~25% of cover height)
  58%  cream breathing space (NO teal yet)
  68%  cream breathing space continues
  70%  ───── START OF TEAL GRADIENT ─────
       The teal gradient ONLY occupies the bottom 30% of the cover.
       From 70% down to 92%, the gradient transitions from cream at
       the top edge into deep teal #1d6f63 at the bottom.
  92%  AUTHOR BYLINE
       "GIANY ROX" — humanist sans-serif uppercase, generously
       letter-spaced, ~5% of cover height, in cream/white punching
       out of the dense teal hash matrix
  98%  end of byline
  100% bottom of cover

THE HASH FIELD inside the teal gradient zone (rows 70%–95%):

The ENTIRE teal zone is densely packed with overlapping monospace hash
text. Match the density of the FIRST reference image — many many
small hash fragments stacked in rows across the full width, edge to
edge. NOT sparse. NOT a thin column. The whole gradient zone is a
matrix of overlapping hash text.

- 20–30 horizontal rows visible from top to bottom of the teal zone
- Each row spans the full cover width
- Hash fragments at varying sizes (some 8pt, some 14pt, some 18pt)
- Varying opacities (some near-cream-faint, some bright teal)
- Some at slight rotation angles
- Fragments: "0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0",
  "0x0926", "0xe9c2", "0xa173", "0x8b4d", "c857", "d4f0", "7df0",
  "e926", "a1f3", "b471", "ddf0", "0xaf12"
- Density: at top of teal zone (~70% down the cover), hashes are
  visible but slightly sparser. At the bottom (~92%, around the
  author byline), hashes are densely overlapping — practically
  forming a wall of text.
- The one prominent vertical hash drip from the bill is still readable
  in the center, but it's surrounded by the dense hash field on all
  sides — the drip is "inside" the field, not floating alone.

ABOVE THE TEAL ZONE (rows 0%–70%):
- 100% cream background #faf6eb
- NO teal anywhere
- Only the dollar bill + a thin teal hash strand bridging the tear
  ("0xa1f3...e9c2") and the title/subtitle typography

BILL FIDELITY (from real $1 reference):
- Washington's portrait engraving preserved exactly — do not redraw
- "FEDERAL RESERVE NOTE", "THE UNITED STATES OF AMERICA", "ONE DOLLAR"
  all correctly spelled, clearly readable
- Corner numerals "1" on all four corners
- Serial "L11180916G" visible
- Green Treasury seal right, black Federal Reserve seal "L" left
- VISIBLE TEAR DAMAGE — frayed edges along the vertical rip, paper
  fibers, slight curl on the torn edges, suggesting recent damage

OVERALL:
- Penguin Press / Sapiens shelf editorial book design
- NO crypto-bro, NO neon
- The TOP TWO-THIRDS of the cover is cream-and-dollar
- Only the BOTTOM ~30% is teal gradient with dense hash text
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const v1Ref = await readFile(join(OUT_DIR, 'optimal.png'));
  const v2Ref = await readFile(join(OUT_DIR, 'optimal-v2.png'));
  const dollarRef = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log('→ rendering optimal-v3 (~$0.17)');

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', PROMPT);
  form.append('image[]', new Blob([v1Ref], { type: 'image/png' }), 'dense-hashes.png');
  form.append('image[]', new Blob([v2Ref], { type: 'image/png' }), 'sizing.png');
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
  const out = join(OUT_DIR, 'optimal-v3.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
