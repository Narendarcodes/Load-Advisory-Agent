"""Wiring: build the agent against (a) the live Frappe Lending stack or (b) offline synthetic stores.

Live:    FrappeClient (system of record) + FrappeEvidenceSource (stored `Loan Decision Evidence`)
         + hybrid/rerank policy retriever loaded from LOAN_POLICY_DIR (GPU container) + gpt-oss-120b.
Offline: MockStore / PersonaStore, decided ONCE by the conventional workflow (process_application ->
         ZEN -> InMemoryEvidenceSink) before the agent sees them. The agent itself never decides.
"""
import json
import os
from pathlib import Path

import requests

from decision_engine.paths import repo_root
from loan_advisory.agent.checkpoint import build_checkpointer
from loan_advisory.agent.graph import AdvisoryAgent
from loan_advisory.agent.llm import ChatLLM
from loan_advisory.agent.tools import (DecisionTools, FrappeEvidenceSource, HandoffQueue, InMemoryEvidenceSource,
                                       PolicyTools)
from loan_advisory.application.lifecycle import process_application
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink, InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import FrappeClient, MockStore, UnknownApplication

PERSONAS = repo_root() / "data" / "synthetic" / "personas" / "personas_v1_narrated.jsonl"


class PersonaStore:
    """Read-only store over the synthetic personas (same doc shape as Frappe Loan Application)."""

    def __init__(self, rows: list[dict] | None = None, path: Path = PERSONAS):
        rows = rows if rows is not None else [json.loads(l) for l in path.open(encoding="utf-8")]
        self.rows = {r["application_id"]: r for r in rows}
        self._apps = {r["application_id"]: {
            "name": r["application_id"], "applicant": r["applicant_id"], "loan_product": "SYNTHETIC-PERSONAL-LOAN",
            "loan_amount": r["loan_amount"], "repayment_periods": r["loan_tenure_months"],
            "custom_monthly_income": r["monthly_income"], "custom_monthly_obligations": r["monthly_obligations"],
            "custom_credit_score": r["credit_score"], "custom_employment_months": r["employment_months"],
            "status": "Open"} for r in rows}

    def get(self, application_id: str) -> dict:
        try:
            return dict(self._apps[application_id])
        except KeyError:
            raise UnknownApplication(f"unknown application: {application_id}")


def decide_offline(store, refs) -> InMemoryEvidenceSink:
    """Run the CONVENTIONAL workflow (not the agent) so there is recorded evidence to explain."""
    sink = InMemoryEvidenceSink(store)
    for ref in refs:
        process_application(ref, store, sink)
    return sink


def frappe_resolve(client: FrappeClient, external_ref: str) -> dict | None:
    r = requests.get(f"{client.base_url}/api/resource/Loan Application", headers=client._headers(), timeout=15,
                     params={"filters": json.dumps([["custom_external_ref", "=", external_ref]]),
                             "fields": json.dumps(["name", "applicant", "custom_external_ref", "custom_lifecycle_state"])})
    rows = r.json().get("data", []) if r.ok else []
    return rows[0] if rows else None


def load_chunks(policy_dir: str | Path) -> list[dict]:
    with (Path(policy_dir) / "chunks.jsonl").open(encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def load_policy_tools(policy_dir: str | None = None, profile_name: str | None = None, device: str | None = None):
    """Hybrid (EmbeddingGemma 2 / Qdrant + BM25, weighted RRF) + bge-reranker-v2-m3, lender-profile filtered."""
    import torch
    from sentence_transformers import SentenceTransformer

    from rag.index_meta import index_identity
    from rag.retrieve import (BM25Index, CrossEncoderReranker, DenseIndex, DOC_PREFIX, HybridRetriever, doc_string,
                              load_profile, load_rag_config, profile_filter)

    pdir = Path(policy_dir or os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"))
    chunks = load_chunks(pdir)
    by_id = {c["chunk_id"]: c for c in chunks}
    cfg, profile, mode = load_rag_config()
    if profile_name:
        profile = load_profile(profile_name)
    dev = device or os.environ.get("AGENT_RETRIEVER_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
    frac = os.environ.get("AGENT_GPU_FRACTION")  # cap this process's VRAM on the shared GPU (e.g. 0.016 = ~3 GB on MI300X)
    if frac and dev == "cuda":
        torch.cuda.set_per_process_memory_fraction(float(frac))
    model_name = os.environ.get("EMBED_MODEL", "google/embeddinggemma-2")
    emb = SentenceTransformer(model_name, device=dev, model_kwargs={"torch_dtype": torch.bfloat16})
    query_prompt = "QuestionAnswering"
    identity = index_identity(embed_model=model_name,
                              dimension=getattr(emb, "get_sentence_embedding_dimension", lambda: None)(),
                              doc_prefix=DOC_PREFIX, query_prompt=query_prompt,
                              query_prompt_text=(getattr(emb, "prompts", None) or {}).get(query_prompt))
    qdir = Path(os.environ.get("AGENT_QDRANT_DIR", str(pdir / "qdrant_v2")))
    if (qdir / "collection").exists():
        dense = _open_dense(str(qdir), chunks, identity)
    else:
        vecs = emb.encode([doc_string(c) for c in chunks], batch_size=32, normalize_embeddings=True)
        dense = DenseIndex(chunks, vecs, path=str(qdir), meta=identity)
    reranker = CrossEncoderReranker(device=dev) if cfg.rerank_candidates else None
    retr = HybridRetriever(BM25Index(chunks), dense, lambda q: emb.encode(q, prompt_name=query_prompt, normalize_embeddings=True),
                           reranker=reranker, chunks_by_id=by_id, config=cfg)
    if dev == "cuda":
        _search = retr.search

        def search_and_release(*a, **kw):  # return cached blocks to the shared GPU after each query
            try:
                return _search(*a, **kw)
            finally:
                torch.cuda.empty_cache()
        retr.search = search_and_release
    tools = PolicyTools(retr, by_id, profile, profile_filter(profile, mode), hfilter=profile_filter(profile, "historical"))
    tools.search("warm-up: how do I raise a grievance?")  # first query pays CUDA/kernel warm-up, not the applicant
    return tools, profile


def _open_dense(path: str, chunks: list[dict], identity: dict):
    from qdrant_client import QdrantClient, models

    from rag.index_meta import validate_collection, validate_index
    from rag.retrieve import DenseIndex
    d = DenseIndex.__new__(DenseIndex)  # reuse the read path (qdrant_filter/search) on an existing collection
    d.m, d.client, d.col = models, QdrantClient(path=path), "policy_chunks_v2"
    try:
        validate_index(path, chunks=chunks, identity=identity, collection=d.col)
        validate_collection(d.client, d.col, dimension=identity.get("dimension"), distance=identity["distance"],
                            chunk_ids={c["chunk_id"] for c in chunks})
    except Exception:
        d.client.close()
        raise
    return d


def build_live_agent(policy_tools=None, profile=None, llm=None) -> tuple[AdvisoryAgent, FrappeClient]:
    client = FrappeClient()
    sink = FrappeEvidenceSink()  # dedicated Evidence Service credential, never the read client
    tools = DecisionTools(client, FrappeEvidenceSource(sink))
    agent = AdvisoryAgent(tools, llm or ChatLLM.from_env(), policy_tools=policy_tools, handoff=HandoffQueue(),
                          profile=profile, checkpointer=build_checkpointer())
    return agent, client


def build_offline_agent(store=None, refs=None, llm=None, policy_tools=None, profile=None) -> tuple[AdvisoryAgent, object, object]:
    store = store or MockStore()
    refs = refs if refs is not None else list(store._apps)
    sink = decide_offline(store, refs)
    tools = DecisionTools(store, InMemoryEvidenceSource(sink))
    return (AdvisoryAgent(tools, llm or ChatLLM.from_env(), policy_tools=policy_tools, handoff=HandoffQueue(),
                          profile=profile, checkpointer=build_checkpointer()), store, sink)
