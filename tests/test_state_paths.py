"""P0c: state path precedence, legacy adoption, private creation, and no destructive migration."""
import json
import logging
import os
import stat
from pathlib import Path

import pytest

from loan_advisory import state_paths as sp
from loan_advisory.agent.graph import AdvisoryAgent
from loan_advisory.agent.tools import HandoffQueue
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink

POSIX = pytest.mark.skipif(os.name != "posix", reason="POSIX permission bits")


def test_precedence_is_argument_then_artifact_env_then_state_dir_then_default(tmp_path):
    env = {sp.STATE_DIR_ENV: str(tmp_path / "state"), "AGENT_AUDIT_LOG": str(tmp_path / "env.jsonl")}
    assert sp.resolve(tmp_path / "arg.jsonl", "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl",
                      env=env) == tmp_path / "arg.jsonl"
    assert sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl",
                      env=env) == tmp_path / "env.jsonl"
    assert sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl",
                      env={sp.STATE_DIR_ENV: str(tmp_path / "state")}) == tmp_path / "state" / "turns.jsonl"
    assert sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl",
                      env={}) == Path("agent_out/turns.jsonl")


def test_state_dir_names_match_the_live_layout(tmp_path):
    env = {sp.STATE_DIR_ENV: str(tmp_path)}
    assert sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl", env=env) == tmp_path / "turns.jsonl"
    assert sp.resolve(None, "AGENT_HANDOFF_LOG", sp.HANDOFF_LOG, "agent_out/handoffs.jsonl",
                      env=env) == tmp_path / "handoffs.jsonl"
    assert sp.resolve(None, "EVIDENCE_TRACE_DIR", sp.TRACE_DIR, sp.LIVE_TRACE_DIR, env=env) == tmp_path / "traces"
    assert sp.resolve(None, "EVIDENCE_TRACE_DIR", sp.TRACE_DIR, sp.LIVE_TRACE_DIR,
                      env={}) == Path(sp.LIVE_TRACE_DIR)


def test_empty_env_values_do_not_count_as_a_location(tmp_path):
    env = {sp.STATE_DIR_ENV: "", "AGENT_AUDIT_LOG": ""}
    assert sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, "agent_out/turns.jsonl", env=env) == \
        Path("agent_out/turns.jsonl")


def test_no_configuration_adopts_the_existing_legacy_file(tmp_path, caplog):
    legacy = tmp_path / "agent_out" / "turns.jsonl"
    legacy.parent.mkdir()
    legacy.write_text("old\n", encoding="utf-8")
    with caplog.at_level(logging.WARNING, logger="loan_advisory.state_paths"):
        path = sp.resolve(None, "AGENT_AUDIT_LOG", sp.AUDIT_LOG, str(legacy), legacy=str(legacy), env={})
        with sp.append_private(path) as f:
            f.write("new\n")
    assert path == legacy
    assert legacy.read_text(encoding="utf-8") == "old\nnew\n"  # appended in place, not split
    assert not caplog.records  # adopting the legacy file is not a silent split


def test_override_warns_and_leaves_the_legacy_file_untouched(tmp_path, caplog):
    legacy = tmp_path / "agent_out" / "handoffs.jsonl"
    legacy.parent.mkdir()
    legacy.write_text("old\n", encoding="utf-8")
    with caplog.at_level(logging.WARNING, logger="loan_advisory.state_paths"):
        path = sp.resolve(None, "AGENT_HANDOFF_LOG", sp.HANDOFF_LOG, str(legacy), legacy=str(legacy),
                          env={sp.STATE_DIR_ENV: str(tmp_path / "state")})
    assert path == tmp_path / "state" / "handoffs.jsonl"
    assert not path.parent.exists()  # resolution alone creates and moves nothing
    assert legacy.read_text(encoding="utf-8") == "old\n"
    assert str(legacy) in caplog.text and "no automatic migration" in caplog.text


@POSIX
def test_new_directories_are_0700_and_new_files_0600(tmp_path):
    target = tmp_path / "a" / "b" / "handoffs.jsonl"
    with sp.append_private(target) as f:
        f.write("{}\n")
    assert stat.S_IMODE((tmp_path / "a").stat().st_mode) == 0o700
    assert stat.S_IMODE(target.parent.stat().st_mode) == 0o700
    assert stat.S_IMODE(target.stat().st_mode) == 0o600


@POSIX
def test_existing_modes_are_never_changed(tmp_path):
    old_dir = tmp_path / "old"
    old_dir.mkdir()
    os.chmod(old_dir, 0o755)
    existing = old_dir / "turns.jsonl"
    existing.write_text("x\n", encoding="utf-8")
    os.chmod(existing, 0o644)

    with sp.append_private(existing) as f:
        f.write("y\n")

    assert stat.S_IMODE(old_dir.stat().st_mode) == 0o755
    assert stat.S_IMODE(existing.stat().st_mode) == 0o644
    assert existing.read_text(encoding="utf-8") == "x\ny\n"


@POSIX
def test_trace_files_are_created_0600_and_never_overwritten(tmp_path):
    trace = tmp_path / "traces" / "abc.json"
    sp.write_private(trace, '{"a": 1}')
    sp.write_private(trace, '{"a": 2}')
    assert trace.read_text(encoding="utf-8") == '{"a": 1}'
    assert stat.S_IMODE(trace.stat().st_mode) == 0o600
    assert stat.S_IMODE(trace.parent.stat().st_mode) == 0o700


def test_handoff_queue_and_evidence_sink_follow_the_state_dir(tmp_path, monkeypatch):
    monkeypatch.setenv(sp.STATE_DIR_ENV, str(tmp_path))
    monkeypatch.delenv("AGENT_HANDOFF_LOG", raising=False)
    monkeypatch.delenv("EVIDENCE_TRACE_DIR", raising=False)

    queue = HandoffQueue()
    assert queue.path == tmp_path / "handoffs.jsonl"
    ref = queue.create("data_deletion", ["APP-TEST-005"], "please delete my data")
    assert ref.startswith("HO-")
    row = json.loads((tmp_path / "handoffs.jsonl").read_text(encoding="utf-8"))
    assert row["category"] == "data_deletion" and row["refs"] == ["APP-TEST-005"]

    sink = FrappeEvidenceSink(client=object())
    assert sink.trace_dir == tmp_path / "traces"


def test_audit_log_follows_the_state_dir(tmp_path, monkeypatch):
    monkeypatch.setenv(sp.STATE_DIR_ENV, str(tmp_path))
    monkeypatch.delenv("AGENT_AUDIT_LOG", raising=False)
    assert AdvisoryAgent(None, None).audit_path == tmp_path / "turns.jsonl"


def test_evidence_sink_writes_traces_through_the_shared_helper(tmp_path):
    class Reply:
        status_code, ok = 200, True

    sink = FrappeEvidenceSink(client=object(), trace_dir=str(tmp_path / "traces"))
    sink._req = lambda *args, **kwargs: Reply()
    record = {
        "trace_ref": {"sha256": "abc123"}, "record_id": "rec-1", "application_ref": "APP-1", "decision": "ERROR",
        "lifecycle_state": "REVIEW", "policy": {"id": "p", "version": "1", "policy_sha256": "a", "jdm_sha256": "b"},
        "inputs": {"input_sha256": "c"}, "engine": {"name": "ZEN", "version": "1"},
        "evaluated_at": "2026-01-01T00:00:00", "is_simulation": True,
    }
    sink.persist(record, "Open", {"steps": []})
    trace = tmp_path / "traces" / "abc123.json"
    assert json.loads(trace.read_text(encoding="utf-8")) == {"steps": []}
