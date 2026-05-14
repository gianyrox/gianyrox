#!/usr/bin/env node
// Generate Gianyrox logo concepts via gpt-image-1.
// Style brief: gamer-tag YouTube energy, piratey vibe (skulls/swords/treasure/compass)
// but NO literal pirate hooks. Bold G monogram is the focal element.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nDo NOT include: pirate hooks, peg legs, eye patches with strings, generic stock-icon vibes, drop shadows, gradients with banding, watermarks, signatures, photo-realistic skin/faces, anime style, or any logo text other than the letter G itself.`;

const concepts = [
  {
    slug: 'gianyrox-g-cutlass',
    prompt: `A bold YouTube gamer-tag logo featuring a stylized capital letter G as the focal element, rendered in vector flat-design style. The G has thick strokes and a slight italic forward lean for energy. Behind the G are two crossed cutlass swords intersecting at 45-degree angles, blades extending outward. Tiny treasure-map compass rose inside the negative space of the G. Color palette: deep navy black background, bright gold (#d4a24c) for the G, off-white (#f2e8d5) accents on the swords, blood-red (#c4302b) for one small detail. Stark high contrast, no gradients, sharp edges. Square 1024x1024, centered composition with negative space around the mark. Vector logo aesthetic — like Twitch streamer branding meets old-school nautical insignia. NO text outside the G itself. ${NEG}`,
  },
  {
    slug: 'gianyrox-g-skull',
    prompt: `A bold gamer/streamer logo: capital G monogram with a stylized geometric skull integrated INTO the negative space of the G. The skull is minimalist, low-poly, almost glyph-like — not anatomical. The G strokes wrap around the skull. Two crossed bones below the G as a subtle base mark. Color palette: pure black background, electric gold (#d4a24c) G strokes, white skull, single accent of cyan (#2a9d8f). Vector flat design, sharp edges, no drop shadow. Square 1024x1024, centered, generous negative space. Pirate-themed gamer-tag energy — Twitch streamer with a black-flag vibe. ${NEG}`,
  },
  {
    slug: 'gianyrox-g-compass',
    prompt: `A streamer/YouTube channel logo: capital letter G in bold geometric sans-serif, forming the outer ring of an antique navigation compass. The compass rose with N-E-S-W tick marks sits in the negative interior of the G. The opening of the G points toward the East compass needle. Color palette: deep weathered black-navy background, antique gold (#c9a44a) G+compass, off-white (#f5ecd0) compass detail, no other colors. Vector flat illustration, no gradients, no shadows. Square 1024x1024, centered mark, breathing room around the logo. Nautical-meets-gamer-tag energy. ${NEG}`,
  },
  {
    slug: 'gianyrox-g-rope',
    prompt: `A bold gaming/creator brand mark: stylized capital G formed by a single twisted rope coiling into the letter shape. The rope is detailed enough to read as nautical hemp rope (visible twist pattern) but flat-rendered like a vector illustration. A small knot tied at the bottom-right of the G as the period/dot. Color palette: pitch black background, rich rope-gold (#d4a24c) for the G, hint of warm copper (#b08540) for the knot shadow line. Sharp vector edges, no gradients, no soft shadows. Square 1024x1024, centered, generous space around. Looks like a premium gaming-channel mark with a pirate identity — without ever showing hooks or peglegs. ${NEG}`,
  },
  {
    slug: 'gianyrox-g-flag',
    prompt: `Gamer-tag YouTube logo: a stylized capital G shaped like a pirate flag flying from an angled wooden flagpole. The G is the flag fabric — bold, slightly fluttering at the right edge. The flagpole is a thick wooden mast in deep brown angled at 15 degrees. No skull-and-crossbones on the flag itself — just the G monogram. Color palette: midnight black background, bright gold (#d4a24c) for the G/flag, warm walnut brown (#5c3a1f) for the pole, single off-white detail. Vector flat design, crisp edges, no gradients. Square 1024x1024, centered with margin. Looks like the flag of a video-game ship captain. ${NEG}`,
  },
  {
    slug: 'gianyrox-g-emblem',
    prompt: `An emblem-style gamer brand logo: a thick bold capital G monogram in the center of a circular medallion. Around the medallion rim are 8 small nautical icons in a ring: tiny anchor, tiny crossed swords, tiny compass star, tiny ship wheel, tiny skull (small + cute, not scary), tiny coin, tiny treasure key, tiny scroll. Color palette: matte black background, gold (#d4a24c) G + outer ring, off-white (#f5ecd0) for the 8 ring icons, no other colors. Sharp vector flat design. Square 1024x1024, centered, with subtle 1-pixel rim glow. Reads like an esports team crest or a streamer's channel insignia. ${NEG}`,
  },
];

async function gen(c) {
  const t0 = Date.now();
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: c.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    }),
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error('no b64');
  const buf = Buffer.from(b64, 'base64');
  await writeFile(join(OUT, `${c.slug}.png`), buf);
  console.log(`  ✓ ${c.slug}.png (${(buf.length/1024).toFixed(0)} KB, ${dt}s)`);
}

for (const c of concepts) {
  console.log(`[${c.slug}] generating…`);
  try { await gen(c); }
  catch (e) { console.error(`  ✗ ${c.slug}: ${e.message}`); }
  await new Promise(r => setTimeout(r, 1100));
}
console.log('\ndone. 6 concepts in', OUT);
