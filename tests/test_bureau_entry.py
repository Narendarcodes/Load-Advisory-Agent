"""Application entry point: validation, provider-failure mapping, and the authenticated route."""
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent.contracts import Session
from loan_advisory.agent.server import App
from loan_advisory.agent.tools import DecisionTools, InMemoryEvidenceSource
from loan_advisory.application.bureau_intake import (
    BureauInputError,
    run_bureau_evaluation,
)
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import UnknownApplication
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads(
    (ROOT / "data" / "synthetic" / "bureau" / "cases_120.json").read_text(encoding="utf-8")
)


def _case(scenario: str, position: int = 0) -> dict:
    return [c for c in FIXTURE["cases"] if c["scenario"] == scenario][position]


class _Store:
    def __init__(self, cases: list[dict]):
        self._docs = {c["application"]["application_id"]: to_frappe_doc(c) for c in cases}

    def get(self, application_id: str) -> dict:
        if application_id not in self._docs:
            raise UnknownApplication(application_id)
        return dict(self._docs[application_id])


@pytest.fixture
def client():
    http = TestClient(create_app())
    yield BureauClient(client=http)
    http.close()


def _run(case, client, scenario=None):
    sink = InMemoryEvidenceSink()
    store = _Store([case])
    res = run_bureau_evaluation(
        case["application"]["application_id"], store=store, sink=sink,
        bureau_client=client, scenario=scenario,
    )
    return res, sink


# --------------------------------------------------------------- service entry point
def test_approved_application_is_persisted_and_typed(client):
    case = _case("VALID_PASS", 0)
    res, sink = _run(case, client)
    assert res.status == 200 and res.error is None
    assert res.outcome == "APPROVED" and res.decision == "APPROVED"
    assert res.lifecycle_state == "APPROVED"
    assert res.score_source == "SYNTHETIC_BUREAU_REPLACED_PLACEHOLDER"
    assert res.provider_error is None and res.retryable is False
    assert sink.records[res.record_id]["bureau"]["score"]["source"] == res.score_source


def test_data_quality_hold_is_review_not_rejection(client):
    res, _ = _run(_case("NO_HIT"), client)
    assert res.status == 200
    assert res.outcome == "REVIEW" and res.decision == "ERROR"
    assert res.data_quality_category == "DATA_QUALITY"
    assert res.lifecycle_state == "MANUAL_REVIEW"
    assert res.provider_error is None


def test_missing_application_fields_request_information(client):
    res, _ = _run(_case("MISSING_REQUIRED_FIELDS"), client)
    assert res.outcome == "REVIEW"
    assert res.lifecycle_state == "INFO_REQUESTED"
    assert res.missing_fields, "missing fields must be reported to the caller"


@pytest.mark.parametrize(
    "scenario, status, code, retryable",
    [("TIMEOUT", 503, "BUREAU_TIMEOUT", True),
     ("UNAVAILABLE", 503, "BUREAU_UNAVAILABLE", True),
     ("RATE_LIMIT", 503, "BUREAU_RATE_LIMITED", True),
     ("MALFORMED_RESPONSE", 422, "BUREAU_MALFORMED_RESPONSE", False)],
)
def test_provider_failures_are_distinct_and_persisted(client, scenario, status, code, retryable):
    res, sink = _run(_case("VALID_PASS"), client, scenario=scenario)
    assert res.status == status and res.error == code
    assert res.outcome == res.decision == "ERROR"
    assert res.provider_error["code"] == code
    assert res.retryable is retryable
    assert res.lifecycle_state == "MANUAL_REVIEW"
    assert sink.records[res.record_id]["outcome"] == "ERROR"


def test_unknown_application_fails_before_any_provider_call(client):
    with pytest.raises(UnknownApplication):
        run_bureau_evaluation("SYN-UNKNOWN-0001", store=_Store([]), sink=InMemoryEvidenceSink(),
                              bureau_client=client)


@pytest.mark.parametrize("bad", ["", "A", "../etc/passwd", "APP TEST"])
def test_invalid_application_ref_is_rejected(client, bad):
    with pytest.raises(BureauInputError):
        run_bureau_evaluation(bad, store=_Store([]), sink=InMemoryEvidenceSink(), bureau_client=client)


def test_invalid_scenario_is_rejected_before_the_provider_call(client):
    with pytest.raises(BureauInputError):
        run_bureau_evaluation("APP-TEST-001", store=_Store([]), sink=InMemoryEvidenceSink(),
                              bureau_client=client, scenario="DO_ANYTHING")


# --------------------------------------------------------------- authenticated route
def _app_for(case, client):
    sink = InMemoryEvidenceSink()
    store = _Store([case])
    tools = DecisionTools(store, InMemoryEvidenceSource(sink))
    app = App(SimpleNamespace(tools=tools), resolve=None, demo=[], bureau_client=client)
    return app, sink


def test_route_requires_the_application_to_belong_to_the_session(client):
    case = _case("VALID_PASS", 0)
    app, _ = _app_for(case, client)
    status, body = app.bureau_run(
        {"application_ref": case["application"]["application_id"], "applicant_ref": "SOMEONE-ELSE"}, {})
    assert status == 403
    assert "belong" in body["error"]


def test_route_uses_the_session_ref_and_ignores_a_body_ref(client):
    case = _case("VALID_PASS", 0)
    app_id = case["application"]["application_id"]
    app, sink = _app_for(case, client)
    claims = {"application_ref": app_id, "applicant_ref": case["application"]["applicant_id"]}
    status, body = app.bureau_run(claims, {"application_ref": "APP-TEST-001"})
    assert status == 200
    assert body["result"]["application_ref"] == app_id
    assert body["result"]["outcome"] == "APPROVED"
    assert sink.records


def test_route_maps_invalid_scenario_to_400(client):
    case = _case("VALID_PASS", 0)
    app, _ = _app_for(case, client)
    claims = {"application_ref": case["application"]["application_id"],
              "applicant_ref": case["application"]["applicant_id"]}
    status, body = app.bureau_run(claims, {"scenario": "NOT_A_SCENARIO"})
    assert status == 400 and "scenario" in body["error"]


def test_route_returns_the_provider_failure_status_and_persists_evidence(client):
    case = _case("VALID_PASS", 0)
    app, sink = _app_for(case, client)
    claims = {"application_ref": case["application"]["application_id"],
              "applicant_ref": case["application"]["applicant_id"]}
    status, body = app.bureau_run(claims, {"scenario": "MALFORMED_RESPONSE"})
    assert status == 422
    assert body["result"]["retryable"] is False
    assert body["result"]["provider_error"]["code"] == "BUREAU_MALFORMED_RESPONSE"
    assert sink.records, "a provider failure must still leave an auditable evidence record"
