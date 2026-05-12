#!/usr/bin/env node
// gen-back-cover.mjs — renders the BACK cover panel for the KDP wrap.
// Same visual language as the front (cream top, teal hash gradient at
// bottom) but with the marketing blurb + author bio instead of the
// title/dollar.
//
// Output: public/cover/back-hd.png (1024×1536)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Back cover panel for the book "Your Money Is Broken". The visual
language must match the FRONT cover (first reference image): warm
cream background #faf6eb at the top two-thirds, transitioning into a
deep teal gradient #1d6f63 at the bottom one-third, with overlapping
monospace hash text fragments scattered through the teal zone.

LAYOUT (top to bottom):

1. PULL QUOTE — at the top, large transitional serif italic, centered:
   "A field report from inside the digital dollar economy."
   In medium grey #555, ~36pt equivalent.

2. MARKETING BLURB — body text, justified, ~14pt equivalent, charcoal
   #1a1a1a, mid-cover:

   "Four cities. Four people. The same invisible infrastructure.
   Bogotá. Harare. Lagos. A rooftop in Buenos Aires.

   When the old banking pipes break, the people who feel it first are
   the ones moving money across borders. Pablo in Bogotá sends
   medicine money to his mother in 90 seconds for under 2 dollars.
   Mercy in Harare protects a women's savings club from 56% inflation
   by parking everything in a digital dollar. Femi in Lagos closes a
   100,000-dollar supplier deal from the back of a parked car.

   This is what happens when stablecoins quietly become the bridge from
   slow money to fast money — not the speculation side of crypto, the
   side that just works."

3. AUTHOR BIO — small italic serif, ~12pt, in the cream-to-teal
   transition zone:

   "GIANY ROX is the founder of AGFarms, a venture studio shipping
   16+ products from a single terminal. His writing on math, money,
   and the future of work has appeared on Medium for years."

4. ISBN BARCODE PLACEHOLDER — small white rectangle at the bottom-right
   inside the teal zone, approximately 1.5 × 1 inch proportions,
   labeled "ISBN" — leave room for the real barcode KDP issues.

5. PUBLISHER MARK — small text bottom-left:
   "AGFarms" set in clean sans-serif uppercase, letter-spaced

THE BOTTOM TEAL ZONE (lower ~30% of cover):
- Deep teal gradient transitioning from cream to teal #1d6f63
- Scattered teal hash text fragments throughout: "0xa1f3...e9c2",
  "0xb471", "0xc857", "0xd4f0", "7df0", etc — same density and feel
  as the front cover's gradient zone

NO front-cover elements on this panel — no title, no dollar bill, no
"YOUR MONEY IS BROKEN" headline. This is the BACK only.

Same editorial Penguin Press / Sapiens shelf aesthetic. NO crypto-bro.
6×9 portrait proportions.
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const frontRef = await readFile(join(OUT_DIR, 'front-hd.png'));
  console.log('→ rendering back cover (~$0.17)');

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', PROMPT);
  form.append('image[]', new Blob([frontRef], { type: 'image/png' }), 'front.png');
  form.append('n', '1');
  form.append('size', '1024x1536');
  form.append('quality', 'high');
  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) { console.error(`${r.status}:`, (await r.text()).slice(0, 300)); process.exit(1); }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  const out = join(OUT_DIR, 'back-hd.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
