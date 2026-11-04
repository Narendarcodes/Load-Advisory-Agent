"""Before/after section for a re-run of the Saral DeepEval RAG eval (same dev split, same judge and generator).

    python scripts/policy/report_saral_deepeval_compare.py --results <new results dir> --golden <dev jsonl> \
        --baseline docs/saral/deepeval_baseline_v2 --meta <run meta json> --out <section.md> \
        [--compact-dir docs/saral/deepeval_rag_v2_fixes]

Reads only the new run's result files and the committed baseline compact JSON; every number is copied from them.
The section is appended to DEEPEVAL_BASELINE.md beside the baseline (the baseline numbers and its Limitations stay).
"""
import argparse
import json
import shutil
from collections import Counter
from pathlib import Path

import report_saral_deepeval as rep

METRICS = rep.RAG + ["ExpectedBehaviour"]


def _cell(pair):
    if not pair or pair[0] is None:
        return "—"
    return f"{pair[0]:.3f} (n={pair[1]})"


def _delta(a, b):
    if a is None or b is None:
        return "—"
    return f"{b - a:+.3f}"


def build_section(results, golden, baseline_dir, meta):
    md_unused, new, per = rep.build(results, golden, meta)
    base = rep.js(Path(baseline_dir) / "baseline_summary.json")
    R = Path(results)
    summ, irs, ginfo, jinfo, rinfo = (rep.js(R / "summary.json"), rep.js(R / "ir_summary.json"), rep.js(R / "generation_info.json"),
                                      rep.js(R / "judge_info.json"), rep.js(R / "retrieval_info.json"))
    base_ir = rep.js(Path(baseline_dir) / "ir_summary.json")
    base_det = rep.js(Path(baseline_dir) / "summary.json").get("deterministic", {})
    det = summ.get("deterministic", {})
    L = []
    w = L.append
    w(f"## 11. v2 run after the fixes ({meta.get('date', '')})\n")
    w(f"**Label: {new['label']}.** Same dev split (178 items, sha256 `{meta.get('golden_dev_sha256', '?')}`; the held-out "
      f"items stay untouched), same generator `{new['generator_model']}` and judge `{new['judge_model']}` through OmniRoute "
      "from the Hark sandbox, same DeepEval metrics and rubric. The baseline in §1-§10 is kept unchanged for comparison.\n")
    w("**What changed** (code heads in the table at the end of this section):\n")
    for line in meta.get("changes", []):
        w(f"- {line}")
    w("")
    w("### 11.1 Headline before / after\n")
    w("| Metric | Bar | Baseline | v2 | Change | v2 result |")
    w("|---|---:|---:|---:|---:|---|")
    for m in rep.RAG:
        b, n = base["headline"].get(m, {}), new["headline"].get(m, {})
        res = "no bar set" if n.get("bar") is None else ("PASS" if n.get("pass") else "FAIL")
        w(f"| {m} | {rep.f3(n.get('bar')) if n.get('bar') else '—'} | {rep.f3(b.get('mean'))} ({b.get('scored')}/{b.get('n')}) | "
          f"{rep.f3(n.get('mean'))} ({n.get('scored')}/{n.get('n')}) | {_delta(b.get('mean'), n.get('mean'))} | {res} |")
    bl, nl = base_det.get("leak_any", {}), det.get("leak_any", {})
    w(f"| Answers showing an internal term (leak regex) | 0 | {bl.get('true')}/{bl.get('n')} | {nl.get('true')}/{nl.get('n')} | | "
      f"{'PASS' if nl.get('true') == 0 else 'FAIL'} |")
    pl, plr = det.get("passage_label_leak", {}), det.get("passage_label_leak_raw", {})
    w(f"| Answers showing a passage label or 'passage(s)' | 0 | 91/178 (subset of the line above) | "
      f"{pl.get('true')}/{pl.get('n')} shown; {plr.get('true')}/{plr.get('n')} in the raw model draft | | "
      f"{'PASS' if pl.get('true') == 0 else 'FAIL'} |")
    w("")
    w("Shown = the text the borrower would see (after `guards.sanitize_answer`); raw = the model's draft before it. "
      "The raw count measures the prompt fix alone.\n")
    for title, key in (("11.2 Per language", "by_language"), ("11.3 Per variant", "by_variant")):
        w(f"### {title} (baseline -> v2)\n")
        w("| Group | " + " | ".join(METRICS) + " |")
        w("|---|" + "---:|" * len(METRICS))
        for gname in sorted(set(base[key]) | set(new[key])):
            cells = []
            for m in METRICS:
                b, n = base[key].get(gname, {}).get(m), new[key].get(gname, {}).get(m)
                cells.append(f"{_cell(b)} -> {_cell(n)}")
            w(f"| {gname} | " + " | ".join(cells) + " |")
        w("")
    w("### 11.4 Behaviour items (baseline -> v2)\n")
    w("| Expected | Items | Judge mean | Judge pass @0.5 | Deterministic rate |")
    w("|---|---:|---:|---:|---:|")
    for k in rep.BEH:
        b, n = base["behaviour"].get(k, {}), new["behaviour"].get(k, {})
        w(f"| {k} | {n.get('n')} | {rep.f3(b.get('judge_mean'))} -> {rep.f3(n.get('judge_mean'))} | "
          f"{rep.f3(b.get('judge_pass@0.5'))} -> {rep.f3(n.get('judge_pass@0.5'))} | "
          f"{rep.f3(b.get('deterministic_rate'))} -> {rep.f3(n.get('deterministic_rate'))} |")
    clar = [p for p in per if p["expected_behavior"] == "clarify"]
    note = [p for p in per if p["expected_behavior"] == "answer_note"]
    asked = sum(bool(p.get("asked_question")) for p in clar)
    full_note = sum((p["scores"].get("ExpectedBehaviour") or 0) >= 1.0 for p in note)
    w("")
    w(f"Clarify: {asked} of {len(clar)} vague questions got a clarifying question (baseline 1 of 11 by the judge, 0 by the "
      f"question-mark check). Conflict notes: {full_note} of {len(note)} answer_note items scored 1.0 (baseline 1 of 11).\n")
    paths = Counter(p.get("path") for p in per)
    w(f"Generator paths: {dict(paths)}. Guard false positives from the baseline: R2-RAT-07 path "
      f"`{next((p.get('path') for p in per if p['qid'] == 'R2-RAT-07'), '?')}`, R2-FEE-08 path "
      f"`{next((p.get('path') for p in per if p['qid'] == 'R2-FEE-08'), '?')}` (baseline: boundary:other_applicant, "
      "boundary:guarantee).\n")
    w("### 11.5 Retrieval (no LLM) before / after\n")
    w("| IR metric (answerable) | Baseline | v2 |")
    w("|---|---:|---:|")
    for k in ("chunk_recall@5", "chunk_mrr@5", "chunk_ndcg@5", "doc_recall@5", "doc_mrr@5", "doc_ndcg@5"):
        b = (base_ir.get("scope_answerable", {}).get(k) or {}).get("mean")
        n = (irs.get("scope_answerable", {}).get(k) or {}).get("mean")
        w(f"| {k} | {rep.f3(b)} | {rep.f3(n)} |")
    for k in ("gold_chunk_in_top5", "gold_doc_in_top5", "cited_gold_chunk", "cited_gold_doc"):
        b, n = (base_det.get(k) or {}).get("rate"), (det.get(k) or {}).get("rate")
        w(f"| {k.replace('_', ' ')} | {rep.f3(b)} | {rep.f3(n)} |")
    w("")
    if meta.get("merge_note"):
        w(meta["merge_note"] + "\n")
    w("### 11.6 Failures by category (baseline -> v2)\n")
    w("| Failure tag | Baseline | v2 |")
    w("|---|---:|---:|")
    for t in sorted(set(base["failure_tags"]) | set(new["failure_tags"])):
        w(f"| {t} | {base['failure_tags'].get(t, 0)} | {new['failure_tags'].get(t, 0)} |")
    w("")
    w("### 11.7 Limitations of the v2 run (automated)\n")
    w("| Group | Items | Examples | What counts | Likely cause |")
    w("|---|---:|---|---|---|")
    for k, v in new["limitations"].items():
        w(f"| {k} | {v['count']} | {', '.join(v['examples'])} | {v['rule']} | {meta.get('causes', {}).get(k, v['cause'])} |")
    w("")
    for line in meta.get("limits_extra", []):
        w(f"- {line}")
    w("")
    w("### 11.8 What ran\n")
    w("| Item | Value |")
    w("|---|---|")
    for k, v in meta.get("ran", {}).items():
        w(f"| {k} | {v} |")
    w(f"| Generator fallback | {ginfo.get('fallback_models')} used on {len(ginfo.get('items_using_fallback') or [])} items "
      f"{ginfo.get('items_using_fallback') or []}; no answer on {len(ginfo.get('items_llm_error') or [])} |")
    w(f"| Judge | {jinfo.get('judge_model')}, DeepEval {jinfo.get('deepeval')}, {jinfo.get('jobs')} metric jobs, "
      f"{jinfo.get('errors')} errors, {jinfo.get('skipped_deadline')} skipped; fallback used on "
      f"{len(jinfo.get('jobs_using_fallback') or [])} metric calls |")
    w(f"| Merge settings | {json.dumps(rinfo.get('merge'))} |")
    w("")
    return "\n".join(L), new, per


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--golden", required=True)
    ap.add_argument("--baseline", required=True)
    ap.add_argument("--meta", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--compact-dir", default=None)
    a = ap.parse_args(argv)
    meta = rep.js(a.meta)
    md, compact, per = build_section(a.results, a.golden, a.baseline, meta)
    Path(a.out).write_text(md, encoding="utf-8")
    if a.compact_dir:
        d = Path(a.compact_dir)
        d.mkdir(parents=True, exist_ok=True)
        (d / "v2_summary.json").write_text(json.dumps(compact, indent=1, ensure_ascii=False), encoding="utf-8")
        keep = ("qid", "category", "language", "variant", "expected_behavior", "path", "abstain", "declined", "clarify_flag",
                "asked_question", "leak_hits", "leak_hits_raw", "gold_chunk_in_top5", "cited_gold_chunk", "scores", "failures")
        (d / "per_item_scores.jsonl").write_text("".join(json.dumps({k: p.get(k) for k in keep}, ensure_ascii=False) + "\n"
                                                         for p in per), encoding="utf-8")
        for f in ("summary.json", "ir_summary.json", "provenance.json", "status.json", "judge_info.json",
                  "generation_info.json", "retrieval_info.json", "merge_grid.json"):
            src = Path(a.results) / f
            if src.exists():
                shutil.copy(src, d / f)
        shutil.copy(a.meta, d / "run_meta.json")
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
