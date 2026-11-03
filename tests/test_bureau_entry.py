"""Bureau evaluation entry point: validation and provider-failure mapping, plus the proof that
the advisory agent cannot reach it (Phase 1 security boundary A)."""
import inspect
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.agent import server as srv
from loan_advisory.agent.runtime import build_offline_agent
from loan_advisory.agent.server import App
from loan_advisory.api.app import create_app as create_agent_app
from loan_advisory.application.bureau_intake import (
    BureauInputError,
    run_bureau_evaluation,
)
from loan_advisory.infrastructure.bureau_client import BureauClient
from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import UnknownApplication
from synthetic_bureau.app import create_app
from synthetic_bureau.labeling import to_frappe_doc
from tests.test_agent_graph import FakePolicy, ScriptedLLM

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


# --------------------------------------------------------------- agent boundary
@pytest.fixture
def agent_app():
    agent, store, _ = build_offline_agent(llm=ScriptedLLM(intent="explain"), policy_tools=FakePolicy())
    return TestClient(create_agent_app(App(agent)))


def test_the_agent_exposes_no_bureau_execution_route(agent_app):
    paths = {getattr(r, "path", "") for r in agent_app.app.routes}
    assert "/api/bureau/run" not in paths
    assert not [p for p in paths if p.startswith("/api/bureau")]


def test_the_agent_rejects_the_old_route_with_an_unregistered_path(agent_app):
    """No auth, no admission slot, no handler: the path is simply not part of the agent surface."""
    assert agent_app.post("/api/bureau/run", json={}).status_code == 404
    assert not any(getattr(r, "path", "").startswith("/api/bureau") for r in agent_app.app.routes)


def test_the_agent_service_has_no_bureau_run_method_or_client():
    assert not hasattr(App, "bureau_run")
    assert "bureau_client" not in inspect.signature(App.__init__).parameters


def test_the_agent_server_never_imports_the_bureau_pipeline():
    """No agent-runtime path can start an evaluation, not even one added by wiring a client."""
    for name in ("run_bureau_evaluation", "BureauClient", "bureau_client_from", "BureauInputError"):
        assert not hasattr(srv, name), name
    source = Path(srv.__file__).read_text(encoding="utf-8")
    assert not re.search(r"\bbureau_\w+", source), "a bureau code reference came back"
    assert "BureauClient" not in source and "bureau_intake" not in source


def test_the_agent_server_takes_no_bureau_origin():
    args = srv.parse_args(["--offline"])
    assert "bureau_url" not in vars(args)
    with pytest.raises(SystemExit):
        srv.parse_args(["--bureau-url", "http://127.0.0.1:8011"])


def test_bureau_evaluation_still_runs_as_an_upstream_entry_point(client):
    """Removing the route does not remove the pipeline: the direct entry point still evaluates and persists."""
    res, sink = _run(_case("VALID_PASS", 0), client)
    assert res.outcome == "APPROVED"
    assert sink.records[res.record_id]["lifecycle_state"] == "APPROVED"
