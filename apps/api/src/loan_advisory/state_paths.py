"""Where the agent's mutable state lives.

One precedence rule per artifact: explicit constructor argument > its environment variable > AGENT_STATE_DIR > the
legacy/default path. Resolution never moves, copies, truncates or chmods existing files. When an override points away
from a legacy file that still exists it warns, because new records would otherwise silently split between two files.

New directories are created with mode 0700 and new files with 0600 on POSIX (mode is ignored on Windows). Existing
paths keep their permissions: O_CREAT only applies the mode when the file is created.
"""
import logging
import os
from pathlib import Path
from typing import IO

STATE_DIR_ENV = "AGENT_STATE_DIR"
LIVE_TRACE_DIR = "/root/hx/loan/agent/traces"
AUDIT_LOG, HANDOFF_LOG, TRACE_DIR = "turns.jsonl", "handoffs.jsonl", "traces"

_LOG = logging.getLogger(__name__)


def resolve(explicit: str | Path | None, env_var: str, name: str, default: str | Path,
            legacy: str | Path | None = None, env=None) -> Path:
    env = os.environ if env is None else env
    if explicit:
        path = Path(explicit)
    elif env.get(env_var):
        path = Path(env[env_var])
    elif env.get(STATE_DIR_ENV):
        path = Path(env[STATE_DIR_ENV]) / name
    else:
        path = Path(default)  # no location configured: adopt the legacy/default file where it already is
    if legacy is not None and path != Path(legacy) and Path(legacy).exists():
        _LOG.warning("legacy state file %s left in place; new records go to %s (no automatic migration)",
                     legacy, path)
    return path


def ensure_private_dir(path: Path) -> None:
    """Create missing directories with 0700, leaf first, without touching directories that already exist."""
    missing = []
    for p in (path, *path.parents):
        if p.exists():
            break
        missing.append(p)
    for p in reversed(missing):
        p.mkdir(mode=0o700, exist_ok=True)


def append_private(path: Path) -> IO[str]:
    """Open `path` for appending, creating it with 0600 and its parents with 0700 when new."""
    ensure_private_dir(path.parent)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    return os.fdopen(fd, "a")


def write_private(path: Path, text: str) -> None:
    """Create `path` with 0600 and its parents with 0700. An existing file is never overwritten."""
    ensure_private_dir(path.parent)
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        return
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)


__all__ = ["AUDIT_LOG", "HANDOFF_LOG", "LIVE_TRACE_DIR", "TRACE_DIR", "append_private", "ensure_private_dir",
           "resolve", "write_private"]
