#!/usr/bin/env node
// gen-cover-dissolve.mjs — Round 5. Founder picked l-dissolve as the
// strongest direction. Goal: 4 close refinements that
//   1. preserve l-dissolve's hash-drip + atmospheric-fade composition
//   2. fix the dollar bill realism (feeds gpt-image-1 a real US $1
//      reference image so the bill renders correctly)
//   3. keep cohesion — same drip pattern, same fade, just iterate on
//      density / saturation / dollar fidelity / typography weight
//
// Uses the /images/edits endpoint with two input images:
//   - l-dissolve.png        — composition + style reference
//   - usd1-1024.png         — real US $1 bill for accurate rendering

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');
const REF_DISSOLVE = join(OUT_DIR, 'l-dissolve.png');
const REF_DOLLAR = join(OUT_DIR, '_refs', 'usd1-1024.png');

const SHARED = `
This is a refinement of a book cover that already works — keep the same
composition, hash-drip pattern, atmospheric fade, and overall layout as
the FIRST reference image (the existing cover). Use the SECOND reference
image as the source of the dollar bill — render the bill accurately
matching that reference, NOT garbled (corner numerals are "1" on all
four corners, "ONE DOLLAR" reads correctly, serial number looks real
"B03562009F" style, "THE UNITED STATES OF AMERICA" at top reads clearly,
"FEDERAL RESERVE NOTE" above that reads clearly).

The dollar in this cover is TORN VERTICALLY through the middle (one
single bill, split). Real $1 proportions (~2.61:1 wider than tall).

PRESERVE FROM THE FIRST REFERENCE:
- Title at top: "YOUR MONEY IS BROKEN" — bold transitional serif
- Subtitle below: "How Stablecoins Bridge Slow Money to Fast Money"
- Author byline at bottom: "GIANY ROX" — sans-serif uppercase
- Cream background #faf6eb at the top
- ONE thin teal hash strand bridging the tear: "0xa1f3...e9c2"
- A vertical column of falling teal hash text below the bill
- Bottom half gradient: cream fading to dense teal with hash text
- The atmospheric "ink in water" feel of the lower half
- Editorial Penguin Press shelf aesthetic — NO crypto-bro

NO POOL OUTLINE, NO COIN. The lower half is a SUBSTRATE that the bill
is dripping into. Substrate, not shape.
`;

const VARIANTS = [
  {
    slug: 'd-faithful',
    name: 'Faithful refine',
    desc: 'Identical composition, dollar fidelity upgraded, no other changes',
    extra: 'Keep everything from the first reference image exactly as-is. The ONLY changes are: (a) render the dollar bill with full accuracy using the second reference, (b) make the title typography slightly more refined and tighter, (c) keep the hash drip and fade EXACTLY as in the first reference.',
  },
  {
    slug: 'd-denser',
    name: 'Denser fade',
    desc: 'Same composition, hash text in the fade is denser + more legible',
    extra: 'Match the composition exactly, but make the hash text in the bottom atmospheric fade DENSER — more legible hash fragments visible, packed more tightly, fewer empty gaps. Hash drip column above the fade has the same density as the first reference. The fade still gradients from cream (at the top edge near the bill) to deep teal (at the bottom near the author name).',
  },
  {
    slug: 'd-deeper',
    name: 'Deeper teal',
    desc: 'Same composition, the bottom teal is deeper and more saturated',
    extra: 'Match the composition exactly, but push the teal in the bottom atmospheric fade DEEPER and more saturated — closer to a rich oceanic teal #1d6f63 at the very bottom, transitioning through the existing teal #2a9d8f in the middle of the fade, into cream at the top. The hash text in the fade glows slightly brighter against the deeper background.',
  },
  {
    slug: 'd-bigger-bill',
    name: 'Bill emphasis',
    desc: 'Same composition, bill is rendered slightly larger and more central',
    extra: 'Match the composition exactly, but render the dollar bill slightly LARGER (about 10–15% bigger), centered horizontally, with its torn edges more clearly visible. The drip below the bill starts from where the tear ends. Everything else — the title, the fade, the author name, the cream background, the gradient — stays identical to the first reference.',
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
  if (!b64) throw new Error(`${variant.slug}: no b64`);
  const out = join(OUT_DIR, `${variant.slug}.png`);
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${out}`);
}

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const dissolveBuf = await readFile(REF_DISSOLVE);
  const dollarBuf = await readFile(REF_DOLLAR);
  console.log(`→ rendering ${VARIANTS.length} dissolve variants with refs (~$${(VARIANTS.length * 0.17).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, dissolveBuf, dollarBuf, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 250)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
