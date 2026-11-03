"""Owner decisions ADR-0007 and ADR-0009 are encoded in the catalogue, the product matrix and the what-if contract."""
import json
import re
from pathlib import Path

import pytest

from contracts.catalogue_v2 import products as PR
from contracts.catalogue_v2 import what_if as WI
from contracts.catalogue_v2.messages import MESSAGES

ROOT = Path(__file__).resolve().parents[2]
CAT = json.loads((ROOT / "docs/saral/rule_catalogue.v2.json").read_text(encoding="utf-8"))
PM = json.loads((ROOT / "contracts/product_matrix.json").read_text(encoding="utf-8"))
WIJ = json.loads((ROOT / "contracts/what_if_contract.json").read_text(encoding="utf-8"))
BY_ID = {r["rule_id"]: r for r in CAT["rules"]}
PURPOSE = {v: k for k, v in PR.PURPOSE_TO_PRODUCT.items()}


def param(rid, name):
    return next(p for p in BY_ID[rid]["parameters"] if p["name"] == name)


# ---------------------------------------------------------------- ADR-0007 #1: Rs. 25 lakh cap
def test_every_product_is_capped_at_25_lakh():
    assert PR.MVP_AMOUNT_CEILING == 2_500_000
    for pid in PR.PRODUCTS:
        assert PR.product_cap(pid) <= PR.MVP_AMOUNT_CEILING
    p = param("PL-109", "mvp_amount_ceiling")
    assert p["value"] == 2_500_000 and p["approval_status"] == "APPROVED_OWNER_DECISION"
    limits = CAT["profiles"]["prototype_synthetic"]["mvp_limits"]
    assert limits["amount_ceiling_inr"] == 2_500_000
    assert all(v["max_amount_inr"] <= 2_500_000 for v in limits["per_product"].values())
    assert CAT["amount_bands_mvp"]["in_mvp"] == ["B1", "B2", "B3"]


def test_above_ceiling_is_offered_the_cap_and_told_outside_what_we_offer():
    r = PR.size_offer_flat(4_000_000, 84, "PL_HOME_RENOVATION", 200_000, bureau_score=790, employment_months=72,
                           employment_category="PUBLIC", purpose_evidence_amount=4_200_000)
    assert r["offer_outcome"] == "COUNTER_OFFER" and r["eligible_amount"] == 2_500_000 and r["request_outside_mvp_range"]
    assert "outside what we offer" in MESSAGES["REQUEST_OUTSIDE_OFFER.outside_range"][1]
    # Above the Bajaj outer bound (PL-070) the request is declined as outside what we offer.
    assert PR.size_offer_flat(8_000_000, 84, "PL_HOME_RENOVATION", 900_000, bureau_score=800)["offer_outcome"] == "DECLINE"
    assert BY_ID["PL-070"]["borrower_reason_category"] == "REQUEST_OUTSIDE_OFFER"


# ---------------------------------------------------------------- ADR-0007 #2: counter-offer, not referral (P05)
def test_above_cap_is_counter_offer_never_review_or_decline():
    r = BY_ID["PL-109"]
    assert r["decision_effect"]["on_fail"] == "COUNTER_OFFER" and r["severity"] == "OFFER_ADJUSTMENT"
    assert "P05" in r["v2_ids"] and "ADR-0007 #2" in r["policy_source"]["conflict"]
    assert "C3" in CAT["conflicts"] and "COUNTER_OFFER" in CAT["conflicts"]["C3"]
    agg = CAT["decision_aggregation"]
    assert agg["counter_offer"]["rule"] == "PL-129" and "referral (v2 P05)" in agg["counter_offer"]["never"]
    for rid in agg["amount_dependent_rules"]:
        assert BY_ID[rid]["amount_dependent"], rid
        assert BY_ID[rid]["decision_effect"]["on_fail"] in ("COUNTER_OFFER", "DECLINE", "MANUAL_REVIEW"), rid
    for rid in ("PL-108", "PL-109", "PL-110", "PL-118", "PL-120", "PL-122", "PL-126"):
        assert BY_ID[rid]["decision_effect"]["on_fail"] == "COUNTER_OFFER", rid


@pytest.mark.parametrize("pid", list(PR.PRODUCTS))
def test_counter_offer_is_the_largest_passing_amount(pid):
    kw = dict(monthly_net_income=150_000, existing_monthly_obligations=8_000, bureau_score=760, employment_months=40,
              employment_category="PRIVATE", purpose_evidence_amount=None)
    requested = PR.product_cap(pid) + 500_000
    r = PR.size_offer_flat(requested, PR.product_max_tenure(pid), pid, **kw)
    assert r["offer_outcome"] == "COUNTER_OFFER"
    amt, ten = r["eligible_amount"], r["offer_tenure_months"]
    assert PR.passes_all(amt, ten, pid, **kw)
    assert not PR.passes_all(amt + 1000, ten, pid, **kw)


def test_affordability_counter_offer_is_largest_passing():
    kw = dict(monthly_net_income=45_000, existing_monthly_obligations=6_000, bureau_score=735, employment_months=20,
              employment_category="PRIVATE", purpose_evidence_amount=850_000)
    r = PR.size_offer_flat(800_000, 36, "PL_MEDICAL_EMERGENCY", **kw)
    assert r["offer_outcome"] == "COUNTER_OFFER" and r["binding_cap"] == "foir_principal"
    assert PR.passes_all(r["eligible_amount"], r["offer_tenure_months"], "PL_MEDICAL_EMERGENCY", **kw)
    assert not PR.passes_all(r["eligible_amount"] + 1000, r["offer_tenure_months"], "PL_MEDICAL_EMERGENCY", **kw)


def test_pl129_stubs_match_the_reference():
    for t in BY_ID["PL-129"]["test_cases"][:-1]:
        i = dict(t["inputs"])
        res = PR.size_offer_flat(i["requested_amount"], i["tenure_months"], PR.PURPOSE_TO_PRODUCT[i["loan_purpose"]],
                                 i["monthly_net_income"], i["existing_monthly_obligations"], i["other_monthly_obligations"],
                                 i["bureau_score"], i["bureau_match_status"], i["employment_months"], i["employment_category"],
                                 i["purpose_evidence_amount"])
        assert res["offer_outcome"] == t["expected_value"], t["description"]


def test_pl129_parameters_equal_their_source_rules():
    assert param("PL-129", "approved_maximum_foir")["value"] == param("PL-064", "approved_maximum_foir")["value"]
    assert param("PL-129", "min_residual_income")["value"] == param("PL-065", "min_residual_income")["value"]
    assert param("PL-129", "max_amount_income_multiple")["value"] == param("PL-108", "max_amount_income_multiple")["value"]
    assert param("PL-129", "ntc_indicative_cap")["value"] == param("PL-118", "ntc_indicative_cap")["value"]
    assert param("PL-129", "evidence_tolerance")["value"] == param("PL-126", "evidence_tolerance")["value"]
    assert param("PL-129", "minimum_loan_amount")["value"] == param("PL-069", "minimum_loan_amount")["value"]
    caps = param("PL-109", "purpose_amount_cap")["value"]
    assert all(caps[PURPOSE[pid]] == PR.PRODUCTS[pid]["amount_range_inr"]["value"][1] for pid in PR.PRODUCTS)
    assert param("PL-120", "band_minimum_score")["value"] == PR.BAND_MIN_SCORE
    assert param("PL-122", "band_min_employment_months")["value"] == PR.BAND_MIN_EMPLOYMENT_MONTHS


# ---------------------------------------------------------------- ADR-0007 #3: flat rate, PL-125 deferred
def test_one_flat_rate_per_product_and_no_grade_pricing():
    rates = param("PL-129", "flat_rate_by_product")["value"]
    assert set(rates) == set(PR.PURPOSE_TO_PRODUCT)
    for pid, p in PR.PRODUCTS.items():
        assert p["rate_for_assessment"]["pricing"].startswith("FLAT_PER_PRODUCT")
        assert rates[PURPOSE[pid]] == PR.flat_rate(pid)
        lo, hi = param("PL-075", "approved_interest_rate_range")["value"]
        assert lo <= PR.flat_rate(pid) <= hi
        kw = dict(monthly_net_income=90_000, employment_months=40, employment_category="PRIVATE")
        a = PR.size_offer_flat(300_000, 36, pid, bureau_score=710, **kw)
        b = PR.size_offer_flat(300_000, 36, pid, bureau_score=890, **kw)
        assert a["offer_rate"] == b["offer_rate"] == PR.flat_rate(pid)
    r = BY_ID["PL-125"]
    assert r["mvp_status"] == "DEFERRED" and "ADR-0007 #3" in r["mvp_deferred_reason"]
    assert CAT["deferred_grade_sizing"]["status"].startswith("DEFERRED")
    assert BY_ID["PL-129"]["mvp_status"] == "ACTIVE"


# ---------------------------------------------------------------- ADR-0007 #4: what-if contract
BASE = dict(requested_amount=500_000, tenure_months=60, product_id="PL_WEDDING", monthly_net_income=80_000,
            existing_monthly_obligations=10_000, bureau_score=760, employment_months=30, employment_category="PRIVATE")


def test_what_if_contract_fields_and_vocabulary():
    assert set(WIJ["editable_fields"]) == {"loan_amount", "tenure_months", "existing_emis", "monthly_income"}
    dd = {f["name"] for f in json.loads((ROOT / "contracts/data_dictionary.json").read_text())["fields"]}
    assert all(v["dictionary_field"] in dd for v in WIJ["editable_fields"].values())
    assert {"credit_score", "bureau_score", "employment_months"} <= set(WIJ["forbidden_fields"])
    assert WIJ["result_vocabulary"] == {"WOULD_LIKELY_MEET": "would likely meet", "WOULD_NOT_MEET": "wouldn't meet"}
    assert WIJ["result_shape"]["label"] == "Estimate only, your application is unchanged"
    assert WIJ["side_effects"]["in_memory_only"] and WIJ["side_effects"]["writes"] == "none"
    assert WIJ == CAT["what_if"]


@pytest.mark.parametrize("field", ["credit_score", "bureau_score", "employment_months", "loan_purpose"])
def test_what_if_refuses_score_and_job_months(field):
    with pytest.raises(WI.WhatIfRefused):
        WI.evaluate(BASE, {field: 800}, 0)


def test_what_if_answers_only_the_two_phrases_and_never_mutates():
    before = json.dumps(BASE, sort_keys=True)
    seen = set()
    for changes in ({"loan_amount": 400_000}, {"loan_amount": 2_000_000}, {"monthly_income": 20_000}, {"existing_emis": 0},
                    {"tenure_months": 36}):
        out = WI.evaluate(BASE, changes, 0)
        seen.add(out["text"])
        blob = json.dumps(out).lower()
        for w in WI.FORBIDDEN_WORDS:
            assert w not in blob, (changes, w)
        assert set(out) == {"result", "text", "hypothetical_amount", "label", "remaining_this_session"}
    assert seen == {"would likely meet", "wouldn't meet"}
    assert json.dumps(BASE, sort_keys=True) == before


def test_what_if_session_cap():
    for used in range(WI.PER_SESSION_CAP):
        WI.evaluate(BASE, {"loan_amount": 300_000}, used)
    with pytest.raises(WI.WhatIfRefused):
        WI.evaluate(BASE, {"loan_amount": 300_000}, WI.PER_SESSION_CAP)


# ---------------------------------------------------------------- tenure gap (B)
def test_prototype_max_tenure_per_product():
    assert param("PL-072", "maximum_tenure_months")["value"] == 108  # Bajaj outer gate, never 360
    caps = param("PL-110", "purpose_tenure_cap")["value"]
    for pid in PR.PRODUCTS:
        assert PR.product_max_tenure(pid) <= PR.PROTOTYPE_TENURE_CEILING == 84
        assert caps[PURPOSE[pid]] == PR.product_max_tenure(pid)
    assert BY_ID["PL-110"]["decision_effect"]["on_fail"] == "COUNTER_OFFER"
    blob = json.dumps(CAT)
    assert not re.search(r'"maximum_tenure_months", "value": 360', blob)
    r = PR.size_offer_flat(300_000, 96, "PL_HOME_RENOVATION", 90_000, bureau_score=760, employment_months=40,
                           employment_category="PRIVATE", purpose_evidence_amount=300_000)
    assert r["offer_tenure_months"] == 84 and r["offer_outcome"] == "COUNTER_OFFER"
    assert "C4" in CAT["conflicts"] and "360" in CAT["conflicts"]["C4"]


# ---------------------------------------------------------------- ADR-0009
def test_score_floor_stays_700():
    p = param("PL-029", "approved_minimum_score")
    assert p["value"] == 700 and p["approval_status"] == "APPROVED_OWNER_DECISION"
    assert "BFL-PL-ELIG-DOCS#007" in p["context_chunks"]
    assert all(v >= 700 for v in PR.BAND_MIN_SCORE.values())
    assert "ADR-0009" in CAT["conflicts"]["C2"]


def test_prototype_values_are_batch_approved_and_still_not_live():
    proto = CAT["profiles"]["prototype_synthetic"]
    assert proto["not_for_live_use"] and "ADR-0009" in proto["batch_approval"]
    for r in CAT["rules"]:
        if r["approval_status"] in ("PENDING_BUSINESS_APPROVAL", "PROTOTYPE_SYNTHETIC"):
            assert r["prototype_batch_approval"].startswith("ADR-0009"), r["rule_id"]
            assert "bajaj_published" not in r["profiles"]
        else:
            assert r["prototype_batch_approval"] is None
    assert "accepted" in CAT["approval_status_extension"]
    assert set(CAT["approval_status_meanings"]) == set(CAT["approval_status_values"])


# ---------------------------------------------------------------- source reconciliation (contract side)
def test_dictionary_classes_and_data_point_aliases_resolve():
    ddj = json.loads((ROOT / "contracts/data_dictionary.json").read_text(encoding="utf-8"))
    names = {f["name"] for f in ddj["fields"]}
    assert {f["zen_input_class"] for f in ddj["fields"]} == {"APPLICANT", "POLICY_PARAMETER", "ZEN_PRODUCED"}
    from contracts.zen import DataPointName
    assert set(ddj["zen_data_point_aliases"]) == {d.value for d in DataPointName}
    for dp, target in ddj["zen_data_point_aliases"].items():
        for t in (target if isinstance(target, list) else [target]):
            assert t in names, (dp, t)


def test_reconciled_source_paths_are_well_formed():
    src = json.loads((ROOT / "contracts/synthetic_sources.json").read_text(encoding="utf-8"))["sources"]
    for key in ("SYNTHETIC_PAN", "SYNTHETIC_AADHAAR", "SYNTHETIC_BANK"):
        paths = src[key]["paths"]
        assert len(paths) == len(set(paths)) and src[key]["status"].startswith("RECONCILED"), key
        assert not any(p in ("pan", "uid", "aadhaar_number") for p in paths), key  # never a raw identifier
    assert set(src["SYNTHETIC_BANK"]["test_only_paths"]).isdisjoint(src["SYNTHETIC_BANK"]["paths"])
    assert set(src["OCR"]["not_in_mvp_paths"]) <= set(src["OCR"]["paths"])
