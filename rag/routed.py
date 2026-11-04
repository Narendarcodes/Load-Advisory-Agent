"""Q-16: route policy questions across the two G1 collections by intent, configured by env.

    AGENT_RAG_COLLECTIONS=saral_nbfc_policy,rbi_regulatory   (unset = the single-collection retriever, as before)

Each collection is its own read-only retriever over `<LOAN_POLICY_DIR>/<collection>/chunks.jsonl` and the Qdrant
collection of the same name. `route()` picks the collections a question needs: regulatory topics (RBI, grievance,
ombudsman, KFS, fair practice, recovery, cooling-off, interest-rate disclosure) search `rbi_regulatory` first;
product questions search `saral_nbfc_policy`; anything else searches both. Results are merged by rank and
relabelled P1..Pk, so citations stay one numbered list.
"""
from __future__ import annotations

import os
import re

COLLECTIONS_ENV = "AGENT_RAG_COLLECTIONS"
PRODUCT, REGULATORY = "saral_nbfc_policy", "rbi_regulatory"

_REG = re.compile(
    r"\b(rbi|reserve bank|regulat\w*|grievance|complain\w*|ombudsman|kfs|key fact\w*|fair practice\w*|recovery agent\w*|"
    r"harass\w*|cooling[- ]?off|look[- ]?up period|apr|annual percentage|penal (charge|interest)|foreclos\w*|prepayment charge\w*|"
    r"privacy|data protection|consent|digital lending|lsp|nodal officer|rights?)\b|"
    r"आरबीआई|शिकायत|లోకపాల్|ఫిర్యాదు", re.I)
_PROD = re.compile(
    r"\b(eligib\w*|document\w*|interest rate|rates?|fees?|charges?|emi|tenure|amount|apply|application|salary|cibil|"
    r"credit score|wedding|education|renovation|medical|personal loan|disburs\w*)\b|पात्रता|दस्तावेज़|అర్హత|పత్రాలు", re.I)


def configured_collections(env=None) -> list[str]:
    env = os.environ if env is None else env
    return [c.strip() for c in (env.get(COLLECTIONS_ENV) or "").split(",") if c.strip()]


def route(query: str, available: list[str]) -> list[str]:
    """Collections to search, most relevant first. Only names in `available` are returned."""
    reg, prod = bool(_REG.search(query or "")), bool(_PROD.search(query or ""))
    if reg and not prod:
        order = [REGULATORY]
    elif prod and not reg:
        order = [PRODUCT]
    else:
        order = [REGULATORY, PRODUCT] if reg else [PRODUCT, REGULATORY]
    picked = [c for c in order if c in available]
    return picked or list(available)


class RoutedPolicyTools:
    """Same interface as agent.tools.PolicyTools (`search(query, historical) -> (passages, meta)`)."""

    def __init__(self, tools_by_collection: dict, k: int = 5):
        if not tools_by_collection:
            raise ValueError("at least one collection is required")
        self.by_collection, self.k = dict(tools_by_collection), k
        first = next(iter(self.by_collection.values()))
        self.profile = getattr(first, "profile", None)

    def search(self, query: str, historical: bool = False):
        cols = route(query, list(self.by_collection))
        lists, metas = [], {}
        for c in cols:
            passages, meta = self.by_collection[c].search(query, historical=historical)
            lists.append([(c, p) for p in passages])
            metas[c] = meta
        merged, i = [], 0
        while len(merged) < self.k and any(i < len(lst) for lst in lists):
            for lst in lists:  # round-robin by rank, the routed-first collection leads
                if i < len(lst) and len(merged) < self.k:
                    merged.append(lst[i])
            i += 1
        out = []
        for n, (c, p) in enumerate(merged, 1):
            label = f"P{n}"
            cit = dict(p.get("citation") or {})
            if "label" in cit:
                cit["label"] = label
            out.append({**p, "label": label, "collection": c, "citation": cit})
        meta = {"latency_ms": round(sum(m.get("latency_ms") or 0 for m in metas.values()), 1),
                "top_rerank_score": max((m.get("top_rerank_score") for m in metas.values()
                                         if m.get("top_rerank_score") is not None), default=None),
                "mode": next(iter(metas.values())).get("mode") if metas else None, "collections": cols}
        return out, meta


def load_routed_policy_tools(load_one, collections: list[str], policy_dir: str, **kw):
    """Build one retriever per collection with `load_one(policy_dir=..., **kw)` (agent.runtime.load_policy_tools),
    each over `<policy_dir>/<collection>` and the Qdrant collection of that name."""
    tools, profile = {}, None
    prev = os.environ.get("AGENT_QDRANT_COLLECTION")
    try:
        for c in collections:
            os.environ["AGENT_QDRANT_COLLECTION"] = c
            tools[c], profile = load_one(policy_dir=os.path.join(policy_dir, c), **kw)
    finally:
        if prev is None:
            os.environ.pop("AGENT_QDRANT_COLLECTION", None)
        else:
            os.environ["AGENT_QDRANT_COLLECTION"] = prev
    return RoutedPolicyTools(tools), profile
