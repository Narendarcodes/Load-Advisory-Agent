"""Q-16: retrieval routed across saral_nbfc_policy and rbi_regulatory by intent (env-configured)."""
from concurrent.futures import ThreadPoolExecutor
import os
import threading
import time

import pytest

from rag.routed import (PRODUCT, REGULATORY, RoutedPolicyTools, configured_collections,
                        load_routed_policy_tools, route)

BOTH = [PRODUCT, REGULATORY]


def test_env_configures_the_collections():
    assert configured_collections({"AGENT_RAG_COLLECTIONS": "saral_nbfc_policy, rbi_regulatory"}) == BOTH
    assert configured_collections({}) == []


def test_routing_by_intent():
    assert route("How do I file a complaint with the RBI ombudsman?", BOTH) == [REGULATORY]
    assert route("What documents do I need for a wedding loan?", BOTH) == [PRODUCT]
    assert route("Can the lender charge prepayment charges on my personal loan EMI?", BOTH)[0] == REGULATORY
    assert route("hello there", BOTH) == BOTH
    assert route("RBI grievance", [PRODUCT]) == [PRODUCT]  # never a collection that is not loaded


class _T:
    def __init__(self, name, n=3):
        self.name, self.n, self.profile = name, n, None

    def search(self, query, historical=False):
        ps = [{"label": f"P{i + 1}", "chunk_id": f"{self.name}#{i}", "score": 1 - i / 10, "text": "t",
               "citation": {"label": f"P{i + 1}", "document_id": self.name}} for i in range(self.n)]
        return ps, {"latency_ms": 1.0, "top_rerank_score": 0.5, "mode": "current"}


def test_merge_relabels_and_leads_with_the_routed_collection():
    rt = RoutedPolicyTools({PRODUCT: _T(PRODUCT), REGULATORY: _T(REGULATORY)}, k=4)
    ps, meta = rt.search("is there a cooling-off period for my personal loan?")
    assert [p["label"] for p in ps] == ["P1", "P2", "P3", "P4"]
    assert [p["citation"]["label"] for p in ps] == ["P1", "P2", "P3", "P4"]
    assert ps[0]["collection"] == REGULATORY and meta["collections"][0] == REGULATORY
    assert {p["collection"] for p in ps} == {PRODUCT, REGULATORY}


def test_rerank_can_be_switched_off_by_env(monkeypatch):
    from rag.retrieve import load_rag_config

    monkeypatch.delenv("AGENT_RERANK", raising=False)
    on = load_rag_config()[0].rerank_candidates
    monkeypatch.setenv("AGENT_RERANK", "off")
    assert load_rag_config()[0].rerank_candidates == 0 and on >= 0



def test_collection_filters_metadata_and_citations_remain_independent():
    class ScopedTools:
        def __init__(self, collection, document_id, source_url, approval_status):
            self.collection = collection
            self.filter_token = object()
            self.document_id = document_id
            self.source_url = source_url
            self.approval_status = approval_status
            self.received_historical = None

        def search(self, query, historical=False):
            self.received_historical = historical
            return ([{
                "label": "P9", "chunk_id": f"{self.collection}#1",
                "source_metadata": {"collection": self.collection,
                                    "approval_status": self.approval_status,
                                    "filter_token": self.filter_token},
                "citation": {"label": "P9", "document_id": self.document_id,
                             "source_url": self.source_url},
            }], {"latency_ms": 1.0, "top_rerank_score": 0.7,
                 "mode": "historical" if historical else "current"})

    product = ScopedTools(PRODUCT, "BFL-POLICY", "https://example.invalid/bfl", "approved")
    regulatory = ScopedTools(REGULATORY, "RBI-CIRCULAR", "https://example.invalid/rbi",
                             "approved_historical")
    routed = RoutedPolicyTools({PRODUCT: product, REGULATORY: regulatory}, k=2)

    passages, meta = routed.search("a general question", historical=True)

    assert product.received_historical and regulatory.received_historical
    assert [passage["collection"] for passage in passages] == [PRODUCT, REGULATORY]
    assert [passage["source_metadata"]["collection"] for passage in passages] == [PRODUCT, REGULATORY]
    assert [passage["source_metadata"]["approval_status"] for passage in passages] == [
        "approved", "approved_historical",
    ]
    assert passages[0]["source_metadata"]["filter_token"] is product.filter_token
    assert passages[1]["source_metadata"]["filter_token"] is regulatory.filter_token
    assert [passage["citation"]["document_id"] for passage in passages] == ["BFL-POLICY", "RBI-CIRCULAR"]
    assert [passage["citation"]["source_url"] for passage in passages] == [
        "https://example.invalid/bfl", "https://example.invalid/rbi",
    ]
    assert [passage["citation"]["label"] for passage in passages] == ["P1", "P2"]
    assert meta["collections"] == [PRODUCT, REGULATORY]


def test_routed_loader_restores_collection_environment_even_when_a_load_fails(monkeypatch, tmp_path):
    monkeypatch.setenv("AGENT_QDRANT_COLLECTION", "preexisting_collection")
    seen = []

    def load_one(*, policy_dir, **kwargs):
        seen.append((os.environ["AGENT_QDRANT_COLLECTION"], policy_dir))
        if len(seen) == 2:
            raise RuntimeError("test failure")
        return object(), {"profile": "kept"}

    with pytest.raises(RuntimeError, match="test failure"):
        load_routed_policy_tools(load_one, [PRODUCT, REGULATORY], str(tmp_path))

    assert [collection for collection, _ in seen] == [PRODUCT, REGULATORY]
    assert os.environ["AGENT_QDRANT_COLLECTION"] == "preexisting_collection"


def test_concurrent_routed_loader_calls_keep_collection_configuration_isolated(monkeypatch, tmp_path):
    monkeypatch.setenv("AGENT_QDRANT_COLLECTION", "outer_collection")
    barrier = threading.Barrier(2)
    observed = {"first": [], "second": []}
    observed_lock = threading.Lock()

    def call_loader(call_name):
        def load_one(*, policy_dir, **kwargs):
            collection = os.environ["AGENT_QDRANT_COLLECTION"]
            time.sleep(0.01)
            with observed_lock:
                observed[call_name].append((collection, policy_dir, kwargs["marker"]))
            return object(), {"call": call_name}
        barrier.wait()
        return load_routed_policy_tools(
            load_one, BOTH, str(tmp_path / call_name), marker=call_name,
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        first, second = list(pool.map(call_loader, ("first", "second")))

    assert observed["first"] == [
        (PRODUCT, str(tmp_path / "first" / PRODUCT), "first"),
        (REGULATORY, str(tmp_path / "first" / REGULATORY), "first"),
    ]
    assert observed["second"] == [
        (PRODUCT, str(tmp_path / "second" / PRODUCT), "second"),
        (REGULATORY, str(tmp_path / "second" / REGULATORY), "second"),
    ]
    assert set(first[0].by_collection) == set(BOTH)
    assert set(second[0].by_collection) == set(BOTH)
    assert os.environ["AGENT_QDRANT_COLLECTION"] == "outer_collection"
