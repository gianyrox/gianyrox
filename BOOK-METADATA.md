# Your Money Is Broken — Canonical Book Metadata

**Single source of truth.** Any file that references this book should match these values exactly. If something looks out of date in a doc, check here first.

Version: **v1.0.0** — first edition, paperback submitted to KDP 2026-05-12.

---

## Identifiers

| Field | Value |
|---|---|
| Title | `Your Money Is Broken` |
| Subtitle | `How Stablecoins, the Digital Dollar, and Cross-Border Payments Are Replacing Slow Money` |
| Author | `Giany Rox` |
| Publisher | `AGFarms` (independently published via KDP) |
| Edition | 1 |
| Publication date | 2026-05-12 |
| ISBN-13 | `979-8-1966798-3-4` (compact: `9798196679834`) |
| Paperback ASIN | TBD (KDP assigns within 24-72h of approval) |
| Kindle ASIN | TBD (Kindle draft saved, publishes after paperback approval) |
| Language | English (en-US) |
| Page count | 168 (Kindle: 168 KENP normalized) |
| Word count | ~50,000 |
| Trim size | 6 × 9 in (paperback) |
| Paper | Black & white interior, **cream** paper |
| Cover finish | Matte |
| Bleed | No bleed |
| Cover spine width | 0.42" (168 pp × 0.0025"/page for cream) |

## Pricing

**Paperback (live across 14 marketplaces):**

| Market | Price | Royalty/copy | Notes |
|---|---|---|---|
| 🇺🇸 US | $13.99 | $5.38 (60%) | + Expanded Distribution $2.58 (40%) |
| 🇬🇧 UK | £10.99 | £4.06 | + ED £1.87 |
| 🇨🇦 CA | $18.99 | $7.45 | no ED |
| 🇦🇺 AU | $19.99 | $5.88 | no ED |
| 🇯🇵 JP | ¥1899 | ¥597 | no ED |
| 🇪🇺 EU (×7) | €12.99 | €5.03 | no ED |
| 🇵🇱 PL | PLN 50.35 | zł17.29 | no ED |
| 🇸🇪 SE | SEK 129.02 | kr46.53 | no ED |

**Kindle eBook (draft, publishes after paperback approval):**

| Market | Price | Royalty/copy |
|---|---|---|
| US | $7.99 | $5.38 (70%) |
| UK | £5.87 | £4.06 (70%) |
| CA | $9.49 | (70%) |
| AU | $9.99 | (70%) |
| JP | ¥1199 | (70%) |
| EU | €6.78 | €4.41-4.54 (70%) |
| BR | R$19.99 | (70%) |
| MX | $137.38 MXN | (70%) |
| IN | ₹449 | (70%) |

KDP Select: **enrolled** (90-day Amazon-exclusive → KU page-reads + 5 free promo days)
DRM: **No**
Worldwide rights: **yes**

## Description (KDP listing — 4,000 char max)

```
Four cities. Four people. The same invisible infrastructure — from Bogotá to Harare to Lagos to a rooftop in Buenos Aires.

When the old banking pipes break, the people who feel it first are the ones moving money across borders. Pablo in Bogotá sends his mother medicine money in ninety seconds for under two dollars. Mercy in Harare protects a women's savings club from fifty-six percent inflation by parking the pot in a digital dollar. Femi in Lagos closes a hundred-thousand-dollar supplier deal from the back of a parked car. None of them are speculating. None of them care about price charts. They are using stablecoins because the alternatives have already failed them.

This is what happens when stablecoins quietly become the bridge from slow money to fast money. Not the speculation side of crypto. The side that just works.

In eighteen chapters across six acts, "Your Money Is Broken" explains how a dollar on a blockchain ledger — same dollar, different infrastructure — is rebuilding the world's payment rails from below. You will learn why moving money across borders costs 3-7% and takes days, how trust forms in communities where institutions have repeatedly failed, the 5,500-year arc of money-as-debt, why on/off-ramps are the new institutional layer, and what the corridors look like when you are the one sending.

Written for the person who keeps asking "wait, but what IS this?" — and for everyone already living it.

This is not a Bitcoin book. Not a crypto-hype book. Not a technology manual. It is a field report from inside the digital dollar economy.
```

## Keywords (7, optimized for 2026 Rufus + A10 algo)

1. `what is a stablecoin and how does it work`
2. `cryptocurrency for beginners`
3. `future of money`
4. `GENIUS Act stablecoin regulation 2026`
5. `digital dollar`
6. `cross-border payments`
7. `money for the unbanked emerging markets`

## BISAC Categories / Placements

**Paperback** (3 placements, all in Business & Money → Economics):
1. Money & Monetary Policy
2. Banks & Banking
3. Economic Policy & Development

**Kindle** (2 placements, Business & Money → Economics):
1. Money & Monetary Policy
2. Economic Policy & Development

## AI Disclosure (KDP requirement)

| Element | Used AI? | Tools |
|---|---|---|
| Text | Entire work, with extensive editing | ChatGPT, Claude |
| Images | One or a few AI-generated images, with extensive editing (cover) | GPT-Image-1 (DALL-E 3) |
| Translations | None | — |

## Public URLs

- **Amazon paperback (LIVE 2026-05-14):** `https://www.amazon.com/dp/B0H1T2DDG3`
  - ASIN: `B0H1T2DDG3`
  - ISBN-13: `9798196679834` (also resolves at `https://www.amazon.com/dp/9798196679834` → redirects to ASIN)
- Amazon Kindle: TBD (Kindle still in Draft on KDP bookshelf — pending publish click)
- gianyrox.com book page: `https://www.gianyrox.com/book/your-money-is-broken/`
- Free PDF (web edition): `https://www.gianyrox.com/public/your-money-is-broken.pdf`
- KDP interior PDF (for reference): `~/agfarms/gianyrox/public/your-money-is-broken-kdp.pdf`
- Cover wrap (for KDP): `~/agfarms/gianyrox/public/cover/kdp-wrap.pdf`
- EPUB (Kindle source): `~/agfarms/gianyrox/public/your-money-is-broken.epub`

## Build commands (reproducible)

```bash
# Interior PDF (KDP 6×9 paperback)
python3 scripts/build-book-pdf.py --trim 6x9 --out public/your-money-is-broken-kdp.pdf

# Interior PDF (web edition — A4 with cover image)
python3 scripts/build-book-pdf.py --trim web --out public/your-money-is-broken.pdf

# Cover wrap (KDP paperback — front + spine + back)
python3 scripts/build-back-cover.py && python3 scripts/build-kdp-wrap.py

# Kindle EPUB
./scripts/build-kindle-epub.sh
```

## Launch sequencing

See `LAUNCH-CONTENT.md` (Medium, Substack, Twitter, LinkedIn, press release, elevator pitch) and `LAUNCH-OUTREACH.md` (20 podcasts, 20 newsletters, 15 subreddits, author setup checklist, 14-day plan).

## Changelog

- **v1.0.0** (2026-05-12): First edition. Paperback submitted to KDP review (ISBN 9798196679834). Kindle draft saved at $7.99 / 70% / KDP Select / worldwide. gianyrox.com deployed with Schema.org Book + Person JSON-LD, dedicated `/book/your-money-is-broken/` landing page, sitemap.xml.
