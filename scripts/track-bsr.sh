#!/usr/bin/env bash
# track-bsr.sh — Daily snapshot of Amazon BSR, reviews, and price for
# "Your Money Is Broken" (ISBN 9798196679834). Saves to a CSV for trending.
#
# Run from cron: 0 8,20 * * * cd ~/agfarms/gianyrox && ./scripts/track-bsr.sh
#
# Output CSV columns:
#   timestamp_iso, asin, bsr_overall, bsr_cat1, bsr_cat2, bsr_cat3,
#   review_count, avg_rating, list_price, marketplace
set -euo pipefail

ASIN="${ASIN:-B0H1T2DDG3}"  # live ASIN assigned by KDP on 2026-05-14
URL="https://www.amazon.com/dp/${ASIN}"
OUT="$(dirname "$0")/../public/bsr-history.csv"
TS="$(date -Iseconds)"

# Create CSV with header if missing
if [ ! -f "$OUT" ]; then
  echo "timestamp,asin,bsr_overall,bsr_cat1,bsr_cat2,bsr_cat3,reviews,avg_rating,price_usd,marketplace" > "$OUT"
fi

# Fetch page (Amazon serves bot-detection — best effort)
HTML="$(curl -sL --max-time 30 -A 'Mozilla/5.0 (X11; Linux x86_64) Gianyrox/1.0 BSR-Tracker' "$URL" || echo "")"

# Parse: BSR Overall + per-category, reviews, rating, price
BSR_OVERALL="$(echo "$HTML" | grep -oP '#[\d,]+\s+in Books' | head -1 | grep -oP '[\d,]+' | tr -d ',' || echo "")"
BSR_CAT1="$(echo "$HTML" | grep -oP '#[\d,]+\s+in [^<]+Money & Monetary Policy' | head -1 | grep -oP '[\d,]+' | tr -d ',' || echo "")"
BSR_CAT2="$(echo "$HTML" | grep -oP '#[\d,]+\s+in [^<]+Banks & Banking' | head -1 | grep -oP '[\d,]+' | tr -d ',' || echo "")"
BSR_CAT3="$(echo "$HTML" | grep -oP '#[\d,]+\s+in [^<]+Economic Policy' | head -1 | grep -oP '[\d,]+' | tr -d ',' || echo "")"
REVIEWS="$(echo "$HTML" | grep -oP '[\d,]+\s+ratings?' | head -1 | grep -oP '[\d,]+' | tr -d ',' || echo "")"
RATING="$(echo "$HTML" | grep -oP '\b\d\.\d\s+out of 5 stars' | head -1 | grep -oP '\d\.\d' || echo "")"
PRICE="$(echo "$HTML" | grep -oP '\$\d+\.\d{2}' | head -1 | tr -d '$' || echo "")"

echo "${TS},${ASIN},${BSR_OVERALL},${BSR_CAT1},${BSR_CAT2},${BSR_CAT3},${REVIEWS},${RATING},${PRICE},amazon.com" >> "$OUT"
echo "[$TS] BSR=${BSR_OVERALL:-N/A} | cat1=${BSR_CAT1:-N/A} | reviews=${REVIEWS:-0} | rating=${RATING:-N/A} | price=\$${PRICE:-N/A}"
