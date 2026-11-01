"""One lifecycle table, two runtimes: the repo copy and the Frappe app must not drift.

The portal loads `apps/loan_advisory_portal/loan_advisory_portal/lifecycle.json` next to
`hooks.py`; the FastAPI pipeline loads `config/loan_lifecycle.json`. Both are checked
against the same contract here, so a change on one side without the other fails CI.
"""
import json
from pathlib import Path

from loan_advisory.application import lifecycle

ROOT = Path(__file__).resolve().parents[1]
REPO_COPY = ROOT / "config" / "loan_lifecycle.json"
APP_COPY = ROOT / "apps" / "loan_advisory_portal" / "loan_advisory_portal" / "lifecycle.json"


def _table() -> dict:
    return json.loads(REPO_COPY.read_text(encoding="utf-8"))


def test_the_portal_vendored_copy_is_byte_identical():
    assert APP_COPY.read_bytes() == REPO_COPY.read_bytes()


def test_the_fastapi_module_loads_the_same_table():
    table = _table()
    assert lifecycle.STATES == tuple(table["states"])
    assert lifecycle.TRANSITIONS == {state: set(targets) for state, targets in table["transitions"].items()}
    assert lifecycle.AUTOMATED_TRANSITIONS == {
        state: set(targets) for state, targets in table["automated_transitions"].items()
    }
    assert lifecycle.NATIVE_STATUS == table["native_status"]


def test_the_table_is_internally_consistent():
    table = _table()
    states = set(table["states"])
    assert set(table["transitions"]) == states
    assert set(table["automated_transitions"]) <= states
    assert set(table["native_status"]) == states
    assert set(table["terminal"]) <= states
    for state, targets in table["transitions"].items():
        assert set(targets) <= states, f"{state} points outside the state set"
    assert not set(table["automated_transitions"]) & set(table["terminal"]), (
        "a terminal state must never be automated"
    )
    for source, targets in table["automated_transitions"].items():
        assert set(targets) <= states, f"{source} has an automated target outside the state set"
        # The agent may collapse `source -> UNDER_REVIEW -> target`, so an automated target
        # is legitimate only if the plain table can reach it in at most that one extra hop.
        reachable = set(table["transitions"][source])
        if "UNDER_REVIEW" in reachable:
            reachable |= set(table["transitions"]["UNDER_REVIEW"])
        assert set(targets) <= reachable, f"{source} claims an unreachable automated target"
    assert table["states"][0] == "DRAFT"  # Frappe Select default
    assert set(table["native_to_state"].values()) <= states
