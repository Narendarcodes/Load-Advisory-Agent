"""Index the Saral corpus v3 collections into a LOCAL Qdrant and run the G1 retrieval smoke test.

Never points at a server: every collection is an embedded Qdrant directory under --qdrant-dir, built through
rag.retrieve.rebuild_index (staged build, validated, index_compat.json provenance sidecar). One directory per
collection, so the NBFC and RBI sets are physically separate:

    <qdrant-dir>/saral_nbfc_policy/   collection "saral_nbfc_policy"
    <qdrant-dir>/rbi_regulatory/      collection "rbi_regulatory"

Retrieval uses the repo's own pieces and config/rag.yaml settings: EmbeddingGemma-2 dense (QuestionAnswering
query prompt) + BM25, weighted RRF, bge-reranker-v2-m3 over the top candidates.

    python scripts/policy/index_corpus_v3.py --chunks <build_corpus_v3 --out dir> --qdrant-dir <dir> \
        --report data/corpus_v3/smoke_test.json [--replace-index] [--no-rerank]
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from rag.index_meta import index_identity  # noqa: E402
from rag.retrieve import (DOC_PREFIX, BM25Index, CrossEncoderReranker, DenseIndex, HybridRetriever,  # noqa: E402
                          RetrievalFilter, doc_string, load_rag_config, rebuild_index)

COLLECTIONS = {"saral_nbfc_policy": "BFL-", "rbi_regulatory": "RBI-"}
EMBED = os.environ.get("EMBED_MODEL", "google/embeddinggemma-2")
QUERY_PROMPT = "QuestionAnswering"
BANNED_DOC_PREFIXES = ("HDFC-", "ICICI-", "SYN-")
BANNED_TEXT = ("SYNTHETIC", "SARAL_DEMO", "Demo Sample Lender")  # case-sensitive fixture markers
SHINGLE = 10  # a shared run of 10 words with an excluded text counts as leaked text

# Smoke questions. `expect` = documents a correct retrieval should surface in the top 5 (checked, not assumed).
QUESTIONS = [
    {"id": "B01", "topic": "eligibility", "collection": "saral_nbfc_policy",
     "q": "What age and CIBIL score do I need to be eligible for a personal loan?",
     "expect": ["BFL-PL-ELIG-DOCS", "BFL-PL-OVERVIEW", "BFL-PL-SALARIED"]},
    {"id": "B02", "topic": "rates_and_fees", "collection": "saral_nbfc_policy",
     "q": "What is the interest rate range and the processing fee on a personal loan?",
     "expect": ["BFL-PL-RATES-FEES", "BFL-PL-OVERVIEW"]},
    {"id": "B03", "topic": "documents", "collection": "saral_nbfc_policy",
     "q": "Which documents do I need to submit for a personal loan application?",
     "expect": ["BFL-PL-ELIG-DOCS", "BFL-PL-OVERVIEW"]},
    {"id": "B04", "topic": "rejection", "collection": "saral_nbfc_policy",
     "q": "How will I know the reason my loan application was rejected?",
     "expect": ["BFL-FAQ-REJECTION", "BFL-INSIGHT-REJECTION", "BFL-APP-TNC-2023"]},
    {"id": "B05", "topic": "purpose_wedding", "collection": "saral_nbfc_policy",
     "q": "Can I use a personal loan to pay for my wedding expenses like the venue and caterers?",
     "expect": ["BFL-PL-OVERVIEW", "BFL-PL-SALARIED"]},
    {"id": "B06", "topic": "purpose_higher_education", "collection": "saral_nbfc_policy",
     "q": "Can a personal loan cover higher education costs such as tuition and accommodation?",
     "expect": ["BFL-PL-OVERVIEW", "BFL-PL-SALARIED", "BFL-PL-ELIG-DOCS"]},
    {"id": "B07", "topic": "purpose_home_renovation", "collection": "saral_nbfc_policy",
     "q": "Can I take a personal loan for home renovation such as painting, flooring and a kitchen upgrade?",
     "expect": ["BFL-PL-OVERVIEW", "BFL-PL-SALARIED", "BFL-PL-ELIG-DOCS"]},
    {"id": "B08", "topic": "purpose_medical_emergency", "collection": "saral_nbfc_policy",
     "q": "I have a medical emergency in the family. Can I get a personal loan quickly to pay the hospital?",
     "expect": ["BFL-PL-OVERVIEW", "BFL-PL-ELIG-DOCS", "BFL-PL-SALARIED"]},
    {"id": "B09", "topic": "purpose_travel", "collection": "saral_nbfc_policy",
     "q": "Can I use a personal loan for an international trip or honeymoon, for flights and visa fees?",
     "expect": ["BFL-PL-OVERVIEW", "BFL-PL-SALARIED"]},
    {"id": "B10", "topic": "purpose_debt_consolidation", "collection": "saral_nbfc_policy",
     "q": "Can I take a personal loan to consolidate my existing debts into one EMI?",
     "expect": ["BFL-PL-OVERVIEW"]},
    {"id": "R01", "topic": "kfs", "collection": "rbi_regulatory",
     "q": "What must a lender disclose to me in the Key Facts Statement before I sign a loan?",
     "expect": ["RBI-RBC-NBFC-2025"]},
    {"id": "R02", "topic": "penal_charges", "collection": "rbi_regulatory",
     "q": "Can an NBFC add penal interest to my loan's rate of interest if I miss an EMI?",
     "expect": ["RBI-RBC-NBFC-2025"]},
    {"id": "R03", "topic": "ombudsman", "collection": "rbi_regulatory",
     "q": "If the lender does not resolve my complaint within 30 days, how do I complain to the RBI Ombudsman?",
     "expect": ["RBI-IOS-2026", "RBI-IOS-2026-FAQ"]},
    {"id": "R04", "topic": "digital_lending_cooling_off", "collection": "rbi_regulatory",
     "q": "Is there a cooling-off period to exit a digital loan without penalty?",
     "expect": ["RBI-NBFC-CF-2025"]},
    {"id": "R05", "topic": "credit_report_correction", "collection": "rbi_regulatory",
     "q": "What compensation do I get if my credit information is not corrected on time?",
     "expect": ["RBI-CIC-COMP-2023", "RBI-CIC-CS-2023"]},
]


def load(chunks_dir: Path, col: str) -> list[dict]:
    with (chunks_dir / f"{col}.chunks.jsonl").open(encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def shingles(text: str) -> set:
    w = text.lower().split()
    return {" ".join(w[i:i + SHINGLE]) for i in range(max(0, len(w) - SHINGLE + 1))}


def foreign_shingles(foreign_dir: str | None) -> dict:
    """Excluded texts (HDFC, ICICI, synthetic fixtures), read from outside git, to prove none leaked in."""
    if not foreign_dir:
        return {}
    return {p.stem: shingles(p.read_text(encoding="utf-8")) for p in sorted(Path(foreign_dir).glob("*.txt"))}


def audit(col: str, chunks: list[dict], foreign: dict) -> dict:
    """Whole-collection leak audit: every chunk must come from the collection's own source."""
    prefix = COLLECTIONS[col]
    wrong_doc = sorted({c["document_id"] for c in chunks if not c["document_id"].startswith(prefix)})
    banned_doc = sorted({c["document_id"] for c in chunks if c["document_id"].startswith(BANNED_DOC_PREFIXES)})
    banned_text = sorted({c["chunk_id"] for c in chunks for b in BANNED_TEXT if b in c["text"]})
    leaked = {}
    for c in chunks:
        sh = shingles(c["text"])
        for name, fs in foreign.items():
            if sh & fs:
                leaked.setdefault(name, []).append(c["chunk_id"])
    wrong_col = sorted({c["chunk_id"] for c in chunks if c.get("collection") != col})
    mentions = {name: sum(name in c["text"] for c in chunks) for name in ("HDFC", "ICICI")}
    return {"chunks": len(chunks), "documents": sorted({c["document_id"] for c in chunks}),
            "foreign_source_documents": wrong_doc, "hdfc_icici_synthetic_documents": banned_doc,
            "synthetic_or_injection_text_chunks": banned_text, "wrong_collection_tag": wrong_col,
            "excluded_texts_checked": sorted(foreign), "chunks_sharing_10_words_with_excluded_text": leaked,
            "informational_name_mentions_in_own_text": mentions,
            "pass": not (wrong_doc or banned_doc or banned_text or wrong_col or leaked)}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--chunks", required=True)
    ap.add_argument("--qdrant-dir", required=True, help="LOCAL embedded Qdrant root (never a server)")
    ap.add_argument("--report", required=True)
    ap.add_argument("--replace-index", action="store_true")
    ap.add_argument("--no-rerank", action="store_true")
    ap.add_argument("--dtype", default="bfloat16", choices=["bfloat16", "float32"])
    ap.add_argument("--k", type=int, default=5)
    ap.add_argument("--foreign-texts", default=None, help="dir of excluded texts (HDFC/ICICI/SYN) for the leak audit")
    a = ap.parse_args(argv)
    import torch
    from sentence_transformers import SentenceTransformer
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = getattr(torch, a.dtype)
    t0 = time.time()
    emb = SentenceTransformer(EMBED, device=dev, model_kwargs={"torch_dtype": dtype})
    identity = index_identity(embed_model=EMBED, dimension=getattr(emb, "get_embedding_dimension", emb.get_sentence_embedding_dimension)(),
                              doc_prefix=DOC_PREFIX, query_prompt=QUERY_PROMPT,
                              query_prompt_text=(getattr(emb, "prompts", {}) or {}).get(QUERY_PROMPT))
    cfg, _, _ = load_rag_config()
    if a.no_rerank:
        cfg.rerank_candidates = 0
    reranker = CrossEncoderReranker(device=dev) if cfg.rerank_candidates else None
    embed_q = lambda q: emb.encode(q, prompt_name=QUERY_PROMPT, normalize_embeddings=True)  # noqa: E731
    report = {"mode": "automated / live-local", "device": dev, "dtype": a.dtype, "embed_model": EMBED,
              "reranker": None if reranker is None else "BAAI/bge-reranker-v2-m3",
              "fusion": {"k": cfg.k, "w_dense": cfg.w_dense, "w_bm25": cfg.w_bm25, "rerank_candidates": cfg.rerank_candidates},
              "collections": {}, "questions": []}
    retrievers, by_id, foreign = {}, {}, foreign_shingles(a.foreign_texts)
    for col in COLLECTIONS:
        chunks = load(Path(a.chunks), col)
        by_id.update({c["chunk_id"]: c for c in chunks})
        t = time.time()
        vecs = emb.encode([doc_string(c) for c in chunks], batch_size=16, normalize_embeddings=True,
                          show_progress_bar=False)
        target = Path(a.qdrant_dir) / col
        rebuild_index(target, chunks, vecs, collection=col, meta=identity, replace=a.replace_index)
        dense = DenseIndex.__new__(DenseIndex)  # open the validated on-disk collection read-only
        from qdrant_client import QdrantClient, models
        dense.m, dense.client, dense.col = models, QdrantClient(path=str(target)), col
        points = dense.client.count(col).count
        report["collections"][col] = {"points": points, "embed_seconds": round(time.time() - t, 1),
                                      "qdrant_path": str(target), "audit": audit(col, chunks, foreign)}
        retrievers[col] = HybridRetriever(BM25Index(chunks), dense, embed_q, reranker=reranker,
                                          chunks_by_id={c["chunk_id"]: c for c in chunks}, config=cfg)
    flt = RetrievalFilter(mode="current")
    for q in QUESTIONS:
        col = q["collection"]
        res = retrievers[col].search(q["q"], flt, k=a.k)
        hits = [{"rank": i + 1, "chunk_id": cid, "document_id": by_id[cid]["document_id"],
                 "collection": by_id[cid]["collection"], "section": by_id[cid]["section"], "score": round(s, 4)}
                for i, (cid, s) in enumerate(res["results"])]
        docs = [h["document_id"] for h in hits]
        report["questions"].append({
            **{k: q[k] for k in ("id", "topic", "collection", "q", "expect")}, "hits": hits,
            "all_from_target_collection": all(h["collection"] == col and h["document_id"].startswith(COLLECTIONS[col])
                                              for h in hits),
            "no_hdfc_icici_synthetic": not any(d.startswith(BANNED_DOC_PREFIXES) for d in docs),
            "expected_doc_in_top_k": any(d in q["expect"] for d in docs),
            "expected_doc_at_rank1": bool(docs) and docs[0] in q["expect"],
            "latency_ms": round(res["latency_ms"], 1)})
    qs = report["questions"]
    report["summary"] = {
        "questions": len(qs),
        "all_from_target_collection": sum(x["all_from_target_collection"] for x in qs),
        "no_hdfc_icici_synthetic": sum(x["no_hdfc_icici_synthetic"] for x in qs),
        "expected_doc_in_top_k": sum(x["expected_doc_in_top_k"] for x in qs),
        "expected_doc_at_rank1": sum(x["expected_doc_at_rank1"] for x in qs),
        "collection_audits_pass": all(v["audit"]["pass"] for v in report["collections"].values()),
        "total_seconds": round(time.time() - t0, 1)}
    Path(a.report).write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=1))


if __name__ == "__main__":
    main()
