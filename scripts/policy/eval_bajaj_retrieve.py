"""Stage 1 of the bajaj_v1 evaluation (GPU container `hx-loan-bajaj`): run every retriever ONCE and dump raw runs.

    docker run --rm --name hx-loan-bajaj --device=/dev/kfd --device=/dev/dri --group-add video -e HF_HUB_OFFLINE=1 \
      -v /root/hx/loan:/root/hx/loan -v /root/.cache/huggingface:/root/.cache/huggingface rocm:latest \
      bash /root/hx/loan/repo-bajaj/scripts/policy/rag_run_bajaj.sh

For each benchmark question, under its lender-profile filter (mode + profile, applied BEFORE ranking):
  dense top-100 (EmbeddingGemma 2 in Qdrant), BM25 top-100, cross-encoder scores (bge-reranker-v2-m3) for the
  union of dense top-50 and BM25 top-50, plus UNFILTERED dense/BM25 top-20 for the governance check.
Relevant chunk ids are computed here (gold doc + verbatim anchor) so later stages never need the copyrighted text.
Stage 2 (scripts/policy/eval_bajaj_score.py, CPU) tunes fusion / rerank / abstention on the DEV split and scores TEST.
VRAM is capped at 6 GiB (torch per-process fraction) per the droplet budget.

The dense index is built in memory by default: nothing under $LOAN_POLICY_DIR is written or deleted.
--index-dir persists it (for reuse); an existing index there is only replaced with --replace-index,
and the replacement is staged, validated and swapped in.
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from rag.index_meta import index_identity  # noqa: E402
from rag.retrieve import (BM25Index, CrossEncoderReranker, DenseIndex, DOC_PREFIX, RetrievalFilter,  # noqa: E402
                          doc_string, load_profile, profile_filter, rebuild_index)

POLICY = Path(os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"))
OUT = Path(os.environ.get("RAG_OUT", POLICY / "eval_bajaj_v1"))
EMBED = os.environ.get("EMBED_MODEL", "google/embeddinggemma-2")
RERANK = os.environ.get("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")
BENCH = ROOT / "data/evaluation/rag/bajaj_v1/benchmark.jsonl"
norm = lambda s: re.sub(r"\s+", " ", s).strip().lower()


def checked_index_dir(explicit: str, replace: bool) -> Path:
    """A persistent index target. An existing one needs the explicit --replace-index opt-in."""
    p = Path(explicit)
    if p.exists() and (not p.is_dir() or any(p.iterdir())) and not replace:
        raise SystemExit(f"{p} already contains an index; pass --replace-index to rebuild it")
    return p


def index_target(explicit: str, replace: bool) -> Path | None:
    """None means the throwaway in-memory index: no directory is written."""
    return checked_index_dir(explicit, replace) if explicit else None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--index-dir", default="", help="persist the index here (default: in memory only)")
    ap.add_argument("--replace-index", action="store_true", help="allow replacing an existing --index-dir")
    a = ap.parse_args(argv)
    index_dir = index_target(a.index_dir, a.replace_index)
    import torch
    from sentence_transformers import SentenceTransformer
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    if dev == "cuda":
        torch.cuda.set_per_process_memory_fraction(min(1.0, 6 * 2**30 / torch.cuda.get_device_properties(0).total_memory))
    chunks = [json.loads(l) for l in (POLICY / "chunks.jsonl").open(encoding="utf-8")]
    by_id = {c["chunk_id"]: c for c in chunks}
    bench = [json.loads(l) for l in BENCH.open(encoding="utf-8")]
    t0 = time.time()
    emb = SentenceTransformer(EMBED, device=dev, model_kwargs={"torch_dtype": torch.bfloat16})
    vecs = emb.encode([doc_string(c) for c in chunks], batch_size=32, normalize_embeddings=True, show_progress_bar=False)
    index_s = time.time() - t0
    identity = index_identity(embed_model=EMBED, dimension=emb.get_sentence_embedding_dimension(),
                              doc_prefix=DOC_PREFIX, query_prompt="QuestionAnswering",
                              query_prompt_text=(getattr(emb, "prompts", {}) or {}).get("QuestionAnswering"))
    dense = DenseIndex(chunks, vecs)  # temporary in-memory index; the eval never needs a persisted one
    if index_dir is not None:
        rebuild_index(index_dir, chunks, vecs, meta=identity, replace=a.replace_index)
    bm25 = BM25Index(chunks)
    rr = CrossEncoderReranker(RERANK, device=dev)
    profiles, rows = {}, []
    embed_q = lambda q: emb.encode(q, prompt_name="QuestionAnswering", normalize_embeddings=True)
    for q in bench[:3]:  # warm-up
        embed_q(q["question"]); rr.score(q["question"], chunks[:4])
    for q in bench:
        prof = profiles.setdefault(q["profile"], load_profile(q["profile"]))
        flt = profile_filter(prof, q["mode"], include_education=True)
        t = time.perf_counter(); qv = embed_q(q["question"]); t_emb = (time.perf_counter() - t) * 1000
        t = time.perf_counter(); d = dense.search(qv, flt, 100); t_dense = (time.perf_counter() - t) * 1000
        t = time.perf_counter(); b = bm25.search(q["question"], flt, 100); t_bm25 = (time.perf_counter() - t) * 1000
        cand = list(dict.fromkeys([c for c, _ in d[:50]] + [c for c, _ in b[:50]]))
        t = time.perf_counter(); rs = rr.score(q["question"], [by_id[c] for c in cand]); t_rr = (time.perf_counter() - t) * 1000
        # rerank latency for a 30-candidate request (what the runtime config does)
        t = time.perf_counter(); rr.score(q["question"], [by_id[c] for c in cand[:30]]); t_rr30 = (time.perf_counter() - t) * 1000
        unf = RetrievalFilter(mode="unfiltered")
        rel = sorted(c["chunk_id"] for c in chunks if flt.allows(c) and c["document_id"] in q["gold_docs"]
                     and any(norm(a) in norm(c["text"]) for a in q["gold_anchors"]))
        rows.append({"qid": q["qid"], "split": q["split"], "category": q["category"], "origin": q["origin"], "mode": q["mode"],
                     "profile": q["profile"], "expect_abstain": q["expect_abstain"], "gold_docs": q["gold_docs"], "relevant": rel,
                     "dense": [(c, round(s, 5)) for c, s in d], "bm25": [(c, round(s, 4)) for c, s in b],
                     "rerank": {c: round(s, 4) for c, s in zip(cand, rs)},
                     "unfiltered_dense": [c for c, _ in dense.search(qv, unf, 20)],
                     "unfiltered_bm25": [c for c, _ in bm25.search(q["question"], unf, 20)],
                     "latency_ms": {"embed": round(t_emb, 2), "dense": round(t_dense, 2), "bm25": round(t_bm25, 2),
                                    "rerank_union": round(t_rr, 2), "rerank30": round(t_rr30, 2), "n_union": len(cand)}})
    meta = {"chunks": len(chunks), "questions": len(bench), "embed_model": EMBED, "rerank_model": RERANK, "device": dev,
            "index_build_s": round(index_s, 1), "peak_vram_gib": round(torch.cuda.max_memory_allocated() / 2**30, 2) if dev == "cuda" else 0,
            "versions": {"torch": torch.__version__, "transformers": __import__("transformers").__version__,
                         "sentence_transformers": __import__("sentence_transformers").__version__},
            "chunk_meta": {c["chunk_id"]: {"doc": c["document_id"], "status": c["approval_status"], "lender": c.get("lender_id"),
                                           "entity": c.get("applies_to_entity"), "source_type": c.get("source_type")} for c in chunks}}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "runs.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
    (OUT / "meta.json").write_text(json.dumps(meta), encoding="utf-8")
    print(json.dumps({k: v for k, v in meta.items() if k != "chunk_meta"}, indent=1))


if __name__ == "__main__":
    main()
