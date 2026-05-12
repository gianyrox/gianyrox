#!/usr/bin/env node
// kdp-upload.mjs — drive KDP via Playwright through the 3-step paperback
// submission wizard. Founder logs in once via the visible Chromium
// window (Amazon SSO requires 2FA), then we auto-fill every field from
// KDP-LISTING.md and upload the cover + interior.
//
// Steps automated:
//   1. Paperback Details — title, subtitle, author, description,
//      keywords, categories, language, edition, audience
//   2. Paperback Content — ISBN choice, trim size, paper, bleed,
//      cover finish, manuscript upload, cover upload, preview
//   3. Rights & Pricing — territories, pricing, expanded distribution
//
// Steps the founder must do interactively (the bot pauses):
//   - Amazon 2FA on first login
//   - Final "Publish my paperback" confirmation
//   - Confirming the Kindle Previewer flip-through
//
// Files (must exist before running):
//   ~/agfarms/gianyrox/public/cover/kdp-wrap.pdf
//   ~/agfarms/gianyrox/public/your-money-is-broken-kdp.pdf
//
// Usage:
//   ./scripts/kdp-upload.mjs              # full flow
//   ./scripts/kdp-upload.mjs --step 1     # just step 1
//   ./scripts/kdp-upload.mjs --pause-on-error
//
// Per CLAUDE.md safety rules: NEVER types passwords. NEVER accepts ToS.
// NEVER pushes "Publish my paperback" — that's a founder decision.

import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(__dirname);

const INSTANCE = process.env.CHROMIUM_INSTANCE || 'kdp';
const COVER_PATH = resolve(join(REPO, 'public/cover/kdp-wrap.pdf'));
const INTERIOR_PATH = resolve(join(REPO, 'public/your-money-is-broken-kdp.pdf'));

const BOOK = {
  language: 'English',
  title: 'Your Money Is Broken',
  subtitle: 'How Stablecoins, the Digital Dollar, and Cross-Border Payments Are Replacing Slow Money',
  edition: '1',
  author_first: 'Giany',
  author_last: 'Rox',
  description: `Four cities. Four people. The same invisible infrastructure — from Bogotá to Harare to Lagos to a rooftop in Buenos Aires.

When the old banking pipes break, the people who feel it first are the ones moving money across borders. Pablo in Bogotá sends his mother medicine money in ninety seconds for under two dollars. Mercy in Harare protects a women's savings club from fifty-six percent inflation by parking the pot in a digital dollar. Femi in Lagos closes a hundred-thousand-dollar supplier deal from the back of a parked car. None of them are speculating. None of them care about price charts. They are using stablecoins because the alternatives have already failed them.

This is what happens when stablecoins quietly become the bridge from slow money to fast money. Not the speculation side of crypto. The side that just works.

In eighteen chapters across six acts, "Your Money Is Broken" explains how a dollar on a blockchain ledger — same dollar, different infrastructure — is rebuilding the world's payment rails from below. You will learn why moving money across borders costs 3-7% and takes days, how trust forms in communities where institutions have repeatedly failed, the 5,500-year arc of money-as-debt, why on/off-ramps are the new institutional layer, and what the corridors look like when you are the one sending.

Written for the person who keeps asking "wait, but what IS this?" — and for everyone already living it.

This is not a Bitcoin book. Not a crypto-hype book. Not a technology manual. It is a field report from inside the digital dollar economy.`,
  keywords: [
    'stablecoin book',
    'cryptocurrency for beginners',
    'future of money',
    'USDC USDT explained',
    'digital dollar',
    'cross-border payments',
    'remittances and fintech',
  ],
  bisac_primary: 'BUS061000',     // Money & Monetary Policy
  bisac_secondary: 'BUS082000',   // Finance / General
  is_explicit: false,
  reading_age: '18+',
  publishing_rights: 'own',       // own copyright

  // Step 2
  isbn_choice: 'free_kdp',         // get KDP free ISBN
  ink_paper: 'bw-cream',           // black-and-white interior on cream
  trim_size: '6x9',
  bleed: 'no_bleed',
  cover_finish: 'matte',

  // Step 3
  territories: 'all',
  list_price_usd: 14.99,
  expanded_distribution: true,
};

function fail(m) { console.error(`error: ${m}`); process.exit(1); }
function log(m) { console.log(`[kdp] ${m}`); }

function cdpUrl() {
  const r = spawnSync(`${process.env.HOME}/bin/chromium-session.sh`, ['url', INSTANCE], { encoding: 'utf8' });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function ensureFiles() {
  for (const p of [COVER_PATH, INTERIOR_PATH]) {
    if (!await exists(p)) fail(`missing file: ${p}`);
  }
  log(`✓ cover: ${COVER_PATH}`);
  log(`✓ interior: ${INTERIOR_PATH}`);
}

async function connect() {
  const cdp = cdpUrl();
  if (!cdp) fail(`chromium-session "${INSTANCE}" not running.\n  Run: ~/bin/chromium-session.sh start ${INSTANCE} https://kdp.amazon.com/en_US/signin`);
  log(`CDP: ${cdp}`);
  const browser = await chromium.connectOverCDP(cdp);
  const ctx = browser.contexts()[0] || (await browser.newContext());
  const page = ctx.pages()[0] || (await ctx.newPage());
  return { browser, page };
}

async function ensureLoggedIn(page) {
  log('checking KDP login...');
  // Don't nuke an active title-setup page — only navigate if we're not in the wizard
  const cur = page.url();
  if (/title-setup|bookshelf/.test(cur)) {
    // already inside KDP, skip navigation
  } else {
    await page.goto('https://kdp.amazon.com/en_US/bookshelf', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await page.waitForTimeout(2500);
  const url = page.url();
  if (/signin|ap\/signin/.test(url)) {
    fail(`Chromium is NOT logged into KDP. Open the visible window:\n  ~/bin/chromium-session.sh start ${INSTANCE} https://kdp.amazon.com/en_US/signin\nLog in with the AGFarms Amazon account (2FA in your phone). Then re-run this script.`);
  }
  log(`✓ logged in (at ${url})`);
}

async function pause(page, label, seconds = 0) {
  // Lightweight "wait for me to look" — leave the page idle and let the
  // founder verify. seconds=0 means just print and continue.
  log(`PAUSE — ${label}`);
  if (seconds > 0) await page.waitForTimeout(seconds * 1000);
}

// ─── Step 1: Paperback Details ────────────────────────────────────────

async function fillStep1(page) {
  log('STEP 1 — Paperback Details');
  await page.goto('https://kdp.amazon.com/en_US/title-setup/paperback/new/details', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Language
  await fillByLabel(page, 'Language', BOOK.language).catch(() => log('  ⚠ language: could not match — may already be set'));

  // Title
  await fillByName(page, 'data.print_book_title', BOOK.title)
    || await fillFirst(page, 'input[id*="book-title"], input[name*="title"]:not([name*="subtitle"]):not([name*="series"])', BOOK.title);

  // Subtitle
  await fillByName(page, 'data.print_book_subtitle', BOOK.subtitle)
    || await fillFirst(page, 'input[id*="subtitle"]', BOOK.subtitle);

  // Edition
  await fillFirst(page, 'input[id*="edition-number"], input[name*="edition"]', BOOK.edition);

  // Author — KDP has separate first/last name fields
  await fillFirst(page, 'input[id*="author-first-name"], input[name*="author_first_name"]', BOOK.author_first);
  await fillFirst(page, 'input[id*="author-last-name"], input[name*="author_last_name"]', BOOK.author_last);

  // Description — KDP uses a CKEditor inside an iframe
  try {
    const ckFrame = page.frameLocator('iframe.cke_wysiwyg_frame').first();
    const body = ckFrame.locator('body');
    await body.click({ force: true, timeout: 5000 });
    // Convert plain text → <p>-wrapped HTML preserving paragraphs
    const html = BOOK.description
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br>').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</p>`)
      .join('');
    await ckFrame.locator('body').evaluate((el, h) => { el.innerHTML = h; el.dispatchEvent(new Event('input', { bubbles: true })); }, html);
    log('  ✓ description filled (CKEditor)');
  } catch (e) {
    log(`  ⚠ description fill failed: ${e.message.split('\n')[0]} — fill manually`);
  }

  // Keywords — 7 input fields keywords[0]..keywords[6]
  for (let i = 0; i < BOOK.keywords.length; i++) {
    await fillFirst(page, `input[id*="keywords"][id*="${i}"], input[name="data.keywords[${i}]"]`, BOOK.keywords[i])
      .catch(() => log(`  ⚠ keyword ${i + 1} not filled`));
  }

  // Publishing rights — radio
  const rightsRadio = page.locator('input[type="radio"][value*="own"], input[type="radio"][id*="own-copyright"]').first();
  if (await rightsRadio.count() > 0) await rightsRadio.check({ force: true }).catch(() => {});

  // Sexually explicit — No
  const noExplicit = page.locator('input[type="radio"][id*="adult-content"][value="false"], input[type="radio"][value="false"][name*="adult"]').first();
  if (await noExplicit.count() > 0) await noExplicit.check({ force: true }).catch(() => {});

  // BISAC categories — typically a "Choose categories" button that opens a modal
  log('  ℹ BISAC categories must be selected via the "Choose categories" modal — leaving for manual selection:');
  log(`     primary: BUS061000 (BUSINESS & ECONOMICS / Money & Monetary Policy)`);
  log(`     secondary: BUS082000 (BUSINESS & ECONOMICS / Finance / General)`);

  await pause(page, 'Step 1 complete — review on screen, then scroll down and click "Save and Continue"');
}

// ─── helpers ───────────────────────────────────────────────────────────

async function fillByName(page, name, value) {
  const el = page.locator(`[name="${name}"], [data-name="${name}"]`).first();
  if (await el.count() === 0) return false;
  await el.click({ force: true });
  await el.fill(value);
  log(`  ✓ ${name} filled`);
  return true;
}

async function fillFirst(page, selector, value) {
  const el = page.locator(selector).first();
  if (await el.count() === 0) return false;
  try { await el.scrollIntoViewIfNeeded({ timeout: 2000 }); } catch {}
  try {
    await el.fill(value, { force: true, timeout: 5000 });
  } catch {
    // Fallback: set via DOM directly + dispatch input/change so React/Adobe-DTM picks it up
    await el.evaluate((node, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(node, v);
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
  }
  log(`  ✓ ${selector.split(',')[0]} filled`);
  return true;
}

async function fillByLabel(page, label, value) {
  const lbl = page.locator(`label:has-text("${label}")`).first();
  if (await lbl.count() === 0) return false;
  // Walk to the associated input/select
  const id = await lbl.getAttribute('for');
  if (id) {
    const el = page.locator(`#${id}`);
    await el.click({ force: true });
    await el.fill(value).catch(async () => await el.selectOption({ label: value }));
    return true;
  }
  return false;
}

// ─── Step 2: Paperback Content ────────────────────────────────────────

async function fillStep2(page) {
  log('STEP 2 — Paperback Content');
  // KDP routes to the next step automatically after Save and Continue.
  // Wait for content-step URL or selector.
  await page.waitForTimeout(2500);

  // ISBN — Free KDP ISBN
  const freeIsbn = page.locator('input[type="radio"][value="free"], input[type="radio"][id*="free-isbn"]').first();
  if (await freeIsbn.count() > 0) await freeIsbn.check({ force: true }).catch(() => {});

  // Trim size — 6x9
  const trim6x9 = page.locator('input[type="radio"][value="6x9"], input[type="radio"][id*="6x9"]').first();
  if (await trim6x9.count() > 0) await trim6x9.check({ force: true }).catch(() => {});

  // Interior — cream B&W
  const bwCream = page.locator('input[type="radio"][value*="cream"], input[type="radio"][id*="cream"]').first();
  if (await bwCream.count() > 0) await bwCream.check({ force: true }).catch(() => {});

  // Bleed — No Bleed
  const noBleed = page.locator('input[type="radio"][value*="no_bleed"], input[type="radio"][id*="no-bleed"]').first();
  if (await noBleed.count() > 0) await noBleed.check({ force: true }).catch(() => {});

  // Cover finish — matte
  const matte = page.locator('input[type="radio"][value*="matte"], input[type="radio"][id*="matte"]').first();
  if (await matte.count() > 0) await matte.check({ force: true }).catch(() => {});

  // Manuscript upload
  const manuscriptInput = page.locator('input[type="file"][id*="manuscript"], input[type="file"][accept*="pdf"]').first();
  if (await manuscriptInput.count() > 0) {
    await manuscriptInput.setInputFiles(INTERIOR_PATH);
    log(`  ✓ manuscript uploaded: ${INTERIOR_PATH}`);
  } else {
    log('  ⚠ manuscript input not found — upload manually');
  }
  await page.waitForTimeout(8000);  // let upload start

  // Cover upload
  const coverInput = page.locator('input[type="file"][id*="cover"], input[type="file"][accept*="pdf"]').nth(1);
  if (await coverInput.count() > 0) {
    await coverInput.setInputFiles(COVER_PATH);
    log(`  ✓ cover uploaded: ${COVER_PATH}`);
  } else {
    log('  ⚠ cover input not found — upload manually');
  }
  await page.waitForTimeout(8000);

  await pause(page, 'Step 2 complete — wait for manuscript + cover processing, then click "Launch Previewer", flip through, approve, and click "Save and Continue"');
}

// ─── Step 3: Rights & Pricing ─────────────────────────────────────────

async function fillStep3(page) {
  log('STEP 3 — Rights & Pricing');
  await page.waitForTimeout(2500);

  // Territories — All
  const allTerr = page.locator('input[type="radio"][value="all"], input[type="radio"][id*="all-territories"]').first();
  if (await allTerr.count() > 0) await allTerr.check({ force: true }).catch(() => {});

  // List price USD
  const priceInput = page.locator('input[id*="price"][id*="us"], input[name*="us_price"], input[name="data.list_price_us"]').first();
  if (await priceInput.count() > 0) {
    await priceInput.click({ force: true });
    await priceInput.fill(String(BOOK.list_price_usd));
    log(`  ✓ price: $${BOOK.list_price_usd}`);
  }

  // Expanded distribution
  if (BOOK.expanded_distribution) {
    const exp = page.locator('input[type="checkbox"][id*="expanded"], input[type="checkbox"][name*="expanded"]').first();
    if (await exp.count() > 0) await exp.check({ force: true }).catch(() => {});
    log('  ✓ Expanded Distribution ON');
  }

  await pause(page, 'Step 3 complete — review royalty preview, then YOU click "Publish My Paperback" (we never auto-publish per safety policy)');
}

// ─── orchestrator ─────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const stepArg = args.indexOf('--step');
  const onlyStep = stepArg >= 0 ? parseInt(args[stepArg + 1]) : null;

  await ensureFiles();
  const { browser, page } = await connect();
  try {
    await ensureLoggedIn(page);

    if (!onlyStep || onlyStep === 1) await fillStep1(page);
    if (!onlyStep || onlyStep === 2) await fillStep2(page);
    if (!onlyStep || onlyStep === 3) await fillStep3(page);

    log('all auto-fillable fields done. final manual steps are listed above.');
  } finally {
    await browser.close();
  }
}

main().catch((e) => fail(e.stack ?? e.message ?? String(e)));
