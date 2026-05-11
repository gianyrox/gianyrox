# *Your Money Is Broken* — distribution roadmap

Tracks where the book gets published, in what format, what's done vs.
what's blocking. Founder asked 2026-05-11:

> "is the stablecoin book up on shop? do we need to do amazon kdp
> hardcover whats the final stretch for getting the book up? and where
> can we post chapters as blog posts"

## Current state — is it "up on shop"?

| Channel | Status | URL |
|---|---|---|
| **gianyrox.com (free read)** | ✅ live | https://www.gianyrox.com/book |
| **gianyrox.com (free PDF download)** | ✅ live | https://www.gianyrox.com/public/your-money-is-broken.pdf |
| **AGFarms Gumroad** | ❌ NOT yet — the home button links to the shop, no product | needs `gumroad-sync.mjs --create-missing` for the book |
| **AGFarms Etsy** | ❌ Etsy disallows direct PDF book sales above a small threshold; allowed as small printable; KDP route is cleaner | n/a |
| **Longtail shop** | ❌ not yet | adds as a `book/` content type alongside wall-art |
| **Amazon KDP (paperback)** | ❌ not yet | 1-day if we have a cover |
| **Amazon KDP (hardcover)** | ❌ not yet | KDP supports hardcover since 2021; same upload flow, slightly different print spec |
| **Amazon KDP (Kindle ebook)** | ❌ not yet | exports straight from same source |
| **Apple Books** | ❌ not yet | optional |
| **Lulu (true hardcover with dust jacket)** | optional | premium tier if KDP hardcover quality is too thin |

## Final stretch for Amazon KDP — the actual checklist

Time estimate if all assets are ready: **1 working day, maybe two split-mornings**.

### A. Manuscript

- [x] Markdown source at `~/agfarms/papers/book/` (18 chapters)
- [x] Static PDF generator at `~/agfarms/gianyrox/scripts/build-book-pdf.py`
- [ ] **KDP-spec PDF** — needs adjustments from the current web-PDF:
  - Trim size: **6×9 inches** (paperback standard) OR **6.14×9.21** (hardcover standard).
    KDP supports up to 8.5×11 but 6×9 is the genre norm.
  - **Margins:** 0.75" outside, 0.875" inside (gutter for binding), 0.75" top/bottom.
    For hardcover the gutter is 0.91" — Bleed if any image touches edge.
  - **Bleed:** add 0.125" bleed only if illustrations or shaded backgrounds hit the page edge.
  - **Fonts embedded** in PDF (weasyprint already does this).
  - **Front matter:** title page · copyright page (ISBN, publisher, year) · dedication · TOC.
  - **Back matter:** notes/footnotes · bibliography · about the author · also-by.
- [ ] **Page count:** current 481KB web PDF → estimate ~180-220 pages at 6×9 with the
  CSS we wrote. KDP minimum is 24, max is 828 (paperback) or 550 (hardcover).
- [ ] **No reserved page numbers in body** — KDP auto-numbers.
- [ ] Run through `kdp-quality-check` (Kindle Previewer 3 desktop app) → confirms layout.

### B. Cover

- [ ] **Front cover image** — 1600×2400 px minimum, 300 DPI. Need this designed.
  Could use the same generative aesthetic as the wall-art prints (one flow-field
  composition in cream/charcoal would fit the book's tone).
- [ ] **Spine + back cover** — KDP cover calculator (free, online) tells you the
  exact spine width based on page count. Need a wrap-around design.
- [ ] **ISBN barcode** on back cover — KDP can provide a free ISBN OR you bring
  your own (Bowker, $125 in US). Free KDP ISBN is fine for first edition.
- [ ] **Back-cover blurb** — ~150 words, plus 2-3 endorsement quotes if available.

### C. KDP listing fields

- [ ] Title + subtitle
- [ ] Author name (Gianangelo Dichio or Gian Dichio — choose canonical form)
- [ ] Series name (if part of a series)
- [ ] Description — markdown allowed; first 200 chars matter for Amazon SERP
- [ ] **2 KDP categories** — economics/cryptocurrency · economics/money
- [ ] **7 keywords** — "stablecoin book", "future of money", "USDC USDT", "remittances",
  "cross-border payments", "digital dollars", "cryptocurrency for beginners"
- [ ] Author bio
- [ ] Print price — paperback typically $14.99-$19.99 for this length; hardcover $24.99-$29.99
- [ ] Royalty: 60% Expanded Distribution (paperback), 60% (hardcover). $50K threshold
  for the higher 70% Kindle royalty doesn't apply to print.
- [ ] **Expanded Distribution: ON** for paperback (gets into bookstores' wholesale
  pipeline). OFF for hardcover (Amazon-only).

### D. Order of operations (the actual 1-day plan)

1. **Morning** — finalize cover design (commission or generate via Flux/DALL-E + a
   real graphic designer's polish pass; ~$50-$200 on Fiverr if outsourced)
2. **Midday** — regen the manuscript PDF at 6×9 with proper front matter
   (modify `scripts/build-book-pdf.py` to accept `--trim 6x9` and add a title page)
3. **Afternoon** — upload to KDP, fill listing fields, preview in Kindle Previewer 3,
   order a proof copy ($4-$8 + shipping)
4. **+5 days** — proof arrives. Eyeball for typos/layout issues, fix, re-upload.
5. **+1 day after proof approval** — book goes live on Amazon. KDP says ~72 hours
   but most appear within 12.

### E. Hardcover-specific notes

- KDP hardcover launched mid-2021. Same upload flow as paperback.
- **Hardcover-only constraints:** 100-page minimum, no Expanded Distribution.
- Cover uses a different template (wraps around the boards with a 0.625" wrap area).
- KDP hardcovers are **case bound, no dust jacket**. If you want dust jacket, use Lulu.
- Production cost is 4-5x paperback; price accordingly.

## Where to post chapters as blog posts

Ranked by signal/effort ratio for *this* book (technical-finance-narrative crossover):

### Tier 1 — high leverage, do all 3

1. **Medium** — founder already at `@Gianyrox`. The audience overlaps directly with
   the book's reader (semi-technical, curious about money). Publish in **Coinmonks**
   (top crypto publication, 100K+ subscribers, accepts good submissions) or **The
   Capital** for instant audience. Pace: 1 chapter/week, ending each with a "next
   chapter" link and a "buy the full book on Gumroad" CTA.

2. **Substack — start `gianyrox.substack.com`** — direct email list ownership.
   Re-post Medium articles with 2-day lag. Each post gets ~20% conversion to the
   book funnel vs. Medium's ~3% (you own the reader's email).

3. **gianyrox.com — own blog at `/blog/<slug>`** — refactor `index.html` to support
   a third content type alongside `book/` and `public/`. Posts indexed by Google
   under your own domain (Gumroad DR ~89 but YOUR domain is what compounds
   long-term). Mirror posts to Medium/Substack with canonical link back here.

### Tier 2 — domain-specific reach

4. **Mirror.xyz** — web3-native blog platform with crypto wallet auth. The book's
   topic (stablecoins) lives natively in this audience. Chapters become NFT-mintable
   essays; collectors get a free pre-print of the full book. Some Mirror writers
   make $5k-$50k per post via collector splits.

5. **Paragraph.xyz** — similar to Mirror but with newsletter mechanics built in.
   Often used for serialized fiction; would work for the book's vignette structure.

6. **Hashnode** — devs read this. Less commercial than Medium; better for the
   "what is a blockchain ledger" chapter (3a). One foot in the dev audience.

7. **dev.to** — same audience as Hashnode but with a stronger crypto/web3 sub-niche.

### Tier 3 — long-form

8. **LinkedIn articles** — surprisingly high reach for finance topics. The
   "stablecoin remittance economy" chapter would do well here with the right hook.
   Audience: institutional / fintech / banking professionals.

9. **Twitter/X long-form threads** — each chapter becomes a 25-tweet thread.
   Convert highlight quotes to thread cards. Foundation for everything else;
   threads drive Substack subscribers drive book sales.

10. **YouTube essays** — record yourself reading the chapter over generative-art
    b-roll (we already have the gen-art + Kokoro voice pipeline). 20-min videos
    with the same CTA at the end.

### Tier 4 — niche but quality

11. **Bankless.community** / **Bankless newsletter guest post** — direct stablecoin
    audience; would need a contact to pitch.

12. **CoinDesk Opinion** — high-prestige, low-frequency; one well-placed op-ed
    promoting the book is worth more than 10 Medium posts.

13. **Decrypt** — accepts submissions. Less prestige than CoinDesk, more reach.

14. **arxiv.org / SSRN** — if any chapter has academic-grade economic analysis,
    drop a pre-print as supporting material.

## Recommended 30-day blog calendar

Week 1: Tease + ship prologue + ch1 to Medium + own blog + Substack.
Week 2: Ch 2 + ch 3a (the ledger explainer — strongest standalone piece).
Week 3: Ch 3b + 3c. Pitch one chapter as Bankless / CoinDesk guest post.
Week 4: Mirror.xyz mint of ch 1 as collectible essay. Continue Medium drip.

Each chapter post ends with: **"Read the full book free at gianyrox.com/book.
Get the PDF on Gumroad for $9 (paperback coming Q3 2026)."**

## Final stretch summary

Three sequential bottlenecks to close, total ~5-8 days of work spread across 2
weeks:

1. **Cover design** (1-2 days, mostly waiting on a designer or one polish pass on
   a Flux render)
2. **Manuscript at 6×9 with front/back matter** (½ day in `build-book-pdf.py`)
3. **KDP upload + proof + approval** (1 day active, 5-7 days waiting on proof)

While waiting on KDP physical, start the blog calendar immediately —
chapters posted **before** KDP launch build the audience that buys the
book the day it goes live.
