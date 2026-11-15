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
from loan_advisory.agent.model_manager import (
    MODEL_PARAMETER_COUNTS, ModelMemoryConfigurationError,
    ModelMemoryRequirement, ModelManager,
)
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


DEFAULT_EMBED_MODEL = "google/embeddinggemma-2"
DEFAULT_RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
MODEL_MANAGER = ModelManager()


class _SharedCrossEncoderReranker:
    """Keep the existing reranker scoring contract around a shared CrossEncoder."""

    def __init__(self, model, doc_string, batch_size: int = 32):
        self.model, self._doc_string, self.batch_size = model, doc_string, batch_size

    def score(self, query, chunks):
        if not chunks:
            return []
        pairs = [(query, self._doc_string(chunk)) for chunk in chunks]
        return [float(score) for score in self.model.predict(pairs, batch_size=self.batch_size)]


def _check_embedding_index_compatibility(policy_dir: Path, model_id: str,
                                         revision: str | None) -> None:
    """Require verifiable index provenance before loading model weights."""
    from rag.dense_read import select_dense_backend
    from rag.index_meta import (IndexCompatibilityError, load_index_meta,
                                validate_model_revision)
    backend = select_dense_backend(default_dir=str(policy_dir / "qdrant_v2"))
    if backend.mode != "embedded":
        raise IndexCompatibilityError(
            f"Qdrant Server collection {backend.collection!r} has no local "
            "index_compat.json sidecar; embedding model revision provenance "
            "cannot be verified from the server, so refusing to use it"
        )
    meta = load_index_meta(backend.location)
    indexed_model = meta.get("embed_model")
    if indexed_model != model_id:
        raise IndexCompatibilityError(
            f"configured embedding model ID {model_id!r} does not match index "
            f"metadata embed_model={indexed_model!r} at {backend.location}"
        )
    if not isinstance(meta.get("dimension"), int) or meta["dimension"] <= 0:
        raise IndexCompatibilityError(
            f"index metadata at {backend.location} is missing a valid embedding "
            "dimension; refusing to claim model compatibility"
        )
    indexed_revision = meta.get("model_revision")
    if not isinstance(indexed_revision, str) or not indexed_revision:
        raise IndexCompatibilityError(
            f"index metadata at {backend.location} is missing model_revision; "
            "original embedding revision is UNKNOWN, so refusing to use this index"
        )
    try:
        validate_model_revision(indexed_revision)
    except IndexCompatibilityError as exc:
        raise IndexCompatibilityError(
            f"index metadata at {backend.location} has an invalid model_revision "
            f"{indexed_revision!r}: {exc}; refusing to use this index"
        ) from exc
    if revision is None:
        raise IndexCompatibilityError(
            f"serving embedding revision is unpinned/UNKNOWN for model {model_id!r}; "
            f"cannot compare it with index model_revision={indexed_revision!r}, "
            "so refusing to use this index"
        )
    try:
        validate_model_revision(revision)
    except IndexCompatibilityError as exc:
        raise IndexCompatibilityError(
            f"configured embedding revision {revision!r} is not an immutable commit ID: "
            f"{exc}; refusing to use this index"
        ) from exc
    if indexed_revision.lower() != revision.lower():
        raise IndexCompatibilityError(
            f"embedding revision mismatch: index model_revision={indexed_revision!r}, "
            f"configured revision={revision!r}"
        )


def load_policy_tools(policy_dir: str | None = None, profile_name: str | None = None,
                      device: str | None = None):
    """Hybrid (EmbeddingGemma 2 / Qdrant + BM25, weighted RRF) + BGE reranker."""
    from rag.routed import configured_collections, load_routed_policy_tools
    cols = configured_collections()
    if cols and policy_dir is None:  # one retriever per G1 collection, routed by intent
        return load_routed_policy_tools(load_policy_tools, cols,
                                        os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"),
                                        profile_name=profile_name, device=device)
    import torch
    from sentence_transformers import SentenceTransformer
    from rag.dense_read import ReadOnlyDenseSearch
    from rag.index_meta import index_identity
    from rag.retrieve import (BM25Index, DOC_PREFIX, HybridRetriever, doc_string, load_profile,
                              load_rag_config, profile_filter)
    pdir = Path(policy_dir or os.environ.get("LOAN_POLICY_DIR", "/root/hx/loan/policy"))
    chunks = load_chunks(pdir)
    by_id = {c["chunk_id"]: c for c in chunks}
    cfg, profile, mode = load_rag_config()
    if profile_name:
        profile = load_profile(profile_name)
    dev = device or os.environ.get("AGENT_RETRIEVER_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
    frac = os.environ.get("AGENT_GPU_FRACTION")  # existing GPU cap; no new GPU path is introduced
    if frac and dev == "cuda":
        torch.cuda.set_per_process_memory_fraction(float(frac))

    model_name = os.environ.get("EMBED_MODEL", DEFAULT_EMBED_MODEL)
    # Preserve the existing model-library revision resolution; neither model was pinned before this change.
    embed_revision = "f9972ac22e696a105c482202646979e33e4b5a1e"
    rerank_name = DEFAULT_RERANK_MODEL
    rerank_revision = None
    dtype = torch.float32 if str(dev).lower().startswith("cpu") else torch.bfloat16
    precision = str(dtype)
    embed_model_kwargs = {"torch_dtype": dtype}
    rerank_model_kwargs = {"torch_dtype": dtype}
    embed_config_kwargs = {"vision_config": None, "audio_config": None}
    embed_loading = {"model_kwargs": embed_model_kwargs, "config_kwargs": embed_config_kwargs}
    embed_key = MODEL_MANAGER.cache_key(
        kind="embedding", model_id=model_name, revision=embed_revision, device=dev,
        precision=precision, loading_config=embed_loading,
    )
    rerank_loading = {"model_kwargs": rerank_model_kwargs, "max_length": 512, "batch_size": 32}
    rerank_key = MODEL_MANAGER.cache_key(
        kind="bge_reranker", model_id=rerank_name, revision=rerank_revision, device=dev,
        precision=precision, loading_config=rerank_loading,
    )

    _check_embedding_index_compatibility(pdir, model_name, embed_revision)
    bytes_per_parameter = {"torch.float32": 4, "torch.bfloat16": 2}.get(precision)
    if bytes_per_parameter is None:
        raise ModelMemoryConfigurationError(
            f"No reviewed memory sizing is configured for requested precision {precision!r}; "
            "refusing model loading without changing precision, device, or model."
        )
    memory_requirements = [ModelMemoryRequirement(
        key=embed_key, model_id=model_name,
        parameter_count=MODEL_PARAMETER_COUNTS.get(model_name),
        bytes_per_parameter=bytes_per_parameter,
    )]
    if cfg.rerank_candidates:
        memory_requirements.append(ModelMemoryRequirement(
            key=rerank_key, model_id=rerank_name,
            parameter_count=MODEL_PARAMETER_COUNTS.get(rerank_name),
            bytes_per_parameter=bytes_per_parameter,
        ))
    MODEL_MANAGER.ensure_memory_available(
        requirements=memory_requirements,
        model_label=("embedding model and BGE reranker" if cfg.rerank_candidates
                     else "embedding model"),
    )

    emb = MODEL_MANAGER.get_or_create(
        kind="embedding", model_id=model_name, revision=embed_revision, device=dev,
        precision=precision, loading_config=embed_loading,
        factory=lambda: SentenceTransformer(model_name, revision=embed_revision, device=dev,
                                            model_kwargs=dict(embed_model_kwargs),
                                            config_kwargs=dict(embed_config_kwargs)),
    )
    query_prompt = "QuestionAnswering"
    identity = index_identity(embed_model=model_name,
                              dimension=getattr(emb, "get_sentence_embedding_dimension", lambda: None)(),
                              doc_prefix=DOC_PREFIX, query_prompt=query_prompt,
                              query_prompt_text=(getattr(emb, "prompts", None) or {}).get(query_prompt))
    # Serving opens an existing read-only index; index management remains in scripts/policy/.
    dense = ReadOnlyDenseSearch.open(chunks, identity, default_dir=str(pdir / "qdrant_v2"))

    if cfg.rerank_candidates:
        def make_reranker():
            from sentence_transformers import CrossEncoder
            model = CrossEncoder(rerank_name, device=dev, max_length=512,
                                 model_kwargs=dict(rerank_model_kwargs))
            return _SharedCrossEncoderReranker(model, doc_string, batch_size=32)

        reranker = MODEL_MANAGER.get_or_create(
            kind="bge_reranker", model_id=rerank_name, revision=rerank_revision, device=dev,
            precision=precision, loading_config=rerank_loading, factory=make_reranker,
        )
    else:
        reranker = None

    def embed_query(query, model=emb):
        return model.encode(query, prompt_name=query_prompt, normalize_embeddings=True)

    retr = HybridRetriever(BM25Index(chunks), dense, embed_query, reranker=reranker,
                           chunks_by_id=by_id, config=cfg)
    if dev == "cuda":
        _search = retr.search
        def search_and_release(*a, **kw):  # return cached blocks to the shared GPU after each query
            try:
                return _search(*a, **kw)
            finally:
                torch.cuda.empty_cache()
        retr.search = search_and_release
    tools = PolicyTools(retr, by_id, profile, profile_filter(profile, mode),
                        hfilter=profile_filter(profile, "historical"))
    tools.search("warm-up: how do I raise a grievance?")  # existing warm-up behavior
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
