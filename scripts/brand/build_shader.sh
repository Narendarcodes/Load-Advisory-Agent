#!/bin/sh
# Bundle the hero shader (Paper Shaders mesh gradient, Apache-2.0) into the portal's static JS.
#   npm i --no-save --prefix /tmp/castdeps @paper-design/shaders@0.0.82 esbuild@0.25
#   sh scripts/brand/build_shader.sh
set -e
cd "$(dirname "$0")/../.."
OUT=apps/loan_advisory_portal/loan_advisory_portal/public/js/vendor/saral-shader.js
NODE_PATH=/tmp/castdeps/node_modules /tmp/castdeps/node_modules/.bin/esbuild scripts/brand/shader_entry.mjs \
	--bundle --format=esm --minify --target=es2019 --legal-comments=inline \
	--banner:js="/* Saral hero shader. Paper Shaders (c) 2026 Paper, Apache-2.0, https://shaders.paper.design */" \
	--outfile=$OUT
gzip -c $OUT | wc -c | xargs echo "gzipped bytes:"
