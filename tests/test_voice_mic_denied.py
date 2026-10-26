"""A denied microphone leaves the voice page in a clear error state (GUI test F-04, run 3).

The room was joined before the microphone was requested. When the browser refused the microphone the page
showed "error: Permission denied", but the room stayed connected: the agent joined, greeted, and the
active-speaker handler replaced the error with "assistant speaking" within ~2 s, so the applicant heard the
assistant but could not speak and no longer saw why. The error path now leaves the room before showing the
error, so nothing overwrites it and Start begins a fresh attempt.
"""
import re
from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / "apps" / "web" / "chat" / "voice.html").read_text(encoding="utf-8")


def test_error_path_disconnects_the_room_before_showing_the_error():
    m = re.search(r"\}\s*catch\s*\(e\)\s*\{(.*?)\n", HTML)
    assert m, "start handler catch block not found"
    body = m.group(1)
    disc = re.search(r"\b\w+\.disconnect\(\)", body)
    assert disc and "room = null" in body, body
    assert disc.start() < body.index('"error: "') and body.index("room = null") < body.index('"error: "'), body
