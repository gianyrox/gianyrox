#!/usr/bin/env node
// gen-empty-template.mjs — take front-hd.png and ask gpt-image-1 to
// remove all elements except the cream background and the teal gradient
// (with its scattered hash text). Output: public/cover/_refs/empty-template.png
//
// This is the cleanest path per founder direction 2026-05-12: use the
// front cover as the source of truth for the gradient + hash field, so
// the back panel matches the front EXACTLY pixel-wise. Then PIL draws
// the back text on top.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Modify the input image (a book cover) by REMOVING the following elements
while keeping everything else exactly identical:

REMOVE:
- The title "YOUR MONEY IS BROKEN" at the top
- The subtitle text below the title
- The author byline "GIANY ROX" at the bottom
- The torn dollar bill in the middle of the cover
- The vertical column of falling teal hash text that drips from the bill
  (only the central drip column — keep the surrounding hash field below)

KEEP UNCHANGED — render these exactly as in the input image, pixel-for-pixel:
- The cream background #faf6eb in the upper portion of the cover
- The deep teal vertical gradient that begins around the bottom 40% of
  the cover and transitions from cream to deep teal #1d6f63 at the bottom
- All the small overlapping monospace hash text fragments scattered
  throughout the teal gradient zone (the "hash field"), at exactly the
  same density, color, opacity, and positions

The output should look like the input image with the title, subtitle,
author byline, dollar bill, and central drip column erased — leaving an
empty cream cover with a teal gradient + hash field at the bottom,
suitable for use as a back-cover template that I will composite text
onto programmatically.

Output: 1024×1536 portrait, same dimensions as input.
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(join(OUT_DIR, '_refs'), { recursive: true });
  const frontBuf = await readFile(join(OUT_DIR, 'front-hd.png'));
  console.log('→ generating empty template from front-hd (~$0.17)');

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', PROMPT);
  form.append('image[]', new Blob([frontBuf], { type: 'image/png' }), 'front.png');
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
  const out = join(OUT_DIR, '_refs', 'empty-template.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
