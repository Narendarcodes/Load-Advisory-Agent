"""Deterministic audit of policy citation handling (citation_audit_v1).

No LLM judges, no network, no Qdrant: composer outputs are fixed fixtures, and the tree's own
functions/agent are applied to them. Run the same file against baseline and candidate trees by
pointing PYTHONPATH at each tree.

    PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_audit.py \
        --cases data/evaluation/agent/citation_audit_v1/cases.jsonl \
        --label candidate --sha "$(git rev-parse HEAD)" --out runs/audit_candidate.json

    PYTHONPATH=<base>:<base>/apps/api/src python <candidate>/scripts/agent/eval_citation_audit.py \
        --cases <candidate>/data/evaluation/agent/citation_audit_v1/cases.jsonl \
        --label baseline --sha "<base sha>" --out runs/audit_baseline.json

    PYTHONPATH=.:apps/api/src python scripts/agent/eval_citation_audit.py \
        --compare runs/audit_baseline.json runs/audit_candidate.json --out runs/audit_diff.json
"""
import argparse
import json
import platform
import re
import sys
import tempfile
from pathlib import Path

from loan_advisory.agent import guards as G
from loan_advisory.agent import settings as S
from loan_advisory.agent.citations import verify_citations
from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.agent.llm import LLMError
from loan_advisory.agent.runtime import build_offline_agent
from loan_advisory.agent.tools import citation_for
from rag.retrieve import load_profile, profile_filter

try:  # candidate-only offline helper; absent on baseline
    from loan_advisory.agent.citations import select_verified
except ImportError:  # pragma: no cover - baseline
    select_verified = None

HIST_CUE = re.compile(r"\b(previously|earlier|older|historical|superseded|used to|at the time|before|version|v\d)\b", re.I)
MODE_ORDER = ("labels", "verify", "primary_source", "one_source")


class FakePolicy:
    def __init__(self, passages, fail=False):
        self.passages, self.fail = passages, fail

    def search(self, q, historical=False):
        if self.fail:
            raise RuntimeError("retriever down (audit fixture)")
        return self.passages, {"latency_ms": 1.0, "mode": "historical" if historical else "current"}


class ScriptedLLM:
    """Returns the fixture intent and the fixture composer JSON. No network."""

    def __init__(self, intent="policy", policy=None, fail=False):
        self.intent, self.policy, self.fail = intent, policy or {}, fail
        self.calls = []

    def chat(self, system, user, max_tokens=900, temperature=0.0, tag="", **kw):
        self.calls.append({"tag": tag})
        if self.fail:
            raise LLMError("scripted failure (audit fixture)")
        if tag == "classify":
            return json.dumps({"intent": self.intent, "what_if_changes": {}})
        if tag and tag.startswith("compose_policy"):
            return json.dumps(self.policy)
        return "Synthetic fixture answer."

    def chat_json(self, system, user, max_tokens=900, tag="", **kw):
        return json.loads(self.chat(system, user, max_tokens, tag=tag, **kw))


def load_cases(path):
    with Path(path).open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def supported_modes():
    modes = tuple(getattr(S, "CITATION_MODES", ()))
    return [m for m in MODE_ORDER if not modes or m in modes]


def apply_citation_mode(case, mode):
    by = {p["label"]: p for p in case["passages"]}
    claimed = [c for c in (case.get("composer") or {}).get("citations") or [] if c in by]
    if mode == "labels":
        return claimed
    kept, _dropped = verify_citations((case.get("composer") or {}).get("answer") or "", case.get("composer") or {},
                                      case["passages"], mode)
    return [c for c in kept if c in by]


def eval_citation(cases, mode):
    rows = []
    for c in cases:
        if c["kind"] != "citation":
            continue
        by = {p["label"]: p for p in c["passages"]}
        authority = {p["label"]: p.get("authority", "lender") for p in c["passages"]}
        g = c["gold"]
        sup, req, forb = set(g.get("supporting") or []), set(g.get("required") or []), set(g.get("forbidden") or [])
        cited = apply_citation_mode(c, mode)
        allowed_cited = sup | req
        tp = len([x for x in cited if x in sup])
        fp = len([x for x in cited if x not in sup])
        fn = len(sup - set(cited))
        forbidden_cited = len(forb & set(cited))
        authority_ok = all(authority.get(x, "lender") in (g.get("authority_ok") or ["lender", "regulator", "general"])
                           for x in cited)
        required_ok = req <= set(cited)
        hist_cited = any(by[x]["citation"].get("approval_status") == "approved_historical" for x in cited)
        hist_ok = (not g.get("historical_qualified")) or (not hist_cited) or bool(HIST_CUE.search(c["composer"]["answer"]))
        case_ok = set(cited) <= allowed_cited and required_ok and forbidden_cited == 0 and authority_ok and hist_ok
        rows.append({"kind": "citation", "case_id": c["case_id"], "category": c["category"], "mode": mode,
                     "cited": cited, "tp": tp, "fp": fp, "fn": fn, "forbidden_cited": forbidden_cited,
                     "required_ok": required_ok, "authority_ok": authority_ok, "hist_ok": hist_ok, "ok": case_ok})
    tp = sum(r["tp"] for r in rows)
    fp = sum(r["fp"] for r in rows)
    fn = sum(r["fn"] for r in rows)
    req_hit = sum(len(set(r["cited"]) & set(c["gold"].get("required") or [])) for r, c in
                  zip(rows, [c for c in cases if c["kind"] == "citation"]))
    req_tot = sum(len(c["gold"].get("required") or []) for c in cases if c["kind"] == "citation")
    conflict = [r for r in rows if next(c for c in cases if c["case_id"] == r["case_id"])["gold"].get("conflict")]
    corr = [r for r in rows if r["category"] == "corroboration"]
    corr_both = 0
    for r in corr:
        c = next(c for c in cases if c["case_id"] == r["case_id"])
        corr_both += int(set(r["cited"]) & set(c["gold"]["supporting"]) == set(c["gold"]["supporting"]))
    return {"mode": mode, "n": len(rows),
            "n_cited_labels": tp + fp, "tp": tp, "fp": fp, "fn": fn,
            "precision": (tp / (tp + fp)) if (tp + fp) else None,
            "coverage_all": (tp / (tp + fn)) if (tp + fn) else None,
            "material_coverage": (req_hit / req_tot) if req_tot else None,
            "case_ok": sum(r["ok"] for r in rows), "case_total": len(rows),
            "forbidden_cited": sum(r["forbidden_cited"] for r in rows),
            "authority_correct": sum(r["authority_ok"] for r in rows),
            "conflict_safe": sum(r["required_ok"] for r in conflict), "conflict_total": len(conflict),
            "multi_doc_retained": sum(r["required_ok"] for r in rows if r["category"] == "multi_document"),
            "multi_doc_total": sum(1 for r in rows if r["category"] == "multi_document"),
            "corroboration_both": corr_both, "corroboration_total": len(corr),
            "rows": rows}


def run_agent(case, mode):
    ag, _store, _sink = build_offline_agent(
        llm=ScriptedLLM(intent=case.get("intent", "policy"), policy=case.get("composer")),
        policy_tools=FakePolicy(case.get("passages") or [], fail=bool(case.get("policy_fail"))),
        profile={"legal_name": "Synthetic Reference Lender", "entity_type": "nbfc", "lender_id": "SYNTHETIC",
                 "relationship": "team-authored synthetic prototype policy"})
    ag.settings = S.AgentSettings(citation_mode=mode)
    with tempfile.TemporaryDirectory() as td:
        ag.audit_path = Path(td) / "turns.jsonl"
        ag.handoff.path = Path(td) / "handoffs.jsonl"
        req = AgentRequest(request_id="audit", conversation_id="audit", message=case["question"], application_ref=None)
        return ag.run(req, Session(applicant_ref="CUS-AUDIT"))


def eval_graph(cases, mode):
    rows = []
    for c in cases:
        if c["kind"] != "graph":
            continue
        resp = run_agent(c, mode)
        g = c["gold"]
        labels = [x.label for x in resp.citations]
        declined = resp.action in ("refuse", "handoff") or bool(resp.abstained)
        intent_ok = ("expect_intent" not in g) or resp.intent == g["expect_intent"]
        req_ok = set(g.get("required") or []) <= set(labels)
        forb_ok = not (set(g.get("forbidden") or []) & set(labels))
        ung_ok = all(any(f.startswith("ungrounded_numbers") and n in f for f in resp.guard_flags)
                     for n in g.get("ungrounded_contains") or [])
        ok = declined == bool(g["expect_decline"]) and intent_ok and ung_ok and (declined or (req_ok and forb_ok))
        rows.append({"kind": "graph", "case_id": c["case_id"], "category": c["category"], "mode": mode,
                     "declined": declined, "expect_decline": bool(g["expect_decline"]), "intent": resp.intent,
                     "action": resp.action, "abstained": bool(resp.abstained), "citations": labels,
                     "guard_flags": resp.guard_flags, "ok": ok})
    tp = sum(r["declined"] and r["expect_decline"] for r in rows)
    fp = sum(r["declined"] and not r["expect_decline"] for r in rows)
    fn = sum((not r["declined"]) and r["expect_decline"] for r in rows)
    return {"mode": mode, "n": len(rows),
            "decline_tp": tp, "decline_fp": fp, "decline_fn": fn,
            "abstention_precision": (tp / (tp + fp)) if (tp + fp) else None,
            "abstention_recall": (tp / (tp + fn)) if (tp + fn) else None,
            "case_ok": sum(r["ok"] for r in rows), "case_total": len(rows), "rows": rows}


def eval_guards(cases):
    rows = []
    for c in cases:
        if c["kind"] != "guard":
            continue
        flags = G.request_flags(c["question"], None)
        want = c["gold"]["flag"]
        ok = (not ({"edit_record", "guarantee"} & set(flags))) if want == "none" else (want in flags)
        rows.append({"kind": "guard", "case_id": c["case_id"], "want": want, "flags": flags, "ok": ok})
    controls = [r for r in rows if r["want"] == "none"]
    detects = [r for r in rows if r["want"] != "none"]
    return {"n": len(rows), "detected": sum(r["ok"] for r in detects), "detection_total": len(detects),
            "false_positives": sum(not r["ok"] for r in controls), "control_total": len(controls),
            "case_ok": sum(r["ok"] for r in rows), "case_total": len(rows), "rows": rows}


def eval_governance(cases):
    rows = []
    for c in cases:
        if c["kind"] != "governance":
            continue
        prof = load_profile(c["profile"])
        if c["check"] == "filter":
            got = profile_filter(prof, c["mode"]).allows(c["chunk"])
            want = c["gold"]["allowed"]
        else:
            got = citation_for(c["label"], c["chunk"], prof).relationship
            want = c["gold"]["relationship"]
        rows.append({"kind": "governance", "case_id": c["case_id"], "category": c["category"], "check": c["check"],
                     "got": got, "want": want, "ok": got == want})
    leaked = [r for r in rows if r["check"] == "filter" and r["want"] is False and r["got"] is True]
    return {"n": len(rows), "case_ok": sum(r["ok"] for r in rows), "case_total": len(rows),
            "governance_leakage": len(leaked), "rows": rows}


def eval_wiring(cases):
    rows = []
    for c in cases:
        if c["kind"] != "wiring":
            continue
        mode = c["citation_mode"]
        try:
            resp = run_agent(c, mode)
        except ValueError as e:
            rows.append({"kind": "wiring", "case_id": c["case_id"], "mode": mode, "supported": False,
                         "error": str(e)[:120], "ok": False})
            continue
        got = [x.label for x in resp.citations]
        ok = got == c["gold"]["expect_citations"]
        rows.append({"kind": "wiring", "case_id": c["case_id"], "mode": mode, "supported": True,
                     "citations": got, "expected": c["gold"]["expect_citations"], "ok": ok})
    return {"n": len(rows), "case_ok": sum(r["ok"] for r in rows), "case_total": len(rows), "rows": rows}


def run(args):
    cases = load_cases(args.cases)
    modes = supported_modes()
    citation = {m: eval_citation(cases, m) for m in modes}
    graph_mode = "labels"
    graph = eval_graph(cases, graph_mode) if graph_mode in modes else None
    out = {"meta": {"label": args.label, "sha": args.sha, "python": platform.python_version(),
                    "cases_file": str(Path(args.cases).resolve()), "n_cases": len(cases),
                    "citation_modes": modes, "graph_mode": graph_mode,
                    "select_verified_available": select_verified is not None,
                    "deterministic": True, "llm_used": False},
           "citation": citation, "graph": graph, "guard": eval_guards(cases),
           "governance": eval_governance(cases), "wiring": eval_wiring(cases)}
    out["per_case"] = [{"kind": r["kind"], "case_id": r["case_id"], "mode": r.get("mode"), "ok": r["ok"]}
                       for section in (citation.values(), [graph] if graph else [], [out["guard"]],
                                       [out["governance"]], [out["wiring"]])
                       for s in section for r in s["rows"]]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in out.items() if k not in ("citation", "graph", "guard", "governance", "wiring", "per_case")}))
    for m, s in citation.items():
        print(f"citation/{m}: prec={s['precision']} cov={s['coverage_all']} mat={s['material_coverage']} "
              f"ok={s['case_ok']}/{s['case_total']} forb={s['forbidden_cited']} "
              f"conflict={s['conflict_safe']}/{s['conflict_total']} multi={s['multi_doc_retained']}/{s['multi_doc_total']} "
              f"corr_both={s['corroboration_both']}/{s['corroboration_total']}")
    if graph:
        print(f"graph/{graph['mode']}: precision={graph['abstention_precision']} recall={graph['abstention_recall']} "
              f"ok={graph['case_ok']}/{graph['case_total']}")
    print(f"guard: detect={out['guard']['detected']}/{out['guard']['detection_total']} "
          f"fp={out['guard']['false_positives']}/{out['guard']['control_total']}")
    print(f"governance: ok={out['governance']['case_ok']}/{out['governance']['case_total']} "
          f"leakage={out['governance']['governance_leakage']}")
    print(f"wiring: ok={out['wiring']['case_ok']}/{out['wiring']['case_total']}")


def compare(a_path, b_path, out_path):
    a = json.loads(Path(a_path).read_text(encoding="utf-8"))
    b = json.loads(Path(b_path).read_text(encoding="utf-8"))
    def idx(run, mode):
        return {r["case_id"]: r["ok"] for r in run["per_case"]
                if r["kind"] == "citation" and r.get("mode") == mode}
    out = {"baseline": a["meta"]["sha"], "candidate": b["meta"]["sha"],
           "comparisons": {}}
    pairs = [("labels", "labels"), ("labels", "primary_source"), ("labels", "verify"),
             ("labels", "one_source")]
    for base_mode, cand_mode in pairs:
        if cand_mode not in b["citation"] or base_mode not in a["citation"]:
            continue
        ba, ca = idx(a, base_mode), idx(b, cand_mode)
        common = sorted(set(ba) & set(ca))
        regressions = [k for k in common if ba[k] and not ca[k]]
        improvements = [k for k in common if not ba[k] and ca[k]]
        out["comparisons"][f"{base_mode}->{cand_mode}"] = {
            "n": len(common), "regressions": regressions, "improvements": improvements,
            "regression_count": len(regressions), "improvement_count": len(improvements)}
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out, indent=1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases")
    ap.add_argument("--label", default="candidate")
    ap.add_argument("--sha", default="unknown")
    ap.add_argument("--out")
    ap.add_argument("--compare", nargs=2)
    a = ap.parse_args()
    if a.compare:
        compare(a.compare[0], a.compare[1], a.out)
        return
    if not a.cases or not a.out:
        ap.error("--cases and --out are required unless --compare is used")
    run(a)


if __name__ == "__main__":
    main()
