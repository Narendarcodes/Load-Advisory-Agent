"""Where the agent's mutable state lives.

One precedence rule per artifact: explicit constructor argument > its environment variable > AGENT_STATE_DIR > the
legacy/default path. Resolution never moves, copies, truncates or chmods existing files. When an override points away
from a legacy file that still exists it warns, because new records would otherwise silently split between two files.

New directories are created with mode 0700 and new files with 0600 on POSIX (mode is ignored on Windows). Existing
paths keep their permissions: O_CREAT only applies the mode when the file is created.

The two JSONL logs (turn audit, handoff queue) are operational state, not borrower records, and they had no
retention rule at all: one long-lived process grew them until the disk filled. `append_line` bounds the active
file by moving it aside under a dated name — rotation never deletes rows, so nothing is lost by capping it.
"""
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import IO

STATE_DIR_ENV = "AGENT_STATE_DIR"
LIVE_TRACE_DIR = "/root/hx/loan/agent/traces"
AUDIT_LOG, HANDOFF_LOG, TRACE_DIR = "turns.jsonl", "handoffs.jsonl", "traces"
LOG_MAX_BYTES_ENV = "AGENT_LOG_MAX_BYTES"
DEFAULT_LOG_MAX_BYTES = 50 * 1024 * 1024

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


def log_max_bytes(env=None) -> int:
    """The active-log size cap. Unset is the default, `0` means never rotate, a bad value is the default."""
    raw = (os.environ if env is None else env).get(LOG_MAX_BYTES_ENV)
    if not raw or not raw.strip():
        return DEFAULT_LOG_MAX_BYTES
    try:
        return max(0, int(raw))
    except ValueError:
        _LOG.warning("%s=%r is not a number; using %d bytes", LOG_MAX_BYTES_ENV, raw, DEFAULT_LOG_MAX_BYTES)
        return DEFAULT_LOG_MAX_BYTES


def append_line(path: str | Path, line: str, max_bytes: int | None = None) -> Path:
    """Append one JSONL row, rotating the active file away first when it has reached the cap.

    Rotation renames, it never deletes: the rows continue in a dated companion file, so capping the
    active log cannot drop a queued handoff or an audit trail. The archive name is only used when it is
    free — a second rotation inside the same timestamp would otherwise overwrite the first archive and
    destroy those rows. Returns the file actually written to.
    `OSError` propagates — the caller is the one who knows what a failed write means for this request.
    """
    target = Path(path)
    cap = log_max_bytes() if max_bytes is None else max_bytes
    if cap and target.exists() and target.stat().st_size >= cap:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        candidate = target.with_name(f"{target.stem}-{stamp}{target.suffix}")
        suffix = 1
        while candidate.exists():                     # never rotate onto a file that already holds rows
            candidate = target.with_name(f"{target.stem}-{stamp}-{suffix}{target.suffix}")
            suffix += 1
        target.replace(candidate)
    with append_private(target) as f:
        f.write(line)
    return target


def write_private(path: Path, text: str) -> None:
    """Create `path` with 0600 and its parents with 0700. An existing file is never overwritten."""
    ensure_private_dir(path.parent)
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        return
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)


__all__ = ["AUDIT_LOG", "DEFAULT_LOG_MAX_BYTES", "HANDOFF_LOG", "LIVE_TRACE_DIR", "LOG_MAX_BYTES_ENV", "TRACE_DIR",
           "append_line", "append_private", "ensure_private_dir", "log_max_bytes", "resolve", "write_private"]
