"""E2E defect D-07 (2026-11-04 live run): catalogue-v2 rule ids (PL-006, PL-094, PL-095) reached the borrower
under "What to correct". The borrower sees plain field names; rule ids stay in the evidence store."""
import json
from types import SimpleNamespace

from tests.test_borrower_offer_detail import applications


def _detail(missing, state="INFO_REQUESTED"):
    rec = {"outcome": "MORE_INFORMATION_REQUIRED", "inputs": {"missing_fields": missing},
           "rule_evaluations": [{"rule_id": m, "result": "INSUFFICIENT_DATA"} for m in missing]}
    return applications._borrower_detail(SimpleNamespace(record_json=json.dumps(rec), decision="MORE_INFORMATION_REQUIRED"), state)


def test_rule_ids_become_plain_field_names():
    d = _detail(["PL-006", "PL-094"])
    assert d["missing_fields"] == ["identity_verification", "identity_documents"]
    assert "PL-" not in json.dumps(d)
    assert d["information_needed"] is True


def test_consent_rule_maps_to_consents():
    assert _detail(["PL-095"])["missing_fields"] == ["consents"]


def test_unknown_rule_id_never_leaks_and_duplicates_collapse():
    d = _detail(["PL-999", "PL-998", "monthly_income"])
    assert d["missing_fields"] == ["other_details", "monthly_income"]


def test_bureau_referral_gets_a_plain_reason():
    rec = {"outcome": "MANUAL_REVIEW", "reason_categories": ["DETAILS_NOT_VERIFIED"], "rule_evaluations": [],
           "review": {"required": True, "reason_codes": ["DQ_BUREAU_NO_HIT"]}}
    d = applications._borrower_detail(SimpleNamespace(record_json=json.dumps(rec), decision="MANUAL_REVIEW"), "MANUAL_REVIEW")
    assert d["reasons"] == [{"code": "DETAILS_NOT_VERIFIED", "category": "DETAILS_NOT_VERIFIED", "text": "We couldn't verify some details."}]
    assert "DQ_" not in json.dumps(d)


def test_v2_decline_carries_its_plain_reason_category():
    """D-10: v2 rule rows carry no customer_visible flag, so a decline showed only the generic 'didn't meet our
    requirements'. The stored borrower-safe category reaches the card; rule ids and values never do."""
    rec = {"outcome": "DECLINE", "reason_categories": ["CREDIT_HISTORY", "REPAYMENTS_TOO_HIGH"],
           "rule_evaluations": [{"rule_id": "PL-031", "result": "FAIL", "threshold": 700, "actual_value": 612}]}
    d = applications._borrower_detail(SimpleNamespace(record_json=json.dumps(rec), decision="DECLINE"), "REJECTED")
    assert [r["category"] for r in d["reasons"]] == ["CREDIT_HISTORY", "REPAYMENTS_TOO_HIGH"]
    assert "PL-" not in json.dumps(d) and "700" not in json.dumps(d) and "612" not in json.dumps(d)
