"""Phase 2: synthetic bureau service contract and HTTP client failure mapping."""
import json
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from loan_advisory.infrastructure.bureau_client import BureauClient
from synthetic_bureau.app import create_app

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = json.loads(
    (ROOT / "data" / "synthetic" / "bureau" / "cases_120.json").read_text(encoding="utf-8")
)


def _case(scenario: str, position: int = 0) -> dict:
    return [c for c in FIXTURE["cases"] if c["scenario"] == scenario][position]


@pytest.fixture
def http():
    client = TestClient(create_app())
    yield client
    client.close()


@pytest.fixture
def client(http):
    # TestClient is an httpx.Client, so the same injection point the app uses works here.
    return BureauClient(client=http)


def test_health_is_local_and_synthetic(http):
    body = http.get("/healthz").json()
    assert body["status"] == "ok" and body["synthetic"] is True


def test_fixture_application_returns_the_golden_report(client):
    case = _case("VALID_PASS", 1)
    result = client.fetch_report(
        case["application"]["application_id"], case["application"]["applicant_id"]
    )
    assert result.ok
    assert result.report.report_id == case["report"]["report_id"]
    assert result.report.provenance.record_origin == "golden_fixture"


def test_unknown_application_is_generated_deterministically(client):
    first = client.fetch_report("SYN-GEN-000001", "SYN-CUS-GEN-1")
    second = client.fetch_report("SYN-GEN-000001", "SYN-CUS-GEN-1")
    assert first.ok and second.ok
    assert first.report.provenance.record_origin == "generated_on_demand"
    assert first.report.report_id == second.report.report_id


@pytest.mark.parametrize(
    "scenario, expected_code",
    [
        ("RATE_LIMIT", "BUREAU_RATE_LIMITED"),
        ("UNAVAILABLE", "BUREAU_UNAVAILABLE"),
        ("TIMEOUT", "BUREAU_TIMEOUT"),
        ("MALFORMED_RESPONSE", "BUREAU_MALFORMED_RESPONSE"),
    ],
)
def test_provider_failures_map_to_codes(client, scenario, expected_code):
    result = client.fetch_report("SYN-FAIL-000001", "SYN-CUS-FAIL-1", scenario)
    assert not result.ok
    assert result.error_code == expected_code
    assert result.retryable is (expected_code != "BUREAU_MALFORMED_RESPONSE")
    # Wire value, not the enum repr (which would leak "BureauScenario.").
    if expected_code == "BUREAU_MALFORMED_RESPONSE":
        # This payload deliberately omits the versioned error contract.
        assert result.correlation_id is None
    else:
        assert result.correlation_id == f"BUREAU-SYN-FAIL-000001-{scenario}"


def test_fixture_provider_cases_expose_failures_without_a_scenario(client):
    for scenario in ("RATE_LIMIT", "UNAVAILABLE", "TIMEOUT", "MALFORMED_RESPONSE"):
        case = _case(scenario)
        result = client.fetch_report(
            case["application"]["application_id"], case["application"]["applicant_id"]
        )
        assert not result.ok
        assert result.report is None


def test_no_hit_and_thin_history_never_invent_a_score(client):
    for scenario in ("NO_HIT", "THIN_HISTORY"):
        case = _case(scenario)
        result = client.fetch_report(
            case["application"]["application_id"], case["application"]["applicant_id"]
        )
        assert result.ok
        assert result.report.score.value is None
        assert result.report.score.status.value != "AVAILABLE"


def test_contract_violation_is_not_retryable(client):
    result = client.fetch_report("A", "B")
    assert result.error_code == "BUREAU_MALFORMED_RESPONSE"
    assert result.retryable is False


@pytest.mark.parametrize(
    "url",
    [
        "http://bureau.example.com",
        "http://127.0.0.1.evil.example",
        "http://localhost.evil.example",
        "http://127.0.0.1@evil.example",
        "https://127.0.0.1:8001",
        "http://user:pass@127.0.0.1:8001",
        "http://[::1]:8001",
        "http://localhost.:8001",
        "http://2130706433:8001",
        "http://127.0.0.1:8001/bureau",
        "http://127.0.0.1:8001/?x=1",
        "http://127.0.0.1:99999",
        "http://127.0.0.1:port",
    ],
)
def test_unsupported_bureau_origins_fail_closed(url):
    with pytest.raises(ValueError):
        BureauClient(url)


def test_plain_loopback_origins_are_accepted():
    for url in ("http://127.0.0.1:8001", "http://localhost:8001",
                "http://127.0.0.1", "http://LOCALHOST:9000", "http://127.0.0.1:8001/"):
        BureauClient(url)


def test_stale_scenario_returns_an_actually_stale_report(client):
    result = client.fetch_report("SYN-STALE-0001", "SYN-CUS-STALE-1", "STALE")
    assert result.ok
    age = (date(2026, 10, 24) - result.report.report_date).days
    assert age == 145


def test_every_stored_request_replays_its_stored_response(client):
    for case in FIXTURE["cases"]:
        request = case["request"]
        result = client.fetch_report(
            request["application_id"], request["applicant_id"], request.get("scenario")
        )
        if case["report"] is None:
            assert not result.ok, case["case_id"]
            assert result.error_code == case["expected"]["error_code"], case["case_id"]
        else:
            assert result.ok, case["case_id"]
            assert result.report.model_dump(mode="json") == case["report"], case["case_id"]
