"""Store selection is fail-closed: synthetic records require an explicit opt-in.

Regression for the silent `MockStore` fallback: a live configuration that cannot be built must raise,
never serve synthetic applications as if they were live ones.
"""
import pytest

from loan_advisory.infrastructure import frappe_adapter as fa


def _clear_store_env(monkeypatch):
    for key in ("AGENT_STORE", "FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"):
        monkeypatch.delenv(key, raising=False)


def test_live_mode_without_configuration_fails_closed(monkeypatch):
    _clear_store_env(monkeypatch)
    with pytest.raises(fa.FrappeUnavailable):
        fa.get_store()


def test_partial_configuration_also_fails_closed(monkeypatch):
    _clear_store_env(monkeypatch)
    monkeypatch.setenv("FRAPPE_URL", "http://127.0.0.1:8000")
    with pytest.raises(fa.FrappeUnavailable):
        fa.get_store()


def test_mock_store_requires_explicit_opt_in(monkeypatch):
    _clear_store_env(monkeypatch)
    monkeypatch.setenv("AGENT_STORE", "mock")
    assert isinstance(fa.get_store(), fa.MockStore)
