"""Phase-3 live: Frappe Lending (seeded by infra/frappe/bootstrap/seed.sh) -> lifecycle -> stored evidence.

Requires FRAPPE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET and a seeded site. Applications
are located by `custom_external_ref` (never by fixed autonames).
"""
import os

import pytest
import requests

from loan_advisory.application.lifecycle import IllegalTransition, process_application, simulate
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import FrappeClient

LIVE = all(os.environ.get(k) for k in ("FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"))
pytestmark = pytest.mark.skipif(not LIVE, reason="no live Frappe env configured")


def _by_ref(c, ref):
    r = requests.get(f"{c.base_url}/api/resource/Loan Application", headers=c._headers(), timeout=15,
                     params={"filters": f'[["custom_external_ref","=","{ref}"]]', "fields": '["name"]'})
    rows = r.json().get("data", [])
    if not rows:
        pytest.skip(f"seed record {ref} missing — run infra/frappe/bootstrap/seed.sh")
    return rows[0]["name"]


def _resubmit(c, name):  # ops/applicant resubmission puts the record back to SUBMITTED
    r = requests.put(f"{c.base_url}/api/resource/Loan Application/{name}", headers=c._headers(), timeout=15,
                     json={"custom_lifecycle_state": "SUBMITTED", "status": "Open"})
    assert r.ok


@pytest.mark.parametrize("ref,state,status", [
    ("APP-TEST-001", "APPROVED", "Approved"), ("APP-TEST-005", "REJECTED", "Rejected"),
    ("SYN-APP-02408", "INFO_REQUESTED", "Open"),  # seeded persona with credit_score missing
])
def test_live_lifecycle_persists_evidence(ref, state, status, tmp_path):
    c = FrappeClient(); name = _by_ref(c, ref)
    _resubmit(c, name)
    sink = FrappeEvidenceSink(c, trace_dir=str(tmp_path))
    out = process_application(name, c, sink)
    assert out.to_state == state
    doc = c.get(name)
    assert doc["custom_lifecycle_state"] == state and doc["status"] == status
    assert doc["custom_latest_evidence"] == out.record["record_id"]
    stored = sink.get_record(out.record["record_id"])
    assert stored["decision"] == out.record["decision"]
    assert stored["rule_evaluations"] == out.record["rule_evaluations"]
    # a decided record cannot be silently re-decided ...
    if state in ("APPROVED", "REJECTED"):
        with pytest.raises(IllegalTransition):
            process_application(name, c, sink)
    # ... but after resubmission with unchanged data the SAME evidence record is produced (no duplicate doc)
    _resubmit(c, name)
    again = process_application(name, c, sink)
    assert again.record["record_id"] == out.record["record_id"]


def test_live_simulation_does_not_touch_frappe():
    c = FrappeClient(); name = _by_ref(c, "APP-TEST-005")
    before = c.get(name)
    sim = simulate(name, c, {"custom_monthly_obligations": 14000})
    after = c.get(name)
    assert sim["is_simulation"] and after["custom_monthly_obligations"] == before["custom_monthly_obligations"]
    assert after["modified"] == before["modified"]
