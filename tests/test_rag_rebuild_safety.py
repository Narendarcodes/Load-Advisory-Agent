"""RAG rebuild safety: an existing index or corpus is never replaced implicitly."""
import hashlib
import importlib.util
import json
from pathlib import Path

import pytest

pytest.importorskip("qdrant_client")

from rag.index_meta import IndexCompatibilityError, index_identity, validate_index  # noqa: E402
from rag.retrieve import DOC_PREFIX, DenseIndex, IndexExistsError, rebuild_index  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _chunk(cid, text):
    return {"chunk_id": cid, "document_id": cid.split("#")[0], "title": cid.split("#")[0], "text": text,
            "chunk_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest()}


CHUNKS = [_chunk("D#000", "Penal charges shall not be capitalised."), _chunk("D#001", "Grievance within 30 days.")]
VECTORS = [[1.0, 0.0], [0.0, 1.0]]
NEW_CHUNKS = [_chunk("D#000", "Updated penal charges text."), _chunk("D#001", "Updated grievance text.")]


def _identity(dimension=2):
    return index_identity(embed_model="google/embeddinggemma-2", dimension=dimension, doc_prefix=DOC_PREFIX,
                          query_prompt="QuestionAnswering", query_prompt_text="task: question answering | query: ")


def _count(path):
    from qdrant_client import QdrantClient
    client = QdrantClient(path=str(path))
    try:
        return client.count("policy_chunks_v2").count
    finally:
        client.close()


def test_opening_an_existing_index_without_permission_does_not_delete_it(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    di.client.close()
    with pytest.raises(IndexExistsError):
        DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    assert _count(tmp_path / "idx") == 2
    validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_rebuild_without_permission_leaves_the_previous_index_intact(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    di.client.close()
    with pytest.raises(IndexExistsError):
        rebuild_index(tmp_path / "idx", NEW_CHUNKS, VECTORS, meta=_identity())
    assert _count(tmp_path / "idx") == 2
    validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_failed_rebuild_leaves_the_previous_index_intact(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    di.client.close()
    with pytest.raises(IndexCompatibilityError):
        # metadata claims 3 dimensions while the staged vectors have 2: validation must abort the swap
        rebuild_index(tmp_path / "idx", CHUNKS, VECTORS, meta=_identity(dimension=3), replace=True)
    assert _count(tmp_path / "idx") == 2
    validate_index(tmp_path / "idx", chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert not list(tmp_path.glob(".idx.new-*"))


def test_successful_rebuild_swaps_in_a_validated_index(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    di.client.close()
    rebuild_index(tmp_path / "idx", NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(tmp_path / "idx", chunks=NEW_CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert _count(tmp_path / "idx") == 2
    assert not list(tmp_path.glob(".idx.old-*"))


def test_eval_defaults_to_no_persistent_index(tmp_path):
    mod = _load("eval_bajaj_retrieve", "scripts/policy/eval_bajaj_retrieve.py")
    assert mod.index_target("", False) is None  # in-memory only: nothing under LOAN_POLICY_DIR is written
    production = tmp_path / "policy" / "qdrant_v2"
    (production / "collection").mkdir(parents=True)
    with pytest.raises(SystemExit):
        mod.index_target(str(production), False)
    assert mod.index_target(str(production), True) == production


def test_partial_fetch_leaves_the_previous_corpus_intact(tmp_path, monkeypatch):
    base = tmp_path / "policy"
    (base / "src").mkdir(parents=True)
    (base / "src" / "manifest.json").write_text("{}", encoding="utf-8")
    old_chunks = '{"chunk_id": "OLD#000"}\n'
    (base / "chunks.jsonl").write_text(old_chunks, encoding="utf-8")
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")

    def failing_fetch(out_dir, only=None):
        (out_dir / "manifest.json").write_text('{"D": {"status": "error"}}', encoding="utf-8")
        return {"manifest": {"D": {"status": "error", "error": "boom"}}, "review_events": []}

    monkeypatch.setattr(mod, "fetch_all", failing_fetch)
    with pytest.raises(SystemExit):
        mod.stage_fetch(base, None)
    assert (base / "chunks.jsonl").read_text(encoding="utf-8") == old_chunks
    assert (base / "src" / "manifest.json").read_text(encoding="utf-8") == "{}"
    assert not list(base.glob(".src.new-*"))


def test_publish_swaps_the_staged_corpus_in(tmp_path):
    base = tmp_path / "policy"
    (base / "src").mkdir(parents=True)
    (base / "src" / "manifest.json").write_text("{}", encoding="utf-8")
    (base / "chunks.jsonl").write_text('{"chunk_id": "OLD#000"}\n', encoding="utf-8")
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "manifest.json").write_text('{"NEW": {"status": "fetched"}}', encoding="utf-8")
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")

    mod.publish(base, stage, [{"chunk_id": "NEW#000"}])
    assert json.loads((base / "chunks.jsonl").read_text(encoding="utf-8").splitlines()[0])["chunk_id"] == "NEW#000"
    assert (base / "src" / "manifest.json").read_text(encoding="utf-8") == '{"NEW": {"status": "fetched"}}'
    assert not stage.exists()
    assert not list(base.glob(".src.old-*"))
