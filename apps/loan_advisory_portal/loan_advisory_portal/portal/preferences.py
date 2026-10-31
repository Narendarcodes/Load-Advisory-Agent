"""Canonical borrower preference vocabulary (schema `borrower-preferences/1`).

One table, loaded from `borrower_preferences.json` next to the app's `hooks.py` and kept
byte-identical to the repository copy at `config/borrower_preferences.json` by
`tests/test_preference_vocabulary.py`. The values are the agent's vocabulary — the same
`en | hi | te` locales and `low | medium | high` literacy levels that
`apps/api/src/loan_advisory/agent/contracts.py` validates — so the profile can only offer
an answer language and a reading level the agent can actually produce.

`aliases` keeps stored values from older profiles readable (`standard`/`plain`) and maps
Marathi to English because the agent has no Marathi content. Reads normalise; the profile
API stores only canonical values.

Deliberately pure Python (no `frappe` import) so the vocabulary is testable on its own.
"""

import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent / "borrower_preferences.json"
_TABLE = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

SCHEMA = _TABLE["schema"]
LOCALES = tuple(item["code"] for item in _TABLE["locales"])
LOCALE_LABELS = {item["code"]: item["label"] for item in _TABLE["locales"]}
LITERACIES = tuple(item["value"] for item in _TABLE["literacy"])
LITERACY_LABELS = {item["value"]: item["label"] for item in _TABLE["literacy"]}
_LOCALE_ALIASES = dict(_TABLE.get("aliases", {}).get("locale", {}))
_LITERACY_ALIASES = dict(_TABLE.get("aliases", {}).get("literacy", {}))

DEFAULT_LOCALE = "en"
DEFAULT_LITERACY = "medium"


def _clean(value) -> str:
	return str(value or "").strip().lower()


def canonical_locale(value) -> str | None:
	"""Canonical code for `value`, or None when it is neither offered nor an alias."""
	code = _clean(value)
	code = _LOCALE_ALIASES.get(code, code)
	return code if code in LOCALES else None


def canonical_literacy(value) -> str | None:
	code = _clean(value)
	code = _LITERACY_ALIASES.get(code, code)
	return code if code in LITERACIES else None


def normalise_locale(value) -> str:
	"""Read path: unknown or missing values fall back to the documented default."""
	return canonical_locale(value) or DEFAULT_LOCALE


def normalise_literacy(value) -> str:
	return canonical_literacy(value) or DEFAULT_LITERACY


def locale_options() -> list[dict]:
	return [{"code": code, "label": LOCALE_LABELS[code]} for code in LOCALES]


def literacy_options() -> list[dict]:
	return [{"value": value, "label": LITERACY_LABELS[value]} for value in LITERACIES]
