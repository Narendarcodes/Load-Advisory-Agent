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
