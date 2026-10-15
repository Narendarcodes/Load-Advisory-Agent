"""The larger abstention / unanswerable set (data/evaluation/rag/bajaj_v1/abstain_v2.jsonl) is well-formed and disjoint."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT / "data/evaluation/rag/bajaj_v1/benchmark.jsonl"
ABSTAIN = ROOT / "data/evaluation/rag/bajaj_v1/abstain_v2.jsonl"
CATS = {"abstain_invented", "abstain_other_lender", "abstain_guarantee", "abstain_comparison", "abstain_future",
        "abstain_out_of_scope", "abstain_action", "abstain_injection", "abstain_personal_data"}


def rows(p):
    return [json.loads(l) for l in p.open() if l.strip()]


def test_abstain_set_is_large_well_formed_and_all_unanswerable():
    rs = rows(ABSTAIN)
    assert len(rs) >= 40
    for q in rs:
        assert q["expect_abstain"] is True and q["gold_docs"] == [] and q["gold_anchors"] == [] and q["answer"] is None
        assert q["category"] in CATS and q["origin"] == "agent_authored" and q["split"] == "abstain_v2"
        assert q["profile"] in {"bajaj_finance", "generic_bank", "generic_nbfc"} and q["question"].strip()
    assert len({q["category"] for q in rs}) >= 8  # covers the failure families, not one kind of question


def test_abstain_set_qids_and_questions_do_not_collide_with_bajaj_v1():
    a, b = rows(ABSTAIN), rows(BENCH)
    assert len({q["qid"] for q in a}) == len(a)
    assert not {q["qid"] for q in a} & {q["qid"] for q in b}
    assert not {q["question"].lower() for q in a} & {q["question"].lower() for q in b}


def test_eval_policy_split_can_load_another_bench_file():
    import sys
    sys.path.insert(0, str(ROOT / "scripts/agent"))
    from eval_policy_split import bench
    assert len(bench("abstain_v2", path=ABSTAIN)) == len(rows(ABSTAIN))
    assert len(bench("all", path=ABSTAIN)) == len(rows(ABSTAIN))
