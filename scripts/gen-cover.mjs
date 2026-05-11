#!/usr/bin/env node
// gen-cover.mjs — render the *Your Money Is Broken* cover via OpenAI
// gpt-image-1. Front cover only (KDP cover wrap needs a separate
// spine+back render with exact spine width from KDP calculator).
//
//   ~/agfarms/gianyrox/public/cover/front.png   — 1024×1536 portrait
//   ~/agfarms/gianyrox/public/cover/front-hd.png — 1024×1536 HD (KDP-ready)
//
// Costs: medium ~$0.06 · high ~$0.25
//
// Usage:
//   node scripts/gen-cover.mjs                # medium
//   node scripts/gen-cover.mjs --quality high # HD for KDP

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'cover');

const PROMPT = `Book cover design for "Your Money Is Broken" — a field report from
the stablecoin world. The cover should feel like a serious non-fiction
business book that belongs on a bookstore shelf next to "Sapiens" or
"The Bitcoin Standard". Not a crypto-bro aesthetic.

Visual concept: a torn US dollar bill that's been partly stitched back
together with glowing teal-green digital threads, against a clean warm
cream background. The torn edges reveal not paper fibers but flowing
binary code or geometric particle traces in deep teal #2a9d8f and
charcoal #264653. Minimalist, editorial, magazine-quality photography
aesthetic. Subtle shadow under the bill.

Composition: 6×9 portrait book cover, centered subject, top third
clean negative space for the title (rendered separately), generous
margin on all sides. No text in the image — title will be overlaid in
post.

Mood: serious, hopeful, contemporary. Think Penguin Press hardcover.
Soft natural light from upper-left.`;

async function main() {
  const args = process.argv.slice(2);
  const quality = args.includes('--quality') ? args[args.indexOf('--quality') + 1] : 'medium';
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`→ generating ${quality} cover (~$${quality === 'high' ? '0.25' : '0.06'})`);

  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: PROMPT,
      n: 1,
      size: '1024x1536',
      quality,
    }),
  });
  if (!r.ok) { console.error(`OpenAI ${r.status}:`, (await r.text()).slice(0, 300)); process.exit(1); }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) { console.error('no b64 in response'); process.exit(1); }
  const out = join(OUT_DIR, quality === 'high' ? 'front-hd.png' : 'front.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
