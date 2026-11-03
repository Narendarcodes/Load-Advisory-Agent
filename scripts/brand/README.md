# Saral brand asset generator

Rebuilds `apps/loan_advisory_portal/loan_advisory_portal/public/brand/` from code. The wordmark is real Sora
(weight 600) glyph outlines, so the SVGs do not depend on a font being installed.

```bash
pip install fonttools brotli
python scripts/brand/wordmark.py apps/loan_advisory_portal/loan_advisory_portal/public/fonts/Sora-latin.woff2 Saral > /tmp/word.g
cd /tmp && python <repo>/scripts/brand/generate.py <repo>/apps/loan_advisory_portal/loan_advisory_portal/public/brand
# PNGs (favicon-32, icon-192/512, apple-touch, maskable, og-image) were rasterised with headless
# Chromium via raster.sh, then resized with ImageMagick. See docs/BRAND.md for the asset list.
```
`generate.py` reads `word.g` from the working directory.
