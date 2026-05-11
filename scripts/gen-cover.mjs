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

const PROMPT = `Book cover design for a serious non-fiction business book. Belongs on
a bookstore shelf next to "Sapiens" or "The Bitcoin Standard". Not a
crypto-bro aesthetic. Penguin Press hardcover vibe.

REQUIRED TEXT ELEMENTS (render cleanly, real typography, no garbled letters):
- Top: title in large bold serif — "YOUR MONEY IS BROKEN"
- Below the title: subtitle in smaller italic serif —
  "How Stablecoins Bridge Slow Money to Fast Money"
- Bottom: author byline in clean sans-serif uppercase — "GIANY ROX"

CENTRAL VISUAL: a single United States one-dollar bill, photographed
from straight overhead, with REAL US dollar proportions (2.61:1 aspect
ratio — wider than tall, like a real bill, not square). The bill is
torn cleanly in half horizontally and held together across the gap by
glowing teal-green digital threads / stitches. From the tear, geometric
binary code particles flow downward like a quiet shadow. The dollar's
green seal and serial numbers are accurate and readable.

PALETTE: warm cream background #faf6eb, deep teal #2a9d8f for the
digital stitches and code, charcoal #1a1a1a for the title typography,
classic dollar-bill green for the bill itself.

COMPOSITION: portrait book cover, 6×9 ratio. Title in top third,
dollar bill centered slightly below the middle, author name in the
bottom margin. Generous whitespace. Soft natural shadow under the bill.
Studio lighting from upper-left.

Mood: serious, hopeful, editorial. Magazine-quality flat-lay
photography aesthetic.`;

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
