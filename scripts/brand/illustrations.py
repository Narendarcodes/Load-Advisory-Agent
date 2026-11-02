"""Original flat placeholder illustrations for the Saral portal.

These are NOT Storyset artwork. They are simple, consistent placeholders drawn from shared
primitives so every screen has an illustration in one style until licensed Storyset "Cuate"
artwork is downloaded by a person and swapped in (see docs/ASSETS.md).

    python scripts/brand/illustrations.py apps/loan_advisory_portal/loan_advisory_portal/public/illustrations
"""

import os
import sys

CORAL = "#FE7D6B"
PEACH = "#FF8F68"
SOFT = "#FDECE6"
PAPER = "#F7F3EE"
INK = "#241C1B"
LINE = "#E3D8CF"
SKIN = "#B7775C"
SKIN2 = "#8D5B4C"
SAGE = "#7D8B6D"
WHITE = "#FFFFFF"


def blob(cx=160, cy=128, rx=128, ry=92):
    return (
        f'<path d="M{cx - rx} {cy} C{cx - rx} {cy - ry * 0.9} {cx - rx * 0.35} {cy - ry} {cx + rx * 0.1} {cy - ry * 0.95} '
        f'C{cx + rx * 0.8} {cy - ry * 0.9} {cx + rx} {cy - ry * 0.35} {cx + rx} {cy + ry * 0.1} '
        f'C{cx + rx} {cy + ry * 0.8} {cx + rx * 0.4} {cy + ry} {cx - rx * 0.15} {cy + ry * 0.95} '
        f'C{cx - rx * 0.8} {cy + ry * 0.9} {cx - rx} {cy + ry * 0.5} {cx - rx} {cy}Z" fill="{SOFT}"/>'
    )


def ground(y=212):
    return f'<rect x="40" y="{y}" width="240" height="3" rx="1.5" fill="{LINE}"/>'


def person(cx, base, skin=SKIN, shirt=CORAL, hair=INK, arm="down"):
    """Standing person, feet at `base`."""
    s = []
    s.append(f'<rect x="{cx - 14}" y="{base - 46}" width="11" height="46" rx="5" fill="{INK}"/>')
    s.append(f'<rect x="{cx + 3}" y="{base - 46}" width="11" height="46" rx="5" fill="{INK}"/>')
    s.append(f'<rect x="{cx - 20}" y="{base - 104}" width="40" height="64" rx="16" fill="{shirt}"/>')
    s.append(f'<rect x="{cx - 5}" y="{base - 112}" width="10" height="12" rx="4" fill="{skin}"/>')
    s.append(f'<circle cx="{cx}" cy="{base - 124}" r="15" fill="{skin}"/>')
    s.append(f'<path d="M{cx - 16} {base - 124} C{cx - 17} {base - 146} {cx + 17} {base - 146} {cx + 16} {base - 126} C{cx + 8} {base - 134} {cx - 6} {base - 134} {cx - 16} {base - 124}Z" fill="{hair}"/>')
    if arm == "up":
        s.append(f'<path d="M{cx + 16} {base - 96} L{cx + 34} {base - 124}" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    elif arm == "point":
        s.append(f'<path d="M{cx + 16} {base - 96} L{cx + 40} {base - 100}" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    else:
        s.append(f'<path d="M{cx + 18} {base - 96} L{cx + 22} {base - 62}" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    s.append(f'<path d="M{cx - 18} {base - 96} L{cx - 22} {base - 62}" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    return "".join(s)


def seated(cx, seat_y, skin=SKIN, shirt=CORAL, hair=INK):
    """Person seated on a stool, facing right toward a desk."""
    s = []
    s.append(f'<rect x="{cx - 18}" y="{seat_y}" width="36" height="6" rx="3" fill="{INK}"/>')
    s.append(f'<rect x="{cx - 3}" y="{seat_y + 6}" width="6" height="{212 - seat_y - 6}" fill="{INK}"/>')
    s.append(f'<path d="M{cx} {seat_y - 4} L{cx + 34} {seat_y - 4} L{cx + 34} {212}" stroke="{INK}" stroke-width="11" fill="none" stroke-linejoin="round" stroke-linecap="round"/>')
    s.append(f'<rect x="{cx - 20}" y="{seat_y - 66}" width="38" height="64" rx="16" fill="{shirt}"/>')
    s.append(f'<circle cx="{cx}" cy="{seat_y - 84}" r="15" fill="{skin}"/>')
    s.append(f'<path d="M{cx - 16} {seat_y - 84} C{cx - 17} {seat_y - 106} {cx + 17} {seat_y - 106} {cx + 16} {seat_y - 86} C{cx + 8} {seat_y - 94} {cx - 6} {seat_y - 94} {cx - 16} {seat_y - 84}Z" fill="{hair}"/>')
    s.append(f'<path d="M{cx + 10} {seat_y - 52} L{cx + 44} {seat_y - 38}" stroke="{skin}" stroke-width="9" stroke-linecap="round"/>')
    return "".join(s)


def desk(x, y, w=110):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="7" rx="3" fill="{INK}"/>'
        f'<rect x="{x + 8}" y="{y + 7}" width="6" height="{212 - y - 7}" fill="{INK}"/>'
        f'<rect x="{x + w - 14}" y="{y + 7}" width="6" height="{212 - y - 7}" fill="{INK}"/>'
    )


def laptop(x, y):
    return (
        f'<rect x="{x}" y="{y - 46}" width="64" height="44" rx="5" fill="{INK}"/>'
        f'<rect x="{x + 5}" y="{y - 41}" width="54" height="34" rx="2" fill="{PAPER}"/>'
        f'<rect x="{x + 11}" y="{y - 34}" width="24" height="4" rx="2" fill="{CORAL}"/>'
        f'<rect x="{x + 11}" y="{y - 26}" width="38" height="3" rx="1.5" fill="{LINE}"/>'
        f'<rect x="{x + 11}" y="{y - 20}" width="30" height="3" rx="1.5" fill="{LINE}"/>'
        f'<rect x="{x - 8}" y="{y - 3}" width="80" height="5" rx="2.5" fill="{INK}"/>'
    )


def plant(x, base=212):
    return (
        f'<path d="M{x} {base - 26} C{x - 18} {base - 40} {x - 16} {base - 62} {x - 4} {base - 70} C{x - 2} {base - 50} {x + 2} {base - 40} {x} {base - 26}Z" fill="{SAGE}"/>'
        f'<path d="M{x + 2} {base - 26} C{x + 18} {base - 36} {x + 22} {base - 56} {x + 12} {base - 64} C{x + 8} {base - 46} {x + 4} {base - 36} {x + 2} {base - 26}Z" fill="{SAGE}" opacity=".8"/>'
        f'<path d="M{x - 12} {base - 28} L{x + 14} {base - 28} L{x + 10} {base} L{x - 8} {base}Z" fill="{PEACH}"/>'
    )


def doc(x, y, w=56, h=72, lines=4, mark=None, fill=WHITE):
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{INK}" stroke-width="3"/>']
    s.append(f'<rect x="{x + 10}" y="{y + 12}" width="{w * 0.45}" height="5" rx="2.5" fill="{CORAL}"/>')
    for i in range(lines):
        s.append(f'<rect x="{x + 10}" y="{y + 26 + i * 10}" width="{(w - 20) * (0.9 if i % 2 else 1)}" height="3.5" rx="1.75" fill="{LINE}"/>')
    if mark:
        s.append(badge(x + w - 4, y + h - 4, mark))
    return "".join(s)


def badge(cx, cy, kind, r=13):
    if kind == "check":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{CORAL}"/><path d="M{cx - 6} {cy} L{cx - 1.5} {cy + 5} L{cx + 6.5} {cy - 5}" stroke="{INK}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    if kind == "question":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{PEACH}"/><path d="M{cx - 4.5} {cy - 4} C{cx - 4.5} {cy - 10} {cx + 5} {cy - 10} {cx + 5} {cy - 4} C{cx + 5} {cy} {cx} {cy} {cx} {cy + 3}" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="{cx}" cy="{cy + 8}" r="1.8" fill="{INK}"/>'
    if kind == "clock":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{WHITE}" stroke="{INK}" stroke-width="3"/><path d="M{cx} {cy - 7} L{cx} {cy} L{cx + 5} {cy + 3}" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    if kind == "plus":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{CORAL}"/><path d="M{cx - 6} {cy} H{cx + 6} M{cx} {cy - 6} V{cx * 0 + cy + 6}" stroke="{INK}" stroke-width="3.2" stroke-linecap="round"/>'
    return ""


def chart(x, y, w=96, h=70):
    bars = "".join(
        f'<rect x="{x + 12 + i * (w - 24) / 4:.1f}" y="{y + h - 12 - v * h / 70:.1f}" width="{(w - 24) / 4 - 6:.1f}" height="{v * h / 70:.1f}" rx="2" fill="{c}"/>'
        for i, (v, c) in enumerate([(14, LINE), (24, PEACH), (20, LINE), (36, CORAL)])
    )
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>{bars}'
        f'<path d="M{x + 12} {y + 34} Q{x + 40} {y + 30} {x + 52} {y + 22} T{x + w - 12} {y + 10}" stroke="{INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    )


def bubble(x, y, w, h, fill=WHITE, tail="left"):
    t = f'M{x + 14} {y + h} l-6 10 l14 -10' if tail == "left" else f'M{x + w - 20} {y + h} l12 10 l-2 -10'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{INK}" stroke-width="3"/><path d="{t}" fill="{fill}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'


def mark_bot(cx, cy, size=34):
    k = size / 64
    return (
        f'<g transform="translate({cx - size / 2} {cy - size / 2}) scale({k})"><rect width="64" height="64" rx="16" fill="{CORAL}"/>'
        f'<path d="M11 39 Q17 34.5 22.5 38.5 L30 45 L52.5 19.5" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></g>'
    )


def cloud(x, y, broken=False):
    s = f'<path d="M{x} {y + 34} C{x - 18} {y + 34} {x - 18} {y + 8} {x + 2} {y + 8} C{x + 6} {y - 12} {x + 40} {y - 14} {x + 46} {y + 4} C{x + 68} {y} {x + 72} {y + 34} {x + 52} {y + 34}Z" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    if broken:
        s += f'<path d="M{x + 14} {y + 48} L{x + 22} {y + 58} L{x + 16} {y + 64} L{x + 26} {y + 76}" stroke="{CORAL}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        s += f'<path d="M{x + 40} {y + 48} L{x + 48} {y + 58} L{x + 42} {y + 64} L{x + 52} {y + 76}" stroke="{CORAL}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    return s


def folder(x, y, w=92, h=64):
    return (
        f'<path d="M{x} {y + 10} Q{x} {y} {x + 10} {y} H{x + 32} L{x + 40} {y + 8} H{x + w - 8} Q{x + w} {y + 8} {x + w} {y + 16} V{y + h - 8} Q{x + w} {y + h} {x + w - 8} {y + h} H{x + 8} Q{x} {y + h} {x} {y + h - 8}Z" fill="{PEACH}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<rect x="{x + 6}" y="{y + 18}" width="{w - 12}" height="{h - 24}" rx="5" fill="{SOFT}" stroke="{INK}" stroke-width="3"/>'
    )


def dots(x, y):
    return "".join(f'<circle cx="{x + i * 14}" cy="{y}" r="4" fill="{c}"/>' for i, c in enumerate([CORAL, PEACH, LINE]))


SCENES = {
    "login": (
        "A person working on a laptop at a desk",
        lambda: blob() + ground() + desk(150, 150) + laptop(176, 150) + seated(118, 152, shirt=CORAL) + plant(268),
    ),
    "dashboard": (
        "A person reviewing a rising chart",
        lambda: blob() + ground() + chart(150, 70, 110, 82) + person(110, 212, shirt=PEACH, arm="point", skin=SKIN2) + plant(58),
    ),
    "wizard-about": (
        "A person next to a profile form",
        lambda: blob() + ground() + doc(160, 66, 70, 92, lines=5) + f'<circle cx="182" cy="96" r="0"/>' + person(118, 212, shirt=CORAL, arm="point"),
    ),
    "wizard-loan": (
        "A person with a calculator-style loan card",
        lambda: blob() + ground() + f'<rect x="156" y="62" width="76" height="96" rx="10" fill="{WHITE}" stroke="{INK}" stroke-width="3"/><rect x="166" y="74" width="56" height="20" rx="4" fill="{SOFT}"/><rect x="172" y="81" width="30" height="6" rx="3" fill="{CORAL}"/>'
        + "".join(f'<rect x="{166 + c * 20}" y="{102 + r * 16}" width="14" height="10" rx="3" fill="{PEACH if (r + c) % 3 == 0 else LINE}"/>' for r in range(3) for c in range(3))
        + person(112, 212, shirt=PEACH, skin=SKIN2, arm="point"),
    ),
    "wizard-documents": (
        "A person uploading documents",
        lambda: blob() + ground() + doc(176, 54, 52, 66, lines=3) + doc(150, 82, 58, 76, lines=4, mark="plus") + person(104, 212, shirt=CORAL, arm="up"),
    ),
    "decision": (
        "A person reading a report",
        lambda: blob() + ground() + doc(152, 60, 76, 100, lines=5, mark="check") + chart(204, 128, 70, 50) + person(110, 212, shirt=PEACH, arm="point"),
    ),
    "assistant": (
        "Saral's mark and two chat bubbles",
        lambda: blob(rx=118, ry=86) + bubble(70, 62, 112, 40, fill=WHITE) + dots(98, 82) + bubble(136, 118, 112, 40, fill=SOFT, tail="right") + f'<rect x="152" y="132" width="64" height="5" rx="2.5" fill="{CORAL}"/><rect x="152" y="142" width="44" height="4" rx="2" fill="{LINE}"/>' + mark_bot(52, 176, 40),
    ),
    "empty-applications": (
        "An empty folder with a plus sign",
        lambda: blob() + ground() + folder(112, 100, 108, 76) + badge(222, 106, "plus", 16) + plant(70),
    ),
    "empty-documents": (
        "An empty document tray",
        lambda: blob() + ground() + f'<rect x="96" y="150" width="128" height="40" rx="10" fill="{PEACH}" stroke="{INK}" stroke-width="3"/><rect x="110" y="138" width="100" height="16" rx="6" fill="{WHITE}" stroke="{INK}" stroke-width="3" stroke-dasharray="6 6"/>' + doc(140, 62, 40, 50, lines=2, fill=PAPER),
    ),
    "assessment-pending": (
        "A report with a clock, waiting for review",
        lambda: blob() + ground() + doc(132, 58, 70, 94, lines=5) + badge(206, 150, "clock", 20) + plant(250),
    ),
    "processing": (
        "A person waiting while documents move along",
        lambda: blob() + ground() + doc(150, 96, 44, 56, lines=2) + doc(204, 76, 44, 56, lines=2, fill=SOFT) + f'<path d="M196 124 Q200 112 202 104" stroke="{CORAL}" stroke-width="3" fill="none" stroke-dasharray="4 5" stroke-linecap="round"/>' + person(104, 212, shirt=CORAL, skin=SKIN2),
    ),
    "submitted": (
        "A person celebrating a sent application",
        lambda: blob() + ground() + doc(162, 70, 64, 84, lines=4, mark="check") + person(112, 212, shirt=PEACH, arm="up") + dots(160, 52),
    ),
    "missing-info": (
        "A form with a question mark",
        lambda: blob() + ground() + doc(138, 58, 72, 96, lines=5, mark="question") + person(96, 212, shirt=CORAL, skin=SKIN2, arm="point"),
    ),
    "service-unavailable": (
        "A cloud with a broken connection",
        lambda: blob() + ground() + cloud(128, 70, broken=True) + plant(250),
    ),
}


def main(out: str) -> None:
    os.makedirs(out, exist_ok=True)
    for name, (title, draw) in SCENES.items():
        body = draw()
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240" role="img" aria-labelledby="t">'
            f'<title id="t">{title} (original placeholder illustration)</title>{body}</svg>\n'
        )
        with open(os.path.join(out, f"{name}.svg"), "w") as handle:
            handle.write(svg)
    print(f"wrote {len(SCENES)} illustrations to {out}")


if __name__ == "__main__":
    main(sys.argv[1])
