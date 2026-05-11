# gianyrox.com — next goal plan

**Captured 2026-05-11 from founder brain dump.**

> "i own gianyrox.com https://gianyrox.com shops gumroad etsy longtail on
> gianyrox, you can put the stablecoin current version. at least prep it
> with me focussed effort a book there and in all the shops we have. i
> should have gianyrxo cloned but gianyrox is a simple website all you
> need to do is add the book and shops, that is our next goal. and you
> can add buttons to it, like download pdf of the page."

## What gianyrox.com is today

Single static HTML (Vercel, deploys from `main` of `gianyrox/gianyrox`),
a Linktree-style page with sections:
- Profiles · GitHub, X, Medium, LinkedIn
- Companies · Bucket Foundation, AGFarms Developers
- Projects · derby.fish, gauss.news, taskl.app
- Highlighted Articles · 5 Medium pieces
- **Books · "Coming Soon..."** ← what to fill

## What to add

### 1. Books section — feature *Your Money Is Broken* (the stablecoin book)
- Source lives at `~/agfarms/papers/` — 18 markdown chapters, `build.py`
  generates a styled `index.html` (294 KB) reader, no PDF yet.
- Need:
  - [ ] Subfolder `gianyrox/book/` with the rendered HTML + assets
  - [ ] PDF export of the same content (weasyprint or wkhtmltopdf)
  - [ ] Card on gianyrox.com home that links to "Read online" + "Download PDF"
  - [ ] A `build-book.sh` that pulls latest from `~/agfarms/papers/` and
    bakes into the site every push
  - [ ] Pricing: free read on gianyrox.com, paid downloadable PDF on
    Gumroad + Etsy

### 2. Shops section — add Gumroad / Etsy / Longtail
Replace the implicit "Companies" line with a real **Shops** section:
- **AGFarms Etsy** — https://www.etsy.com/shop/agfarms (16 active listings, generative wall art)
- **AGFarms Gumroad** — https://agfarms.gumroad.com (7 products, $8 prints)
- **Longtail Shop** — https://longtail.agfarms.dev/shop (28 Shorts + 12 prints + tutoring)

Each gets a small card with cover image + count of items + outbound link.

### 3. Stablecoin section
The founder said "you can put the stablecoin current version". Interpretation:
the BOOK is the current stablecoin work product. Same content surfaces
under Books — no separate stablecoin section needed unless an actual
on-chain project exists (none found yet).

### 4. "Download PDF of this page" button
Generate a PDF of the gianyrox.com home itself — a printable Linktree.
Simplest implementation: `window.print()` button styled to look native,
plus a `print.css` that hides nav and renders cleanly. For richer output,
use a server-side `gianyrox-pdf.yml` GitHub Action that runs Playwright
to produce a static `public/gianyrox.pdf`.

## Architecture decision

Keep the site dead-simple — no React, no framework. Just upgrade the
existing `index.html`:
- Move common styles into `style.css`
- Pull section data from a `data.json` so adds are 1 line
- New folders: `book/` (the rendered book) + `public/` (PDFs + images)
- `build.sh` to rebuild + commit

## Implementation order (this session)

1. ~~Clone gianyrox locally~~ ✅
2. Refactor `index.html` → modular sections with shop + book cards
3. Run `~/agfarms/papers/build.py` → copy output to `book/`
4. Generate `public/your-money-is-broken.pdf` from book HTML
5. Add "Download this page as PDF" button (`window.print()` + print.css)
6. Add `build-book.sh` that re-pulls book on each run
7. Commit + push (Vercel auto-deploys)
