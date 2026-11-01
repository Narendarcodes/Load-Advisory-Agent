"""Canonical loan lifecycle (schema `loan-lifecycle/1`).

One table, loaded from `lifecycle.json` next to the app's `hooks.py` and kept
byte-identical to the repository copy at `config/loan_lifecycle.json` by
`tests/test_lifecycle_contract.py`. The portal owns `custom_lifecycle_state`; Lending
owns the native `status`; the mapping between them is explicit here, never inferred
at a call site.

This module is deliberately pure Python (no `frappe` import) so both the portal and
the FastAPI decision pipeline can load the same contract.
"""

import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent / "lifecycle.json"
_TABLE = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

SCHEMA = _TABLE["schema"]
STATES = tuple(_TABLE["states"])
TERMINAL = frozenset(_TABLE["terminal"])
BORROWER_ACTIONS = frozenset(_TABLE["borrower_actions"])
TRANSITIONS = {state: frozenset(targets) for state, targets in _TABLE["transitions"].items()}
AUTOMATED_TRANSITIONS = {
    state: frozenset(targets) for state, targets in _TABLE["automated_transitions"].items()
}
NATIVE_STATUS = dict(_TABLE["native_status"])
NATIVE_TO_STATE = dict(_TABLE["native_to_state"])


class IllegalTransition(ValueError):
    pass


def states_text() -> str:
    """The Select options string, in canonical order (DRAFT first: a new record's default)."""
    return "\n".join(STATES)


def native_status_for(state: str) -> str:
    try:
        return NATIVE_STATUS[state]
    except KeyError:
        raise ValueError(f"unknown lifecycle state: {state!r}") from None


def state_for_native(status: str) -> str | None:
    """Explicit adapter for the two unambiguous native statuses; `Open` is not a state."""
    return NATIVE_TO_STATE.get(status)


def check_transition(source: str, target: str) -> None:
    if target not in TRANSITIONS.get(source, frozenset()):
        raise IllegalTransition(f"{source} -> {target} is not allowed")


def check_automated_transition(source: str, target: str) -> None:
    """The agent reviews an application atomically: it may collapse
    `state -> UNDER_REVIEW -> target` into one persisted transition, but it may
    never move a terminal record, a draft, or a state the table does not allow."""
    if target == source:
        return  # idempotent replay; no state change is being claimed
    if source in TERMINAL:
        raise IllegalTransition(f"{source} is terminal; {target} requires a human decision")
    if target not in AUTOMATED_TRANSITIONS.get(source, frozenset()):
        raise IllegalTransition(f"{source} -> {target} is not an automated transition")


def reconcile(portal_state: str, native_status: str, docstatus: int) -> dict:
    """Compare the two sources of truth without writing anything.

    - `IN_SYNC`          both agree on the mapped value.
    - `PENDING_LENDING`  a submitted decision is final in the portal, and the agent
                         correctly left the native status to Lending.
    - `OUT_OF_SYNC`      a draft decision never reached the native status.
    - `CONFLICT`         the two sources name different terminal outcomes.
    - `UNKNOWN`          one side holds a value outside the table.
    """
    if portal_state not in STATES:
        return {"status": "UNKNOWN", "expected": None, "reason": "unknown portal state"}
    expected = NATIVE_STATUS[portal_state]
    if native_status == expected:
        return {"status": "IN_SYNC", "expected": expected, "reason": ""}
    mapped = state_for_native(native_status)
    if mapped is not None and mapped != portal_state:
        return {"status": "CONFLICT", "expected": expected,
                "reason": f"native {native_status!r} maps to {mapped}"}
    if portal_state in ("APPROVED", "REJECTED") and native_status == "Open":
        status = "PENDING_LENDING" if docstatus == 1 else "OUT_OF_SYNC"
        return {"status": status, "expected": expected,
                "reason": "submitted decisions are closed by Lending" if docstatus == 1
                else "a draft decision did not reach the native status"}
    return {"status": "UNKNOWN", "expected": expected,
            "reason": f"native status {native_status!r} is outside the table"}
