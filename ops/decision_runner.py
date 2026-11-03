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


def submitted(client: FrappeClient, limit: int = 50) -> list[str]:
    params = {"filters": json.dumps([["custom_lifecycle_state", "=", "SUBMITTED"], ["docstatus", "=", 1]]),
              "fields": json.dumps(["name"]), "order_by": "creation asc", "limit_page_length": str(limit)}
    r = requests.get(f"{client.base_url}/api/resource/Loan Application", headers=client._headers(),
                     params=params, timeout=20)
    r.raise_for_status()
    return [row["name"] for row in r.json().get("data") or []]


def run_pass(store, sink, bureau, log=print) -> int:
    n = 0
    for name in submitted(store):
        try:
            out = process_bureau_application(name, store, sink, bureau)
            rec = out.record or {}
            log(json.dumps({"at": datetime.now(timezone.utc).isoformat(), "application": name,
                            "to": out.to_state, "outcome": rec.get("outcome"), "flags": out.flags}))
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
    interval = float(os.environ.get("SARAL_DECIDE_INTERVAL_S", "10"))
    while True:
        try:
            run_pass(store, sink, bureau)
        except Exception as e:  # Frappe briefly down (box cooldown): keep polling
            print(json.dumps({"poll_error": f"{type(e).__name__}: {str(e)[:200]}"}), flush=True)
        sys.stdout.flush()
        if a.once:
            return 0
        time.sleep(interval)


if __name__ == "__main__":
    sys.exit(main())
