"""Phase 1.6 A: how the serving runtime chooses between an embedded collection and a Qdrant Server.

The live pass in `tests/test_phase1_live_integration.py` proves the server path works. These prove the
decisions around it: embedded stays the default, ambiguity is refused instead of resolved by precedence,
a malformed origin is refused before anything connects, and the handle the runtime holds cannot write.
"""
import pytest

from loan_advisory.application.ports import ReadOnlyBoundaryViolation, assert_reader
from rag.dense_read import DEFAULT_COLLECTION, DenseBackend, DenseConfigError, ReadOnlyDenseSearch, select_dense_backend

URL, DIR = "AGENT_QDRANT_URL", "AGENT_QDRANT_DIR"


def env(**pairs):
    base = {URL: "", DIR: ""}
    base.update({k: v for k, v in pairs.items()})
    return base


# ------------------------------------------------------------------ selection
def test_unset_url_keeps_the_existing_embedded_mode():
    b = select_dense_backend(env(), default_dir="/data/policy/qdrant_v2")
    assert b == DenseBackend("embedded", "/data/policy/qdrant_v2", DEFAULT_COLLECTION)


def test_explicit_dir_still_wins_over_the_default_directory():
    b = select_dense_backend(env(**{DIR: "/srv/index"}), default_dir="/data/policy/qdrant_v2")
    assert (b.mode, b.location) == ("embedded", "/srv/index")


def test_a_server_url_selects_server_mode():
    b = select_dense_backend(env(**{URL: "http://qdrant:6333"}))
    assert b.mode == "server" and b.location == "http://qdrant:6333"
    assert b.collection == DEFAULT_COLLECTION


def test_collection_name_is_configurable_for_either_mode():
    assert select_dense_backend(env(**{URL: "http://h:1", "AGENT_QDRANT_COLLECTION": "p16_fixture"})).collection == "p16_fixture"
    assert select_dense_backend(env(**{DIR: "/d", "AGENT_QDRANT_COLLECTION": "p16_fixture"})).collection == "p16_fixture"


def test_https_origin_is_accepted():
    assert select_dense_backend(env(**{URL: "https://qdrant.internal:6334"})).mode == "server"


# ------------------------------------------------------------------ refused configurations
@pytest.mark.parametrize("bad", ["qdrant:6333", "ftp://qdrant:6333", "http://",
                                 "http://user:secret@qdrant:6333", "http://qdrant:6333/api",
                                 "http://qdrant:6333?tls=1", "http://qdrant:6333#frag"])
def test_a_malformed_server_origin_is_refused_before_anything_connects(bad):
    with pytest.raises(DenseConfigError, match="AGENT_QDRANT_URL"):
        select_dense_backend(env(**{URL: bad}))


def test_a_blank_url_is_not_configuration():
    """`AGENT_QDRANT_URL=""` means unset, which is what the existing compose files already do."""
    assert select_dense_backend(env(**{URL: "   "}), default_dir="/d").mode == "embedded"


def test_two_index_locations_at_once_is_refused_not_resolved_by_precedence():
    """Silently preferring one would serve a different corpus than the operator thinks they picked."""
    with pytest.raises(DenseConfigError, match="are both set"):
        select_dense_backend(env(**{URL: "http://qdrant:6333", DIR: "/d"}))


def test_no_index_location_at_all_is_refused():
    with pytest.raises(DenseConfigError, match="no dense index location"):
        select_dense_backend(env(), default_dir=None)


def test_an_empty_collection_name_is_refused():
    with pytest.raises(DenseConfigError, match="AGENT_QDRANT_COLLECTION"):
        select_dense_backend(env(**{DIR: "/d", "AGENT_QDRANT_COLLECTION": "   "}))


# ------------------------------------------------------------------ nothing is created by the runtime
def test_a_missing_embedded_collection_is_a_refusal_that_names_the_tooling(tmp_path):
    backend = DenseBackend("embedded", str(tmp_path / "absent"), DEFAULT_COLLECTION)
    with pytest.raises(DenseConfigError, match="index tooling"):
        ReadOnlyDenseSearch.open([{"chunk_id": "c1"}], {"dimension": 2}, backend=backend)


def test_a_missing_server_collection_is_refused_without_creating_it():
    """Pointing at a server must never conjure the collection into existence."""
    calls = []

    class Client:
        def collection_exists(self, name):
            calls.append(name)
            return False

        def close(self):
            pass

    import qdrant_client
    original = qdrant_client.QdrantClient
    qdrant_client.QdrantClient = lambda **kw: Client()
    try:
        with pytest.raises(DenseConfigError, match="will not create"):
            ReadOnlyDenseSearch.open([], {"dimension": 4},
                                     backend=DenseBackend("server", "http://127.0.0.1:6333", "p16_fixture"))
    finally:
        qdrant_client.QdrantClient = original
    assert calls == ["p16_fixture"], "the runtime probed something other than the configured collection"


@pytest.mark.parametrize("key,expected", [("s3cr3t", "s3cr3t"), ("", None)])
def test_the_api_key_is_taken_from_the_same_environment_as_the_selection(monkeypatch, key, expected):
    """`open(env=...)` picks the backend from that mapping; the credential must not quietly come from
    somewhere else, because a server that requires one would otherwise look like an empty index."""

    class StopOpen(Exception):
        pass

    seen = {}

    class Client:
        def __init__(self, **kw):
            seen.update(kw)

        def collection_exists(self, name):
            return True

        def get_collection(self, name):
            raise StopOpen()

        def close(self):
            pass

    import qdrant_client
    from rag.index_meta import IndexCompatibilityError

    original = qdrant_client.QdrantClient
    qdrant_client.QdrantClient = Client
    env = {"AGENT_QDRANT_URL": "http://127.0.0.1:6333", "AGENT_QDRANT_COLLECTION": "p16_fixture",
           "AGENT_QDRANT_API_KEY": key}
    for name in ("AGENT_QDRANT_URL", "AGENT_QDRANT_COLLECTION", "AGENT_QDRANT_API_KEY"):
        monkeypatch.delenv(name, raising=False)          # the mapping under test, not the process, decides
    try:
        with pytest.raises(IndexCompatibilityError) as excinfo:
            ReadOnlyDenseSearch.open([], {"dimension": 4}, env=env)
    finally:
        qdrant_client.QdrantClient = original
    assert isinstance(excinfo.value.__cause__, StopOpen), "verification never reached the collection"
    assert seen == {"url": "http://127.0.0.1:6333", "api_key": expected}, seen


# ------------------------------------------------------------------ the handle cannot write
def test_the_serving_handle_passes_the_agent_guard_and_a_builder_handle_does_not(tmp_path):
    from rag.retrieve import DenseIndex

    class Bound:
        """Stands in for the bound `query_points` the handle actually keeps."""

        def __call__(self, *a, **kw):
            return []

    handle = ReadOnlyDenseSearch(backend=DenseBackend("server", "http://h:1", "c"), query_points=Bound(),
                                 filter_for=lambda flt: None)
    assert_reader(handle, role="the serving dense handle")
    public = {n for n in dir(handle) if not n.startswith("_")}
    assert public <= {"backend", "close", "collection", "describe", "location", "open", "search"}, sorted(public)

    builder = DenseIndex([{"chunk_id": "a", "text": "t", "title": "x"}], [[1.0, 0.0]],
                         path=str(tmp_path / "idx"))
    try:
        with pytest.raises(ReadOnlyBoundaryViolation, match="upsert"):
            assert_reader(builder, role="a builder handle")
    finally:
        builder.client.close()
