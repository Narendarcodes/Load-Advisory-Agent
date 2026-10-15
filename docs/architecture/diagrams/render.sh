#!/usr/bin/env bash
# Re-render every Mermaid source in this folder to SVG and PNG (2x) with mermaid-cli.
#   bash docs/architecture/diagrams/render.sh
# Needs Node and a Chromium that puppeteer can launch (on minimal Linux: libatk1.0-0 libxcomposite1 libxdamage1 libatspi2.0-0).
set -euo pipefail
cd "$(dirname "$0")"
CFG=$(mktemp); PUP=$(mktemp)
echo '{"theme":"default","themeVariables":{"fontFamily":"Noto Sans, DejaVu Sans, Arial, sans-serif","fontSize":"15px"},"flowchart":{"htmlLabels":true,"curve":"basis"},"sequence":{"wrap":false,"mirrorActors":true}}' > "$CFG"
echo '{"args":["--no-sandbox"]}' > "$PUP"
MMDC="npx -y @mermaid-js/mermaid-cli@11"
for f in *.mmd; do
  b=${f%.mmd}; w=1400; [ "$b" = "02-components" ] && w=1600
  $MMDC -p "$PUP" -c "$CFG" -b white -w $w -i "$f" -o "$b.svg"
  $MMDC -p "$PUP" -c "$CFG" -b white -w $w -s 2 -i "$f" -o "$b.png"
done
rm -f "$CFG" "$PUP"
