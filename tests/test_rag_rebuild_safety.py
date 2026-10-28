"""RAG rebuild safety: an existing index or corpus is never replaced implicitly."""
import hashlib
import importlib.util
import json
import os
import shutil
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


def _existing_index(tmp_path):
    di = DenseIndex(CHUNKS, VECTORS, path=str(tmp_path / "idx"), meta=_identity())
    di.client.close()
    return tmp_path / "idx"


def test_non_empty_target_without_a_collection_needs_permission(tmp_path):
    target = tmp_path / "idx"
    target.mkdir()
    (target / "keep.txt").write_text("partial", encoding="utf-8")
    with pytest.raises(IndexExistsError):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity())
    assert (target / "keep.txt").read_text(encoding="utf-8") == "partial"
    assert not list(tmp_path.glob(".idx.new-*"))


def test_interrupted_swap_is_restored_before_the_next_rebuild(tmp_path):
    target = _existing_index(tmp_path)
    backup = tmp_path / ".idx.old-123"
    target.rename(backup)
    # A rebuild without permission restores the previous index and then refuses to replace it.
    with pytest.raises(IndexExistsError):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity())
    validate_index(target, chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert not backup.exists()
    # With permission the rebuild completes normally.
    rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=NEW_CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_failed_install_restores_the_previous_index(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)
    real_replace = os.replace

    def replace(src, dst):
        if ".new-" in str(src) and Path(dst) == target:
            raise OSError("install failed")
        return real_replace(src, dst)

    monkeypatch.setattr("rag.retrieve.os.replace", replace)
    with pytest.raises(OSError, match="install failed"):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert not list(tmp_path.glob(".idx.old-*"))
    assert not list(tmp_path.glob(".idx.new-*"))


def test_unrecoverable_install_failure_preserves_both_trees(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)
    real_replace = os.replace

    def replace(src, dst):
        if ".new-" in str(src):
            raise OSError("install failed")
        if ".old-" in str(src):
            raise OSError("restore failed")
        return real_replace(src, dst)

    monkeypatch.setattr("rag.retrieve.os.replace", replace)
    with pytest.raises(RuntimeError, match="preserved at") as e:
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    backups, stages = list(tmp_path.glob(".idx.old-*")), list(tmp_path.glob(".idx.new-*"))
    assert len(backups) == 1 and len(stages) == 1
    assert str(backups[0]) in str(e.value) and str(stages[0]) in str(e.value)
    assert not target.exists()
    validate_index(backups[0], chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_backup_cleanup_failure_keeps_the_valid_replacement(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)
    real_rmtree = shutil.rmtree

    def rmtree(path, *a, **kw):
        if ".old-" in str(path):
            raise OSError("busy")
        return real_rmtree(path, *a, **kw)

    monkeypatch.setattr("rag.retrieve.shutil.rmtree", rmtree)
    rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=NEW_CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert len(list(tmp_path.glob(".idx.old-*"))) == 1


def test_staging_failure_does_not_touch_the_target(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)

    def boom(*a, **kw):
        raise OSError("no space")

    monkeypatch.setattr("rag.retrieve.tempfile.mkdtemp", boom)
    with pytest.raises(OSError, match="no space"):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")


def test_build_failure_cleans_the_stage_and_keeps_the_target(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)

    def boom(*a, **kw):
        raise RuntimeError("build failed")

    monkeypatch.setattr("rag.retrieve.DenseIndex", boom)
    with pytest.raises(RuntimeError, match="build failed"):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert not list(tmp_path.glob(".idx.new-*"))


def test_metadata_write_failure_cleans_the_stage(tmp_path, monkeypatch):
    target = _existing_index(tmp_path)

    def boom(*a, **kw):
        raise OSError("read-only")

    monkeypatch.setattr("rag.retrieve.write_index_meta", boom)
    with pytest.raises(OSError, match="read-only"):
        rebuild_index(target, NEW_CHUNKS, VECTORS, meta=_identity(), replace=True)
    validate_index(target, chunks=CHUNKS, identity=_identity(), collection="policy_chunks_v2")
    assert not list(tmp_path.glob(".idx.new-*"))


def test_dense_index_closes_the_client_when_build_fails(tmp_path):
    target = tmp_path / "idx"
    with pytest.raises(IndexCompatibilityError, match="vector count"):
        DenseIndex(CHUNKS, VECTORS[:1], path=str(target), meta=_identity())
    shutil.rmtree(target)  # Windows refuses this while the Qdrant client still holds the directory


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


def _corpus_base(tmp_path):
    base = tmp_path / "policy"
    (base / "src").mkdir(parents=True)
    (base / "src" / "manifest.json").write_text("{}", encoding="utf-8")
    (base / "chunks.jsonl").write_text('{"chunk_id": "OLD#000"}\n', encoding="utf-8")
    return base


def test_stage_fetch_cleans_the_stage_when_build_fails(tmp_path, monkeypatch):
    base = _corpus_base(tmp_path)
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")
    monkeypatch.setattr(mod, "fetch_all", lambda out_dir, only=None: {"manifest": {}, "review_events": []})

    def boom(_stage):
        raise RuntimeError("chunker failed")

    monkeypatch.setattr(mod, "build_chunks", boom)
    with pytest.raises(RuntimeError, match="chunker failed"):
        mod.stage_fetch(base, None)
    assert not list(base.glob(".src.new-*"))
    assert (base / "src" / "manifest.json").read_text(encoding="utf-8") == "{}"


def test_concurrent_fetch_is_refused_and_the_lock_is_released(tmp_path):
    base = _corpus_base(tmp_path)
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")
    with mod.fetch_lock(base):
        assert (base / ".fetch.lock" / "pid").exists()
        with pytest.raises(SystemExit, match="another fetch"):
            with mod.fetch_lock(base):
                pass
    assert not (base / ".fetch.lock").exists()


def test_publish_failure_between_swaps_restores_the_previous_corpus(tmp_path, monkeypatch):
    base = _corpus_base(tmp_path)
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "manifest.json").write_text('{"NEW": {"status": "fetched"}}', encoding="utf-8")
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")
    real_replace = os.replace

    def replace(src, dst):
        if Path(dst) == base / "chunks.jsonl":
            raise OSError("chunks write failed")
        return real_replace(src, dst)

    monkeypatch.setattr(mod.os, "replace", replace)
    with pytest.raises(OSError, match="chunks write failed"):
        mod.publish(base, stage, [{"chunk_id": "NEW#000"}])
    assert (base / "src" / "manifest.json").read_text(encoding="utf-8") == "{}"
    assert (base / "chunks.jsonl").read_text(encoding="utf-8") == '{"chunk_id": "OLD#000"}\n'
    assert not list(base.glob(".src.old-*"))
    assert not list(base.glob(".src.failed-*"))
    assert not list(base.glob(".chunks.jsonl.new-*"))


def test_publish_restore_failure_preserves_both_trees_and_reports_paths(tmp_path, monkeypatch):
    base = _corpus_base(tmp_path)
    stage = tmp_path / "stage"
    stage.mkdir()
    (stage / "manifest.json").write_text('{"NEW": {"status": "fetched"}}', encoding="utf-8")
    mod = _load("fetch_sources", "scripts/policy/fetch_sources.py")
    real_replace = os.replace

    def replace(src, dst):
        if Path(dst) == base / "chunks.jsonl":
            raise OSError("chunks write failed")
        if ".src.old-" in str(src):
            raise OSError("restore failed")
        return real_replace(src, dst)

    monkeypatch.setattr(mod.os, "replace", replace)
    with pytest.raises(RuntimeError, match="could not be restored") as e:
        mod.publish(base, stage, [{"chunk_id": "NEW#000"}])
    backups, failed = list(base.glob(".src.old-*")), list(base.glob(".src.failed-*"))
    assert len(backups) == 1 and len(failed) == 1
    assert (backups[0] / "manifest.json").read_text(encoding="utf-8") == "{}"
    assert (failed[0] / "manifest.json").read_text(encoding="utf-8") == '{"NEW": {"status": "fetched"}}'
    assert str(backups[0]) in str(e.value) and str(failed[0]) in str(e.value)
    assert (base / "chunks.jsonl").read_text(encoding="utf-8") == '{"chunk_id": "OLD#000"}\n'
