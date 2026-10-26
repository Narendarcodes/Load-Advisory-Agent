"""Regression (QA 2026-10-26, D2): the synthetic bureau and the self-hosted LLM both default to 127.0.0.1:8001.

With the documented LLM on :8001, POST /api/bureau/run reached the LLM server instead of the bureau and every run
came back as a non-retryable BUREAU_MALFORMED_RESPONSE, and the bureau service could not be started next to it.
The chat server now takes a loopback-validated bureau origin (--bureau-url / BUREAU_BASE_URL) and the synthetic
service a --port; defaults are unchanged."""
import pytest

from loan_advisory.agent import server
from synthetic_bureau import app as bureau_app


def test_server_default_keeps_the_existing_bureau_client():
    args = server.parse_args(["--offline"], env={})
    assert args.bureau_url is None
    assert server.bureau_client_from(args) is None  # App falls back to BureauClient() exactly as before


def test_server_flag_points_the_bureau_client_at_another_loopback_port():
    args = server.parse_args(["--offline", "--bureau-url", "http://127.0.0.1:8011"], env={})
    client = server.bureau_client_from(args)
    assert client._base_url == "http://127.0.0.1:8011"


def test_server_env_sets_the_bureau_origin_and_the_flag_wins():
    assert server.parse_args([], env={"BUREAU_BASE_URL": "http://localhost:8012"}).bureau_url == "http://localhost:8012"
    args = server.parse_args(["--bureau-url", "http://127.0.0.1:8013"], env={"BUREAU_BASE_URL": "http://localhost:8012"})
    assert args.bureau_url == "http://127.0.0.1:8013"


@pytest.mark.parametrize("bad", ["https://127.0.0.1:8011", "http://example.com:8011", "http://127.0.0.1.nip.io:1",
                                 "http://user:pw@127.0.0.1:8011", "http://127.0.0.1:8011/v1"])
def test_server_refuses_a_non_loopback_bureau_origin(bad):
    with pytest.raises(ValueError):
        server.bureau_client_from(server.parse_args(["--bureau-url", bad], env={}))


def test_synthetic_bureau_port_flag_defaults_to_8001_and_stays_on_loopback():
    assert bureau_app.parse_args([]).port == 8001
    assert bureau_app.parse_args(["--port", "8011"]).port == 8011
    with pytest.raises(SystemExit):
        bureau_app.parse_args(["--port", "70000"])
