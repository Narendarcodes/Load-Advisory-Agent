"""Hybrid policy retrieval: Qdrant (dense, EmbeddingGemma 2) + BM25, fused with RRF.

Read-only. Governance filter is applied BEFORE ranking in both retrievers:
  mode="current"    -> approval_status == approved
  mode="historical" -> approved + approved_historical (results keep their status so callers
                       can label them as historical)
pending_review / registered_not_ingested content is never returned. Retrieval similarity
never decides eligibility; it only finds citable text.
"""
import re
import time

from rank_bm25 import BM25Okapi

ALLOWED = {"current": {"approved"}, "historical": {"approved", "approved_historical"},
           "unfiltered": {"approved", "approved_historical", "pending_review"}}  # unfiltered: eval only
STOP = set("a an the of to in for on and or is are be by with as at from that this which what does do can i my me "
           "it its if any under shall must will how when who whom where why there their they them our your you".split())
TOKEN = re.compile(r"[a-z0-9₹]+(?:[.,][0-9]+)*")


def tokens(text: str) -> list[str]:
    return [t for t in TOKEN.findall(text.lower()) if t not in STOP]


def doc_string(c: dict) -> str:
    return f"title: {c['title']} | text: {c['text']}"


class BM25Index:
    def __init__(self, chunks):
        self.chunks = chunks
        self.bm25 = BM25Okapi([tokens(c["title"] + " " + c["text"]) for c in chunks])

    def search(self, query, mode="current", k=50):
        allowed = ALLOWED[mode]
        scores = self.bm25.get_scores(tokens(query))
        idx = [i for i in range(len(self.chunks)) if self.chunks[i]["approval_status"] in allowed]
        idx.sort(key=lambda i: -scores[i])
        return [(self.chunks[i]["chunk_id"], float(scores[i])) for i in idx[:k]]


class DenseIndex:
    """Qdrant collection (embedded/local mode by default; pass url= for a server)."""

    def __init__(self, chunks, vectors, path=None, url=None, collection="policy_chunks_v1"):
        from qdrant_client import QdrantClient, models
        self.m = models
        self.client = QdrantClient(url=url) if url else QdrantClient(path=path) if path else QdrantClient(":memory:")
        self.col = collection
        if self.client.collection_exists(collection):
            self.client.delete_collection(collection)
        self.client.create_collection(collection, vectors_config=models.VectorParams(size=len(vectors[0]), distance=models.Distance.COSINE))
        self.client.create_payload_index(collection, "approval_status", models.PayloadSchemaType.KEYWORD)
        self.client.upsert(collection, points=[
            models.PointStruct(id=i, vector=list(map(float, v)), payload={k: c[k] for k in (
                "chunk_id", "document_id", "approval_status", "effective_from", "effective_to", "jurisdiction",
                "document_type", "section")}) for i, (c, v) in enumerate(zip(chunks, vectors))])

    def search(self, qvec, mode="current", k=50):
        flt = self.m.Filter(must=[self.m.FieldCondition(key="approval_status", match=self.m.MatchAny(any=sorted(ALLOWED[mode])))])
        res = self.client.query_points(self.col, query=list(map(float, qvec)), query_filter=flt, limit=k).points
        return [(p.payload["chunk_id"], float(p.score)) for p in res]


def rrf(*ranked_lists, k=60, top=10):
    score = {}
    for lst in ranked_lists:
        for rank, (cid, _) in enumerate(lst):
            score[cid] = score.get(cid, 0.0) + 1.0 / (k + rank + 1)
    return sorted(score.items(), key=lambda x: -x[1])[:top]


class HybridRetriever:
    def __init__(self, bm25: BM25Index, dense: DenseIndex, embed_query):
        self.bm25, self.dense, self.embed_query = bm25, dense, embed_query

    def search(self, query, mode="current", k=10):
        t = time.perf_counter()
        qv = self.embed_query(query)
        d = self.dense.search(qv, mode)
        b = self.bm25.search(query, mode)
        fused = rrf(d, b, top=k)
        return {"results": fused, "dense": d[:k], "bm25": b[:k], "top_dense_score": d[0][1] if d else 0.0,
                "top_bm25_score": b[0][1] if b else 0.0, "latency_ms": (time.perf_counter() - t) * 1000}
