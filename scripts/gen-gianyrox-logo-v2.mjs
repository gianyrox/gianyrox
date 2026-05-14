#!/usr/bin/env node
// V2 — teenage gamer streamer vibe. Less editorial, more Twitch/Discord/clan-tag.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts-v2';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nDo NOT include: pirate hooks, peg legs, eye patches, photo-realistic faces, watermarks, signatures, soft drop shadows, editorial/serif fonts, antique aging effects, sepia tones. The vibe is YOUNG/AGGRESSIVE, not vintage/mature.`;

const concepts = [
  {
    slug: 'g-neon-glitch',
    prompt: `An aggressive gaming streamer logo: bold italic capital letter G with RGB glitch / chromatic aberration effect — slight cyan offset on left, magenta offset on right of the main neon green G. The G has sharp aggressive angled cuts in the strokes. Tiny pixel-art skull (8x8 pixel) integrated where the G's opening points. Pitch black background. Neon green (#00ff66), cyan (#00ffff), magenta (#ff00aa). Hard edges, no soft shadows. Square 1024x1024, centered with generous breathing room. Discord profile picture / Twitch logo / clan tag energy — feels like a teenager's gaming setup, not a nautical museum. ${NEG}`,
  },
  {
    slug: 'g-spray-tag',
    prompt: `A graffiti spray-paint tag style logo: aggressive capital G in fat-cap urban spray paint style with paint drip running down 1-2 strokes. Slight forward italic lean. A small spray-painted skull-and-crossbones above the G as a crown. Pure black wall background with subtle concrete texture. Bright safety-orange (#ff5722) main G, neon yellow drip accents, white skull. Sharp graffiti edges with controlled drips, no gradients. Square 1024x1024, centered. Skate / clan tag / gaming streamer crew vibe. ${NEG}`,
  },
  {
    slug: 'g-esports-slash',
    prompt: `Esports clan logo: bold capital G in heavy italic geometric sans-serif, sliced diagonally by a sharp katana-style sword cut from top-right to bottom-left. The blade is razor-thin and electric. Below the G, three angular shapes suggesting either crossed bones or lightning bolts. Pitch black background. Electric crimson red (#ff003c) G, white sword blade with cyan glow edge, white accents. Sharp aggressive 45-degree angles. Square 1024x1024, centered. Looks like the official mark of a Counter-Strike/Valorant gaming team. ${NEG}`,
  },
  {
    slug: 'g-pixel-8bit',
    prompt: `A retro 8-bit pixel-art video game logo: chunky capital G made of large blocky pixels (16x16 effective resolution), pure flat color blocks. Two small pixel-art crossed swords below the G. A small pixel skull peeks from the upper-right corner of the G's opening. Pitch black background. Bright arcade gold (#ffcc00) G, white swords, pink (#ff3399) skull eyes. No anti-aliasing — every edge is a hard pixel staircase. Square 1024x1024, centered, mark fills about 60% of canvas. Old-school gamer + treasure-island aesthetic, like a Castlevania title screen. ${NEG}`,
  },
  {
    slug: 'g-chrome-y2k',
    prompt: `Y2K chrome gaming logo: bold capital G rendered as polished chrome metal with cool blue and purple reflections baked into the chrome surface. Slight italic lean. Behind the G, a small black pirate flag (Jolly Roger) on a chrome flagpole, flying to the upper-right. Pitch black background. Chrome G + flagpole, white flag with tiny chrome skull, single magenta (#ff00ff) accent on flag edge. Sharp specular highlights, hard reflective edges, no soft shadows. Square 1024x1024, centered. Feels like a 2002 Y2K gaming brand or a NASCAR-team logo. ${NEG}`,
  },
  {
    slug: 'g-anime-bold',
    prompt: `Anime-streamer-style profile logo: bold capital G with thick black outline and cel-shaded flat fills. The G has aggressive diagonal cuts at the top-right and bottom-left, like a slashed cut-mark. A small chibi cartoon skull glares from inside the G's opening — wide cartoony eye sockets, no scary detail. Tiny crossed bones below the G as a base. Vibrant electric blue (#00aaff) G, hot pink (#ff3da6) skull, white outlines, pitch black background. Cel-shaded vector style with bold black stroke on every edge. Square 1024x1024, centered, large mark. VTuber / Discord avatar / Twitch panel vibe. ${NEG}`,
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
console.log('\ndone. 6 concepts in', OUT);
