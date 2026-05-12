#!/usr/bin/env node
// gen-bill-only.mjs — render JUST the torn dollar bill on a cream
// background, no other elements. For programmatic compositing.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const OUT_DIR = join(REPO, 'public', 'cover');

const PROMPT = `
Render a single torn US one-dollar bill on a SOLID cream background
#faf6eb. NO TEXT, NO HEADINGS, NO TITLE, NO SUBTITLE, NO LOGO,
NO OTHER ELEMENTS. Just the bill on cream.

Use the reference image as the source for the bill — render it with
full engraving fidelity. Do NOT redraw Washington's portrait; preserve
his hair, collar, expression, and the engraving lines exactly as in
the reference.

The bill is TORN cleanly through the middle VERTICALLY with VISIBLY
FRAYED EDGES:
- Jagged paper edges along the tear line
- Loose paper fibers visible
- Slight curl on the torn edges (one or both halves slightly lift)
- The two halves may be very slightly offset, suggesting recent damage
- Small wear/crease lines on the bill corners (subtle, photographically real)

Real US $1 proportions (2.61:1 wider than tall). Photographed from
straight overhead. Soft natural shadow under the bill. Slight depth
of field.

PRESERVE FROM REFERENCE:
- "FEDERAL RESERVE NOTE" at top of bill
- "THE UNITED STATES OF AMERICA" below it
- "ONE DOLLAR" at bottom
- Corner numerals "1" on all four corners
- Serial number "L11180916G" or similar real-format serial, visible TWICE on the bill
- Green Treasury seal on the right (eagle and shield detail intact)
- Black Federal Reserve seal on the LEFT with the letter "L"
- The engraved scrollwork frame around the portrait

Output: 1024×1024 square image, bill centered, cream background everywhere else.
`;

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  await mkdir(OUT_DIR, { recursive: true });
  const dollarRef = await readFile(join(OUT_DIR, '_refs', 'usd1-1024.png'));
  console.log('→ rendering clean torn bill (~$0.17)');

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', PROMPT);
  form.append('image[]', new Blob([dollarRef], { type: 'image/png' }), 'dollar.png');
  form.append('n', '1');
  form.append('size', '1024x1024');
  form.append('quality', 'high');
  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) { console.error(`${r.status}:`, (await r.text()).slice(0, 300)); process.exit(1); }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  const out = join(OUT_DIR, '_refs', 'bill-torn.png');
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
