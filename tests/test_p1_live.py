"""P1 live tests: real Frappe Lending -> existing adapter -> existing ZEN.

Requires env: FRAPPE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET.
Optional: FRAPPE_P1_APP (default ACC-LOAP-2026-00001).
Skipped entirely without env — no secrets in repo. Read-only except the
write-back test, which sets status=Rejected (the ZEN decision) and is idempotent.
"""
import os

import pytest

from prototype_0.integration.decision_orchestrator import decide
from prototype_0.integration.frappe_adapter import (
    FrappeClient,
    FrappeUnavailable,
    MockStore,
    from_frappe_doc,
)

LIVE = all(os.environ.get(k) for k in ("FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"))
APP = os.environ.get("FRAPPE_P1_APP", "ACC-LOAP-2026-00001")

needs_live = pytest.mark.skipif(not LIVE, reason="no live Frappe env configured")


@needs_live
def test_live_retrieve_matches_p0():
    live = FrappeClient()
    ev_live = decide(APP, store=live)
    ev_mock = decide("APP-TEST-005", store=MockStore())
    assert ev_live["_log"]["error"] is None
    assert ev_live["decision"] == ev_mock["decision"] == "REJECTED"
    assert [(r["rule_id"], r["result"], r["actual_value"]) for r in ev_live["rule_evaluations"]] == \
           [(r["rule_id"], r["result"], r["actual_value"]) for r in ev_mock["rule_evaluations"]]
    assert ev_live["_log"]["trace_available"] is True


@needs_live
def test_live_determinism():
    live = FrappeClient()
    assert decide(APP, store=live)["decision"] == decide(APP, store=live)["decision"] == "REJECTED"


@needs_live
def test_live_what_if_does_not_mutate_frappe():
    live = FrappeClient()
    sim = decide(APP, store=live, overrides={"custom_monthly_obligations": 14000})
    foir = {r["rule_id"]: r for r in sim["rule_evaluations"]}["FOIR_MAX_45"]
    assert foir["result"] == "PASS"
    doc = live.get(APP)  # re-read from Frappe, not from cache
    assert doc["custom_monthly_obligations"] == 18500


@needs_live
def test_live_write_back_status():
    import requests
    live = FrappeClient()
    headers = {"Authorization": f"token {os.environ['FRAPPE_API_KEY']}:{os.environ['FRAPPE_API_SECRET']}"}
    r = requests.put(f"{live.base_url}/api/resource/Loan Application/{APP}",
                     headers=headers, json={"status": "Rejected"}, timeout=15)
    assert r.ok
    assert live.get(APP)["status"] == "Rejected"


def test_frappe_unavailable_fails_safe():
    client = FrappeClient(base_url="http://127.0.0.1:9", api_key="x", api_secret="y")
    ev = decide("APP-X", store=client)
    assert ev["decision"] == "ERROR" and "FrappeUnavailable" in ev["_log"]["error"]


def test_malformed_and_invalid_docs_fail_safe(monkeypatch):
    import pydantic
    for bad in [{}, {"name": "X"},
                {"name": "X", "applicant": "Y", "custom_monthly_income": -5,
                 "custom_monthly_obligations": 0, "custom_credit_score": 950,
                 "custom_employment_months": -1, "loan_amount": 0}]:
        with pytest.raises((pydantic.ValidationError, TypeError, KeyError)):
            from_frappe_doc(bad)
    for v in ("FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"):
        monkeypatch.delenv(v, raising=False)
    with pytest.raises(FrappeUnavailable):
        FrappeClient(base_url="", api_key="", api_secret="")
