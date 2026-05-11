#!/usr/bin/env bash
# build.sh — rebuild gianyrox.com static site from sources.
#
#   1. Pull latest book HTML from ~/agfarms/papers/ (rebuilds via build.py)
#   2. Copy to gianyrox/book/index.html
#   3. Generate static PDF of the book at gianyrox/public/your-money-is-broken.pdf
#
# Run from the repo root:
#   ./scripts/build.sh

set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
PAPERS="${PAPERS_DIR:-$HOME/agfarms/papers}"

echo "[build.sh] 1/3 rebuild book HTML from $PAPERS"
if [ ! -d "$PAPERS" ]; then
  echo "  $PAPERS not found — book source missing" >&2
  exit 1
fi
( cd "$PAPERS" && python3 build.py )

echo "[build.sh] 2/3 copy → gianyrox/book/index.html"
mkdir -p "$HERE/book"
cp "$PAPERS/index.html" "$HERE/book/index.html"

echo "[build.sh] 3/3 render static PDF"
mkdir -p "$HERE/public"
python3 "$HERE/scripts/build-book-pdf.py"

echo
echo "✓ rebuilt. To deploy:"
echo "  cd $HERE && git add -A && git commit -m 'book: refresh' && git push"
