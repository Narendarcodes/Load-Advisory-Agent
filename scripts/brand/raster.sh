#!/bin/sh
# raster.sh in.svg out.png W H  (renders svg scaled to WxH, transparent)
IN=$(readlink -f "$1"); OUT=$(readlink -f "$2" 2>/dev/null || echo "$2"); W=$3; H=$4; BG=${5:-transparent}
T=$(mktemp -d)
printf '<html><body style="margin:0;background:%s"><img src="file://%s" style="width:%spx;height:%spx;display:block"></body></html>' "$BG" "$IN" "$W" "$H" > $T/p.html
chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --default-background-color=00000000 --window-size=$W,$H --screenshot=$T/o.png file://$T/p.html >/dev/null 2>&1
cp $T/o.png "$2"; rm -rf $T
