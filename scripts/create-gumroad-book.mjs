#!/usr/bin/env node
// create-gumroad-book.mjs — list "Your Money Is Broken" on Gumroad.
//
// Steps:
//   1. POST /v2/products to create the product with name, description,
//      price ($9), tags, custom_permalink
//   2. Append a row to ~/agfarms/longtail/runs/.gumroad-listings.jsonl
//      so the upload bot picks it up next
//   3. Print the dashboard URL + next-step instructions
//
// Cover + PDF upload happens via gumroad-upload.mjs after this (the
// Playwright bot). Files needed at:
//   ~/agfarms/gianyrox/public/your-money-is-broken.pdf
//   ~/agfarms/gianyrox/public/cover/front-hd.png

import { writeFile, appendFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);
const TOKEN = process.env.GUMROAD_ACCESS_TOKEN;
if (!TOKEN) { console.error('GUMROAD_ACCESS_TOKEN not set'); process.exit(1); }

const NAME = 'Your Money Is Broken — How Stablecoins Bridge Slow Money to Fast Money';
const PRICE_CENTS = 900;            // $9
const PERMALINK = 'your-money-is-broken';

const DESCRIPTION_HTML = `
<p>Four cities. Four people. The same invisible infrastructure.</p>
<p>From Bogot&aacute; to Harare to Lagos to a rooftop in Buenos Aires &mdash; what
happens when money stops respecting borders. <strong>Your Money Is Broken</strong>
is a field report from inside the stablecoin economy: not the speculation
side, the &ldquo;digital dollar that just works&rdquo; side.</p>

<h3>What's inside</h3>
<ul>
  <li>18 chapters across 6 acts</li>
  <li>The psychology of trust when institutions fail repeatedly</li>
  <li>The bridge: why a shared ledger is the actual innovation</li>
  <li>5,500 years of money-as-debt and how it got to here</li>
  <li>On/off-ramps as the new institutional layer</li>
  <li>What the corridors look like when you're the one sending</li>
</ul>

<h3>Formats</h3>
<ul>
  <li>PDF, ~580 KB, 18 chapters, suitable for laptop / tablet / phone</li>
  <li>Paperback + hardcover via Amazon KDP coming Q3 2026</li>
</ul>

<p><em>The same book is available to read free at
<a href="https://www.gianyrox.com/book">gianyrox.com/book</a>. Buying here supports the work and gets you the PDF to keep.</em></p>

<p><small>Cover design: AGFarms. Author: Giany Rox.</small></p>
`.trim();

const TAGS = [
  'stablecoin',
  'cryptocurrency',
  'money',
  'finance',
  'usdc',
  'usdt',
  'remittances',
  'fintech',
  'digital-dollar',
].slice(0, 9);

async function gum(method, path, params = {}) {
  const usp = new URLSearchParams({ access_token: TOKEN, ...params });
  let url = `https://api.gumroad.com/v2${path}`;
  let body = null;
  let headers = {};
  if (method === 'GET') url += '?' + usp.toString();
  else { body = usp.toString(); headers['content-type'] = 'application/x-www-form-urlencoded'; }
  const r = await fetch(url, { method, headers, body });
  if (!r.ok) throw new Error(`Gumroad ${method} ${path} → ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main() {
  console.log(`→ creating Gumroad product "${NAME}"`);
  // Check if a product with this permalink already exists (idempotent)
  const list = await gum('GET', '/products');
  const existing = (list.products || []).find((p) => p.custom_permalink === PERMALINK || /your-money-is-broken/.test(p.name));
  if (existing) {
    console.log(`  already exists: ${existing.id}  ${existing.short_url}`);
    return existing;
  }

  const r = await gum('POST', '/products', {
    name: NAME,
    description: DESCRIPTION_HTML,
    price: String(PRICE_CENTS),
    tags: TAGS.join(','),
    custom_permalink: PERMALINK,
  });
  const product = r.product;
  console.log(`  ✓ created  id=${product.id}`);
  console.log(`  short_url:  ${product.short_url}`);
  console.log(`  edit_url:   https://app.gumroad.com/products/${PERMALINK}/edit`);

  // Append to .gumroad-listings.jsonl so upload bot can pick it up
  const pubLog = join(process.env.HOME, 'agfarms', 'longtail', 'runs', '.gumroad-listings.jsonl');
  const row = {
    ts: new Date().toISOString(),
    draft_id: 'your-money-is-broken-book',
    product_id: product.id,
    short_url: product.short_url,
    edit_url: `https://app.gumroad.com/products/${PERMALINK}/edit`,
    bundle_path: join(REPO, 'public', 'your-money-is-broken.pdf'),
    cover_path: join(REPO, 'public', 'cover', 'front-hd.png'),
    price_usd: PRICE_CENTS / 100,
    title: NAME,
    needs_manual_upload: true,
    product_type: 'book',
  };
  await appendFile(pubLog, JSON.stringify(row) + '\n');
  console.log(`  ✓ appended row to ${pubLog}`);
  console.log(`\nNext: cd ~/agfarms/longtail && node scripts/gumroad-upload.mjs --product ${product.id}`);
  return product;
}

main().catch((e) => { console.error(e); process.exit(1); });
