"""Provenance metadata for the policy vector index.

A local Qdrant collection records neither the model nor the prompts nor the corpus that produced its
vectors. Without a sidecar, changing EMBED_MODEL or chunks.jsonl silently reuses incompatible vectors.
This module writes that metadata at index build time and fails closed when an index cannot be verified.
"""
import hashlib
import json
import math
import re
from collections.abc import Iterable, Mapping
from datetime import datetime, timezone
from pathlib import Path

META_FILE = "index_compat.json"
SCHEMA = 1
DISTANCE = "COSINE"


class IndexCompatibilityError(RuntimeError):
    pass


def corpus_fingerprint(chunks: list[dict]) -> str:
    h = hashlib.sha256()
    for c in sorted(chunks, key=lambda x: x["chunk_id"]):
        digest = c.get("chunk_sha256") or hashlib.sha256(c["text"].encode("utf-8")).hexdigest()
        h.update(f"{c['chunk_id']}:{digest}\n".encode("utf-8"))
    return h.hexdigest()


def index_identity(*, embed_model: str, dimension: int | None, doc_prefix: str, query_prompt: str,
                   query_prompt_text: str | None, provenance: dict | None = None) -> dict:
    identity = {"schema": SCHEMA, "embed_model": embed_model, "dimension": dimension, "distance": DISTANCE,
                "doc_prefix": doc_prefix, "query_prompt": query_prompt, "query_prompt_text": query_prompt_text}
    if provenance:
        identity.update(provenance)
    return identity


def _json_safe(value):
    if isinstance(value, Mapping):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, "to_dict") and callable(value.to_dict):
        return _json_safe(value.to_dict())
    return str(value)


def validate_model_revision(revision: str) -> str:
    """Accept only immutable Hugging Face commit identifiers, never branch names."""
    if not isinstance(revision, str) or not re.fullmatch(r"(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})", revision):
        raise IndexCompatibilityError(
            "model_revision must be an immutable 40- or 64-character hexadecimal commit ID"
        )
    return revision


def index_build_provenance(*, model_id: str, model_revision: str, dimension: int,
                           distance: str, model_configuration: Mapping,
                           embedding_dtype: str, library_versions: Mapping,
                           checkpoint_sha256: str | None = None) -> dict:
    """Build immutable provenance fields for a newly generated vector index."""
    validate_model_revision(model_revision)
    if not isinstance(model_id, str) or not model_id.strip():
        raise IndexCompatibilityError("model_id must be a non-empty string")
    if not isinstance(dimension, int) or dimension <= 0:
        raise IndexCompatibilityError("embedding dimension must be a positive integer")
    if not isinstance(model_configuration, Mapping) or not model_configuration:
        raise IndexCompatibilityError("model_configuration must be a non-empty mapping")
    if not isinstance(library_versions, Mapping) or not library_versions:
        raise IndexCompatibilityError("library_versions must be a non-empty mapping")
    if checkpoint_sha256 is not None and not re.fullmatch(r"[0-9a-fA-F]{64}", checkpoint_sha256):
        raise IndexCompatibilityError("checkpoint_sha256 must be a 64-character SHA-256 hex digest")
    return {
        "build_provenance_schema": 1,
        "model_id": model_id,
        "model_revision": model_revision,
        "embedding_dimensions": dimension,
        "distance_metric": str(distance).upper(),
        "model_configuration": _json_safe(model_configuration),
        "embedding_dtype": str(embedding_dtype),
        "checkpoint_sha256": checkpoint_sha256,
        "library_versions": _json_safe(library_versions),
    }


def checkpoint_artifact_sha256(snapshot_dir: str | Path, files: Iterable[str | Path]) -> str | None:
    """Hash actual checkpoint file contents plus stable relative paths."""
    root = Path(snapshot_dir)
    paths = sorted((Path(file) for file in files), key=lambda path: path.as_posix())
    if not paths:
        return None
    digest = hashlib.sha256()
    for path in paths:
        relative = path.relative_to(root).as_posix()
        file_digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
                file_digest.update(block)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(file_digest.digest())
        digest.update(b"\n")
    return digest.hexdigest()


def validate_vectors(chunks: list[dict], vectors, dimension: int | None = None) -> int:
    """Validate candidate points before they are written; returns the vector dimension.

    This is the only reliable place to reject a malformed candidate: the build path passes these
    vectors straight to Qdrant, so nothing later re-reads their values.
    """
    n = len(chunks)
    if n == 0:
        raise IndexCompatibilityError("cannot build a vector index from an empty chunk list")
    if len(vectors) != n:
        raise IndexCompatibilityError(f"vector count {len(vectors)} does not match chunk count {n}")
    ids = [c.get("chunk_id") for c in chunks]
    if any(not isinstance(cid, str) or not cid for cid in ids):
        raise IndexCompatibilityError("every chunk needs a non-empty chunk_id")
    if len(set(ids)) != n:
        raise IndexCompatibilityError("duplicate chunk_id in the candidate corpus")
    if dimension is not None:
        dim = dimension
    else:
        try:
            dim = len(vectors[0])
        except TypeError:
            raise IndexCompatibilityError("vector 0 is not a sequence") from None
    for i, v in enumerate(vectors):
        try:
            width = len(v)
        except TypeError:
            raise IndexCompatibilityError(f"vector {i} is not a sequence") from None
        if width != dim:
            raise IndexCompatibilityError(f"vector {i} has {width} dimensions, expected {dim}")
        try:
            finite = all(math.isfinite(float(x)) for x in v)
        except (TypeError, ValueError):
            raise IndexCompatibilityError(f"vector {i} contains a non-numeric value") from None
        if not finite:
            raise IndexCompatibilityError(f"vector {i} contains a non-finite value (NaN or infinity)")
    return dim


def write_index_meta(path: str | Path, identity: dict, chunks: list[dict], collection: str) -> dict:
    built_at = datetime.now(timezone.utc).isoformat()
    meta = {**identity, "collection": collection, "chunks": len(chunks), "corpus_hash": corpus_fingerprint(chunks),
            "created_at": built_at, "build_timestamp": built_at}
    p = Path(path) / META_FILE
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(meta, indent=1), encoding="utf-8")
    return meta


def load_index_meta(path: str | Path) -> dict:
    p = Path(path) / META_FILE
    if not p.exists():
        raise IndexCompatibilityError(
            f"vector index at {path} has no {META_FILE}: cannot verify model, prompt or corpus provenance. "
            "Rebuild it with the current code or restore its metadata; refusing to use it unverified.")
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise IndexCompatibilityError(f"unreadable index metadata at {p}: {e}") from e


def validate_index(path: str | Path, *, chunks: list[dict], identity: dict, collection: str) -> dict:
    meta = load_index_meta(path)
    expected = {**identity, "collection": collection, "chunks": len(chunks), "corpus_hash": corpus_fingerprint(chunks)}
    diffs = [f"{k}: index={meta.get(k)!r} expected={v!r}" for k, v in expected.items() if meta.get(k) != v]
    if diffs:
        raise IndexCompatibilityError("vector index does not match this model/corpus; rebuild it explicitly:\n  "
                                      + "\n  ".join(diffs))
    return meta


def collection_chunk_ids(client, collection: str) -> set:
    ids, offset = set(), None
    while True:
        points, offset = client.scroll(collection, limit=512, offset=offset, with_payload=["chunk_id"],
                                       with_vectors=False)
        ids.update(p.payload.get("chunk_id") for p in points)
        if offset is None:
            return ids


def validate_collection(client, collection: str, *, dimension: int | None, distance: str, chunk_ids: set) -> None:
    try:
        vectors = client.get_collection(collection).config.params.vectors
        size, dist = vectors.size, vectors.distance
    except Exception as e:
        raise IndexCompatibilityError(f"cannot read vector collection {collection!r}: {e}") from e
    dist_name = str(getattr(dist, "name", dist)).upper()
    if dimension is not None and size != dimension:
        raise IndexCompatibilityError(f"vector size is {size}, expected {dimension}; the index was built by a "
                                      "different embedding model")
    if dist_name != distance.upper():
        raise IndexCompatibilityError(f"distance is {dist_name}, expected {distance.upper()}")
    try:
        count = client.count(collection).count
    except Exception as e:
        raise IndexCompatibilityError(f"cannot count points in collection {collection!r}: {e}") from e
    if count != len(chunk_ids):
        raise IndexCompatibilityError(f"index has {count} points, expected {len(chunk_ids)}; the index is stale "
                                      "or has duplicate points, rebuild it")
    indexed = collection_chunk_ids(client, collection)
    missing, extra = sorted(chunk_ids - indexed)[:5], sorted(indexed - chunk_ids)[:5]
    if missing or extra:
        raise IndexCompatibilityError(f"index payload does not match chunks.jsonl (missing={missing}, extra={extra}); "
                                      "the index is stale, rebuild it")
