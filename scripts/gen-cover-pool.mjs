#!/usr/bin/env node
// gen-cover-pool.mjs — 4 variants of the "minimal drip into pool of
// hashes" concept. Per founder direction 2026-05-11:
//   - keep v3d-minimal's clean vertical drip (loved)
//   - replace the single coin with a POOL whose water IS hash text
//     (color = teal, pool literally made of legible hash strings)
//   - vary how the pool occupies the lower part of the cover —
//     contained / wide / underlay-the-author-name / cascading
//   - upgrade typography to a stronger editorial serif

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'cover');

const SHARED = `
TYPOGRAPHY (this is important — render real clean type, NOT garbled):
- Title: "YOUR MONEY IS BROKEN"
  Use a STRONG editorial transitional serif — think Sapiens UK edition,
  GT Sectra, Bodoni, Didot, or Caslon. Heavy weight. Slightly condensed
  letterforms. High contrast. Title is LARGE — spans the top quarter
  of the cover. Color: charcoal #1a1a1a.
- Subtitle: "How Stablecoins Bridge Slow Money to Fast Money"
  Same serif family but lighter weight, italic. Color: medium grey #555.
- Author byline: "GIANY ROX"
  Clean humanist sans-serif — think Inter, Source Sans 3, or Founders
  Grotesk. Uppercase, generously letter-spaced (0.15em tracking). Color:
  charcoal or white depending on background. Sits at the very bottom.

COMPOSITION:
- 6×9 portrait book cover ratio, warm cream background #faf6eb
- Editorial book design — Penguin Press / Sapiens / Bitcoin Standard
- NO crypto-bro aesthetic, NO neon, NO laser eyes
- Quiet, museum-card, restrained

DOLLAR BILL:
- A real US one-dollar bill, REAL $1 proportions (~2.61:1 wider than tall)
- Washington portrait in the center
- Bill torn cleanly in half VERTICALLY through the middle
- CRITICAL: the four corner denomination numerals MUST be the digit "1"
  on all four corners (top-left, top-right, bottom-left, bottom-right) —
  same number, consistent. NOT alphanumeric, NOT replaced with hashes.
- Bill's serial number text near the bottom reads as a real serial
  (letter + 8 digits + letter, e.g. "B03562009F"), readable, not garbled.
- "ONE DOLLAR" lettering at bottom correctly spelled.
- Bill is positioned in the upper-middle area of the cover (below title,
  above the pool).

HASH DRIP (this is the v3d-minimal element the founder loved):
- ONE thin elegant strand of teal #2a9d8f hash text spans the tear
  horizontally: "0xa1f3...e9c2" in monospace, single line, not a bundle.
- From the bottom of the bill, the same hash text continues DOWNWARD as
  a vertical drip — like a thin column of falling alphanumeric: "0xb471",
  "c857", "0xd4f0", "7df0", "0xa1f3" — each on its own line, evenly
  spaced, fading slightly as they fall.
- The drip terminates by entering the pool below.

POOL (the key variation point — see specific variant brief):
- The pool's "water" is LITERALLY MADE OF HASH TEXT
- The visible surface of the pool is a dense mat of teal alphanumeric
  hash fragments: "0xa1f3", "e9c2", "b471", "c857", "d4f0", "7df0",
  "0926", etc — packed together, all teal #2a9d8f
- Where the drip enters the pool, there should be a faint ripple/splash
- The pool itself is teal — implying liquid digital money — but the
  "water" is the text, not a solid color fill
`;

const VARIANTS = [
  {
    slug: 'p-quiet',
    name: 'Quiet Pool',
    desc: 'Small contained pool above the author name, lots of whitespace',
    prompt: `${SHARED}

POOL SPEC — "Quiet":
The pool is small and contained — roughly the width of the dollar bill,
oval/elliptical, centered horizontally. Sits in the middle-lower
section of the cover with cream space below it for the author name.
The pool is densely packed with hash text but its outer edge is soft
and clearly bounded. The author name sits in clean cream space below
the pool, NOT overlapping. Reads as: bill → drip → small clear puddle.`,
  },
  {
    slug: 'p-underlay',
    name: 'Underlay',
    desc: 'Pool expands to fill the entire bottom band — author name sits ON it',
    prompt: `${SHARED}

POOL SPEC — "Underlay":
The pool EXPANDS to fill the entire bottom third of the cover —
edge-to-edge, full width. The author name "GIANY ROX" sits ON TOP of
the pool, rendered in cream/white sans-serif so it reads cleanly
against the teal hash surface. The hash text in the pool wraps around
the author name (the letters of "GIANY ROX" punch out of the hash
matrix in cream). The drip from the bill lands cleanly in the upper
edge of the pool with a small ripple.
Reads as: bill → drip → the rest of the cover IS the pool.`,
  },
  {
    slug: 'p-ripples',
    name: 'Ripples',
    desc: 'Wider pool with concentric ripples, hash text in each ring',
    prompt: `${SHARED}

POOL SPEC — "Ripples":
The pool occupies the lower third of the cover, wider than the bill
(about 80% canvas width), with a soft oval shape. The drip from the
bill lands at the center-top of the pool, creating CONCENTRIC RIPPLES
that spread outward — 4 or 5 concentric ellipses. Each ripple band is
made of a row of hash text (the further out, the smaller/lighter the
hashes). Implies that one stablecoin transaction ripples through the
network. Author name is below the pool in cream space.`,
  },
  {
    slug: 'p-cascade',
    name: 'Cascade',
    desc: 'Multiple drip strands descend like a small waterfall into a wide pool',
    prompt: `${SHARED}

POOL SPEC — "Cascade":
Instead of one drip, THREE parallel drip strands descend from the
bottom edge of the bill — close together, like a thin waterfall. Each
strand is its own column of teal hash text. They terminate in a wide
flat pool that spans the full width of the lower portion of the cover
(but is only ~15% of the cover height, like a shallow reservoir).
The pool's surface is fully covered in hash text. Author name "GIANY
ROX" sits cleanly below the pool in cream space. Reads as: many
transactions → one shared ledger pool.`,
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
  console.log(`→ rendering ${VARIANTS.length} pool variants (~$${(VARIANTS.length * 0.167).toFixed(2)})\n`);
  const results = await Promise.allSettled(VARIANTS.map((v) => genOne(v, key)));
  console.log('\n── summary ──');
  for (let i = 0; i < VARIANTS.length; i++) {
    const r = results[i];
    console.log(`${r.status === 'fulfilled' ? '✓' : '✗'} ${VARIANTS[i].slug} — ${VARIANTS[i].desc}`);
    if (r.status === 'rejected') console.log(`  ${r.reason.message?.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
