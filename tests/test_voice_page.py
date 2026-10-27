"""/voice page: caption contrast (WCAG 2.1 AA, 4.5:1 for small text) of the speech-to-text caption in the blue user bubble."""
import re

from decision_engine.paths import repo_root

PAGE = repo_root() / "apps" / "web" / "chat" / "voice.html"


def _lum(hexcol):
    h = hexcol.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _css():
    return PAGE.read_text(encoding="utf-8").split("<style>")[1].split("</style>")[0]


def _vars(css):
    return dict(re.findall(r"--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})", css))


def _color_of(css, selector, prop):
    """Last declaration of `prop` in a rule whose selector list contains exactly `selector`."""
    val = None
    for sel, body in re.findall(r"([^{}]+)\{([^}]*)\}", css):
        if selector in [x.strip() for x in sel.split(",")]:
            m = re.search(r"(?<![\w-])" + re.escape(prop) + r"\s*:\s*([^;]+)", body)
            if m:
                val = m.group(1).strip()
    if val and val.startswith("var("):
        val = _vars(css)[val[6:-1]]
    return val


def test_user_bubble_caption_meets_wcag_aa():
    css = _css()
    bubble = _color_of(css, ".u", "background")
    caption = _color_of(css, ".u .meta", "color") or _color_of(css, ".meta", "color")
    assert re.fullmatch(r"#[0-9a-fA-F]{3,6}", caption or ""), f"caption colour must be an opaque hex, got {caption!r}"
    assert contrast(caption, bubble) >= 4.5, (caption, bubble, round(contrast(caption, bubble), 2))


def test_user_bubble_text_and_assistant_caption_meet_wcag_aa():
    css = _css()
    assert contrast(_color_of(css, ".u", "color"), _color_of(css, ".u", "background")) >= 4.5
    assert contrast(_color_of(css, ".meta", "color"), _color_of(css, ".a", "background")) >= 4.5
