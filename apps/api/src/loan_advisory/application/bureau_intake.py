"""Application entry point for a bureau-backed evaluation.

This is the only normal caller of ``process_bureau_application``. It is used by
the authenticated chat server (``POST /api/bureau/run``) and never exposes a
second decision path: credit rules still run through the unchanged ZEN
orchestrator inside the conventional lifecycle.

Input validation happens before any network call. Provider failures are
reported distinctly from data-quality holds and credit decisions:

- ``REVIEW``  — data-quality hold; ``decision`` stays the legacy ``ERROR`` value
- ``ERROR``   — provider failure; ``retryable`` says whether a retry can help
- ``APPROVED``/``REJECTED`` — the recorded credit decision
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

from decision_engine.schemas.bureau import BureauScenario
from loan_advisory.agent import observability as obs
from loan_advisory.application.lifecycle import process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient

VALID_SCENARIOS = frozenset(s.value for s in BureauScenario)
_APPLICATION_REF = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$")


class BureauInputError(ValueError):
    """The request was rejected before any bureau call."""


@dataclass(frozen=True)
class BureauRunResult:
    application_ref: str
    outcome: str                 # APPROVED | REJECTED | REVIEW | ERROR
    decision: str                # legacy decision-evidence decision
    lifecycle_state: str
    record_id: str
    flags: list[str] = field(default_factory=list)
    missing_fields: list[str] = field(default_factory=list)
    score_source: str | None = None
    data_quality_category: str | None = None
    provider_error: dict | None = None
    retryable: bool = False
    status: int = 200
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "application_ref": self.application_ref,
            "outcome": self.outcome,
            "decision": self.decision,
            "lifecycle_state": self.lifecycle_state,
            "record_id": self.record_id,
            "flags": list(self.flags),
            "missing_fields": list(self.missing_fields),
            "score_source": self.score_source,
            "data_quality_category": self.data_quality_category,
            "provider_error": self.provider_error,
            "retryable": self.retryable,
            "error": self.error,
        }


def _validate(application_ref: str, scenario: str | None) -> None:
    if not isinstance(application_ref, str) or not _APPLICATION_REF.match(application_ref):
        raise BureauInputError("application_ref must match [A-Za-z0-9][A-Za-z0-9_-]{2,63}")
    if scenario is not None and scenario not in VALID_SCENARIOS:
        raise BureauInputError(f"unknown bureau scenario: {scenario!r}")


def run_bureau_evaluation(
    application_ref: str,
    *,
    store,
    sink,
    bureau_client: BureauClient | None = None,
    scenario: str | None = None,
    now=None,
) -> BureauRunResult:
    """Fetch a synthetic bureau report and persist the resulting evidence.

    ``scenario`` is a test/demo switch from the synthetic provider contract; it
    is validated against the wire vocabulary, never passed through unchecked.
    """
    _validate(application_ref, scenario)
    client = bureau_client or BureauClient()
    ref_hash = hashlib.sha256(application_ref.encode()).hexdigest()[:16]
    with obs.span("bureau.evaluation", kind="CHAIN",
                  **{"langfuse.trace.name": "bureau.evaluation",
                     "langfuse.trace.tags": ["loan-advisory", "bureau", "synthetic"],
                     "application.ref_hash": ref_hash, "bureau.scenario": scenario},
                  **obs.lf_trace_meta(correlation_id=ref_hash, application_ref_hash=ref_hash)) as sp:
        out = process_bureau_application(
            application_ref, store, sink, client, scenario=scenario, now=now
        )
        rec = out.record
        bureau = rec.get("bureau") or {}
        provider_error = bureau.get("provider_error")
        score = bureau.get("score") or {}
        dq = bureau.get("data_quality") or {}
        outcome = rec.get("outcome") or rec["decision"]

        status, error = 200, None
        if provider_error:
            status = 503 if provider_error.get("retryable") else 422
            error = provider_error.get("code")
        obs.set_attrs(sp, **{"bureau.outcome": outcome, "bureau.decision": rec["decision"],
                             "bureau.lifecycle_state": out.to_state, "bureau.score_source": score.get("source"),
                             "bureau.data_quality_category": dq.get("category"),
                             "bureau.provider_error_code": (provider_error or {}).get("code"),
                             "bureau.retryable": bool(provider_error and provider_error.get("retryable")),
                             "bureau.flags": list(out.flags),
                             "bureau.missing_fields": list(out.missing_information or [])},
                      **obs.lf_meta(outcome=outcome, decision=rec["decision"], lifecycle_state=out.to_state,
                                    score_source=score.get("source"), data_quality_category=dq.get("category"),
                                    provider_error_code=(provider_error or {}).get("code"),
                                    retryable=bool(provider_error and provider_error.get("retryable")),
                                    flags=list(out.flags), missing_fields=list(out.missing_information or [])))
    return BureauRunResult(
        application_ref=application_ref,
        outcome=outcome,
        decision=rec["decision"],
        lifecycle_state=out.to_state,
        record_id=rec["record_id"],
        flags=list(out.flags),
        missing_fields=list(out.missing_information or []),
        score_source=score.get("source"),
        data_quality_category=dq.get("category"),
        provider_error=provider_error,
        retryable=bool(provider_error and provider_error.get("retryable")),
        status=status,
        error=error,
    )
