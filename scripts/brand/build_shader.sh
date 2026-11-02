#!/bin/sh
# Bundle the Saral shaders (Paper Shaders, Apache-2.0) into the portal's static JS.
#   npm i --no-save --prefix /tmp/castdeps @paper-design/shaders@0.0.82 esbuild@0.25
#   sh scripts/brand/build_shader.sh   (imports use the alias paper-shaders-dist -> the package dist folder,
#   so each chunk pulls only the files it needs instead of the whole barrel)
# Output (public/js/vendor/): saral-shader.js (mesh gradient), saral-shader-extra.js (grain gradient +
# pulsing border + Paper's noise texture) and one shared chunk (ShaderMount).
set -e
cd "$(dirname "$0")/../.."
OUT=apps/loan_advisory_portal/loan_advisory_portal/public/js/vendor
rm -f $OUT/saral-shader*.js $OUT/saral-chunk-*.js
NODE_PATH=/tmp/castdeps/node_modules /tmp/castdeps/node_modules/.bin/esbuild \
	saral-shader=scripts/brand/shader_entry.mjs saral-shader-extra=scripts/brand/shader_extra.mjs \
	--alias:paper-shaders-dist=/tmp/castdeps/node_modules/@paper-design/shaders/dist --bundle --splitting --format=esm --minify --target=es2019 --legal-comments=inline \
	--chunk-names=saral-chunk-[hash] \
	--banner:js="/* Saral shaders. Paper Shaders (c) 2026 Paper, Apache-2.0, https://shaders.paper.design */" \
	--outdir=$OUT
for f in $OUT/saral-shader*.js $OUT/saral-chunk-*.js; do echo "$(gzip -9 -c $f | wc -c) gz  $(wc -c < $f) raw  $f"; done
cat $OUT/saral-shader*.js $OUT/saral-chunk-*.js | gzip -9 -c | wc -c | xargs echo "all shader bundles gzipped bytes:"
