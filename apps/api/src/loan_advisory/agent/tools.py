"""Typed, least-privilege tools the graph may call (handoff Phase 5 "Proposed initial tools").

Every applicant-specific tool re-checks authorization server-side against the system of record
(the Loan Application's `applicant`), never against the message, the thread id or the LLM.
There is no generic Frappe/SQL/web tool and no write path: decisions are only READ from the stored
Decision Evidence; what-if goes through lifecycle.simulate (in memory, never persisted).
"""
import json
import threading
import time
import uuid
from dataclasses import dataclass

from loan_advisory.agent import observability as obs
from loan_advisory.agent.contracts import Citation, Session
from loan_advisory.agent.facts import SCORED, counterfactual_targets
from loan_advisory.application.lifecycle import simulate
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication
from loan_advisory.state_paths import HANDOFF_LOG, append_private, resolve

FIELD_TO_DOC = {k: f"custom_{k}" for k in SCORED}
_ZEN_LOCK = threading.Lock()   # the shared ZEN decision object is used from server/eval threads
_RETRIEVER_LOCK = threading.Lock()
LIMITS = {"monthly_income": (1, 100_000_000), "monthly_obligations": (0, 100_000_000),
          "credit_score": (300, 900), "employment_months": (0, 600)}


class NotAuthorized(Exception):
    pass


class InvalidWhatIf(Exception):
    pass


# ------------------------------------------------------------------ evidence sources (read-only)
class FrappeEvidenceSource:
    """Latest stored `Loan Decision Evidence` for a Loan Application (written by the conventional workflow)."""

    def __init__(self, sink):
        self.sink = sink

    def latest(self, application_ref: str, doc: dict) -> dict | None:
        rid = doc.get("custom_latest_evidence")
        if not rid:
            return None
        with obs.span("frappe.get_loan_decision_evidence", kind="TOOL", **{"frappe.doctype": "Loan Decision Evidence", "frappe.record_id": rid}):
            return self.sink.get_record(rid)


class InMemoryEvidenceSource:
    """Same contract over an InMemoryEvidenceSink (tests, offline eval over synthetic personas)."""

    def __init__(self, sink):
        self.sink = sink

    def latest(self, application_ref: str, doc: dict) -> dict | None:
        rid = getattr(self.sink, "latest_ids", {}).get(application_ref)
        if rid in self.sink.records:
            return self.sink.records[rid]
        recs = [r for r in self.sink.records.values() if r["application_ref"] == application_ref and not r["is_simulation"]]
        return recs[-1] if recs else None


@dataclass
class DecisionTools:
    store: object
    evidence: object

    def _owned_doc(self, application_ref: str, session: Session) -> dict:
        if not session or not session.authenticated:
            raise NotAuthorized("no authenticated session")
        with obs.span("frappe.get_loan_application", kind="TOOL", **{"frappe.doctype": "Loan Application",
                                                                    "store": type(self.store).__name__}):
            doc = self.store.get(application_ref)  # UnknownApplication / FrappeUnavailable propagate
        owner = doc.get("applicant") or doc.get("applicant_id")
        if not owner or owner != session.applicant_ref:
            raise NotAuthorized("application does not belong to this applicant")
        return doc

    @obs.tool("authorize")
    def authorize(self, application_ref: str, session: Session) -> None:
        self._owned_doc(application_ref, session)

    @obs.tool("get_application_summary")
    def get_application_summary(self, application_ref: str, session: Session) -> dict:
        doc = self._owned_doc(application_ref, session)
        return {"application_ref": application_ref, "loan_amount": doc.get("loan_amount"),
                "tenure_months": doc.get("repayment_periods") or doc.get("loan_tenure_months"),
                "product": doc.get("loan_product"), "status": doc.get("status"),
                "lifecycle_state": doc.get("custom_lifecycle_state")}

    @obs.tool("get_decision_evidence")
    def get_decision_evidence(self, application_ref: str, session: Session) -> dict | None:
        doc = self._owned_doc(application_ref, session)
        return self.evidence.latest(application_ref, doc)

    @obs.tool("run_what_if")
    def run_what_if(self, application_ref: str, session: Session, changes: dict) -> dict:
        """Hypothetical re-evaluation through the unchanged ZEN path. Returns before/after per rule."""
        doc = self._owned_doc(application_ref, session)
        clean = {}
        for k, v in (changes or {}).items():
            if k not in FIELD_TO_DOC:
                raise InvalidWhatIf(f"field {k!r} cannot be simulated (allowed: {', '.join(SCORED)})")
            try:
                fv = float(v)
            except (TypeError, ValueError):
                raise InvalidWhatIf(f"{k} must be a number")
            lo, hi = LIMITS[k]
            if not lo <= fv <= hi:
                raise InvalidWhatIf(f"{k}={v} is outside the allowed range {lo}..{hi}")
            clean[k] = int(fv) if k in ("credit_score", "employment_months") else fv
        if not clean:
            raise InvalidWhatIf("no hypothetical change given")
        before_vals = {k: doc.get(FIELD_TO_DOC[k], doc.get(k)) for k in SCORED}
        with obs.span("zen.simulate", kind="TOOL", **{"zen.engine": "zen-engine 2.1.2", "zen.fields": sorted(clean)}) as sp, _ZEN_LOCK:
            sim = simulate(application_ref, self.store, {FIELD_TO_DOC[k]: v for k, v in clean.items()})
            obs.set_attrs(sp, **{"zen.simulated_decision": sim["decision"], "zen.policy_version": sim["policy"]["version"]})
        after_doc = self.store.get(application_ref)
        unchanged = all(after_doc.get(FIELD_TO_DOC[k], after_doc.get(k)) == before_vals[k] for k in SCORED)
        return {"changes": clean, "simulated_decision": sim["decision"], "is_simulation": True,
                "rule_results": {e["rule_id"]: e["result"] for e in sim["rule_evaluations"]},
                "failed_reason_codes": sim["failed_reason_codes"], "record": sim,
                "original_record_unchanged": unchanged,
                "label": "hypothetical result under the synthetic prototype policy; not a decision and not a guarantee"}

    @obs.tool("improvement_plan")
    def improvement_plan(self, application_ref: str, session: Session, record: dict) -> dict:
        targets = counterfactual_targets(record)
        steps = []
        for t in targets:
            w = self.run_what_if(application_ref, session, {t["field"]: t["target"]})
            steps.append({**t, "rule_passes_after_change": w["rule_results"].get(t["rule_id"]) == "PASS",
                          "simulated_decision_after_this_change_alone": w["simulated_decision"]})
        combined = None
        if targets:
            ch = {}
            for t in targets:
                ch[t["field"]] = t["target"] if t["field"] not in ch else ch[t["field"]]
            w = self.run_what_if(application_ref, session, ch)
            combined = {"changes": w["changes"], "simulated_decision": w["simulated_decision"],
                        "label": w["label"], "original_record_unchanged": w["original_record_unchanged"]}
        return {"steps": steps, "all_changes_together": combined}


# ------------------------------------------------------------------ policy retrieval (read-only)
class PolicyTools:
    """search_approved_policy over the hybrid + rerank retriever with lender-profile filters."""

    def __init__(self, retriever, chunks_by_id: dict, profile: dict | None, rfilter, k: int = 5, hfilter=None):
        self.retriever, self.by_id, self.profile, self.rfilter, self.k = retriever, chunks_by_id, profile, rfilter, k
        self.hfilter = hfilter  # historical-mode filter (approved + approved_historical), used for temporal questions

    @obs.tool("search_approved_policy")
    def search(self, query: str, historical: bool = False) -> tuple[list[dict], dict]:
        flt = self.hfilter if historical and self.hfilter is not None else self.rfilter
        with _RETRIEVER_LOCK:
            res = self.retriever.search(query, flt, k=self.k)
        passages = []
        for i, (cid, score) in enumerate(res["results"][: self.k]):
            c = self.by_id[cid]
            passages.append({"label": f"P{i + 1}", "chunk_id": cid, "score": round(float(score), 4), "text": c["text"],
                             "citation": citation_for(f"P{i + 1}", c, self.profile).model_dump()})
        meta = {"latency_ms": round(res.get("latency_ms", 0.0), 1), "top_rerank_score": res.get("top_rerank_score"),
                "mode": flt.mode}
        doc_ids, chunk_ids = [p["citation"]["document_id"] for p in passages], [p["chunk_id"] for p in passages]
        obs.set_attrs(obs.current_span(),
                      **{"retrieval.mode": flt.mode, "retrieval.lender_id": flt.lender_id, "retrieval.entity_type": flt.entity_type,
                         "retrieval.k": self.k, "retrieval.latency_ms": meta["latency_ms"], "retrieval.top_rerank_score": meta["top_rerank_score"],
                         "retrieval.document_ids": doc_ids, "retrieval.chunk_ids": chunk_ids, "input.value": obs.content(query),
                         "langfuse.observation.type": "retriever", "langfuse.observation.input": obs.lf_content(query)},
                      **obs.lf_meta(mode=flt.mode, k=self.k, count=len(passages), latency_ms=meta["latency_ms"],
                                    top_rerank_score=meta["top_rerank_score"], document_ids=doc_ids, chunk_ids=chunk_ids,
                                    historical=historical))
        return passages, meta


def citation_for(label: str, c: dict, profile: dict | None) -> Citation:
    rel = None
    if c.get("lender_id") and c.get("lender_id") not in ("none",) and profile and c.get("lender_id") == profile.get("lender_id"):
        rel = profile.get("relationship")
    return Citation(label=label, chunk_id=c.get("chunk_id"), document_id=c["document_id"], title=c.get("title") or c["document_id"],
                    section=c.get("section"), page=c.get("page_start"), source_url=c.get("source_url"),
                    approval_status=c.get("approval_status"), publisher=c.get("publisher"),
                    relationship=rel or c.get("lender_relationship"),
                    applies_to_entity=list(c.get("applies_to_entity") or []) or None)


# ------------------------------------------------------------------ human handoff + audit
class HandoffQueue:
    def __init__(self, path: str | None = None):
        self.path = resolve(path, "AGENT_HANDOFF_LOG", HANDOFF_LOG, "agent_out/handoffs.jsonl",
                            legacy="agent_out/handoffs.jsonl")

    @obs.tool("create_human_handoff")
    def create(self, category: str, refs: list[str], summary: str) -> str:
        ref = f"HO-{uuid.uuid4().hex[:10]}"
        with append_private(self.path) as f:
            f.write(json.dumps({"handoff_ref": ref, "category": category, "refs": refs, "summary": summary[:500],
                                "created_at": time.time()}) + "\n")
        return ref


__all__ = ["DecisionTools", "PolicyTools", "FrappeEvidenceSource", "InMemoryEvidenceSource", "HandoffQueue",
           "NotAuthorized", "InvalidWhatIf", "UnknownApplication", "FrappeUnavailable", "citation_for"]
