"""Compose the Saral portal illustrations (v4 cast) from Open Peeps (Pablo Stanley, CC0 1.0).

Two people (the borrower and the advisor) are put together from fixed Open Peeps parts by
scripts/brand/cast_parts.cjs (parts from react-peeps@0.1.10, MIT code, CC0 art). This file places those
figures at one scale on a 320x240 canvas with a soft coral-tint ground and simple props in ink and coral.
The assistant is never a person: it is the Saral mark. Some scenes are objects only.

    NODE_PATH=/tmp/castdeps/node_modules node scripts/brand/cast_parts.cjs <cache-dir>
    python scripts/brand/peeps.py <cache-dir> <out-dir>
    svgo --multipass --config scripts/brand/svgo.config.cjs <out-dir>/*.svg

The cast, the parts and every source URL are in docs/ASSETS.md.
"""

import os
import re
import sys


CORAL = "#FE7D6B"
PEACH = "#FF8F68"
SOFT = "#FDECE6"
INK = "#000000"
WHITE = "#FFFFFF"
LINE = "#E3D8CF"

W, H = 320, 240


# ---------------------------------------------------------------- simple props (ink line + coral accent)

def ground(cx=160, cy=150, rx=130, ry=82, fill=SOFT):
    return (
        f'<path d="M{cx - rx} {cy} C{cx - rx} {cy - ry * 0.9} {cx - rx * 0.35} {cy - ry} {cx + rx * 0.1} {cy - ry * 0.95} '
        f'C{cx + rx * 0.8} {cy - ry * 0.9} {cx + rx} {cy - ry * 0.35} {cx + rx} {cy + ry * 0.1} '
        f'C{cx + rx} {cy + ry * 0.8} {cx + rx * 0.4} {cy + ry} {cx - rx * 0.15} {cy + ry * 0.95} '
        f'C{cx - rx * 0.8} {cy + ry * 0.9} {cx - rx} {cy + ry * 0.5} {cx - rx} {cy}Z" fill="{fill}"/>'
    )


def floor(y=232):
    return f'<path d="M36 {y}h248" stroke="{LINE}" stroke-width="3" stroke-linecap="round"/>'


def document(x, y, w=58, h=74, lines=4, accent=True, mark=None):
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>']
    if accent:
        s.append(f'<rect x="{x + 10}" y="{y + 12}" width="{w * 0.45:.0f}" height="7" rx="3.5" fill="{CORAL}"/>')
    for i in range(lines):
        s.append(f'<path d="M{x + 10} {y + 30 + i * 11}h{w - 20 - (i % 2) * 12}" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
    if mark == "tick":
        s.append(f'<circle cx="{x + w}" cy="{y + h}" r="15" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>')
        s.append(f'<path d="M{x + w - 7} {y + h} l5 5 l9 -10" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>')
    elif mark == "question":
        s.append(f'<circle cx="{x + w}" cy="{y + h}" r="15" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>')
        s.append(f'<path d="M{x + w - 5} {y + h - 4} q0 -6 5 -6 q5 0 5 5 q0 4 -5 6 v3" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
        s.append(f'<circle cx="{x + w}" cy="{y + h + 9}" r="1.8" fill="{INK}"/>')
    return "".join(s)


def clock(cx, cy, r=24):
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{cx} {cy - r * 0.6} V{cy} L{cx + r * 0.45} {cy + r * 0.3}" fill="none" stroke="{CORAL}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<circle cx="{cx}" cy="{cy}" r="3" fill="{INK}"/>'
    )


def bubble(x, y, w=86, h=50, dots=True):
    s = [
        f'<path d="M{x + 8} {y} h{w - 16} a8 8 0 0 1 8 8 v{h - 16} a8 8 0 0 1 -8 8 h-{w - 40} l-14 12 v-12 h-{10} a8 8 0 0 1 -8 -8 v-{h - 16} a8 8 0 0 1 8 -8z" '
        f'fill="{PEACH}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    ]
    if dots:
        for i in range(3):
            s.append(f'<circle cx="{x + w / 2 - 16 + i * 16}" cy="{y + (h - 8) / 2 + 2}" r="4" fill="{INK}"/>')
    return "".join(s)


def chart(x, y, w=96, h=72):
    bars = [0.35, 0.55, 0.45, 0.8]
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>']
    bw = (w - 30) / len(bars)
    for i, v in enumerate(bars):
        bh = (h - 22) * v
        fill = CORAL if i == len(bars) - 1 else SOFT
        s.append(f'<rect x="{x + 12 + i * (bw + 2):.1f}" y="{y + h - 10 - bh:.1f}" width="{bw - 4:.1f}" height="{bh:.1f}" rx="2" fill="{fill}" stroke="{INK}" stroke-width="2"/>')
    return "".join(s)


def folder(x, y, w=92, h=64):
    return (
        f'<path d="M{x} {y + 10} a6 6 0 0 1 6 -6 h24 l8 8 h{w - 38} a6 6 0 0 1 6 6 v{h - 14} a6 6 0 0 1 -6 6 h-{w - 12} a6 6 0 0 1 -6 -6z" '
        f'fill="{SOFT}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + w / 2 - 10} {y + h / 2 + 6} h20 M{x + w / 2} {y + h / 2 - 4} v20" stroke="{CORAL}" stroke-width="4" stroke-linecap="round"/>'
    )


def tray(x, y, w=100, h=34):
    return (
        f'<path d="M{x} {y} l12 {h} h{w - 24} l12 -{h}" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + 30} {y + h / 2} h{w - 60}" stroke="{CORAL}" stroke-width="4" stroke-linecap="round"/>'
    )


def plug(x, y):
    return (
        f'<path d="M{x} {y} h22 a12 12 0 0 1 0 24 h-22z" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{x + 34} {y + 12} h14" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M{x - 30} {y + 4} h-10 M{x - 30} {y + 20} h-10" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M{x - 30} {y - 6} v36 h-6 a10 10 0 0 1 -10 -10 v-16 a10 10 0 0 1 10 -10z" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{x - 18} {y - 10} l6 6 M{x - 10} {y + 34} l-6 -6" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
    )


def coin(cx, cy, r=18):
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>'
        f'<text x="{cx}" y="{cy + 6}" text-anchor="middle" font-family="Sora, sans-serif" font-size="18" font-weight="700" fill="{INK}">₹</text>'
    )


def card_id(x, y, w=84, h=56):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<circle cx="{x + 20}" cy="{y + 24}" r="9" fill="{SOFT}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{x + 10} {y + 44} q10 -10 20 0" fill="none" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{x + 40} {y + 18}h30 M{x + 40} {y + 30}h22 M{x + 40} {y + 42}h28" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
        f'<rect x="{x + 40}" y="{y + 15}" width="30" height="6" rx="3" fill="{CORAL}"/>'
    )


def magnifier(cx, cy, r=22):
    return (
        f'<path d="M{cx + r * 0.7:.1f} {cy + r * 0.7:.1f} l{r * 0.9:.1f} {r * 0.9:.1f}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WHITE}" stroke="{INK}" stroke-width="3.5"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r - 7}" fill="{SOFT}"/>'
        f'<path d="M{cx - r * 0.45:.1f} {cy - r * 0.15:.1f} a{r * 0.5:.1f} {r * 0.5:.1f} 0 0 1 {r * 0.4:.1f} -{r * 0.35:.1f}" fill="none" stroke="{CORAL}" stroke-width="3.5" stroke-linecap="round"/>'
    )


def calendar(x, y, w=86, h=76, ticks=2, empty=False):
    s = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>',
        f'<path d="M{x} {y + 20} h{w}" stroke="{INK}" stroke-width="3"/>',
        f'<rect x="{x + 1.5}" y="{y + 1.5}" width="{w - 3}" height="17" rx="5" fill="{CORAL}"/>',
        f'<path d="M{x + 20} {y - 7} v14 M{x + w - 20} {y - 7} v14" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
    ]
    cw, ch = (w - 16) / 4, (h - 30) / 3
    n = 0
    for r in range(3):
        for c in range(4):
            cx, cy = x + 8 + c * cw + cw / 2, y + 26 + r * ch + ch / 2
            if not empty and n < ticks:
                s.append(f'<path d="M{cx - 5:.1f} {cy:.1f} l3.5 3.5 l6 -7" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>')
            elif not empty and n == ticks:
                s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="6" fill="{SOFT}" stroke="{CORAL}" stroke-width="2.5"/>')
            else:
                s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="2" fill="{LINE}"/>')
            n += 1
    return "".join(s)


def shield(cx, cy, s=1.0):
    return (
        f'<path d="M{cx} {cy - 38 * s:.1f} l{30 * s:.1f} {11 * s:.1f} v{22 * s:.1f} c0 {22 * s:.1f} -{14 * s:.1f} {36 * s:.1f} -{30 * s:.1f} {44 * s:.1f} '
        f'c-{16 * s:.1f} -{8 * s:.1f} -{30 * s:.1f} -{22 * s:.1f} -{30 * s:.1f} -{44 * s:.1f} v-{22 * s:.1f}z" fill="{SOFT}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<rect x="{cx - 11 * s:.1f}" y="{cy - 4 * s:.1f}" width="{22 * s:.1f}" height="{18 * s:.1f}" rx="3" fill="{CORAL}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{cx - 6 * s:.1f} {cy - 4 * s:.1f} v-{5 * s:.1f} a{6 * s:.1f} {6 * s:.1f} 0 0 1 {12 * s:.1f} 0 v{5 * s:.1f}" fill="none" stroke="{INK}" stroke-width="2.5"/>'
    )


def envelope(x, y, w=86, h=58, mark=None):
    s = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>',
        f'<path d="M{x + 3} {y + 4} L{x + w / 2} {y + h * 0.58} L{x + w - 3} {y + 4}" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
    ]
    if mark == "tick":
        s.append(f'<circle cx="{x + w}" cy="{y}" r="14" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>')
        s.append(f'<path d="M{x + w - 6} {y} l4.5 4.5 l8 -9" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>')
    elif mark == "key":
        s.append(f'<circle cx="{x + w - 2}" cy="{y + 2}" r="10" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>')
        s.append(f'<path d="M{x + w + 6} {y + 9} l16 16 m-6 -6 l5 -5 m-11 -1 l5 -5" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    return "".join(s)


def confetti():
    bits = [(40, 40, 0), (78, 22, 1), (250, 30, 2), (286, 64, 0), (118, 34, 2), (214, 20, 1), (30, 92, 1), (296, 120, 2)]
    s = []
    for x, y, kind in bits:
        if kind == 0:
            s.append(f'<rect x="{x}" y="{y}" width="10" height="5" rx="2" transform="rotate(-30 {x} {y})" fill="{CORAL}"/>')
        elif kind == 1:
            s.append(f'<circle cx="{x}" cy="{y}" r="4" fill="{PEACH}"/>')
        else:
            s.append(f'<path d="M{x} {y} q4 -6 8 0 t8 0" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
    return "".join(s)


def pen(x, y):
    return (
        f'<path d="M{x} {y} l34 -34 l8 8 l-34 34 l-11 3z" fill="{CORAL}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + 28} {y - 28} l8 8" stroke="{INK}" stroke-width="3"/>'
    )


def star_bubble(x, y, w=86, h=54):
    cx, cy = x + w / 2, y + (h - 8) / 2 + 2
    pts = []
    import math

    for i in range(10):
        r = 13 if i % 2 == 0 else 5.5
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return bubble(x, y, w, h, dots=False) + f'<polygon points="{" ".join(pts)}" fill="{WHITE}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'


def thought(x, y, w=86, h=52):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<circle cx="{x + 12}" cy="{y + h + 10}" r="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<circle cx="{x + 2}" cy="{y + h + 24}" r="3.5" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
        + "".join(f'<circle cx="{x + w / 2 - 18 + i * 18}" cy="{y + h / 2}" r="4.5" fill="{CORAL if i == 1 else INK}"/>' for i in range(3))
    )


def range_bar(x, y, w=110, marker=0.62, outside=False):
    lo, hi = (0.35, 0.8)
    s = [
        f'<rect x="{x}" y="{y}" width="{w}" height="64" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>',
        f'<path d="M{x + 12} {y + 40} h{w - 24}" stroke="{LINE}" stroke-width="8" stroke-linecap="round"/>',
        f'<path d="M{x + 12 + (w - 24) * lo:.1f} {y + 40} H{x + 12 + (w - 24) * hi:.1f}" stroke="{CORAL}" stroke-width="8" stroke-linecap="round"/>',
        f'<path d="M{x + 12} {y + 18} h{w * 0.4:.0f}" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>',
    ]
    mx = x + 12 + (w - 24) * marker
    s.append(f'<path d="M{mx:.1f} {y + 30} v20" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>')
    if outside:
        s.append(f'<circle cx="{mx:.1f}" cy="{y + 40}" r="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>')
    return "".join(s)


def calculator(x, y, w=62, h=84):
    s = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>',
        f'<rect x="{x + 9}" y="{y + 9}" width="{w - 18}" height="18" rx="3" fill="{SOFT}" stroke="{INK}" stroke-width="2.5"/>',
    ]
    for r in range(3):
        for c in range(3):
            fill = CORAL if (r, c) == (2, 2) else WHITE
            s.append(f'<rect x="{x + 9 + c * 15}" y="{y + 35 + r * 15}" width="11" height="10" rx="2" fill="{fill}" stroke="{INK}" stroke-width="2"/>')
    return "".join(s)


def cards_stack(x, y):
    s = []
    for i, fill in enumerate((SOFT, WHITE, WHITE)):
        dx, dy = 24 - i * 12, i * 14
        s.append(f'<rect x="{x + dx}" y="{y + dy}" width="78" height="50" rx="6" fill="{fill}" stroke="{INK}" stroke-width="3"/>')
    s.append(f'<rect x="{x + 10}" y="{y + 40}" width="30" height="7" rx="3.5" fill="{CORAL}"/>')
    s.append(f'<path d="M{x + 10} {y + 58} h46 M{x + 10} {y + 68} h30" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
    return "".join(s)


def closed_folder(x, y, w=92, h=64):
    return (
        f'<path d="M{x} {y + 10} a6 6 0 0 1 6 -6 h24 l8 8 h{w - 38} a6 6 0 0 1 6 6 v{h - 14} a6 6 0 0 1 -6 6 h-{w - 12} a6 6 0 0 1 -6 -6z" '
        f'fill="{SOFT}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<rect x="{x + w / 2 - 18}" y="{y + h / 2 - 2}" width="36" height="14" rx="3" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{x + w / 2 - 10} {y + h / 2 + 5} h20" stroke="{CORAL}" stroke-width="3" stroke-linecap="round"/>'
    )


def signpost(x, y):
    return (
        f'<path d="M{x + 30} {y} v104" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M{x} {y + 10} h58 l12 12 l-12 12 h-58z" fill="{CORAL}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + 66} {y + 46} h-58 l-12 12 l12 12 h58z" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + 14} {y + 58} h38" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
    )


def person_bubble(x, y, w=86, h=54):
    cx, cy = x + w / 2, y + (h - 8) / 2 + 2
    return bubble(x, y, w, h, dots=False) + (
        f'<circle cx="{cx}" cy="{cy - 6}" r="7" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{cx - 12} {cy + 13} q12 -16 24 0" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
    )


def phone(x, y, w=46, h=80):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{x + w / 2 - 7} {y + 8} h14" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
        f'<circle cx="{x + w / 2}" cy="{y + 34}" r="10" fill="{SOFT}" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M{x + 10} {y + 56} h{w - 20} M{x + 14} {y + 65} h{w - 28}" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
    )


def id_tick(x, y, w=84, h=56):
    return card_id(x, y, w, h) + (
        f'<circle cx="{x + w}" cy="{y + h}" r="14" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{x + w - 6} {y + h} l4.5 4.5 l8 -9" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
    )


# ---------------------------------------------------------------- the cast (v4)
#
# Figures come from scripts/brand/cast_parts.cjs as cast-<person>-<pose>[-<face>].svg. Every figure is
# drawn at ONE scale (SCALE canvas px per Open Peeps unit), so heads, line weight and heights match
# across scenes. Busts always sit behind a desk edge, so no figure is cut off in mid-air.

SCALE = 0.072
BASE = 228  # floor line: feet of standing figures, desk legs


def cast(cache: str, name: str, x: float, bottom: float = BASE, flip: bool = False, prefix: str = "f") -> str:
    raw = open(os.path.join(cache, name + ".svg"), encoding="utf-8").read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', raw).group(1).split()]
    width, height = vb[2] * SCALE, vb[3] * SCALE
    body = raw[raw.index(">", raw.index("<svg")) + 1 : raw.rindex("</svg>")]
    inner = (
        f'<svg x="{x:.1f}" y="{bottom - height:.1f}" width="{width:.1f}" height="{height:.1f}" '
        f'viewBox="{vb[0]:g} {vb[1]:g} {vb[2]:g} {vb[3]:g}">{body}</svg>'
    )
    if flip:
        return f'<g transform="translate({2 * x + width:.1f} 0) scale(-1 1)">{inner}</g>'
    return inner


def bust_width(cache: str, name: str) -> float:
    raw = open(os.path.join(cache, name + ".svg"), encoding="utf-8").read()
    return float(re.search(r'viewBox="([^"]+)"', raw).group(1).split()[2]) * SCALE


DESK_TOP = 150


def desk(x, w):
    """A desk edge in front of a bust: the slab hides where the bust ends."""
    if not w:
        return ""
    return (
        f'<rect x="{x}" y="{DESK_TOP}" width="{w}" height="12" rx="3" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{x + 14} {DESK_TOP + 12} V{BASE} M{x + w - 14} {DESK_TOP + 12} V{BASE}" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
    )


def at_desk(cache, name, x, desk_x, desk_w, flip=False, chair=True):
    """A bust on a chair whose lower edge is tucked behind the desk slab."""
    w = bust_width(cache, name)
    back = (
        f'<rect x="{x + w * 0.12:.1f}" y="{DESK_TOP - 58}" width="{w * 0.76:.1f}" height="70" rx="12" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
        if chair else ""
    )
    return back + cast(cache, name, x, bottom=DESK_TOP + 12, flip=flip) + desk(desk_x, desk_w)


def scaled(svg, x, y, k):
    """Draw a prop built at the origin, moved to (x, y) and scaled by k (keeps its inner proportions)."""
    return f'<g transform="translate({x} {y}) scale({k})">{svg}</g>'


def tick_badge(cx, cy, r=16):
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M{cx - r * 0.45:.1f} {cy + r * 0.02:.1f} l{r * 0.32:.1f} {r * 0.32:.1f} l{r * 0.6:.1f} -{r * 0.66:.1f}" fill="none" stroke="{INK}" '
        f'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
    )


def checklist(x, y, w=74, h=92):
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>']
    for i in range(3):
        cy = y + 22 + i * 24
        if i < 2:
            s.append(f'<path d="M{x + 11} {cy} l4 4 l7 -8" fill="none" stroke="{INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>')
        else:
            s.append(f'<circle cx="{x + 17}" cy="{cy}" r="6.5" fill="{SOFT}" stroke="{CORAL}" stroke-width="3"/>')
        s.append(f'<path d="M{x + 30} {cy} h{w - 42 - (i % 2) * 10}" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
    return "".join(s)


def held_page(x, y, w=40, h=50, angle=-8, folder_=False):
    """A page or folder held in front of crossed arms."""
    fill = SOFT if folder_ else WHITE
    s = [f'<g transform="rotate({angle} {x + w / 2} {y + h / 2})">',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{INK}" stroke-width="2.6"/>']
    if folder_:
        s.append(f'<rect x="{x + 8}" y="{y + h / 2 - 5}" width="{w - 16}" height="10" rx="2.5" fill="{WHITE}" stroke="{INK}" stroke-width="2"/>')
        s.append(f'<path d="M{x + 13} {y + h / 2} h{w - 26}" stroke="{CORAL}" stroke-width="2.6" stroke-linecap="round"/>')
    else:
        s.append(f'<rect x="{x + 7}" y="{y + 8}" width="{w * 0.45:.0f}" height="5" rx="2.5" fill="{CORAL}"/>')
        for i in range(3):
            s.append(f'<path d="M{x + 7} {y + 22 + i * 8} h{w - 14 - (i % 2) * 8}" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    s.append("</g>")
    return "".join(s)


def map_pin(cx, cy, r=30):
    return (
        f'<ellipse cx="{cx}" cy="{cy + r * 2.05:.1f}" rx="{r * 0.9:.1f}" ry="{r * 0.22:.1f}" fill="{LINE}"/>'
        f'<path d="M{cx} {cy + r * 2:.1f} C{cx - r * 0.35:.1f} {cy + r * 1.3:.1f} {cx - r} {cy + r * 0.75:.1f} {cx - r} {cy} '
        f'a{r} {r} 0 0 1 {2 * r} 0 C{cx + r} {cy + r * 0.75:.1f} {cx + r * 0.35:.1f} {cy + r * 1.3:.1f} {cx} {cy + r * 2:.1f}z" '
        f'fill="{CORAL}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r * 0.38:.1f}" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>'
    )


def saral_mark(x, y, size=64):
    """The Saral mark (assistant): coral rounded square, ink path ending in a tick (from public/brand/saral-mark.svg)."""
    k = size / 64
    return (
        f'<g transform="translate({x} {y}) scale({k:.3f})">'
        f'<rect width="64" height="64" rx="16" fill="{CORAL}" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M11 39 Q17 34.5 22.5 38.5 L30 45 L52.5 19.5" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'
        "</g>"
    )


def chat_lines(x, y, w=118, h=64):
    return (
        f'<path d="M{x + 10} {y} h{w - 20} a10 10 0 0 1 10 10 v{h - 20} a10 10 0 0 1 -10 10 h-{w - 44} l-16 13 v-13 h-4 a10 10 0 0 1 -10 -10 v-{h - 20} a10 10 0 0 1 10 -10z" '
        f'fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + 16} {y + 22} h{w - 40} M{x + 16} {y + 38} h{w - 60}" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
    )


def empty_page(x, y, w=74, h=92):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-dasharray="9 7"/>'
        f'<path d="M{x + w / 2 - 11} {y + h / 2} h22 M{x + w / 2} {y + h / 2 - 11} v22" stroke="{CORAL}" stroke-width="4" stroke-linecap="round"/>'
    )


def open_folder(x, y, w=120, h=80):
    """An empty folder: back, an empty front flap, nothing inside."""
    return (
        f'<path d="M{x} {y + 12} a6 6 0 0 1 6 -6 h30 l9 9 h{w - 51} a6 6 0 0 1 6 6 v{h - 21} h-{w}z" fill="{SOFT}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x - 6} {y + 30} h{w + 12} l-10 {h - 30} h-{w - 8}z" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<path d="M{x + w / 2 - 14} {y + 52} h28" stroke="{CORAL}" stroke-width="4" stroke-linecap="round"/>'
    )


B = "cast-borrower-"
A = "cast-advisor-"

# (file, title, builder(cache) -> svg body). Titles name the scene; see docs/ASSETS.md for the table.
SLOTS = [
    # sign in and apply
    ("login", "The borrower working on a laptop at a desk",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Geek", 104, 70, 180) + shield(232, 92, 0.7)),
    ("products", "The borrower pointing at loan options",
     lambda c: ground() + cast(c, B + "PointingFingerWB", 56) + cards_stack(178, 64)),
    ("dashboard", "The borrower pointing at a checklist with one step left",
     lambda c: ground() + cast(c, B + "PointingFingerWB", 56) + checklist(196, 60)),
    ("wizard-about", "The borrower beside her profile card",
     lambda c: ground() + cast(c, B + "ShirtPantsWB", 74) + card_id(180, 84, 92, 62)),
    ("wizard-loan", "The borrower working out a monthly amount on her phone",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Device", 98, 70, 180) + scaled(calculator(0, 0), 194, 98, 0.62)),
    ("wizard-documents", "The borrower holding her documents",
     lambda c: ground() + cast(c, B + "CrossedArmsWB", 62) + held_page(118, 64, 42, 52, -6) + document(200, 92, 54, 70) + document(214, 104, 54, 70)),
    ("documents-header", "The borrower holding her documents",
     lambda c: ground() + cast(c, B + "CrossedArmsWB", 62) + held_page(118, 64, 42, 52, -6) + document(200, 92, 54, 70) + document(214, 104, 54, 70)),
    ("kyc", "The borrower checking her identity card on her phone",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Device", 98, 70, 180) + scaled(card_id(0, 0), 190, 110, 0.7)),
    ("profile-header", "The borrower beside her profile card",
     lambda c: ground() + cast(c, B + "ShirtPantsWB", 74) + card_id(180, 84, 92, 62)),
    # results
    ("submitted", "The borrower relaxed after sending her application",
     lambda c: ground() + cast(c, B + "RestingWB", 46) + envelope(186, 92, 88, 60, mark="tick")),
    ("checking", "The borrower waiting with a cup while a magnifier goes over her paper",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Coffee", 96, 70, 180) + scaled(document(0, 0, lines=3), 194, 94, 0.72) + magnifier(236, 128, 15)),
    ("assessment-pending", "The borrower waiting with a cup, a clock on the wall",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Coffee", 96, 70, 180) + clock(222, 62, 24)),
    ("processing", "The reviewer at a desk reading the application",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, A + "BlazerBlackTee", 96, 70, 180) + scaled(document(0, 0, lines=3), 194, 94, 0.72)),
    ("missing-info", "The borrower looking at a form with a question on it",
     lambda c: ground() + cast(c, B + "ShirtPantsWB", 74) + document(186, 70, 64, 82, mark="question")),
    ("approved", "The borrower relaxed beside her letter with a tick",
     lambda c: ground() + cast(c, B + "RestingWB", 46) + document(190, 66, 64, 82, mark="tick")),
    ("not-approved", "The borrower reading her letter thoughtfully",
     lambda c: ground() + cast(c, B + "CrossedArmsWB-Serious", 98) + held_page(154, 60, 46, 58, -10)),
    ("withdrawn", "The borrower walking on with her folder closed",
     lambda c: ground() + cast(c, B + "WalkingWB", 70) + closed_folder(184, 140)),
    # eligibility
    ("eligibility", "The borrower working out what she could borrow on her phone",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, B + "Device", 98, 70, 180) + scaled(range_bar(0, 0, 110), 188, 84, 0.72)),
    ("eligibility-result", "An estimate inside the usual range",
     lambda c: ground() + range_bar(98, 74, 124) + tick_badge(222, 74, 18)),
    ("eligibility-outside", "An estimate outside the usual range",
     lambda c: ground() + range_bar(98, 74, 124, marker=0.08, outside=True)),
    # servicing
    ("repayments", "The borrower sitting beside her repayment calendar",
     lambda c: ground() + cast(c, B + "HandsBackWB", 46) + calendar(184, 74, 92, 82)),
    ("repayments-empty", "An empty repayment calendar",
     lambda c: ground() + calendar(112, 70, 96, 86, empty=True)),
    # people: a reviewer or "talk to a person"
    ("help-header", "The advisor and the borrower talking at a desk",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, A + "BlazerBlackTee", 74, 0, 0)
     + at_desk(c, B + "Shirt-Calm", 168, 50, 220, flip=True)),
    ("handoff", "The advisor and the borrower talking at a desk",
     lambda c: ground(160, 150, 135, 84) + at_desk(c, A + "BlazerBlackTee", 74, 0, 0)
     + at_desk(c, B + "Shirt-Calm", 168, 50, 220, flip=True)),
    ("feedback", "The borrower telling the advisor what she thinks",
     lambda c: ground() + cast(c, B + "PointingFingerWB", 40) + cast(c, A + "BlazerPantsWB", 196, flip=True) + star_bubble(124, 16, 70, 44)),
    # objects only
    ("feedback-sent", "A sent message with a tick", lambda c: ground() + envelope(110, 88, 100, 66, mark="tick")),
    ("empty-applications", "An empty page waiting for an application", lambda c: ground() + empty_page(123, 70)),
    ("empty-documents", "An empty folder", lambda c: ground() + open_folder(100, 80)),
    ("service-unavailable", "An unplugged cable", lambda c: ground() + scaled(plug(46, 10), 86, 96, 1.6)),
    ("not-found", "A map pin", lambda c: ground() + map_pin(160, 82, 32)),
    ("privacy", "A shield with a lock", lambda c: ground() + shield(160, 112, 1.4)),
    ("terms", "A page of terms and a pen", lambda c: ground() + document(124, 56, 72, 96, lines=5) + pen(186, 168)),
    ("invite", "An invitation with a key", lambda c: ground() + envelope(110, 88, 100, 66, mark="key")),
    ("assistant", "The Saral mark and a chat bubble",
     lambda c: ground() + saral_mark(70, 92, 72) + chat_lines(156, 56, 118, 64)),
    ("assistant-thinking", "The Saral mark with three dots",
     lambda c: ground() + saral_mark(76, 84, 80) + bubble(170, 70, 90, 54)),
]


def compose(cache: str, out: str) -> list[str]:
    os.makedirs(out, exist_ok=True)
    written = []
    for name, title, build in SLOTS:
        art = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}"><title>{title}. Open Peeps by Pablo Stanley, CC0.</title>'
            f"{build(cache)}</svg>\n"
        )
        path = os.path.join(out, name + ".svg")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(art)
        written.append(path)
    return written


if __name__ == "__main__":
    cache_dir, out_dir = sys.argv[1], sys.argv[2]
    for path in compose(cache_dir, out_dir):
        print(path)
