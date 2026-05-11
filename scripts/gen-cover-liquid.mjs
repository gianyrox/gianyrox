#!/usr/bin/env node
// gen-cover-liquid.mjs — Round 4. Founder rejected the four "pool"
// variants — none felt like liquid; they read as graphic blocks or
// blobs. Try 4 fundamentally different approaches to the same brief:
//
//   "minimal vertical drip from broken bill → liquid digital substrate
//    made of hash text, no graphic-design rectangles, no cartoon blobs"
//
// Strategy: push each prompt away from "design a pool shape" and toward
// painterly / atmospheric / cinematic interpretations so gpt-image-1
// stops defaulting to flat geometric fills.

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'cover');

const SHARED = `
TYPOGRAPHY — render real clean type, NOT garbled:
- Title: "YOUR MONEY IS BROKEN" — strong editorial transitional serif
  (think Sapiens UK edition / GT Sectra / Bodoni). Heavy, slightly
  condensed, high contrast. Charcoal #1a1a1a. Spans top quarter.
- Subtitle: "How Stablecoins Bridge Slow Money to Fast Money" — same
  serif family, lighter weight, italic. Medium grey #555.
- Author: "GIANY ROX" — humanist sans-serif (Inter / Source Sans 3 /
  Founders Grotesk), uppercase, letter-spaced 0.15em. Bottom of cover.

COMPOSITION:
- 6×9 portrait book cover ratio, warm cream background #faf6eb
- Penguin Press / Sapiens shelf editorial aesthetic
- NO crypto-bro, NO neon, NO laser eyes, NO graphic-design rectangles
- NO cartoon blobs, NO flat geometric shapes — render LIQUID, painterly

DOLLAR BILL:
- Real US one-dollar bill, REAL $1 proportions (~2.61:1 wider than tall)
- Washington portrait centered, green seal accurate, "ONE DOLLAR" text
- Torn cleanly VERTICALLY through the middle
- Corner numerals: "1" on all four corners — consistent
- Serial number reads as a real serial like "B03562009F", not garbled
- Bill sits in the upper-middle of the cover (below title)

THE FLOW (this part is mandatory across all variants):
- ONE thin elegant strand of teal #2a9d8f hash text bridges the tear:
  "0xa1f3...e9c2", single line, monospace
- From below the bill, the hash strand continues DOWNWARD as a thin
  vertical column of falling alphanumeric text: "0xb471", "c857",
  "0xd4f0", "7df0", "0xa1f3" — each line slightly faded
- This drip is the SIGNATURE element — keep it elegant and vertical
`;

const VARIANTS = [
  {
    slug: 'l-dissolve',
    name: 'Dissolve Field',
    desc: 'Bottom half is a dense fading field of hash text — no pool shape, just substrate',
    prompt: `${SHARED}

THIS VARIANT — "Dissolve Field":

Instead of a discrete pool, the BOTTOM HALF of the cover is a softly
gradiated field of densely packed teal hash text fragments that FADES
into the cream background at the top edge (where the dollar bill
hangs) and is at full density at the bottom (behind the author name).

There is NO pool perimeter, NO defined shape — the hash field is like
an atmosphere, a digital fog at the bottom of the canvas. Imagine
looking down into water that's getting darker with depth.

Hash fragments at the top of the field are sparse, faint, faded — they
get denser, brighter, more saturated near the bottom.

The drip from the bill enters this field naturally — the falling hash
column thickens and spreads as it sinks deeper into the substrate.

Author name "GIANY ROX" sits at the very bottom, rendered in cream
(carved out of the hash density).

This is the most "ink-in-water" feeling — no boundary, just a
substrate the bill is dripping into. Substance, not shape.`,
  },
  {
    slug: 'l-painterly',
    name: 'Ink Swirl',
    desc: 'Painterly teal ink bloom — soft swirling shape, hashes float within',
    prompt: `${SHARED}

THIS VARIANT — "Ink in Water":

Below the bill, the drip enters a SWIRLING TEAL INK CLOUD blooming in
the lower portion of the cover — like watercolor ink dropped into a
glass of water. The cloud has soft painterly tendrils curling outward,
some lighter wisps drifting toward the cover edges, denser concentrations
near the center.

Inside the ink cloud, fragments of teal hash text float like particles
suspended in liquid: "0xa1f3", "e9c2", "b471", "c857", "d4f0", "7df0",
"0926" — each at slightly different scales, some swirling with the
flow, some still.

The whole effect is wet, alive, painterly. Like a Rothko crossed with
a chemistry experiment. The cloud occupies the lower third, doesn't
fully reach the cover edges (cream space remains around it).

Author name sits below the cloud in clean cream space.

KEY: this must feel painted, not designed. Soft edges, no sharp lines.`,
  },
  {
    slug: 'l-leak',
    name: 'Tear Leak',
    desc: 'The bill is leaking hash-water from the inside — no pool, just emission',
    prompt: `${SHARED}

THIS VARIANT — "Tear Leak":

There is NO POOL below the bill. The story happens INSIDE THE BILL.

The tear in the dollar is leaking — like a wound — and what's seeping
out is luminous teal LIQUID made of legible hash text. The leak runs
down the front of the bill in soft watery streaks, beads of teal hash
text rolling down the paper face like raindrops.

Below the bottom edge of the bill, a few small puddles of teal hash
text have collected on the cream "surface" beneath — like spilled ink
that's pooled in small irregular shapes. Each puddle is made of
intersecting hash strings.

The bill itself is the source. The cover doesn't need a separate
pool — the LIQUID IS the inside of the bill, finally visible.

Mood: revelation. The dollar was always made of digital ledger
entries, you just couldn't see them before.

Author name in cream space below the puddles.`,
  },
  {
    slug: 'l-mirror',
    name: 'Reflection',
    desc: 'Bill hangs above a glassy teal pool that reflects it as hashes',
    prompt: `${SHARED}

THIS VARIANT — "Mirror Pool":

The torn dollar bill hangs in the upper-middle of the cover. Directly
below it — perfectly aligned, reflecting it — is a flat horizontal
surface of glassy teal liquid that mirrors the bill back as a DIGITAL
TWIN made of hash text.

The reflection looks like the same bill rendered in hash characters:
the Washington portrait outline drawn with intersecting hash strings,
the corner "1"s rendered as "0x01", the "ONE DOLLAR" text as
"0xa1f3...e9c2".

The reflective surface has subtle ripples where the drip enters it
(small concentric rings) but is otherwise calm and still.

The pool surface is flat — like a reflecting pool at a memorial. It
extends edge-to-edge across the cover's middle band and fades softly
into the cream below the reflection.

Author name "GIANY ROX" below in cream space.

Mood: contemplative, dual. The old dollar above; the new dollar
reflected below. Same money, different ledger.`,
  },
];

async function genOne(variant, key) {
  console.log(`→ ${variant.slug} (${variant.name})`);
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: variant.prompt,
      n: 1,
      size: '1024x1536',
      quality: 'high',
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
  console.log(`→ rendering ${VARIANTS.length} liquid variants (~$${(VARIANTS.length * 0.167).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
