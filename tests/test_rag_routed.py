"""Q-16: retrieval routed across saral_nbfc_policy and rbi_regulatory by intent (env-configured)."""
from rag.routed import PRODUCT, REGULATORY, RoutedPolicyTools, configured_collections, route

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
