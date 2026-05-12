#!/usr/bin/env node
// gen-cover-hashfade.mjs — Round 6.
// Founder clarification 2026-05-12:
//   1. The fade IS the hash text. No separate teal background gradient.
//      The same hash IDs falling from the bill accumulate downward and
//      THEY ARE THE COLORED FADE. Density alone creates the gradient.
//   2. Washington's face must be fully accurate to the real $1 reference.
//      gpt-image-1 has been redrawing his portrait — emphasize fidelity.
//
// Approach:
//   - Use d-faithful as the composition reference (loved direction)
//   - Use real US $1 jpg as the dollar reference
//   - Prompt heavily emphasizes that the hashes themselves form the
//     gradient through their density progression, NOT a colored
//     background behind them
//   - Vary how the density accumulates (slow / heavy / cascading / banded)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const SHARED = `
This is a refinement of an existing book cover. The FIRST reference is
the existing cover composition. The SECOND reference is a real US $1
bill — use it to render the dollar with full accuracy.

PRESERVE EXACTLY:
- Title "YOUR MONEY IS BROKEN" — bold transitional serif, charcoal, top
- Subtitle "How Stablecoins Bridge Slow Money to Fast Money" — italic
  serif, smaller, below title
- Author byline "GIANY ROX" — humanist sans-serif uppercase, letter-
  spaced, bottom
- Cream background #faf6eb
- A real US $1 bill, real proportions (2.61:1 wider than tall), torn
  vertically through the middle
- ONE thin teal hash strand bridging the tear: "0xa1f3...e9c2"
- A column of teal hash text falling straight down from below the bill

CRITICAL — DOLLAR ACCURACY:
The dollar bill MUST match the second reference image exactly:
- Washington's portrait — preserve the engraving lines, his hair shape,
  collar, cravat, expression. DO NOT redraw the face. Keep the engraved
  detail intact.
- "FEDERAL RESERVE NOTE" centered at top of bill
- "THE UNITED STATES OF AMERICA" below it
- "ONE DOLLAR" at bottom
- Corner numerals "1" on all four corners
- Serial number "L11180916G" (letter + 8 digits + letter) visible twice
- Green Treasury seal on the right
- Black Federal Reserve seal on the left with letter "L"
- Engraved scrollwork frame intact

CRITICAL — THE FADE:
This is the founder's key clarification. The "fade" at the bottom of
the cover is NOT a separate teal gradient or colored background. The
fade IS the hash text itself, accumulating.

How it works:
- The hash text falling from below the bill is the ONLY teal element
- Each successive line of falling hash text is slightly more dense,
  slightly more saturated, slightly larger
- By the lower portion of the cover, the lines are packed so densely
  they visually MERGE into a solid teal mass — but they're still
  recognizably hash text on close inspection
- There is NO separate atmospheric fog, NO color overlay, NO gradient
  fill behind the hashes
- The visual gradient is purely an emergent property of the hash text's
  density progression. Same hashes, just packed tighter.
- Background remains cream #faf6eb everywhere — visible between sparse
  hashes at the top of the column, mostly hidden behind dense hashes
  at the bottom

The author name "GIANY ROX" sits at the very bottom in cream space or
slightly carved-out of the dense hash matrix — make it readable.

Editorial Penguin Press shelf aesthetic. NO crypto-bro, NO neon.
`;

const VARIANTS = [
  {
    slug: 'h-gradual',
    name: 'Gradual Accumulation',
    desc: 'Smooth, gradual density progression from sparse to dense over the full bottom half',
    extra: 'The hash text density increases GRADUALLY and smoothly from top to bottom of the falling column. At the top (just below the bill) the hashes are sparse, faded, well-spaced. By the middle of the column they are clearly visible and saturated. By the bottom they are packed tightly and form a deep teal mass made of overlapping hash text. The transition is continuous — no banding, no abrupt steps.',
  },
  {
    slug: 'h-heavy',
    name: 'Heavy Accumulation',
    desc: 'Bottom 30% becomes a near-solid wall of densely packed hash text',
    extra: 'The hash text density increases rapidly. The upper two-thirds of the falling column is sparse-to-medium density (you can see cream background between lines). The bottom one-third is a SOLID WALL of overlapping hash text — so packed it reads as a flat dense teal mass on first glance, but on closer look you can still see individual hash fragments. The author name punches out of this wall in cream.',
  },
  {
    slug: 'h-cascade',
    name: 'Cascading Waterfall',
    desc: 'Hash text accelerates downward with motion — wider stream as it falls',
    extra: 'The hash text falls like a waterfall — narrow at the top (just below the bill), widening as it descends. Density increases with width: at the top it is a thin single column of hashes, by mid-cover it is 3–4 columns wide, by the bottom it is a wide flowing curtain of hash text that spans 60–70% of the cover width. The motion is implied by slight horizontal blur on the falling characters. Author name sits below this curtain in cream space.',
  },
  {
    slug: 'h-banded',
    name: 'Density Bands',
    desc: 'Hash text accumulates in horizontal bands of increasing density',
    extra: 'The falling hash text accumulates in distinct horizontal bands of increasing density. Top band (just below bill): single sparse line of hashes. Second band: 2-3 lines. Third band: 5-6 lines packed closer. Fourth band: dense mat of hash text. Fifth band (bottom): solid dense block of hash text. Each band is a clear horizontal strip with visible separation. Like geological layers of sediment.',
  },
];

async function genOne(variant, dissolveBuf, dollarBuf, key) {
  console.log(`→ ${variant.slug} (${variant.name})`);
  const prompt = `${SHARED}\n\nSPECIFIC TWEAK FOR THIS VARIANT:\n${variant.extra}`;
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('image[]', new Blob([dissolveBuf], { type: 'image/png' }), 'composition.png');
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
  const dissolveBuf = await readFile(join(OUT_DIR, 'd-faithful.png'));
  const dollarBuf = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log(`→ rendering ${VARIANTS.length} hash-fade variants (~$${(VARIANTS.length * 0.17).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, dissolveBuf, dollarBuf, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 250)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
