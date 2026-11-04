"""Dense retrieval at serving time: one existing Qdrant collection, read-only, embedded or server.

`rag.retrieve.DenseIndex` is the builder — it creates collections, creates payload indexes and upserts
points. Index management belongs there and in `scripts/policy/`. This module is what the serving
runtime holds, and it has no write surface at all: the state it keeps is a bound `query_points`, a
filter builder, and strings, so `application/ports.assert_reader` accepts it and refuses a raw client
or a builder handle (the check is `tests/test_agent_read_boundary.py`, and the mutation that reintroduces
a writable retriever is caught by `tests/test_qdrant_server_mode.py`).

Two backends, one selection rule (`AGENT_QDRANT_URL`):

  unset                          -> embedded/local mode, collection under `AGENT_QDRANT_DIR`
                                     (or `<LOAN_POLICY_DIR>/qdrant_v2`), exactly as before
  set to an http(s) origin       -> Qdrant Server mode, optional `AGENT_QDRANT_API_KEY`
  set together with an explicit
  `AGENT_QDRANT_DIR`, malformed,
  or with a path/userinfo/query  -> refused at startup, not resolved by precedence

Neither mode can create or alter anything: opening verifies the collection against the corpus it will
be asked to search and fails closed. The dimension, distance, payload keys, filter construction and
point ids are shared with the builder, so a server collection is the same object with a different
transport — not a second, subtly different retrieval implementation.
"""
from dataclasses import dataclass
import os
from pathlib import Path
from typing import Callable
from urllib.parse import urlsplit

from rag.index_meta import validate_collection, validate_index
from rag.retrieve import qdrant_filter

DEFAULT_COLLECTION = "policy_chunks_v2"
URL_ENV = "AGENT_QDRANT_URL"
DIR_ENV = "AGENT_QDRANT_DIR"
COLLECTION_ENV = "AGENT_QDRANT_COLLECTION"
API_KEY_ENV = "AGENT_QDRANT_API_KEY"


class DenseConfigError(RuntimeError):
    """The dense backend is ambiguous, incomplete or malformed; nothing is opened and nothing is built."""


@dataclass(frozen=True)
class DenseBackend:
    mode: str            # "embedded" | "server"
    location: str        # collection directory, or the server origin
    collection: str

    @property
    def label(self) -> str:
        return f"{self.mode}:{self.location}#{self.collection}"


def select_dense_backend(env=None, *, default_dir=None) -> DenseBackend:
    """Decide the backend from configuration only. Never creates, never falls back silently."""
    env = os.environ if env is None else env
    raw_url = (env.get(URL_ENV) or "").strip()
    raw_dir = (env.get(DIR_ENV) or "").strip()
    collection = (env.get(COLLECTION_ENV) or DEFAULT_COLLECTION).strip()
    if not collection:
        raise DenseConfigError(f"{COLLECTION_ENV} is set but empty; name a collection or unset it")

    if not raw_url:
        location = raw_dir or str(default_dir or "")
        if not location:
            raise DenseConfigError("no dense index location: set LOAN_POLICY_DIR, or "
                                   f"{DIR_ENV}, or {URL_ENV} for a Qdrant Server")
        return DenseBackend("embedded", location, collection)

    parts = urlsplit(raw_url)
    if parts.scheme not in ("http", "https"):
        raise DenseConfigError(f"{URL_ENV} must be an http(s) origin, got scheme {parts.scheme!r}")
    if not parts.hostname:
        raise DenseConfigError(f"{URL_ENV} has no host: {raw_url!r}")
    if parts.username or parts.password:
        raise DenseConfigError(f"{URL_ENV} must not carry credentials in the URL; use {API_KEY_ENV}")
    if parts.path not in ("", "/"):
        raise DenseConfigError(f"{URL_ENV} must be an origin without a path (got {parts.path!r}); "
                               "the Qdrant client appends its own routes")
    if parts.query or parts.fragment:
        raise DenseConfigError(f"{URL_ENV} must not carry a query or fragment")
    if raw_dir:
        raise DenseConfigError(f"{URL_ENV} and {DIR_ENV} are both set; one index per process — unset "
                               f"{DIR_ENV} to serve from the server, or unset {URL_ENV} to serve embedded")
    return DenseBackend("server", f"{parts.scheme}://{parts.netloc}", collection)


class ReadOnlyDenseSearch:
    """Search one existing collection. No create, no upsert, no delete, no payload mutation."""

    def __init__(self, *, backend: DenseBackend, query_points: Callable, filter_for: Callable,
                 close: Callable | None = None):
        self.backend = backend.mode
        self.location = backend.location
        self.collection = backend.collection
        self._query_points = query_points
        self._filter_for = filter_for
        self._close = close

    # ------------------------------------------------------------------ opening
    @classmethod
    def open(cls, chunks: list[dict], identity: dict, *, backend: DenseBackend | None = None,
             env=None, default_dir: str | None = None) -> "ReadOnlyDenseSearch":
        env = os.environ if env is None else env
        backend = backend or select_dense_backend(env, default_dir=default_dir)
        client = _connect(backend, env)
        try:
            _verify(client, backend, chunks, identity)
            from qdrant_client import models
            return cls(backend=backend, query_points=client.query_points,
                       filter_for=lambda flt: qdrant_filter(models, flt), close=getattr(client, "close", None))
        except BaseException:
            try:
                client.close()
            except Exception:      # a failed open must not leak the embedded directory lock
                pass
            raise

    # ------------------------------------------------------------------ the only operation
    def search(self, qvec, mode="current", k: int = 50):
        from rag.retrieve import _as_filter
        flt = _as_filter(mode)
        points = self._query_points(self.collection, query=[float(x) for x in qvec],
                                    query_filter=self._filter_for(flt), limit=k).points
        return [(p.payload["chunk_id"], float(p.score)) for p in points]

    def describe(self) -> dict:
        """What to log for provenance: which backend served the answer, never a credential."""
        return {"qdrant.backend": self.backend, "qdrant.collection": self.collection,
                "qdrant.location": self.location if self.backend == "embedded" else _redact(self.location)}

    def close(self) -> None:
        if self._close is not None:
            self._close()


def _connect(backend: DenseBackend, env=None):
    from qdrant_client import QdrantClient
    env = os.environ if env is None else env
    if backend.mode == "embedded":
        path = Path(backend.location)
        if not (path / "collection").exists():
            raise DenseConfigError(
                f"no embedded index at {backend.location} (collection {backend.collection!r}). Build it with the "
                "index tooling (scripts/policy/eval_bajaj_retrieve.py --replace-index); the serving runtime never "
                "creates or embeds an index")
        return QdrantClient(path=str(path))
    api_key = (env.get(API_KEY_ENV) or "").strip() or None
    return QdrantClient(url=backend.location, api_key=api_key)


def _verify(client, backend: DenseBackend, chunks: list[dict], identity: dict) -> None:
    """Fail closed unless the collection is the one this corpus and model describe."""
    if not client.collection_exists(backend.collection):
        raise DenseConfigError(f"collection {backend.collection!r} does not exist on the Qdrant Server at "
                               f"{backend.location}; create it with the index tooling — the serving runtime "
                               "will not create, upsert or repair it")
    if backend.mode == "embedded":
        validate_index(backend.location, chunks=chunks, identity=identity, collection=backend.collection)
    validate_collection(client, backend.collection, dimension=identity.get("dimension"),
                        distance=identity.get("distance", "COSINE"),
                        chunk_ids={c["chunk_id"] for c in chunks})


def _redact(origin: str) -> str:
    """The host:port is report-worthy; anything else in the URL is not."""
    parts = urlsplit(origin)
    return f"{parts.scheme}://{parts.hostname}:{parts.port}" if parts.port else f"{parts.scheme}://{parts.hostname}"


__all__ = ["API_KEY_ENV", "COLLECTION_ENV", "DEFAULT_COLLECTION", "DIR_ENV", "URL_ENV", "DenseBackend",
           "DenseConfigError", "ReadOnlyDenseSearch", "select_dense_backend"]
