#!/usr/bin/env node
// gen-cover-optimal.mjs — Round 7. One image, optimal.
//
// Founder direction 2026-05-12: accept the teal gradient (model
// produces it anyway), but FILL THE ENTIRE GRADIENT ZONE with dense
// overlapping hash text — not just a thin falling column. Hashes
// everywhere in the teal area.
//
// Uses d-faithful + real $1 reference. Single high-quality render.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Book cover refinement. Use the FIRST reference for composition + style.
Use the SECOND reference (real US $1 bill) to render the dollar with
full accuracy — Washington's portrait, the engravings, the serial
number, "FEDERAL RESERVE NOTE", "THE UNITED STATES OF AMERICA",
"ONE DOLLAR", the corner "1"s, the green Treasury seal, the black
Federal Reserve seal with letter "L". Bill is torn vertically through
the middle. Real $1 proportions (2.61:1).

PRESERVE FROM THE FIRST REFERENCE:
- Title "YOUR MONEY IS BROKEN" — bold transitional serif, charcoal, top
- Subtitle "How Stablecoins Bridge Slow Money to Fast Money" — italic
  serif, smaller, below title
- Author byline "GIANY ROX" — humanist sans-serif uppercase, letter-
  spaced, at the very bottom
- Cream background #faf6eb at the top half (around the bill)
- Teal vertical gradient on the bottom half — cream at the top of the
  gradient, deep teal #1d6f63 at the bottom
- A thin teal hash strand bridges the tear: "0xa1f3...e9c2"

THE KEY CHANGE — HASH TEXT FILLS THE ENTIRE TEAL GRADIENT ZONE:

Across the ENTIRE bottom half of the cover (the teal gradient area),
densely populate with overlapping monospace hash text. NOT just a thin
falling column down the middle — fill the WHOLE teal zone, edge to
edge, top of gradient to bottom.

Mix of hash fragments throughout the field:
"0xa1f3...e9c2", "0xb471...c857", "0xd4f0...7df0", "0x7df0...0926",
"0xe9c2...b471", "0x0a13", "0xa173", "0x8b4d", "c857", "d4f0", "7df0",
"e926", "a1f3", "b471"

Each hash fragment is small monospace text. They overlap in dozens of
horizontal rows (maybe 20–30 rows visible top-to-bottom) and span the
full width of the cover. Different sizes — some larger, some tiny.
Different opacities — some brighter teal, some faded almost into the
background. Some at slight angles. They feel layered, like ledger
entries piled on top of each other or like rainfall of transactions.

At the top of the teal zone (just under the bill), the hash text is
sparse, smaller, more spaced out — the bill is "dripping" them.
Moving downward, the hash text gets denser, more layered, more
overlapping, more brightly teal.

By the bottom (around the author name), the hash text is so densely
packed it's nearly a wall of overlapping characters — but it's still
recognizably text, NOT a flat color block.

Author name "GIANY ROX" sits at the very bottom in cream or white,
clearly readable against the dense hash field — the hashes wrap
around it cleanly.

Bridging hash strand on the bill stays as the only visible hash
element above the gradient zone.

CRITICAL — DOLLAR BILL FIDELITY:
Preserve Washington's portrait exactly as in the reference image. His
hair shape, collar, expression. The engraving detail. Don't redraw.
Serial number "L11180916G", corner "1"s, treasury seals, all readable.

NO crypto-bro aesthetic, NO neon, NO laser eyes. Penguin Press /
Sapiens shelf editorial book design.
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const compRef = await readFile(join(OUT_DIR, 'd-faithful.png'));
  const dollarRef = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log('→ rendering optimal cover (~$0.17)');

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
  const out = join(OUT_DIR, 'optimal.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
