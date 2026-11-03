"""Always-on decision path for the Saral live E2E (SYNTHETIC test bed only).

Polls Frappe for Loan Applications in SUBMITTED and runs each through the unchanged
conventional pipeline: `lifecycle.process_bureau_application` (synthetic bureau gate -> ZEN v1
-> stored evidence via the Evidence Service credential). It adds no decision logic of its own and
edits no engine file; when the catalogue-v2 JDM lands (Q-15) this runner needs no change.

Env (export from a 0600 file, never commit):
    FRAPPE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET            reader service account
    EVIDENCE_FRAPPE_API_KEY, EVIDENCE_FRAPPE_API_SECRET      evidence service account
    SARAL_BUREAU_URL   loopback bureau origin (default http://127.0.0.1:8011)
    SARAL_DECIDE_INTERVAL_S  poll interval (default 10); --once runs a single pass

    PYTHONPATH=.:apps/api/src:apps/bureau/src python -m ops.decision_runner [--once]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

from loan_advisory.application.lifecycle import process_bureau_application
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import FrappeClient


class UnfetchedScoreAsMissing:
    """Q-17 workaround (ops only): Frappe stores an unfetched Int score as 0, which the bureau gate reads
    as an invalid local score and holds the application for information. Until the adapter maps
    `custom_credit_score_origin == NOT_FETCHED` to None, the runner hands the pipeline a view where it is
    None, so the synthetic bureau score is used. Reads only; nothing is written back."""

    def __init__(self, store):
        self.store = store

    def __getattr__(self, name):
        return getattr(self.store, name)

    def get(self, application_id):
        doc = dict(self.store.get(application_id))
        if doc.get("custom_credit_score_origin") == "NOT_FETCHED" and not doc.get("custom_credit_score"):
            doc["custom_credit_score"] = None
        return doc


def submitted(client: FrappeClient, limit: int = 50) -> list[str]:
    params = {"filters": json.dumps([["custom_lifecycle_state", "=", "SUBMITTED"], ["docstatus", "=", 1]]),
              "fields": json.dumps(["name"]), "order_by": "creation asc", "limit_page_length": str(limit)}
    r = requests.get(f"{client.base_url}/api/resource/Loan Application", headers=client._headers(),
                     params=params, timeout=20)
    r.raise_for_status()
    return [row["name"] for row in r.json().get("data") or []]


def snapshot_from_record(rec: dict, evidence: str | None) -> dict:
    """Map a stored decision-evidence record onto a Decision Snapshot (E2E defect D-04). No decision logic."""
    offer = rec.get("offer") or {}
    decision = rec.get("decision") or rec.get("outcome")
    values = (rec.get("inputs") or {}).get("values") or {}
    policy = rec.get("policy") or {}
    snap = {
        "loan_decision_evidence": evidence, "outcome": decision, "profile": "prototype_synthetic", "not_for_live_use": 1,
        "catalogue_version": policy.get("version") or "unknown", "catalogue_sha256": policy.get("policy_sha256"),
        "policy_version": policy.get("version"),
        "assessment_date": values.get("assessment_date") or datetime.now(timezone.utc).date().isoformat(),
        "zen_input_json": values,
        "offer_outcome": ("COUNTER_OFFER" if offer.get("counter_offer") else "APPROVED") if offer.get("amount") else "NO_OFFER",
        "borrower_categories": list(rec.get("reason_categories") or []),
        "internal_reasons": [f"{r.get('rule_id')} {r.get('rule_name')}: {r.get('result')}" for r in rec.get("rule_evaluations") or []
                             if r.get("result") not in ("PASS", "APPROVED", "NOT_APPLICABLE")],
    }
    if offer.get("amount"):
        snap.update(offer_amount=offer.get("amount"), offer_emi=offer.get("emi"), offer_tenure_months=offer.get("tenure_months"))
    for k in ("assessment_rate", "amount_band", "proposed_emi", "foir"):
        if values.get(k) is not None:
            snap[k] = values[k] * 100 if k == "assessment_rate" else values[k]
    return {k: v for k, v in snap.items() if v is not None}


def snapshot_recorder(evidence_client: FrappeClient, reader: FrappeClient):
    """POST each new decision to loan_advisory_portal.api.snapshots.record_decision_snapshot (Evidence Service role)."""
    def snap(name: str, rec: dict) -> None:
        r = requests.get(f"{reader.base_url}/api/resource/Loan Application/{name}", headers=reader._headers(), timeout=20)
        ev = (r.json().get("data") or {}).get("custom_latest_evidence") if r.ok else None
        resp = requests.post(f"{evidence_client.base_url}/api/method/loan_advisory_portal.api.snapshots.record_decision_snapshot",
                             headers=evidence_client._headers(), timeout=30,
                             json={"application": name, "snapshot": snapshot_from_record(rec, ev)})
        if not resp.ok:
            raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:160]}")
    return snap


def run_pass(store, sink, bureau, log=print, snap=None) -> int:
    n = 0
    for name in submitted(store):
        try:
            out = process_bureau_application(name, UnfetchedScoreAsMissing(store), sink, bureau)
            rec = out.record or {}
            entry = {"at": datetime.now(timezone.utc).isoformat(), "application": name,
                     "to": out.to_state, "outcome": rec.get("outcome"), "flags": out.flags}
            if snap and rec:
                try:
                    snap(name, rec)
                except Exception as e:  # the decision stands; the queue columns can be re-recorded later
                    entry["snapshot_error"] = f"{type(e).__name__}: {str(e)[:200]}"
            log(json.dumps(entry))
        except Exception as e:  # one bad record must not stop the queue; it stays SUBMITTED
            log(json.dumps({"application": name, "error": f"{type(e).__name__}: {str(e)[:200]}"}))
        n += 1
    return n


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    a = ap.parse_args(argv)
    store = FrappeClient()
    sink = FrappeEvidenceSink(FrappeClient.for_evidence())
    bureau = BureauClient(base_url=os.environ.get("SARAL_BUREAU_URL", "http://127.0.0.1:8011"))
    snap = snapshot_recorder(FrappeClient.for_evidence(), store)
    interval = float(os.environ.get("SARAL_DECIDE_INTERVAL_S", "10"))
    while True:
        try:
            run_pass(store, sink, bureau, snap=snap)
        except Exception as e:  # Frappe briefly down (box cooldown): keep polling
            print(json.dumps({"poll_error": f"{type(e).__name__}: {str(e)[:200]}"}), flush=True)
        sys.stdout.flush()
        if a.once:
            return 0
        time.sleep(interval)


if __name__ == "__main__":
    sys.exit(main())
