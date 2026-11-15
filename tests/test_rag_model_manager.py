"""Targeted tests for shared RAG model loading and collection isolation."""
from concurrent.futures import ThreadPoolExecutor
import json
import os
import sys
import threading
import time
import types

import pytest

from loan_advisory.agent import runtime
from loan_advisory.agent.model_manager import (
    FP32_EMBEDDING_WEIGHT_BYTES,
    FP32_RETRIEVAL_PAIR_ESTIMATE_BYTES,
    MODEL_PARAMETER_COUNTS,
    InsufficientModelMemoryError,
    ModelInitializationError,
    ModelMemoryConfigurationError,
    ModelMemoryRequirement,
    ModelManager,
)


def _params(**overrides):
    values = {
        "kind": "embedding",
        "model_id": "google/embeddinggemma-2",
        "revision": "revision-a",
        "device": "cpu",
        "precision": "torch.float32",
        "loading_config": {"model_kwargs": {"torch_dtype": "torch.float32"}},
    }
    values.update(overrides)
    return values


def test_same_embedding_and_reranker_configuration_is_initialized_once():
    manager = ModelManager(available_memory=lambda: 8 * 1024**3)
    calls = {"embedding": 0, "reranker": 0}

    def factory(kind):
        def create():
            calls[kind] += 1
            return object()
        return create

    embedding_a = manager.get_or_create(**_params(factory=factory("embedding")))
    embedding_b = manager.get_or_create(**_params(factory=factory("embedding")))
    reranker_args = _params(kind="bge_reranker", model_id="BAAI/bge-reranker-v2-m3",
                            revision="revision-b",
                            loading_config={"model_kwargs": {"torch_dtype": "torch.float32"},
                                            "max_length": 512})
    reranker_a = manager.get_or_create(**reranker_args, factory=factory("reranker"))
    reranker_b = manager.get_or_create(**reranker_args, factory=factory("reranker"))

    assert embedding_a is embedding_b
    assert reranker_a is reranker_b
    assert calls == {"embedding": 1, "reranker": 1}


def test_concurrent_initialization_does_not_construct_duplicate_instances():
    manager = ModelManager()
    barrier = threading.Barrier(8)
    calls = 0
    count_lock = threading.Lock()

    def create():
        nonlocal calls
        with count_lock:
            calls += 1
        time.sleep(0.04)
        return object()

    def get_model(_):
        barrier.wait()
        return manager.get_or_create(**_params(factory=create))

    with ThreadPoolExecutor(max_workers=8) as pool:
        models = list(pool.map(get_model, range(8)))

    assert calls == 1
    assert all(model is models[0] for model in models)


def test_cache_key_separates_model_revision_device_precision_and_loading_config():
    manager = ModelManager()
    base = manager.get_or_create(**_params(factory=object))
    alternatives = [
        {"model_id": "different/model"},
        {"revision": "revision-b"},
        {"device": "cpu:0"},
        {"precision": "torch.bfloat16"},
        {"loading_config": {"model_kwargs": {"torch_dtype": "torch.float32"},
                             "trust_remote_code": True}},
    ]
    variants = [manager.get_or_create(**_params(**change, factory=object)) for change in alternatives]
    assert all(model is not base for model in variants)
    assert len({id(base), *(id(model) for model in variants)}) == len(variants) + 1


def test_low_free_memory_refuses_before_model_factory_is_called():
    # The text-only EmbeddingGemma needs ~1 GiB in FP32 (271M parameters x 4 bytes).
    manager = ModelManager(available_memory=lambda: 512 * 1024**2)
    key = manager.cache_key(**_params())
    factory_called = False

    def create():
        nonlocal factory_called
        factory_called = True
        return object()

    requirement = ModelMemoryRequirement(
        key=key, model_id="google/embeddinggemma-2",
        parameter_count=MODEL_PARAMETER_COUNTS["google/embeddinggemma-2"],
        bytes_per_parameter=4,
    )
    with pytest.raises(InsufficientModelMemoryError, match="Refusing to initialize"):
        manager.ensure_memory_available(
            requirements=(requirement,), model_label="EmbeddingGemma",
            safety_margin_ratio=0.0,
        )
    assert not factory_called


def test_memory_detection_failure_fails_closed_with_actionable_diagnostics():
    manager = ModelManager(available_memory=lambda: None)
    key = manager.cache_key(**_params())
    requirement = ModelMemoryRequirement(
        key=key, model_id="google/embeddinggemma-2",
        parameter_count=MODEL_PARAMETER_COUNTS["google/embeddinggemma-2"],
        bytes_per_parameter=4,
    )
    with pytest.raises(InsufficientModelMemoryError, match="available system memory could not be determined") as error:
        manager.ensure_memory_available(requirements=(requirement,), model_label="EmbeddingGemma")
    message = str(error.value)
    assert "Theoretical weight memory" in message
    assert "estimated runtime memory requirement" in message
    assert "currently available system memory: UNKNOWN" in message
    assert "no automatic bypass" in message


def test_configured_safety_margin_is_included_in_the_runtime_requirement():
    import math
    required = math.ceil(FP32_EMBEDDING_WEIGHT_BYTES * 1.25)
    manager = ModelManager(available_memory=lambda: required)
    key = manager.cache_key(**_params())
    requirement = ModelMemoryRequirement(
        key=key, model_id="google/embeddinggemma-2",
        parameter_count=MODEL_PARAMETER_COUNTS["google/embeddinggemma-2"],
        bytes_per_parameter=4,
    )
    manager.ensure_memory_available(
        requirements=(requirement,), model_label="EmbeddingGemma", safety_margin_ratio=0.25,
    )


def test_unknown_model_has_no_automatic_memory_estimate_or_fallback():
    manager = ModelManager(available_memory=lambda: 64 * 1024**3)
    key = manager.cache_key(**_params(model_id="unreviewed/model"))
    requirement = ModelMemoryRequirement(key, "unreviewed/model", None, 4)
    with pytest.raises(ModelMemoryConfigurationError, match="no reviewed theoretical weight estimate"):
        manager.ensure_memory_available(requirements=(requirement,), model_label="embedding model")


def test_model_load_failure_can_be_retried_successfully():
    manager = ModelManager()
    calls = 0
    def create():
        nonlocal calls
        calls += 1
        if calls == 1:
            raise RuntimeError("temporary constructor failure")
        return object()
    args = _params()
    with pytest.raises(ModelInitializationError, match="temporary constructor failure"):
        manager.get_or_create(**args, factory=create)
    model = manager.get_or_create(**args, factory=create)
    assert calls == 2
    assert manager.get_or_create(**args, factory=lambda: object()) is model


def test_model_load_failure_explains_memory_pressure_and_no_fallback():
    manager = ModelManager()

    def fail():
        raise RuntimeError("not enough memory to allocate model weights")

    with pytest.raises(ModelInitializationError, match="Memory pressure is a likely cause") as error:
        manager.get_or_create(**_params(factory=fail))
    assert "no lower precision" in str(error.value)
    assert "google/embeddinggemma-2" in str(error.value)


def test_missing_index_revision_fails_closed(tmp_path, monkeypatch):
    from rag.index_meta import IndexCompatibilityError

    monkeypatch.delenv("AGENT_QDRANT_URL", raising=False)
    monkeypatch.delenv("AGENT_QDRANT_DIR", raising=False)
    meta_dir = tmp_path / "qdrant_v2"
    meta_dir.mkdir()
    (meta_dir / "index_compat.json").write_text(json.dumps({
        "embed_model": "google/embeddinggemma-2", "dimension": 768,
        "doc_prefix": "title: {title} | text: {text}",
    }), encoding="utf-8")

    with pytest.raises(IndexCompatibilityError, match="missing model_revision"):
        runtime._check_embedding_index_compatibility(
            tmp_path, "google/embeddinggemma-2", "f9972ac22e696a105c482202646979e33e4b5a1e",
        )


def test_mismatched_index_revision_fails_before_model_loading(tmp_path, monkeypatch):
    from rag.index_meta import IndexCompatibilityError

    monkeypatch.delenv("AGENT_QDRANT_URL", raising=False)
    monkeypatch.delenv("AGENT_QDRANT_DIR", raising=False)
    meta_dir = tmp_path / "qdrant_v2"
    meta_dir.mkdir()
    (meta_dir / "index_compat.json").write_text(json.dumps({
        "embed_model": "google/embeddinggemma-2", "dimension": 768,
        "model_revision": "a" * 40,
    }), encoding="utf-8")

    with pytest.raises(IndexCompatibilityError, match="embedding revision mismatch"):
        runtime._check_embedding_index_compatibility(
            tmp_path, "google/embeddinggemma-2", "b" * 40,
        )


@pytest.fixture
def fake_routed_runtime(monkeypatch, tmp_path):
    created = {"embeddings": [], "cross_encoders": [], "dense": []}

    class FakeCuda:
        def is_available(self):
            return False

    torch = types.SimpleNamespace(cuda=FakeCuda(), float32="torch.float32",
                                  bfloat16="torch.bfloat16")
    monkeypatch.setitem(sys.modules, "torch", torch)

    class FakeEmbedding:
        def __init__(self, model_id, **kwargs):
            self.model_id, self.kwargs = model_id, kwargs
            self.prompts = {"QuestionAnswering": "task: question answering | query: "}
            created["embeddings"].append(self)

        def get_sentence_embedding_dimension(self):
            return 768

        def encode(self, query, **kwargs):
            return [0.1, 0.2]

    class FakeCrossEncoder:
        def __init__(self, model_id, **kwargs):
            self.model_id, self.kwargs = model_id, kwargs
            created["cross_encoders"].append(self)

        def predict(self, pairs, batch_size=32):
            return [0.5] * len(pairs)

    monkeypatch.setitem(sys.modules, "sentence_transformers", types.SimpleNamespace(
        SentenceTransformer=FakeEmbedding, CrossEncoder=FakeCrossEncoder,
    ))

    class FakeDense:
        def __init__(self, chunks, collection):
            self.chunks = chunks
            self.collection = collection

        def search(self, vector, mode="current", k=50):
            return []

        def describe(self):
            return {"qdrant.collection": self.collection}

    class FakeDenseSearch:
        @staticmethod
        def open(chunks, identity, **kwargs):
            dense = FakeDense(chunks, os.environ.get("AGENT_QDRANT_COLLECTION"))
            created["dense"].append(dense)
            return dense

    monkeypatch.setitem(sys.modules, "rag.dense_read", types.SimpleNamespace(
        ReadOnlyDenseSearch=FakeDenseSearch,
    ))

    class FakeBM25:
        def __init__(self, chunks):
            self.chunks = chunks

    class FakeRetriever:
        def __init__(self, bm25, dense, embed_query, reranker=None, chunks_by_id=None, config=None):
            self.bm25, self.dense, self.embed_query = bm25, dense, embed_query
            self.reranker, self.by_id, self.cfg = reranker, chunks_by_id, config
            self.last_filter = None

        def search(self, query, flt, k=10):
            self.last_filter = flt
            chunk_id = next(iter(self.by_id))
            return {"results": [(chunk_id, 0.9)], "latency_ms": 1.0,
                    "top_rerank_score": 0.5}

    def profile_filter(profile, mode="current"):
        return types.SimpleNamespace(mode=mode, lender_id="BFL", entity_type="nbfc",
                                     collection=os.environ.get("AGENT_QDRANT_COLLECTION"))

    rag_retrieve = types.SimpleNamespace(
        BM25Index=FakeBM25, DOC_PREFIX="title: {title} | text: {text}",
        doc_string=lambda chunk: f"title: {chunk['title']} | text: {chunk['text']}",
        HybridRetriever=FakeRetriever, load_profile=lambda name: {"lender_id": "BFL", "entity_type": "nbfc"},
        load_rag_config=lambda: (types.SimpleNamespace(rerank_candidates=50, depth=50, k=10,
                                                       w_dense=1.0, w_bm25=0.5),
                                 {"lender_id": "BFL", "entity_type": "nbfc"}, "current"),
        profile_filter=profile_filter,
    )
    monkeypatch.setitem(sys.modules, "rag.retrieve", rag_retrieve)
    monkeypatch.setattr(runtime, "MODEL_MANAGER", ModelManager(available_memory=lambda: 8 * 1024**3))
    monkeypatch.setattr(runtime, "_check_embedding_index_compatibility", lambda *a, **kw: None)

    product_dir = tmp_path / "saral_nbfc_policy"
    regulatory_dir = tmp_path / "rbi_regulatory"
    product_dir.mkdir()
    regulatory_dir.mkdir()
    (product_dir / "chunks.jsonl").write_text(json.dumps({
        "chunk_id": "bfl#1", "document_id": "BFL-POLICY", "title": "Bajaj source",
        "text": "Product policy text", "source_url": "https://example.invalid/bfl",
        "approval_status": "approved", "applies_to_entity": ["nbfc"],
        "lender_id": "BFL", "source_type": "policy",
    }) + "\n", encoding="utf-8")
    (regulatory_dir / "chunks.jsonl").write_text(json.dumps({
        "chunk_id": "rbi#1", "document_id": "RBI-CIRCULAR", "title": "RBI source",
        "text": "Regulatory policy text", "source_url": "https://example.invalid/rbi",
        "approval_status": "approved_historical", "applies_to_entity": ["nbfc"],
        "lender_id": "none", "source_type": "regulation",
    }) + "\n", encoding="utf-8")
    monkeypatch.setenv("AGENT_RAG_COLLECTIONS", "saral_nbfc_policy,rbi_regulatory")
    monkeypatch.setenv("LOAN_POLICY_DIR", str(tmp_path))
    monkeypatch.delenv("AGENT_QDRANT_COLLECTION", raising=False)
    return created, product_dir, regulatory_dir


def test_both_collections_share_models_but_keep_retrieval_state_and_citations_separate(fake_routed_runtime):
    from rag.routed import PRODUCT, REGULATORY

    created, product_dir, regulatory_dir = fake_routed_runtime
    routed, _ = runtime.load_policy_tools(device="cpu")
    product = routed.by_collection[PRODUCT]
    regulatory = routed.by_collection[REGULATORY]

    assert len(created["embeddings"]) == 1
    assert len(created["cross_encoders"]) == 1
    assert product.retriever.embed_query.__defaults__[0] is regulatory.retriever.embed_query.__defaults__[0]
    assert product.retriever.reranker is regulatory.retriever.reranker
    assert product.retriever.reranker.model is regulatory.retriever.reranker.model
    assert created["embeddings"][0].kwargs["model_kwargs"]["torch_dtype"] == "torch.float32"
    assert created["cross_encoders"][0].kwargs["model_kwargs"]["torch_dtype"] == "torch.float32"
    # The embedder is pinned to the revision the v3 index was built with; the reranker is not pinned.
    assert created["embeddings"][0].kwargs["revision"] == "f9972ac22e696a105c482202646979e33e4b5a1e"
    assert "revision" not in created["cross_encoders"][0].kwargs

    assert product.retriever is not regulatory.retriever
    assert product.retriever.bm25 is not regulatory.retriever.bm25
    assert product.retriever.dense is not regulatory.retriever.dense
    assert product.by_id is not regulatory.by_id
    assert product.rfilter is not regulatory.rfilter
    assert product.hfilter is not regulatory.hfilter
    assert product.retriever.dense.collection == PRODUCT
    assert regulatory.retriever.dense.collection == REGULATORY
    assert product.retriever.bm25.chunks[0]["document_id"] == "BFL-POLICY"
    assert regulatory.retriever.bm25.chunks[0]["document_id"] == "RBI-CIRCULAR"
    assert product.retriever.bm25.chunks[0]["approval_status"] == "approved"
    assert regulatory.retriever.bm25.chunks[0]["approval_status"] == "approved_historical"
    assert product_dir.name == PRODUCT and regulatory_dir.name == REGULATORY

    passages, meta = routed.search("a general question", historical=True)
    assert [passage["citation"]["document_id"] for passage in passages] == ["BFL-POLICY", "RBI-CIRCULAR"]
    assert [passage["citation"]["source_url"] for passage in passages] == [
        "https://example.invalid/bfl", "https://example.invalid/rbi",
    ]
    assert [passage["citation"]["label"] for passage in passages] == ["P1", "P2"]
    assert product.retriever.last_filter.collection == PRODUCT
    assert regulatory.retriever.last_filter.collection == REGULATORY
    assert meta["collections"] == [PRODUCT, REGULATORY]



def test_runtime_memory_preflight_blocks_before_either_model_constructor(fake_routed_runtime, monkeypatch):
    created, _, _ = fake_routed_runtime
    monkeypatch.setattr(runtime, "MODEL_MANAGER", ModelManager(available_memory=lambda: 2 * 1024**3))

    with pytest.raises(InsufficientModelMemoryError, match="Refusing to initialize"):
        runtime.load_policy_tools(device="cpu")

    assert created["embeddings"] == []
    assert created["cross_encoders"] == []
    assert created["dense"] == []



def test_embedding_only_load_is_preflighted_when_reranking_is_disabled(fake_routed_runtime, monkeypatch):
    created, _, _ = fake_routed_runtime
    retrieve = sys.modules["rag.retrieve"]
    cfg, profile, mode = retrieve.load_rag_config()
    cfg.rerank_candidates = 0
    monkeypatch.setattr(retrieve, "load_rag_config", lambda: (cfg, profile, mode))
    monkeypatch.setattr(runtime, "MODEL_MANAGER", ModelManager(available_memory=lambda: FP32_EMBEDDING_WEIGHT_BYTES))
    with pytest.raises(InsufficientModelMemoryError, match="embedding model") as error:
        runtime.load_policy_tools(device="cpu")
    assert "google/embeddinggemma-2" in str(error.value)
    assert created["embeddings"] == []
    assert created["cross_encoders"] == []
    assert created["dense"] == []


def test_combined_embedding_and_reranker_requirement_fails_before_construction(fake_routed_runtime, monkeypatch):
    import math
    created, _, _ = fake_routed_runtime
    available = math.ceil(FP32_RETRIEVAL_PAIR_ESTIMATE_BYTES * 1.50) - 1
    monkeypatch.setattr(runtime, "MODEL_MANAGER", ModelManager(available_memory=lambda: available))
    with pytest.raises(InsufficientModelMemoryError, match="estimated runtime memory requirement") as error:
        runtime.load_policy_tools(device="cpu")
    message = str(error.value)
    assert "google/embeddinggemma-2" in message
    assert "BAAI/bge-reranker-v2-m3" in message
    assert "currently available system memory" in message
    assert created["embeddings"] == []
    assert created["cross_encoders"] == []
    assert created["dense"] == []


def test_runtime_memory_detection_failure_blocks_models_and_dense_index(fake_routed_runtime, monkeypatch):
    created, _, _ = fake_routed_runtime
    monkeypatch.setattr(runtime, "MODEL_MANAGER", ModelManager(available_memory=lambda: None))
    with pytest.raises(InsufficientModelMemoryError, match="currently available system memory could not be determined"):
        runtime.load_policy_tools(device="cpu")
    assert created["embeddings"] == []
    assert created["cross_encoders"] == []
    assert created["dense"] == []


def test_embedding_configured_retrieval_and_rerank_candidates_remain_top_50(monkeypatch):
    pytest.importorskip("rank_bm25")
    pytest.importorskip("yaml")
    from rag.retrieve import load_rag_config

    monkeypatch.delenv("AGENT_RERANK", raising=False)
    config, _, _ = load_rag_config()
    assert config.depth == 50
    assert config.rerank_candidates == 50
