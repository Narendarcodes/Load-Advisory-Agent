"""ZEN gap fixes (user OK 2026-11-04 09:36 IST; REDECIDE_V2_20261104-0350 defects D-11..D-15).

- The six rules left out of the first compile (PL-074, 075, 079, 082, 099, 127) are compiled; a missing input is
  INSUFFICIENT_DATA with the catalogue's on_missing effect, never a PASS.
- D-12: contract / probation employment (PL-016) and employer churn (PL-013) are referred, not approved.
- D-13: a non-resident (PL-130) is declined; a missing residency is asked for.
- D-14: a bureau EMI not seen in the bank (PL-082) is referred.
- D-15: a blank signature box is a missing document (PL-088 -> MORE_INFORMATION_REQUIRED), never an approval.
- D-11: a bureau provider failure under catalogue v2 is decided by v2 (PL-019 -> MANUAL_REVIEW), never ERROR with
  synthetic-v1 rule ids.
SYNTHETIC prototype policy only.
"""
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from decision_engine.catalogue_v2 import compile as C
from decision_engine.catalogue_v2.engine import decide_v2, preprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = {k: v for k, v in json.loads((ROOT / "tests/fixtures/catalogue_v2_clean_applicant.json").read_text()).items()
        if not k.startswith("_")}
SIX = ("PL-074", "PL-075", "PL-079", "PL-082", "PL-099", "PL-127")


def run(**changes):
    return decide_v2({**BASE, **changes})


def result(r, rid):
    return next(e for e in r["rule_evaluations"] if e["rule_id"] == rid)["result"]


def pol():
    return json.loads(C.POLICY_PATH.read_text())


# ---------------------------------------------------------------- compile
def test_nothing_is_left_uncompiled():
    assert C.NOT_COMPILED == {}
    assert pol()["not_compiled"] == {}
    for rid in SIX + ("PL-013", "PL-016", "PL-130"):
        assert rid in pol()["rules"], rid


def test_the_six_rules_take_their_effects_from_the_catalogue():
    rules = pol()["rules"]
    assert rules["PL-074"]["effects"] == {"FAIL": "MANUAL_REVIEW", "REVIEW": "MANUAL_REVIEW",
                                          "INSUFFICIENT_DATA": "MORE_INFORMATION_REQUIRED"}
    assert rules["PL-099"]["effects"]["INSUFFICIENT_DATA"] == "MORE_INFORMATION_REQUIRED"
    for rid in ("PL-075", "PL-079", "PL-082", "PL-127"):
        assert rules[rid]["effects"]["INSUFFICIENT_DATA"] == "NO_EFFECT", rid
    assert rules["PL-130"]["effects"] == {"FAIL": "DECLINE", "REVIEW": "MANUAL_REVIEW",
                                          "INSUFFICIENT_DATA": "MORE_INFORMATION_REQUIRED"}


def test_thresholds_in_the_jdm_are_the_catalogue_values():
    jdm = C.JDM_PATH.read_text()
    for frag in ("<= 1)", "interest_rate >= 0.1 and interest_rate <= 0.305", "1.0 * proposed_emi",
                 "missing_emi_debit_count <= 0", "employer_changes_24m <= 2", "employment_status in ['PERMANENT']",
                 "residency_status in ['RESIDENT']", ">= -90 and purpose_date_offset_days <= 365"):
        assert frag in jdm, frag


def test_clean_applicant_still_passes_every_new_rule():
    r = run()
    assert r["decision"] == "ELIGIBILITY_CONDITIONS_MET", [e for e in r["rule_evaluations"] if e["result"] != "PASS"]
    for rid in SIX + ("PL-013", "PL-016"):
        assert result(r, rid) == "PASS", rid
    assert result(r, "PL-130") == "NOT_APPLICABLE"  # the fixture is a wedding loan; PL-130 is home renovation only


# ---------------------------------------------------------------- the six, one case each way
def test_pl074_emi_mismatch_is_review_and_missing_asks():
    assert result(run(calculated_emi=3300), "PL-074") == "REVIEW"
    assert run(calculated_emi=3300)["decision"] == "MANUAL_REVIEW"
    r = run(calculated_emi=None)
    assert result(r, "PL-074") == "INSUFFICIENT_DATA" and r["decision"] == "MORE_INFORMATION_REQUIRED"


def test_pl074_independent_emi_is_the_engines_own():
    x = preprocess({**BASE, "independently_calculated_emi": 1})
    assert abs(x["independently_calculated_emi"] - 3046.8) < 0.1


def test_pl075_rate_outside_the_published_range_is_review():
    assert result(run(interest_rate=0.35), "PL-075") == "REVIEW"
    assert result(run(interest_rate=0.2), "PL-075") == "PASS"


def test_pl079_low_balance_against_the_emi_is_review():
    r = run(average_monthly_balance=1000)
    assert result(r, "PL-079") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"
    assert result(run(average_monthly_balance=None), "PL-079") == "INSUFFICIENT_DATA"


def test_pl099_needs_evidence_references():
    r = run(evidence_references=[])
    assert result(r, "PL-099") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"
    r = run(evidence_references=None)
    assert result(r, "PL-099") == "INSUFFICIENT_DATA" and r["decision"] == "MORE_INFORMATION_REQUIRED"


@pytest.mark.parametrize("changes,expected", [
    ({"loan_purpose": "home_renovation", "property_ownership": "OWNED"}, "PASS"),
    ({"loan_purpose": "home_renovation", "property_ownership": "RENTED"}, "REVIEW"),
    ({"loan_purpose": "home_renovation", "property_ownership": None}, "INSUFFICIENT_DATA"),
    ({"wedding_date": "2027-05-07"}, "PASS"),
    ({"wedding_date": "2028-06-01"}, "REVIEW"),
    ({"wedding_date": None}, "INSUFFICIENT_DATA"),
    ({"loan_purpose": "medical_emergency", "treatment_date": "2026-10-01"}, "PASS"),
    ({"loan_purpose": "medical_emergency", "treatment_date": "2026-03-01"}, "REVIEW"),
    ({"loan_purpose": "higher_education", "course_start_date": "2027-01-15"}, "PASS"),
])
def test_pl127_purpose_windows(changes, expected):
    assert result(run(**changes), "PL-127") == expected


# ---------------------------------------------------------------- D-12 .. D-15
@pytest.mark.parametrize("status", ["CONTRACT", "PROBATION"])
def test_d12_contract_or_probation_employment_is_referred(status):
    r = run(employment_status=status)
    assert result(r, "PL-016") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"
    assert "EMPLOYMENT_STABILITY" in r["reason_categories"]


def test_d12_employer_churn_is_referred():
    r = run(employer_changes_24m=3)
    assert result(r, "PL-013") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"
    assert result(run(employer_changes_24m=2), "PL-013") == "PASS"


def test_d13_non_resident_is_declined_and_missing_residency_is_asked():
    """Home renovation only since the owner decision of 2026-11-04 10:15 IST (the fixture applicant is a wedding loan)."""
    r = _for_purpose("home_renovation", residency_status="NRI")
    assert result(r, "PL-130") == "FAIL" and r["decision"] == "DECLINE" and r["offer"] is None
    r = _for_purpose("home_renovation", residency_status=None)
    assert result(r, "PL-130") == "INSUFFICIENT_DATA" and r["decision"] == "MORE_INFORMATION_REQUIRED"


def test_d14_missing_emi_debit_is_referred():
    actual = [d for d in BASE["actual_emi_debits"] if not (d["month"] in ("2026-09", "2026-10") and d["amount"] == 6000.0)]
    r = run(actual_emi_debits=actual)
    assert preprocess({**BASE, "actual_emi_debits": actual})["missing_emi_debit_count"] == 2
    assert result(r, "PL-082") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"


def test_d14_count_form_from_the_catalogue_tests():
    assert preprocess({"expected_emi_debits": 2, "actual_emi_debits": 1})["missing_emi_debit_count"] == 1
    assert preprocess({"expected_emi_debits": 2, "actual_emi_debits": 2})["missing_emi_debit_count"] == 0
    assert preprocess({})["missing_emi_debit_count"] is None


def test_d15_blank_signature_asks_for_the_signed_document():
    r = run(signature_present=False, signature_similarity=None, signature_anomaly_score=None)
    assert r["decision"] == "MORE_INFORMATION_REQUIRED", [e for e in r["rule_evaluations"] if e["result"] != "PASS"]
    assert result(r, "PL-088") == "INSUFFICIENT_DATA"
    assert result(r, "PL-104") == "INSUFFICIENT_DATA"  # screening signal: no signature to screen, no effect
    assert "DOCUMENTS_INCOMPLETE_OR_UNCLEAR" in r["reason_categories"]


def test_d15_low_similarity_is_still_a_review_not_more_info():
    r = run(signature_similarity=0.5)
    assert result(r, "PL-104") == "REVIEW" and r["decision"] == "MANUAL_REVIEW"


# ---------------------------------------------------------------- D-11 (lifecycle, v2 active)
class _Store:
    def __init__(self, doc):
        self.doc = doc

    def get(self, ref):
        return dict(self.doc)


class _Sink:
    def __init__(self):
        self.recs = []

    def persist(self, rec, **kw):
        self.recs.append(rec)


class _Kyc:
    def __init__(self, points):
        self.points = points

    def data_points(self, applicant):
        return SimpleNamespace(data_points=self.points, error=None if self.points is not None else "KYC_AA_UNAVAILABLE")


DOC = {"applicant": "SYN-APP-0023", "custom_lifecycle_state": "SUBMITTED", "loan_amount": 115000,
       "repayment_periods": 60, "custom_purpose_code": "wedding", "custom_monthly_income": 43000,
       "custom_monthly_obligations": 11000, "custom_employment_months": 82, "custom_credit_score": 0,
       "custom_credit_score_origin": "NOT_FETCHED"}


def _provider_down():
    return SimpleNamespace(fetch_report=lambda *a: SimpleNamespace(
        report=None, error_code="BUREAU_UNAVAILABLE", message="synthetic unavailable response", retryable=True,
        correlation_id="C-1"))


def test_d11_bureau_provider_failure_under_v2_is_a_v2_manual_review(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")
    sink = _Sink()
    out = L.process_bureau_application("ACC-11", _Store(DOC), sink, _provider_down(), kyc_client=_Kyc(dict(BASE)))
    rec = sink.recs[0]
    assert out.to_state == "MANUAL_REVIEW"
    assert rec["decision"] == rec["outcome"] == "MANUAL_REVIEW"
    assert rec["policy"]["version"] == "synthetic-v2"
    assert not rec.get("error")
    ids = {e["rule_id"] for e in rec["rule_evaluations"]}
    assert ids and all(i.startswith("PL-") for i in ids)  # never the synthetic-v1 rule ids
    assert next(e for e in rec["rule_evaluations"] if e["rule_id"] == "PL-019")["result"] == "REVIEW"
    assert "BUREAU_PROVIDER_ERROR" in out.flags


def test_d11_provider_failure_without_kyc_data_is_not_an_error(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")
    sink = _Sink()
    out = L.process_bureau_application("ACC-12", _Store(DOC), sink, _provider_down(), kyc_client=_Kyc(None))
    assert sink.recs[0]["decision"] in ("MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED")
    assert out.to_state in ("MANUAL_REVIEW", "INFO_REQUESTED")


def test_d11_v1_still_keeps_the_legacy_provider_error(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.delenv("SARAL_POLICY_VERSION", raising=False)
    sink = _Sink()
    L.process_bureau_application("ACC-13", _Store(DOC), sink, _provider_down(), kyc_client=_Kyc(dict(BASE)))
    assert sink.recs[0]["decision"] == "ERROR"


# ---------------------------------------------------------------- served data points
def test_zen_points_serve_residency_from_the_kyc_record():
    from ops.synthetic_kyc_bank.zen_points import served_points

    rec = {"zen_inputs": {"nationality": "IN", "applicant_name": "X"}, "identity": {"residency_status": "NRI"},
           "declared": {"residency_status": "RESIDENT"}}
    pts = served_points(rec)
    assert pts["residency_status"] == "NRI" and "applicant_name" not in pts
    assert served_points({"zen_inputs": {}, "declared": {"residency_status": "RESIDENT"}})["residency_status"] == "RESIDENT"
    assert "residency_status" not in served_points({"zen_inputs": {}})


# ---------------------------------------------------------------- PL-130 scope (owner decision 2026-11-04 10:15 IST)
def _for_purpose(purpose, **changes):
    extra = {"property_ownership": "OWNED"} if purpose == "home_renovation" else {}
    return run(loan_purpose=purpose, product_purpose=purpose, declared_purpose=purpose, **{**extra, **changes})


def test_pl130_is_compiled_for_home_renovation_only():
    assert pol()["rules"]["PL-130"]["applies_to_purposes"] == ["home_renovation"]
    assert "(loan_purpose in ['home_renovation']) ? ((residency_status == null)" in C.JDM_PATH.read_text()


def test_non_resident_is_declined_for_home_renovation():
    r = _for_purpose("home_renovation", residency_status="NRI")
    assert result(r, "PL-130") == "FAIL" and r["decision"] == "DECLINE" and r["offer"] is None
    assert result(_for_purpose("home_renovation", residency_status="RESIDENT"), "PL-130") == "PASS"
    assert result(_for_purpose("home_renovation", residency_status=None), "PL-130") == "INSUFFICIENT_DATA"


@pytest.mark.parametrize("purpose", ["wedding", "higher_education", "medical_emergency"])
def test_non_resident_is_not_affected_by_pl130_for_the_other_products(purpose):
    nri, resident = _for_purpose(purpose, residency_status="NRI"), _for_purpose(purpose, residency_status="RESIDENT")
    assert result(nri, "PL-130") == result(resident, "PL-130") == "NOT_APPLICABLE"
    assert result(_for_purpose(purpose, residency_status=None), "PL-130") == "NOT_APPLICABLE"
    assert nri["decision"] == resident["decision"] and nri["offer"] == resident["offer"]
    assert not [e for e in nri["rule_evaluations"] if e["rule_id"] == "PL-130" and e["effect"] != "NONE"]
