"""Phase 1: synthetic bureau contract, scoring, gates, generator, fixture."""
import json
from datetime import date
from pathlib import Path

import pytest
from pydantic import ValidationError

from decision_engine.bureau.gates import (
    DQ_BUREAU_IDENTITY_MISMATCH,
    DQ_BUREAU_INSUFFICIENT_HISTORY,
    DQ_BUREAU_NO_HIT,
    DQ_BUREAU_REPORT_STALE,
    DQ_CREDIT_SCORE_CONFLICT,
    DQ_INCOME_OBLIGATION_INCONSISTENT,
    DQ_INVALID_APPLICATION_VALUE,
    DQ_MISSING_REQUIRED_FIELD,
    GateConfig,
    evaluate_data_quality,
    resolve_credit_score,
)
from decision_engine.bureau.policy import load_gate_config
from decision_engine.schemas.bureau import (
    BureauReport,
    ScoreStatus,
    SyntheticScore,
)
from synthetic_bureau.generator import BASE_PLAN, build_cases
from synthetic_bureau.scoring import score_history

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PATH = ROOT / "data" / "synthetic" / "bureau" / "cases_120.json"
FIXTURE = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
AS_OF = date.fromisoformat(FIXTURE["as_of"])
CASES = {c["case_id"]: c for c in FIXTURE["cases"]}


def _report(case_id: str) -> BureauReport:
    return BureauReport.model_validate(CASES[case_id]["report"])


def _case(scenario: str, position: int = 0) -> dict:
    hits = [c for c in FIXTURE["cases"] if c["scenario"] == scenario]
    return hits[position]


# ---------------------------------------------------------------- contract


def test_score_rejects_value_without_available_status():
    with pytest.raises(ValidationError):
        SyntheticScore(status=ScoreStatus.NO_HIT, value=0)


def test_report_forbids_unknown_fields():
    payload = json.loads(json.dumps(CASES["BUR-000002"]["report"]))
    payload["surprise"] = True
    with pytest.raises(ValidationError):
        BureauReport.model_validate(payload)


def test_fixture_report_is_synthetic_and_versioned():
    report = _report("BUR-000002")
    assert report.schema_version == "bureau-report/1"
    assert report.provider.synthetic is True
    assert report.score.type == "SYNTHETIC"
    assert report.provenance.record_origin == "golden_fixture"


# ----------------------------------------------------------------- scoring


def test_score_matches_recomputed_history_for_every_case():
    for case in FIXTURE["cases"]:
        if case["report"] is None:
            continue
        report = BureauReport.model_validate(case["report"])
        result = score_history(report.accounts, report.enquiries, AS_OF)
        assert result.status == report.score.status, case["case_id"]
        assert result.value == report.score.value, case["case_id"]


def test_unavailable_score_is_null_never_zero():
    for case in FIXTURE["cases"]:
        if case["report"] is None:
            continue
        score = BureauReport.model_validate(case["report"]).score
        if score.status != ScoreStatus.AVAILABLE:
            assert score.value is None, case["case_id"]


def test_score_boundary_cases_are_reachable():
    boundary = {
        CASES[c]["expected"]["score_value"]
        for c in CASES
        if CASES[c]["scenario"] == "BOUNDARY"
    }
    assert {699, 700, 701} <= boundary


# ------------------------------------------------------------------- gates


def test_missing_field_requests_info_not_silent_approval():
    case = _case("MISSING_REQUIRED_FIELDS")
    gate = evaluate_data_quality(
        case["application"], _report(case["case_id"]), as_of=AS_OF
    )
    assert gate.review_required
    assert gate.info_requested
    assert DQ_MISSING_REQUIRED_FIELD in gate.reason_codes


def test_no_hit_and_thin_history_are_review():
    for scenario, code in (
        ("NO_HIT", DQ_BUREAU_NO_HIT),
        ("THIN_HISTORY", DQ_BUREAU_INSUFFICIENT_HISTORY),
    ):
        case = _case(scenario)
        gate = evaluate_data_quality(
            case["application"], _report(case["case_id"]), as_of=AS_OF
        )
        assert gate.review_required and code in gate.reason_codes


def test_identity_mismatch_is_review():
    case = _case("IDENTITY_MISMATCH")
    gate = evaluate_data_quality(
        case["application"], _report(case["case_id"]), as_of=AS_OF
    )
    assert DQ_BUREAU_IDENTITY_MISMATCH in gate.reason_codes


def test_genuine_local_bureau_score_conflict_is_blocking_review():
    case = _case("MULTI_ISSUE", 0)
    gate = evaluate_data_quality(
        case["application"], _report(case["case_id"]), as_of=AS_OF
    )
    assert DQ_CREDIT_SCORE_CONFLICT in gate.reason_codes
    assert gate.score is not None and gate.score.value is None


def test_invalid_local_score_is_application_error():
    case = _case("VALID_PASS")
    application = dict(case["application"])
    application["credit_score"] = "excellent"
    application["credit_score_origin"] = "APPLICATION"
    gate = evaluate_data_quality(
        application, _report(case["case_id"]), as_of=AS_OF
    )
    assert DQ_INVALID_APPLICATION_VALUE in gate.reason_codes
    assert gate.info_requested


def test_placeholder_score_is_replaced_by_bureau():
    case = _case("VALID_PASS")
    assert case["application"]["credit_score_origin"] == "SYNTHETIC_PLACEHOLDER"
    resolution = resolve_credit_score(case["application"], _report(case["case_id"]))
    assert resolution.source == "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER"
    assert resolution.placeholder_used
    assert resolution.value == _report(case["case_id"]).score.value


def test_staleness_and_variance_stay_disabled_by_default():
    for scenario, code in (
        ("STALE_REPORT", DQ_BUREAU_REPORT_STALE),
        ("INCONSISTENT_INCOME_OBLIGATIONS", DQ_INCOME_OBLIGATION_INCONSISTENT),
    ):
        case = _case(scenario)
        assert case["expected"]["pending_policy_reason_codes"] == [code]
        gate = evaluate_data_quality(
            case["application"], _report(case["case_id"]), as_of=AS_OF
        )
        assert not gate.review_required


def test_approved_config_enables_disabled_gates():
    config = GateConfig(
        approved=True,
        stale_after_days=90,
        obligation_variance_pct=20,
        obligation_variance_abs_inr=2_000,
    )
    for scenario, code in (
        ("STALE_REPORT", DQ_BUREAU_REPORT_STALE),
        ("INCONSISTENT_INCOME_OBLIGATIONS", DQ_INCOME_OBLIGATION_INCONSISTENT),
    ):
        case = _case(scenario)
        gate = evaluate_data_quality(
            case["application"], _report(case["case_id"]), as_of=AS_OF, config=config
        )
        assert code in gate.reason_codes


def test_approved_flag_with_disabled_gates_keeps_them_off():
    config = GateConfig(approved=True)
    for scenario in ("STALE_REPORT", "INCONSISTENT_INCOME_OBLIGATIONS"):
        case = _case(scenario)
        gate = evaluate_data_quality(
            case["application"], _report(case["case_id"]), as_of=AS_OF, config=config
        )
        assert not gate.review_required


def test_committed_policy_file_is_unapproved():
    config = load_gate_config()
    assert config.approved is False
    assert config.stale_after_days is None
    assert config.obligation_variance_pct is None


# --------------------------------------------------------------- generator


def test_generator_is_deterministic():
    first = build_cases(120, seed=20261024, as_of=AS_OF)
    second = build_cases(120, seed=20261024, as_of=AS_OF)
    assert first == second


def test_generator_supports_1000_cases_without_duplicate_ids():
    cases = build_cases(1_000, seed=20261024, as_of=AS_OF)
    ids = [c["case_id"] for c in cases]
    assert len(ids) == 1_000 == len(set(ids))
    assert {c["provenance"]["origin"] for c in cases} == {"golden_fixture"}


# ------------------------------------------------------- fixture integrity


def test_fixture_matches_plan_and_has_no_duplicates():
    assert FIXTURE["count"] == len(CASES) == 120
    counts: dict[str, int] = {}
    for case in FIXTURE["cases"]:
        counts[case["scenario"]] = counts.get(case["scenario"], 0) + 1
    assert counts == {
        scenario: BASE_PLAN.count(scenario) for scenario in set(BASE_PLAN)
    }


def test_fixture_expected_outcomes_are_reproducible():
    for case in FIXTURE["cases"]:
        report = (
            BureauReport.model_validate(case["report"]) if case["report"] else None
        )
        gate = evaluate_data_quality(case["application"], report, as_of=AS_OF)
        expected = case["expected"]
        if report is None:
            assert expected["outcome"] == "ERROR", case["case_id"]
        elif gate.review_required:
            assert expected["outcome"] == "REVIEW", case["case_id"]
            assert expected["review_reason_codes"] == gate.reason_codes
            assert expected["decision"] == "ERROR"
        else:
            assert expected["outcome"] in ("APPROVED", "REJECTED"), case["case_id"]
            assert expected["score_value"] == gate.score.value
