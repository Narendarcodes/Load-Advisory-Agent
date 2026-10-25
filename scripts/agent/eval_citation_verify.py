"""Offline A/B of post-hoc citation VERIFIERS on saved policy-answer runs (no re-composition).

The answer and the model's own citation labels are fixed (taken from a saved `eval_policy_split.py run` rows.jsonl);
only the verification step is re-run, against the identical cached top-5 passages. So each verifier variant is compared
on exactly the same answers, which removes compose noise from the comparison. Tune on DEV only; run TEST once.

    PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_verify.py \
        --run runs/dev_labels --cache runs/retrieval.json --variants v1,quote --repeat 2 --out runs/verify_dev.json

Every LLM variant yields several post-processing policies from the same output (prune = keep only answer-cited labels
the verifier confirms; replace = use the verifier's confirmed labels even if the answer did not cite them). Metrics are
the same as eval_agent.py set B (citation_support / strict_citation_correct over answerable questions).
"""
import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / "apps/api/src"), str(ROOT / "scripts/agent")]

from eval_policy_split import bench, score_row, summarise  # noqa: E402
from loan_advisory.agent import prompts as P  # noqa: E402
from loan_advisory.agent.citations import select_verified  # noqa: E402
from loan_advisory.agent.llm import ChatLLM, LLMError  # noqa: E402


def passages_block(passages, limit):
    return "\n\n".join(f"[{p['label']}] {p['citation']['title']} — {p['citation'].get('section') or ''}\n{p['text'][:limit]}"
                       for p in passages)


VARIANTS = {
    # name: (prompt, passage char limit, output kind)
    "v1": (P.VERIFY_CITATIONS, 1500, "labels"),            # PR #8 llm_verify
    "quote": (P.VERIFY_CITATIONS_QUOTE, 2400, "quotes"),     # verbatim quote per supporting passage, checked in code
}


def run_variant(name, rows, cache, qs, llm, workers):
    prompt, limit, kind = VARIANTS[name]

    def one(r):
        q, passages = qs[r["qid"]], cache[r["qid"]]["passages"]
        if r["abstained"] or q["expect_abstain"]:
            return r, None
        try:
            j = llm.chat_json("You are a precise source checker. Output JSON only.",
                              prompt.format(question=q["question"], answer=r["answer"], passages=passages_block(passages, limit)),
                              max_tokens=700, tag="verify_citations")
        except LLMError:
            j = {}
        return r, j

    with ThreadPoolExecutor(workers) as ex:
        outs = list(ex.map(one, rows))
    res = {}
    for policy in ("prune", "replace"):
        scored = []
        for r, j in outs:
            if j is None:
                scored.append(r)
                continue
            q, passages = qs[r["qid"]], cache[r["qid"]]["passages"]
            labels = select_verified(j, r["labels"], passages, kind=kind, policy=policy)
            scored.append({**r, **score_row(q, labels, passages, r["abstained"])})
        s = summarise(scored)
        res[f"{name}/{policy}"] = {k: s[k] for k in ("citation_support", "strict_citation_correct", "mean_citations_per_answer")}
    return res, outs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--cache", required=True)
    ap.add_argument("--variants", default="v1,quote")
    ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--workers", type=int, default=24)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    cache = json.load(open(a.cache, encoding="utf-8"))["questions"]
    qs = {q["qid"]: q for q in bench("all")}
    rows = [json.loads(l) for l in open(Path(a.run) / "rows.jsonl", encoding="utf-8")]
    asis = summarise(rows)
    report = {"run": a.run, "asis": {k: asis[k] for k in ("citation_support", "strict_citation_correct", "mean_citations_per_answer")},
              "samples": []}
    raw = []
    llm = ChatLLM()
    for i in range(a.repeat):
        sample = {}
        for v in a.variants.split(","):
            res, outs = run_variant(v, rows, cache, qs, llm, a.workers)
            sample.update(res)
            raw += [{"sample": i, "variant": v, "qid": r["qid"], "verifier": j} for r, j in outs if j is not None]
            print(i, json.dumps(res), flush=True)
        report["samples"].append(sample)
    Path(a.out).write_text(json.dumps(report, indent=1), encoding="utf-8")
    Path(a.out).with_suffix(".raw.jsonl").write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in raw),
                                                     encoding="utf-8")
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
