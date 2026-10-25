"""Retrieval checks for the synthetic rejection/reapplication set (offline, repo text only).

Indexes the repo-backed synthetic documents in memory, including the pending-review injection pages as
distractors, then searches them under the synthetic_prototype lender profile. Never reads
$LOAN_POLICY_DIR, never writes qdrant_v2 and never rebuilds the production index.
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from rag.corpus import chunk_document, register  # noqa: E402
from rag.retrieve import (BM25Index, DenseIndex, HybridRetriever, doc_string, load_profile,  # noqa: E402
                          load_rag_config, profile_filter)

BENCH = ROOT / "data/evaluation/rag/synthetic_v1/benchmark.jsonl"
PROFILE = os.environ.get("SYNTHETIC_PROFILE", "synthetic_prototype")
EMBED = os.environ.get("EMBED_MODEL", "google/embeddinggemma-2")


def build_chunks():
    chunks, docs = [], []
    for d in register():
        url = d.get("source_url") or ""
        if not url.startswith("repo://"):
            continue
        chunks += chunk_document(d, (ROOT / url[len("repo://"):]).read_text(encoding="utf-8"))
        docs.append(d["document_id"])
    return chunks, docs


def main():
    import torch
    from sentence_transformers import SentenceTransformer

    dev = os.environ.get("AGENT_RETRIEVER_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
    chunks, docs = build_chunks()
    cfg, _, mode = load_rag_config()
    flt = profile_filter(load_profile(PROFILE), mode)
    served = {c["chunk_id"] for c in chunks if flt.allows(c)}
    rows = [json.loads(line) for line in BENCH.open(encoding="utf-8")]
    missing = sorted({cid for q in rows for cid in q["expected_chunk_ids"]} - {c["chunk_id"] for c in chunks})
    if missing:
        raise SystemExit(f"benchmark references unknown chunk ids: {missing}")

    emb = SentenceTransformer(EMBED, device=dev)
    vecs = emb.encode([doc_string(c) for c in chunks], batch_size=32, normalize_embeddings=True)
    retr = HybridRetriever(BM25Index(chunks), DenseIndex(chunks, vecs),
                           lambda q: emb.encode(q, prompt_name="QuestionAnswering", normalize_embeddings=True),
                           config=cfg)

    per_q = []
    for q in rows:
        ranked = [cid for cid, _ in retr.search(q["question"], flt, k=10)["results"]]
        rank = next((i + 1 for i, cid in enumerate(ranked) if cid in q["expected_chunk_ids"]), None)
        per_q.append({"qid": q["qid"], "expect_evidence": q["expect_evidence"], "first_expected_rank": rank,
                      "top5": ranked[:5], "leaked_pending": [c for c in ranked if c.startswith("SYN-INJECT")]})

    answerable = [r for r in per_q if r["expect_evidence"]]
    n = len(answerable)
    summary = {
        "profile": PROFILE, "mode": mode, "lender": load_profile(PROFILE)["lender_id"],
        "embed_model": EMBED, "device": dev, "query_prompt": "QuestionAnswering",
        "prompt": getattr(emb, "prompts", {}).get("QuestionAnswering"),
        "doc_string_used": doc_string(chunks[0])[:22] + "...",
        "repo_docs_indexed": docs, "indexed_chunks": len(chunks), "served_chunks": len(served),
        "questions": len(rows), "answerable": n,
        "r@1": round(sum(r["first_expected_rank"] == 1 for r in answerable) / n, 3),
        "r@3": round(sum(r["first_expected_rank"] and r["first_expected_rank"] <= 3 for r in answerable) / n, 3),
        "r@5": round(sum(r["first_expected_rank"] and r["first_expected_rank"] <= 5 for r in answerable) / n, 3),
        "mrr@10": round(sum(1 / r["first_expected_rank"] for r in answerable if r["first_expected_rank"]) / n, 3),
        "coverage@5": round(sum(bool(r["first_expected_rank"]) and r["first_expected_rank"] <= 5 for r in answerable) / n, 3),
        "governance_leaks": sum(len(r["leaked_pending"]) for r in per_q),
        "unanswerable_top1": {r["qid"]: r["top5"][0] for r in per_q if not r["expect_evidence"]},
        "per_question": per_q,
    }
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
