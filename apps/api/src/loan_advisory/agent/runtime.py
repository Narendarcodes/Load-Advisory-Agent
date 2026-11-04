"""Wiring: build the agent against (a) the live Frappe Lending stack or (b) offline synthetic stores.

Live:    ReadOnlyFrappeApplication + FrappeEvidenceReader (two projected reads on one read-only identity)
         + hybrid/rerank policy retriever loaded from LOAN_POLICY_DIR (GPU container) + gpt-oss-120b.
Offline: MockStore / PersonaStore read through their read-only views, decided ONCE by the conventional
         workflow (process_application -> ZEN -> InMemoryEvidenceSink) before the agent sees them.

Either way `DecisionTools` refuses a write-capable dependency, so the agent explains decisions and
cannot make one (Phase 1 security boundary B).
"""
import json
import os
from pathlib import Path

from decision_engine.paths import repo_root
from loan_advisory.agent.checkpoint import build_checkpointer
from loan_advisory.agent.graph import AdvisoryAgent
from loan_advisory.agent.llm import ChatLLM
from loan_advisory.agent.tools import (DecisionTools, FrappeEvidenceSource, HandoffQueue, InMemoryEvidenceSource,
                                       PolicyTools)
from loan_advisory.application.lifecycle import process_application
from loan_advisory.infrastructure.evidence_store import FrappeEvidenceReader, InMemoryEvidenceSink
from loan_advisory.infrastructure.frappe_adapter import (MockStore, ReadOnlyDocumentStore, ReadOnlyFrappeApplication,
                                                         UnknownApplication, read_only_view, resolve_application)

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

    def reader(self) -> ReadOnlyDocumentStore:
        """The agent's view: the document mapping, with no store object behind it to write through."""
        return ReadOnlyDocumentStore(self._apps)


def decide_offline(store, refs) -> InMemoryEvidenceSink:
    """Run the CONVENTIONAL workflow (not the agent) so there is recorded evidence to explain."""
    sink = InMemoryEvidenceSink(store)
    for ref in refs:
        process_application(ref, store, sink)
    return sink


def frappe_resolve(client, external_ref: str) -> dict | None:
    """Map a borrower-visible reference to a Loan Application through any Frappe identity or read view."""
    return resolve_application(client.base_url, client._headers(), external_ref)


def load_chunks(policy_dir: str | Path) -> list[dict]:
    with (Path(policy_dir) / "chunks.jsonl").open(encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def load_policy_tools(policy_dir: str | None = None, profile_name: str | None = None, device: str | None = None):
    """Hybrid (EmbeddingGemma 2 / Qdrant + BM25, weighted RRF) + bge-reranker-v2-m3, lender-profile filtered."""
    from rag.routed import configured_collections, load_routed_policy_tools

    cols = configured_collections()
    if cols and policy_dir is None:  # Q-16: one retriever per G1 collection, routed by intent
        return load_routed_policy_tools(load_policy_tools, cols, os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"),
                                        profile_name=profile_name, device=device)
    import torch
    from sentence_transformers import SentenceTransformer

    from rag.dense_read import ReadOnlyDenseSearch
    from rag.index_meta import index_identity
    from rag.retrieve import (BM25Index, CrossEncoderReranker, DOC_PREFIX, HybridRetriever, load_profile,
                              load_rag_config, profile_filter)

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
    # The serving process opens an index that already exists; it never embeds or builds one. Index
    # management lives in scripts/policy/, and `AGENT_QDRANT_URL` switches between the local collection
    # and a Qdrant Server without changing what a query does.
    dense = ReadOnlyDenseSearch.open(chunks, identity, default_dir=str(pdir / "qdrant_v2"))
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


def build_live_agent(policy_tools=None, profile=None, llm=None) -> tuple[AdvisoryAgent, ReadOnlyFrappeApplication]:
    """The live agent reads Frappe and nothing else, on one read-only identity.

    Both readers take `FRAPPE_*`: applications as a projected list read, evidence as a projected read of
    the stored record. `FrappeEvidenceSink` and the `EVIDENCE_FRAPPE_*` ingest credential are not
    constructed here at all — the method the sink calls requires the Evidence Service role, so using it
    for reads would have left a write-capable secret inside the conversational process.
    """
    reader = ReadOnlyFrappeApplication()
    tools = DecisionTools(reader, FrappeEvidenceSource(FrappeEvidenceReader()))
    agent = AdvisoryAgent(tools, llm or ChatLLM.from_env(), policy_tools=policy_tools, handoff=HandoffQueue(),
                          profile=profile, checkpointer=build_checkpointer())
    return agent, reader


def build_offline_agent(store=None, refs=None, llm=None, policy_tools=None, profile=None) -> tuple[AdvisoryAgent, object, object]:
    store = store or MockStore()
    refs = refs if refs is not None else list(store._apps)
    sink = decide_offline(store, refs)
    tools = DecisionTools(read_only_view(store), InMemoryEvidenceSource(sink))
    return (AdvisoryAgent(tools, llm or ChatLLM.from_env(), policy_tools=policy_tools, handoff=HandoffQueue(),
                          profile=profile, checkpointer=build_checkpointer()), store, sink)
