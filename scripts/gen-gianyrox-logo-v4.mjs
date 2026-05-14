#!/usr/bin/env node
// V4 — machete not iron handles.
// Sharp aggressive blade-form letterforms (no cursive script flourish).
// Still Tron/Daft Punk execution.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts-v4';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nDO NOT INCLUDE: skulls, flags, swords, anchors, eye patches, hooks, peg legs, faces, ships, parrots, treasure chests, OR any pictorial icons. DO NOT INCLUDE: cursive script flourishes, calligraphic curlicues, decorative swashes, scrollwork, ribbons, leaves, or ornamental scrollwork. The letterform should feel like it was CARVED with a machete, not drawn with a quill. No watermark, no signature, no text other than the letter G.`;

const concepts = [
  {
    slug: 'g-machete-wedge',
    prompt: `A purely typographic logo. The single capital letter G as a heavy industrial slab with MACHETE-CUT terminals: every stroke endpoint is sliced at a sharp 30-degree angle, like the blade-edge of a machete or cleaver. Heavy thick strokes, no thin contrast, no curves softening the wedges. The crossbar of the G is a horizontal sharp wedge. Aggressive geometric, almost brutalist letterform. Rendered as a neon orange (#ff6f00) glow outline only on pitch black background. Sharp glowing edges, no soft drop shadow. Square 1024x1024, centered, mark fills 60% of canvas. Mad Max title × Tron Legacy energy. SHARP not scrolly. ${NEG}`,
  },
  {
    slug: 'g-cleaver-slab',
    prompt: `Typographic logo: capital letter G as a heavy industrial slab-serif letterform with chiseled wedge terminations — every serif is a sharp angled chisel cut, not a curved foot. Think of the letter as if it were forged from a single piece of metal then sharpened on a blade-grinder. Solid filled fill with bright Daft-Punk-orange (#ff6f00) on pitch black background. Razor-sharp vector edges. A single hairline electric cyan (#00ddff) outline glow just outside the orange fill. Square 1024x1024, centered, large mark. Industrial blade × cyberpunk neon. NO curls, NO scrolls, NO icons. ${NEG}`,
  },
  {
    slug: 'g-stencil-military',
    prompt: `Typographic logo: capital letter G in a heavy military-stencil display style with bridges in the strokes (small gaps where a real stencil would have ribs). Aggressive blocky letterform — no curves softer than they need to be, every transition feels machined. Solid fill with electric cyan (#00ddff) on pitch black background. Sharp clean edges, no rough texture, no spray-paint feel — this is CNC-precise. Subtle outer orange (#ff6f00) glow. Square 1024x1024, centered, large mark. Industrial gaming clan-mark energy. NO icons, NO flourishes. ${NEG}`,
  },
  {
    slug: 'g-chiseled-stone',
    prompt: `Typographic logo: capital letter G rendered as if CHISELED from solid stone — heavy slab strokes with deep angular V-cuts running through them showing the chisel marks. The letterform is brutal and bold, no ornamental terminals. Rendered with: a polished chrome surface (cool blue + warm orange reflection bands like a Daft Punk helmet) on the front face, sharp black V-grooves cut into the chrome to suggest the chisel cuts. Pitch black background. Razor-sharp edges. Square 1024x1024, centered, large mark. Ancient monumental × cyberpunk chrome — like a temple inscription rendered for Tron Legacy. NO icons, NO scrolls. ${NEG}`,
  },
  {
    slug: 'g-hatchet-strokes',
    prompt: `Typographic logo: capital letter G drawn with heavy strokes that each TAPER to a sharp point at one end — like the profile of a hatchet or hand-axe blade. The thick end of each stroke is the heel, the narrow tip is the bit. The strokes intersect at sharp interior angles. No serifs, no flourishes — the taper IS the design. Neon green (#39ff14) solid fill on pitch black background, with a hairline magenta (#ff00aa) outer glow line tracing the outside. Sharp clean vector edges. Square 1024x1024, centered, large mark. Aggressive, weaponized letterform × cyberpunk neon. ${NEG}`,
  },
  {
    slug: 'g-fractured-cut',
    prompt: `Typographic logo: capital letter G in a heavy aggressive bold display style. The letterform appears to have been STRUCK by a blade — three sharp angular cuts run through the G at varied angles, creating thin black slices through the otherwise solid letter. The cuts are razor-thin, geometric, surgical. The letterform itself has no flourishes — heavy blocky slab strokes only. Color palette: solid bright orange (#ff6f00) G, the cuts reveal pitch black background underneath. A single thin electric cyan (#00ddff) glow line traces only one of the cut edges for dynamic accent. Razor-sharp vector edges. Square 1024x1024, centered, large mark. Brutalist gaming-title × glitch aesthetic. NO icons. ${NEG}`,
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
console.log('\ndone. 6 v4 concepts in', OUT);
