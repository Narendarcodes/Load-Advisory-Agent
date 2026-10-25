"""runtime.load_policy_tools on a shared GPU: VRAM cap (AGENT_GPU_FRACTION) and cache release after every query.

torch, sentence_transformers and rag.retrieve are replaced by fakes, so this runs without a GPU or model downloads.
"""
import sys
import types

import pytest

from loan_advisory.agent import runtime


class FakeCuda:
    def __init__(self, available=True):
        self.available, self.fractions, self.empty_calls = available, [], 0

    def is_available(self):
        return self.available

    def set_per_process_memory_fraction(self, f):
        self.fractions.append(f)

    def empty_cache(self):
        self.empty_calls += 1


class FakeRetriever:
    def __init__(self, *a, **kw):
        self.calls, self.fail = 0, False

    def search(self, query, flt, k=10):
        self.calls += 1
        if self.fail:
            raise RuntimeError("retriever down")
        return {"results": [], "latency_ms": 1.0}


@pytest.fixture
def fakes(monkeypatch, tmp_path):
    cuda = FakeCuda()
    torch = types.SimpleNamespace(cuda=cuda, bfloat16="bf16")
    st = types.SimpleNamespace(SentenceTransformer=lambda *a, **kw: types.SimpleNamespace(encode=lambda *a, **kw: [[0.0]]))
    flt = types.SimpleNamespace(mode="current", lender_id=None, entity_type=None)
    rr = types.SimpleNamespace(
        BM25Index=lambda chunks: object(), DenseIndex=lambda chunks, vecs, path=None: object(),
        CrossEncoderReranker=lambda device=None: object(), HybridRetriever=FakeRetriever,
        load_profile=lambda name: {}, profile_filter=lambda profile, mode="current": flt,
        load_rag_config=lambda: (types.SimpleNamespace(rerank_candidates=0), {}, "current"))
    monkeypatch.setitem(sys.modules, "torch", torch)
    monkeypatch.setitem(sys.modules, "sentence_transformers", st)
    monkeypatch.setitem(sys.modules, "rag.retrieve", rr)
    (tmp_path / "chunks.jsonl").write_text('{"chunk_id": "c1", "title": "t", "text": "x"}\n')
    monkeypatch.setenv("AGENT_QDRANT_DIR", str(tmp_path / "qdrant"))
    monkeypatch.delenv("AGENT_GPU_FRACTION", raising=False)
    return cuda, str(tmp_path)


def test_gpu_fraction_caps_vram_and_cache_is_released_after_every_query(fakes, monkeypatch):
    cuda, pdir = fakes
    monkeypatch.setenv("AGENT_GPU_FRACTION", "0.016")
    tools, _ = runtime.load_policy_tools(policy_dir=pdir)
    assert cuda.fractions == [0.016]
    warm = cuda.empty_calls
    assert warm == 1  # the warm-up query already released its blocks
    tools.search("what is FOIR?")
    tools.search("how do I raise a grievance?")
    assert cuda.empty_calls == warm + 2


def test_cache_is_released_even_when_the_retriever_fails(fakes):
    cuda, pdir = fakes
    tools, _ = runtime.load_policy_tools(policy_dir=pdir)
    before = cuda.empty_calls
    assert tools.retriever.search.__name__ == "search_and_release"
    tools.retriever.fail = True
    with pytest.raises(RuntimeError):
        tools.search("anything")
    assert cuda.empty_calls == before + 1


def test_no_fraction_set_means_no_cap(fakes):
    cuda, pdir = fakes
    runtime.load_policy_tools(policy_dir=pdir)
    assert cuda.fractions == []


def test_cpu_device_is_never_capped_or_wrapped(fakes, monkeypatch):
    cuda, pdir = fakes
    monkeypatch.setenv("AGENT_GPU_FRACTION", "0.016")
    tools, _ = runtime.load_policy_tools(policy_dir=pdir, device="cpu")
    tools.search("what is FOIR?")
    assert cuda.fractions == [] and cuda.empty_calls == 0
    assert isinstance(tools.retriever, FakeRetriever) and "search_and_release" not in tools.retriever.search.__qualname__
