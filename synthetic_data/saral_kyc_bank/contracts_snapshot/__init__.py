"""Vendored copies of the Saral contracts this dataset must match one-to-one.

Copied byte-for-byte from feat/saral-contracts-zen-design @ cc202ae (contracts/*.json), which is
3453bde plus the ADR-0007/0009/0010 commits that reconciled the synthetic source paths with this dataset.
``PINNED`` records each file's sha256; a test fails if a file is edited by hand. When the contracts
branch moves, copy the three files again and update PINNED.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE_COMMIT = "cc202ae (feat/saral-contracts-zen-design)"
PINNED = {
    "data_dictionary.json": "1071d5f29bff82f116256b3de1546dcede9475483b788761115072a121e86411",
    "synthetic_sources.json": "3e69f33873c5da1571eabc7c54c75bd8cc53d05c6dee3804121f4df222f9f70e",
    "what_if_contract.json": "9d9823dd3af01992919861ce74356c2c63b6beaf0713d70ab19d33c5ac474750",
}


def load(name: str) -> dict:
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def sha256(name: str) -> str:
    return hashlib.sha256((HERE / name).read_bytes()).hexdigest()


DATA_DICTIONARY = load("data_dictionary.json")
SYNTHETIC_SOURCES = load("synthetic_sources.json")
WHAT_IF = load("what_if_contract.json")
