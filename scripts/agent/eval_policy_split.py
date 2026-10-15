"""Policy-answer citation evaluation on ONE split of bajaj_v1 (dev for tuning, test for the final report).

Two steps, so the citation methods are compared on identical retrieval:

  1) retrieve: run the production retriever (hybrid + rerank, lender-profile filters) once per question and cache
     the top-5 passages.
        AGENT_RETRIEVER_DEVICE=cpu LOAN_POLICY_DIR=... AGENT_QDRANT_DIR=<a copy> PYTHONPATH=.:apps/api/src \
            python scripts/agent/eval_policy_split.py retrieve --out runs/retrieval.json
  2) run: answer every question of --split through the advisory graph (policy path) with AGENT_CITATION_MODE=--mode,
     score it with the same metrics as eval_agent.py set B, and keep the raw compose output so the deterministic
     post-hoc verification can be re-scored offline (score subcommand) without new LLM calls.
        python scripts/agent/eval_policy_split.py run --split dev --mode labels --cache runs/retrieval.json --out runs/dev_labels
  3) score: re-apply verify_citations to a run's raw outputs with other thresholds (dev only), no LLM.

Metrics (identical to eval_agent.py):
  citation_support        answered and at least one cited chunk is from a gold doc AND contains a gold anchor
  strict_citation_correct citation_support AND every cited chunk is from a gold doc
The judge (correct / citation_supported) is the same gpt-oss-120b: indicative only.
"""
import argparse
import json
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / "apps/api/src")]

from loan_advisory.agent import guards as G  # noqa: E402
from loan_advisory.agent.contracts import AgentRequest, Session  # noqa: E402
from loan_advisory.agent.graph import TEMPORAL, AdvisoryAgent  # noqa: E402
from loan_advisory.agent.llm import ChatLLM, LLMError, parse_json  # noqa: E402

try:  # feat/agent-upgrades; the script also runs unchanged against the pre-upgrade tree (--mode base) for a fair "before"
    from loan_advisory.agent.citations import verify_citations  # noqa: E402
    from loan_advisory.agent.settings import AgentSettings  # noqa: E402
except ImportError:
    verify_citations = AgentSettings = None

BENCH = ROOT / "data/evaluation/rag/bajaj_v1/benchmark.jsonl"
PROFILES = ("bajaj_finance", "generic_bank", "generic_nbfc")
JUDGE_POLICY = """Reference facts (verbatim policy text and/or a reference answer):
{ref}
Question: {q}
Response: {a}
Does the response answer the question correctly and consistently with the reference facts? Return JSON only: {{"correct": true|false}}"""
JUDGE_SUPPORT = """Cited passages:
{passages}
Answer: {a}
Is every factual claim in the answer supported by the cited passages (not outside knowledge)? Return JSON only: {{"supported": true|false}}"""


def bench(split, path=None):
    rows = [json.loads(l) for l in Path(path or BENCH).open() if l.strip()]
    return [q for q in rows if split == "all" or q["split"] == split]


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip().lower()


def m(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(bool(x) for x in xs) / len(xs), 4) if xs else None


# ------------------------------------------------------------------ 1) retrieval cache
def cmd_retrieve(a):
    from loan_advisory.agent.runtime import load_policy_tools
    from loan_advisory.agent.tools import PolicyTools
    from rag.retrieve import load_profile, profile_filter
    t = time.time()
    base, _ = load_policy_tools()
    print(f"retriever loaded {time.time() - t:.1f}s", flush=True)
    tools = {}
    for name in PROFILES:
        pr = load_profile(name)
        tools[name] = (PolicyTools(base.retriever, base.by_id, pr, profile_filter(pr, "current"), hfilter=profile_filter(pr, "historical")), pr)
    out = {"profiles": {k: v[1] for k, v in tools.items()}, "questions": {}}
    qs = bench("all", a.bench)
    for i, q in enumerate(qs):
        pt, _ = tools.get(q["profile"], tools["bajaj_finance"])
        ps, meta = pt.search(q["question"], historical=bool(TEMPORAL.search(q["question"])))
        out["questions"][q["qid"]] = {"passages": ps, "meta": meta}
        if i % 10 == 0:
            print(i, len(qs), meta.get("latency_ms"), flush=True)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    json.dump(out, open(a.out, "w"), ensure_ascii=False, default=str)
    print("wrote", a.out, flush=True)


# ------------------------------------------------------------------ 2) run
class CachedPolicy:
    def __init__(self, by_question):
        self.by_question = by_question

    def search(self, q, historical=False):
        hit = self.by_question[q]
        return hit["passages"], hit["meta"]


class CapturingLLM(ChatLLM):
    """Keeps the raw text of the last compose_policy call per thread (for offline re-scoring)."""

    def chat(self, system, user, max_tokens=900, temperature=0.0, tag="", **kw):
        out = super().chat(system, user, max_tokens=max_tokens, temperature=temperature, tag=tag, **kw)
        if tag == "compose_policy":
            self._local.raw = out
        return out


def score_row(q, cited_labels, passages, abstained):
    by = {p["label"]: p for p in passages}
    cited = [by[c] for c in cited_labels if c in by]
    rel = [p["chunk_id"] for p in cited if q["gold_docs"] and p["citation"]["document_id"] in q["gold_docs"]
           and any(norm(x) in norm(p["text"]) for x in q["gold_anchors"])]
    gold_doc = [p["chunk_id"] for p in cited if p["citation"]["document_id"] in q["gold_docs"]]
    support = (not abstained) and bool(rel)
    strict = support and len(gold_doc) == len(cited)
    return {"cited": [p["chunk_id"] for p in cited], "cited_relevant": rel, "cited_gold_doc": gold_doc,
            "citation_support": support, "strict": strict}


def summarise(rows):
    ans = [r for r in rows if not r["expect_abstain"]]
    una = [r for r in rows if r["expect_abstain"]]
    answered = [r for r in ans if not r["abstained"]]
    return {"n": len(rows), "answerable": len(ans), "unanswerable": len(una),
            "answered_rate": m([not r["abstained"] for r in ans]),
            "answer_correct": m([bool(r.get("correct")) and not r["abstained"] for r in ans]) if any("correct" in r for r in ans) else None,
            "citation_support": m([r["citation_support"] for r in ans]),
            "strict_citation_correct": m([r["strict"] for r in ans]),
            "mean_citations_per_answer": round(sum(len(r["cited"]) for r in answered) / max(1, len(answered)), 2),
            "citation_faithful_given_answered": m([r.get("citation_supported") for r in answered if r["cited"]]),
            "unanswerable_abstained_or_refused": f"{sum(r['abstained'] or r['action'] == 'refuse' for r in una)}/{len(una)}",
            "guard_language_flags": sum(bool(r["answer_flags"]) for r in rows),
            "fallback_template": sum("fallback_template" in r["guard_flags"] for r in rows),
            "errors": sum(1 for r in rows if r.get("error"))}


def cmd_run(a):
    cache = json.load(open(a.cache))
    qs = bench(a.split, a.bench)
    if a.limit:
        qs = qs[: a.limit]
    by_question = {q["question"]: cache["questions"][q["qid"]] for q in qs}
    llm, judge = CapturingLLM(), ChatLLM()
    st = {} if AgentSettings is None else {"settings": AgentSettings(citation_mode=a.mode, text_deadline_s=600, voice_deadline_s=600,
                                                                    classify_budget_s=120, fast_classify="off")}
    from loan_advisory.agent.runtime import build_offline_agent
    base, _, _ = build_offline_agent(llm=llm)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    agents = {name: AdvisoryAgent(base.tools, llm, policy_tools=CachedPolicy(by_question), handoff=base.handoff,
                                  profile=cache["profiles"][name], audit_path=out / "turns.jsonl", **st) for name in PROFILES}
    base.handoff.path = out / "handoffs.jsonl"

    def jj(prompt, tag):
        try:
            return judge.chat_json("You are a strict evaluator. Output JSON only.", prompt, max_tokens=500, tag=tag)
        except LLMError:
            return {}

    def job(q):
        try:
            llm._local.raw = None
            req = AgentRequest(request_id=q["qid"], conversation_id=f"pol-{q['qid']}-{time.time()}", message=q["question"],
                               application_ref="APP-TEST-005", literacy="medium", locale="en")
            t0 = time.perf_counter()
            r = agents.get(q["profile"], agents["bajaj_finance"]).run(req, Session(applicant_ref="CUS-TEST-005"))
            ms = (time.perf_counter() - t0) * 1000
            passages = by_question[q["question"]]["passages"]
            labels = [c.label for c in r.citations]
            row = {"qid": q["qid"], "category": q["category"], "profile": q["profile"], "expect_abstain": q["expect_abstain"],
                   "intent": r.intent, "action": r.action, "abstained": r.abstained, "answer": r.answer, "labels": labels,
                   "raw_compose": getattr(llm._local, "raw", None), "answer_flags": G.answer_flags(r.answer),
                   "guard_flags": r.guard_flags, "ms": round(ms, 1), **score_row(q, labels, passages, r.abstained)}
            if a.judge and not q["expect_abstain"] and not r.abstained:
                ref = "\n".join(f"- {x}" for x in q["gold_anchors"]) + (f"\n- Reference answer: {q['answer']}" if q.get("answer") else "")
                row["correct"] = jj(JUDGE_POLICY.format(ref=ref, q=q["question"], a=r.answer), "judge_policy").get("correct")
                by = {p["label"]: p for p in passages}
                if labels:
                    ps = "\n\n".join(by[c]["text"][:1800] for c in labels if c in by)
                    row["citation_supported"] = jj(JUDGE_SUPPORT.format(passages=ps, a=r.answer), "judge_support").get("supported")
            return row
        except Exception as e:
            return {"qid": q["qid"], "expect_abstain": q["expect_abstain"], "abstained": True, "action": "error", "answer": "",
                    "labels": [], "cited": [], "cited_relevant": [], "cited_gold_doc": [], "citation_support": False, "strict": False,
                    "answer_flags": [], "guard_flags": [], "error": f"{type(e).__name__}: {e}"[:300]}

    t = time.time()
    with ThreadPoolExecutor(a.workers) as ex:
        rows = list(ex.map(job, qs))
    wall = time.time() - t
    with (out / "rows.jsonl").open("w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    rep = {"split": a.split, "mode": a.mode, "wall_s": round(wall, 1), **summarise(rows),
           "latency_ms_p50": sorted(r.get("ms", 0) for r in rows)[len(rows) // 2]}
    json.dump(rep, open(out / "report.json", "w"), indent=1)
    print(json.dumps(rep, indent=1), flush=True)


# ------------------------------------------------------------------ 3) offline re-score (dev tuning, no LLM)
def cmd_score(a):
    import loan_advisory.agent.citations as C
    cache = json.load(open(a.cache))
    qs = {q["qid"]: q for q in bench("all")}
    rows = [json.loads(l) for l in open(Path(a.run) / "rows.jsonl")]
    if a.min_support is not None:
        C.MIN_SUPPORT = a.min_support
    if a.rel_support is not None:
        C.REL_SUPPORT = a.rel_support
    out = []
    for r in rows:
        q, passages = qs[r["qid"]], cache["questions"][r["qid"]]["passages"]
        if r["abstained"] or not r.get("raw_compose"):
            out.append(r)
            continue
        try:
            j = parse_json(r["raw_compose"])
        except LLMError:
            out.append(r)
            continue
        labels = r["labels"] if a.mode == "asis" else verify_citations(r["answer"], j, passages, a.mode)[0]
        out.append({**r, **score_row(q, labels, passages, r["abstained"])})
    rep = summarise(out)
    rep.update(mode=a.mode, min_support=C.MIN_SUPPORT, rel_support=C.REL_SUPPORT)
    print(json.dumps({k: rep[k] for k in ("mode", "min_support", "rel_support", "citation_support", "strict_citation_correct",
                                          "mean_citations_per_answer")}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("retrieve")
    r.add_argument("--out", required=True)
    r.add_argument("--bench", default=None, help="benchmark jsonl (default bajaj_v1); e.g. abstain_v2.jsonl")
    r2 = sub.add_parser("run")
    r2.add_argument("--split", choices=("dev", "test", "abstain_v2", "all"), required=True)
    r2.add_argument("--bench", default=None)
    r2.add_argument("--mode", default="labels")
    r2.add_argument("--cache", required=True)
    r2.add_argument("--out", required=True)
    r2.add_argument("--workers", type=int, default=32)
    r2.add_argument("--limit", type=int, default=0)
    r2.add_argument("--judge", action="store_true")
    r3 = sub.add_parser("score")
    r3.add_argument("--run", required=True)
    r3.add_argument("--cache", required=True)
    r3.add_argument("--mode", default="verify")
    r3.add_argument("--min-support", type=float)
    r3.add_argument("--rel-support", type=float)
    a = ap.parse_args()
    {"retrieve": cmd_retrieve, "run": cmd_run, "score": cmd_score}[a.cmd](a)


if __name__ == "__main__":
    main()
