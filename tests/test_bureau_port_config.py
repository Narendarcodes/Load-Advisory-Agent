"""Regression (QA 2026-10-26, D2), restated for the Phase 1 boundary.

The original finding: the synthetic bureau and the self-hosted LLM both defaulted to
127.0.0.1:8001, so ``POST /api/bureau/run`` on the chat server reached the LLM instead of the
bureau and every run came back as a non-retryable BUREAU_MALFORMED_RESPONSE. The fix at the time was a
loopback-validated bureau origin on the chat server (``--bureau-url`` / ``BUREAU_BASE_URL``).

Phase 1 security boundary A removes the chat server's bureau execution route, so that origin belongs to the
bureau pipeline process, not to the agent. The collision regression still holds in the layer that owns it:
``BureauClient`` refuses a non-loopback origin, and the synthetic service still takes ``--port``.
"""
import pytest

from loan_advisory.agent import server
from loan_advisory.infrastructure.bureau_client import BureauClient
from synthetic_bureau import app as bureau_app


def test_the_agent_server_has_no_bureau_origin_of_any_kind():
    args = server.parse_args(["--offline"])
    assert "bureau_url" not in vars(args)
    assert not hasattr(server, "bureau_client_from")


def test_the_agent_server_rejects_the_removed_flag():
    with pytest.raises(SystemExit):
        server.parse_args(["--offline", "--bureau-url", "http://127.0.0.1:8011"])


def test_the_bureau_environment_variable_no_longer_reaches_the_agent(monkeypatch):
    """BUREAU_BASE_URL cannot resurrect the removed route: nothing in the agent reads it any more."""
    monkeypatch.setenv("BUREAU_BASE_URL", "http://127.0.0.1:8011")
    args = server.parse_args(["--offline"])
    assert "bureau_url" not in vars(args)
    assert not hasattr(server, "bureau_client_from")
    assert not hasattr(server.App, "bureau_run")


@pytest.mark.parametrize("bad", ["https://127.0.0.1:8011", "http://example.com:8011", "http://127.0.0.1.nip.io:1",
                                 "http://user:pw@127.0.0.1:8011", "http://127.0.0.1:8011/v1"])
def test_the_bureau_client_still_refuses_a_non_loopback_origin(bad):
    """The guard moved, it did not disappear: whoever runs the pipeline still cannot point it off-box."""
    with pytest.raises(ValueError):
        BureauClient(bad)


def test_synthetic_bureau_port_flag_defaults_to_8001_and_stays_on_loopback():
    assert bureau_app.parse_args([]).port == 8001
    assert bureau_app.parse_args(["--port", "8011"]).port == 8011
    with pytest.raises(SystemExit):
        bureau_app.parse_args(["--port", "70000"])
