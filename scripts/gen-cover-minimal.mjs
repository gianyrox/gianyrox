#!/usr/bin/env node
// gen-cover-minimal.mjs — 4 minimal-style variants exploring different
// "destinations" for the dollar to drain into (the stablecoin side of
// the bridge metaphor). Founder is testing: coin vs ledger-surface vs
// pool-in-vessel vs fully-liquid stream.
//
// All variants share the v3d-minimal aesthetic: single dollar bill,
// single hash strand bridging the tear, quiet whitespace, editorial.

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
- Serious editorial book design — Penguin Press / Sapiens / Bitcoin Standard
- NO crypto-bro aesthetic, NO neon, NO laser eyes
- Generous whitespace
- v3d-minimal aesthetic: quiet, museum-card, restrained

REQUIRED DOLLAR BILL:
- A real US one-dollar bill, REAL $1 proportions (~2.61:1 wider than tall)
- Washington portrait visible in the center
- Bill torn cleanly in half VERTICALLY through the middle
- IMPORTANT: the four corner denomination numerals MUST be the digit "1"
  on all four corners (top-left, top-right, bottom-left, bottom-right) —
  consistent and correct, NOT alphanumeric, NOT replaced with hashes
- Bill's serial number text near the bottom should look like a real
  serial (letter + 8 digits + letter), readable, NOT garbled
- "ONE DOLLAR" lettering at bottom correctly spelled

REQUIRED HASH BRIDGE:
- Exactly ONE thin elegant strand of teal #2a9d8f hash text spanning the
  tear: "0xa1f3...e9c2" written in monospace, one line only, not a bundle

The DESTINATION below the bill (where the hashes drain to) is what
varies between variants — see specific variant brief below.
`;

const VARIANTS = [
  {
    slug: 'm-coin',
    name: 'Coin',
    desc: 'Drains into a single solid teal coin — most shelf-recognizable',
    prompt: `${SHARED}

THIS VARIANT — destination is a SINGLE COIN:

Below the bill, the hash strand drips down as a thin teal line of binary
("01010101") and lands in ONE perfectly circular flat coin, solid teal
#2a9d8f, with a clean white "$1" centered on its face. Subtle drop shadow
under the coin. The coin is small (about 1/4 the size of the bill).

The story: broken dollar → bridge → single digital dollar.`,
  },
  {
    slug: 'm-pool',
    name: 'Pool',
    desc: 'Drains into a contained pool of hash characters (most literal "liquid")',
    prompt: `${SHARED}

THIS VARIANT — destination is a LIQUID POOL OF HASHES:

Below the bill, the hash strand widens as it falls — like water from a
faucet — and pours into a SHALLOW POOL of glowing teal hash characters
at the bottom. The pool is roughly oval-shaped, contained within a
subtle implied vessel (no visible bowl edge, but the pool has a clear
outer boundary), and its surface shimmers with floating fragments of
alphanumeric hash text like "0xa1f3", "e9c2", "b471", "7df0", "d4f0".

The pool reads as LIQUID — soft edges, slight reflective sheen, ripples
where the hashes drop in. Implying liquidity / fungibility, not a coin.

Teal #2a9d8f. The story: broken dollar → bridge → liquid digital ledger.`,
  },
  {
    slug: 'm-ledger',
    name: 'Ledger Surface',
    desc: 'Drains onto a flat rectangular ledger of hash rows — most "database"',
    prompt: `${SHARED}

THIS VARIANT — destination is a LEDGER SURFACE:

Below the bill, the hash strand drips down onto a clean horizontal
rectangular SURFACE — like a database table or ledger entry view —
that fills the lower third of the cover. The surface shows 5-6 neat
horizontal rows of transaction hashes:

  0xa1f3...e9c2    $1.00
  0xb471...c857    $1.00
  0xd4f0...7df0    $1.00
  0x7df0...0xa1f3  $1.00
  0xe9c2...b471    $1.00

Each row clearly delineated. Teal text on a slightly darker
parchment-cream background panel. The surface has a subtle border but
no decoration.

The story: broken dollar → bridge → entries on the shared ledger.`,
  },
  {
    slug: 'm-stream',
    name: 'Stream',
    desc: 'Drains into a flowing stream that runs off the canvas — most "liquid + fast"',
    prompt: `${SHARED}

THIS VARIANT — destination is a FLOWING STREAM:

Below the bill, the hash strand falls and IMMEDIATELY becomes a
flowing horizontal RIVER of teal hash characters streaming from left
to right across the lower portion of the cover and disappearing off
the right edge. The river is made of dozens of small floating
alphanumeric hash fragments: "0xa1f3", "e9c2", "b471", "7df0", "d4f0",
"c857", arranged in horizontal motion-blurred streaks suggesting fast
flow.

Implied speed — the river isn't pooling, it's MOVING. Some hashes
near the bill are clearer; ones near the right edge blur into pure
motion lines.

Teal #2a9d8f. Slight cream-tinted shadow under the river. The story:
broken dollar → bridge → fast-moving digital money.`,
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
}

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`→ rendering ${VARIANTS.length} minimal variants (~$${(VARIANTS.length * 0.167).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, 'high', key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
