"""Shared helpers for the offline contract tests. No network, no services, synthetic ids only."""
import copy
import json
from pathlib import Path

import pytest

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def load(name: str):
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


@pytest.fixture
def fx():
    """Return a fresh deep copy of a fixture, so a test can mutate it freely."""
    return lambda name: copy.deepcopy(load(name))
