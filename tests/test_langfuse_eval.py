"""Evaluation workflow: the deterministic citation audit is reproducible without Langfuse, and publishing is opt-in.

The dry-run subprocess exercises the same command operators use; it must not need Docker, keys or network.
"""
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "development" / "langfuse_publish_eval.py"
CASES = ROOT / "data" / "evaluation" / "agent" / "citation_audit_v1" / "cases.jsonl"


def _module():
    spec = importlib.util.spec_from_file_location("langfuse_publish_eval", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _env(**extra):
    env = {k: v for k, v in os.environ.items() if not k.startswith("LANGFUSE_")}
    env.update({"LANGFUSE_ENABLED": "0", "AGENT_TRACING": "0", **extra})
    return env


def _dry_run():
    return subprocess.run([sys.executable, str(SCRIPT), "--run-name", "dry-run"], cwd=ROOT, env=_env(),
                          capture_output=True, text=True, timeout=300)


def test_offline_eval_is_reproducible_without_langfuse():
    first, second = _dry_run(), _dry_run()
    assert first.returncode == 0, first.stderr
    one, two = json.loads(first.stdout), json.loads(second.stdout)
    assert one == two
    assert one["eval"]["benchmark"] == "citation_audit_v1" and one["eval"]["n"] == 29
    assert len(one["eval"]["cases_sha256"]) == 64
    assert "publish: dry run" in first.stderr


def test_publish_is_skipped_cleanly_when_langfuse_is_disabled():
    r = subprocess.run([sys.executable, str(SCRIPT), "--publish", "--run-name", "x"], cwd=ROOT, env=_env(),
                       capture_output=True, text=True, timeout=300)
    assert r.returncode == 2
    assert json.loads(r.stdout)["eval"]["n"] == 29  # the eval result is still produced
    assert "publish: SKIPPED" in r.stderr


def test_dataset_payload_contains_no_policy_text_or_composer_output():
    mod = _module()
    cases = mod._audit_module().load_cases(CASES)
    item = mod._safe_case(next(c for c in cases if c["kind"] == "citation"), "labels")
    assert set(item) == {"case_id", "question", "kind", "mode", "expected", "metadata"}
    blob = json.dumps(item)
    assert "passages" not in blob and "composer" not in blob and "\"text\"" not in blob
    assert item["mode"] == "labels" and item["metadata"]["benchmark"] == "citation_audit_v1"


def test_evaluators_report_case_and_run_scores():
    mod = _module()
    per_case = mod._case_evaluator(output={"ok": True, "cited": ["P1", "P2"], "forbidden_cited": 0, "precision": 1.0})
    assert {e["name"] for e in per_case} == {"case_ok", "forbidden_citations", "citation_precision"}
    assert next(e for e in per_case if e["name"] == "case_ok")["value"] is True

    results = [SimpleNamespace(output={"ok": True, "precision": 1.0}),
               SimpleNamespace(output={"ok": False, "precision": 0.5}),
               SimpleNamespace(output=None)]
    run = mod._run_evaluator(item_results=results)
    scores = {e["name"]: e["value"] for e in run}
    assert scores["case_ok_rate"] == 0.5
    assert scores["mean_citation_precision"] == 0.75
