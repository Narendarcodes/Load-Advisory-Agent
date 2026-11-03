"""Saral synthetic KYC / bank / bureau-linked universe. SYNTHETIC DATA ONLY."""
from __future__ import annotations

import json
import random
import re
from functools import lru_cache

import pytest

from decision_engine.schemas.bureau import BureauReport, BureauReportRequest
from synthetic_data.saral_kyc_bank import build_universe, ids
from synthetic_data.saral_kyc_bank.bank import statement_content_hash
from synthetic_data.saral_kyc_bank import product
from synthetic_data.saral_kyc_bank.scenarios import (
    ALL_SCENARIOS,
    BY_ID,
    REQUIRED_DECISION_PATHS,
    SCENARIOS,
    SIGNATURE_LABELS,
    plan,
)
from synthetic_data.saral_kyc_bank.zen_input_catalogue import CATALOGUE_INPUTS
from synthetic_data.saral_kyc_bank.zen_inputs import APPLICANT_INPUTS, POLICY_PARAMETERS, ZEN_PRODUCED, validate
from synthetic_data.saral_kyc_bank.signals import EXPECTED, balance_breaks, flags

SEED = 20261103


@lru_cache(maxsize=2)
def universe(count: int = 200, seed: int = SEED) -> dict:
    return build_universe(count, seed=seed)


def _triples(u):
    return zip(u["applicants"], u["statements"], u["bureau_cases"]["cases"])


# ------------------------------------------------------------------ determinism

def test_same_seed_same_output():
    a = json.dumps(build_universe(70, seed=SEED), sort_keys=True)
    b = json.dumps(build_universe(70, seed=SEED), sort_keys=True)
    assert a == b


def test_different_seed_differs():
    a = build_universe(5, seed=SEED)["applicants"][0]["specimen_truth"]["aadhaar_uid"]
    b = build_universe(5, seed=SEED + 1)["applicants"][0]["specimen_truth"]["aadhaar_uid"]
    assert a != b


def test_prefix_of_larger_universe_is_stable():
    small = build_universe(20, seed=SEED)
    big = universe()
    assert small["applicants"] == big["applicants"][:20]
    assert small["statements"] == big["statements"][:20]


# ------------------------------------------------------------------ identifiers

def test_verhoeff_known_vector_and_all_aadhaar_valid():
    assert ids.verhoeff_check_digit("236") == "3"
    assert ids.verhoeff_ok("2363") and not ids.verhoeff_ok("2364")
    for a in universe()["applicants"]:
        uid = a["specimen_truth"]["aadhaar_uid"]
        assert ids.verhoeff_ok(uid), uid


def test_aadhaar_never_starts_with_2_to_9():
    rng = random.Random(1)
    draws = [ids.synthetic_aadhaar(rng) for _ in range(5000)]
    draws += [a["specimen_truth"]["aadhaar_uid"] for a in universe()["applicants"]]
    for uid in draws:
        assert len(uid) == 12 and uid.isdigit()
        assert uid[0] in "01", uid
        assert ids.verhoeff_ok(uid)


def test_aadhaar_masking():
    for a in universe()["applicants"]:
        e = a["aadhaar_ekyc"]
        assert e["aadhaar_last4"] == a["specimen_truth"]["aadhaar_uid"][-4:]
        assert a["specimen_truth"]["aadhaar_uid"] not in json.dumps(e)


def test_pan_format_prefix_and_surname_initial():
    for a in universe()["applicants"]:
        p = a["specimen_truth"]["pan_number"]
        assert ids.PAN_FORMAT_RE.match(p) and ids.SYNTHETIC_PAN_RE.match(p), p
        assert p[3] == "P"
        assert p[4] == a["identity"]["surname"][0].upper()
        assert a["pan"]["pan_masked"] == "XXXXX" + p[5:9] + "X"  # contracts MASKED_PAN_PATTERN


def test_no_real_looking_ifsc_anywhere():
    u = universe()
    for s in u["statements"]:
        assert ids.SYNTHETIC_IFSC_RE.match(s["account"]["ifsc"])
        assert not ids.REAL_IFSC_RE.match(s["account"]["ifsc"])
    blob = json.dumps(u)
    assert not re.search(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", blob), "real-IFSC-shaped token found"


def test_pincode_and_phone_non_real():
    for a in universe()["applicants"]:
        assert ids.SYNTHETIC_PINCODE_RE.match(a["identity"]["address"]["pincode"])
        assert ids.SYNTHETIC_PHONE_RE.match(a["identity"]["phone"])
        assert a["identity"]["email"].endswith("@example.invalid")


# ------------------------------------------------------------------ bank

def test_balance_arithmetic_and_summary():
    for a, s, _ in _triples(universe()):
        breaks = balance_breaks(s)
        if a["scenario"]["id"] == "STATEMENT_TAMPERED":
            # The edited row and the row after it no longer follow from their predecessor.
            assert 1 <= len(breaks) <= 2
            continue
        assert breaks == [], (a["applicant_id"], breaks[:3])
        tx = s["transactions"]
        cr = round(sum(t["amount"] for t in tx if t["type"] == "CREDIT") * 100)
        dr = round(sum(t["amount"] for t in tx if t["type"] == "DEBIT") * 100)
        assert round(s["summary"]["total_credits"] * 100) == cr
        assert round(s["summary"]["total_debits"] * 100) == dr
        assert round(s["summary"]["opening_balance"] * 100) + cr - dr == round(s["summary"]["closing_balance"] * 100)
        assert tx[-1]["balance_after"] == s["summary"]["closing_balance"]
        dates = [t["date"] for t in tx]
        assert dates == sorted(dates)
        assert s["period"]["from"] <= dates[0] and dates[-1] <= s["period"]["to"]


def test_negative_balance_only_where_designed():
    for a, s, _ in _triples(universe()):
        negative = any(t["balance_after"] < 0 for t in s["transactions"])
        assert negative == (a["scenario"]["id"] == "NEGATIVE_BALANCE"), a["applicant_id"]


def test_statement_ids_and_content_hash():
    u = universe()
    sids = [s["statement_id"] for s in u["statements"]]
    assert len(sids) == len(set(sids))
    txn_ids = [t["txn_id"] for s in u["statements"] for t in s["transactions"]]
    assert len(txn_ids) == len(set(txn_ids))
    for a, s, _ in _triples(u):
        assert all(t["txn_id"].startswith(s["statement_id"] + "-T") for t in s["transactions"])
        assert a["bank_ref"]["statement_id"] == s["statement_id"]
        assert a["bank_ref"]["content_sha256"] == s["integrity"]["content_sha256"] == s["lms_reference"]["content_sha256"]
        matches = statement_content_hash(s) == s["integrity"]["content_sha256"]
        assert matches == (a["scenario"]["id"] != "STATEMENT_TAMPERED")
    # stable across runs and seeds-specific
    again = build_universe(3, seed=SEED)
    assert again["statements"][0]["statement_id"] == u["statements"][0]["statement_id"]
    assert build_universe(3, seed=SEED + 9)["statements"][0]["statement_id"] != u["statements"][0]["statement_id"]


def test_modes_cover_required_set():
    modes = {t["mode"] for s in universe()["statements"] for t in s["transactions"]}
    assert {"UPI", "NEFT", "IMPS", "NACH", "ECS", "CASH", "ATM", "CARD"} <= modes


# ------------------------------------------------------------------ bureau link

def test_bureau_requests_and_reports_validate():
    for a, _, case in _triples(universe()):
        req = BureauReportRequest.model_validate(a["bureau_link"]["request"])
        assert " " not in req.applicant_id and req.applicant_id == a["applicant_id"]
        if case["report"] is None:
            assert a["scenario"]["id"] == "BUREAU_UNAVAILABLE"
            continue
        rep = BureauReport.model_validate(case["report"])
        assert rep.application_id == a["application_id"]
        assert rep.provider.synthetic and rep.provenance.synthetic
        if a["bureau_link"]["origin"] == "derived_overlay":
            assert rep.report_id.startswith("BUR-OVL-")
            assert rep.provenance.scenario_id.startswith("SARAL-OVERLAY:")
        else:
            assert not rep.report_id.startswith("BUR-OVL-")


def test_known_applicant_id_bug_is_avoided():
    with pytest.raises(Exception):
        BureauReportRequest(application_id="SYN-SARAL-0001", applicant_id="Synthetic Borrower")
    BureauReportRequest(application_id="SYN-SARAL-0001", applicant_id="SYN-APP-0001")


def test_obligations_consistent_across_bureau_bank_declared():
    deliberate_bank = {"EMI_DEBIT_MISSING", "BOUNCE_HEAVY"}
    for a, s, case in _triples(universe()):
        sc = a["scenario"]["id"]
        rep = case["report"]
        inst = [x for x in (rep or {}).get("accounts", [])
                if x["account_type"] in ("PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN")
                and x["status"] == "ACTIVE" and x["monthly_obligation"] > 0]
        total = sum(x["monthly_obligation"] for x in inst)
        assert a["bureau_link"]["installment_obligation_total"] == total
        if sc == "OBLIGATION_UNDERDECLARED":
            assert a["declared"]["monthly_obligations"] == total - 6_000
        else:
            assert a["declared"]["monthly_obligations"] == total
        if sc in deliberate_bank:
            continue
        last = s["period"]["to"][:7]
        observed = sorted(t["amount"] for t in s["transactions"]
                          if t["synthetic_truth_tag"] == "EMI_BUREAU" and t["date"][:7] == last)
        expected = sorted(float(x["monthly_obligation"]) for x in inst
                          if x["opened_on"][:7] < last and not x["account_id"].startswith("ACC-PL-NEW"))
        assert set(expected) <= set(observed), (a["applicant_id"], expected, observed)
        undeclared = [t for t in s["transactions"] if t["synthetic_truth_tag"] == "EMI_UNDECLARED"]
        assert bool(undeclared) == (sc == "UNDECLARED_DEBT")


def test_bureau_service_serves_linked_fixture(tmp_path):
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient

    from synthetic_bureau.app import create_app

    u = build_universe(61, seed=SEED)
    path = tmp_path / "bureau_cases.json"
    path.write_text(json.dumps(u["bureau_cases"]))
    client = TestClient(create_app(fixture_path=str(path)))
    for a, _, case in _triples(u):
        r = client.post("/v1/bureau/reports", json=a["bureau_link"]["request"])
        if case["report"] is None:
            assert r.status_code == 503
        else:
            assert r.status_code == 200, r.text
            assert r.json()["report_id"] == case["report"]["report_id"]


# ------------------------------------------------------------------ scenarios

def test_every_scenario_present_and_expected_table_complete():
    u = universe()
    for s in ALL_SCENARIOS:
        assert u["scenario_counts"][s.id] >= (1 if s.id == "CLEAN_PRIME" else 2), s.id
    assert set(EXPECTED) == {s.id for s in SCENARIOS} - {"CLEAN_PRIME"}
    assert set(u["scenario_counts"]) == set(BY_ID)
    first = [sid for sid, _ in plan(len(SCENARIOS))]
    assert first[0] == "CLEAN_PRIME" and sorted(first) == sorted(s.id for s in SCENARIOS)
    groups = {g for s in SCENARIOS if s.id != "CLEAN_PRIME" for g in s.groups}
    assert groups == set("ABCDEFGHIJ")


def _matrix_expected(path: str) -> set[str] | None:
    if path == "APPROVE":
        return set()
    if path == "REFER:PRODUCT":
        return {"PL-123"}
    if path == "DECLINE:CREDIT_SCORE":
        return {"C01"}
    return None


def test_each_scenario_raises_its_target_and_prime_raises_nothing():
    u = universe()
    for a, s, case in _triples(u):
        sc = BY_ID[a["scenario"]["id"]]
        fired = flags(a, s, case["report"], u)
        path = a["label"]["expected_path"]
        if sc.id == "CLEAN_PRIME" or path == "APPROVE":
            assert fired == set(), (a["applicant_id"], sc.id, fired)
            continue
        allowed = set(sc.also_triggers) | set(sc.zen_refs) | set(sc.pl_rules)
        if sc.id.startswith("MATRIX_"):
            want = _matrix_expected(path)
            if path == "COUNTER_OFFER":
                assert fired & {"A01", "P05"}, (a["applicant_id"], fired)
            elif path == "DECLINE:DELINQUENCY":
                assert fired & {"C06", "C09"}, (a["applicant_id"], fired)
            else:
                assert want <= fired, (a["applicant_id"], path, fired)
            assert not fired - allowed - (want or set()), (a["applicant_id"], fired - allowed)
            continue
        assert EXPECTED[sc.id] <= fired, (a["applicant_id"], sc.id, fired)
        unexpected = fired - EXPECTED[sc.id] - allowed
        assert not unexpected, (a["applicant_id"], sc.id, unexpected)
        assert a["expected_outcome_hint"]["outcome"] == sc.outcome


def test_decision_paths_all_exercised():
    paths = {a["label"]["expected_path"] for a in universe()["applicants"]}
    assert REQUIRED_DECISION_PATHS <= paths, REQUIRED_DECISION_PATHS - paths


def test_products_bands_and_outcomes_spread():
    apps = universe()["applicants"]
    purposes = {a["loan_request"]["product_purpose"] for a in apps}
    assert set(product.PURPOSES) <= purposes
    amounts = {a["loan_request"]["amount"] for a in apps}
    assert len(amounts) >= 25, "applicants must not all request the same amount"
    cells = {(a["label"]["amount_band"], a["label"]["expected_path"].split(":")[0]) for a in apps}
    for band in ("B1", "B2", "B3"):
        for outcome in ("APPROVE", "COUNTER_OFFER", "DECLINE"):
            assert (band, outcome) in cells, (band, outcome)
    # B4 (> 25L) is outside what we offer (ADR-0007 #1): counter-offer within the ceiling, or a credit decline.
    assert ("B4", "DECLINE") in cells and ("B4", "COUNTER_OFFER") in cells and ("B4", "REFER") not in cells
    matrix = {(a["label"]["purpose"], a["label"]["amount_band"], a["scenario"]["id"])
              for a in apps if a["scenario"]["id"].startswith("MATRIX_")}
    assert len(matrix) == 48
    for a in apps:
        assert product.band_of(a["loan_request"]["amount"]) == a["label"]["amount_band"]
        for key in ("product_id", "purpose", "amount_band", "expected_path", "scenario_id"):
            assert key in a["label"]


def _pl129_args(a):
    zi, lr = a["zen_inputs"], a["loan_request"]
    return dict(purpose=lr["product_purpose"], income=zi["monthly_net_income"], existing=zi["existing_monthly_obligations"] or 0,
                other=zi["other_monthly_obligations"] or 0, score=zi["bureau_score"], match_status=zi["bureau_match_status"],
                employment_months=zi["employment_months"], category=zi["employment_category"],
                evidence=zi["purpose_evidence_amount"])


def test_counter_offers_and_approvals_are_arithmetically_right():
    """Every APPROVE passes PL-129 as asked; every COUNTER_OFFER is the largest passing amount (ADR-0007 #2)."""
    n = 0
    for a in universe()["applicants"]:
        lr, path = a["loan_request"], a["label"]["expected_path"]
        if path not in ("APPROVE", "COUNTER_OFFER"):
            continue
        n += 1
        kw = _pl129_args(a)
        if path == "APPROVE":
            assert product.pl129_passes(lr["amount"], lr["tenure_months"], **kw), a["applicant_id"]
            assert "expected_counter_offer" not in a["expected_outcome_hint"]
        else:
            co = a["expected_outcome_hint"]["expected_counter_offer"]
            assert not product.pl129_passes(lr["amount"], lr["tenure_months"], **kw), a["applicant_id"]
            assert product.pl129_passes(co["counter_amount"], co["counter_tenure"], **kw), a["applicant_id"]
            if co["counter_amount"] < lr["amount"]:  # reduced amount: the next 1,000 must fail
                assert not product.pl129_passes(co["counter_amount"] + 1000, co["counter_tenure"], **kw), a["applicant_id"]
            assert co["counter_amount"] < lr["amount"] or co["counter_tenure"] != lr["tenure_months"]
    assert n >= 40


def test_product_documents_linked():
    for a in universe()["applicants"]:
        prod, purpose = a["product"], a["loan_request"]["product_purpose"]
        if purpose is None:
            continue
        for doc in prod["documents"]:
            assert doc["synthetic"] and doc["document_id"].startswith("SYN-DOC-")
        kinds = {d["kind"] for d in prod["documents"]}
        sc = a["scenario"]["id"]
        if purpose == "higher_education" and sc != "EDU_ADMISSION_MISSING":
            assert {"ADMISSION_LETTER", "FEE_SCHEDULE"} <= kinds
        if purpose == "home_renovation":
            assert "CONTRACTOR_QUOTE" in kinds
        if purpose == "medical_emergency":
            assert kinds & {"HOSPITAL_ESTIMATE", "HOSPITAL_BILL"}
        if purpose == "wedding":
            assert "wedding_date" in prod["fields"]


def test_salaried_only():
    for a in universe()["applicants"]:
        assert a["employment"]["applicant_profile"] == "SALARIED"
        assert a["zen_inputs"]["employment_type"] == "SALARIED"
        assert len(a["employment"]["payslips"]) == 3


# ------------------------------------------------------------------ ZEN input coverage

def test_every_zen_input_present_for_every_applicant():
    problems = {a["applicant_id"]: validate(a) for a in universe()["applicants"]}
    problems = {k: v for k, v in problems.items() if v}
    assert not problems, problems


def test_validator_catches_a_missing_input():
    a = json.loads(json.dumps(universe()["applicants"][0]))
    del a["zen_inputs"]["foir"]
    a["zen_inputs"]["bureau_score"] = None
    assert {"foir", "bureau_score"} <= set(validate(a))


def test_input_classification_is_total_and_doc_table_complete():
    names = set(CATALOGUE_INPUTS)
    assert names == set(APPLICANT_INPUTS) | POLICY_PARAMETERS | ZEN_PRODUCED
    from pathlib import Path

    doc = (Path(__file__).resolve().parents[1] / "docs" / "saral" / "SYNTHETIC_DATASETS.md").read_text()
    missing = [n for n in sorted(names) if f"`{n}`" not in doc]
    assert not missing, missing


def test_zen_blocks_hold_no_raw_identifiers():
    pan_re = re.compile(r"(?<![A-Z0-9])(?!XXXXX)[A-Z]{5}\s?[0-9]{4}\s?[A-Z](?![A-Z0-9])")
    aad_re = re.compile(r"(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)")
    for a in universe()["applicants"]:
        blob = json.dumps({"zi": a["zen_inputs"], "dp": a["zen_data_points"]})
        assert not pan_re.search(blob), a["applicant_id"]
        assert not aad_re.search(blob), a["applicant_id"]


def test_zen_data_points_shape():
    for a in universe()["applicants"]:
        for name, dp in a["zen_data_points"].items():
            assert (dp["value"] is None) == (dp["source"] == "NONE"), (a["applicant_id"], name)
            if dp["source"].startswith("OCR_"):
                assert dp["source_document_ids"] and all(x.startswith("SYN-") for x in dp["source_document_ids"])


def test_signature_labels_cover_all_four():
    u = universe()
    labels = {a["signature"]["label"] for a in u["applicants"]}
    assert labels == set(SIGNATURE_LABELS)
    for a in u["applicants"]:
        sig = a["signature"]
        assert sig["reference"]["strokes"] and sig["reference_on"] == "PAN"
        assert (sig["form_signature"] is None) == (sig["label"] == "MISSING")
        if sig["label"] == "GENUINE_MATCH":
            assert sig["form_signature"]["strokes"] == sig["reference"]["strokes"]
        if sig["label"] in ("SKILLED_FORGERY", "RANDOM_FORGERY"):
            assert sig["form_signature"]["strokes"] != sig["reference"]["strokes"]


def test_duplicate_and_lists_link_back():
    u = universe()
    first = u["applicants"][0]
    neg = {n["pan"] for n in u["internal_lists"]["negative_list"]}
    caution = {c["employer_name"] for c in u["internal_lists"]["employer_caution_list"]}
    for a in u["applicants"]:
        sc = a["scenario"]["id"]
        if sc == "DUPLICATE_APPLICANT":
            assert a["duplicate_of"] == first["applicant_id"]
            assert a["specimen_truth"]["pan_number"] == first["specimen_truth"]["pan_number"] and a["applicant_id"] != first["applicant_id"]
        assert (a["specimen_truth"]["pan_number"] in neg) == (sc == "NEGATIVE_LIST_HIT")
        assert (a["declared"]["employer_name"] in caution) == (sc == "EMPLOYER_CAUTION_LIST")


# ------------------------------------------------------------------ safety markers

def test_synthetic_flag_on_every_record():
    u = universe()
    for a, s, case in _triples(u):
        assert a["synthetic"] is True and "SPECIMEN" in a["specimen_marker"]
        for key in ("identity", "aadhaar_ekyc", "pan", "employment", "declared", "loan_request", "bank_ref",
                    "bureau_link", "documents", "consents", "signature"):
            assert a[key]["synthetic"] is True, key
        assert "SPECIMEN" in a["aadhaar_ekyc"]["specimen_marker"] and "SPECIMEN" in a["pan"]["specimen_marker"]
        for slip in a["employment"]["payslips"]:
            assert slip["synthetic"] is True and "SPECIMEN" in slip["specimen_marker"]
        for h in a["employment"]["history"]:
            assert h["synthetic"] is True
        assert s["synthetic"] is True and "SPECIMEN" in s["specimen_marker"]
        assert s["lms_reference"]["synthetic"] is True
        assert case["provenance"]["synthetic"] is True
        if case["report"]:
            assert all(x["synthetic"] for x in case["report"]["accounts"] + case["report"]["enquiries"])
    lists = u["internal_lists"]
    assert lists["synthetic"] and all(x["synthetic"] for x in lists["negative_list"] + lists["employer_caution_list"])
    assert u["bureau_cases"]["synthetic"] is True


# ------------------------------------------------------------------ CLI and render

def test_cli_writes_small_sample(tmp_path):
    from synthetic_data.saral_kyc_bank.__main__ import main

    out = tmp_path / "s"
    assert main(["--count", "20", "--out", str(out)]) == 0
    total = sum(p.stat().st_size for p in out.iterdir())
    assert total < 2 * 1024 * 1024
    manifest = json.loads((out / "manifest.json").read_text())
    assert manifest["synthetic"] and manifest["count"] == 20
    assert len((out / "applicants.jsonl").read_text().splitlines()) == 20
    header = (out / "bureau_mapping.csv").read_text().splitlines()[0]
    assert "bureau_request_applicant_id" in header and "statement_content_sha256" in header


def test_render_documents(tmp_path):
    pytest.importorskip("PIL")
    from synthetic_data.saral_kyc_bank.render import render_applicant

    u = build_universe(61, seed=SEED)
    picks = [a for a in u["applicants"] if a["scenario"]["id"] in ("CLEAN_PRIME", "SIG_MISSING")][:2]
    for a in picks:
        s = next(x for x in u["statements"] if x["applicant_id"] == a["applicant_id"])
        made = render_applicant(a, s, tmp_path)
        kinds = {m["doc_type"] for m in made}
        assert kinds == {"PAN", "AADHAAR", "BANK_STATEMENT", "NACH_MANDATE"}
        nach = next(m for m in made if m["doc_type"] == "NACH_MANDATE")
        assert nach["signature_present"] == (a["signature"]["label"] != "MISSING")
        assert (tmp_path / a["applicant_id"] / "pan_card.png").stat().st_size > 1000


def test_committed_sample_matches_generator(tmp_path):
    from pathlib import Path

    from synthetic_data.saral_kyc_bank.writer import write_universe

    committed = Path(__file__).resolve().parents[1] / "data" / "synthetic" / "saral_v1" / "manifest.json"
    if not committed.exists():
        pytest.skip("sample not committed")
    want = json.loads(committed.read_text())
    got = write_universe(tmp_path, count=want["count"], seed=want["seed"])
    assert got["files_sha256"] == want["files_sha256"], "regenerate data/synthetic/saral_v1"


def test_zen_input_envelopes_validate_against_contracts():
    """Runs only when the Saral contracts package is importable (feat/saral-contracts-zen-design):
    SARAL_CONTRACTS_DIR=/path/to/that/worktree pytest ..."""
    import os
    import sys

    path = os.environ.get("SARAL_CONTRACTS_DIR")
    if path:
        sys.path.insert(0, path)
    zen = pytest.importorskip("contracts.zen")
    from synthetic_data.saral_kyc_bank.zen_inputs import zen_input_envelope

    for a in universe()["applicants"]:
        env = zen_input_envelope(a)
        if env is None:
            assert a["scenario"]["id"] == "PURPOSE_NOT_OFFERED"
            continue
        zen.ZenInput.model_validate(env)
