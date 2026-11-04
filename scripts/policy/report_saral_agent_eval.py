"""Agent eval report (Golden B v1 dev split) from eval_saral_agent.py results.

    python scripts/policy/report_saral_agent_eval.py --results <run dir> --meta <meta json> \
        --out docs/saral/AGENT_EVAL.md --compact-dir docs/saral/agent_eval_v1

Every number is read from agent_summary.json / agent_turns.jsonl; the meta file carries only the run description,
the held-out note and the hand-written cause for each failure group.
"""
import argparse
import json
import shutil
from pathlib import Path


def f3(x):
    return "—" if x is None else f"{x:.3f}"


def cell(pair):
    return "—" if not pair or pair[0] is None else f"{pair[0]:.3f} (n={pair[1]})"


def build(R, meta):
    s = json.loads((R / "agent_summary.json").read_text())
    o, b, p = s["overall"], s["bars"], s["pass"]
    L = []
    w = L.append
    w("# Saral agent eval: Golden B v1 dev split\n")
    w(f"Date: {meta['date']}. Branch `feat/saral-deepeval-baseline` (PR #55). **Label: {meta['label']}.**\n")
    w(meta["intro"] + "\n")
    w("## 1. Headline against the bars\n")
    w("| Metric | Bar | Result | Pass |")
    w("|---|---:|---:|---|")
    w(f"| Turns whose shown answer matches a leak pattern (global + per-turn) | 0 | {o['leak_turns']}/{o['turns']} | {'PASS' if p['leaks'] else 'FAIL'} |")
    w(f"| RoleAdherence (DeepEval, per conversation) | ≥{b['RoleAdherence']:.2f} | {cell(o['RoleAdherence'])} | {'PASS' if p['RoleAdherence'] else 'FAIL'} |")
    w(f"| Tool correctness, exact ordered tool list per turn (Golden B spec) | ≥{b['ToolCorrectness']:.2f} | {cell(o['tool_exact_rate'])} | {'PASS' if p['ToolCorrectness'] else 'FAIL'} |")
    w(f"| Tool correctness, DeepEval ToolCorrectnessMetric (ordered; extra calls not penalised) | ≥{b['ToolCorrectness']:.2f} | {cell(o['ToolCorrectness'])} | {'PASS' if p['ToolCorrectness_deepeval_lenient'] else 'FAIL'} |")
    w(f"| borrower_safe_disclosure (ConversationalGEval, judged leak check) | no bar | {cell(o['borrower_safe_disclosure'])} | — |")
    w(f"| ExpectedBehaviour per turn (GEval, mean / pass@0.5) | no bar | {cell(o['ExpectedBehaviour'])} / {cell(o['ExpectedBehaviour_pass@0.5'])} | — |")
    w("")
    for title, key in (("2. Per language", "by_language"), ("3. Per variant (language-script)", "by_variant"),
                       ("4. Per recorded decision", "by_decision")):
        w(f"## {title}\n")
        w("| Group | Convs | Turns | Leak turns | RoleAdherence | Tool exact | Tool (DeepEval) | Safe disclosure | ExpectedBehaviour |")
        w("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
        for g, v in s[key].items():
            w(f"| {g} | {v['conversations']} | {v['turns']} | {v['leak_turns']} | {cell(v['RoleAdherence'])} | {cell(v['tool_exact_rate'])} | "
              f"{cell(v['ToolCorrectness'])} | {cell(v['borrower_safe_disclosure'])} | {cell(v['ExpectedBehaviour'])} |")
        w("")
    w("## 5. Behaviour items (per probe type)\n")
    w("| Probe | Turns | Leak turns | ExpectedBehaviour mean | Pass @0.5 | Tool (DeepEval) |")
    w("|---|---:|---:|---:|---:|---:|")
    for k, v in s["by_probe"].items():
        w(f"| {k} | {v['turns']} | {v['leak_turns']} | {cell(v['ExpectedBehaviour'])} | {cell(v['pass@0.5'])} | {cell(v['ToolCorrectness'])} |")
    w("")
    w("## 6. Leaks (every regex hit on a shown answer)\n")
    w("| Conversation-turn | Probe | Matched | Assessment |")
    w("|---|---|---|---|")
    for x in s["leaks"]:
        key = f"{x['conv_id']}-{x['turn']}"
        m = sorted({h["match"] for h in x["hits"]})
        w(f"| {key} | {x['probe']} | {', '.join(m)} | {meta.get('leak_notes', {}).get(key, '')} |")
    w("")
    w(f"Judged (borrower_safe_disclosure < 0.5): {len(s['disclosure_low'])} conversations "
      f"{', '.join(r['conv_id'] for r in s['disclosure_low'][:15])}.\n")
    w("## 7. Tool-call mismatches (exact ordered list)\n")
    w("| Expected -> called | Turns | Examples |")
    w("|---|---:|---|")
    for k, v in s["tool_mismatches"].items():
        w(f"| {k} | {len(v)} | {', '.join(v[:4])} |")
    w("")
    w("## 8. Lowest RoleAdherence and failed behaviour turns\n")
    for r in s["role_low"][:8]:
        w(f"- RoleAdherence {r['conv_id']} {f3(r['score'])}: {(r['reason'] or '')[:300]}")
    w("")
    for r in s["behaviour_fail"][:12]:
        w(f"- ExpectedBehaviour {r['conv_id']}-{r['turn']} ({r['probe']}) {f3(r['score'])}: {(r['reason'] or '')[:260]}")
    w("")
    w("## 9. Limitations (from the actual failures)\n")
    w("| Group | Count | Examples | Likely cause | Cheapest next fix |")
    w("|---|---:|---|---|---|")
    for g in meta.get("limitations", []):
        w(f"| {g['group']} | {g['count']} | {g['examples']} | {g['cause']} | {g['fix']} |")
    w("")
    w("What this eval does not cover:\n")
    for c in meta.get("not_covered", []):
        w(f"- {c}")
    w("")
    w("## 10. What ran\n")
    run = s["run"]
    w("| Item | Value |")
    w("|---|---|")
    for k, v in meta.get("ran", {}).items():
        w(f"| {k} | {v} |")
    w(f"| Turns | {run['turns']} ({run['turn_errors']} harness errors); actions {run['actions']} |")
    w(f"| Classifier deadline | {run['turns_with_llm_error']} turns where the LLM intent classifier passed its 6 s budget and the deterministic rules decided (production behaviour) |")
    w(f"| Generator fallback | gpt-5.6-terra used on {run['generator_fallback_calls']} LLM calls {[ (x.get('conv_id'), x.get('turn'), x.get('tag')) for x in run['generator_fallback_log']]} |")
    w(f"| Judge | codex/gpt-6-luna; {run['judge_errors']} errors; fallback used on {len(run['judge_fallback_jobs'])} jobs {run['judge_fallback_jobs']} |")
    w("")
    w("## 11. Held-out\n")
    w(meta["heldout_note"] + "\n")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--meta", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--compact-dir")
    a = ap.parse_args()
    R = Path(a.results)
    meta = json.loads(Path(a.meta).read_text())
    Path(a.out).write_text(build(R, meta), encoding="utf-8")
    if a.compact_dir:
        d = Path(a.compact_dir)
        d.mkdir(parents=True, exist_ok=True)
        for f in ("agent_summary.json", "agent_turns.jsonl", "agent_scores.jsonl", "agent_deterministic.jsonl",
                  "agent_fallback_log.jsonl"):
            if (R / f).exists():
                shutil.copy(R / f, d / f)
        shutil.copy(a.meta, d / "run_meta.json")
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
