"""Decision Evidence record — the stored, auditable contract (schema `decision-evidence/1`).

Built ONLY from (a) the P0 evidence object produced by decide(), (b) the canonical
input actually evaluated and (c) the pinned policy version. No free-text explanation
is generated here; reasons are the policy's own reason codes and descriptions.

Determinism: record_id = uuid5(application_ref, input_sha256, policy_sha256, jdm_sha256,
is_simulation) — the same inputs under the same policy version always yield the same id
(and the same rule outcomes); evaluated_at is the only time-varying field.
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone

SCHEMA = "decision-evidence/1"
NS = uuid.UUID("6f1c2b52-7a1e-4d0e-9a59-3c2f0b1d9e11")
ENGINE = {"name": "zen-engine", "version": "2.1.2"}
SCORED_FIELDS = ("monthly_income", "monthly_obligations", "credit_score", "employment_months")


def _sha(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def stable_trace(trace):
    """ZEN trace without wall-clock timing fields, so identical evaluations hash identically."""
    if isinstance(trace, dict):
        return {k: stable_trace(v) for k, v in trace.items() if k not in ("performance", "elapsed")}
    if isinstance(trace, list):
        return [stable_trace(v) for v in trace]
    return trace


def build_record(evidence: dict, policy_version, inputs: dict | None, *, application_ref: str,
                 applicant_ref: str | None, lifecycle_state: str, is_simulation: bool = False,
                 missing_fields: list[str] | None = None, now: datetime | None = None) -> dict:
    pol = policy_version.policy
    rules = {r["rule_id"]: r for r in pol["rules"]}
    used = {k: (inputs or {}).get(k) for k in SCORED_FIELDS}
    input_sha = _sha(used)
    by_id = {e["rule_id"]: e for e in evidence.get("rule_evaluations", [])}
    evals = []
    for rid, r in rules.items():
        e = by_id.get(rid)
        evals.append({
            "rule_id": rid, "rule_name": r["rule_name"], "rule_version": r["policy_version"],
            "reason_code": r["reason_code"], "field": r["field"], "operator": r["operator"],
            "threshold": r["threshold"], "threshold_source": policy_version.threshold_source,
            "description": r["description"], "customer_visible": r["customer_visible"],
            "actual_value": e["actual_value"] if e else None,
            "result": e["result"] if e else "NOT_EVALUABLE",
        })
    trace = stable_trace(evidence.get("zen_trace") or {})
    trace_bytes = json.dumps(trace, sort_keys=True).encode()
    rec_id = str(uuid.uuid5(NS, "|".join([application_ref, input_sha, policy_version.policy_sha256,
                                          policy_version.jdm_sha256, str(is_simulation)])))
    return {
        "schema": SCHEMA, "record_id": rec_id,
        "application_ref": application_ref, "applicant_ref": applicant_ref,
        "decision": evidence["decision"], "lifecycle_state": lifecycle_state,
        "is_simulation": is_simulation,
        "policy": policy_version.meta(),
        "inputs": {"values": used, "input_sha256": input_sha, "missing_fields": missing_fields or []},
        "rule_evaluations": evals,
        "failed_reason_codes": [e["reason_code"] for e in evals if e["result"] == "FAIL"],
        "engine": ENGINE,
        "evaluated_at": (now or datetime.now(timezone.utc)).isoformat(),
        "trace_ref": {"sha256": hashlib.sha256(trace_bytes).hexdigest() if trace else None,
                      "bytes": len(trace_bytes) if trace else 0},
        "error": evidence.get("error"),
    }
