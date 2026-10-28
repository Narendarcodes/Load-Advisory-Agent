"""P9a-d: the voice worker writes its turn log through the shared private-file helper.

The worker cannot be imported without LiveKit, so this pins the call site at source level; the
permission behaviour of `append_private` itself is covered by tests/test_state_paths.py.
"""
from pathlib import Path

WORKER = Path(__file__).resolve().parents[1] / "apps" / "voice" / "agent_worker.py"


def test_voice_turn_log_uses_append_private():
    src = WORKER.read_text(encoding="utf-8")
    assert "append_private(Path(TURN_LOG))" in src
    assert "os.makedirs(os.path.dirname(TURN_LOG)" not in src
    assert 'open(TURN_LOG, "a")' not in src
