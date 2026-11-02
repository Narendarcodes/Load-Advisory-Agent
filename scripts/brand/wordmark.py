import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib.instancer import instantiateVariableFont
font = TTFont(sys.argv[1])
if 'fvar' in font:
    print("axes", [(a.axisTag,a.minValue,a.maxValue) for a in font['fvar'].axes], file=sys.stderr)
    font = instantiateVariableFont(font, {"wght": 600})
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
text = sys.argv[2]; x = 0; parts=[]
kern = -10
for ch in text:
    g = cmap[ord(ch)]; pen = SVGPathPen(gs); gs[g].draw(pen)
    parts.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
    x += gs[g].width + kern
asc = font['hhea'].ascent
print(upm, x, asc, file=sys.stderr)
# flip y: font units y-up
print(f'<g transform="scale(1 -1)">' + "".join(parts) + '</g>')
print(x, file=sys.stderr)
