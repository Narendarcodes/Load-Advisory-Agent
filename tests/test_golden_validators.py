"""Tests for scripts/golden/validate_golden.py and the committed Saral golden datasets (Golden A rag_v2, Golden B agent_v1).

The chunk texts are not committed (metadata-only policy), so the verbatim-anchor and copy checks on the real data run
only when SARAL_CHUNKS_DIR (or the default local path) exists; everything else runs in CI.
"""
import copy
import importlib.util
import json
import os
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("validate_golden", ROOT / "scripts/golden/validate_golden.py")
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

CHUNKS = os.environ.get("SARAL_CHUNKS_DIR") or (str(V.DEFAULT_CHUNKS) if V.DEFAULT_CHUNKS.exists() else None)


def rag():
    return V.load_jsonl(V.RAG_FILE)


def convs():
    return V.load_jsonl(V.AGENT_FILE)


def test_committed_datasets_pass_offline_checks():
    rep, info = V.validate(chunks_dir=None, coverage_path=None)
    assert rep.errors == [], rep.errors[:10]
    assert info["items"] >= 200 and info["conversations"] >= 60


@pytest.mark.skipif(not CHUNKS, reason="chunk texts not available (set SARAL_CHUNKS_DIR)")
def test_committed_datasets_pass_full_checks_with_chunks():
    rep, info = V.validate(chunks_dir=CHUNKS, coverage_path=None)
    assert rep.errors == [], rep.errors[:10]
    assert info["anchors_verified"] == sum(len(g["anchors"]) for g in rag())


def test_anchor_check_whitespace_normalised_and_detects_missing():
    item = {"qid": "T-1", "anchors": [{"doc_id": "D", "chunk_id": "D#000", "quote": "pay   on\\ntime", "chunk_sha256": "x"}]}
    item["anchors"][0]["quote"] = "pay   on\ntime"
    index = {"D#000": {"chunk_sha256": "x"}}
    rep = V.Report()
    assert V.check_anchors([item], index, {"D#000": "Always pay on time, please."}, rep) == 1 and not rep.errors
    item["anchors"][0]["quote"] = "pay late"
    rep = V.Report()
    V.check_anchors([item], index, {"D#000": "Always pay on time, please."}, rep)
    assert any("not verbatim" in e for e in rep.errors)
    rep = V.Report()
    V.check_anchors([item], {"D#000": {"chunk_sha256": "y"}}, {}, rep)
    assert any("sha256 drift" in e for e in rep.errors)


def test_duplicate_and_near_duplicate_detection():
    base = rag()[0]
    a, b = copy.deepcopy(base), copy.deepcopy(base)
    b["qid"] = "T-DUP"
    rep = V.Report()
    V.check_duplicates([a, b], rep)
    assert any("duplicate question" in e for e in rep.errors)
    b["question"] = b["turns"][-1]["content"] = "Can I use a personal loan to pay for my wedding venue and the caterers?"
    rep = V.Report()
    V.check_duplicates([a, b], rep)
    assert rep.warnings or rep.errors


def test_copy_check_flags_long_shared_runs():
    chunks = {"D#000": "A personal loan for home renovation can help cover expenses such as repairs painting flooring"}
    item = {"qid": "T-2", "turns": [{"role": "user", "content": "A personal loan for home renovation can help cover expenses such as repairs?"}]}
    rep = V.Report()
    runs = V.check_copy([item], chunks, rep)
    assert runs["T-2"] >= 8 and any("copied" in e for e in rep.errors)


def test_schema_rejects_answer_without_anchor_and_bad_multi_hop():
    g = copy.deepcopy(next(x for x in rag() if x["variant"] == "multi_hop"))
    g["anchors"], g["gold_chunks"] = [], []
    rep = V.Report()
    V.check_rag_schema([g], rep)
    assert any("without anchors" in e for e in rep.errors)
    assert any("multi_hop" in e for e in rep.errors)


def test_leak_probe_needs_must_not_include():
    c = copy.deepcopy(next(c for c in convs() if any(t["probe"] == "leak_probe" for t in c["turns"])))
    for t in c["turns"]:
        if t["probe"] == "leak_probe":
            t["must_not_include"] = []
    rep = V.Report()
    V.check_leak_probes([c], rep)
    assert any("leak probe without must_not_include" in e for e in rep.errors)


def test_pii_rejects_real_looking_aadhaar_and_raw_pan():
    c = copy.deepcopy(convs()[0])
    rep = V.Report()
    V.check_pii([], [c], rep)
    assert rep.errors == []
    c["applicant"]["aadhaar_masked"] = "4123 XXXX 0001"
    c["turns"][0]["user"] = "my aadhaar is 5234 5678 9012 and PAN ABCDE1234F"
    rep = V.Report()
    V.check_pii([], [c], rep)
    msgs = " ".join(rep.errors)
    assert "aadhaar_masked" in msgs and "Aadhaar-like" in msgs and "PAN" in msgs


def test_self_consistency_catches_checklist_contradiction():
    c = copy.deepcopy(convs()[0])
    c["turns"][0]["must_include"] = ["mentions ZEN"]
    rep = V.Report()
    V.check_self_consistency([c], rep)
    assert rep.errors


def test_every_conversation_is_synthetic_and_pending_zen_v2():
    for c in convs():
        assert c["applicant"]["applicant_id"].startswith("SYN-APP-")
        assert c["applicant"]["aadhaar_masked"][0] in "01"
        assert c["expected_decision_source"] == "scenario_spec_pending_zen_v2"
        assert c["stored_decision"]["grader_only"] is True


def test_salaried_only_except_outside_offer_conversations():
    for c in convs():
        if c["applicant"]["employment_type"] != "salaried":
            assert c["expected_reason_category"] == "outside_offer", c["conv_id"]


def test_v1_fields_kept_and_v1_qids_mapped():
    items = rag()
    for g in items:
        for f in V.V1_FIELDS:
            assert f in g
    mapped = {g["v1_qid"] for g in items if g["v1_qid"]}
    assert len(mapped) >= 70


def test_manifest_matches_frozen_files():
    man = json.loads((V.GOLD / "MANIFEST.json").read_text(encoding="utf-8"))
    rep = V.Report()
    V.check_freeze(rag(), convs(), rep)
    assert rep.errors == [], rep.errors
    assert len(man["calibration_ids"]) == 30


def _conv(cid):
    return copy.deepcopy(next(c for c in convs() if c["conv_id"] == cid))


def test_owner_decisions_2026_11_03_are_encoded():
    """Owner decisions 2026-11-03: what-if wording + cap, public figures, field mismatch, product scope, job switch."""
    ac5 = _conv("AC-005")
    wi = [t for t in ac5["turns"] if t["probe"] == "what_if"]
    assert any("would likely meet" in x for t in wi for x in t["must_include"])
    assert any(t.get("what_if_capped_turn") for t in wi)
    for cid, exempt in (("AC-009", r"40,?000"), ("AC-014", r"\b650\b")):
        t = next(t for t in _conv(cid)["turns"] if t["probe"] == "policy")
        assert t["global_pattern_exempt"] == [exempt] and t["must_not_include_patterns"]
    t2 = _conv("AC-018")["turns"][1]
    assert any("name and date of birth" in x for x in t2["must_include"])
    t = next(t for t in _conv("AC-022")["turns"] if "purposes" in t["user"])
    assert t["answer_source"] == "product_config" and t["citation_required"] is False
    assert "search_approved_policy" not in t["expected_tool_calls"]
    rej7 = next(g for g in rag() if g["qid"] == "R2-REJ-07")
    assert "Owner decision 2026-11-03" in rej7["note"]


def test_public_figure_exemption_needs_link_probes():
    c = _conv("AC-009")
    t = next(t for t in c["turns"] if t.get("global_pattern_exempt"))
    t["must_not_include_patterns"] = []
    rep = V.Report()
    V.check_agent_schema([c], rep)
    assert any("link-probe" in e for e in rep.errors)
    c2 = _conv("AC-022")
    t = next(t for t in c2["turns"] if t.get("answer_source") == "product_config")
    t["expected_tool_calls"] = ["authorize", "search_approved_policy"]
    rep = V.Report()
    V.check_agent_schema([c2], rep)
    assert any("product_config" in e for e in rep.errors)
