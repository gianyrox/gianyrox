#!/usr/bin/env node
// V3 — pure typography. "PIRATE"-word ornate letterforms × Tron/Daft Punk execution.
// NO icons. NO skulls. NO flags. NO swords. NO eye patches. NO anchor.
// Just the letter G — but treated like a movie title.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = '/home/gian/agfarms/gianyrox/public/brand/logo-concepts-v3';
await mkdir(OUT, { recursive: true });

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const NEG = `\n\nABSOLUTELY DO NOT INCLUDE: skulls, pirate flags, eye patches, hooks, swords, anchors, treasure chests, ships, parrots, peg legs, faces, any pictorial icon. This is a TYPOGRAPHIC LOGO ONLY — just the single letter G as the focal mark. Any flourishes must be PART OF THE LETTERFORM (swashes, terminals, ligature ornaments) not separate icons. No watermark, no signature, no other text besides the letter G.`;

const concepts = [
  {
    slug: 'g-ornate-neon-orange',
    prompt: `A purely typographic logo. The single capital letter G rendered in an ornate baroque display typeface — think the lettering of the word "PIRATE" in classic pirate movie title cards: dramatic high contrast, swashing serifs, decorative terminals, treasure-map flourishes integrated into the letterform itself. Rendered ENTIRELY as a neon glow outline (no solid fill — just a glowing line tracing the letter shape). Color: pure neon orange (#ff6f00) glow on pitch black background. The glow has a slight bloom/halo. Sharp clean outline, no gradients on the line itself. Square 1024x1024, centered, mark fills 60% of canvas, generous black breathing room. Tron Legacy meets baroque movie-title typography. Pure typography — NO icons whatsoever. ${NEG}`,
  },
  {
    slug: 'g-tron-grid-cyan',
    prompt: `Purely typographic logo: capital letter G in a geometric high-contrast display typeface with subtle baroque/ornate swash terminals on the curves (think classic pirate-novel titling). The letter's internal strokes have thin glowing horizontal grid lines running through them, like the digital surface of Tron Legacy. Color palette: electric cyan (#00ddff) glow for the G outline and grid, pitch black background. Sharp clean vector edges with subtle outer glow bloom. Square 1024x1024, centered, large mark. Cinematic gaming title sequence energy. PURE TYPOGRAPHY — no icons of any kind. ${NEG}`,
  },
  {
    slug: 'g-daftpunk-chrome',
    prompt: `Typographic logo: capital letter G rendered as polished mirror chrome, with subtle ornate swashes on the upper and lower terminals — the letterform itself has a baroque / movie-title elegance. The chrome has a soft horizontal banding effect like a Daft Punk helmet — bright orange (#ff6f00) reflection band on the upper third, electric blue (#00aaff) reflection band on the lower third, off-white chrome between. Pitch black background. Razor-sharp edges. No drop shadow. Square 1024x1024, centered mark with generous space. Daft Punk Discovery album cover energy. PURE TYPOGRAPHY — no helmet, no character, no icons — just the letter G as if it were a chrome sculpture. ${NEG}`,
  },
  {
    slug: 'g-blackletter-electric',
    prompt: `Typographic logo: capital letter G in a hand-drawn ornate blackletter / pirate-tavern-sign style — heavy strokes, decorative spurs, ornamental terminals at top and bottom of the G. The letterform has the character of antique treasure-map calligraphy. But the entire letter is rendered with an electric high-voltage neon look: bright cyan (#00ddff) inner stroke with a hot magenta (#ff00aa) outer glow. Pitch black background. Sharp glowing edges, no soft drop shadow. Square 1024x1024, centered, large mark. Old-world calligraphic letterform × cyberpunk treatment. NO icons — just the ornate G letterform. ${NEG}`,
  },
  {
    slug: 'g-circuit-baroque',
    prompt: `Typographic logo: capital letter G rendered in a baroque ornate display font with treasure-map style flourishes built into the letterform (swashing serif terminals, decorative spurs). Inside the strokes of the G, glowing circuit-board traces run like printed-circuit-board pathways — thin glowing lines with tiny node dots. Color palette: amber gold (#d4a24c) for the main G strokes, glowing electric orange (#ff6f00) for the circuit lines, pitch black background. Sharp clean vector edges. Square 1024x1024, centered, large mark with breathing room. Looks like the title card of a video game called "Gianyrox" — baroque elegance × Daft Punk's Tron Legacy soundtrack aesthetic. PURE TYPOGRAPHY. NO ICONS. ${NEG}`,
  },
  {
    slug: 'g-ornate-vector-flourish',
    prompt: `Typographic logo: an ornate capital letter G in a high-contrast display serif style — like the word "PIRATE" appears in classic adventure-movie title cards. Dramatic thick-and-thin stroke contrast, swashing curved serifs at the upper and lower terminals, decorative flourishes that grow OUT of the letterform itself (not separate ornaments). The G is solid filled — bright neon green (#39ff14) on pitch black background. A single hairline outline glow in cyan (#00ddff) just outside the green fill. Razor-sharp vector edges. Square 1024x1024, centered, large mark. Tron meets antique movie-title calligraphy. PURE LETTERFORM — no icons, no symbols, no characters — only the ornate G. ${NEG}`,
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
console.log('\ndone. 6 v3 concepts in', OUT);
