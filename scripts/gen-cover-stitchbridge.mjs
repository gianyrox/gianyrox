#!/usr/bin/env node
// gen-cover-stitchbridge.mjs — 4 executions of the "Stitch Bridge"
// concept (user picked this direction). All share: dollar torn,
// transaction-hash cable holds it together, evolves into stablecoin.
// Vary: tear angle, hash density, token style, palette weight.
//
// Output: public/cover/v3a-*.png, v3b-*.png, etc.
//
// Usage: node scripts/gen-cover-stitchbridge.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'cover');

const SHARED = `
REQUIRED TEXT (real clean typography, NOT garbled):
- Top: "YOUR MONEY IS BROKEN" — bold serif, large
- Below title: "How Stablecoins Bridge Slow Money to Fast Money" — italic serif
- Bottom: "GIANY ROX" — clean sans-serif uppercase, letter-spaced

REQUIRED COMPOSITION:
- 6×9 portrait book cover ratio, warm cream background #faf6eb
- Serious editorial book design — Penguin Press / Sapiens / Bitcoin Standard shelf-mates
- NO crypto-bro aesthetic, NO neon, NO laser eyes
- Generous whitespace top + bottom for typography
- Soft natural shadow under the dollar

REQUIRED VISUAL CORE:
- A real US one-dollar bill, REAL $1 proportions (~2.61:1 wider than tall),
  Washington portrait visible, green seal accurate
- Bill is BROKEN/TORN
- A cable / chain / strand of blockchain transaction HASH STRINGS literally
  bridges the broken bill (alphanumeric like "0xa1f3...e9c2", "0xb471...c857")
- The hashes flow / drip / connect onward into a stablecoin token (USDC, USDT,
  or generic stable-dollar chip)
- Teal #2a9d8f for digital elements, classic dollar green for the bill,
  charcoal #1a1a1a for typography
`;

const VARIANTS = [
  {
    slug: 'v3a-refined',
    name: 'Refined',
    desc: 'Original concept, cleaner typography and crisper USDC chip',
    prompt: `${SHARED}

THIS VARIANT — "Refined":

A single US one-dollar bill, photographed straight overhead, torn cleanly
in half VERTICALLY (the tear runs top-to-bottom through the middle of
the bill). Washington portrait fully visible on the left half, "ONE
DOLLAR" lettering visible on the right half.

The two halves are held together by ONE horizontal cable of glowing
teal transaction-hash strings: 3–4 short alphanumeric segments like
"0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0" — neatly stacked in
parallel, like wire bundles.

The cable continues DOWNWARD from the right half of the bill as a thin
trail of binary code (1s and 0s) into a SINGLE circular USDC token
chip directly below — a clean blue-and-white "USDC" coin with sharp
edges, just the logo and the "1" denomination.

Bill is in good condition (not worn), torn but pristine.
Typography is the most prominent feature. Soft daylight from upper-left.`,
  },
  {
    slug: 'v3b-dramatic',
    name: 'Dramatic Decay',
    desc: 'Bill looks weather-beaten + frayed, hashes more prominent',
    prompt: `${SHARED}

THIS VARIANT — "Dramatic Decay":

A US one-dollar bill, photographed straight overhead, torn cleanly down
the middle vertically. But the bill itself looks VISIBLY DEGRADED:
worn corners, faded ink, soft creases, slight yellowing at the edges,
small frayed paper fibers around the tear — it looks like physical
money that's been through too many hands.

The tear is bridged by a THICK BUNDLE of transaction-hash cables — 6–8
parallel strands of glowing teal alphanumeric hashes ("0xa1f3...",
"0xe9c2...", "0xb471...", "0xd4f0...", "0x7df0...", etc), bright and
saturated against the faded bill.

The hash bundle continues downward in a vertical trail into a single
stablecoin coin — but the coin is CLEAN, fresh, sharp — almost like a
chrome 3D render — labeled "1 USDC" or just "$1".

The contrast tells the story: old worn money vs new sharp money. Bill
green is muted; teal hash bundle is vivid.`,
  },
  {
    slug: 'v3c-diagonal',
    name: 'Diagonal Tear',
    desc: 'More dynamic — bill torn diagonally, hashes bridge at an angle',
    prompt: `${SHARED}

THIS VARIANT — "Diagonal":

A US one-dollar bill, photographed straight overhead, torn cleanly on a
DIAGONAL (the tear runs from upper-left corner toward lower-right
corner of the bill, not horizontal or vertical). Washington portrait
visible on the upper-left side of the tear.

The diagonal tear is bridged by a single elegant cable of transaction-
hash strings angled along the tear: 5 segments like "0xa1f3...e9c2",
"0xb471...c857", "0xd4f0...7df0" arranged in a clean stack following
the tear's diagonal line. Glowing teal.

The cable continues off the lower-right corner of the bill as a thin
binary-code trail that lands in a tidy USDC coin at the bottom-right
of the composition.

More energy / motion than the other variants. The diagonal tear feels
like the bill is mid-break. Soft, dramatic lighting from upper-left.`,
  },
  {
    slug: 'v3d-minimal',
    name: 'Minimal',
    desc: 'Less hash chatter, single elegant cable, more whitespace',
    prompt: `${SHARED}

THIS VARIANT — "Minimal":

A US one-dollar bill, photographed straight overhead, torn cleanly in
half VERTICALLY. Real $1 proportions, Washington portrait visible.

Only ONE thin, elegant strand of transaction-hash text spans the tear:
a single readable hash like "0xa1f3...e9c2" written in teal monospace
across the gap. Not a bundle — just one line. Like a single thread
holding a torn page together.

Below the bill, the strand drips down as a thin line of teal binary
("01010101") that ends in a single, simple, perfect circular coin
labeled "$1" — solid teal, no chrome, no extra detail.

Lots of cream whitespace. Quiet, museum-card aesthetic. The least busy
of the four. Almost graphic-design-poster feel.

Mood: editorial, restrained, hopeful.`,
  },
];

async function genOne(variant, quality, key) {
  console.log(`→ ${variant.slug} (${variant.name})`);
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: variant.prompt,
      n: 1,
      size: '1024x1536',
      quality,
    }),
  });
  if (!r.ok) throw new Error(`${variant.slug}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  const out = join(OUT_DIR, `${variant.slug}.png`);
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${out}`);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const quality = args.includes('--quality') ? args[args.indexOf('--quality') + 1] : 'high';
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`→ rendering ${VARIANTS.length} stitch-bridge variants at ${quality} (~$${(VARIANTS.length * 0.167).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, quality, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    const tag = r.status === 'fulfilled' ? '✓' : '✗';
    console.log(`${tag} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
