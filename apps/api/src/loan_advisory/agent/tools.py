"""Typed, least-privilege tools the graph may call (handoff Phase 5 "Proposed initial tools").

Every applicant-specific tool re-checks authorization server-side against the system of record
(the Loan Application's `applicant`), never against the message, the thread id or the LLM.
There is no generic Frappe/SQL/web tool and no write path: decisions are only READ from the stored
Decision Evidence; what-if goes through lifecycle.simulate (in memory, never persisted).
"""
import hashlib
import json
import threading
import time
import uuid
from dataclasses import dataclass

from loan_advisory.agent import observability as obs
from loan_advisory.agent.contracts import Citation, Session
from loan_advisory.agent.facts import SCORED, counterfactual_targets
from loan_advisory.application.lifecycle import V2_VERSION, configured_policy_version, simulate, simulate_v2
from loan_advisory.infrastructure.frappe_adapter import FrappeUnavailable, UnknownApplication
from loan_advisory.state_paths import HANDOFF_LOG, append_private, resolve

FIELD_TO_DOC = {k: f"custom_{k}" for k in SCORED}
_ZEN_LOCK = threading.Lock()   # the shared ZEN decision object is used from server/eval threads
_RETRIEVER_LOCK = threading.Lock()
LIMITS = {"monthly_income": (1, 100_000_000), "monthly_obligations": (0, 100_000_000),
          "credit_score": (300, 900), "employment_months": (0, 600),
          "loan_amount": (10_000, 50_000_000), "tenure_months": (12, 108)}
V2_ONLY_FIELDS = ("loan_amount", "tenure_months")  # amount / loan-period estimates need the catalogue-v2 sizing (Q-03)
# Outcome names only catalogue v2 records; a record carrying one is estimated under v2 even if its policy version is blank.
V2_DECISIONS = ("ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "DECLINE", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED")
WOULD_MEET = ("APPROVED", "ELIGIBILITY_CONDITIONS_MET")
NOT_ESTIMABLE = ("ERROR", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "REVIEW")


class NotAuthorized(Exception):
    pass


class InvalidWhatIf(Exception):
    pass


# ------------------------------------------------------------------ evidence sources (read-only)
class FrappeEvidenceSource:
    """Latest stored `Loan Decision Evidence` for a Loan Application (written by the conventional workflow)."""

    def __init__(self, sink):
        self.sink = sink

    def stamp(self, application_ref: str, doc: dict) -> str | None:
        """Version stamp of the latest evidence: the evidence pointer plus the application's `modified` time. None when
        the application carries no pointer (nothing to cache)."""
        rid = doc.get("custom_latest_evidence")
        return f"{rid}|{doc.get('modified') or ''}" if rid else None

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

    def stamp(self, application_ref: str, doc: dict) -> str | None:
        """Latest record id for the application plus the number of stored records (a new evaluation changes it)."""
        recs = getattr(self.sink, "records", {})
        rid = getattr(self.sink, "latest_ids", {}).get(application_ref)
        if rid is None:
            mine = [k for k, r in recs.items() if r.get("application_ref") == application_ref and not r.get("is_simulation")]
            rid = mine[-1] if mine else None
        return f"{rid}|{len(recs)}" if rid else None

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

    def owned_doc(self, application_ref: str, session: Session) -> dict:
        """The Loan Application document, only when the session's applicant owns it."""
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
        self.owned_doc(application_ref, session)

    @obs.tool("get_application_summary")
    def get_application_summary(self, application_ref: str, session: Session) -> dict:
        doc = self.owned_doc(application_ref, session)
        return {"application_ref": application_ref, "loan_amount": doc.get("loan_amount"),
                "tenure_months": doc.get("repayment_periods") or doc.get("loan_tenure_months"),
                "product": doc.get("loan_product"), "status": doc.get("status"),
                "lifecycle_state": doc.get("custom_lifecycle_state")}

    @obs.tool("get_decision_evidence")
    def get_decision_evidence(self, application_ref: str, session: Session, cached: dict | None = None,
                              with_stamp: bool = False):
        """The latest stored decision. Ownership is re-checked on every call; the evidence record itself is re-read
        only when its version stamp differs from `cached` ({"application_ref", "stamp", "record"}), so a conversation
        reads its decision once and re-reads it only after a new evaluation. `with_stamp=True` returns
        (record, stamp, "hit"|"miss"|"none")."""
        doc = self.owned_doc(application_ref, session)
        stamp_fn = getattr(self.evidence, "stamp", None)
        stamp = stamp_fn(application_ref, doc) if stamp_fn else None
        if stamp and cached and cached.get("application_ref") == application_ref and cached.get("stamp") == stamp \
                and cached.get("record") is not None:
            rec, status = cached["record"], "hit"
        else:
            rec, status = self.evidence.latest(application_ref, doc), ("miss" if stamp else "none")
        sp = obs.current_span()
        if rec is not None:
            offer = rec.get("offer") or {}
            obs.set_attrs(sp, **{"decision.cache": status, "decision.outcome": rec.get("outcome") or rec.get("decision"),
                                 "decision.policy_version": (rec.get("policy") or {}).get("version"),
                                 "decision.reason_categories": list(rec.get("reason_categories") or []),
                                 "decision.offer_present": bool(offer.get("amount"))},
                          **obs.lf_meta(decision_cache=status, reason_categories=list(rec.get("reason_categories") or []),
                                        offer=({k: offer.get(k) for k in ("amount", "emi", "tenure_months", "counter_offer")}
                                               if offer.get("amount") and obs.capture_content() else None)))
        else:
            obs.set_attrs(sp, **{"decision.cache": status})
        return (rec, stamp, status) if with_stamp else rec

    @obs.tool("run_what_if")
    def run_what_if(self, application_ref: str, session: Session, changes: dict, record: dict | None = None) -> dict:
        """Hypothetical re-evaluation through the unchanged ZEN path, under the policy version the stored decision
        was made with (catalogue v2 = synthetic-v2, else the v1 files). Returns before/after per rule (server side)."""
        doc = self.owned_doc(application_ref, session)
        clean = {}
        for k, v in (changes or {}).items():
            if k not in LIMITS:
                raise InvalidWhatIf(f"unsupported what-if field (allowed: {', '.join(SCORED)})")
            try:
                fv = float(v)
            except (TypeError, ValueError):
                raise InvalidWhatIf(f"{k} must be a number") from None
            lo, hi = LIMITS[k]
            if not lo <= fv <= hi:
                raise InvalidWhatIf(f"{k} is outside the allowed range {lo}..{hi}")
            clean[k] = int(fv) if k in ("credit_score", "employment_months", "tenure_months") else fv
        if not clean:
            raise InvalidWhatIf("no hypothetical change given")
        record = record if record is not None else self.evidence.latest(application_ref, doc)
        version = ((record or {}).get("policy") or {}).get("version") or configured_policy_version()
        if version == V2_VERSION or (record or {}).get("decision") in V2_DECISIONS:
            return self._what_if_v2(application_ref, doc, record or {}, clean)
        if any(k in V2_ONLY_FIELDS for k in clean):
            raise InvalidWhatIf("estimates for a different loan amount or loan period aren't available for this application yet")
        before_vals = {k: doc.get(FIELD_TO_DOC[k], doc.get(k)) for k in SCORED}
        # A bureau-underwritten application may carry no local score; simulate from the value the
        # stored evaluation actually used, so the what-if is not an ERROR caused by a missing field.
        used = ((record or {}).get("inputs") or {}).get("values") or {}
        base = {FIELD_TO_DOC[k]: used[k] for k in SCORED
                if doc.get(FIELD_TO_DOC[k], doc.get(k)) in (None, "") and used.get(k) is not None}
        with obs.span("zen.simulate", kind="TOOL", **{"zen.engine": "zen-engine 2.1.2", "zen.fields": sorted(clean)}) as sp, _ZEN_LOCK:
            sim = simulate(application_ref, self.store, {FIELD_TO_DOC[k]: v for k, v in clean.items()}, base=base)
            _mark_sim(sp, sim["decision"], sim["policy"]["version"])
        after_doc = self.store.get(application_ref)
        unchanged = all(after_doc.get(FIELD_TO_DOC[k], after_doc.get(k)) == before_vals[k] for k in SCORED)
        return {"changes": clean, "simulated_decision": sim["decision"], "is_simulation": True,
                "rule_results": {e["rule_id"]: e["result"] for e in sim["rule_evaluations"]},
                "failed_reason_codes": sim["failed_reason_codes"], "record": sim,
                "original_record_unchanged": unchanged, "policy_version": sim["policy"]["version"],
                "sim_status": "error" if sim["decision"] in NOT_ESTIMABLE else "ok",
                "label": "hypothetical result under the synthetic prototype policy; not a decision and not a guarantee"}

    def _what_if_v2(self, application_ref: str, doc: dict, record: dict, clean: dict) -> dict:
        before = dict(doc)
        with obs.span("zen.simulate", kind="TOOL", **{"zen.engine": "zen-engine 2.1.2 (catalogue v2)",
                                                      "zen.fields": sorted(clean)}) as sp, _ZEN_LOCK:
            try:
                sim = simulate_v2(application_ref, self.store, record, clean)
            except ValueError as e:
                raise InvalidWhatIf(str(e)) from None
            _mark_sim(sp, sim["decision"], (sim.get("policy") or {}).get("version"), basis=sim.get("estimate_basis"))
        unchanged = self.store.get(application_ref) == before
        return {"changes": clean, "simulated_decision": sim["decision"], "is_simulation": True,
                "rule_results": {e["rule_id"]: e["result"] for e in sim.get("rule_evaluations") or []},
                "failed_reason_codes": sim.get("failed_reason_codes") or [], "record": sim,
                "reason_categories": list(sim.get("reason_categories") or []), "offer": sim.get("offer"),
                "original_record_unchanged": unchanged, "policy_version": (sim.get("policy") or {}).get("version"),
                "estimate_basis": sim.get("estimate_basis"),
                "sim_status": "error" if sim["decision"] in NOT_ESTIMABLE else "ok",
                "label": "hypothetical result under the synthetic prototype policy; not a decision and not a guarantee"}

    @obs.tool("improvement_plan")
    def improvement_plan(self, application_ref: str, session: Session, record: dict) -> dict:
        targets = counterfactual_targets(record)
        steps = []
        for t in targets:
            w = self.run_what_if(application_ref, session, {t["field"]: t["target"]}, record=record)
            steps.append({**t, "rule_passes_after_change": w["rule_results"].get(t["rule_id"]) == "PASS",
                          "simulated_decision_after_this_change_alone": w["simulated_decision"]})
        combined = None
        if targets:
            ch = {}
            for t in targets:
                ch[t["field"]] = t["target"] if t["field"] not in ch else ch[t["field"]]
            w = self.run_what_if(application_ref, session, ch, record=record)
            combined = {"changes": w["changes"], "simulated_decision": w["simulated_decision"],
                        "label": w["label"], "original_record_unchanged": w["original_record_unchanged"]}
        return {"steps": steps, "all_changes_together": combined}


def _mark_sim(sp, decision, version, basis=None):
    """zen.simulate span: the simulated decision and policy version; an ERROR / not-estimable result is an ERROR
    status and level, so a failed estimate never looks like a normal span (Langfuse gap 8)."""
    status = "error" if decision in NOT_ESTIMABLE else "ok"
    obs.set_attrs(sp, **{"zen.simulated_decision": decision, "zen.policy_version": version, "zen.sim_status": status,
                         "zen.estimate_basis": basis},
                  **({"langfuse.observation.level": "ERROR", "langfuse.observation.status_message": "simulation not estimable"}
                     if status == "error" else {}))
    if status == "error":
        obs.mark_error(sp, "simulation not estimable")


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
    def create(self, category: str, refs: list[str], message: str, request_id: str | None = None) -> str:
        """Queue a handoff without the applicant's words: hash and length only (P0d)."""
        ref = f"HO-{uuid.uuid4().hex[:10]}"
        with append_private(self.path) as f:
            f.write(json.dumps({"handoff_ref": ref, "category": category, "refs": refs, "request_id": request_id,
                                "message_sha256": hashlib.sha256(message.encode()).hexdigest(),
                                "message_chars": len(message), "created_at": time.time()}) + "\n")
        return ref


__all__ = ["DecisionTools", "PolicyTools", "FrappeEvidenceSource", "InMemoryEvidenceSource", "HandoffQueue",
           "NotAuthorized", "InvalidWhatIf", "UnknownApplication", "FrappeUnavailable", "citation_for"]
