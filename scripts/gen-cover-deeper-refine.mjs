#!/usr/bin/env node
// gen-cover-deeper-refine.mjs — 4 refinements of d-deeper (user's
// preferred direction). All share:
//   - Perfect Washington face (uses real $1 reference)
//   - Fully visible vertical rip down the middle
//   - Correct book-standard text sizing
// Differ by: text size proportions, tear damage level, gradient height

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const SHARED = `
Refinement of an existing book cover. The FIRST reference is the cover
to refine — preserve its composition, deep teal gradient, hash drip,
overall layout. The SECOND reference is a real US one-dollar bill —
use it to render the dollar with PERFECT engraving fidelity.

CRITICAL FIXES FROM THE FIRST REFERENCE:

1. WASHINGTON'S FACE MUST BE PERFECT
   In the first reference image the portrait is slightly off. Render
   Washington EXACTLY as in the second reference image — the engraving
   lines of his hair, his collar, his cravat, his expression, the
   shading. Do not redraw him. Preserve the precise engraving.

2. THE VERTICAL RIP MUST BE FULLY VISIBLE
   The bill is TORN cleanly down the middle from top to bottom. The
   tear line must be CLEARLY VISIBLE in the final image:
   - Jagged, frayed paper edges along the entire tear from top to bottom
   - Small loose paper fibers along the tear
   - A small visible gap between the two halves (a few pixels wide of
     cream background showing through the gap)
   - The two halves should be slightly offset, one a hair lower than
     the other, making the break obvious
   - No "subtle line" — this is a TORN bill, the damage is photographically obvious

3. PROPER BOOK TEXT SIZING (6×9 trade paperback standards):
   - Title "YOUR MONEY IS BROKEN" — large, bold serif, ~10–12% of
     cover height, charcoal #1a1a1a
   - Subtitle "How Stablecoins Bridge Slow Money to Fast Money" —
     italic serif, ~4–5% of cover height, medium grey #555
   - Author byline "GIANY ROX" — humanist sans-serif uppercase,
     letter-spaced, ~5–6% of cover height, cream/white. CRITICAL:
     significantly LARGER than in the first reference (where it is
     currently too small). Should read confidently from 3 meters away.

PRESERVE FROM THE FIRST REFERENCE:
- Cream background #faf6eb at top
- Bill positioned in upper-middle, centered
- Vertical column of teal hash text falling from below the bill
- Deep teal gradient transitioning from cream to deep teal in the
  bottom portion of the cover
- The signature hash text accumulating in the teal zone
- Penguin Press / Sapiens shelf editorial aesthetic
- NO crypto-bro, NO neon, NO laser eyes

BILL FIDELITY CHECKLIST:
- Washington's portrait engraving exact to second reference
- "FEDERAL RESERVE NOTE" at top of bill, correctly spelled
- "THE UNITED STATES OF AMERICA" below it, correctly spelled
- "ONE DOLLAR" at bottom, correctly spelled
- Corner numerals "1" on all four corners
- Serial number "L11180916G" or similar real-format serial, visible twice
- Green Treasury seal on the right (intact eagle and shield)
- Black Federal Reserve seal on the LEFT with letter "L"
- Engraved scrollwork frame intact
`;

const VARIANTS = [
  {
    slug: 'dx-faithful',
    name: 'Face fix only',
    desc: 'Perfect face + fully visible rip, everything else identical to d-deeper',
    extra: 'Keep ALL other elements of the first reference exactly as-is. The ONLY changes are: (a) render Washington with perfect engraving fidelity, (b) make the vertical rip down the middle of the bill fully visible with jagged edges and a small visible gap, (c) keep the title, subtitle, hash drip, gradient, and author byline EXACTLY as in the first reference. Do not change typography sizing in this variant.',
  },
  {
    slug: 'dx-bigger-author',
    name: 'Bigger author name',
    desc: 'Above + author byline scaled to proper book-cover proportions',
    extra: 'Above the changes from the first reference: (a) perfect Washington face, (b) fully visible rip with jagged edges, (c) AUTHOR BYLINE significantly larger — about 2x its current size in the first reference. The byline should be the most prominent text element at the bottom, properly letter-spaced. Subtitle, title, and all other elements stay as in the first reference.',
  },
  {
    slug: 'dx-clearer-tear',
    name: 'Clearer tear damage',
    desc: 'Above + the tear is photographically destroyed — fibers, curl, offset',
    extra: 'Above the basic fixes: (a) perfect Washington face, (b) the vertical rip is now PHOTOGRAPHICALLY DESTROYED — clearly visible loose paper fibers along the tear edges, a slight curl where the torn edges peel away from each other, one half offset vertically from the other by 5–10 pixels, a few mm gap of cream visible through the middle of the bill in places. This is a violently torn bill, not a clean cut. (c) Author byline also moderately larger than in the first reference.',
  },
  {
    slug: 'dx-tighter-title',
    name: 'Tighter title typography',
    desc: 'Above + title set tighter, more transitional-serif, larger',
    extra: 'Above the basic fixes: (a) perfect Washington face, (b) fully visible rip with jagged edges and small visible gap, (c) TITLE TYPOGRAPHY tightened — slightly larger title, more condensed letterforms (think GT Sectra / Bodoni Heavy), tracked slightly tighter, more visual weight at the top of the cover. (d) Author byline moderately larger as well.',
  },
];

async function genOne(variant, dDeeperBuf, dollarBuf, key) {
  console.log(`→ ${variant.slug} (${variant.name})`);
  const prompt = `${SHARED}\n\nSPECIFIC TWEAK FOR THIS VARIANT:\n${variant.extra}`;
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('image[]', new Blob([dDeeperBuf], { type: 'image/png' }), 'd-deeper.png');
  form.append('image[]', new Blob([dollarBuf], { type: 'image/png' }), 'dollar.png');
  form.append('n', '1');
  form.append('size', '1024x1536');
  form.append('quality', 'high');
  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) throw new Error(`${variant.slug}: ${r.status} ${(await r.text()).slice(0, 250)}`);
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  const out = join(OUT_DIR, `${variant.slug}.png`);
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${out}`);
}

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const dDeeperBuf = await readFile(join(OUT_DIR, 'd-deeper.png'));
  const dollarBuf = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log(`→ rendering ${VARIANTS.length} d-deeper refinements (~$${(VARIANTS.length * 0.17).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, dDeeperBuf, dollarBuf, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 250)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
