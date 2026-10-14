"""Bajaj reference-lender policy RAG: register, lender-profile filters, ingestion and retrieval regressions.
Offline: no network, no GPU, no copyrighted text (stage-1 runs are committed as ids + scores only)."""
import gzip
import json
from pathlib import Path

import pytest

pytest.importorskip("rank_bm25")
pytest.importorskip("yaml")
pytest.importorskip("bs4")
pytest.importorskip("requests")

from rag.corpus import _blocks_from_text, chunk_document, register  # noqa: E402
from rag.retrieve import (BM25Index, RetrievalFilter, load_profile, load_rag_config, profile_filter,  # noqa: E402
                          rrf, weighted_rrf)

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT / "data/evaluation/rag/bajaj_v1/benchmark.jsonl"
RESULTS = ROOT / "data/evaluation/rag/bajaj_v1/results"
STATUSES = {"approved", "approved_historical", "pending_review", "registered_not_ingested"}


# ----------------------------------------------------------------------------- register
def test_register_v2_bajaj_entries_are_labelled_public_reference_not_partner():
    docs = register()
    bfl = [d for d in docs if d["document_id"].startswith("BFL-")]
    assert len(bfl) >= 15
    for d in bfl:
        assert d["lender_id"] == "BFL"
        assert d["lender_relationship"] == "public reference lender, not a partner"
        assert d["applies_to_entity"] == ["nbfc"]
        assert d["source_url"].startswith("https://") and "bajajfinserv.in" in d["source_url"]
        assert d["licence"] and "not redistributed" in d["licence"]


def test_register_v2_every_doc_has_governance_fields():
    docs = register()
    ids = [d["document_id"] for d in docs]
    assert len(ids) == len(set(ids))
    for d in docs:
        assert d["approval_status"] in STATUSES, d["document_id"]
        assert d.get("source_type"), d["document_id"]
        assert d.get("applies_to_entity"), d["document_id"]
        assert set(d["applies_to_entity"]) <= {"bank", "nbfc", "all"}, d["document_id"]
        if d["approval_status"] in ("approved", "approved_historical") and d["source_type"] not in ("synthetic", "untrusted_test"):
            assert d.get("licence"), d["document_id"]


def test_register_v2_status_corrections_and_rbi_entity_labels():
    reg = {d["document_id"]: d for d in register()}
    assert reg["RBI-DLD-2025"]["approval_status"] == "approved_historical"          # PDF watermarked "Withdrawn"
    assert "RBI-NBFC-CF-2025" in reg["RBI-DLD-2025"]["superseded_by"]
    assert reg["RBI-RBC-NBFC-2025"]["approval_status"] == "approved" and reg["RBI-RBC-NBFC-2025"]["applies_to_entity"] == ["nbfc"]
    assert reg["RBI-RBC-CB-2025"]["approval_status"] == "approved" and reg["RBI-RBC-CB-2025"]["applies_to_entity"] == ["bank"]
    assert reg["RBI-IOS-2026"]["approval_status"] == "approved"
    assert reg["SYN-INJECT-002"]["approval_status"] == "pending_review"
    assert reg["BFL-KYC-PMLA-POLICY"]["approval_status"] == "pending_review"       # staging path, undated
    for did in ("RBI-RBC-NBFC-2025", "RBI-RBC-CB-2025", "RBI-IOS-2026"):
        assert reg[did]["local_file"] and reg[did]["source_url"].startswith("https://rbidocs.rbi.org.in/")


def test_manifest_v2_has_sha256_and_fetch_date_for_every_ingested_source():
    man = json.loads((ROOT / "data/sources/policy_manifest_v2.json").read_text())["documents"]
    reg = {d["document_id"]: d for d in register()}
    assert set(man) == set(reg)
    for did, m in man.items():
        if reg[did]["approval_status"] == "registered_not_ingested":
            continue
        assert m["status"] == "fetched", did
        assert len(m["raw_sha256"]) == 64 and len(m["content_hash"]) == 64 and m["retrieved_at"].startswith("2026-"), did
        assert "text" not in m  # metadata only


# ----------------------------------------------------------------------------- profiles / config
def test_profiles_load_and_config_selects_bajaj():
    for name in ("bajaj_finance", "generic_nbfc", "generic_bank", "synthetic_prototype"):
        p = load_profile(name)
        assert {"profile_id", "lender_id", "entity_type", "relationship", "default_source_types"} <= set(p)
    hc, prof, mode = load_rag_config()
    assert prof["profile_id"] == "bajaj_finance" and prof["relationship"] == "public reference lender, not a partner"
    assert mode == "current" and hc.w_bm25 < hc.w_dense and hc.rerank_candidates > 0


def test_lender_profile_env_override(monkeypatch):
    monkeypatch.setenv("LENDER_PROFILE", "generic_bank")
    assert load_profile()["entity_type"] == "bank"
    monkeypatch.setenv("LENDER_PROFILE", "no_such_lender")
    with pytest.raises(FileNotFoundError):
        load_profile()


# ----------------------------------------------------------------------------- ingestion
def _doc(did, status, text, **kw):
    meta = {"document_id": did, "title": did, "source_url": "https://example.invalid", "approval_status": status,
            "publication_date": None, "effective_from": None, "effective_to": None, **kw}
    return chunk_document(meta, "\n".join(_blocks_from_text(text)))


def test_pdf_page_markers_give_page_refs_and_never_enter_text():
    # 3-digit paragraphs ("106.With ...") are recognised when they start a block (here: after a page break).
    # Known limitation: a 3-digit paragraph glued to the previous line inside a page stays in the previous chunk.
    text = "[[page 1]]\nIntro.\n1. First para.\n[[page 2]]\n2. Second para on page two.\n[[page 3]]\n106.With the issue of these Directions repealed."
    ch = _doc("P", "approved", text, para_digits=3, applies_to_entity=["nbfc"], lender_id=None)
    assert [c["section"] for c in ch] == ["preamble", "para 1", "para 2", "para 106"]
    assert ch[1]["page_start"] == 1 and ch[2]["page_start"] == 2 and ch[3]["page_start"] == ch[3]["page_end"] == 3
    assert all("[[page" not in c["text"] for c in ch)
    assert ch[0]["applies_to_entity"] == ["nbfc"]


def test_pdf_extraction_drops_running_headers():
    fitz = pytest.importorskip("pymupdf")
    from rag.corpus import extract
    doc = fitz.open()
    for i in range(4):
        p = doc.new_page()
        p.insert_text((72, 40), "BFL - Fair Practice Code / Ver 7.1")
        p.insert_text((72, 100), f"{i + 1}. Clause number {i + 1} about loans.")
    text = extract(doc.tobytes(), "https://cms-assets.bajajfinserv.in/x.pdf")
    assert text.count("[[page ") == 4 and "Fair Practice Code / Ver 7.1" not in text and "Clause number 3" in text


def test_bot_challenge_page_is_reported_not_ingested(monkeypatch, tmp_path):
    import rag.corpus as corpus

    class R:
        status_code, headers, content = 200, {"content-type": "text/html"}, b"<html>What code is in the image?</html>"
        def raise_for_status(self): pass
    monkeypatch.setattr(corpus.requests, "get", lambda *a, **k: R())
    monkeypatch.setattr(corpus, "register", lambda: [{"document_id": "X", "source_url": "https://rbidocs.rbi.org.in/x.pdf", "approval_status": "approved"}])
    res = corpus.fetch_all(tmp_path / "src")
    assert res["manifest"]["X"]["status"] == "error" and "bot challenge" in res["manifest"]["X"]["error"]
    assert not (tmp_path / "src" / "X.txt").exists()


# ----------------------------------------------------------------------------- filters
def _corpus():
    return (_doc("BFL-A", "approved", "1. Bajaj personal loan CIBIL score 650 or higher.", lender_id="BFL", applies_to_entity=["nbfc"], source_type="lender_web_page")
            + _doc("BFL-EDU", "approved", "1. Personal loan CIBIL score tips.", lender_id="BFL", applies_to_entity=["nbfc"], source_type="lender_education")
            + _doc("HDFC-A", "approved", "1. HDFC personal loan CIBIL score 750.", lender_id="HDFC", applies_to_entity=["bank"], source_type="lender_web_page")
            + _doc("RBC-NBFC", "approved", "1. An NBFC personal loan CIBIL score acknowledgement.", lender_id=None, applies_to_entity=["nbfc"], source_type="regulator")
            + _doc("RBC-CB", "approved", "1. A bank shall convey personal loan CIBIL score rejection reasons.", lender_id=None, applies_to_entity=["bank"], source_type="regulator")
            + _doc("IOS", "approved", "1. Ombudsman personal loan CIBIL score complaints.", lender_id=None, applies_to_entity=["all"], source_type="regulator")
            + _doc("DLD-OLD", "approved_historical", "1. Old digital personal loan CIBIL score rules.", lender_id=None, applies_to_entity=["all"], source_type="regulator")
            + _doc("INJ", "pending_review", "1. Bajaj personal loan CIBIL score 500 guaranteed.", lender_id="BFL", applies_to_entity=["nbfc"], source_type="untrusted_test"))


def _docs(idx, flt):
    return {c.split("#")[0] for c, _ in idx.search("personal loan CIBIL score", flt, 50)}


def test_bajaj_profile_sees_own_and_nbfc_texts_only():
    idx = BM25Index(_corpus())
    flt = profile_filter(load_profile("bajaj_finance"), "current")
    assert _docs(idx, flt) == {"BFL-A", "RBC-NBFC", "IOS"}               # no HDFC, no bank-only, no history, no injection, no education
    assert _docs(idx, profile_filter(load_profile("bajaj_finance"), "current", include_education=True)) == {"BFL-A", "BFL-EDU", "RBC-NBFC", "IOS"}
    assert _docs(idx, profile_filter(load_profile("bajaj_finance"), "historical")) == {"BFL-A", "RBC-NBFC", "IOS", "DLD-OLD"}


def test_generic_bank_profile_sees_bank_texts_and_no_lender_pages():
    idx = BM25Index(_corpus())
    assert _docs(idx, profile_filter(load_profile("generic_bank"), "current")) == {"RBC-CB", "IOS"}
    assert _docs(idx, profile_filter(load_profile("generic_nbfc"), "current")) == {"RBC-NBFC", "IOS"}


def test_pending_review_is_never_served_even_for_matching_lender():
    flt = RetrievalFilter(mode="historical", entity_type="nbfc", lender_id="BFL", restrict_lenders=True)
    assert not any(flt.allows(c) for c in _corpus() if c["document_id"] == "INJ")


def test_qdrant_filter_matches_python_filter():
    pytest.importorskip("qdrant_client")
    from rag.retrieve import DenseIndex
    ch = _corpus()
    vecs = [[1.0, float(i % 3), 0.5] for i in range(len(ch))]
    di = DenseIndex(ch, vecs)
    for prof, mode in (("bajaj_finance", "current"), ("generic_bank", "current"), ("bajaj_finance", "historical")):
        flt = profile_filter(load_profile(prof), mode)
        got = {c.split("#")[0] for c, _ in di.search([1.0, 0.0, 0.5], flt, 50)}
        assert got == {c["document_id"] for c in ch if flt.allows(c)}, (prof, mode)


# ----------------------------------------------------------------------------- fusion
def test_weighted_rrf_zero_bm25_weight_equals_dense_order():
    dense = [("a", 0.9), ("b", 0.8), ("c", 0.7)]
    bm25 = [("c", 9.0), ("b", 5.0), ("z", 1.0)]
    assert [c for c, _ in weighted_rrf([dense, bm25], [1.0, 0.0], k=10, top=3)] == ["a", "b", "c"]


def test_weighted_rrf_keeps_strong_dense_hit_that_equal_rrf_demotes():
    """Regression for the phase-4 negative result (equal RRF < dense): a dense rank-1 hit missing from BM25 must not be
    pushed below a mediocre doc that both retrievers rank moderately."""
    dense = [("gold", 0.9)] + [(f"d{i}", 0.8 - i / 100) for i in range(18)] + [("x", 0.5)]  # x: dense rank 20
    bm25 = [("x", 9.0), ("y", 8.0), ("z", 7.0)]                                              # x: BM25 rank 1
    assert rrf(dense, bm25, top=3)[0][0] == "x"                       # equal RRF (k=60) demotes the dense top hit
    assert weighted_rrf([dense, bm25], [1.0, 0.5], k=10, top=1)[0][0] == "gold"  # dev-tuned weights keep it


# ----------------------------------------------------------------------------- benchmark + retrieval regression
def _bench():
    return [json.loads(l) for l in BENCH.open()]


def test_benchmark_size_mix_and_split_hygiene():
    b = _bench()
    assert len(b) >= 120 and sum(q["origin"] == "human" for q in b) >= 40
    assert len({q["qid"] for q in b}) == len(b)
    assert {q["split"] for q in b} == {"dev", "test"}
    cats = {q["category"] for q in b}
    for need in ("eligibility", "fees", "rejection_reapply", "kfs_terms", "grievance", "abstain_guarantee",
                 "abstain_invented", "abstain_other_lender", "abstain_injection", "historical", "lender_type"):
        assert need in cats, need
    reg = {d["document_id"]: d for d in register()}
    for q in b:
        if q["expect_abstain"]:
            assert q["gold_docs"] == [] and q["gold_anchors"] == []
        else:
            assert q["gold_docs"] and q["gold_anchors"]
            flt = profile_filter(load_profile(q["profile"]), q["mode"], include_education=True)
            for d in q["gold_docs"]:  # gold must be servable under the question's own filter
                assert flt.allows({**reg[d], "approval_status": reg[d]["approval_status"]}), (q["qid"], d)


def test_retrieval_regression_on_committed_runs(tmp_path):
    """Re-scores the committed stage-1 runs (ids + scores only): the dev-tuned config must match config/rag.yaml and
    hybrid+rerank must stay clearly above dense-only on the held-out test split."""
    import subprocess
    import sys
    subprocess.run([sys.executable, str(ROOT / "scripts/policy/eval_bajaj_score.py"), "--runs", str(RESULTS), "--out", str(tmp_path)],
                   check=True, capture_output=True)
    rep = json.loads((tmp_path / "report.json").read_text())
    hc, _, _ = load_rag_config()
    tuned = rep["tuned_on_dev"]["fusion"]
    assert (tuned["w_bm25"], tuned["k"], tuned["rerank_n"]) == (hc.w_bm25, hc.k, hc.rerank_candidates)
    t = rep["test_overall"]
    assert t["hybrid_rerank"]["mrr@10"] >= t["dense"]["mrr@10"] + 0.10
    assert t["hybrid_rerank"]["recall@5"] >= 0.90
    assert t["hybrid_weighted"]["mrr@10"] >= t["hybrid_rrf_equal"]["mrr@10"]
    assert all(v == 0 for v in rep["governance"]["non_permitted_chunks_in_final_top10(questions)"].values())
    assert rep["governance"]["without_filter"]["injection_doc_in_unfiltered_top10"] > 0  # the filter is what protects us
    with gzip.open(RESULTS / "runs.jsonl.gz", "rt") as f:
        assert not any("text" in json.loads(l) for l in f)
