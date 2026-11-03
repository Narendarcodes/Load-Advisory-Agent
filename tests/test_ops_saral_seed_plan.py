"""ops/saral_seed/plan.py: turning synthetic Saral applicants into Frappe seed rows (synthetic only)."""
import json

import pytest

from ops.saral_seed import plan


def _rec(n="0001", product="PL_WEDDING", purpose="wedding", amount=115000, score=836):
    aid = f"SYN-APP-{n}"
    return {
        "synthetic": True, "applicant_id": aid, "application_id": f"SYN-SARAL-{n}",
        "display_name": "Imran Sharma",
        "label": {"product_id": product, "expected_path": "APPROVE"},
        "identity": {"email": f"syn.app.{n}@example.invalid", "full_name": "Imran Sharma"},
        "declared": {"monthly_net_income": 43000, "monthly_obligations": 2000, "months_with_current_employer": 30},
        "loan_request": {"purpose": purpose, "amount": amount, "tenure_months": 60, "product_id": product},
        "specimen_truth": {"pan_number": "ZZRPK5405J", "aadhaar_uid": "103472529847"},
        "pan": {"pan_masked": "XXXXX5405X"},
        "documents": {"submitted": ["AADHAAR_EKYC", "PAN", "BANK_STATEMENT_3M"]},
        "zen_data_points": {"credit_score": {"value": score}},
        "zen_inputs": {"bureau_score": score, "pan_masked": "XXXXX5405X", "max_dpd_12m": 0,
                       "observed_recurring_debits": [{"a": 1}]},
        "bureau_link": {"report_id": "BUR-1"},
    }


def test_row_uses_space_free_applicant_id_as_name_q10():
    row = plan.seed_row(_rec())
    assert row["borrower_name"] == "SYN-APP-0001"
    assert " " not in row["borrower_name"]
    assert row["email"].endswith("@example.invalid")


def test_row_maps_the_four_products_to_portal_purposes():
    for pid, purpose, label in [("PL_WEDDING", "wedding", "Wedding"),
                                ("PL_HIGHER_EDUCATION", "higher_education", "Higher education"),
                                ("PL_HOME_RENOVATION", "home_renovation", "Home renovation"),
                                ("PL_MEDICAL_EMERGENCY", "medical_emergency", "Medical emergency")]:
        assert plan.seed_row(_rec(product=pid, purpose=purpose))["purpose"] == label


def test_row_carries_request_and_declared_values():
    row = plan.seed_row(_rec())
    assert (row["loan_amount"], row["tenure_months"]) == (115000, 60)
    assert (row["monthly_income"], row["monthly_obligations"], row["employment_months"]) == (43000, 2000, 30)
    assert row["credit_score"] == 836 and row["expected"] == "APPROVE"
    assert row["documents"] == ["AADHAAR_EKYC", "PAN", "BANK_STATEMENT_3M"]


def test_over_cap_is_flagged_at_25_lakh():
    assert plan.seed_row(_rec(amount=2_500_000))["over_cap"] is False
    assert plan.seed_row(_rec(amount=3_540_000))["over_cap"] is True


def test_no_hit_applicant_has_no_score():
    rec = _rec()
    rec["zen_data_points"]["credit_score"]["value"] = None
    assert plan.seed_row(rec)["credit_score"] is None


def test_specimen_truth_and_raw_identifiers_never_reach_a_row():
    text = json.dumps(plan.seed_row(_rec()))
    assert "ZZRPK5405J" not in text and "103472529847" not in text and "specimen_truth" not in text


def test_assert_no_raw_ids_rejects_a_raw_pan_or_aadhaar():
    with pytest.raises(ValueError):
        plan.assert_no_raw_ids({"x": "ZZRPK5405J"})
    with pytest.raises(ValueError):
        plan.assert_no_raw_ids({"x": "2345 6789 0123"})
    plan.assert_no_raw_ids({"x": "XXXXX5405X", "h": "a6d40d85ebe67652440e47d539ded251783582be71bbbf8dcc94f56e439a453c"})


def test_non_synthetic_record_is_refused():
    rec = _rec()
    rec["synthetic"] = False
    with pytest.raises(ValueError):
        plan.seed_row(rec)


def test_build_plan_puts_demo_ids_first_and_dedupes():
    recs = [_rec(n) for n in ("0005", "0011", "0001", "0002")]
    rows = plan.build_plan(recs)
    ids = [r["applicant_id"] for r in rows]
    assert ids[:2] == ["SYN-APP-0001", "SYN-APP-0011"]
    assert sorted(ids) == sorted(set(ids)) and len(ids) == 4
    assert [r["applicant_id"] for r in plan.build_plan(recs, limit_ids=["SYN-APP-0002"])] == ["SYN-APP-0002"]


def test_rekey_bureau_fixture_by_frappe_application_name():
    cases = [{"case_id": "C1", "scenario": "CLEAN_PRIME",
              "application": {"application_id": "SYN-SARAL-0001", "applicant_id": "SYN-APP-0001"},
              "request": {"application_id": "SYN-SARAL-0001", "applicant_id": "SYN-APP-0001"},
              "report": {"application_id": "SYN-SARAL-0001", "applicant_id": "SYN-APP-0001"}},
             {"case_id": "C2", "scenario": "X", "application": {"application_id": "SYN-SARAL-0002", "applicant_id": "SYN-APP-0002"},
              "request": {}, "report": None}]
    out = plan.rekey_bureau_fixture({"cases": cases}, {"SYN-APP-0001": "ACC-LOAP-2026-00007"})
    assert out["synthetic"] is True and len(out["cases"]) == 1
    c = out["cases"][0]
    assert c["application"]["application_id"] == c["request"]["application_id"] == c["report"]["application_id"] == "ACC-LOAP-2026-00007"
    assert cases[0]["application"]["application_id"] == "SYN-SARAL-0001"  # input untouched


def test_report_ids_with_digit_runs_are_not_mistaken_for_aadhaar():
    plan.assert_no_raw_ids({"bureau_report_id": "BUR-OVL-502547228253"})
