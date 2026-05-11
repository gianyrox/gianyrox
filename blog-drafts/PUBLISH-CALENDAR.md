# 30-day blog publish calendar — *Your Money Is Broken*

Each post mirrored to **3 channels** with the same content:
1. **Medium** (primary — `@gianyrox`, target publication Coinmonks or The Capital)
2. **gianyrox.com/blog/<slug>** (own canonical)
3. **Substack** (new — `gianyrox.substack.com`)

Two days after Medium post, push the same content to Substack for email
subscribers. The own-blog post on gianyrox.com publishes simultaneously
with Medium and uses `<link rel="canonical">` to claim it as the home.

Each post ends with the same CTA block:
- 📖 Read free at gianyrox.com/book
- 💾 Get PDF for $9 on agfarms.gumroad.com/l/your-money-is-broken
- 🐦 Follow @gianyrox

## Week 1 — launch

| Day | Channel | Title | Source | Status |
|---|---|---|---|---|
| Mon | Medium | "I Wrote a Book About Stablecoins for My Dad" | prologue.md | ✅ DRAFT at `medium-week1-prologue.md` |
| Mon | gianyrox.com/blog/i-wrote-a-book-about-stablecoins | same | | TODO scaffold blog system |
| Wed | Substack | same (2-day lag) | | TODO setup gianyrox.substack.com |
| Fri | Medium | "A Stablecoin Utopia — Four Cities, Four People" | ch1.md | TODO |
| Fri | X long-form | 25-tweet thread of ch1 hooks | ch1.md | TODO |

## Week 2 — the ledger explainer

| Day | Channel | Title | Source |
|---|---|---|---|
| Mon | Medium | "Chapter 2: How We Got Here" | ch2.md |
| Wed | Mirror.xyz | "The Bridge — Part A (mintable)" | ch3a.md |
| Fri | Medium | "The Bridge — Part B" | ch3b.md |

## Week 3 — corridor pieces

| Day | Channel | Title | Source |
|---|---|---|---|
| Mon | Medium | "Chapter 3 Part C — Velocity" | ch3c.md |
| Wed | LinkedIn Article | "The On-Ramp as the New Institution" (excerpt) | ch3a.md |
| Fri | Medium | "Chapter 4 Part A — The Corridor View" | ch4a.md |
| Sat | Bankless pitch | "Why stablecoins are the only crypto product Mom uses" (op-ed) | original |

## Week 4 — landing the audience

| Day | Channel | Title | Source |
|---|---|---|---|
| Mon | Medium | "Chapter 4 Part B" | ch4b.md |
| Wed | YouTube essay | "I built a stablecoin reader and recorded it" | gen-art + Kokoro voice + ch1 reading |
| Fri | Medium | "Chapter 4 Part C" | ch4c.md |
| Sat | CoinDesk pitch | Op-ed: "The Quiet Stablecoin Economy" | original |

## Conversion expectations (honest)

- **Medium post views**: 1,000-10,000 per post if published in
  Coinmonks (depends on hook). $30-300 in Medium Partner Program
  payout per post. ~3% CTR to book funnel.
- **gianyrox.com/blog post views**: <100 initially, but compounds
  over years via Google search. Long-tail SEO is the real win.
- **Substack subscribers**: 50-300 net adds across 4 weeks at this
  publish cadence. ~20% conversion of subscribers to PDF purchase.
- **Net PDF sales month 1**: 30-100 at $9 = $270-$900.
- **Net Gumroad fees (10%)**: $27-$90.

## Scripts to build

- [ ] `scripts/blog-publish.mjs` — given a markdown file + slug, produce
  HTML + push to `gianyrox/blog/<slug>/index.html`
- [ ] `scripts/post-to-medium.mjs` — Medium API to draft + publish
  (Medium API: `POST /v1/users/{user_id}/posts`)
- [ ] `scripts/post-to-substack.mjs` — Substack has no public API; use
  Playwright session
- [ ] `scripts/post-to-x-thread.mjs` — break long markdown into 25-tweet
  thread; need X v2 API
