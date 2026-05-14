#!/usr/bin/env node
// V6 — variations on the WINNING blade-strokes-orange direction.
// Same DNA: G strokes ARE blade silhouettes, neon orange + cyan glow, black ground.
// Adds: more flourish IN the blade shapes (kris waves, fullers, hooked tips, forge marks)
// — NOT separate ornament. The blades themselves get more visual character.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts-v6';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nDO NOT INCLUDE: visible handles, hilts, grips, pommels, separate sword icons, skulls, flags, faces, hooks, anchors, eye patches, OR pictorial icons. NO calligraphic curls, NO script ribbons, NO scrollwork. The flourish must come from the BLADE shapes themselves (kris waves, fullers, hooked tips, etched fullers) not added decorations. NO watermark.`;

const BASE = `Purely typographic logo, single capital letter G. CRITICAL: each stroke is shaped like a tapered blade silhouette. Wider where a handle would meet, tapering to a SHARP POINT at the opposite end. The curved bowl of the G is a long curved blade. The crossbar is a straight tapered blade. The terminal spur at the G's opening is a smaller dagger blade. Blade-strokes intersect cleanly to form a recognizable G. NO visible handles or hilts. Solid bright neon orange (#ff6f00) blade fills on pitch black background, with a thin electric cyan (#00ddff) hairline glow tracing the outside edges. Razor-sharp vector edges. Square 1024x1024, centered, mark fills 65% of canvas.`;

const concepts = [
  {
    slug: 'g-blade-kris-wave',
    prompt: `${BASE} VARIATION: the cutting edge of each blade has a subtle kris-style WAVY profile (gentle serpentine undulation along the edge — like a Filipino kalis or Indonesian kris blade). Wave is subtle, not extreme — adds organic energy without making the G unreadable. Each wave-peak is sharp. ${NEG}`,
  },
  {
    slug: 'g-blade-fuller-groove',
    prompt: `${BASE} VARIATION: each blade-stroke has a thin black FULLER (blood groove) running down the center of the blade — a narrow channel cut into the blade for weight reduction. The fuller appears as a thin pitch-black line tracing the spine of each blade-stroke. This adds craftsmanship detail without altering the letterform. ${NEG}`,
  },
  {
    slug: 'g-blade-hooked-tip',
    prompt: `${BASE} VARIATION: every blade-stroke ends in a slight FORWARD HOOK at the tip (like a tanto-cutoff or a Damascus karambit) — the final 8-10% of each blade curves slightly. The hooks all rotate consistently (clockwise relative to the G's center) for visual rhythm. ${NEG}`,
  },
  {
    slug: 'g-blade-forge-spark',
    prompt: `${BASE} VARIATION: the blades look freshly forged — each blade has a subtle inner HEAT GLOW running through its center (a warm yellow-white #fff1a8 highlight along the blade's spine, suggesting the blade is still hot from the forge). The orange of the blade body and the inner heat-glow create a gradient feel without literal gradient banding. Plus a few tiny orange-yellow spark dots floating around the mark (4-6 max, very subtle). ${NEG}`,
  },
  {
    slug: 'g-blade-damascus-pattern',
    prompt: `${BASE} VARIATION: the surface of each blade-stroke shows a subtle DAMASCUS STEEL pattern — flowing organic waves of slightly darker orange (#cc5500) etched into the blade body. The pattern is subtle, not loud — gives the blades a forged, hand-crafted feel. Pattern flows along the long axis of each blade. ${NEG}`,
  },
  {
    slug: 'g-blade-mirror-edge',
    prompt: `${BASE} VARIATION: each blade-stroke has a razor-thin MIRROR-POLISHED edge — a hairline off-white (#f5f5f5) highlight running along the cutting edge of every blade, suggesting a freshly-sharpened steel edge catching light. The rest of the blade stays solid neon orange. This adds tactile blade-quality detail without busy ornament. ${NEG}`,
  },
];

async function gen(c) {
  const t0 = Date.now();
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt: c.prompt, n: 1, size: '1024x1024', quality: 'high' }),
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error('no b64');
  await writeFile(join(OUT, `${c.slug}.png`), Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${c.slug}.png (${dt}s)`);
}

for (const c of concepts) {
  console.log(`[${c.slug}]…`);
  try { await gen(c); } catch (e) { console.error(`  ✗ ${c.slug}: ${e.message}`); }
  await new Promise(r => setTimeout(r, 1100));
}
console.log('\ndone. 6 v6 concepts in', OUT);
