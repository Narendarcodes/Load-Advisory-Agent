"""Hybrid policy retrieval: Qdrant (dense, EmbeddingGemma 2) + BM25, fused with (weighted) RRF,
optionally reranked by a cross-encoder.

Read-only. Governance filters are applied BEFORE ranking in every retriever:
  mode="current"    -> approval_status == approved
  mode="historical" -> approved + approved_historical (results keep their status so callers
                       can label them as historical)
  lender profile    -> regulator texts whose applies_to_entity matches the profile's entity type
                       (or "all"), plus documents of the profile's own lender_id only. Other
                       lenders' pages are never served under a lender profile.
  source types      -> optional allow-list (e.g. exclude lender_education marketing pages)
pending_review / registered_not_ingested content is never returned. Retrieval similarity
never decides eligibility; it only finds citable text.
"""
import re
import time
from dataclasses import dataclass
from pathlib import Path

from rank_bm25 import BM25Okapi

ALLOWED = {"current": {"approved"}, "historical": {"approved", "approved_historical"},
           "unfiltered": {"approved", "approved_historical", "pending_review"}}  # unfiltered: eval only
STOP = set("a an the of to in for on and or is are be by with as at from that this which what does do can i my me "
           "it its if any under shall must will how when who whom where why there their they them our your you".split())
TOKEN = re.compile(r"[a-z0-9₹]+(?:[.,][0-9]+)*")
ROOT = Path(__file__).resolve().parents[1]
NO_LENDER = "none"  # payload value for regulator / lender-neutral chunks (Qdrant cannot match null)


def tokens(text: str) -> list[str]:
    return [t for t in TOKEN.findall(text.lower()) if t not in STOP]


def doc_string(c: dict) -> str:
    return f"title: {c['title']} | text: {c['text']}"


# --------------------------------------------------------------------------- filters
@dataclass(frozen=True)
class RetrievalFilter:
    """What a query may see. Build one per request from the configured lender profile."""
    mode: str = "current"
    entity_type: str | None = None        # bank | nbfc | any | None (= no entity restriction)
    lender_id: str | None = None          # the profile's lender; other lenders' documents are excluded
    restrict_lenders: bool = False        # True under any lender profile (incl. lender-neutral ones)
    source_types: frozenset | None = None  # None = all source types

    def allows(self, c: dict) -> bool:
        if c.get("approval_status") not in ALLOWED[self.mode]:
            return False
        if self.restrict_lenders:
            lid = c.get("lender_id")
            if lid not in (None, NO_LENDER) and lid != self.lender_id:
                return False
        if self.entity_type not in (None, "any"):
            ents = c.get("applies_to_entity") or ["all"]
            if "all" not in ents and self.entity_type not in ents:
                return False
        if self.source_types is not None and (c.get("source_type") or c.get("authority")) not in self.source_types:
            return False
        return True


def load_profile(name: str | None = None, profiles_dir: Path | None = None) -> dict:
    import os
    import yaml
    name = name or os.environ.get("LENDER_PROFILE") or yaml.safe_load((ROOT / "config" / "rag.yaml").read_text())["lender_profile"]
    p = (profiles_dir or ROOT / "config" / "lender_profiles") / f"{name}.yaml"
    if not p.exists():
        raise FileNotFoundError(f"unknown lender profile {name!r} ({p})")
    return yaml.safe_load(p.read_text())


def profile_filter(profile: dict | None, mode: str = "current", source_types=None, include_education=False) -> RetrievalFilter:
    if profile is None:
        return RetrievalFilter(mode=mode, source_types=frozenset(source_types) if source_types else None)
    st = set(source_types or profile.get("default_source_types") or []) or None
    if st is not None and include_education:
        st.add("lender_education")
    return RetrievalFilter(mode=mode, entity_type=profile.get("entity_type"), lender_id=profile.get("lender_id"),
                           restrict_lenders=True, source_types=frozenset(st) if st else None)


def _as_filter(mode_or_filter) -> RetrievalFilter:
    return mode_or_filter if isinstance(mode_or_filter, RetrievalFilter) else RetrievalFilter(mode=mode_or_filter)


# --------------------------------------------------------------------------- retrievers
class BM25Index:
    def __init__(self, chunks):
        self.chunks = chunks
        self.bm25 = BM25Okapi([tokens(c["title"] + " " + c["text"]) for c in chunks])

    def search(self, query, mode="current", k=50):
        flt = _as_filter(mode)
        scores = self.bm25.get_scores(tokens(query))
        idx = [i for i in range(len(self.chunks)) if flt.allows(self.chunks[i])]
        idx.sort(key=lambda i: -scores[i])
        return [(self.chunks[i]["chunk_id"], float(scores[i])) for i in idx[:k]]


PAYLOAD_KEYS = ("chunk_id", "document_id", "approval_status", "effective_from", "effective_to", "jurisdiction",
                "document_type", "section", "source_type", "page_start", "page_end")


class DenseIndex:
    """Qdrant collection (embedded/local mode by default; pass url= for a server)."""

    def __init__(self, chunks, vectors, path=None, url=None, collection="policy_chunks_v2"):
        from qdrant_client import QdrantClient, models
        self.m = models
        self.client = QdrantClient(url=url) if url else QdrantClient(path=path) if path else QdrantClient(":memory:")
        self.col = collection
        if self.client.collection_exists(collection):
            self.client.delete_collection(collection)
        self.client.create_collection(collection, vectors_config=models.VectorParams(size=len(vectors[0]), distance=models.Distance.COSINE))
        for key in ("approval_status", "lender_id", "applies_to_entity", "source_type"):
            self.client.create_payload_index(collection, key, models.PayloadSchemaType.KEYWORD)

        def payload(c):
            p = {k: c.get(k) for k in PAYLOAD_KEYS}
            p["source_type"] = c.get("source_type") or c.get("authority")
            p["lender_id"] = c.get("lender_id") or NO_LENDER
            p["applies_to_entity"] = list(c.get("applies_to_entity") or ["all"])
            return p
        self.client.upsert(collection, points=[models.PointStruct(id=i, vector=list(map(float, v)), payload=payload(c))
                                               for i, (c, v) in enumerate(zip(chunks, vectors))])

    def qdrant_filter(self, flt: RetrievalFilter):
        m = self.m
        must = [m.FieldCondition(key="approval_status", match=m.MatchAny(any=sorted(ALLOWED[flt.mode])))]
        if flt.restrict_lenders:
            must.append(m.FieldCondition(key="lender_id", match=m.MatchAny(any=[NO_LENDER] + ([flt.lender_id] if flt.lender_id else []))))
        if flt.entity_type not in (None, "any"):
            must.append(m.FieldCondition(key="applies_to_entity", match=m.MatchAny(any=["all", flt.entity_type])))
        if flt.source_types is not None:
            must.append(m.FieldCondition(key="source_type", match=m.MatchAny(any=sorted(flt.source_types))))
        return m.Filter(must=must)

    def search(self, qvec, mode="current", k=50):
        flt = _as_filter(mode)
        res = self.client.query_points(self.col, query=list(map(float, qvec)), query_filter=self.qdrant_filter(flt), limit=k).points
        return [(p.payload["chunk_id"], float(p.score)) for p in res]


# --------------------------------------------------------------------------- fusion / rerank
def rrf(*ranked_lists, k=60, top=10):
    """Equal-weight reciprocal-rank fusion (phase-4 baseline)."""
    return weighted_rrf(ranked_lists, [1.0] * len(ranked_lists), k=k, top=top)


def weighted_rrf(ranked_lists, weights, k=60, top=10):
    """score(d) = sum_i w_i / (k + rank_i(d)). w_bm25 < w_dense stops BM25 from dragging good dense
    rankings down (the phase-4 negative result); weights and k are tuned on the dev split only."""
    score = {}
    for lst, w in zip(ranked_lists, weights):
        if not w:
            continue
        for rank, (cid, _) in enumerate(lst):
            score[cid] = score.get(cid, 0.0) + w / (k + rank + 1)
    return sorted(score.items(), key=lambda x: -x[1])[:top]


class CrossEncoderReranker:
    """BAAI/bge-reranker-v2-m3 (Apache-2.0) over the top-N fused candidates. GPU container only."""

    def __init__(self, model="BAAI/bge-reranker-v2-m3", device=None, max_length=512):
        import torch
        from sentence_transformers import CrossEncoder
        dev = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = CrossEncoder(model, device=dev, max_length=max_length, model_kwargs={"torch_dtype": torch.bfloat16})

    def score(self, query, chunks):
        if not chunks:
            return []
        return [float(s) for s in self.model.predict([(query, doc_string(c)) for c in chunks], batch_size=32)]


@dataclass
class HybridConfig:
    k: int = 60
    w_dense: float = 1.0
    w_bm25: float = 1.0
    depth: int = 50          # per-retriever candidates
    rerank_candidates: int = 0  # 0 = no rerank


class HybridRetriever:
    def __init__(self, bm25: BM25Index, dense: DenseIndex, embed_query, reranker=None, chunks_by_id=None,
                 config: HybridConfig | None = None):
        self.bm25, self.dense, self.embed_query = bm25, dense, embed_query
        self.reranker, self.by_id = reranker, chunks_by_id or {c["chunk_id"]: c for c in bm25.chunks}
        self.cfg = config or HybridConfig()

    def search(self, query, mode="current", k=10):
        """`mode` may be "current"/"historical" or a RetrievalFilter (lender profile aware)."""
        flt, cfg = _as_filter(mode), self.cfg
        t = time.perf_counter()
        qv = self.embed_query(query)
        d = self.dense.search(qv, flt, cfg.depth)
        b = self.bm25.search(query, flt, cfg.depth)
        fused = weighted_rrf([d, b], [cfg.w_dense, cfg.w_bm25], k=cfg.k, top=max(k, cfg.rerank_candidates))
        rerank_top = None
        if self.reranker is not None and cfg.rerank_candidates:
            cand = [cid for cid, _ in fused[:cfg.rerank_candidates]]
            scores = self.reranker.score(query, [self.by_id[c] for c in cand])
            fused = sorted(zip(cand, scores), key=lambda x: -x[1])
            rerank_top = fused[0][1] if fused else None
        return {"results": fused[:k], "dense": d[:k], "bm25": b[:k], "top_dense_score": d[0][1] if d else 0.0,
                "top_bm25_score": b[0][1] if b else 0.0, "top_rerank_score": rerank_top,
                "filter": flt, "latency_ms": (time.perf_counter() - t) * 1000}


def load_rag_config(path: Path | None = None) -> tuple[HybridConfig, dict, str]:
    """(HybridConfig, lender profile, mode) from config/rag.yaml (+ env LENDER_PROFILE override)."""
    import yaml
    cfg = yaml.safe_load((path or ROOT / "config" / "rag.yaml").read_text())
    f, r = cfg.get("fusion", {}), cfg.get("rerank", {})
    hc = HybridConfig(k=f.get("k", 60), w_dense=f.get("w_dense", 1.0), w_bm25=f.get("w_bm25", 1.0),
                      rerank_candidates=r.get("candidates", 0) if r.get("enabled") else 0)
    return hc, load_profile(None), cfg.get("mode", "current")
