"""Decide the seeded demo applications with the CONVENTIONAL workflow (Frappe -> ZEN -> stored evidence).

The agent only explains stored decisions, so every demo application needs one first. This runs the
unchanged lifecycle.process_application for each seeded record still in SUBMITTED. Idempotent.

    set -a; . /root/hx/loan/secrets.env; set +a
    PYTHONPATH=.:apps/api/src python scripts/agent/prepare_demo.py
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / "apps/api/src")]

from loan_advisory.agent.runtime import frappe_resolve  # noqa: E402
from loan_advisory.application.lifecycle import process_application  # noqa: E402
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink  # noqa: E402
from loan_advisory.infrastructure.frappe_adapter import FrappeClient  # noqa: E402


def main():
    c = FrappeClient()
    sink = FrappeEvidenceSink(c, trace_dir=os.environ.get("EVIDENCE_TRACE_DIR", "/root/hx/loan/agent/traces"))
    seeds = json.loads((ROOT / "infra/frappe/bootstrap/seed_applications.json").read_text())
    for s in seeds:
        row = frappe_resolve(c, s["external_ref"])
        if not row:
            print("missing", s["external_ref"]); continue
        if (row.get("custom_lifecycle_state") or "SUBMITTED") != "SUBMITTED":
            print("keep", s["external_ref"], row.get("custom_lifecycle_state")); continue
        out = process_application(row["name"], c, sink)
        print("decided", s["external_ref"], row["name"], out.to_state, out.record["failed_reason_codes"] if out.record else None)


if __name__ == "__main__":
    main()
