"""Benchmark hybrid (Qdrant dense + BM25, RRF) vs BM25-only vs dense-only on benchmark_v1.

Runs inside the GPU container `hx-loan-rag` (rocm:latest + sentence-transformers), e.g.
  docker run --rm --name hx-loan-rag --device=/dev/kfd --device=/dev/dri --group-add video \
    -v /root/hx/loan:/root/hx/loan -v /root/.cache/huggingface:/root/.cache/huggingface rocm:latest \
    bash -c "pip install -q sentence-transformers qdrant-client rank_bm25 pyyaml && \
             cd /root/hx/loan/repo && LOAN_DATA_DIR=/root/hx/loan/data python scripts/policy/eval_rag.py"
VRAM is capped at 6 GB (torch per-process fraction) per the droplet budget.
"""
import json
import math
import os
import re
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from rag.retrieve import BM25Index, DenseIndex, HybridRetriever, doc_string, rrf  # noqa: E402

DATA = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data")) / "policy"
OUT = Path(os.environ.get("RAG_OUT", DATA / "eval"))
MODEL = os.environ.get("EMBED_MODEL", "google/embeddinggemma-2")
norm = lambda s: re.sub(r"\s+", " ", s).strip().lower()


def load_model():
    import torch
    from sentence_transformers import SentenceTransformer
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    if dev == "cuda":
        total = torch.cuda.get_device_properties(0).total_memory
        torch.cuda.set_per_process_memory_fraction(min(1.0, 6 * 2**30 / total))
    m = SentenceTransformer(MODEL, device=dev, model_kwargs={"torch_dtype": torch.bfloat16})
    return m, dev


def relevant(chunk, q):
    return chunk["document_id"] in q["gold_docs"] and any(norm(a) in norm(chunk["text"]) for a in q["gold_anchors"])


def metrics(ranked, rel_ids, gold_docs, by_id, ks=(1, 3, 5, 10)):
    ids = [c for c, _ in ranked]
    hit = [i in rel_ids for i in ids]
    m = {f"recall@{k}": float(any(hit[:k])) for k in ks}
    first = next((r for r, h in enumerate(hit) if h), None)
    m["mrr@10"] = 1.0 / (first + 1) if first is not None and first < 10 else 0.0
    dcg = sum(1 / math.log2(r + 2) for r, h in enumerate(hit[:10]) if h)
    idcg = sum(1 / math.log2(r + 2) for r in range(min(10, len(rel_ids))))
    m["ndcg@10"] = dcg / idcg if idcg else 0.0
    m["doc_p@1"] = float(bool(ids) and by_id[ids[0]]["document_id"] in gold_docs)
    for k in (5, 10):
        got = {by_id[i]["document_id"] for i, h in zip(ids[:k], hit[:k]) if h}
        m[f"all_gold_docs@{k}"] = float(set(gold_docs) <= got)
    return m


def auroc(pos, neg):
    if not pos or not neg:
        return None
    return sum((p > n) + 0.5 * (p == n) for p in pos for n in neg) / (len(pos) * len(neg))


def main():
    chunks = [json.loads(l) for l in (DATA / "chunks.jsonl").open()]
    by_id = {c["chunk_id"]: c for c in chunks}
    bench = [json.loads(l) for l in (ROOT / "data/evaluation/rag/benchmark_v1.jsonl").open()]
    model, dev = load_model()
    t = time.time()
    vecs = model.encode([doc_string(c) for c in chunks], batch_size=32, normalize_embeddings=True, show_progress_bar=False)
    index_s = time.time() - t
    import torch
    peak = torch.cuda.max_memory_allocated() / 2**30 if dev == "cuda" else 0.0
    dense = DenseIndex(chunks, vecs, path=str(DATA / "qdrant"))
    bm25 = BM25Index(chunks)
    embed_q = lambda q: model.encode(q, prompt_name="QuestionAnswering", normalize_embeddings=True)
    hyb = HybridRetriever(bm25, dense, embed_q)
    for q in bench[:3]:
        hyb.search(q["question"])  # warm-up
    per_q, lat = [], {"hybrid": [], "bm25": [], "dense": []}
    for q in bench:
        mode = q["mode"]
        t0 = time.perf_counter(); b = bm25.search(q["question"], mode, k=10); lat["bm25"].append((time.perf_counter() - t0) * 1000)
        t0 = time.perf_counter(); qv = embed_q(q["question"]); d = dense.search(qv, mode, k=50); lat["dense"].append((time.perf_counter() - t0) * 1000)
        h = hyb.search(q["question"], mode); lat["hybrid"].append(h["latency_ms"])
        b50 = bm25.search(q["question"], mode, k=50)
        runs = {"bm25": b, "dense": d[:10], "hybrid": rrf(d, b50, top=10)}
        unf = rrf(dense.search(qv, "unfiltered"), bm25.search(q["question"], "unfiltered", 50), top=10)
        rel = {c["chunk_id"] for c in chunks if relevant(c, q)}
        row = {"qid": q["qid"], "category": q["category"], "mode": mode, "origin": q["origin"],
               "expect_abstain": q["expect_abstain"], "top_dense": d[0][1] if d else 0, "top_bm25": b[0][1] if b else 0,
               "inject_in_top10": {"filtered": any(by_id[c]["document_id"] == "SYN-INJECT-001" for c, _ in runs["hybrid"]),
                                   "unfiltered": any(by_id[c]["document_id"] == "SYN-INJECT-001" for c, _ in unf)},
               "non_current_in_top10": sum(by_id[c]["approval_status"] != "approved" for c, _ in runs["hybrid"]) if mode == "current" else None,
               "top3": {k: [c for c, _ in v[:3]] for k, v in runs.items()}}
        if not q["expect_abstain"] or rel:
            row["metrics"] = {k: metrics(v, rel, q["gold_docs"], by_id) for k, v in runs.items()}
        per_q.append(row)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "per_question.jsonl").write_text("".join(json.dumps(r) + "\n" for r in per_q))

    def agg(rows, sysname):
        ms = [r["metrics"][sysname] for r in rows if "metrics" in r]
        return {k: round(statistics.mean(m[k] for m in ms), 3) for k in ms[0]} | {"n": len(ms)} if ms else {}

    ans = [r for r in per_q if "metrics" in r]
    report = {"model": MODEL, "device": dev, "chunks": len(chunks), "questions": len(bench),
              "answerable": len(ans), "abstain_questions": sum(r["expect_abstain"] and "metrics" not in r for r in per_q),
              "index_build_s": round(index_s, 1), "peak_vram_gib": round(peak, 2),
              "overall": {s: agg(ans, s) for s in ("bm25", "dense", "hybrid")},
              "by_category": {cat: {s: agg([r for r in ans if r["category"] == cat], s) for s in ("bm25", "dense", "hybrid")}
                              for cat in sorted({r["category"] for r in ans})},
              "by_origin": {o: {s: agg([r for r in ans if r["origin"] == o], s) for s in ("bm25", "hybrid")}
                            for o in ("human", "llm_draft_reviewed")},
              "latency_ms": {k: {"p50": round(statistics.median(v), 1), "p95": round(sorted(v)[int(0.95 * len(v)) - 1], 1)} for k, v in lat.items()},
              "governance": {
                  "non_current_chunks_in_current_mode_top10": sum(r["non_current_in_top10"] or 0 for r in per_q),
                  "injection_doc_in_top10_filtered": sum(r["inject_in_top10"]["filtered"] for r in per_q),
                  "injection_doc_in_top10_unfiltered": sum(r["inject_in_top10"]["unfiltered"] for r in per_q)}}
    # abstention: threshold on top dense cosine (hybrid) / top BM25 score, tuned on odd rows, tested on even rows
    labelled = [r for r in per_q if r["mode"] == "current" and r["category"] not in ("version_gap",)]
    for name, key in (("hybrid_dense_score", "top_dense"), ("bm25_score", "top_bm25")):
        pos = [r[key] for r in labelled if not r["expect_abstain"]]
        neg = [r[key] for r in labelled if r["expect_abstain"] and "metrics" not in r]
        dev_, test = labelled[1::2], labelled[0::2]
        cands = sorted({r[key] for r in dev_})
        acc = lambda rows, th: statistics.mean(((r[key] < th) == (r["expect_abstain"] and "metrics" not in r)) for r in rows)
        best = max(cands, key=lambda th: acc(dev_, th)) if cands else 0
        report.setdefault("abstention", {})[name] = {"auroc_all": round(auroc(pos, neg), 3) if neg else None,
                                                     "threshold_from_dev": round(best, 4), "test_accuracy": round(acc(test, best), 3),
                                                     "n_pos": len(pos), "n_neg": len(neg)}
    (OUT / "report.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
