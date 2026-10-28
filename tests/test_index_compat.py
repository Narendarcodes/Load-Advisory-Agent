"""Vector-index provenance: a stale or incompatible index must fail loudly instead of being queried."""
import hashlib

import pytest

pytest.importorskip("qdrant_client")

from rag.index_meta import (IndexCompatibilityError, index_identity, load_index_meta, validate_collection,  # noqa: E402
                            validate_index, validate_vectors)
from rag.retrieve import DOC_PREFIX, DenseIndex  # noqa: E402


def _chunk(cid, text, **kw):
    return {"chunk_id": cid, "document_id": cid.split("#")[0], "title": cid.split("#")[0], "text": text,
            "chunk_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(), **kw}


CHUNKS = [_chunk("D#000", "Penal charges shall not be capitalised."), _chunk("D#001", "Grievance within 30 days.")]
VECTORS = [[1.0, 0.0], [0.0, 1.0]]


def _identity(dimension=2, **kw):
    base = {"embed_model": "google/embeddinggemma-2", "dimension": dimension, "doc_prefix": DOC_PREFIX,
            "query_prompt": "QuestionAnswering", "query_prompt_text": "task: question answering | query: "}
    return index_identity(**{**base, **kw})


def _build(tmp_path, chunks=CHUNKS, vectors=VECTORS, identity=None):
    return DenseIndex(chunks, vectors, path=str(tmp_path / "idx"), meta=identity or _identity())


def test_matching_index_round_trips(tmp_path):
    di = _build(tmp_path)
    try:
        meta = validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
        assert meta["corpus_hash"] and meta["chunks"] == 2 and meta["dimension"] == 2
        validate_collection(di.client, "policy_chunks_v2", dimension=2, distance="COSINE",
                            chunk_ids={c["chunk_id"] for c in CHUNKS})
        assert load_index_meta(tmp_path / "idx")["embed_model"] == "google/embeddinggemma-2"
    finally:
        di.client.close()


def test_changed_model_fails(tmp_path):
    di = _build(tmp_path)
    di.client.close()
    with pytest.raises(IndexCompatibilityError, match="embed_model"):
        validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(embed_model="other/model"),
                       collection="policy_chunks_v2")


def test_changed_prompt_fails(tmp_path):
    di = _build(tmp_path)
    di.client.close()
    with pytest.raises(IndexCompatibilityError, match="query_prompt_text"):
        validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(query_prompt_text="task: search result | query: "),
                       collection="policy_chunks_v2")


def test_changed_corpus_fails(tmp_path):
    di = _build(tmp_path)
    di.client.close()
    edited = [_chunk("D#000", "Penal charges may now be capitalised."), CHUNKS[1]]
    with pytest.raises(IndexCompatibilityError, match="corpus_hash"):
        validate_index(tmp_path / "idx", chunks=edited, identity=_identity(), collection="policy_chunks_v2")


def test_index_without_metadata_is_refused(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"))
    di.client.close()
    with pytest.raises(IndexCompatibilityError, match="index_compat.json"):
        validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_embedding_dimension_mismatch_fails(tmp_path):
    di = _build(tmp_path)  # real collection has 2 dimensions
    try:
        validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
        with pytest.raises(IndexCompatibilityError, match="vector size"):
            validate_collection(di.client, "policy_chunks_v2", dimension=768, distance="COSINE",
                                chunk_ids={c["chunk_id"] for c in CHUNKS})
    finally:
        di.client.close()


@pytest.mark.parametrize("chunks,vectors,match", [
    ([], [], "empty chunk list"),
    (CHUNKS, VECTORS[:1], "vector count"),
    ([_chunk("D#000", "a"), _chunk("D#000", "b")], VECTORS, "duplicate chunk_id"),
    ([_chunk("", "a"), CHUNKS[1]], VECTORS, "non-empty chunk_id"),
    (CHUNKS, [[1.0, 0.0], [0.0]], "dimensions"),
    (CHUNKS, [[1.0, 0.0], [0.0, float("nan")]], "non-finite"),
    (CHUNKS, [[1.0, 0.0], [0.0, float("inf")]], "non-finite"),
    (CHUNKS, [[1.0, 0.0], [0.0, "x"]], "non-numeric"),
    (CHUNKS, [[1.0, 0.0], [0.0, None]], "non-numeric"),
    (CHUNKS, [[1.0, 0.0], None], "not a sequence"),
    (CHUNKS, [None, [0.0, 1.0]], "not a sequence"),
])
def test_validate_vectors_rejects_malformed_candidates(chunks, vectors, match):
    with pytest.raises(IndexCompatibilityError, match=match):
        validate_vectors(chunks, vectors)


def test_validate_vectors_checks_the_declared_dimension():
    with pytest.raises(IndexCompatibilityError, match="expected 3"):
        validate_vectors(CHUNKS, VECTORS, dimension=3)
    assert validate_vectors(CHUNKS, VECTORS, dimension=2) == 2


def test_malformed_vectors_cannot_build_an_index(tmp_path):
    with pytest.raises(IndexCompatibilityError, match="non-finite"):
        DenseIndex(CHUNKS, [[1.0, 0.0], [float("nan"), 1.0]], path=str(tmp_path / "idx"), meta=_identity())
    assert not (tmp_path / "idx" / "index_compat.json").exists()


def test_point_count_mismatch_fails(tmp_path):
    di = _build(tmp_path)
    try:
        with pytest.raises(IndexCompatibilityError, match="points"):
            validate_collection(di.client, "policy_chunks_v2", dimension=2, distance="COSINE",
                                chunk_ids={"D#000"})
    finally:
        di.client.close()


def test_payload_chunk_set_mismatch_fails(tmp_path):
    di = _build(tmp_path)
    try:
        with pytest.raises(IndexCompatibilityError, match="stale"):
            validate_collection(di.client, "policy_chunks_v2", dimension=2, distance="COSINE",
                                chunk_ids={"D#000", "D#999"})
    finally:
        di.client.close()


def test_distance_mismatch_fails(tmp_path):
    from qdrant_client import QdrantClient, models

    client = QdrantClient(path=str(tmp_path / "dot"))
    try:
        client.create_collection("policy_chunks_v2",
                                 vectors_config=models.VectorParams(size=2, distance=models.Distance.DOT))
        with pytest.raises(IndexCompatibilityError, match="distance"):
            validate_collection(client, "policy_chunks_v2", dimension=2, distance="COSINE", chunk_ids=set())
    finally:
        client.close()


def test_runtime_open_rejects_unverified_or_mismatched_index(tmp_path):
    from loan_advisory.agent.runtime import _open_dense

    di = _build(tmp_path)
    di.client.close()
    with pytest.raises(IndexCompatibilityError, match="embed_model"):
        _open_dense(str(tmp_path / "idx"), CHUNKS, _identity(embed_model="other/model"))
    d = _open_dense(str(tmp_path / "idx"), CHUNKS, _identity())
    try:
        assert d.col == "policy_chunks_v2"
    finally:
        d.client.close()
