"""Startup contract: the agent verifies Frappe assertions and refuses to run without its verifier secret.

The secret is the site's `agent_assertion_secret`, handed to the service as `AGENT_ASSERTION_SECRET`. A
missing, blank or short value stops startup before the retriever loads or a port opens; there is no dev
fallback, because this service no longer mints credentials and cannot be reached without one.
"""
import pytest

from loan_advisory.agent import server as srv


def test_a_long_enough_secret_is_accepted(monkeypatch):
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", "s" * srv.MIN_SECRET_LENGTH)
    srv._require_secret()   # returns; nothing else to assert


@pytest.mark.parametrize("secret", [None, "", "   ", "s" * 31])
def test_missing_blank_or_short_secrets_fail_closed(monkeypatch, secret):
    if secret is None:
        monkeypatch.delenv("AGENT_ASSERTION_SECRET", raising=False)
    else:
        monkeypatch.setenv("AGENT_ASSERTION_SECRET", secret)
    with pytest.raises(SystemExit) as exc:
        srv._require_secret()
    assert "AGENT_ASSERTION_SECRET" in str(exc.value) and "32" in str(exc.value)


def test_main_fails_closed_without_a_secret(monkeypatch):
    monkeypatch.delenv("AGENT_ASSERTION_SECRET", raising=False)
    with pytest.raises(SystemExit):
        srv.main(["--offline", "--no-rag"])   # stops before the agent or the port is touched


def test_main_fails_closed_before_loading_the_retriever(monkeypatch):
    """No --no-rag: the exit must happen before load_policy_tools, not after it."""
    monkeypatch.setenv("AGENT_ASSERTION_SECRET", "too-short")
    with pytest.raises(SystemExit):
        srv.main(["--offline"])
