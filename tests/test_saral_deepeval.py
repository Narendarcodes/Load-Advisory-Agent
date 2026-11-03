"""Saral DeepEval baseline: the held-out guard and the report generator (no GPU, no judge)."""
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / "policy" / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _item(qid, split="dev", behaviour="answer", lang="en", variant="direct"):
    return {"qid": qid, "split": split, "expected_behavior": behaviour, "language": lang, "variant": variant,
            "category": "fees_processing", "turns": [{"role": "user", "content": "q"}], "anchors": [], "gold_chunks": [],
            "gold_docs": []}


def _write(path, rows):
    path.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")


def test_load_golden_refuses_heldout_split(tmp_path):
    ev = _load("eval_saral_deepeval")
    _write(tmp_path / "golden.jsonl", [_item("A"), _item("B", split="heldout")])
    with pytest.raises(SystemExit):
        ev.load_golden(tmp_path)


def test_load_golden_refuses_manifest_heldout_ids(tmp_path):
    ev = _load("eval_saral_deepeval")
    _write(tmp_path / "golden.jsonl", [_item("A"), _item("B")])
    (tmp_path / "MANIFEST.json").write_text(json.dumps({"heldout_ids": ["B"]}), encoding="utf-8")
    with pytest.raises(SystemExit):
        ev.load_golden(tmp_path)


def test_load_golden_accepts_dev_only(tmp_path):
    ev = _load("eval_saral_deepeval")
    _write(tmp_path / "golden.jsonl", [_item("A"), _item("B")])
    (tmp_path / "MANIFEST.json").write_text(json.dumps({"heldout_ids": ["Z"]}), encoding="utf-8")
    assert [g["qid"] for g in ev.load_golden(tmp_path)] == ["A", "B"]


def test_report_reports_bars_and_breakdowns(tmp_path):
    rep = _load("report_saral_deepeval")
    res = tmp_path / "results"
    res.mkdir()
    _write(tmp_path / "golden.jsonl", [_item("A"), _item("B", lang="hi", variant="paraphrase"),
                                       _item("C", behaviour="refuse", variant="behaviour")])
    per = [
        {"qid": "A", "category": "fees", "expected_behavior": "answer", "language": "en", "variant": "direct",
         "scores": {"Faithfulness": 0.9, "AnswerRelevancy": 0.7, "ContextualRecall": 1.0, "ContextualPrecision": 1.0},
         "failures": [], "declined": False, "asked_question": False},
        {"qid": "B", "category": "fees", "expected_behavior": "answer", "language": "hi", "variant": "paraphrase",
         "scores": {"Faithfulness": 0.5, "AnswerRelevancy": 0.9, "ContextualRecall": 0.0, "ContextualPrecision": None},
         "failures": ["retrieval_miss"], "declined": False, "asked_question": False},
        {"qid": "C", "category": "adv", "expected_behavior": "refuse", "language": "en", "variant": "behaviour",
         "scores": {"ExpectedBehaviour": 1.0}, "failures": [], "declined": True, "asked_question": False},
    ]
    _write(res / "per_question.jsonl", per)
    agg = {m: {"n": 2, "scored": 2, "mean": None} for m in rep.RAG}
    agg["Faithfulness"]["mean"], agg["AnswerRelevancy"]["mean"], agg["ContextualRecall"]["mean"] = 0.7, 0.8, 0.5
    (res / "summary.json").write_text(json.dumps({"deepeval": agg, "deterministic": {}, "questions": 3,
                                                  "questions_with_failure": 1}), encoding="utf-8")
    (res / "status.json").write_text(json.dumps({"completed": True}), encoding="utf-8")
    (res / "judge_info.json").write_text(json.dumps({"judge_model": "small/judge", "jobs": 10, "errors": 0}), encoding="utf-8")
    md, compact, _ = rep.build(res, tmp_path / "golden.jsonl", {})
    assert compact["headline"]["Faithfulness"]["pass"] is False
    assert compact["headline"]["AnswerRelevancy"]["pass"] is True
    assert "automated" in md and "## 8. Limitations (automated)" in md and "| hi |" in md and "| paraphrase |" in md
    assert compact["behaviour"]["refuse"]["deterministic_rate"] == 1.0
