"""Q-15: catalogue v2 compiled to a JDM; DECLINE > MANUAL_REVIEW > MORE_INFO > CONDITIONS_MET; PL-129 counter-offers."""
import json
from pathlib import Path

import pytest

from decision_engine.catalogue_v2 import compile as C
from decision_engine.catalogue_v2.engine import decide_v2, size_offer
from decision_engine.policies.registry import load_policy

ROOT = Path(__file__).resolve().parents[1]
BASE = {k: v for k, v in json.loads((ROOT / "tests/fixtures/catalogue_v2_clean_applicant.json").read_text()).items()
        if not k.startswith("_")}


def run(**changes):
    return decide_v2({**BASE, **changes})


def test_v2_is_registered_and_pinned():
    pv = load_policy("PERSONAL_LOAN", "synthetic-v2")
    assert pv.synthetic and pv.jdm_path.name == "personal_loan_v2.json"
    assert load_policy("PERSONAL_LOAN").version == "synthetic-v1"  # v1 stays active (fallback)


def test_committed_jdm_matches_a_fresh_compile():
    if not C.CATALOGUE_PATH.exists():
        pytest.skip("catalogue v2 lands with #49 (contracts); drift is checked once it is in the tree")
    version = json.loads(C.CATALOGUE_PATH.read_text()).get("catalogue_version") or ""
    if version.startswith("saral-pl-catalogue-2.0"):  # main carries 2.0 until #49 (2.1, 130 rules) is merged
        pytest.skip(f"compiled from catalogue 2.1 (#49); this tree has {version}")
    assert C.main(["--check"]) == 0


def test_jdm_is_a_decision_table_with_precedence():
    jdm = json.loads(C.JDM_PATH.read_text())
    table = next(n for n in jdm["nodes"] if n["type"] == "decisionTableNode")
    assert table["content"]["hitPolicy"] == "first"
    assert [r["o_dec"] for r in table["content"]["rules"]] == [
        "'DECLINE'", "'MANUAL_REVIEW'", "'MORE_INFORMATION_REQUIRED'", "'ELIGIBILITY_CONDITIONS_MET'"]


def test_clean_applicant_meets_the_conditions_at_the_requested_amount():
    r = run()
    assert r["decision"] == "ELIGIBILITY_CONDITIONS_MET", [e for e in r["rule_evaluations"] if e["result"] != "PASS"]
    assert r["offer"]["amount"] == BASE["requested_amount"] and r["offer"]["counter_offer"] is False
    assert r["reason_categories"] == []


def test_above_25_lakh_is_a_counter_offer_at_25_lakh_not_a_refusal():
    r = run(requested_amount=4000000, tenure_months=84, loan_purpose="home_renovation", product_purpose="home_renovation",
            declared_purpose="home_renovation", monthly_net_income=200000, existing_monthly_obligations=0,
            employment_months=72, employment_category="PUBLIC", purpose_evidence_amount=4200000,
            total_unsecured_exposure=0, bureau_score=790, purpose_evidence_status="PROVIDED")
    assert r["decision"] == "COUNTER_OFFER"
    assert r["offer"]["amount"] == 2500000 and r["offer"]["request_outside_mvp_range"] is True
    assert r["reason_categories"] == ["REQUEST_OUTSIDE_OFFER"]


def test_off_product_purpose_is_declined():
    r = run(loan_purpose="crypto_investment", product_purpose="crypto_investment", declared_purpose="crypto_investment")
    assert r["decision"] == "DECLINE" and r["offer"] is None
    assert next(e for e in r["rule_evaluations"] if e["rule_id"] == "PL-076")["result"] == "FAIL"


def test_decline_outranks_review_and_review_outranks_more_info():
    assert run(bureau_score=640, max_dpd_12m=60)["decision"] == "DECLINE"
    assert run(max_dpd_12m=60, recorded_consents=["terms"])["decision"] == "MANUAL_REVIEW"
    assert run(recorded_consents=["terms"])["decision"] == "MORE_INFORMATION_REQUIRED"


def test_60_plus_dpd_in_12_months_is_review_and_90_plus_in_24_is_decline():
    assert run(max_dpd_12m=60, max_dpd_24m=60)["decision"] == "MANUAL_REVIEW"
    assert run(max_dpd_24m=90)["decision"] == "DECLINE"


def test_a_missing_input_is_never_a_decline():
    r = run(bureau_score=None)
    assert r["decision"] != "DECLINE"
    assert next(e for e in r["rule_evaluations"] if e["rule_id"] == "PL-029")["result"] == "INSUFFICIENT_DATA"


def test_affordability_breach_at_the_requested_amount_is_a_counter_offer():
    r = run(requested_amount=900000, tenure_months=60, monthly_net_income=43000, existing_monthly_obligations=11000)
    assert r["decision"] == "COUNTER_OFFER" and 40000 <= r["offer"]["amount"] < 900000
    assert r["reason_categories"] == ["REPAYMENTS_TOO_HIGH"]


def test_no_passing_amount_is_an_affordability_decline():
    r = run(monthly_net_income=30000, existing_monthly_obligations=14500, requested_amount=300000, tenure_months=36)
    assert r["decision"] == "DECLINE" and r["reason_categories"] == ["REPAYMENTS_TOO_HIGH"]


def test_tenure_above_the_product_max_is_offered_at_the_product_max():
    s = size_offer(115000, 84, "wedding", 43000, 11000, score=836, employment_months=82, employment_category="PUBLIC")
    assert s["tenure_months"] == 60 and s["offer_outcome"] == "COUNTER_OFFER"


def test_sizing_matches_the_contracts_reference_examples():
    P = pytest.importorskip("contracts.catalogue_v2.products")
    if not hasattr(P, "FLAT_WORKED_EXAMPLES"):
        pytest.skip("flat-rate worked examples land with catalogue 2.1 (#49)")
    for ex in P.FLAT_WORKED_EXAMPLES:
        ref = P.size_offer_flat(**{k: v for k, v in ex.items() if k != "name"})
        purpose = {v: k for k, v in P.PURPOSE_TO_PRODUCT.items()}[ex["product_id"]]
        got = size_offer(ex["requested_amount"], ex["tenure_months"], purpose, ex["monthly_net_income"],
                         ex.get("existing_monthly_obligations", 0), score=ex.get("bureau_score"),
                         employment_months=ex.get("employment_months"), employment_category=ex.get("employment_category"),
                         evidence_amount=ex.get("purpose_evidence_amount"))
        if ref["offer_outcome"] == "DECLINE" and ex["requested_amount"] > P.BAJAJ_MAX_AMOUNT:
            continue  # PL-070 declines in the JDM before sizing
        assert (got["offer_outcome"], got["amount"], got["tenure_months"]) == (
            ref["offer_outcome"], ref["eligible_amount"], ref["offer_tenure_months"]), ex["name"]


# ---------------------------------------------------------------- lifecycle wiring (SARAL_POLICY_VERSION)
class _Store:
    def __init__(self, doc):
        self.doc = doc

    def get(self, ref):
        return dict(self.doc)


class _Sink:
    def __init__(self):
        self.recs = []

    def persist(self, rec, **kw):
        self.recs.append((rec, kw))


class _Kyc:
    def __init__(self, points):
        self.points = points

    def data_points(self, applicant):
        from loan_advisory.infrastructure.kyc_aa_client import KycAaResult

        return KycAaResult(self.points)


def _bureau_ok(monkeypatch):
    from types import SimpleNamespace

    from loan_advisory.application import lifecycle as L

    gate = SimpleNamespace(category="CREDIT", missing_fields=[], review_required=False, info_requested=False,
                           reason_codes=[], score=SimpleNamespace(value=836))
    monkeypatch.setattr(L, "evaluate_data_quality", lambda *a, **k: gate)
    monkeypatch.setattr(L, "bureau_outcome", lambda *a, **k: {"outcome": "APPROVED", "review": None, "bureau": None})
    return SimpleNamespace(fetch_report=lambda *a: SimpleNamespace(report=object()))


DOC = {"applicant": "SYN-APP-0001", "custom_lifecycle_state": "SUBMITTED", "loan_amount": 4000000,
       "repayment_periods": 60, "custom_purpose_code": "wedding", "custom_monthly_income": 43000,
       "custom_monthly_obligations": 11000, "custom_employment_months": 82, "custom_credit_score": 0,
       "custom_credit_score_origin": "NOT_FETCHED"}


def test_v2_selected_by_env_counter_offers_and_stores_categories(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")
    sink = _Sink()
    out = L.process_bureau_application("ACC-1", _Store(DOC), sink, _bureau_ok(monkeypatch), kyc_client=_Kyc(BASE))
    rec = sink.recs[0][0]
    assert out.to_state == "APPROVED" and rec["decision"] == "COUNTER_OFFER"
    assert rec["offer"]["counter_offer"] is True and rec["offer"]["amount"] < 4000000
    assert rec["policy"]["version"] == "synthetic-v2" and rec["reason_categories"]


def test_v2_off_product_purpose_from_free_text_is_declined(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")
    sink = _Sink()
    doc = {**DOC, "loan_amount": 100000, "custom_purpose_code": None, "custom_loan_purpose": "Crypto investment"}
    out = L.process_bureau_application("ACC-2", _Store(doc), sink, _bureau_ok(monkeypatch), kyc_client=_Kyc(BASE))
    assert out.to_state == "REJECTED" and sink.recs[0][0]["decision"] == "DECLINE"


def test_without_kyc_aa_the_v2_path_asks_for_information_not_a_decline(monkeypatch):
    from loan_advisory.application import lifecycle as L

    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")
    sink = _Sink()
    out = L.process_bureau_application("ACC-3", _Store({**DOC, "loan_amount": 100000}), sink, _bureau_ok(monkeypatch),
                                       kyc_client=_Kyc(None))
    assert out.to_state in ("INFO_REQUESTED", "MANUAL_REVIEW") and "KYC_AA_UNAVAILABLE" in out.flags


def test_portal_accepts_above_cap_requests_up_to_the_pl070_maximum():
    import re

    src = (ROOT / "apps/loan_advisory_portal/loan_advisory_portal/api/applications.py").read_text(encoding="utf-8")
    m = re.search(r"^MAX_REQUEST_AMOUNT = ([\d_]+)$", src, re.M)
    pol = json.loads(C.POLICY_PATH.read_text())
    assert m and int(m[1].replace("_", "")) == pol["sizing"]["maximum_amount"]
    assert "amount > product.maximum_loan_amount" not in src
