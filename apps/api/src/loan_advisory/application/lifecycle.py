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

Bureau-backed runs add one step: a data-quality hold becomes outcome=REVIEW while
`decision` keeps the legacy ERROR value (no Frappe schema change), and a provider
failure becomes outcome=ERROR. The resolved score is what ZEN evaluates.
"""
import json
from dataclasses import dataclass, field

from decision_engine.paths import repo_root
from decision_engine.bureau.gates import (
    DQ_MISSING_REQUIRED_FIELD,
    GateIssue,
    GateResult,
    IssueSource,
    evaluate_data_quality,
    provider_failure,
)
from decision_engine.bureau.policy import load_gate_config
from decision_engine.evidence.decision_evidence import bureau_outcome
from decision_engine.evidence.evidence_record import SCORED_FIELDS, build_record
from decision_engine.policies.registry import PolicyIntegrityError, load_policy
from loan_advisory.application import decision_orchestrator
from loan_advisory.application.decision_orchestrator import decide
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication

# One canonical table, shared with the portal: config/loan_lifecycle.json is copied
# byte-for-byte into the Frappe app and the copies are checked by a contract test.
_LIFECYCLE = json.loads((repo_root() / "config" / "loan_lifecycle.json").read_text(encoding="utf-8"))
STATES = tuple(_LIFECYCLE["states"])
TRANSITIONS = {state: set(targets) for state, targets in _LIFECYCLE["transitions"].items()}
AUTOMATED_TRANSITIONS = {
    state: set(targets) for state, targets in _LIFECYCLE["automated_transitions"].items()
}
NATIVE_STATUS = dict(_LIFECYCLE["native_status"])
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


def _contradictory_obligations(inputs: dict) -> bool:
    try:
        return float(inputs["monthly_obligations"]) > float(inputs["monthly_income"])
    except (KeyError, TypeError, ValueError):
        return False


def _bureau_application(doc: dict, inputs: dict, applicant: str | None) -> dict:
    """Application view the data-quality gate needs (scored fields plus loan terms)."""
    return {
        **inputs,
        "applicant_id": applicant,
        "loan_amount": doc.get("loan_amount"),
        "loan_tenure_months": doc.get("repayment_periods", doc.get("loan_tenure_months")),
        "credit_score_origin": doc.get("credit_score_origin"),
    }


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
            if _contradictory_obligations(inputs):
                flags.append("CONTRADICTION_OBLIGATIONS_EXCEED_INCOME")
                to = "MANUAL_REVIEW"  # implausible data: a human checks before any outcome is final
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
    sink.persist(rec, native_status=NATIVE_STATUS.get(to, "Open"), trace=ev.get("zen_trace") or {},
                 expected_application=application_ref)
    return Outcome(application_ref, current_state, to, rec, missing, flags)


def process_bureau_application(application_ref: str, store, sink, bureau_client, *,
                               scenario: str | None = None, current_state: str | None = None,
                               now=None) -> Outcome:
    """Run one application through the synthetic bureau gate, then ZEN.

    Data-quality holds become outcome=REVIEW while `decision` stays the legacy
    ERROR value, so the Frappe schema and its APPROVED/REJECTED/ERROR Select are
    unchanged. Provider failures stay outcome=ERROR. Credit rules always run
    through the unchanged `decide()` with the resolved score.
    """
    pv = _active_policy()
    doc = store.get(application_ref)
    current_state = current_state or doc.get("custom_lifecycle_state") or "SUBMITTED"
    check_transition(current_state, "UNDER_REVIEW")
    inputs = _scored_inputs(doc)
    applicant = doc.get("applicant") or doc.get("applicant_id")
    missing = [k for k, v in inputs.items() if v is None or v == ""]
    flags = []
    fetch_error = None
    report = None

    if applicant:
        fetch = bureau_client.fetch_report(application_ref, applicant, scenario)
        report = fetch.report
        if report is None:
            fetch_error = {"code": fetch.error_code, "message": fetch.message,
                           "retryable": fetch.retryable, "correlation_id": fetch.correlation_id}
            gate = provider_failure(fetch.error_code, fetch.message or "bureau lookup failed")
        else:
            gate = evaluate_data_quality(_bureau_application(doc, inputs, applicant), report,
                                         config=load_gate_config(),
                                         as_of=now.date() if now else None)
    else:
        gate = GateResult(
            category="DATA_QUALITY",
            issues=[GateIssue(code=DQ_MISSING_REQUIRED_FIELD,
                              message="applicant_id is required before a bureau lookup",
                              source=IssueSource.APPLICATION, field="applicant_id")],
            missing_fields=["applicant_id"],
        )
    if gate.missing_fields:
        missing = gate.missing_fields

    blocks = bureau_outcome(gate, report, fetch_error=fetch_error)
    evidence_inputs = inputs
    if gate.category == "PROVIDER_FAILURE":
        ev = {"decision": "ERROR", "rule_evaluations": [], "zen_trace": {},
              "error": f"{fetch_error['code']}: {fetch_error['message']}"}
        to = "MANUAL_REVIEW"
        flags.append("BUREAU_PROVIDER_ERROR")
    elif gate.review_required:
        ev = {"decision": "ERROR", "rule_evaluations": [], "zen_trace": {},
              "error": f"BUREAU_REVIEW: {', '.join(gate.reason_codes)}"}
        to = "INFO_REQUESTED" if gate.info_requested else "MANUAL_REVIEW"
        flags.append("BUREAU_REVIEW")
    else:
        evidence_inputs = {**inputs, "credit_score": gate.score.value}
        ev = decide(application_ref, store=store,
                    overrides={"custom_credit_score": gate.score.value})
        if ev["decision"] in ("APPROVED", "REJECTED"):
            to = ev["decision"]
            if _contradictory_obligations(inputs):
                flags.append("CONTRADICTION_OBLIGATIONS_EXCEED_INCOME")
                to = "MANUAL_REVIEW"
        else:
            to = "MANUAL_REVIEW"
            flags.append("ENGINE_ERROR")

    check_transition("UNDER_REVIEW", to)
    rec = build_record(ev, pv, evidence_inputs, application_ref=application_ref,
                       applicant_ref=applicant, lifecycle_state=to, missing_fields=missing,
                       now=now, outcome=blocks["outcome"], review=blocks["review"],
                       bureau=blocks["bureau"])
    rec["flags"] = flags
    sink.persist(rec, native_status=NATIVE_STATUS.get(to, "Open"), trace=ev.get("zen_trace") or {},
                 expected_application=application_ref)
    return Outcome(application_ref, current_state, to, rec, missing, flags)


def simulate(application_ref: str, store, overrides: dict, now=None, *, base: dict | None = None) -> dict:
    """What-if: evaluate hypothetical values in memory. Returns an is_simulation record; persists nothing.

    ``base`` supplies values the source record does not carry but the latest evaluation used
    (a bureau-resolved credit score), so a what-if starts from the inputs that were underwritten.
    """
    pv = _active_policy()
    doc = store.get(application_ref)
    merged = {**(base or {}), **overrides}
    ev = decide(application_ref, store=store, overrides=merged)
    rec = build_record(ev, pv, _scored_inputs({**doc, **merged}), application_ref=application_ref,
                       applicant_ref=doc.get("applicant"), lifecycle_state="SIMULATION", is_simulation=True, now=now)
    rec["hypothetical_changes"] = overrides
    return rec


__all__ = ["STATES", "TRANSITIONS", "AUTOMATED_TRANSITIONS", "NATIVE_STATUS", "IllegalTransition",
           "check_transition", "process_application",
           "process_bureau_application", "simulate", "Outcome", "UnknownApplication", "FrappeUnavailable"]
