"""Telemetry init: the content switch is read per call, not frozen at import time.

Importing observability must not decide whether applicant text may be exported; a process that
starts with AGENT_TRACE_CONTENT unset and enables it later (or vice versa) must see the current value.
"""
from loan_advisory.agent import observability as obs


def test_content_flag_is_read_at_call_time(monkeypatch):
    monkeypatch.delenv("AGENT_TRACE_CONTENT", raising=False)
    assert obs.content("salary 90000") is None

    monkeypatch.setenv("AGENT_TRACE_CONTENT", "1")
    assert obs.content("salary 90000") == "salary 90000"

    monkeypatch.setenv("AGENT_TRACE_CONTENT", "0")
    assert obs.content("salary 90000") is None


def test_import_does_not_expose_a_module_level_content_switch():
    assert not hasattr(obs, "CONTENT")
