"""Repo-root helper (structural glue, no business logic)."""
from pathlib import Path


def repo_root() -> Path:
    for p in (Path(__file__).resolve(), *Path(__file__).resolve().parents):
        if (p / "pyproject.toml").exists():
            return p
    raise RuntimeError("repository root (pyproject.toml) not found")
