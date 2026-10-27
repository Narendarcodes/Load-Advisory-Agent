"""Stage 2 of the bajaj_v1 evaluation (CPU only, no document text needed).

    python scripts/policy/eval_bajaj_score.py --runs <dir with runs.jsonl + meta.json> --out <dir>

1. Tunes, on the DEV split only:
   - weighted RRF: w_bm25 (w_dense = 1) and k, maximising dev MRR@10 (ties: R@5, then smaller w_bm25);
   - rerank depth N (cross-encoder reorders the top-N weighted-RRF candidates);
   - one abstention threshold per system on its top score (balanced accuracy on dev).
2. Scores the held-out TEST split for: BM25, dense, hybrid (equal RRF, the phase-4 baseline), hybrid (weighted
   RRF, tuned), hybrid + rerank. Recall@k, MRR@10, nDCG@10, citation@1 (doc and passage), abstention, governance,
   latency, paired-bootstrap 95% CIs.
3. Writes report.json and rankings.jsonl (top-10 chunk ids per system per question) for stage 3 (LLM answers).
"""
import argparse
import json
import math
import random
import statistics
from pathlib import Path

SYSTEMS = ("bm25", "dense", "hybrid_rrf_equal", "hybrid_weighted", "hybrid_rerank")
ALLOWED = {"current": {"approved"}, "historical": {"approved", "approved_historical"}}


def wrrf(lists, weights, k, top=50):
    s = {}
    for lst, w in zip(lists, weights):
        for r, (c, _) in enumerate(lst):
            s[c] = s.get(c, 0.0) + w / (k + r + 1)
    return [c for c, _ in sorted(s.items(), key=lambda x: (-x[1], x[0]))[:top]]


def rank(row, system, cfg):
    d, b = row["dense"][:cfg["depth"]], row["bm25"][:cfg["depth"]]
    if system == "bm25":
        return [c for c, _ in row["bm25"][:10]]
    if system == "dense":
        return [c for c, _ in row["dense"][:10]]
    if system == "hybrid_rrf_equal":
        return wrrf([d, b], [1.0, 1.0], 60, 10)
    fused = wrrf([d, b], [1.0, cfg["w_bm25"]], cfg["k"], 50)
    if system == "hybrid_weighted":
        return fused[:10]
    cand = fused[:cfg["rerank_n"]]
    rr = row["rerank"]
    return sorted(cand, key=lambda c: -rr.get(c, -1e9))[:10] + [c for c in fused[cfg["rerank_n"]:] if c not in cand][:max(0, 10 - len(cand))]


def top_score(row, system, ranked):
    if system == "bm25":
        return row["bm25"][0][1] if row["bm25"] else 0.0
    if system == "hybrid_rerank":
        return row["rerank"].get(ranked[0], -1e9) if ranked else -1e9
    return row["dense"][0][1] if row["dense"] else 0.0  # dense / fused systems: top dense cosine


def metrics(ranked, rel, gold_docs, meta):
    hit = [c in rel for c in ranked]
    m = {f"recall@{k}": float(any(hit[:k])) for k in (1, 3, 5, 10)}
    first = next((i for i, h in enumerate(hit) if h), None)
    m["mrr@10"] = 1.0 / (first + 1) if first is not None else 0.0
    dcg = sum(1 / math.log2(i + 2) for i, h in enumerate(hit[:10]) if h)
    idcg = sum(1 / math.log2(i + 2) for i in range(min(10, len(rel))))
    m["ndcg@10"] = dcg / idcg if idcg else 0.0
    m["cite@1_doc"] = float(bool(ranked) and meta[ranked[0]]["doc"] in gold_docs)
    m["cite@1_passage"] = m["recall@1"]
    return m


def mean(xs):
    return round(statistics.mean(xs), 3) if xs else None


def agg(rows, system, ranks, meta):
    ms = [metrics(ranks[r["qid"]][system], set(r["relevant"]), r["gold_docs"], meta) for r in rows]
    return {k: mean([m[k] for m in ms]) for k in ms[0]} | {"n": len(ms)} if ms else {"n": 0}


def balanced_acc(rows, scores, th):
    pos = [scores[r["qid"]] >= th for r in rows if not r["expect_abstain"]]  # answer
    neg = [scores[r["qid"]] < th for r in rows if r["expect_abstain"]]      # abstain
    return 0.5 * (statistics.mean(pos) if pos else 0) + 0.5 * (statistics.mean(neg) if neg else 0)


def auroc(rows, scores):
    p = [scores[r["qid"]] for r in rows if not r["expect_abstain"]]
    n = [scores[r["qid"]] for r in rows if r["expect_abstain"]]
    if not p or not n:
        return None
    return round(sum((a > b) + 0.5 * (a == b) for a in p for b in n) / (len(p) * len(n)), 3)


def bootstrap_diff(rows, ranks, meta, sys_a, sys_b, key, n=2000, seed=7):
    rng = random.Random(seed)
    va = [metrics(ranks[r["qid"]][sys_a], set(r["relevant"]), r["gold_docs"], meta)[key] for r in rows]
    vb = [metrics(ranks[r["qid"]][sys_b], set(r["relevant"]), r["gold_docs"], meta)[key] for r in rows]
    diffs = []
    for _ in range(n):
        idx = [rng.randrange(len(rows)) for _ in rows]
        diffs.append(statistics.mean(va[i] - vb[i] for i in idx))
    diffs.sort()
    return {"diff": round(statistics.mean(a - b for a, b in zip(va, vb)), 3),
            "ci95": [round(diffs[int(0.025 * n)], 3), round(diffs[int(0.975 * n) - 1], 3)]}


def permitted(cid, row, meta, profiles):
    m = meta[cid]
    if m["status"] not in ALLOWED[row["mode"]]:
        return False
    p = profiles[row["profile"]]
    if m["lender"] not in (None, p["lender_id"]):
        return False
    ent = m["entity"] or ["all"]
    return p["entity_type"] in (None, "any") or "all" in ent or p["entity_type"] in ent


def load_runs(d: Path):
    """runs.jsonl/meta.json, or their .gz copies committed under data/evaluation/rag/bajaj_v1/results/."""
    import gzip
    op = lambda n: gzip.open(d / f"{n}.gz", "rt", encoding="utf-8") if (d / f"{n}.gz").exists() and not (d / n).exists() else open(d / n, encoding="utf-8")
    with op("runs.jsonl") as f:
        runs = [json.loads(l) for l in f]
    with op("meta.json") as f:
        meta = json.load(f)
    return runs, meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--profiles", default=str(Path(__file__).resolve().parents[2] / "config" / "lender_profiles"))
    a = ap.parse_args()
    import yaml
    runs, meta_all = load_runs(Path(a.runs))
    meta = meta_all["chunk_meta"]
    profiles = {p.stem: yaml.safe_load(p.read_text(encoding="utf-8")) for p in Path(a.profiles).glob("*.yaml")}
    dev = [r for r in runs if r["split"] == "dev"]
    test = [r for r in runs if r["split"] == "test"]
    dev_ans = [r for r in dev if not r["expect_abstain"]]
    test_ans = [r for r in test if not r["expect_abstain"]]

    # ---- 1. tune fusion on dev
    grid = []
    for w in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0):
        for k in (5, 10, 20, 30, 60, 100):
            cfg = {"w_bm25": w, "k": k, "depth": 50, "rerank_n": 0}
            ms = [metrics(rank(r, "hybrid_weighted", cfg), set(r["relevant"]), r["gold_docs"], meta) for r in dev_ans]
            grid.append({"w_bm25": w, "k": k, "dev_mrr@10": mean([m["mrr@10"] for m in ms]), "dev_recall@5": mean([m["recall@5"] for m in ms])})
    best = max(grid, key=lambda g: (g["dev_mrr@10"], g["dev_recall@5"], -g["w_bm25"]))
    cfg = {"w_bm25": best["w_bm25"], "k": best["k"], "depth": 50}
    rgrid = []
    for n in (5, 10, 20, 30, 50):
        c = cfg | {"rerank_n": n}
        ms = [metrics(rank(r, "hybrid_rerank", c), set(r["relevant"]), r["gold_docs"], meta) for r in dev_ans]
        rgrid.append({"rerank_n": n, "dev_mrr@10": mean([m["mrr@10"] for m in ms]), "dev_recall@5": mean([m["recall@5"] for m in ms])})
    rbest = max(rgrid, key=lambda g: (g["dev_mrr@10"], g["dev_recall@5"], -g["rerank_n"]))
    cfg["rerank_n"] = rbest["rerank_n"]

    ranks = {r["qid"]: {s: rank(r, s, cfg) for s in SYSTEMS} for r in runs}
    scores = {s: {r["qid"]: top_score(r, s, ranks[r["qid"]][s]) for r in runs} for s in SYSTEMS}

    # ---- 2. abstention thresholds on dev (current-mode questions; historical questions are always answerable)
    abst = {}
    for s in SYSTEMS:
        cands = sorted({scores[s][r["qid"]] for r in dev})
        th = max(cands, key=lambda t: (balanced_acc(dev, scores[s], t), -t)) if cands else 0
        abst[s] = {"threshold_from_dev": round(th, 4), "dev_balanced_acc": round(balanced_acc(dev, scores[s], th), 3),
                   "test_balanced_acc": round(balanced_acc(test, scores[s], th), 3),
                   "test_abstain_recall": mean([scores[s][r["qid"]] < th for r in test if r["expect_abstain"]]),
                   "test_false_abstain_rate": mean([scores[s][r["qid"]] < th for r in test_ans]),
                   "test_auroc": auroc(test, scores[s]),
                   "n_test_abstain": sum(r["expect_abstain"] for r in test), "n_test_answerable": len(test_ans)}

    # ---- governance: final top-10 never contains a non-permitted chunk; unfiltered baseline shows why the filter matters
    gov = {s: sum(any(not permitted(c, r, meta, profiles) for c in ranks[r["qid"]][s]) for r in runs) for s in SYSTEMS}
    unf = {"injection_doc_in_unfiltered_top10": 0, "other_lender_doc_in_unfiltered_top10": 0, "historical_in_unfiltered_top10_current_mode": 0}
    for r in runs:
        u = r["unfiltered_dense"][:10] + r["unfiltered_bm25"][:10]
        docs = {meta[c]["doc"] for c in u}
        unf["injection_doc_in_unfiltered_top10"] += any(d.startswith("SYN-INJECT") for d in docs)
        lid = profiles[r["profile"]]["lender_id"]
        unf["other_lender_doc_in_unfiltered_top10"] += any(meta[c]["lender"] not in (None, lid) for c in u)
        unf["historical_in_unfiltered_top10_current_mode"] += r["mode"] == "current" and any(meta[c]["status"] == "approved_historical" for c in u)

    lat = {}
    for s in SYSTEMS:
        v = []
        for r in runs:
            L = r["latency_ms"]
            v.append({"bm25": L["bm25"], "dense": L["embed"] + L["dense"], "hybrid_rrf_equal": L["embed"] + L["dense"] + L["bm25"],
                      "hybrid_weighted": L["embed"] + L["dense"] + L["bm25"],
                      # rerank cost measured for 30 candidates and for the full dense50+bm25-50 union (<=100);
                      # the dev-tuned depth decides which applies
                      "hybrid_rerank": L["embed"] + L["dense"] + L["bm25"] + (L["rerank30"] if cfg["rerank_n"] <= 30 else L["rerank_union"])}[s])
        v.sort()
        lat[s] = {"p50": round(statistics.median(v), 1), "p95": round(v[int(0.95 * len(v)) - 1], 1)}

    cats = sorted({r["category"] for r in test_ans})
    report = {
        "dataset": {"questions": len(runs), "dev": len(dev), "test": len(test), "test_answerable": len(test_ans),
                    "test_abstain": len(test) - len(test_ans), "dev_answerable": len(dev_ans),
                    "test_human": sum(r["origin"] == "human" for r in test), "test_llm_reviewed": sum(r["origin"] != "human" for r in test)},
        "models": {k: meta_all[k] for k in ("embed_model", "rerank_model", "device", "peak_vram_gib", "index_build_s", "chunks", "versions")},
        "tuned_on_dev": {"fusion": cfg | {"w_dense": 1.0}, "fusion_grid": grid, "rerank_grid": rgrid},
        "test_overall": {s: agg(test_ans, s, ranks, meta) for s in SYSTEMS},
        "dev_overall": {s: agg(dev_ans, s, ranks, meta) for s in SYSTEMS},
        "test_by_origin": {o: {s: agg([r for r in test_ans if (r["origin"] == "human") == (o == "human")], s, ranks, meta) for s in SYSTEMS}
                           for o in ("human", "llm_draft_reviewed")},
        "test_by_category": {c: {s: agg([r for r in test_ans if r["category"] == c], s, ranks, meta) for s in SYSTEMS} for c in cats},
        "paired_bootstrap_test": {f"{x}_minus_{y}": {k: bootstrap_diff(test_ans, ranks, meta, x, y, k) for k in ("mrr@10", "recall@5")}
                                  for x, y in (("hybrid_rerank", "dense"), ("hybrid_weighted", "dense"), ("hybrid_rrf_equal", "dense"),
                                               ("hybrid_rerank", "bm25"), ("hybrid_weighted", "hybrid_rrf_equal"))},
        "abstention_retrieval_threshold": abst,
        "governance": {"non_permitted_chunks_in_final_top10(questions)": gov, "without_filter": unf},
        "latency_ms": lat,
        "latency_note": "hybrid_rerank uses the measured rerank time for 30 candidates if the tuned depth <= 30, otherwise the time for the whole dense-50 + BM25-50 union (an upper bound for depth 50)",
        "misses_test_hybrid_rerank@10": [r["qid"] for r in test_ans if not set(ranks[r["qid"]]["hybrid_rerank"]) & set(r["relevant"])],
    }
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    (out / "report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf-8")
    with (out / "rankings.jsonl").open("w", encoding="utf-8") as f:
        for r in runs:
            f.write(json.dumps({"qid": r["qid"], "split": r["split"], "ranks": ranks[r["qid"]],
                                "top_scores": {s: scores[s][r["qid"]] for s in SYSTEMS},
                                "retrieval_abstain": {s: scores[s][r["qid"]] < abst[s]["threshold_from_dev"] for s in SYSTEMS}}) + "\n")
    print(json.dumps({"tuned": cfg, "test": report["test_overall"], "abstention": abst, "governance": report["governance"]}, indent=1))


if __name__ == "__main__":
    main()
