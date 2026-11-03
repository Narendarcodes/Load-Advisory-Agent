"""The synthetic dataset matches the Saral contracts one-to-one, and carries the owner decisions.

Contracts: synthetic_data/saral_kyc_bank/contracts_snapshot (byte copies of contracts/synthetic_sources.json,
contracts/data_dictionary.json and contracts/what_if_contract.json from feat/saral-contracts-zen-design @ cc202ae).
Set SARAL_CONTRACTS_DIR=<contracts worktree> to also compare against the live contract files and the catalogue's
PL-129 reference implementation.
SYNTHETIC DATA ONLY.
"""
from __future__ import annotations

import json
import os
import sys
from functools import lru_cache
from pathlib import Path

import pytest

from synthetic_data.saral_kyc_bank import build_universe, product
from synthetic_data.saral_kyc_bank.contracts_snapshot import DATA_DICTIONARY, PINNED, SYNTHETIC_SOURCES, sha256

SEED = 20261103
SRC = SYNTHETIC_SOURCES["sources"]
DD_FIELDS = {f["name"]: f for f in DATA_DICTIONARY["fields"]}


@lru_cache(maxsize=1)
def universe():
    return build_universe(200, seed=SEED)


def flat(o, p=""):
    """Leaf paths, with [] for list items and a container kept as a leaf when it is empty or null."""
    out = set()
    if isinstance(o, dict) and o:
        for k, v in o.items():
            out |= flat(v, f"{p}.{k}" if p else k)
    elif isinstance(o, list) and o and isinstance(o[0], (dict, list)):
        for v in o:
            out |= flat(v, p + "[]")
    else:
        out.add(p)
    return out


def union(records):
    s = set()
    for r in records:
        s |= flat(r)
    return s


# ---------------------------------------------------------------- snapshot integrity
def test_vendored_contracts_are_unedited_copies():
    for name, digest in PINNED.items():
        assert sha256(name) == digest, f"{name} was edited; copy it again from the contracts branch and re-pin"
    live = os.environ.get("SARAL_CONTRACTS_DIR")
    if live:
        for name in PINNED:
            assert (Path(live) / "contracts" / name).read_bytes() == \
                (Path(__file__).resolve().parents[1] / "synthetic_data/saral_kyc_bank/contracts_snapshot" / name).read_bytes(), name


# ---------------------------------------------------------------- source paths, one-to-one
@pytest.mark.parametrize("source,pick", [
    ("SYNTHETIC_PAN", lambda u: [a["pan"] for a in u["applicants"]]),
    ("SYNTHETIC_AADHAAR", lambda u: [a["aadhaar_ekyc"] for a in u["applicants"]]),
    ("SYNTHETIC_BANK", lambda u: u["statements"]),
])
def test_kyc_and_bank_paths_match_the_contract_exactly(source, pick):
    got = union(pick(universe()))
    want = set(SRC[source]["paths"]) | set(SRC[source].get("test_only_paths", []))
    assert got == want, {"dataset_only": sorted(got - want), "contract_only": sorted(want - got)}


def test_bank_categories_are_the_contract_enum():
    cats = {t["category"] for s in universe()["statements"] for t in s["transactions"]}
    assert cats <= set(SRC["SYNTHETIC_BANK"]["categories"]), cats - set(SRC["SYNTHETIC_BANK"]["categories"])
    assert {"SALARY", "EMI", "NACH_RETURN", "CASH_DEPOSIT", "SALARY_REVERSAL"} <= cats


def _bureau_norm(paths, contract):
    out = set()
    for p in paths:
        p = p.removesuffix("[]")
        hit = next((c for c in contract if p == c or p.startswith(c + ".")), None)
        if hit:
            out.add(hit)
        elif any(c.startswith(p + "[].") or c.startswith(p + ".") for c in contract):
            continue  # an empty container whose children the contract lists
        else:
            out.add(p)
    return out


def test_bureau_reports_use_only_bureau_report_1_paths():
    contract = set(SRC["SYNTHETIC_BUREAU"]["paths"])
    reports = [c["report"] for c in universe()["bureau_cases"]["cases"] if c["report"]]
    got = _bureau_norm(union(reports), contract)
    assert got == contract, {"dataset_only": sorted(got - contract), "contract_only": sorted(contract - got)}


def test_ocr_keys_match_the_contract_mvp_set():
    want = set(SRC["OCR"]["paths"]) - set(SRC["OCR"]["not_in_mvp_paths"])
    got = set()
    for a in universe()["applicants"]:
        for e in a["ocr_extractions"]:
            got |= {f"{e['document_kind']}.{k}" for k in e["fields"]}
            got |= {f"chain.{k}" for k in e["chain"]} | {f"document.{k}" for k in e["document"]}
        got |= {f"signature.{k}" for k in a["signature"]["screening"] if k not in ("synthetic", "simulated")}
    assert got == want, {"dataset_only": sorted(got - want), "contract_only": sorted(want - got)}


def test_every_dictionary_source_reference_resolves_in_the_dataset():
    u = universe()
    have = {
        "SYNTHETIC_PAN": union(a["pan"] for a in u["applicants"]),
        "SYNTHETIC_AADHAAR": union(a["aadhaar_ekyc"] for a in u["applicants"]),
        "SYNTHETIC_BANK": union(u["statements"]),
        "SYNTHETIC_BUREAU": _bureau_norm(union(c["report"] for c in u["bureau_cases"]["cases"] if c["report"]),
                                         set(SRC["SYNTHETIC_BUREAU"]["paths"])),
    }
    missing = []
    for f in DD_FIELDS.values():
        for ref in [f["mvp_supply"], *f["derived_from"]]:
            src, _, path = ref.partition(":")
            if src in have and path not in have[src]:
                missing.append((f["name"], ref))
    assert not missing, missing


# ---------------------------------------------------------------- data dictionary, one-to-one
def test_zen_inputs_keys_equal_the_dictionary_applicant_fields():
    want = {n for n, f in DD_FIELDS.items() if f["zen_input_class"] == "APPLICANT"}
    for a in universe()["applicants"]:
        assert set(a["zen_inputs"]) == want, (a["applicant_id"], sorted(set(a["zen_inputs"]) ^ want))


def test_zen_data_points_equal_the_contract_data_points_and_aliases_resolve():
    aliases = DATA_DICTIONARY["zen_data_point_aliases"]
    for a in universe()["applicants"]:
        assert set(a["zen_data_points"]) == set(aliases), a["applicant_id"]
    for dp, target in aliases.items():
        for t in (target if isinstance(target, list) else [target]):
            assert t in DD_FIELDS, (dp, t)


def test_preprocessing_never_reads_the_truth_tag():
    src = (Path(__file__).resolve().parents[1] / "synthetic_data/saral_kyc_bank/zen_inputs.py").read_text()
    assert '["synthetic_truth_tag"]' not in src and ".get(\"synthetic_truth_tag\")" not in src


def test_no_raw_identifier_in_any_contract_shaped_record():
    for a in universe()["applicants"]:
        truth = a["specimen_truth"]
        blob = json.dumps({k: a[k] for k in ("pan", "aadhaar_ekyc", "ocr_extractions", "zen_inputs", "zen_data_points")})
        assert truth["pan_number"] not in blob and truth["aadhaar_uid"] not in blob, a["applicant_id"]


# ---------------------------------------------------------------- owner decisions in the labels
def test_nothing_above_25_lakh_except_deliberate_outside_what_we_offer_cases():
    for a in universe()["applicants"]:
        lab = a["label"]
        if lab["requested_amount"] > product.MVP_AMOUNT_CEILING:
            assert lab["request_outside_mvp_range"] and lab["outside_offer_label"] == "outside what we offer", a["applicant_id"]
            assert a["scenario"]["id"].startswith("MATRIX_") and lab["amount_band"] == "B4", a["applicant_id"]
            assert lab["expected_path"] in ("COUNTER_OFFER", "DECLINE:CREDIT_SCORE", "DECLINE:DELINQUENCY"), a["applicant_id"]
            if lab["expected_path"] == "COUNTER_OFFER":
                co = a["expected_outcome_hint"]["expected_counter_offer"]
                assert co["outside_what_we_offer"] and co["counter_amount"] <= product.MVP_AMOUNT_CEILING
        else:
            assert not lab["request_outside_mvp_range"] and lab["outside_offer_label"] is None


def test_above_cap_requests_get_a_counter_offer_never_a_referral():
    n = 0
    for a in universe()["applicants"]:
        lr, sc = a["loan_request"], a["scenario"]["id"]
        if sc not in ("PURPOSE_OVER_CAP", "MATRIX_APPROVE", "MATRIX_COUNTER_OFFER") or lr["product_purpose"] is None:
            continue
        if lr["amount"] > product.PRODUCTS[lr["product_purpose"]]["max_amount"]:
            n += 1
            assert a["label"]["expected_path"] == "COUNTER_OFFER", (a["applicant_id"], a["label"]["expected_path"])
    assert n >= 10
    for a in universe()["applicants"]:  # the only product referral left is a purpose mismatch
        assert a["label"]["expected_path"] != "REFER:PRODUCT" or a["scenario"]["id"] == "PURPOSE_PRODUCT_MISMATCH"


def test_flat_pricing_no_grades():
    for a in universe()["applicants"]:
        zi, lr = a["zen_inputs"], a["loan_request"]
        assert zi["applicant_pricing_band"] == "FLAT_PER_PRODUCT"
        assert zi["interest_rate"] == product.FLAT_RATE.get(lr["product_id"], product.ASSESSMENT_RATE)
        offer = a["expected_outcome_hint"].get("expected_offer")
        if offer:
            assert offer["offer_rate"] == product.FLAT_RATE[lr["product_id"]]


def test_score_floor_700_is_the_only_score_decline():
    for a in universe()["applicants"]:
        score = a["zen_inputs"]["bureau_score"]
        path = a["label"]["expected_path"]
        if score is not None and score < product.ZEN_SCORE_FLOOR:
            assert path.startswith("DECLINE"), (a["applicant_id"], score, path)
        if path == "DECLINE:CREDIT_SCORE":
            assert score is not None and score < product.ZEN_SCORE_FLOOR


def test_offers_match_the_catalogue_reference_when_available():
    live = os.environ.get("SARAL_CONTRACTS_DIR")
    if not live:
        pytest.skip("set SARAL_CONTRACTS_DIR to compare with contracts/catalogue_v2/products.py")
    sys.path.insert(0, live)
    from contracts.catalogue_v2 import products as ref  # noqa: PLC0415
    for a in universe()["applicants"]:
        offer, zi, lr = a["expected_outcome_hint"].get("expected_offer"), a["zen_inputs"], a["loan_request"]
        if not offer:
            continue
        r = ref.size_offer_flat(lr["amount"], lr["tenure_months"], lr["product_id"], zi["monthly_net_income"],
                                zi["existing_monthly_obligations"] or 0, zi["other_monthly_obligations"] or 0, zi["bureau_score"],
                                "NO_HIT" if zi["bureau_match_status"] == "NO_HIT" else "HIT", zi["employment_months"],
                                zi["employment_category"], zi["purpose_evidence_amount"])
        assert (r["offer_outcome"], r["eligible_amount"], r["offer_tenure_months"]) == \
            (offer["offer_outcome"], offer["eligible_amount"], offer["offer_tenure_months"]), a["applicant_id"]


def test_what_if_contract_snapshot_carries_the_owner_cap():
    from synthetic_data.saral_kyc_bank.contracts_snapshot import WHAT_IF
    assert WHAT_IF["per_session_cap"]["value"] == 3  # ADR-0010 #1
    assert set(WHAT_IF["editable_fields"]) == {"loan_amount", "tenure_months", "existing_emis", "monthly_income"}
