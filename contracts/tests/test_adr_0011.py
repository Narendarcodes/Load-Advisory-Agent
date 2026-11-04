"""ADR-0011 (owner, 2026-11-04 00:29 IST): the top-10 thresholds and the runners-up are OWNER_APPROVED for the
prototype_synthetic profile only. They are never Bajaj policy and never enter the bajaj_published profile."""
import json
from pathlib import Path

import pytest

from contracts.catalogue_v2 import products as PR

ROOT = Path(__file__).resolve().parents[2]
CAT = json.loads((ROOT / "docs/saral/rule_catalogue.v2.json").read_text(encoding="utf-8"))
PM = json.loads((ROOT / "contracts/product_matrix.json").read_text(encoding="utf-8"))
BY_ID = {r["rule_id"]: r for r in CAT["rules"]}
PURPOSE = {v: k for k, v in PR.PURPOSE_TO_PRODUCT.items()}
OWN = "OWNER_APPROVED"

# (rule, parameter) pairs ADR-0011 approves.
ADR11_PARAMS = [
    ("PL-008", "minimum_income"),
    ("PL-014", "minimum_employment_months"),
    ("PL-024", "maximum_report_age_days"),
    ("PL-042", "assessment_window"), ("PL-042", "dpd_bucket"),
    ("PL-043", "assessment_window"), ("PL-043", "dpd_bucket"),
    ("PL-047", "lookback_months"), ("PL-048", "lookback_months"),
    ("PL-053", "approved_enquiry_threshold"), ("PL-053", "enquiry_window_days"),
    ("PL-061", "interest_rate"),
    ("PL-064", "approved_maximum_foir"),
    ("PL-065", "min_residual_income"),
    ("PL-067", "approved_maximum_foir"),
    ("PL-068", "interest_rate"),
    ("PL-081", "decline_at"),
    ("PL-089", "minimum_confidence"),
    ("PL-107", "assessment_rate"),
    ("PL-108", "max_amount_income_multiple"),
    ("PL-109", "purpose_amount_cap"),
    ("PL-110", "purpose_tenure_cap"),
    ("PL-118", "ntc_indicative_cap"),
    ("PL-123", "band_review_foir"),
    ("PL-129", "flat_rate_by_product"), ("PL-129", "approved_maximum_foir"), ("PL-129", "min_residual_income"),
    ("PL-129", "max_amount_income_multiple"), ("PL-129", "ntc_indicative_cap"), ("PL-129", "b3_review_foir"),
]


def param(rid, name):
    return next(p for p in BY_ID[rid]["parameters"] if p["name"] == name)


def names(rid):
    return [p["name"] for p in BY_ID[rid]["parameters"]]


@pytest.mark.parametrize("rid,name", ADR11_PARAMS)
def test_adr11_values_are_owner_approved_for_prototype_only(rid, name):
    p = param(rid, name)
    assert p["approval_status"] == OWN and p["value_origin"] == "OWNER_DECISION", (rid, name)
    assert p["owner_decision"].startswith("ADR-0011"), (rid, name)
    assert p["profile_scope"] == "prototype_synthetic", (rid, name)
    assert p["source_chunk"] is None, (rid, name)  # never cited as a Bajaj value


def test_adr11_rules_never_enter_the_bajaj_published_profile():
    pub = set(CAT["profiles"]["bajaj_published"]["rule_ids"])
    proto = CAT["profiles"]["prototype_synthetic"]
    for rid in {r for r, _ in ADR11_PARAMS}:
        r = BY_ID[rid]
        assert rid not in pub and "bajaj_published" not in r["profiles"], rid
        if r["enabled"]:
            assert r["profiles"] == ["prototype_synthetic"], rid
        if r["approval_status"] == OWN:
            assert r["owner_approval"].startswith("ADR-0011"), rid
        if r["decision_effect"]["on_fail"] == "DECLINE":
            assert r["decision_effect"]["decline_active_only_in"].startswith("prototype_synthetic"), rid
    assert proto["not_for_live_use"] and "ADR-0011" in proto["owner_approvals"]
    assert "never Bajaj policy" in proto["owner_approvals"]["ADR-0011"]


def test_foir_is_flat_050_with_no_segment_variants():
    assert PR.APPROVED_MAXIMUM_FOIR == 0.50
    assert names("PL-064") == ["approved_maximum_foir"]
    assert param("PL-064", "approved_maximum_foir")["value"] == 0.50
    assert "PRIME" not in BY_ID["PL-064"]["condition"] and "0.55" not in BY_ID["PL-064"]["condition"]
    assert param("PL-067", "approved_maximum_foir")["value"] == param("PL-129", "approved_maximum_foir")["value"] == 0.50
    blob = json.dumps(BY_ID["PL-064"])
    assert "approved_maximum_foir_prime" not in blob and "approved_maximum_foir_new_to_credit" not in blob


@pytest.mark.parametrize("pid", list(PR.PRODUCTS))
def test_every_product_cap_is_25_lakh(pid):
    assert PR.PRODUCTS[pid]["amount_range_inr"]["value"] == [40000, 2_500_000]
    assert PR.product_cap(pid) == 2_500_000
    assert param("PL-109", "purpose_amount_cap")["value"][PURPOSE[pid]] == 2_500_000
    assert PM["products"][pid]["amount_range_inr"]["value"][1] == 2_500_000
    assert CAT["profiles"]["prototype_synthetic"]["mvp_limits"]["per_product"][pid]["max_amount_inr"] == 2_500_000


def test_minimum_income_is_flat_25001_with_no_metro_floor():
    assert names("PL-008") == ["minimum_income"]
    assert param("PL-008", "minimum_income")["value"] == 25001
    assert not any("metro" in p["name"] or "Pune" in json.dumps(p["value"]) for p in BY_ID["PL-008"]["parameters"])
    assert "minimum_income_metro" not in json.dumps(CAT) and "metro_cities" not in json.dumps(CAT)
    outcomes = {(t["inputs"].get("monthly_net_income"), t["inputs"].get("applicant_city")): t["expected_outcome"]
                for t in BY_ID["PL-008"]["test_cases"] if t["inputs"]}
    assert outcomes[(30000, "Pune")] == "PASS"  # the old Rs. 40,000 metro floor is gone
    assert outcomes[(25000, "Mahabubnagar")] == "FAIL"


def test_credit_history_effects():
    for rid in ("PL-043", "PL-047", "PL-048"):
        assert BY_ID[rid]["decision_effect"]["on_fail"] == "DECLINE", rid
    assert param("PL-043", "dpd_bucket")["value"] == 90 and param("PL-043", "assessment_window")["value"] == 24
    assert param("PL-047", "lookback_months")["value"] == param("PL-048", "lookback_months")["value"] == 24
    r = BY_ID["PL-042"]
    assert r["decision_effect"]["on_fail"] == "MANUAL_REVIEW" and r["outcome"]["when_condition_false"] == "REVIEW"
    assert r["severity"] == "REVIEW"
    assert param("PL-042", "dpd_bucket")["value"] == 60 and param("PL-042", "assessment_window")["value"] == 12
    stubs = {t["inputs"].get("max_dpd_12m"): t["expected_outcome"] for t in r["test_cases"] if t["inputs"]}
    assert stubs[60] == "REVIEW"


def test_residual_tenure_and_income_multiple():
    assert param("PL-065", "min_residual_income")["value"] == PR.MIN_RESIDUAL_INCOME == 15000
    assert param("PL-110", "purpose_tenure_cap")["value"] == {"wedding": 60, "higher_education": 84,
                                                              "home_renovation": 84, "medical_emergency": 60}
    p = param("PL-108", "max_amount_income_multiple")
    assert p["value"] == PR.MAX_AMOUNT_INCOME_MULTIPLE == 24 and "backstop" in p["note"]


def test_24x_is_only_a_backstop_at_foir_050_and_20_percent():
    # With no other EMIs, FOIR 0.50 at 20% over the longest tenure (84 months) caps the amount near 22.5x income.
    for pid in PR.PRODUCTS:
        multiple = PR.principal_for(PR.APPROVED_MAXIMUM_FOIR * 100_000, PR.flat_rate(pid), PR.product_max_tenure(pid)) / 100_000
        assert multiple < PR.MAX_AMOUNT_INCOME_MULTIPLE, pid
    assert 22.4 < PR.principal_for(50_000, 0.20, 84) / 100_000 < 22.6


def test_b3_review_trigger_stays_045():
    assert param("PL-123", "band_review_foir")["value"] == {"B3": 0.45}
    assert PR.B3_REVIEW_FOIR == 0.45 == param("PL-129", "b3_review_foir")["value"]


def test_runners_up():
    assert param("PL-014", "minimum_employment_months")["value"] == 6
    assert param("PL-053", "approved_enquiry_threshold")["value"] == 4
    assert param("PL-053", "enquiry_window_days")["value"] == 180
    assert param("PL-081", "decline_at")["value"] == 3 and BY_ID["PL-081"]["decision_effect"]["on_fail"] == "DECLINE"
    assert param("PL-118", "ntc_indicative_cap")["value"] == PR.NTC_INDICATIVE_CAP == 200_000
    assert param("PL-089", "minimum_confidence")["value"] == 60
    assert param("PL-024", "maximum_report_age_days")["value"] == 30


def test_rate_is_labelled_sizing_only():
    for rid, name in (("PL-061", "interest_rate"), ("PL-068", "interest_rate"), ("PL-107", "assessment_rate")):
        p = param(rid, name)
        assert p["value"] == 0.20 and "sizing-only" in p["note"], rid
    assert "sizing-only" in param("PL-129", "flat_rate_by_product")["note"]
    for pid, p in PM["products"].items():
        assert p["rate_for_assessment"]["value"] == 0.20
        assert p["rate_for_assessment"]["use"].startswith("sizing-only"), pid


def test_sizing_under_the_new_caps():
    # Rs. 12 lakh medical is no longer above a Rs. 10 lakh cap.
    r = PR.size_offer_flat(1_200_000, 60, "PL_MEDICAL_EMERGENCY", 120_000, bureau_score=760, employment_months=40,
                           employment_category="PRIVATE", purpose_evidence_amount=1_300_000)
    assert r["offer_outcome"] == "APPROVED" and r["eligible_amount"] == 1_200_000
    # Rs. 24.9 lakh higher education is inside the Rs. 25 lakh cap; with enough income it is approved in full.
    r = PR.size_offer_flat(2_490_000, 84, "PL_HIGHER_EDUCATION", 160_000, bureau_score=780, employment_months=60,
                           employment_category="MNC", purpose_evidence_amount=2_500_000)
    assert r["offer_outcome"] == "APPROVED"
