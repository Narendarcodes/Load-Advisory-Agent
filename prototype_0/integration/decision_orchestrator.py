"""Integration orchestrator: Frappe -> canonical -> ZEN -> normalized result.

Fail-safe: any failure (unknown app, validation, ZEN error) returns an
ERROR evidence object. We NEVER fabricate a decision.
"""
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import zen

from prototype_0.evidence.decision_evidence import build_evidence
from prototype_0.integration import frappe_adapter
from prototype_0.integration.frappe_adapter import (
    FrappeUnavailable,
    UnknownApplication,
    from_frappe_doc,
)

DECISIONS_DIR = Path(__file__).resolve().parents[1] / "decisions"
POLICY_PATH = Path(__file__).resolve().parents[1] / "policy" / "personal_loan_synthetic_v1.json"

_engine = None
_decision = None


def _zen_decision():
    global _engine, _decision
    if _decision is None:
        _engine = zen.ZenEngine()
        _decision = _engine.create_decision((DECISIONS_DIR / "personal_loan_v1.json").read_text())
    return _decision


def decide(application_id: str, store=None, overrides: dict | None = None) -> dict:
    """Run one application end-to-end. `overrides` = in-memory what-if simulation."""
    started = time.perf_counter()
    log = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "application_id": application_id,
    }
    try:
        store = store or frappe_adapter.get_store()
        doc = store.get(application_id)
        if overrides:  # ponytail: what-if is a dict merge; original record untouched
            doc = {**doc, **overrides}
        canonical = from_frappe_doc(doc)  # raises ValidationError on missing/invalid
        raw_zen = _zen_decision().evaluate(canonical.zen_context(), {"trace": True})
        evidence = build_evidence(
            canonical, raw_zen["result"], raw_zen.get("trace") or {}, policy_path=POLICY_PATH
        )
        elapsed_ms = (time.perf_counter() - started) * 1000
        log.update(
            {
                "decision": evidence["decision"],
                "rule_count": len(evidence["rule_evaluations"]),
                "execution_ms": round(elapsed_ms, 2),
                "trace_available": bool(evidence["zen_trace"]),
                "error": None,
            }
        )
        evidence["_log"] = log
        return evidence
    except (UnknownApplication, FrappeUnavailable) as e:
        return _error_evidence(application_id, type(e).__name__, str(e), started, log)
    except Exception as e:  # ValidationError, ZEN NodeError, anything: fail safe
        return _error_evidence(application_id, type(e).__name__, str(e)[:500], started, log)


def _error_evidence(application_id, kind, message, started, log):
    elapsed_ms = (time.perf_counter() - started) * 1000
    log.update(
        {
            "decision": "ERROR",
            "rule_count": 0,
            "execution_ms": round(elapsed_ms, 2),
            "trace_available": False,
            "error": f"{kind}: {message}",
        }
    )
    return {
        "application_id": application_id,
        "decision": "ERROR",
        "policy": {"id": "PERSONAL_LOAN", "version": "synthetic-v1"},
        "rule_evaluations": [],
        "zen_trace": {},
        "error": f"{kind}: {message}",
        "_log": log,
    }


if __name__ == "__main__":  # demo self-check, not a test framework
    ev = decide("APP-TEST-005")
    assert ev["decision"] == "REJECTED", ev
    assert sum(1 for r in ev["rule_evaluations"] if r["result"] == "FAIL") == 3, ev
    assert ev["_log"]["trace_available"] is True
    print(json.dumps({k: v for k, v in ev.items() if k != "zen_trace"}, indent=1))
    print("orchestrator demo OK")
