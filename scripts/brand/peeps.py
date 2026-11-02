"""Compose the Saral portal illustrations from Open Peeps (Pablo Stanley, CC0 1.0).

Every slot is one Open Peeps figure, unchanged (black ink line, white fills), placed on a 320x240
canvas with a soft coral-tint ground and, where the scene needs one, a simple prop drawn here
(document, phone, clock, chat bubble, folder). Coral appears only on the props and the ground.

    python scripts/brand/peeps.py <cache-dir> <out-dir>
    npx svgo --multipass --config scripts/brand/svgo.config.cjs <out-dir>/*.svg

Sources: openpeeps.com links these SVGs from cdn.prod.website-files.com. The exact URL of every
figure used is in SOURCES below and in docs/ASSETS.md. CC0 allows scripted download and
modification; no attribution is required (a courtesy credit is on the Help page).
"""

import os
import re
import sys
import urllib.request

SOURCES = {
    "peep-46": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53570264109d16a7014c37_peep-46.svg",
    "peep-10": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53515e2b568a43f515edd5_peep-10.svg",
    "peep-39": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535637d87131637b0e4379_peep-39.svg",
    "peep-60": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5358a764109d50aa01705d_peep-60.svg",
    "peep-2": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532a4c258ffe237b8ef2c1_peep-2.svg",
    "peep-68": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535997e35d380ada67ad80_peep-68.svg",
    "peep-80": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535b00550b76252bf719e6_peep-80.svg",
    "peep-93": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535c7a550b76084df7d544_peep-93.svg",
    "peep-102": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535d808becbf7162555033_peep-102.svg",
    "peep-67": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53596f8e24933d7a06b0c7_peep-67.svg",
    "peep-sitting-12": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f438becbf2fab5619bb_peep-sitting-12.svg",
    "peep-sitting-18": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536006c67e7976719986dc_peep-sitting-18.svg",
    "peep-standing-16": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53622ec67e7957fc9b32e0_peep-standing-16.svg",
    "peep-standing-18": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536266c99250fe47cebfc0_peep-standing-18.svg",
    "peep-standing-17": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53624b9b55b0127f5851cf_peep-standing-17.svg",
    "peep-standing-23": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5362fa8becbf1d50570b23_peep-standing-23.svg",
    "peep-standing-24": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5363188becbffe8c57172c_peep-standing-24.svg",
    "peep-standing-13": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5361ccd3992383f7595afc_peep-standing-13.svg",
    "peep-105": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535dd92b568a729c1c42f5_peep-105.svg",
    "peep-sitting-1": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532c65d871315ee7fcae9e_peep-sitting-1.svg",
    "peep-standing-25": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53633a7371bbe22da4c986_peep-standing-25.svg",
    "peep-77": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535aa1d871310896104715_peep-77.svg",
    "peep-standing-22": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5362e2f5fa1aefa7ffe47c_peep-standing-22.svg",
    "peep-sitting-14": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f7d9b55b097be57089f_peep-sitting-14.svg",
    "peep-7": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5350f9d399238698511b2f_peep-7.svg",
    "peep-103": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535da59588e079598123fc_peep-103.svg",
    "peep-standing-19": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536281c992503d98cecdc1_peep-standing-19.svg",
    "peep-sitting-17": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535fd95197054606a88bd2_peep-sitting-17.svg",
    "peep-sitting-6": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535e9fc992502f35cd7902_peep-sitting-6.svg",
    "peep-sitting-15": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f96c67e7961f5994532_peep-sitting-15.svg",
    "peep-standing-10": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53613f9b55b0a5a457c452_peep-standing-10.svg",
    "peep-38": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53560d9b55b04007535350_peep-38.svg",
    "peep-26": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5353e82b568af2d916cbbd_peep-26.svg",
    "peep-standing-14": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5361e9f3aa4be48230418f_peep-standing-14.svg",
    "peep-8": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53510f2b568ad72715a304_peep-8.svg",
    "peep-sitting-11": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f2ad39923f7d558435b_peep-sitting-11.svg",
    "peep-sitting-4": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535e658e24935b1b096148_peep-sitting-4.svg",
    "peep-59": "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5358878e2493fbea064dd9_peep-59.svg",
}

CORAL = "#FE7D6B"
PEACH = "#FF8F68"
SOFT = "#FDECE6"
INK = "#000000"
WHITE = "#FFFFFF"
LINE = "#E3D8CF"

W, H = 320, 240


def fetch(cache: str, name: str) -> str:
    path = os.path.join(cache, name + ".svg")
    if not os.path.exists(path):
        url = SOURCES[name]
        if not url:
            raise SystemExit(f"no source URL for {name}")
        with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310 - fixed CC0 CDN URLs
            data = response.read()
        with open(path, "wb") as handle:
            handle.write(data)
    return open(path, encoding="utf-8").read()


def figure(cache: str, name: str, x: float, y: float, height: float, prefix: str) -> str:
    """The peep as a nested <svg>, scaled to `height`, ids prefixed so files stay self-contained."""
    raw = fetch(cache, name)
    match = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', raw)
    vw, vh = float(match.group(1)), float(match.group(2))
    width = height * vw / vh
    body = raw[raw.index(">", raw.index("<svg")) + 1 : raw.rindex("</svg>")]
    body = re.sub(r"<title>.*?</title>|<desc>.*?</desc>|<!--.*?-->", "", body, flags=re.S)
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}-{m.group(1)}"', body)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}-{m.group(1)})", body)
    body = re.sub(r'xlink:href="#([^"]+)"', lambda m: f'xlink:href="#{prefix}-{m.group(1)}"', body)
    return (
        f'<svg x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" viewBox="0 0 {vw:g} {vh:g}">'
        f"{body}</svg>"
    )


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


# ---------------------------------------------------------------- slots

# (file, title, peep, figure x, figure y, figure height, props builder)
SLOTS = [
    ("login", "A person working on a laptop", "peep-46", 70, 20, 220, lambda: ground(160, 140, 135, 90) + bubble(214, 28, 76, 46)),
    ("dashboard", "A person pointing at a rising chart", "peep-standing-16", 70, 8, 230, lambda: ground() + chart(186, 40)),
    ("wizard-about", "A person beside their profile card", "peep-standing-18", 60, 8, 230, lambda: ground() + card_id(180, 70)),
    ("wizard-loan", "A person working out a monthly amount on their phone", "peep-10", 64, 24, 216, lambda: ground() + coin(232, 70) + coin(258, 112, 14)),
    ("wizard-documents", "A person pointing to a stack of documents", "peep-standing-17", 52, 8, 230, lambda: ground() + document(200, 88, 58, 74) + document(186, 100, 58, 74, accent=True)),
    ("decision", "A person reading a decision letter", "peep-39", 70, 24, 216, lambda: ground() + document(212, 46, 58, 74, mark="tick")),
    ("assistant", "A person asking a question", "peep-60", 54, 24, 216, lambda: ground() + bubble(200, 34, 92, 54)),
    ("empty-applications", "A person with an empty folder", "peep-2", 30, 34, 206, lambda: ground() + folder(204, 120)),
    ("empty-documents", "A person beside an empty tray", "peep-68", 30, 34, 206, lambda: ground() + tray(196, 160)),
    ("assessment-pending", "A person waiting, with a clock", "peep-sitting-12", 34, 30, 204, lambda: ground() + clock(244, 74, 28) + floor()),
    ("processing", "A person waiting with a cup while documents are checked", "peep-102", 40, 24, 216, lambda: ground() + document(212, 58, 54, 70, lines=3) + clock(270, 56, 18)),
    ("submitted", "A person who has just sent their application", "peep-standing-23", 46, 8, 230, lambda: ground() + document(208, 70, 58, 74, mark="tick")),
    ("missing-info", "A puzzled person and a form with a question", "peep-80", 40, 24, 216, lambda: ground() + document(206, 60, 58, 74, mark="question")),
    ("service-unavailable", "A worried person and an unplugged cable", "peep-93", 30, 24, 216, lambda: ground() + plug(236, 96)),
    ("documents-header", "A person sitting with their papers", "peep-sitting-18", 64, 26, 200, lambda: ground() + document(210, 70, 54, 70, lines=3) + floor()),
    ("profile-header", "A person standing at ease", "peep-standing-13", 112, 8, 230, lambda: ground() + card_id(200, 60, 76, 52)),
    ("help-header", "A person explaining something", "peep-standing-24", 64, 8, 230, lambda: ground() + bubble(194, 34, 86, 50)),
    # v3: results, loading and the pages that had no scene
    ("approved", "A delighted person with an approved letter", "peep-105", 40, 30, 210, lambda: ground() + confetti() + document(212, 52, 58, 74, mark="tick")),
    ("not-approved", "A person sitting and thinking about what to do next", "peep-sitting-1", 34, 52, 186, lambda: ground() + signpost(214, 40) + floor()),
    ("withdrawn", "A person walking on with a closed folder", "peep-standing-25", 60, 8, 230, lambda: ground() + closed_folder(184, 120)),
    ("checking", "A person thinking while a document is checked under a magnifier", "peep-77", 30, 30, 210, lambda: ground() + document(204, 54, 58, 74, lines=4, accent=True) + magnifier(250, 120, 22)),
    ("eligibility", "A person pointing at a borrowing range", "peep-standing-22", 44, 8, 230, lambda: ground() + range_bar(180, 66, 116)),
    ("eligibility-result", "A person in a wheelchair pleased with an estimate", "peep-sitting-14", 30, 34, 200, lambda: ground() + range_bar(196, 44, 104) + floor()),
    ("eligibility-outside", "A person shrugging at an estimate outside the range", "peep-7", 26, 30, 210, lambda: ground() + range_bar(206, 56, 96, marker=0.12, outside=True)),
    ("calculating", "A person working something out on a phone beside a calculator", "peep-103", 34, 30, 210, lambda: ground() + calculator(222, 62)),
    ("products", "A person looking over loan options", "peep-standing-19", 70, 8, 230, lambda: ground() + cards_stack(184, 60)),
    ("kyc", "A person holding a phone next to an identity card", "peep-67", 34, 30, 210, lambda: ground() + phone(206, 52) + card_id(226, 120, 76, 52)),
    ("repayments", "A person sitting beside a repayment calendar and a coin", "peep-sitting-17", 30, 40, 196, lambda: ground() + calendar(196, 40) + coin(270, 150, 16) + floor()),
    ("repayments-empty", "A person beside an empty calendar", "peep-sitting-6", 30, 40, 196, lambda: ground() + calendar(196, 52, empty=True) + floor()),
    ("feedback", "A person in a wheelchair sharing what they think", "peep-sitting-15", 24, 36, 198, lambda: ground() + star_bubble(198, 30) + floor()),
    ("feedback-sent", "A person whose message has been sent", "peep-standing-10", 70, 8, 230, lambda: ground() + envelope(180, 86, mark="tick")),
    ("privacy", "A person with a cup next to a shield and lock", "peep-38", 34, 30, 210, lambda: ground() + shield(250, 96, 1.15)),
    ("terms", "A person reading terms with a pen nearby", "peep-26", 34, 30, 210, lambda: ground() + document(208, 46, 60, 78, lines=5) + pen(246, 150)),
    ("invite", "A person with an invitation and a key", "peep-standing-14", 70, 8, 230, lambda: ground() + envelope(176, 88, mark="key")),
    ("not-found", "A person looking for a page with a magnifier", "peep-8", 34, 30, 210, lambda: ground() + magnifier(246, 90, 28)),
    ("assistant-thinking", "A person thinking, with a thought bubble", "peep-sitting-11", 24, 50, 186, lambda: ground() + thought(196, 24) + floor()),
    ("handoff", "A person asking for a person to help", "peep-59", 40, 30, 210, lambda: ground() + person_bubble(206, 34, 88, 56)),
]


def compose(cache: str, out: str) -> list[str]:
    os.makedirs(out, exist_ok=True)
    written = []
    for name, title, peep, x, y, height, props in SLOTS:
        art = (
            f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}"><title>{title}. Open Peeps by Pablo Stanley, CC0.</title>'
            f"{props()}{figure(cache, peep, x, y, height, name)}</svg>\n"
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
