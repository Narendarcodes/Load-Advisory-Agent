"""Write the Saral DeepEval RAG baseline report (golden RAG v2, dev split) from a Kaggle results directory.

    python scripts/policy/report_saral_deepeval.py --results <downloaded /kaggle/working/results> \
        --golden <golden v2 dev jsonl the run used> --meta <meta.json> --out docs/saral/DEEPEVAL_BASELINE.md \
        [--compact-dir docs/saral/deepeval_baseline_v2]

Only numbers present in the results files are reported. A metric the judge could not score is shown as unscored, never
filled in. --compact-dir writes the small result JSON that is committed (summary, breakdowns, per-item scores without
answer text, provenance).
"""
import argparse
import json
import shutil
from collections import Counter, defaultdict
from pathlib import Path

RAG = ["Faithfulness", "AnswerRelevancy", "ContextualRecall", "ContextualPrecision"]
BARS = {"Faithfulness": 0.85, "AnswerRelevancy": 0.80, "ContextualRecall": 0.80}
BEH = ["refuse", "abstain", "clarify", "answer_note"]
TAX_DESC = {
    "retrieval_miss": "no gold document in the final top 5",
    "retrieval_miss_chunk_only": "gold document retrieved, but not the anchored chunk",
    "over_abstain": "abstained (or fell back to the abstain template) on an answerable question",
    "missing_citation": "answered with no citation",
    "wrong_citation": "cited, but the citation GEval scored < 0.5 (only when that metric ran)",
    "wrong_figure": "figure GEval < 0.5 (only when that metric ran)",
    "no_clarifying_question": "clarify item with ExpectedBehaviour < 0.5",
    "discrepancy_not_noted": "conflict item (answer_note) with ExpectedBehaviour < 1.0",
    "unsafe_or_wrong_refusal": "refuse/abstain item with ExpectedBehaviour < 0.5",
    "language_garble": "Hindi/Telugu item not answered in that script (< 30% of word characters)",
    "leaked_term": "internal term in the answer (regex: OCR, ZEN, RAG, LLM, P1-P5, bureau, chunk, passage, retrieval, "
                   "embedding, system prompt)",
    "generator_error": "generator returned unparsable JSON or no response",
}


def jl(p):
    p = Path(p)
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []


def js(p):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def f3(x):
    return "—" if x is None else f"{x:.3f}"


def mean(xs):
    xs = [x for x in xs if x is not None]
    return (sum(xs) / len(xs)) if xs else None


def scores_by(per, key, metrics):
    """{group: {metric: (mean, n_scored)}} over items that have the metric scored."""
    out = defaultdict(dict)
    groups = sorted({p[key] for p in per if p.get(key) is not None})
    for gname in groups:
        rows = [p for p in per if p.get(key) == gname]
        for m in metrics:
            xs = [p["scores"].get(m) for p in rows if p["scores"].get(m) is not None]
            out[gname][m] = (mean(xs), len(xs))
        out[gname]["_n"] = (len(rows), len(rows))
    return out


def behaviour_table(per):
    rows = {}
    for b in BEH:
        items = [p for p in per if p["expected_behavior"] == b]
        if not items:
            continue
        eb = [p["scores"].get("ExpectedBehaviour") for p in items if p["scores"].get("ExpectedBehaviour") is not None]
        det = None
        if b in ("refuse", "abstain"):
            det = sum(bool(p.get("declined")) for p in items) / len(items)
        elif b == "clarify":
            det = sum(bool(p.get("asked_question")) for p in items) / len(items)
        rows[b] = {"n": len(items), "judge_scored": len(eb), "judge_mean": mean(eb),
                   "judge_pass@0.5": (sum(x >= 0.5 for x in eb) / len(eb)) if eb else None, "deterministic_rate": det}
    return rows


def worst_items(per, gold, scores, k=10):
    rank = []
    for p in per:
        sc = {m: v for m, v in p["scores"].items() if v is not None}
        if not sc:
            continue
        keys = [m for m in RAG if m in sc] or list(sc)
        avg = mean([sc[m] for m in keys])
        lowest = min(keys, key=lambda m: sc[m])
        reason = (scores.get((p["qid"], lowest)) or {}).get("reason") or ""
        rank.append((avg, p, lowest, sc[lowest], reason))
    rank.sort(key=lambda x: (x[0], x[1]["qid"]))
    return rank[:k]


def pct(xs, q):
    xs = sorted(x for x in xs if x is not None)
    return xs[min(len(xs) - 1, int(q * len(xs)))] if xs else None


def limitations(per, answers, jinfo, ginfo, meta):
    """Group the actual failures into the limitation taxonomy. Returns {group: {count, examples, cause, rule}}."""
    def ex(rows, k=2):
        return [p["qid"] for p in rows[:k]]
    sc = lambda p, m: p["scores"].get(m)  # noqa: E731
    ans = [p for p in per if p["expected_behavior"] in ("answer", "answer_note")]
    causes = meta.get("limitation_causes", {})
    G = {}
    r = [p for p in ans if {"retrieval_miss", "retrieval_miss_chunk_only"} & set(p["failures"])]
    r.sort(key=lambda p: ("retrieval_miss" not in p["failures"], p["qid"]))
    G["Retrieval misses"] = dict(rows=r, rule="answerable item whose anchored chunk is not in the final top 5 "
                                 f"({sum('retrieval_miss' in p['failures'] for p in r)} with no gold document at all)")
    r = [p for p in ans if sc(p, "Faithfulness") is not None and sc(p, "Faithfulness") < BARS["Faithfulness"]]
    r.sort(key=lambda p: (sc(p, "Faithfulness"), p["qid"]))
    G["Unfaithful or unsupported claims"] = dict(rows=r, rule=f"Faithfulness < {BARS['Faithfulness']} "
                                                f"({sum(sc(p, 'Faithfulness') < 0.5 for p in r)} below 0.5)")
    r = [p for p in per if {"over_abstain", "unsafe_or_wrong_refusal", "no_clarifying_question"} & set(p["failures"])]
    r.sort(key=lambda p: (p["expected_behavior"] == "answer", p["qid"]))
    n_over = sum("over_abstain" in p["failures"] for p in r)
    G["Wrong abstain or refuse"] = dict(rows=r, rule=f"over-abstained on an answerable item ({n_over}), refuse/abstain "
                                        f"item judged wrong ({sum('unsafe_or_wrong_refusal' in p['failures'] for p in r)}), "
                                        f"clarify item with no clarifying question ({sum('no_clarifying_question' in p['failures'] for p in r)})")
    def lang_bad(p):
        return p["language"] in ("hi", "te") and (bool(set(p["failures"]) - {"leaked_term"}) or any(
            sc(p, m) is not None and sc(p, m) < BARS.get(m, 0.5) for m in RAG + ["ExpectedBehaviour"]))
    r = sorted([p for p in per if lang_bad(p)], key=lambda p: (p["language"], p["qid"]))
    n_hi, n_te = (sum(p["language"] == x for p in per) for x in ("hi", "te"))
    G["Hindi and Telugu failures"] = dict(rows=r, rule=f"hi/te item with a failure tag (other than leaked labels) or a metric below its bar "
                                          f"(hi {sum(p['language'] == 'hi' for p in r)}/{n_hi}, te {sum(p['language'] == 'te' for p in r)}/{n_te}; "
                                          f"wrong script: {sum('language_garble' in p['failures'] for p in r)})")
    r = sorted([p for p in per if "discrepancy_not_noted" in p["failures"]], key=lambda p: p["qid"])
    G["Conflict-note handling"] = dict(rows=r, rule="answer_note (conflicting-source) item with ExpectedBehaviour < 1.0, of "
                                       f"{sum(p['expected_behavior'] == 'answer_note' for p in per)} such items")
    fb_gen = [q for q, x in answers.items() if x.get("fallback_used")]
    err_gen = [q for q, x in answers.items() if x.get("llm_error")]
    fb_j = sorted({j.split("|")[0] for j in jinfo.get("jobs_using_fallback", [])})
    secs = [x.get("seconds") for x in answers.values()]
    tmpl = [q for q, x in answers.items() if x.get("path") == "fallback_template"]
    rows = [p for p in per if p["qid"] in set(fb_gen) | set(err_gen) | set(fb_j) | set(tmpl)]
    G["Latency or rate-limit fallbacks"] = dict(rows=sorted(rows, key=lambda p: p["qid"]), rule=(
        f"generator fell back to {', '.join(ginfo.get('fallback_models', [])) or 'the fallback model'} on {len(fb_gen)} items "
        f"{fb_gen[:8]}; generator gave no answer on {len(err_gen)}; judge fell back on {len(jinfo.get('jobs_using_fallback', []))} "
        f"metric calls ({len(fb_j)} items); agent guard fallback template on {len(tmpl)} items; Groq calls: "
        f"{ginfo.get('groq_calls', 0)}; generation latency per item p50 {pct(secs, 0.5)} s, p95 {pct(secs, 0.95)} s, "
        f"max {max([x for x in secs if x is not None], default=None)} s (OmniRoute, includes the agent's one rewrite when it happened)"))
    r = sorted([p for p in per if "leaked_term" in p["failures"]], key=lambda p: p["qid"])
    G["Internal labels shown to the borrower (also observed)"] = dict(rows=r, rule="answer text contains an internal "
                                                                     "term or passage label (leak regex)")
    for k, v in G.items():
        v["count"] = len(v["rows"])
        v["examples"] = ex(v["rows"])
        v["cause"] = causes.get(k, "not analysed")
    return G


def build(results, golden, meta):
    R = Path(results)
    status, summ, prov = js(R / "status.json"), js(R / "summary.json"), js(R / "provenance.json")
    rinfo, ginfo, jinfo, irs = (js(R / "retrieval_info.json"), js(R / "generation_info.json"), js(R / "judge_info.json"),
                                js(R / "ir_summary.json"))
    gold = {g["qid"]: g for g in jl(golden)}
    per = jl(R / "per_question.jsonl")
    scores = {(r["qid"], r["metric"]): r for r in jl(R / "deepeval_scores.jsonl")}
    complete = bool(status.get("completed")) and bool(summ)
    jobs = jinfo.get("jobs") or 0
    lost = (jinfo.get("errors") or 0) + (jinfo.get("skipped_deadline") or 0)
    judge_ok = complete and jobs and lost / jobs <= 0.10
    label = ("automated (LLM-judged, no human review)" if judge_ok else
             f"automated, judge PARTIAL ({jobs - lost} of {jobs} metric evaluations scored)" if complete else "BLOCKED")
    dv, det = summ.get("deepeval", {}), summ.get("deterministic", {})
    judge_model = jinfo.get("judge_model") or status.get("judge_model", "?")
    gen_model = ginfo.get("model") or status.get("gen_model", "?")
    head = {}
    for m in RAG:
        d = dv.get(m) or {}
        bar = BARS.get(m)
        head[m] = {"mean": d.get("mean"), "scored": d.get("scored"), "n": d.get("n"), "bar": bar,
                   "pass": (None if d.get("mean") is None or bar is None else d["mean"] >= bar)}
    by_lang = scores_by(per, "language", RAG + ["ExpectedBehaviour"])
    by_var = scores_by(per, "variant", RAG + ["ExpectedBehaviour"])
    beh = behaviour_table(per)
    tax = Counter(t for p in per for t in p["failures"])
    cat_fail = Counter(p["category"] for p in per if p["failures"])
    worst = worst_items(per, gold, scores)
    answers = {x["qid"]: x for x in jl(R / "answers.jsonl")}
    lim = limitations(per, answers, jinfo, ginfo, meta)
    for p in per:
        x = answers.get(p["qid"], {})
        p["model_used"], p["fallback_used"] = x.get("model_used"), x.get("fallback_used")

    L = []
    w = L.append
    w("# Saral DeepEval RAG baseline (golden RAG v2, dev split)\n")
    w(f"**Label: {label}.** Every number was produced by the run described in §9 and read from its output files. "
      f"Retrieval ran on Kaggle (2x T4, no LLM there). Answers were generated by `{gen_model}` and judged by "
      f"`{judge_model}`, both called through OmniRoute from the Hark sandbox (fallback for either: "
      f"`{', '.join(jinfo.get('fallback_models') or ginfo.get('fallback_models') or ['none'])}`). The judge is an LLM; "
      "judge-human agreement has not been measured yet, so treat this as a first automated baseline.\n")
    if not complete:
        w(f"The run did not complete: {status.get('fatal') or status.get('blocked') or 'no results'}.\n")
    w(f"Date: {meta.get('date', '')}. Branch `feat/saral-deepeval-baseline` (base `3de95b0`, the corpus branch).\n")

    w("## 1. Headline against the approved pass bars\n")
    w("| Metric | Bar | Mean | Scored / items | Result |\n|---|---:|---:|---:|---|")
    for m in RAG:
        h = head[m]
        res = "—" if h["pass"] is None else ("PASS" if h["pass"] else "FAIL")
        if h["bar"] is None:
            res = "no bar set"
        w(f"| {m} | {f3(h['bar']) if h['bar'] else '—'} | {f3(h['mean'])} | {h['scored'] or 0} / {h['n'] or 0} | {res} |")
    eb = dv.get("ExpectedBehaviour") or {}
    w(f"| ExpectedBehaviour (refuse / abstain / clarify / conflict items) | — | {f3(eb.get('mean'))} | "
      f"{eb.get('scored', 0)} / {eb.get('n', 0)} | no bar set |")
    w("\nRAG metrics run on answerable dev items with anchors (`answer`, `answer_note`). DeepEval threshold 0.5 per item. "
      "Unscored = the judge call failed twice or hit the time budget; it is excluded, never counted as 0 or 1.\n")

    w("## 2. Per language\n")
    w("| Language | Items | " + " | ".join(RAG) + " | ExpectedBehaviour |\n|---|---:|" + "---:|" * (len(RAG) + 1))
    for lg, d in by_lang.items():
        w(f"| {lg} | {d['_n'][0]} | " + " | ".join(f"{f3(d[m][0])} (n={d[m][1]})" for m in RAG + ["ExpectedBehaviour"]) + " |")
    w("\n## 3. Per variant\n")
    w("| Variant | Items | " + " | ".join(RAG) + " | ExpectedBehaviour |\n|---|---:|" + "---:|" * (len(RAG) + 1))
    for vr, d in by_var.items():
        w(f"| {vr} | {d['_n'][0]} | " + " | ".join(f"{f3(d[m][0])} (n={d[m][1]})" for m in RAG + ["ExpectedBehaviour"]) + " |")

    w("\n## 4. Abstain / refuse / clarify correctness (behaviour items)\n")
    w("Judge = DeepEval GEval `ExpectedBehaviour` (rubric in provenance.json). Deterministic = refuse/abstain: the agent "
      "declined (abstained or a guard template fired); clarify: the answer contains a question mark.\n")
    w("| Expected | Items | Judge scored | Judge mean | Judge pass @0.5 | Deterministic rate |\n|---|---:|---:|---:|---:|---:|")
    for b, d in beh.items():
        w(f"| {b} | {d['n']} | {d['judge_scored']} | {f3(d['judge_mean'])} | {f3(d['judge_pass@0.5'])} | {f3(d['deterministic_rate'])} |")
    paths = Counter(p.get("path") or "llm" for p in per)
    w(f"\nGenerator paths: {dict(paths)} (`boundary:*` = the agent's deterministic guard template, `fallback_template` = "
      "flagged twice by the agent's answer/citation guards, so the policy_abstain template was used).\n")

    w("## 5. Retrieval and citations (no LLM)\n")
    w("| Check | n | rate |\n|---|---:|---:|")
    for k, name in (("gold_chunk_in_top5", "anchored chunk in final top 5"), ("gold_doc_in_top5", "gold document in final top 5"),
                    ("cited_gold_chunk", "answer cited an anchored chunk"), ("cited_gold_doc", "answer cited a gold document")):
        d = det.get(k) or {}
        w(f"| {name} | {d.get('n', 0)} | {f3(d.get('rate'))} |")
    sa = (irs.get("scope_answerable") or {})
    if sa:
        w("\n| IR metric (answerable) | mean |\n|---|---:|")
        for k in ("chunk_recall@5", "chunk_mrr@5", "chunk_ndcg@5", "doc_recall@5", "doc_mrr@5", "doc_ndcg@5"):
            w(f"| {k} | {f3((sa.get(k) or {}).get('mean'))} |")

    w("\n## 6. Failures by category\n")
    w(f"{summ.get('questions_with_failure', 0)} of {summ.get('questions', 0)} dev items carry at least one failure tag.\n")
    w("| Failure tag | Items | Meaning |\n|---|---:|---|")
    for t, c in tax.most_common():
        w(f"| {t} | {c} | {TAX_DESC.get(t, '')} |")
    w("\nGolden categories with the most failing items: " +
      ", ".join(f"{c} ({n})" for c, n in cat_fail.most_common(12)) + ".\n")

    w("## 7. Ten worst items\n")
    w("Ranked by the mean of the scored RAG metrics (ExpectedBehaviour for behaviour items). Reason = the judge's reason "
      "on that item's lowest metric, shortened.\n")
    w("| # | Item | Lang / variant / expected | Mean | Lowest metric | Failure tags | Judge reason |\n|---:|---|---|---:|---|---|---|")
    for i, (avg, p, low, lv, reason) in enumerate(worst, 1):
        r = " ".join(str(reason).split())[:220].replace("|", "/")
        w(f"| {i} | {p['qid']} ({p['category']}) | {p['language']} / {p.get('variant')} / {p['expected_behavior']} | {f3(avg)} | "
          f"{low} = {f3(lv)} | {', '.join(p['failures']) or '—'} | {r} |")

    w("\n## 8. Limitations (automated)\n")
    w("Built from this run's failures only; counts are dev items (an item can sit in more than one group). Example ids "
      "are golden-set ids (synthetic questions, no PII). The likely causes are my reading of the failing items, not a "
      "measured attribution.\n")
    w("| Group | Items | Examples | What counts | Likely cause |\n|---|---:|---|---|---|")
    for k, v in lim.items():
        w(f"| {k} | {v['count']} | {', '.join(v['examples']) or '—'} | {v['rule']} | {v['cause']} |")
    w("\n**What this eval does not cover:**\n")
    for c in meta.get("not_covered", []):
        w(f"- {c}")
    w("\n## 9. What ran (versions)\n")
    models = prov.get("models", {})
    w("| Item | Value |\n|---|---|")
    w(f"| Retrieval platform | Kaggle private script kernel `{meta.get('kernel', '')}` v{meta.get('kernel_version', '?')}, 2x Tesla T4 (15 GB each), dataset `{meta.get('dataset', '')}`; RAG only (embedding, indexing, retrieval, reranking), no LLM |")
    w(f"| Eval set | `{meta.get('golden_source', '')}` copied at {meta.get('golden_copied_at', '?')}; full file sha256 `{meta.get('golden_full_sha256', '')}` (matches MANIFEST.json); dev split only: {len(gold)} items, sha256 `{meta.get('golden_dev_sha256', '')}`; held-out items never shipped to Kaggle |")
    w(f"| Corpus | `saral_nbfc_policy` + `rbi_regulatory` cleaned chunks (G1, corpus branch); chunk-file sha256 {json.dumps({k: v.get('chunks_sha256', '')[:16] for k, v in prov.get('corpus', {}).items() if isinstance(v, dict)})}; corpus manifest sha256 `{(prov.get('corpus') or {}).get('manifest_sha256', '')}` |")
    w(f"| Retrieval | {rinfo.get('embed_model', '?')} ({rinfo.get('embed_dtype', '?')}) dense in embedded Qdrant per collection + BM25 + weighted RRF {json.dumps(rinfo.get('fusion', {}))} + bge-reranker-v2-m3 ({rinfo.get('reranker_dtype', '?')}); both collections searched, union cut to top 5 by reranker score; `RetrievalFilter(mode=current)` |")
    w(f"| Generator | `{gen_model}` via OmniRoute ({ginfo.get('base_url', '')}), temperature 0, JSON mode, ≤4 concurrent; fallback `{', '.join(ginfo.get('fallback_models', [])) or 'none'}` (used on {len(ginfo.get('items_using_fallback', []))} items); prompt: {ginfo.get('prompt', '?')} |")
    w(f"| Judge | `{judge_model}` via OmniRoute, temperature 0, JSON mode, ≤4 concurrent; fallback `{', '.join(jinfo.get('fallback_models', [])) or 'none'}` (used on {len(jinfo.get('jobs_using_fallback', []))} metric calls); DeepEval {jinfo.get('deepeval') or prov.get('deepeval', '?')}; {jobs} metric jobs, {jinfo.get('errors', 0)} errors, {jinfo.get('skipped_deadline', 0)} skipped |")
    for role in ("embedder", "reranker"):
        if role in models:
            w(f"| HF revision ({role}) | `{models[role].get('id')}` @ `{models[role].get('hf_revision_sha')}` |")
    ph = status.get("phases", {})
    if ph:
        w(f"| Phase times (s) | {json.dumps(ph)} |")

    w("\n## 10. Caveats\n")
    for c in meta.get("caveats", []):
        w(f"- {c}")
    w("")
    compact = {"label": label, "headline": head, "by_language": by_lang, "by_variant": by_var, "behaviour": beh,
               "failure_tags": dict(tax), "limitations": {k: {x: v[x] for x in ("count", "examples", "rule", "cause")}
                                                     for k, v in lim.items()}, "judge_model": judge_model, "generator_model": gen_model,
               "golden_dev_sha256": meta.get("golden_dev_sha256"), "golden_full_sha256": meta.get("golden_full_sha256")}
    return "\n".join(L), compact, per


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--golden", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--meta", default=None)
    ap.add_argument("--compact-dir", default=None)
    a = ap.parse_args(argv)
    meta = js(a.meta) if a.meta else {}
    md, compact, per = build(a.results, a.golden, meta)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(md, encoding="utf-8")
    if a.compact_dir:
        d = Path(a.compact_dir)
        d.mkdir(parents=True, exist_ok=True)
        (d / "baseline_summary.json").write_text(json.dumps(compact, indent=1, ensure_ascii=False), encoding="utf-8")
        keep = ("qid", "category", "language", "variant", "expected_behavior", "path", "abstain", "declined", "model_used",
                "fallback_used",
                "gold_chunk_in_top5", "cited_gold_chunk", "scores", "failures")
        (d / "per_item_scores.jsonl").write_text("".join(json.dumps({k: p.get(k) for k in keep}, ensure_ascii=False) + "\n"
                                                         for p in per), encoding="utf-8")
        for f in ("summary.json", "ir_summary.json", "provenance.json", "status.json", "judge_info.json",
                  "generation_info.json", "retrieval_info.json"):
            src = Path(a.results) / f
            if src.exists():
                shutil.copy(src, d / f)
        if a.meta:
            shutil.copy(a.meta, d / "run_meta.json")
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
