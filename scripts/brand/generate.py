import os
import sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
CORAL="#FE7D6B"; INK="#241C1B"; PAPER="#F7F3EE"; DEEP="#B23A2E"; PEACH="#FF8F68"
word = open("word.g").read().strip()  # from wordmark.py
WORD_W, CAP = 2522, 740  # font units: advance width, approx cap height
PATH = "M11 39 Q17 34.5 22.5 38.5 L30 45 L52.5 19.5"
def mark(bg=CORAL, fg=INK, rx=16):
    return f'<rect width="64" height="64" rx="{rx}" fill="{bg}"/><path d="{PATH}" fill="none" stroke="{fg}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'
def svg(w,h,body,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
files = {}
files["saral-mark.svg"] = svg(64,64,mark(),"Saral")
files["saral-mark-mono.svg"] = svg(64,64,f'<rect width="64" height="64" rx="16" fill="{INK}"/><path d="{PATH}" fill="none" stroke="{PAPER}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>',"Saral")
# lockup: mark 64 high, wordmark cap height ~ 30px
s = 34/ CAP
ww = WORD_W*s
def lockup(markbody, color):
    gx = 64+16
    return f'{markbody}<g fill="{color}" transform="translate({gx} {32+34/2}) scale({s:.5f})">{word}</g>'
W = int(64+16+ww+2)
files["saral-logo.svg"] = svg(W,64,lockup(mark(),INK),"Saral")
files["saral-logo-mono.svg"] = svg(W,64,lockup(f'<rect width="64" height="64" rx="16" fill="{INK}"/><path d="{PATH}" fill="none" stroke="{PAPER}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>',INK),"Saral")
files["saral-logo-reverse.svg"] = svg(W,64,lockup(mark(),PAPER),"Saral")
files["saral-wordmark.svg"] = svg(int(ww)+2,40,f'<g fill="{INK}" transform="translate(0 {3+34}) scale({s:.5f})">{word}</g>',"Saral")
# favicon: slightly larger rx-consistent
files["favicon.svg"] = svg(64,64,mark(),"Saral")
# OG image 1200x630
og = f'<rect width="1200" height="630" fill="{PAPER}"/><circle cx="1040" cy="560" r="300" fill="{PEACH}" opacity=".18"/><circle cx="1120" cy="90" r="160" fill="{CORAL}" opacity=".14"/>'
og += f'<g transform="translate(96 150) scale(2)">{mark()}</g>'
og += f'<g fill="{INK}" transform="translate(260 {150+64+40}) scale({90/CAP:.5f})">{word}</g>'
og += f'<text x="96" y="380" font-family="Manrope, Arial, sans-serif" font-size="44" font-weight="600" fill="{INK}">Understand your loan decision.</text>'
og += f'<text x="96" y="440" font-family="Manrope, Arial, sans-serif" font-size="44" font-weight="600" fill="{DEEP}">A person decides.</text>'
og += f'<rect x="96" y="500" width="96" height="8" rx="4" fill="{CORAL}"/>'
files["og-image.svg"] = svg(1200,630,og,"Saral. Understand your loan decision. A person decides.")
for n,c in files.items(): open(os.path.join(OUT,n),"w").write(c)
print(W, ww)
# full-bleed square (for apple-touch and maskable icons: the platform applies its own mask)
open(os.path.join(OUT,"_square.svg"),"w").write(svg(64,64,f'<rect width="64" height="64" fill="{CORAL}"/><g transform="translate(6.4 6.4) scale(.8)"><path d="{PATH}" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></g>',"Saral"))
