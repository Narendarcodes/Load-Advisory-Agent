"""Multi-query retrieval: query decomposition, a soft collection router, and the merge of per-query reranked lists.

Why: the DeepEval RAG baseline (PR #55) missed contextual recall (0.796 < 0.80), mostly on multi-hop questions (0.593)
and Telugu (0.717). A multi-hop question ("is there a separate wedding limit, and how long can I repay?") needs chunks
for each part, but one reranked list fills the 5 slots with the part the reranker likes best. A Telugu or Hindi
question gets a weak BM25 signal.

How:
- DECOMPOSE_PROMPT asks an LLM for up to 3 short English search queries, one per fact the question needs (a Hindi or
  Telugu question always gets an English rewrite). The LLM runs OUTSIDE the retriever, before retrieval (in the agent
  process, or in the Hark sandbox for evals); the RAG-only Kaggle kernel never runs an LLM. parse_subqueries() cleans
  its output.
- Each query (the original first) is searched in each collection with the usual hybrid + reranker stack.
- route_collections() is a soft keyword router: when a question clearly belongs to one collection (RBI regulation vs
  the lender's own pages) the other collection's reranker scores are scaled down, never dropped.
- merge_multi_query() keeps the original question's top hits first, then takes turns across the sub-queries so each
  part of the question gets a slot; a sub-query hit below min_score never displaces an original hit.
Pure functions, no model loading: unit-tested in tests/test_rag_multiquery.py.
"""
import json
import re

NBFC, RBI = "saral_nbfc_policy", "rbi_regulatory"

DECOMPOSE_PROMPT = """You prepare search queries for a personal-loan policy search over a lender's public pages and RBI rules.
Question (the applicant may write in English, Hindi, Telugu or a mix): {question}
{history}
Write up to 3 short English search queries (4-12 words each), one for each separate fact the question needs.
- If the question asks about two or more things (for example an amount limit AND a repayment period, or a fee AND
  how long it is paid), write one query per thing.
- If the question is not in English, always include one query that is a faithful English rewrite of the whole question.
- If the question is in English and asks only one thing, return an empty list.
- Keep the lender's terms (EMI, foreclosure, part-prepayment, processing fee, CIBIL, KFS, Ombudsman) and any names.
- Do not answer the question, and do not add facts that are not in it.
Return JSON only: {{"queries": ["...", "..."]}}"""

_RBI_CUES = re.compile(
    r"\b(rbi|reserve bank|ombudsman|regulat\w*|directions?|circular|master direction|cooling[- ]?off|look[- ]?up|"
    r"digital lend\w*|key fact\w*|kfs|recovery agents?|harass\w*|legally|the law|by law|rights?|"
    r"credit information compan\w*|cic|penal charges? rules?)\b", re.I)
_NBFC_CUES = re.compile(
    r"\b(bajaj|processing fee|fees?|charges?|interest rates?|rate of interest|emi|tenure|wedding|marriage|medical|"
    r"education|renovation|eligib\w*|cibil|credit score|salary|salaried|documents?|flexi|dropline|hybrid|foreclos\w*|"
    r"pre-?pay\w*|part-?pre-?pay\w*|apply|application|disburs\w*|loan amount|minimum amount|maximum amount|"
    r"how much|insta|app)\b", re.I)


def parse_subqueries(raw: str, original: str, max_queries: int = 3) -> list[str]:
    """Clean an LLM decomposition reply: JSON {"queries": [...]} (code fences or prose around it tolerated). Drops
    empties, duplicates (case-insensitive) and copies of the original question; caps the list. Any parse failure
    yields [] so retrieval falls back to the original question alone."""
    try:
        m = re.search(r"\{.*\}", raw or "", re.S)
        qs = json.loads(m.group(0) if m else raw).get("queries")
    except (ValueError, AttributeError, TypeError):
        return []
    if not isinstance(qs, list):
        return []
    seen, out = {" ".join(str(original).split()).casefold()}, []
    for q in qs:
        q = " ".join(str(q).split()) if isinstance(q, str) else ""
        if not q or q.casefold() in seen:
            continue
        seen.add(q.casefold())
        out.append(q)
        if len(out) == max_queries:
            break
    return out


def route_collections(query: str, demote: float = 0.7) -> dict[str, float]:
    """Soft router: weight 1.0 for a collection the question points at, `demote` for the other one when the question
    points at exactly one collection; both 1.0 when it points at both or neither."""
    rbi, nbfc = bool(_RBI_CUES.search(query)), bool(_NBFC_CUES.search(query))
    if rbi and not nbfc:
        return {NBFC: demote, RBI: 1.0}
    if nbfc and not rbi:
        return {NBFC: 1.0, RBI: demote}
    return {NBFC: 1.0, RBI: 1.0}


def merge_collections(per_collection: dict[str, list], weights: dict[str, float] | None = None) -> list[tuple[str, float]]:
    """One ranked list from per-collection reranked hits [(chunk_id, score)], scores scaled by router weights.
    The reranker is the same model for both collections, so its scores are comparable."""
    out = []
    for col, hits in per_collection.items():
        w = (weights or {}).get(col, 1.0)
        out += [(cid, float(s) * w) for cid, s in hits]
    return sorted(out, key=lambda x: -x[1])


def merge_multi_query(ranked: list[list], k: int = 5, original_first: int = 1,
                      min_score: float = 0.0) -> list[tuple[str, float]]:
    """Final top k from per-query ranked lists (ranked[0] = the original question).

    The original's top `original_first` hits go first; then the lists take turns (original, sub-query 1, 2, ...), each
    adding its best chunk not yet chosen. Sub-query hits scoring below `min_score` are skipped. A chunk keeps the best
    score it got from any query. With a single list this is exactly its top k."""
    best = {}
    for lst in ranked:
        for cid, s in lst:
            best[cid] = max(best.get(cid, float("-inf")), float(s))
    chosen, pos = [], [0] * len(ranked)

    def take(i):
        lst = ranked[i]
        while pos[i] < len(lst):
            cid, s = lst[pos[i]]
            pos[i] += 1
            if cid in chosen or (i > 0 and float(s) < min_score):
                continue
            chosen.append(cid)
            return True
        return False

    if ranked:
        for _ in range(min(original_first, k)):
            take(0)
    while len(chosen) < k:
        progressed = False
        for i in range(len(ranked)):
            if len(chosen) >= k:
                break
            progressed = take(i) or progressed
        if not progressed:
            break
    return [(cid, best[cid]) for cid in chosen]
