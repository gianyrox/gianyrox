#!/usr/bin/env bash
# build-kindle-epub.sh — concat chapters, strip Mermaid, pandoc to EPUB.
set -euo pipefail
cd "$(dirname "$0")/.."
BOOK_DIR="$HOME/agfarms/papers/book"
OUT="public/your-money-is-broken.epub"
COVER="public/cover/front-hd.png"

CHAPTERS=(prologue ch1 ch2 ch3a ch3b ch3c ch4a ch4b ch4c ch4d ch5a ch5b ch5c ch5d ch5e ch6 appendices characters)

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# Combine all chapters into one markdown, strip mermaid blocks
{
  echo "% Your Money Is Broken"
  echo "% Giany Rox"
  echo "% 2026"
  echo ""
  for c in "${CHAPTERS[@]}"; do
    f="$BOOK_DIR/$c.md"
    [ -f "$f" ] || continue
    # Strip mermaid blocks
    python3 -c "
import re, sys
txt = open('$f').read()
txt = re.sub(r'\`\`\`mermaid\n.*?\n\`\`\`', '*[Diagram: see the print/PDF edition for figure.]*', txt, flags=re.DOTALL)
print(txt)
print()
"
  done
} > "$TMPDIR/book.md"

pandoc "$TMPDIR/book.md" \
  -o "$OUT" \
  --from=markdown \
  --to=epub3 \
  --metadata title="Your Money Is Broken" \
  --metadata subtitle="How Stablecoins, the Digital Dollar, and Cross-Border Payments Are Replacing Slow Money" \
  --metadata author="Giany Rox" \
  --metadata publisher="AGFarms" \
  --metadata lang=en-US \
  --metadata identifier="urn:isbn:9798196679834" \
  --epub-cover-image="$COVER" \
  --toc --toc-depth=2 \
  --split-level=1

echo "✓ $OUT ($(du -h "$OUT" | cut -f1))"
