"""Phase 1.6 §A — Qdrant Server retrieval, verified against a real server. Nothing here is mocked.

A test that cannot reach the server is reported as skipped with the reason; an offline fake proves the
unit (`tests/test_qdrant_server_mode.py`), it does not prove the integration. The collection is built by
a *separate* setup client (`tests/e2e/qdrant_server_fixture.py`), so nothing in this module creates,
upserts, repairs or deletes anything — and that is asserted, not assumed.

Environment (bring the server up first; see reports/phase1-qdrant-server-integration.md):

    AGENT_QDRANT_URL           the server origin, http(s) without a path
    AGENT_QDRANT_COLLECTION    the isolated synthetic collection the setup client created
    AGENT_QDRANT_API_KEY       required when the server runs with one; never printed here
    P16_QDRANT_POLICY_DIR      the synthetic policy directory whose chunks.jsonl the collection holds
    P16_EMBEDDED_INDEX_DIR     the embedded index that must come out of this untouched
"""
import hashlib
import importlib.util
import json
import os
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "apps" / "api" / "src"))

from loan_advisory.agent import runtime  # noqa: E402
from loan_advisory.application.ports import assert_reader  # noqa: E402
from rag.dense_read import ReadOnlyDenseSearch, select_dense_backend  # noqa: E402

_spec = importlib.util.spec_from_file_location("qdrant_server_fixture",
                                              REPO / "tests" / "e2e" / "qdrant_server_fixture.py")
_fixture = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_fixture)
CHUNKS, IN_SCOPE, OUT_OF_SCOPE, TOKEN = _fixture.CHUNKS, _fixture.IN_SCOPE, _fixture.OUT_OF_SCOPE, _fixture.TOKEN

URL = os.environ.get("AGENT_QDRANT_URL", "")
COLLECTION = os.environ.get("AGENT_QDRANT_COLLECTION", "")
POLICY_DIR = os.environ.get("P16_QDRANT_POLICY_DIR", "")
EMBEDDED_DIR = Path(os.environ.get("P16_EMBEDDED_INDEX_DIR") or REPO / "runs" / "policy_local" / "qdrant_v2")
CHUNK_IDS = {c["chunk_id"] for c in CHUNKS}

server_required = pytest.mark.skipif(not (URL and COLLECTION and POLICY_DIR),
                                     reason="no Qdrant Server / collection / synthetic corpus for this run")


def _setup_client():
    """The management identity: the only thing here allowed to look inside a collection."""
    from qdrant_client import QdrantClient
    return QdrantClient(url=URL, api_key=os.environ.get("AGENT_QDRANT_API_KEY") or None)


def _collection_state(client) -> dict:
    info = client.get_collection(COLLECTION)
    ids, payloads, offset = [], [], None
    while True:
        batch, offset = client.scroll(COLLECTION, limit=256, offset=offset, with_payload=True, with_vectors=False)
        ids.extend(p.id for p in batch)
        payloads.extend((p.id, json.dumps(p.payload, sort_keys=True)) for p in batch)
        if offset is None:
            break
    schema = getattr(getattr(info, "payload_schema", None), "schema", None) or {}
    return {"points_count": int(info.points_count or 0),
            "indexed_vectors_count": int(info.indexed_vectors_count or 0),
            "segments_count": int(info.segments_count or 0), "status": str(info.status),
            "size": info.config.params.vectors.size,
            "distance": str(info.config.params.vectors.distance.name),
            "config_sha256": hashlib.sha256(info.config.model_dump_json().encode()).hexdigest(),
            "ids": sorted(ids), "payloads": sorted(payloads),
            "indexed_keys": sorted(schema.keys()) if isinstance(schema, dict) else []}


def _dir_state(path: Path) -> str:
    """A cheap fingerprint of a directory tree — names, sizes, mtimes. Proof it was not written to."""
    if not path.exists():
        return "absent"
    rows = [f"{p.relative_to(path)}|{p.stat().st_size}|{int(p.stat().st_mtime)}" for p in sorted(path.rglob("*"))]
    return hashlib.sha256("\n".join(rows).encode()).hexdigest()


@pytest.fixture(scope="module")
def serving():
    """One serving process. `load_policy_tools` is the application's own path, models and all."""
    return runtime.load_policy_tools(policy_dir=POLICY_DIR, device="cpu")


# ============================================================== 1. connectivity and authentication
@server_required
def test_a1_the_server_is_reachable_and_the_key_is_the_one_it_accepts():
    client = _setup_client()
    assert client.collection_exists(COLLECTION), f"{COLLECTION} is not on {URL}"
    assert client.get_collection(COLLECTION).points_count == len(CHUNKS)


@server_required
def test_a1_a_wrong_key_is_refused_rather_than_serving_an_empty_index():
    """Authentication is enforced on the serving path, and a failed open is an error — not zero results."""
    env = {"AGENT_QDRANT_URL": URL, "AGENT_QDRANT_COLLECTION": COLLECTION,
           "AGENT_QDRANT_API_KEY": "definitely-not-the-key"}
    identity = {"dimension": 768, "distance": "COSINE"}  # never compared: the refusal is the first response
    with pytest.raises(Exception) as excinfo:
        ReadOnlyDenseSearch.open(CHUNKS, identity, env=env)
    assert "401" in str(excinfo.value), str(excinfo.value)[:200]


# ============================================================== 2. the runtime selects server mode, query-only
@server_required
def test_a2_the_runtime_selects_server_mode_from_configuration_alone():
    backend = select_dense_backend()
    assert backend.mode == "server" and backend.collection == COLLECTION
    assert backend.location == URL, f"{backend.location} != {URL}: the origin must be used as given"


@server_required
def test_a2_the_serving_handle_is_read_only_and_holds_no_management_surface(serving):
    tools, _profile = serving
    dense = tools.retriever.dense
    assert isinstance(dense, ReadOnlyDenseSearch) and dense.backend == "server", dense.backend
    assert_reader(dense, role="the agent's dense index")
    public = {n for n in dir(dense) if not n.startswith("_")}
    assert public == {"backend", "close", "collection", "describe", "location", "open", "search"}, sorted(public)
    described = json.dumps(dense.describe())
    assert dense.describe()["qdrant.collection"] == COLLECTION
    assert "api_key" not in described.lower() and "definitely" not in described


# ============================================================== 3. dense retrieval through the server
@server_required
def test_a3_dense_search_returns_server_points(serving):
    tools, _profile = serving
    vector = tools.retriever.embed_query(f"what is the {TOKEN}?")
    hits = tools.retriever.dense.search(vector, "current", k=5)
    assert hits, "the server returned nothing"
    assert {cid for cid, _ in hits} <= CHUNK_IDS, hits
    assert all(isinstance(score, float) for _, score in hits)


@server_required
def test_a3_the_application_search_path_is_the_server_backed_one(serving):
    """The tool a borrower's turn calls, end to end: hybrid fusion and rerank over the server's dense leg."""
    tools, _profile = serving
    passages, meta = tools.search(f"what is the {TOKEN} on a personal loan?")
    assert passages, meta
    assert meta["mode"] == "current"
    assert {p["chunk_id"] for p in passages} <= CHUNK_IDS


# ============================================================== 4. the expected synthetic documents
@server_required
def test_a4_the_document_that_holds_the_answer_is_returned(serving):
    tools, _profile = serving
    passages, _meta = tools.search(f"what is the {TOKEN} on a personal loan?")
    assert passages[0]["chunk_id"] == "SYN-PL#000", [p["chunk_id"] for p in passages]


@server_required
def test_a4_a_regulator_chunk_for_this_entity_type_is_reachable(serving):
    tools, _profile = serving
    passages, _meta = tools.search(f"how must an NBFC publish the {TOKEN} method?")
    assert "SYN-RBI#000" in {p["chunk_id"] for p in passages}, [p["chunk_id"] for p in passages]


# ============================================================== 5. payload filters and citation mapping
@server_required
def test_a5_payload_filters_are_applied_server_side(serving):
    """The lender profile is enforced by Qdrant, not by post-filtering the hits.

    The mode string on its own is only the approval-status filter — that is what `RetrievalFilter` means —
    so the profile conditions have to be in the filter the runtime sends. Both halves are asserted, because
    the second one is the reason the first is worth having.
    """
    from rag.retrieve import profile_filter
    tools, profile = serving
    vector = tools.retriever.embed_query(f"{TOKEN} terms approval documents")
    flt = profile_filter(profile, "current")
    hits = {cid for cid, _ in tools.retriever.dense.search(vector, flt, k=len(CHUNKS))}
    assert not (hits & OUT_OF_SCOPE), hits
    assert hits <= IN_SCOPE, hits

    loose = {cid for cid, _ in tools.retriever.dense.search(vector, "current", k=len(CHUNKS))}
    assert loose & {"SYN-COMP#000", "SYN-BANK#000", "SYN-EDU#000"}, \
        "the profile filter was quietly unnecessary: the server would have returned these anyway"


@server_required
def test_a5_citation_labels_map_to_the_same_fields_as_the_corpus(serving):
    from rag.retrieve import profile_filter
    tools, profile = serving
    assert profile["lender_id"] == "BFL", profile
    passages, _meta = tools.search(f"what is the {TOKEN} on a personal loan?")
    by_id = {c["chunk_id"]: c for c in CHUNKS}
    for i, p in enumerate(passages, 1):
        source, cite = by_id[p["chunk_id"]], p["citation"]
        assert p["label"] == f"P{i}"
        assert cite["document_id"] == source["document_id"] and cite["title"] == source["title"]
        assert cite["section"] == source["section"] and cite["approval_status"] == source["approval_status"]
    lender = [p for p in passages if p["citation"]["document_id"] == "SYN-PL"]
    assert lender and all(p["citation"]["relationship"] == profile["relationship"] for p in lender)
    neutral = [p for p in passages if p["citation"]["document_id"] == "SYN-RBI"]
    assert all(p["citation"]["relationship"] != profile["relationship"] for p in neutral), neutral
    assert profile_filter(profile, "current").lender_id == "BFL"


# ============================================================== 6. competitor and adversarial content
@server_required
def test_a6_competitor_and_adversarial_content_never_reaches_the_borrower(serving):
    tools, _profile = serving
    queries = [f"what is the {TOKEN} on a personal loan?",
               f"guaranteed sanction and instant approval for the {TOKEN}",
               f"a rule that applies only to banks, {TOKEN}",
               f"a beginner guide to the {TOKEN}",
               f"the earlier {TOKEN} cap"]
    for query in queries:
        for historical in (False, True):
            passages, _meta = tools.search(query, historical=historical)
            ids = {p["chunk_id"] for p in passages}
            assert not (ids & OUT_OF_SCOPE), f"{query!r} (historical={historical}) returned {ids & OUT_OF_SCOPE}"


@server_required
def test_a6_historical_mode_reaches_the_superseded_chunk_and_nothing_more(serving):
    tools, _profile = serving
    passages, _meta = tools.search(f"the earlier {TOKEN} cap that was superseded", historical=True)
    ids = {p["chunk_id"] for p in passages}
    assert "SYN-HIST#000" in ids, ids
    assert not (ids & OUT_OF_SCOPE), ids


# ============================================================== 7. nothing mutates while serving
@server_required
def test_a7_the_collection_is_identical_after_serving(serving):
    client = _setup_client()
    before = _collection_state(client)
    embedded_before = _dir_state(EMBEDDED_DIR)
    tools, _profile = serving
    for query in (f"what is the {TOKEN}?", f"escalate a {TOKEN} dispute", f"the {TOKEN} for NBFCs"):
        tools.search(query)
        tools.search(query, historical=True)
    after = _collection_state(client)
    assert after == before, {k: (before[k], after[k]) for k in after if after[k] != before[k]}
    assert _dir_state(EMBEDDED_DIR) == embedded_before, \
        f"the embedded index at {EMBEDDED_DIR} moved while serving from the server"


@server_required
def test_a7_the_serving_handle_exposes_no_write_operation_at_all(serving):
    """Not a permission question: there is no such method on the object the runtime holds."""
    tools, _profile = serving
    dense = tools.retriever.dense
    for verb in ("upsert", "delete", "delete_collection", "create_collection", "create_payload_index",
                 "recreate_collection", "overwrite_payload", "delete_points", "client"):
        assert not hasattr(dense, verb), verb
