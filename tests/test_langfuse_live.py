"""Live self-hosted Langfuse checks (opt-in, local only).

    LANGFUSE_LIVE=1 LANGFUSE_ENABLED=1 LANGFUSE_PUBLIC_KEY=pk-lf-... LANGFUSE_SECRET_KEY=sk-lf-... \
    LANGFUSE_BASE_URL=http://127.0.0.1:3000 pytest tests/test_langfuse_live.py -q

Skipped entirely without LANGFUSE_LIVE=1, so the normal suite never depends on Docker. Every request here is
synthetic: the agent runs offline with a scripted LLM and MockStore fixtures.
"""
import base64
import json
import os
import time
import urllib.request
import uuid

import pytest

from loan_advisory.agent import langfuse_config
from loan_advisory.agent import observability as obs
from tests.test_agent_graph import FakePolicy, ScriptedLLM, agent_for, ask

LIVE = os.environ.get("LANGFUSE_LIVE") == "1"
pytestmark = pytest.mark.skipif(not LIVE, reason="set LANGFUSE_LIVE=1 with a local Langfuse stack")


def _observations(cfg, trace_id):
    url = f"{cfg.base_url}/api/public/v2/observations?traceId={trace_id}&limit=100"
    auth = base64.b64encode(f"{cfg.public_key}:{cfg.secret_key}".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}"})
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.load(r).get("data") or []


def _wait_for_trace(cfg, trace_id, minimum=1, timeout_s=30):
    deadline = time.time() + timeout_s
    rows = []
    while time.time() < deadline:
        rows = _observations(cfg, trace_id)
        if len(rows) >= minimum:
            return rows
        time.sleep(1)
    return rows


def _active_config():
    cfg = langfuse_config.load()
    if not cfg.active:
        pytest.skip(f"Langfuse config is not active: {cfg.problems}")
    return cfg


def test_synthetic_span_tree_is_ingested_with_hierarchy():
    cfg = _active_config()
    name = f"lf.live.{uuid.uuid4().hex[:8]}"
    obs.reset()
    try:
        with obs.span(name, kind="CHAIN", **{"langfuse.trace.name": name,
                                             "langfuse.trace.metadata.case_id": '"synthetic-live-check"',
                                             "langfuse.observation.metadata.marker": '"synthetic"'}):
            trace_id = format(obs.current_span().get_span_context().trace_id, "032x")
            with obs.span(f"{name}.child", kind="TOOL"):
                pass
        obs.flush(5000)
        rows = _wait_for_trace(cfg, trace_id, minimum=2)
    finally:
        client = obs._LANGFUSE
        obs.reset()
        if client is not None:
            client.shutdown()

    assert len(rows) >= 2, "the trace did not reach the local Langfuse instance"
    root = next(r for r in rows if r["name"] == name)
    child = next(r for r in rows if r["name"] == f"{name}.child")
    assert root["isRootObservation"] is True
    assert root["type"] == "CHAIN" and child["type"] == "TOOL"
    assert root["environment"] == cfg.environment
    assert child["traceId"] == root["traceId"] == trace_id
    assert child["parentObservationId"] == root["id"]


def test_real_agent_turn_is_ingested_without_content(tmp_path):
    cfg = _active_config()
    obs.reset()
    try:
        ag, _, _ = agent_for(ScriptedLLM(intent="policy"), FakePolicy(), tmp_path=tmp_path)
        resp = ask(ag, "How do I file a complaint?")
        assert resp.answer
        trace_id = resp.trace_id
        obs.flush(5000)
        rows = _wait_for_trace(cfg, trace_id, minimum=5)
    finally:
        client = obs._LANGFUSE
        obs.reset()
        if client is not None:
            client.shutdown()

    by_name = {r["name"]: r for r in rows}
    assert "advisor.turn" in by_name, rows
    root = by_name["advisor.turn"]
    assert root["isRootObservation"] is True and root["environment"] == cfg.environment
    assert "node.classify" in by_name and "node.retrieve_policy" in by_name
    assert all(r["traceId"] == trace_id for r in rows)
    # v2 list rows carry no content fields; the raw privacy check lives in tests/test_langfuse_tracing.py
    assert "How do I file a complaint?" not in json.dumps(rows)
