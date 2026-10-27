"""The voice page stacks into one column on a phone (GUI test F-03).

At 390 px the fixed `360px 1fr` grid overflowed horizontally by ~154 px. The text chat page already collapses
to one column under 900 px; the voice page now does the same, and its header wraps.
"""
import re
from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / "apps" / "web" / "chat" / "voice.html").read_text(encoding="utf-8")


def _media_blocks(css):
    return re.findall(r"@media\s*\(max-width:\s*(\d+)px\)\s*\{(.*?)\}\s*\}", css, re.S)


def test_voice_grid_collapses_to_one_column_on_narrow_screens():
    blocks = _media_blocks(HTML)
    assert any(int(w) >= 760 and re.search(r"main\s*\{[^}]*grid-template-columns:\s*1fr\s*;", b + "}") for w, b in blocks), blocks


def test_voice_header_wraps_on_narrow_screens():
    assert any("header" in b and "flex-wrap" in b for _, b in _media_blocks(HTML))
