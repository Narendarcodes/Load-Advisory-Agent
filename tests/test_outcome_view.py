"""Regression (QA 2026-10-26, D3): the decision card must not show data-quality holds, bureau provider failures or
information requests as a bare "ERROR" badge. The UI reads the server's typed outcome (card.bureau.outcome_kind,
lifecycle_state) through apps/web/chat/outcome.js; the recorded decision itself is never changed."""
import json
import shutil
import subprocess

import pytest

from decision_engine.paths import repo_root

WEB = repo_root() / "apps" / "web" / "chat"
JS = WEB / "outcome.js"


def _view(card: dict) -> dict:
    node = shutil.which("node")
    if not node:
        pytest.skip("node not installed")
    src = JS.read_text(encoding="utf-8") + f"\nprocess.stdout.write(JSON.stringify(outcomeView({json.dumps(card)})));"
    out = subprocess.run([node, "-e", src], capture_output=True, text=True, timeout=30, check=True)
    return json.loads(out.stdout)


def _card(decision, lifecycle, kind=None, **bureau):
    c = {"decision": decision, "recorded_outcome": decision, "lifecycle_state": lifecycle, "missing_fields": []}
    if kind:
        c["bureau"] = {"outcome_kind": kind, "review_required": False, "info_requested": False, "review_reason_codes": [],
                       "provider_error": None, "retryable": False, **bureau}
    return c


def test_credit_decisions_keep_their_recorded_label():
    assert _view(_card("REJECTED", "REJECTED", "CREDIT_REJECTION"))["label"] == "REJECTED"
    assert _view(_card("APPROVED", "APPROVED"))["label"] == "APPROVED"
    assert _view(_card("REJECTED", "REJECTED"))["cls"] == "dec-REJECTED"


def test_data_quality_hold_is_a_review_not_an_error_or_rejection():
    v = _view(_card("ERROR", "MANUAL_REVIEW", "DATA_QUALITY_HOLD", review_required=True, review_reason_codes=["DQ_BUREAU_NO_HIT"]))
    assert v["label"] == "UNDER REVIEW" and v["cls"] == "dec-REVIEW"
    assert "not a credit rejection" in v["note"].lower() and "DQ_BUREAU_NO_HIT" in v["note"]


def test_provider_failures_say_whether_a_retry_can_help():
    retry = _view(_card("ERROR", "MANUAL_REVIEW", "PROVIDER_FAILURE", provider_error={"code": "BUREAU_UNAVAILABLE"}, retryable=True))
    final = _view(_card("ERROR", "MANUAL_REVIEW", "PROVIDER_FAILURE", provider_error={"code": "BUREAU_MALFORMED_RESPONSE"}, retryable=False))
    assert retry["label"] == "CREDIT CHECK PENDING" and "retr" in retry["note"].lower() and "BUREAU_UNAVAILABLE" in retry["note"]
    assert final["label"] == "CREDIT CHECK PENDING" and "manual review" in final["note"].lower() and "retr" not in final["note"].lower()
    assert "no credit decision" in retry["note"].lower() and "no credit decision" in final["note"].lower()


def test_information_request_is_not_shown_as_error():
    c = _card("ERROR", "INFO_REQUESTED")
    c["missing_fields"] = ["credit_score", "employment_months"]
    v = _view(c)
    assert v["label"] == "INFORMATION NEEDED" and "credit_score" in v["note"]


def test_unknown_error_still_says_error():
    assert _view(_card("ERROR", "ERROR"))["label"] == "ERROR"


def test_both_pages_load_and_use_the_shared_outcome_view():
    for page in ("index.html", "voice.html"):
        html = (WEB / page).read_text(encoding="utf-8")
        assert '<script src="/static/outcome.js"></script>' in html, page
        assert "outcomeView(" in html, page
