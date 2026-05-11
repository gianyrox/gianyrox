#!/usr/bin/env node
// gen-cover-variants.mjs — render N concept variants of the book cover
// via OpenAI gpt-image-1. Each variant is a different visual take on
// the same brief: "Your Money Is Broken" with the dollar evolving into
// a stablecoin / blockchain transaction-hash representation.
//
// Output: public/cover/variant-{slug}.png
//
// Usage:
//   node scripts/gen-cover-variants.mjs            # all variants medium
//   node scripts/gen-cover-variants.mjs --quality high
//   node scripts/gen-cover-variants.mjs --only fragmentation

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'cover');

const SHARED_TEXT_BRIEF = `
REQUIRED TEXT ELEMENTS (real clean typography, NOT garbled):
- Top: "YOUR MONEY IS BROKEN" — large bold serif
- Below title: "How Stablecoins Bridge Slow Money to Fast Money" — smaller italic serif
- Bottom: "GIANY ROX" — clean sans-serif uppercase, letter-spaced

REQUIRED COMPOSITION:
- 6×9 portrait book cover ratio
- Warm cream background #faf6eb
- Generous whitespace around the visual
- Serious editorial book design (Penguin Press / Sapiens / The Bitcoin Standard shelf-mates)
- NO crypto-bro aesthetic, NO neon, NO laser eyes

REQUIRED VISUAL CONSTRAINT:
- Any dollar bill shown must have REAL US $1 proportions (~2.61:1 wider than tall)
- George Washington portrait and green seal visible
- Bill is shown as "broken" — torn, fragmented, or visibly degraded
- Bill must visually EVOLVE / TRANSITION into a digital representation —
  blockchain transaction hashes (alphanumeric strings like "0xa1f3...e9"),
  binary code (1s and 0s), or stablecoin tokens.
- The evolution is the whole point — broken slow money on one side,
  clean fast digital money on the other.
`;

const VARIANTS = [
  {
    slug: 'fragmentation',
    name: 'Fragmentation',
    desc: 'Dollar dissolves into hash strings flowing rightward',
    prompt: `${SHARED_TEXT_BRIEF}

SPECIFIC CONCEPT — "Fragmentation":

A real US one-dollar bill at the LEFT side of the cover is breaking
apart. The bill is intact on its left half but rapidly disintegrating
toward the right edge — small rectangular fragments of the paper detach
and float as a horizontal stream rightward, gradually transforming into
glowing teal alphanumeric characters that read like blockchain
transaction hashes: short fragments like "0xa1f3", "e9c2", "b471",
"7df0" — these characters cluster together cleanly on the right side
forming the shape of a tidy digital coin or token in profile.

The transformation moves left-to-right: torn paper → floating shards →
hash characters → coin. Soft natural shadow under the bill. Teal #2a9d8f
for the digital elements, classic dollar green for the bill.

Mood: serious, hopeful evolution. Like a museum infographic, not a
crypto ad.`,
  },
  {
    slug: 'evolution',
    name: 'Evolution',
    desc: 'Darwin-style left-to-right transformation, 4 stages',
    prompt: `${SHARED_TEXT_BRIEF}

SPECIFIC CONCEPT — "Evolution":

A horizontal Darwin-style evolution diagram running across the middle
of the cover, showing FOUR stages left-to-right with thin arrow links
between them:

1. (left) A crumpled, torn, weather-beaten US one-dollar bill — clearly
   "broken slow money", real $1 proportions, Washington portrait
2. A bill half-replaced by hash characters — the green seal becomes a
   stack of "0x" prefixed alphanumeric strings
3. A digital-looking bill where the engraved figures have become
   geometric particle traces — translucent, glowing
4. (right) A clean simple circular stablecoin token marked with a
   "$" — solid, calm, finished

Below the four stages, in tiny serif text under each: a one-word
caption like "1971" / "BANK ERA" / "BRIDGE" / "NOW".

Cream background. Deep teal for the digital stages, classic dollar
green at the start, charcoal for typography. Subtle drop shadow under
each stage. Museum-card editorial aesthetic.`,
  },
  {
    slug: 'stitch-bridge',
    name: 'Stitch Bridge',
    desc: 'Torn dollar literally bridged by transaction hashes',
    prompt: `${SHARED_TEXT_BRIEF}

SPECIFIC CONCEPT — "The Bridge":

A real US one-dollar bill, centered, photographed from straight
overhead, torn cleanly in half down the MIDDLE (vertical tear, not
horizontal). Real $1 proportions, Washington portrait visible on the
left half, "ONE DOLLAR" lettering on the right half.

Across the tear — bridging the two halves — a horizontal cable of
visible blockchain transaction hash strings: short alphanumeric
sequences like "0xa1f3...", "0xb471...", "0xe9c2..." linked together,
glowing teal #2a9d8f. The hashes literally HOLD THE BILL TOGETHER —
the broken paper money is being saved by the digital ledger.

Below the bill, the hashes continue downward like a quiet shadow into
a small stack of "1 USDC" / "1 USDT" stablecoin chips.

Cream background, generous whitespace top and bottom for the title and
byline. Soft natural light from upper-left.

Mood: a literal bridge metaphor matching the subtitle.`,
  },
  {
    slug: 'pixelated-bill',
    name: 'Pixelated Bill',
    desc: 'Single bill — left half real, right half pure digital glyph',
    prompt: `${SHARED_TEXT_BRIEF}

SPECIFIC CONCEPT — "Half-Digital Dollar":

ONE single US one-dollar bill, photographed from straight overhead,
real $1 proportions (2.61:1 wider than tall), Washington portrait
visible on the left half.

The bill is half-real, half-digital, with a clean vertical seam down
the middle:

- LEFT half: classic creased paper dollar bill — Washington portrait,
  fine engraving, soft paper texture, slightly worn at the edges
- RIGHT half: the SAME bill but rendered as a glowing teal grid of
  blockchain transaction hash strings — "0xa1f3...e9c2", "0xb471...",
  etc — arranged in the exact same shape as the bill's right half.
  The green Federal Reserve seal becomes a circular hash-glyph. The
  "1" denomination becomes a clean digital "1" surrounded by ledger
  metadata.

The seam glows softly where paper meets ledger. Cream background.
No background distractions.

Mood: the same dollar, photographed at the moment of transformation.`,
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
  if (!b64) throw new Error(`${variant.slug}: no b64 in response`);
  const out = join(OUT_DIR, `variant-${variant.slug}.png`);
  await writeFile(out, Buffer.from(b64, 'base64'));
  const sz = Buffer.from(b64, 'base64').length;
  console.log(`  ✓ ${out} (${(sz / 1024 / 1024).toFixed(1)} MB)`);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const quality = args.includes('--quality') ? args[args.indexOf('--quality') + 1] : 'high';
  const onlyIdx = args.indexOf('--only');
  const filter = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

  await mkdir(OUT_DIR, { recursive: true });
  const todo = filter ? VARIANTS.filter((v) => v.slug.includes(filter)) : VARIANTS;
  const costPerImg = { low: 0.011, medium: 0.042, high: 0.167 }[quality] ?? 0.167;
  console.log(`→ rendering ${todo.length} variant(s) at ${quality} (~$${(todo.length * costPerImg).toFixed(2)} total)\n`);

  // Run in parallel — gpt-image-1 has generous concurrency
  const results = await Promise.allSettled(todo.map((v) => genOne(v, quality, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < todo.length; i++) {
    const r = results[i];
    const tag = r.status === 'fulfilled' ? '✓' : '✗';
    console.log(`${tag} ${todo[i].slug} — ${todo[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
