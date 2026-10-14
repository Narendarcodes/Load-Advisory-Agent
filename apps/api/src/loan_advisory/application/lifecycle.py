"""Conventional (non-LLM) application lifecycle around the P0/P1 decision pipeline.

States (prototype workflow, not a regulator- or lender-mandated process):

    SUBMITTED ──start──> UNDER_REVIEW ──zen──> APPROVED | REJECTED
        ^                    │ missing/invalid input ──> INFO_REQUESTED ──resubmit──> SUBMITTED
        │                    └ contradictory data / engine error ──> MANUAL_REVIEW
    INFO_REQUESTED/SUBMITTED ──withdraw──> WITHDRAWN
    MANUAL_REVIEW ──reviewer──> APPROVED | REJECTED | INFO_REQUESTED
    REJECTED ──dispute──> MANUAL_REVIEW

Rules stay in ZEN; this module only routes. The decision itself comes from the
unchanged `decide()` orchestrator, and every evaluation produces a Decision Evidence
record (decision_engine/evidence/evidence_record.py) handed to an EvidenceSink.
What-if simulations are returned, never persisted, and never touch the source record.
"""
from dataclasses import dataclass, field

from decision_engine.evidence.evidence_record import SCORED_FIELDS, build_record
from decision_engine.policies.registry import PolicyIntegrityError, load_policy
from loan_advisory.application import decision_orchestrator
from loan_advisory.application.decision_orchestrator import decide
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication

STATES = ("SUBMITTED", "INFO_REQUESTED", "UNDER_REVIEW", "MANUAL_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN")
TRANSITIONS = {
    "SUBMITTED": {"UNDER_REVIEW", "WITHDRAWN"},
    "UNDER_REVIEW": {"APPROVED", "REJECTED", "INFO_REQUESTED", "MANUAL_REVIEW"},
    "INFO_REQUESTED": {"SUBMITTED", "WITHDRAWN"},
    "MANUAL_REVIEW": {"APPROVED", "REJECTED", "INFO_REQUESTED"},
    "REJECTED": {"MANUAL_REVIEW"},
    "APPROVED": set(),
    "WITHDRAWN": set(),
}
NATIVE_STATUS = {"APPROVED": "Approved", "REJECTED": "Rejected"}  # everything else stays "Open"
FIELD_ALIASES = {k: (f"custom_{k}", k) for k in SCORED_FIELDS}


class IllegalTransition(Exception):
    pass


def check_transition(src: str, dst: str) -> None:
    if dst not in TRANSITIONS.get(src, set()):
        raise IllegalTransition(f"{src} -> {dst} is not allowed")


@dataclass
class Outcome:
    application_ref: str
    from_state: str
    to_state: str
    record: dict | None
    missing_information: list[str] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)


def _scored_inputs(doc: dict) -> dict:
    out = {}
    for k, (custom, plain) in FIELD_ALIASES.items():
        out[k] = doc.get(custom, doc.get(plain))
    return out


def _active_policy():
    pv = load_policy("PERSONAL_LOAN")
    # decide() is pinned to the v1 files (P0 code is intentionally untouched). Fail closed
    # if the registry's active version points anywhere else.
    if pv.policy_path != decision_orchestrator.POLICY_PATH.resolve():
        raise PolicyIntegrityError(f"active policy {pv.version} is not the one wired into decide()")
    return pv


def process_application(application_ref: str, store, sink, current_state: str | None = None, now=None) -> Outcome:
    """Run one SUBMITTED application through automated review and persist evidence.

    current_state defaults to the record's own `custom_lifecycle_state` (or SUBMITTED when
    the source has no lifecycle field, e.g. the mock store)."""
    pv = _active_policy()
    doc = store.get(application_ref)  # UnknownApplication / FrappeUnavailable propagate: no state change
    current_state = current_state or doc.get("custom_lifecycle_state") or "SUBMITTED"
    check_transition(current_state, "UNDER_REVIEW")
    inputs = _scored_inputs(doc)
    applicant = doc.get("applicant") or doc.get("applicant_id")
    missing = [k for k, v in inputs.items() if v is None or v == ""]
    flags = []
    if missing:
        ev = {"decision": "ERROR", "rule_evaluations": [], "zen_trace": {}, "error": f"missing: {', '.join(missing)}"}
        to = "INFO_REQUESTED"
    else:
        ev = decide(application_ref, store=store)
        if ev["decision"] in ("APPROVED", "REJECTED"):
            to = ev["decision"]
            try:
                if float(inputs["monthly_obligations"]) > float(inputs["monthly_income"]):
                    flags.append("CONTRADICTION_OBLIGATIONS_EXCEED_INCOME")
                    to = "MANUAL_REVIEW"  # implausible data: a human checks before any outcome is final
            except (TypeError, ValueError):
                pass
        elif "ValidationError" in (ev.get("error") or ""):
            to = "INFO_REQUESTED"  # invalid values must be corrected by the applicant/ops
            flags.append("INVALID_INPUT")
        else:
            to = "MANUAL_REVIEW"
            flags.append("ENGINE_ERROR")
    check_transition("UNDER_REVIEW", to)
    rec = build_record(ev, pv, inputs, application_ref=application_ref, applicant_ref=applicant,
                       lifecycle_state=to, missing_fields=missing, now=now)
    rec["flags"] = flags
    sink.persist(rec, native_status=NATIVE_STATUS.get(to, "Open"), trace=ev.get("zen_trace") or {})
    return Outcome(application_ref, current_state, to, rec, missing, flags)


def simulate(application_ref: str, store, overrides: dict, now=None) -> dict:
    """What-if: evaluate hypothetical values in memory. Returns an is_simulation record; persists nothing."""
    pv = _active_policy()
    doc = store.get(application_ref)
    ev = decide(application_ref, store=store, overrides=overrides)
    rec = build_record(ev, pv, _scored_inputs({**doc, **overrides}), application_ref=application_ref,
                       applicant_ref=doc.get("applicant"), lifecycle_state="SIMULATION", is_simulation=True, now=now)
    rec["hypothetical_changes"] = overrides
    return rec


__all__ = ["STATES", "TRANSITIONS", "IllegalTransition", "check_transition", "process_application", "simulate",
           "Outcome", "UnknownApplication", "FrappeUnavailable"]
