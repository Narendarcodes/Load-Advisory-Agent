"""Saral AGENT dev eval (Golden B v1, dev split only: 49 conversations).

Two steps, each resumable:

  generate  Run every dev conversation turn by turn through the real LangGraph `AdvisoryAgent` of the code under
            test (--repo, e.g. the saral/integration worktree), in process. The application store holds a synthetic
            Loan Application built from the golden `applicant`; the evidence source holds ONE decision-evidence/1
            record built with the catalogue-v2 `build_record_v2` and pinned to the golden recorded decision and
            reason category (the agent eval tests how the agent explains a recorded decision; ZEN correctness is
            tested separately by the 200-applicant replay). Every tool call the graph makes is recorded per turn.
            Policy retrieval is BM25-only over the two G1 collections (routed exactly like the live agent), so the
            run needs no embedding model in memory. The LLM is reached through OmniRoute; on an LLM error the
            fallback model is tried and the call is logged.
  judge     Deterministic: leak patterns (global + per-turn) on every shown answer, ToolCorrectness (ordered tool
            names per turn, deepeval ToolCorrectnessMetric). LLM-judged (DeepEval, judge via OmniRoute):
            RoleAdherence per conversation, borrower_safe_disclosure ConversationalGEval per conversation, and an
            ExpectedBehaviour GEval per turn (must_include / must_not_include / expected_behaviour).
  summarise Aggregate by bar, language, scenario decision and probe type -> agent_summary.json.

Held-out conversations are refused: the script aborts if a held-out id is in the input.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import threading
import time
from pathlib import Path

DECISION_MAP = {"APPROVED": "ELIGIBILITY_CONDITIONS_MET", "DECLINED": "DECLINE", "MANUAL_REVIEW": "MANUAL_REVIEW",
                "INFO_REQUESTED": "MORE_INFORMATION_REQUIRED"}
LIFECYCLE = {"APPROVED": "APPROVED", "DECLINED": "REJECTED", "MANUAL_REVIEW": "MANUAL_REVIEW",
             "INFO_REQUESTED": "INFO_REQUESTED"}
CATEGORY_MAP = {"could_not_verify_details": "DETAILS_NOT_VERIFIED", "outside_offer": "REQUEST_OUTSIDE_OFFER",
                "employment_stability": "EMPLOYMENT_STABILITY", "credit_history": "CREDIT_HISTORY",
                "documents": "DOCUMENTS_INCOMPLETE_OR_UNCLEAR", "existing_repayments": "REPAYMENTS_TOO_HIGH",
                "recent_applications": "RECENT_CREDIT_APPLICATIONS",
                "income_verification": "INCOME_NOT_VERIFIED_OR_INSUFFICIENT"}


def jl(p):
    with open(p, encoding="utf-8") as f:
        return [json.loads(x) for x in f if x.strip()]


def load_dev(a):
    convs = jl(a.golden)
    held = set(json.load(open(a.manifest))["heldout_ids"]) if a.manifest else set()
    dev = [c for c in convs if c.get("split") == "dev"]
    bad = [c["conv_id"] for c in dev if c["conv_id"] in held]
    if bad:
        sys.exit(f"held-out ids in the dev input: {bad}")
    return dev


# ---------------------------------------------------------------------------------------------- generate
def build_agent_for(conv, llm, policy_tools, profile):
    from langgraph.checkpoint.memory import MemorySaver

    from decision_engine.catalogue_v2.engine import build_record_v2
    from loan_advisory.agent.graph import AdvisoryAgent
    from loan_advisory.agent.tools import DecisionTools, HandoffQueue, InMemoryEvidenceSource
    from loan_advisory.application.lifecycle import _active_policy
    from loan_advisory.infrastructure.evidence_store import InMemoryEvidenceSink
    from loan_advisory.infrastructure.frappe_adapter import ReadOnlyFetchStore

    ap, sd = conv["applicant"], conv["stored_decision"]
    ref, who = ap["application_ref"], ap["applicant_id"]
    doc = {"name": ref, "applicant": who, "applicant_name": ap.get("display_name"),
           "loan_product": "SYNTHETIC-PERSONAL-LOAN", "loan_amount": ap.get("requested_amount"),
           "repayment_periods": ap.get("requested_tenure_months"), "custom_monthly_income": ap.get("monthly_net_income"),
           "custom_monthly_obligations": ap.get("monthly_emis_existing"),
           "custom_credit_score": ap.get("credit_score_synthetic"),
           "custom_employment_months": ap.get("months_with_current_employer"),
           "custom_loan_purpose": ap.get("loan_purpose"), "custom_lifecycle_state": LIFECYCLE[sd["decision"]],
           "status": "Applied"}
    apps = {ref: doc}

    def get(app_id):
        from loan_advisory.application.lifecycle import UnknownApplication
        if app_id not in apps:
            raise UnknownApplication(app_id)
        return dict(apps[app_id])

    decision = DECISION_MAP[sd["decision"]]
    cat = CATEGORY_MAP.get(conv.get("expected_reason_category") or "")
    if sd["decision"] == "APPROVED" and cat:  # approved with a reason = counter-offer scenario
        decision = "COUNTER_OFFER" if "counter" in (conv.get("scenario") or "") else decision
    effect = {"DECLINE": "DECLINE", "MANUAL_REVIEW": "MANUAL_REVIEW",
              "MORE_INFORMATION_REQUIRED": "MORE_INFORMATION_REQUIRED"}.get(decision, "NONE")
    evals = [{"rule_id": h.get("catalogue_id") or h.get("rule_id"), "rule_name": h.get("name"), "result": "FAIL",
              "effect": effect} for h in sd.get("rule_hits") or []]
    offer = None
    if decision == "COUNTER_OFFER":  # offered amount from the scenario text; EMI at the 20% sizing rate (ADR-0011)
        m = re.search(r"offered Rs\.?\s*([\d.]+)\s*lakh", conv.get("scenario_text", ""), re.I)
        p, n, r = float(m.group(1)) * 1e5 if m else ap["requested_amount"] / 2, int(ap.get("requested_tenure_months") or 36), 0.20 / 12
        offer = {"amount": round(p), "emi": round(p * r * (1 + r) ** n / ((1 + r) ** n - 1)), "tenure_months": n,
                 "counter_offer": True, "request_outside_mvp_range": False}
    result = {"decision": decision, "rule_evaluations": evals, "reason_categories": [cat] if cat else [],
              "offer": offer, "zen_trace": {}}
    dp = {"requested_amount": ap.get("requested_amount"), "tenure_months": ap.get("requested_tenure_months"),
          "loan_purpose": ap.get("loan_purpose"), "monthly_net_income": ap.get("monthly_net_income"),
          "existing_monthly_obligations": ap.get("monthly_emis_existing"),
          "employment_months": ap.get("months_with_current_employer"), "bureau_score": ap.get("credit_score_synthetic")}
    rec = build_record_v2(result, _active_policy(), dp, application_ref=ref, applicant_ref=who,
                          lifecycle_state=LIFECYCLE[sd["decision"]],
                          missing_fields=["documents"] if sd["decision"] == "INFO_REQUESTED" else [])
    sink = InMemoryEvidenceSink()
    sink.persist(rec, native_status="Open", trace={}, expected_application=ref)
    tools = DecisionTools(ReadOnlyFetchStore(get), InMemoryEvidenceSource(sink))
    agent = AdvisoryAgent(tools, llm, policy_tools=policy_tools, handoff=HandoffQueue(path=os.devnull),
                          profile=profile, checkpointer=MemorySaver())
    return agent, tools, rec


class ToolLog:
    """Per-thread ordered list of tool names the graph called this turn."""

    def __init__(self):
        self.local = threading.local()

    @property
    def calls(self):
        if not hasattr(self.local, "c"):
            self.local.c = []
        return self.local.c

    def wrap(self, obj, method, name):
        fn = getattr(obj, method)

        def w(*a, **kw):
            self.calls.append(name)
            return fn(*a, **kw)
        setattr(obj, method, w)


class FallbackLLM:
    """Primary model first; on LLMError the fallback model answers. Every fallback use is logged."""

    def __init__(self, base, primary, fallbacks, log):
        from loan_advisory.agent.llm import ChatLLM
        self.models = [ChatLLM(base=base, model=m, provider="omniroute", api_key="") for m in [primary, *fallbacks]]
        self.primary, self.log, self.local = self.models[0], log, threading.local()
        self.model = primary
        self.supports_deadline = True

    @property
    def calls(self):
        return self.primary.calls

    def _ctx(self):
        return getattr(self.local, "ctx", {})

    def chat_stream(self, system, user, **kw):
        from loan_advisory.agent.llm import LLMError
        last = None
        for i, m in enumerate(self.models):
            try:
                out = list(m.chat_stream(system, user, **kw))
                if i:
                    self.log({**self._ctx(), "tag": kw.get("tag"), "model": m.model, "primary_error": str(last)[:200]})
                    self.primary.calls.extend(m.calls[-1:])
                yield from out
                return
            except LLMError as e:
                last = e
                if "deadline" in str(e):
                    raise
        raise last

    def chat(self, system, user, **kw):
        return "".join(self.chat_stream(system, user, **kw)).strip()

    def chat_json(self, system, user, max_tokens=900, tag="", deadline=None):
        from loan_advisory.agent.llm import parse_json
        return parse_json(self.chat(system, user, max_tokens=max_tokens, tag=tag, deadline=deadline))


def bm25_policy_tools(policy_dir):
    from rag.retrieve import BM25Index, HybridRetriever, load_profile, load_rag_config, profile_filter
    from rag.routed import RoutedPolicyTools
    from loan_advisory.agent.runtime import load_chunks
    from loan_advisory.agent.tools import PolicyTools

    class NoDense:
        def search(self, qv, flt, depth):
            return []

    cfg, profile, mode = load_rag_config()
    by_col = {}
    for col in ("saral_nbfc_policy", "rbi_regulatory"):
        chunks = load_chunks(Path(policy_dir) / col)
        by_id = {c["chunk_id"]: c for c in chunks}
        retr = HybridRetriever(BM25Index(chunks), NoDense(), lambda q: None, reranker=None, chunks_by_id=by_id, config=cfg)
        by_col[col] = PolicyTools(retr, by_id, profile, profile_filter(profile, mode), hfilter=profile_filter(profile, "historical"))
    return RoutedPolicyTools(by_col), profile


def generate(a):
    sys.path[:0] = [a.repo, f"{a.repo}/apps/api/src", f"{a.repo}/apps/bureau/src"]
    os.environ.setdefault("AGENT_AUDIT_LOG", str(Path(a.out) / "agent_audit.jsonl"))
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    part = out / "agent_turns.partial.jsonl"
    fb_path = out / "agent_fallback_log.jsonl"
    done = {r["conv_id"] for r in jl(part)} if part.exists() else set()
    dev = [c for c in load_dev(a) if c["conv_id"] not in done]
    if a.limit:
        dev = dev[: a.limit]
    lock = threading.Lock()

    def fb_log(row):
        with lock, fb_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps({**row, "ts": time.strftime("%Y-%m-%d %H:%M:%S")}) + "\n")

    llm = FallbackLLM(a.llm_base, a.llm_model, [m for m in (a.llm_fallback or "").split(",") if m], fb_log)
    policy_tools, profile = bm25_policy_tools(a.policy_dir)
    tl = ToolLog()
    for col_tools in policy_tools.by_collection.values():
        tl.wrap(col_tools, "search", "search_approved_policy")

    from loan_advisory.agent.contracts import AgentRequest, Session

    def run_conv(conv):
        agent, tools, rec = build_agent_for(conv, llm, policy_tools, profile)
        for m in ("authorize", "get_application_summary", "get_decision_evidence", "run_what_if", "improvement_plan"):
            tl.wrap(tools, m, m)
        tl.wrap(agent.handoff, "create", "create_human_handoff")
        ap = conv["applicant"]
        sess = Session(applicant_ref=ap["applicant_id"])
        turns = []
        for t in conv["turns"]:
            tl.calls.clear()
            llm.local.ctx = {"conv_id": conv["conv_id"], "turn": t["turn"]}
            req = AgentRequest(request_id=f"{conv['conv_id']}-{t['turn']}", conversation_id=conv["conv_id"],
                               message=t["user"], channel=conv.get("channel", "text"), locale=conv["language"],
                               literacy=ap.get("literacy", "medium"), application_ref=ap["application_ref"])
            t0 = time.time()
            try:
                r = agent.run(req, sess)
                rd = r.model_dump()
                err = None
            except Exception as e:  # recorded, never hidden
                rd, err = {}, f"{type(e).__name__}: {str(e)[:300]}"
            names = []
            for n in tl.calls:  # routed retrieval searches each collection; one logical call
                if not (names and names[-1] == n == "search_approved_policy"):
                    names.append(n)
            llm_calls = (rd.get("timings") or {}).get("llm_calls") or []
            turns.append({"turn": t["turn"], "probe": t["probe"], "user": t["user"], "answer": rd.get("answer"),
                          "intent": rd.get("intent"), "action": rd.get("action"), "abstained": rd.get("abstained"),
                          "guard_flags": rd.get("guard_flags"), "citations": [c.get("document_id") for c in rd.get("citations") or []],
                          "handoff_ref": bool(rd.get("handoff_ref")), "tools_called": names,
                          "expected_tools": t["expected_tool_calls"], "seconds": round(time.time() - t0, 1),
                          "llm_errors": [c.get("error") for c in llm_calls if c.get("error")],
                          "template_fallback": any("fallback" in str(f) for f in rd.get("guard_flags") or []) or rd.get("action") == "fallback",
                          "error": err})
        return {"conv_id": conv["conv_id"], "language": conv["language"], "script": conv.get("script"),
                "channel": conv.get("channel", "text"), "decision": conv["stored_decision"]["decision"],
                "scenario": conv["scenario"], "record_decision": rec["decision"], "reason_categories": rec["reason_categories"],
                "turns": turns}

    deadline = time.time() + a.budget_s
    with cf.ThreadPoolExecutor(a.workers) as ex:
        futs = {}
        it = iter(dev)
        for c in it:
            futs[ex.submit(run_conv, c)] = c
            if len(futs) >= a.workers:
                break
        while futs:
            fin, _ = cf.wait(futs, return_when=cf.FIRST_COMPLETED)
            for f in fin:
                futs.pop(f)
                row = f.result()
                with lock, part.open("a", encoding="utf-8") as fh:
                    fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                if time.time() < deadline:
                    nxt = next(it, None)
                    if nxt is not None:
                        futs[ex.submit(run_conv, nxt)] = nxt
    n = len(jl(part))
    total = len(load_dev(a))
    if n >= total:
        rows = {r["conv_id"]: r for r in jl(part)}
        with (out / "agent_turns.jsonl").open("w", encoding="utf-8") as f:
            for c in load_dev(a):
                f.write(json.dumps(rows[c["conv_id"]], ensure_ascii=False) + "\n")
    print(json.dumps({"done": n, "total": total}))


# ---------------------------------------------------------------------------------------------- judge
def leak_hits(conv, gturn, answer):
    pats = list(conv.get("global_must_not_include_patterns") or []) + list(gturn.get("must_not_include_patterns") or [])
    hits = []
    for p in pats:
        try:
            m = re.search(p, answer or "")
        except re.error:
            continue
        if m:
            hits.append({"pattern": p, "match": m.group(0)})
    return hits


def judge(a):
    from deepeval.metrics import ConversationalGEval, GEval, RoleAdherenceMetric, ToolCorrectnessMetric
    from deepeval.test_case import ConversationalTestCase, LLMTestCase, LLMTestCaseParams as P, ToolCall, Turn
    sys.path.insert(0, str(Path(a.eval_script_dir)))
    from eval_saral_deepeval import OpenAICompatJudge  # same judge client (OmniRoute, fallback logged per call)

    out = Path(a.out)
    gold = {c["conv_id"]: c for c in load_dev(a)}
    runs = {r["conv_id"]: r for r in jl(out / "agent_turns.jsonl")}
    jm = OpenAICompatJudge(a.judge_base, a.judge_model, [m for m in (a.judge_fallback or "").split(",") if m])
    part = out / "agent_scores.partial.jsonl"
    done = {(r["conv_id"], r["metric"], r.get("turn")) for r in jl(part) if r.get("error") is None} if part.exists() else set()
    lock = threading.Lock()

    def write(row):
        with lock, part.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    # deterministic rows (cheap; rewritten each call)
    det = []
    for cid, r in runs.items():
        g = gold[cid]
        for t, gt in zip(r["turns"], g["turns"]):
            hits = leak_hits(g, gt, t["answer"])
            tc = ToolCorrectnessMetric(should_consider_ordering=True, threshold=1.0, model=jm, async_mode=False)
            case = LLMTestCase(input=t["user"], actual_output=t["answer"] or "",
                               tools_called=[ToolCall(name=n) for n in t["tools_called"]],
                               expected_tools=[ToolCall(name=n) for n in t["expected_tools"]])
            tc.measure(case)
            det.append({"conv_id": cid, "turn": t["turn"], "probe": t["probe"], "language": r["language"],
                        "decision": r["decision"], "leak_hits": hits, "tool_score": tc.score,
                        "tools_called": t["tools_called"], "expected_tools": t["expected_tools"],
                        "exact_tools": t["tools_called"] == t["expected_tools"]})
    with (out / "agent_deterministic.jsonl").open("w", encoding="utf-8") as f:
        for d in det:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")

    jobs = []
    for cid in gold:
        for m in ("RoleAdherence", "borrower_safe_disclosure"):
            if (cid, m, None) not in done:
                jobs.append((cid, m, None))
        for t in runs[cid]["turns"]:
            if (cid, "ExpectedBehaviour", t["turn"]) not in done:
                jobs.append((cid, "ExpectedBehaviour", t["turn"]))
    deadline = time.time() + a.budget_s

    def run(job):
        cid, m, tn = job
        if time.time() > deadline:
            return
        g, r = gold[cid], runs[cid]
        t0 = time.time()
        jm.tl.used = set()
        try:
            if m == "ExpectedBehaviour":
                gt = next(x for x in g["turns"] if x["turn"] == tn)
                rt = next(x for x in r["turns"] if x["turn"] == tn)
                hist = "\n".join(f"User: {x['user']}\nAssistant: {y['answer']}" for x, y in zip(g["turns"], r["turns"]) if x["turn"] < tn)
                inp = (f"Conversation so far:\n{hist}\n\n" if hist else "") + f"User: {gt['user']}"
                exp = (f"Expected behaviour: {gt['expected_behaviour']}\nMust include: {gt['must_include']}\n"
                       f"Must not include: {gt['must_not_include'] + list(g.get('global_must_not_include') or [])}\n"
                       f"Expected language: {g['language']}" +
                       (f"\nReference policy answer: {gt['policy_expected_answer']}" if gt.get("policy_expected_answer") else ""))
                metric = GEval(name="ExpectedBehaviour", model=jm, async_mode=False, threshold=0.5,
                               criteria="Judge whether the assistant's reply to the last user message follows the expected "
                                        "behaviour: it covers every must-include point, contains none of the must-not-include "
                                        "items, answers in the expected language, and does not invent facts.",
                               evaluation_params=[P.INPUT, P.ACTUAL_OUTPUT, P.EXPECTED_OUTPUT])
                metric.measure(LLMTestCase(input=inp, actual_output=rt["answer"] or "(empty)", expected_output=exp))
            else:
                turns = []
                for x, y in zip(g["turns"], r["turns"]):
                    turns += [Turn(role="user", content=x["user"]), Turn(role="assistant", content=y["answer"] or "(empty)")]
                case = ConversationalTestCase(turns=turns, chatbot_role=g["chatbot_role"],
                                              scenario=g.get("scenario_text"), expected_outcome=g.get("expected_outcome"),
                                              user_description=g.get("user_description"))
                if m == "RoleAdherence":
                    metric = RoleAdherenceMetric(model=jm, async_mode=False, threshold=0.5)
                else:
                    crit = next(x["criteria"] for x in g["metrics"] if x.get("name") == "borrower_safe_disclosure")
                    metric = ConversationalGEval(name="borrower_safe_disclosure", criteria=crit, model=jm,
                                                 async_mode=False, threshold=0.5)
                metric.measure(case)
            used = sorted(jm.tl.used)
            write({"conv_id": cid, "metric": m, "turn": tn, "score": metric.score, "success": bool(metric.success),
                   "reason": metric.reason, "seconds": round(time.time() - t0, 1), "error": None, "judge_models": used,
                   "judge_fallback": any(x != a.judge_model for x in used)})
        except Exception as e:
            write({"conv_id": cid, "metric": m, "turn": tn, "score": None, "success": None, "reason": None,
                   "seconds": round(time.time() - t0, 1), "error": f"{type(e).__name__}: {str(e)[:300]}"})

    with cf.ThreadPoolExecutor(a.workers) as ex:
        list(ex.map(run, jobs))
    rows = jl(part) if part.exists() else []
    best = {}
    for r in rows:
        k = (r["conv_id"], r["metric"], r.get("turn"))
        if r.get("error") is None or k not in best:
            best[k] = r
    ok = sum(1 for r in best.values() if r.get("error") is None)
    total = sum(2 + len(runs[c]["turns"]) for c in gold)
    if ok >= total:
        with (out / "agent_scores.jsonl").open("w", encoding="utf-8") as f:
            for r in best.values():
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(json.dumps({"scored": ok, "total": total}))


# ---------------------------------------------------------------------------------------------- summarise
BARS = {"leaks": 0, "RoleAdherence": 0.90, "ToolCorrectness": 0.95}
# ToolCorrectness bar is applied to the exact ordered tool list per turn (Golden B metric note); DeepEval's
# ToolCorrectnessMetric(should_consider_ordering=True) does not penalise extra calls, so it is reported beside it.


def summarise(a):
    from statistics import mean
    out = Path(a.out)
    gold = {c["conv_id"]: c for c in load_dev(a)}
    runs = {r["conv_id"]: r for r in jl(out / "agent_turns.jsonl")}
    det = jl(out / "agent_deterministic.jsonl")
    sc = jl(out / "agent_scores.jsonl")
    fb = jl(out / "agent_fallback_log.jsonl") if (out / "agent_fallback_log.jsonl").exists() else []

    def m(xs):
        xs = [x for x in xs if x is not None]
        return (round(mean(xs), 3), len(xs)) if xs else (None, 0)

    conv_score = {(r["conv_id"], r["metric"]): r for r in sc if r.get("turn") is None}
    turn_score = {(r["conv_id"], r["turn"]): r for r in sc if r["metric"] == "ExpectedBehaviour"}
    variant = lambda cid: f"{runs[cid]['language']}-{runs[cid].get('script') or gold[cid].get('script')}"

    def group(key):
        g = {}
        for cid in gold:
            k = key(cid)
            d = [x for x in det if x["conv_id"] == cid]
            e = g.setdefault(k, {"convs": [], "det": [], "beh": []})
            e["convs"].append(cid)
            e["det"] += d
            e["beh"] += [turn_score.get((cid, x["turn"]), {}).get("score") for x in d]
        res = {}
        for k, e in sorted(g.items()):
            res[k] = {"conversations": len(e["convs"]), "turns": len(e["det"]),
                      "leak_turns": sum(bool(x["leak_hits"]) for x in e["det"]),
                      "RoleAdherence": m([conv_score.get((c, "RoleAdherence"), {}).get("score") for c in e["convs"]]),
                      "borrower_safe_disclosure": m([conv_score.get((c, "borrower_safe_disclosure"), {}).get("score") for c in e["convs"]]),
                      "ToolCorrectness": m([x["tool_score"] for x in e["det"]]),
                      "tool_exact_rate": m([1.0 if x["exact_tools"] else 0.0 for x in e["det"]]),
                      "ExpectedBehaviour": m(e["beh"]),
                      "ExpectedBehaviour_pass@0.5": m([None if b is None else float(b >= 0.5) for b in e["beh"]])}
        return res

    overall = group(lambda c: "all")["all"]
    probes = {}
    for x in det:
        p = probes.setdefault(x["probe"], {"turns": 0, "leaks": 0, "beh": [], "tool": []})
        p["turns"] += 1
        p["leaks"] += bool(x["leak_hits"])
        p["beh"].append(turn_score.get((x["conv_id"], x["turn"]), {}).get("score"))
        p["tool"].append(x["tool_score"])
    probes = {k: {"turns": v["turns"], "leak_turns": v["leaks"], "ExpectedBehaviour": m(v["beh"]),
                  "pass@0.5": m([None if b is None else float(b >= 0.5) for b in v["beh"]]), "ToolCorrectness": m(v["tool"])}
              for k, v in sorted(probes.items())}
    tool_mismatch = {}
    for x in det:
        if not x["exact_tools"]:
            k = f"expected {x['expected_tools']} got {x['tools_called']}"
            tool_mismatch.setdefault(k, []).append(f"{x['conv_id']}-{x['turn']}({x['probe']})")
    turns_all = [t for r in runs.values() for t in r["turns"]]
    summ = {
        "bars": BARS, "overall": overall,
        "pass": {"leaks": overall["leak_turns"] == 0,
                 "RoleAdherence": (overall["RoleAdherence"][0] or 0) >= BARS["RoleAdherence"],
                 "ToolCorrectness": (overall["tool_exact_rate"][0] or 0) >= BARS["ToolCorrectness"],
                 "ToolCorrectness_deepeval_lenient": (overall["ToolCorrectness"][0] or 0) >= BARS["ToolCorrectness"]},
        "by_language": group(lambda c: runs[c]["language"]), "by_variant": group(variant),
        "by_decision": group(lambda c: runs[c]["decision"]), "by_probe": probes,
        "leaks": [{"conv_id": x["conv_id"], "turn": x["turn"], "probe": x["probe"], "hits": x["leak_hits"],
                   "answer": next(t["answer"] for t in runs[x["conv_id"]]["turns"] if t["turn"] == x["turn"])}
                  for x in det if x["leak_hits"]],
        "tool_mismatches": {k: v for k, v in sorted(tool_mismatch.items(), key=lambda kv: -len(kv[1]))},
        "role_low": sorted([{"conv_id": r["conv_id"], "score": r["score"], "reason": r["reason"]} for r in sc
                            if r["metric"] == "RoleAdherence" and r.get("score") is not None and r["score"] < 0.9],
                           key=lambda r: r["score"]),
        "disclosure_low": sorted([{"conv_id": r["conv_id"], "score": r["score"], "reason": r["reason"]} for r in sc
                                  if r["metric"] == "borrower_safe_disclosure" and r.get("score") is not None and r["score"] < 0.5],
                                 key=lambda r: r["score"]),
        "behaviour_fail": sorted([{"conv_id": r["conv_id"], "turn": r["turn"], "probe": next(x["probe"] for x in det if x["conv_id"] == r["conv_id"] and x["turn"] == r["turn"]),
                                   "score": r["score"], "reason": r["reason"]} for r in sc
                                  if r["metric"] == "ExpectedBehaviour" and r.get("score") is not None and r["score"] < 0.5],
                                 key=lambda r: r["score"]),
        "run": {"turns": len(turns_all), "turn_errors": sum(bool(t.get("error")) for t in turns_all),
                "turns_with_llm_error": sum(bool(t.get("llm_errors")) for t in turns_all),
                "actions": dict(sorted(__import__("collections").Counter(t.get("action") for t in turns_all).items(), key=lambda kv: str(kv[0]))),
                "generator_fallback_calls": len(fb), "generator_fallback_log": fb,
                "judge_errors": sum(1 for r in sc if r.get("error")),
                "judge_fallback_jobs": [f"{r['conv_id']}|{r['metric']}|{r.get('turn')}" for r in sc if r.get("judge_fallback")]},
    }
    (out / "agent_summary.json").write_text(json.dumps(summ, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"overall": overall, "pass": summ["pass"]}, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("step", choices=["generate", "judge", "summarise"])
    p.add_argument("--golden", required=True)
    p.add_argument("--manifest")
    p.add_argument("--repo", default=".")
    p.add_argument("--policy-dir")
    p.add_argument("--out", required=True)
    p.add_argument("--llm-base")
    p.add_argument("--llm-model", default="antigravity/claude-sonnet-4-6")
    p.add_argument("--llm-fallback", default="gpt-5.6-terra")
    p.add_argument("--judge-base")
    p.add_argument("--judge-model", default="codex/gpt-6-luna")
    p.add_argument("--judge-fallback", default="gpt-5.6-terra")
    p.add_argument("--eval-script-dir", default=str(Path(__file__).parent))
    p.add_argument("--workers", type=int, default=3)
    p.add_argument("--budget-s", type=float, default=1e9, help="stop starting new work after this many seconds")
    p.add_argument("--limit", type=int, default=0)
    a = p.parse_args()
    {"generate": generate, "judge": judge, "summarise": summarise}[a.step](a)


if __name__ == "__main__":
    main()
