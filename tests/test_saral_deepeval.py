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


# ------------------------------------------------------------------ v2 run: multi-query merge in the sandbox
def _cand():
    return {"qid": "A", "queries": ["Is there a wedding limit and how long can I repay?", "wedding loan limit",
                                    "personal loan repayment tenure"],
            "by_depth": {"50": [
                {"saral_nbfc_policy": [["N1", 0.9], ["N2", 0.8], ["N3", 0.7], ["N4", 0.6], ["N5", 0.5]],
                 "rbi_regulatory": [["R1", 0.4]]},
                {"saral_nbfc_policy": [["W1", 0.95], ["N1", 0.9]], "rbi_regulatory": [["R2", 0.01]]},
                {"saral_nbfc_policy": [["T1", 0.85]], "rbi_regulatory": []}]}}


def test_merge_top_single_query_matches_the_baseline_union_cut():
    ev = _load("eval_saral_deepeval")
    conf = {"depth": "50", "router": False, "demote": 0.7, "subqueries": False, "original_first": 1, "min_score": 0.0}
    assert [c for c, _ in ev.merge_top(_cand(), conf)] == ["N1", "N2", "N3", "N4", "N5"]


def test_merge_top_gives_each_sub_query_a_slot():
    ev = _load("eval_saral_deepeval")
    conf = {"depth": "50", "router": False, "demote": 0.7, "subqueries": True, "original_first": 1, "min_score": 0.05}
    got = [c for c, _ in ev.merge_top(_cand(), conf)]
    assert got[0] == "N1" and "W1" in got and "T1" in got and "R2" not in got and len(got) == 5


def test_cached_reranker_scores_each_pair_once():
    ev = _load("eval_saral_deepeval")

    class R:
        calls = 0

        def score(self, q, chunks):
            R.calls += len(chunks)
            return [len(c["text"]) for c in chunks]
    cr = ev._CachedReranker(R())
    a = cr.score("q", [{"chunk_id": "x", "text": "ab"}, {"chunk_id": "y", "text": "abc"}])
    b = cr.score("q", [{"chunk_id": "y", "text": "abc"}, {"chunk_id": "z", "text": "a"}])
    assert a == [2, 3] and b == [3, 1] and R.calls == 3


def test_agent_judge_and_summary_use_only_generated_conversations(tmp_path):
    """A `--limit` generate run writes fewer conversations than the dev gold; judge/summarise must not KeyError."""
    from types import SimpleNamespace
    m = _load("eval_saral_agent")
    gold = tmp_path / "gold.jsonl"
    _write(gold, [{"conv_id": c, "split": "dev"} for c in ("C1", "C2", "C3")] + [{"conv_id": "H1", "split": "heldout"}])
    _write(tmp_path / "agent_turns.jsonl", [{"conv_id": "C2", "turns": []}])
    g, r = m.gold_and_runs(SimpleNamespace(golden=str(gold), manifest=None), tmp_path)
    assert list(g) == ["C2"] and list(r) == ["C2"]
