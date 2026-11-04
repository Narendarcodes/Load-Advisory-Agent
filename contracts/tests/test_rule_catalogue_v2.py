"""Rule catalogue v2, data dictionary, frontend spec and product matrix agree and follow the governance rules."""
import json
import math
import re
from pathlib import Path

import pytest

from contracts.catalogue_v2 import build, products
from contracts.catalogue_v2.messages import CATEGORIES, FORBIDDEN_WORDS, MESSAGES
from contracts.catalogue_v2.sources import SOURCES

ROOT = Path(__file__).resolve().parents[2]
CAT = json.loads((ROOT / "docs/saral/rule_catalogue.v2.json").read_text(encoding="utf-8"))
DD = json.loads((ROOT / "contracts/data_dictionary.json").read_text(encoding="utf-8"))
FE = json.loads((ROOT / "contracts/frontend_fields.json").read_text(encoding="utf-8"))
RULES = CAT["rules"]
APPROVED = {"APPROVED_BAJAJ_SOURCE", "APPROVED_REGULATORY", "APPROVED_OWNER_DECISION"}
OUTCOMES = {"PASS", "FAIL", "REVIEW", "INSUFFICIENT_DATA"}


def test_generated_outputs_are_current():
    assert build.main(["--check"]) == 0


def test_user_catalogue_is_canonical():
    yaml = pytest.importorskip("yaml")
    src = yaml.safe_load((ROOT / "docs/saral/source/USER_RULE_CATALOGUE_PL.yaml").read_text(encoding="utf-8"))
    canon = {r["id"]: (g, r) for g, rs in src["rule_groups"].items() for r in rs}
    by_id = {r["rule_id"]: r for r in RULES}
    assert set(canon) == {f"PL-{i:03d}" for i in range(1, 100)}
    for rid, (group, c) in canon.items():
        r = by_id[rid]
        assert (r["rule_name"], r["rule_group"], r["implementation_type"], r["check"]) == (c["name"], group, c["implementation"], c["check"])
        declared = [i["name"] for i in r["input_schema"] if i["declared_in_user_catalogue"]]
        assert declared == c["inputs"], rid
    assert CAT["outcomes"] == src["outcomes"]
    assert [r["rule_id"] for r in RULES] == [f"PL-{i:03d}" for i in range(1, len(RULES) + 1)]


def test_every_rule_has_the_required_metadata():
    for r in RULES:
        for key in CAT["required_rule_metadata"]:
            assert key in r, (r["rule_id"], key)
        assert r["policy_version"] == CAT["catalogue_version"]
        assert r["approval_status"] in CAT["approval_status_values"]
        assert (r["effective_from"] is not None) == (r["approval_status"] in APPROVED)


def test_approved_values_cite_the_right_corpus():
    for r in RULES:
        for p in r["parameters"]:
            if p["approval_status"] == "APPROVED_BAJAJ_SOURCE":
                assert p["source_chunk"].startswith("BFL-") and p["source_chunk"] in CAT["excerpts"], (r["rule_id"], p["name"])
            elif p["approval_status"] == "APPROVED_REGULATORY":
                assert p["source_chunk"].startswith("RBI-") and p["source_chunk"] in CAT["excerpts"], (r["rule_id"], p["name"])
            else:
                assert p["source_chunk"] is None and p["value_origin"] != "BAJAJ_PUBLISHED", (r["rule_id"], p["name"])
            if p["approval_status"] == "PENDING_BUSINESS_APPROVAL":
                assert p["assumption_id"], (r["rule_id"], p["name"])


def test_profiles_are_separate():
    pub = set(CAT["profiles"]["bajaj_published"]["rule_ids"])
    for r in RULES:
        assert (r["rule_id"] in pub) == (r["approval_status"] in APPROVED and r["enabled"]), r["rule_id"]
    assert CAT["profiles"]["prototype_synthetic"]["not_for_live_use"] and CAT["profiles"]["bajaj_published"]["not_for_live_use"]


def test_missing_data_never_fails_and_signals_never_decline():
    for r in RULES:
        assert r["outcome"]["when_input_missing"] == "INSUFFICIENT_DATA"
        assert r["decision_effect"]["on_missing"] in ("MORE_INFORMATION_REQUIRED", "NO_EFFECT")
        if r["decision_effect"]["on_fail"] == "DECLINE":
            assert r["kind"] == "GATE" and not r["risk_signal"], r["rule_id"]
            assert r["decision_effect"]["low_confidence_downgrades_decline_to_review"]
            if r["approval_status"] not in APPROVED:
                assert r["decision_effect"]["decline_active_only_in"].startswith("prototype_synthetic"), r["rule_id"]
        if r["risk_signal"]:
            assert r["decision_effect"]["on_fail"] == "MANUAL_REVIEW"
            assert r["borrower_message"] == MESSAGES["DETAILS_NOT_VERIFIED.generic"][1]


def test_test_case_stubs():
    for r in RULES:
        tcs = r["test_cases"]
        assert len(tcs) >= 3, r["rule_id"]
        assert all(t["expected_outcome"] in OUTCOMES for t in tcs)
        assert tcs[-1]["inputs"] == {} and tcs[-1]["expected_outcome"] == "INSUFFICIENT_DATA"
        if r["kind"] != "COMPUTE":
            assert {t["expected_outcome"] for t in tcs[:-1]} - {"PASS"}, f"{r['rule_id']} needs a fail/review stub"


def test_borrower_messages_are_safe():
    pattern = re.compile(r"\d|PL-|%|₹")
    for key, (cat, msg) in MESSAGES.items():
        assert cat in CATEGORIES and key.startswith(cat + ".")
        assert not pattern.search(msg), key
        low = msg.lower()
        for w in FORBIDDEN_WORDS:
            assert w not in low, (key, w)
    for r in RULES:
        assert r["borrower_reason_category"] in CATEGORIES
        assert r["internal_reason"] and r["internal_reason"] != r["borrower_message"]


def test_every_v2_id_is_mapped():
    assert len(CAT["v2_to_pl"]) == 68
    assert all(CAT["v2_to_pl"].values())


def test_conflicts_are_explicit():
    assert "75 lakh" in CAT["conflicts"]["C1"] and "55 lakh" in CAT["conflicts"]["C1"]
    assert "650" in CAT["conflicts"]["C2"] and "685" in CAT["conflicts"]["C2"] and "750" in CAT["conflicts"]["C2"]


# ---- coverage: dictionary, frontend, synthetic schema
def test_every_rule_input_is_in_the_dictionary():
    names = {f["name"] for f in DD["fields"]}
    for r in RULES:
        for i in r["input_schema"]:
            assert i["name"] in names, (r["rule_id"], i["name"])
        for t in r["test_cases"]:
            assert set(t["inputs"]) <= names, (r["rule_id"], set(t["inputs"]) - names)


def _refs(field):
    return [field["mvp_supply"]] + field["derived_from"]


def test_every_source_reference_exists_in_the_frontend_or_synthetic_schema():
    fe_ids = {f["field_id"] for f in FE["fields"]}
    names = {f["name"] for f in DD["fields"]}
    for f in DD["fields"]:
        for ref in _refs(f):
            if ref.startswith("FRONTEND:"):
                assert ref.split(":", 1)[1] in fe_ids, (f["name"], ref)
            elif ":" in ref:
                src, path = ref.split(":", 1)
                assert src in SOURCES and path in SOURCES[src]["paths"], (f["name"], ref)
            elif ref not in ("DERIVED", "POLICY", "SYSTEM", "FRAPPE_HISTORY", "NONE"):
                assert ref in names, (f["name"], ref)


def test_active_rules_are_fully_supplied_in_the_mvp():
    dd = build.dictionary()
    for r in RULES:
        missing = [i["name"] for i in r["input_schema"] if not build.supplied(i["name"], dd)[0]]
        if r["mvp_status"] == "ACTIVE":
            assert not missing, (r["rule_id"], missing)
        else:
            assert r["mvp_deferred_reason"], r["rule_id"]


def test_frontend_mvp_constraints():
    ids = {f["field_id"] for f in FE["fields"]}
    assert not any("credit_score" in i or "score" == i for i in ids)
    for banned in ("reference", "co_applicant", "dependant", "education_level", "self_employed"):
        assert not any(banned in i for i in ids), banned
    by_id = {f["field_id"]: f for f in FE["fields"]}
    for kyc_only in ("gender", "marital_status"):
        assert by_id[kyc_only]["zen_input"] is None and by_id[kyc_only]["requirement"] == "OPTIONAL"
    assert by_id["father_or_spouse_name"]["requirement"] == "OPTIONAL"
    assert sorted({f["step"] for f in FE["fields"]}) == list(range(1, 8))
    assert by_id["pan"]["storage"] == "NEVER_STORE"


def test_dictionary_storage_and_rag_boundary():
    assert "never indexed by RAG" in DD["rag_boundary"]
    assert {n["name"] for n in DD["never_store"]} >= {"pan_full", "aadhaar_full"}
    for f in DD["fields"]:
        assert f["storage"] in DD["storage_tiers"]
        assert "aadhaar" not in f["name"] or "last4" in f["name"]
        if f["name"].startswith("signature_"):
            assert f["storage"] == "LMS_SNAPSHOT"


# ---- offer sizing and formulas
def test_offer_examples_cover_every_outcome():
    outcomes = {e["result"]["offer_outcome"] for e in CAT["offer_sizing"]["worked_examples"]}
    assert outcomes == {"APPROVED", "COUNTER_OFFER", "DECLINE"}
    amounts = {e["result"]["eligible_amount"] for e in CAT["offer_sizing"]["worked_examples"]}
    assert len(amounts) >= 4, "applicants must not all get the same amount"


def test_offer_rule_stubs_match_the_reference_implementation():
    pid = {"wedding": "PL_WEDDING", "higher_education": "PL_HIGHER_EDUCATION", "home_renovation": "PL_HOME_RENOVATION",
           "medical_emergency": "PL_MEDICAL_EMERGENCY"}
    r = next(r for r in RULES if r["rule_id"] == "PL-125")
    for t in r["test_cases"][:-1]:
        i = dict(t["inputs"])
        res = products.size_offer(i["requested_amount"], i["tenure_months"], pid[i["loan_purpose"]], i["risk_grade"],
                                  i["monthly_net_income"], i["existing_monthly_obligations"], i["other_monthly_obligations"])
        assert res["offer_outcome"] == t["expected_value"]


def test_emi_stubs_match_the_bajaj_formula():
    r = next(r for r in RULES if r["rule_id"] == "PL-061")
    for t in r["test_cases"][:-1]:
        i = t["inputs"]
        assert round(products.emi(i["requested_amount"], i["interest_rate"], i["tenure_months"])) == t["expected_value"]
    r = next(r for r in RULES if r["rule_id"] == "PL-068")
    t = r["test_cases"][0]
    assert math.floor(products.principal_for(18000, 0.20, 60)) == t["expected_value"]


def test_product_matrix_grounding():
    pm = json.loads((ROOT / "contracts/product_matrix.json").read_text(encoding="utf-8"))
    assert set(pm["products"]) == set(CAT["products"])
    for p in pm["products"].values():
        assert p["bajaj_description"]["chunk"].startswith("BFL-") and p["bajaj_description"]["quote"]
        for key in ("amount_range_inr", "tenure_range_months", "required_documents", "fast_track"):
            assert p[key]["basis"] == "ASSUMPTION"
