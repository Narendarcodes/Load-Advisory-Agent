"""Every ZEN input name, read from the vendored data dictionary (contracts_snapshot, @ cc202ae).

``CATALOGUE_INPUTS`` maps each dictionary field to the rules that use it. ``ZEN_DATA_POINTS`` maps
each contracts/zen.py DataPointName to the dictionary field(s) it aliases. The dictionary's own
``zen_input_class`` decides APPLICANT / POLICY_PARAMETER / ZEN_PRODUCED, so the dataset and the
contract cannot drift: a test asserts ``zen_inputs`` keys equal the APPLICANT fields exactly.
"""
from __future__ import annotations

from .contracts_snapshot import DATA_DICTIONARY

FIELDS = {f["name"]: f for f in DATA_DICTIONARY["fields"]}
CATALOGUE_INPUTS: dict[str, list[str]] = {n: list(f["used_by_rules"]) or ["(dictionary only)"] for n, f in sorted(FIELDS.items())}
INPUT_CLASS: dict[str, str] = {n: f["zen_input_class"] for n, f in FIELDS.items()}
ZEN_DATA_POINTS: dict[str, str | list[str]] = dict(DATA_DICTIONARY["zen_data_point_aliases"])
