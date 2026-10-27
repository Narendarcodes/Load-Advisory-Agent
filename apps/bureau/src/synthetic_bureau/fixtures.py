"""Load the committed 120-case fixture."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from synthetic_bureau.settings import DEFAULT_FIXTURE_PATH


@lru_cache(maxsize=4)
def load_fixture(path: str | None = None) -> dict:
    p = Path(path) if path else DEFAULT_FIXTURE_PATH
    if not p.exists():
        return {"schema": "bureau-cases/1", "cases": []}
    return json.loads(p.read_text(encoding="utf-8"))


def case_index(path: str | None = None) -> dict[str, dict]:
    return {c["application"]["application_id"]: c for c in load_fixture(path).get("cases", [])}


def case_for(application_id: str, path: str | None = None) -> dict | None:
    return case_index(path).get(application_id)
