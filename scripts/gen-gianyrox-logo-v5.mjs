#!/usr/bin/env node
// V5 — the letter G is BUILT from machete-blade silhouettes.
// Each stroke = a blade profile (wider at handle base, tapering to sharp point).

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts-v5';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nDO NOT INCLUDE: visible handles, hilts, grips, pommels, separate sword icons, skulls, flags, faces, hooks, anchors, eye patches, OR any pictorial icons. The blades ARE THE LETTERFORM ITSELF — not separate icons around a letter. NO calligraphic curlicues, no script flourishes, no ribbons. NO watermark, NO signature. The viewer should see "a letter G" first, and only on second look realize the strokes are blade-shaped.`;

const concepts = [
  {
    slug: 'g-blade-strokes-orange',
    prompt: `A purely typographic logo of the single capital letter G. CRITICAL: each stroke of the G is shaped like a machete blade profile — wider where a handle would attach, tapering to a SHARP POINT at the opposite end. The curved bowl of the G is one large curved blade (like a kukri or scimitar profile). The horizontal crossbar of the G is a straight tapered blade. The terminal of the G (the inner spur at the opening) is a smaller dagger-blade shape. All blade-strokes connect smoothly to form a recognizable G letterform — but every stroke silhouette is unmistakably a blade profile, not a standard typeface stroke. NO visible handles, hilts, or grips — just the blade silhouettes intersecting to form the letter. Solid filled fill in bright neon orange (#ff6f00) on pitch black background. Razor-sharp vector edges, NO bevels, NO highlights — just flat color blade silhouettes. Thin electric cyan (#00ddff) hairline glow tracing the outside only. Square 1024x1024, centered, mark fills 65% of canvas. The viewer sees a G first, then realizes "those are blades." NO icons separate from the letter — the blades ARE the letter. ${NEG}`,
  },
  {
    slug: 'g-kukri-curve',
    prompt: `Typographic logo: capital G where the main curved bowl is the silhouette of a single kukri blade — that distinctive forward-curving blade profile with a wider belly and sharp point. The blade's tip becomes the tail of the G's terminal at the bottom-right opening. A short horizontal blade-shape forms the crossbar of the G. NO handle, NO grip, NO hilt — pure blade silhouettes only, intersecting cleanly. Solid neon cyan (#00ddff) fill on pitch black background. Razor-sharp vector edges. Subtle hot magenta (#ff00aa) outer glow line. Square 1024x1024, centered, large mark. The G is unmistakably a G but its strokes are kukri-blade silhouettes. ${NEG}`,
  },
  {
    slug: 'g-double-edge-glyph',
    prompt: `Typographic logo: capital letter G constructed entirely from double-edged blade silhouettes. Each stroke is shaped like a dagger blade — symmetrical taper from a wider mid-point down to a sharp tip on BOTH ends. The strokes interlock to form a recognizable G. NO handles, NO hilts — pure floating blade silhouettes. Solid amber gold (#d4a24c) fill on pitch black background. Razor-sharp clean vector edges. A thin orange glow outline (#ff6f00) just outside the gold. Square 1024x1024, centered, large mark with breathing room. Daft Punk / Tron-Legacy clean execution. Reads as a sharp aggressive G first, then "those are knife blades." ${NEG}`,
  },
  {
    slug: 'g-scimitar-bowl',
    prompt: `Typographic logo: capital G whose entire curved outer stroke is one continuous scimitar-blade silhouette — a long graceful curve sweeping from the upper-right around the bottom and back up, narrowing to a razor point at the upper-right terminal of the G. The crossbar at center is a smaller straight blade silhouette. Inner spur is a small angled blade tip. NO handles, NO grips, NO icons. Solid neon green (#39ff14) fill on pitch black background. Subtle electric cyan (#00ddff) hairline glow tracing only the cutting edge of the main curve. Razor-sharp vector edges. Square 1024x1024, centered, large mark. The blade IS the letter. ${NEG}`,
  },
  {
    slug: 'g-bone-cleaver',
    prompt: `Typographic logo: capital G constructed from heavy CLEAVER blade silhouettes — broad rectangular blade shapes with a slight curve on the cutting edge and a sharp angled point at one corner. Three or four cleaver-blade silhouettes interlock to form a chunky aggressive G letterform. Heavy thick strokes (since cleavers are heavy). NO handles visible. Solid blood-orange-red (#ff5722) fill on pitch black background. Crisp polished chrome edge highlight on the cutting edge of each blade (off-white #f5f5f5 thin highlight). Subtle blue (#00aaff) outer glow. Razor-sharp vector edges. Square 1024x1024, centered, large mark. Brutalist heavy industrial blade-letterform. ${NEG}`,
  },
  {
    slug: 'g-machete-monogram',
    prompt: `Typographic logo: the letter G drawn as if a long curved machete blade has been bent into the shape of a G. ONE continuous machete blade — wide at where the handle would meet it, tapering through the curve of the G's bowl, around the bottom, and ending in a sharp point at the upper terminal opening. The crossbar of the G is a separate small straight blade segment crossing through the curve. NO handle, NO grip visible — JUST blade. Solid bright neon orange (#ff6f00) blade on pitch black background, with a single razor-thin off-white (#f5f5f5) highlight along the cutting edge (inner curve). Razor-sharp vector edges. Square 1024x1024, centered, large mark. The viewer reads a G first, then realizes the entire mark is a machete blade folded into a letter. ${NEG}`,
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
console.log('\ndone. 6 v5 concepts in', OUT);
