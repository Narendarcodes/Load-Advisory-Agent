"""LangGraph checkpoints in the shared Redis, so one conversation survives a worker change.

Every uvicorn worker compiles its own graph; the in-memory saver keeps state inside that
process, so a turn served by worker A is invisible to worker B. This saver stores one
typed checkpoint blob per `(thread_id, checkpoint_ns, checkpoint_id)` plus ordered writes,
all keyed by the same Redis URL the assertion replay store uses.

Process-local memory stays the development default, and is refused when `APP_ENV` /
`ENVIRONMENT` is production — the same fail-closed rule as `api/assertion.py`. Retention
is deliberately not decided here: `AGENT_CHECKPOINT_TTL_S` is off unless an operator sets
it, because the retention period is an owner decision, not a library default.
"""
from __future__ import annotations

import hashlib
import os
from typing import Any, Iterator, Sequence

import redis
from langgraph.checkpoint.base import (
    WRITES_IDX_MAP,
    BaseCheckpointSaver,
    CheckpointMetadata,
    CheckpointTuple,
    get_checkpoint_id,
    get_checkpoint_metadata,
)
from langgraph.checkpoint.memory import InMemorySaver

PRODUCTION_ENV = {"production", "prod"}
DEFAULT_PREFIX = "advisory:graph:v1:"


class CheckpointUnavailable(RuntimeError):
    """The checkpoint store cannot be used; the service must not fall back to per-process state."""


def _thread_digest(thread_id: str, checkpoint_ns: str) -> str:
    return hashlib.sha256(f"{thread_id}\x00{checkpoint_ns}".encode("utf-8")).hexdigest()[:40]


class RedisCheckpointSaver(BaseCheckpointSaver):
    """Synchronous LangGraph saver; `graph.invoke` is the only path the service uses."""

    def __init__(self, client, *, prefix: str = DEFAULT_PREFIX, ttl_s: int = 0) -> None:
        super().__init__()
        self._client = client
        self._prefix = prefix
        self._ttl = max(0, int(ttl_s))

    # ------------------------------------------------------------------ keys
    def _index_key(self, thread_id: str, checkpoint_ns: str) -> str:
        return f"{self._prefix}idx:{_thread_digest(thread_id, checkpoint_ns)}"

    def _checkpoint_key(self, thread_id: str, checkpoint_ns: str, checkpoint_id: str) -> str:
        return f"{self._prefix}ckpt:{_thread_digest(thread_id, checkpoint_ns)}:{checkpoint_id}"

    def _writes_key(self, thread_id: str, checkpoint_ns: str, checkpoint_id: str) -> str:
        return f"{self._prefix}writes:{_thread_digest(thread_id, checkpoint_ns)}:{checkpoint_id}"

    def _expire(self, *keys: str) -> None:
        if not self._ttl:
            return
        for key in keys:
            self._client.expire(key, self._ttl)

    # ------------------------------------------------------------------ typed blobs
    def _pack(self, value: Any) -> bytes:
        kind, data = self.serde.dumps_typed(value)
        return kind.encode("ascii") + b"\n" + data

    def _unpack(self, raw: bytes) -> Any:
        kind, _, data = raw.partition(b"\n")
        return self.serde.loads_typed((kind.decode("ascii"), data))

    # ------------------------------------------------------------------ reads
    def get_tuple(self, config) -> CheckpointTuple | None:
        configurable = config["configurable"]
        thread_id = configurable["thread_id"]
        checkpoint_ns = configurable.get("checkpoint_ns", "")
        index = self._index_key(thread_id, checkpoint_ns)
        checkpoint_id = get_checkpoint_id(config)
        if not checkpoint_id:
            latest = self._client.zrange(index, -1, -1)
            if not latest:
                return None
            checkpoint_id = latest[0].decode("utf-8")
        raw = self._client.get(self._checkpoint_key(thread_id, checkpoint_ns, checkpoint_id))
        if raw is None:
            return None
        stored = self._unpack(raw)
        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            },
            checkpoint=stored["checkpoint"],
            metadata=stored["metadata"],
            parent_config=(
                {
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": stored["parent_id"],
                    }
                }
                if stored["parent_id"]
                else None
            ),
            pending_writes=self._pending_writes(thread_id, checkpoint_ns, checkpoint_id),
        )

    def list(
        self,
        config,
        *,
        filter: dict[str, Any] | None = None,
        before=None,
        limit: int | None = None,
    ) -> Iterator[CheckpointTuple]:
        if config is not None:
            threads = [
                (
                    config["configurable"]["thread_id"],
                    config["configurable"].get("checkpoint_ns", ""),
                )
            ]
        else:
            threads = []
            for raw in self._client.hgetall(f"{self._prefix}threads").values():
                thread_id, _, checkpoint_ns = raw.decode("utf-8").partition("\x00")
                threads.append((thread_id, checkpoint_ns))
        wanted_id = get_checkpoint_id(config) if config else None
        before_id = get_checkpoint_id(before) if before else None
        emitted = 0
        for thread_id, checkpoint_ns in threads:
            index = self._index_key(thread_id, checkpoint_ns)
            for raw_id in self._client.zrevrange(index, 0, -1):
                checkpoint_id = raw_id.decode("utf-8")
                if wanted_id and checkpoint_id != wanted_id:
                    continue
                if before_id and checkpoint_id >= before_id:
                    continue
                raw = self._client.get(self._checkpoint_key(thread_id, checkpoint_ns, checkpoint_id))
                if raw is None:
                    continue
                stored = self._unpack(raw)
                if filter and not all(stored["metadata"].get(key) == value for key, value in filter.items()):
                    continue
                yield CheckpointTuple(
                    config={
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": checkpoint_id,
                        }
                    },
                    checkpoint=stored["checkpoint"],
                    metadata=stored["metadata"],
                    parent_config=(
                        {
                            "configurable": {
                                "thread_id": thread_id,
                                "checkpoint_ns": checkpoint_ns,
                                "checkpoint_id": stored["parent_id"],
                            }
                        }
                        if stored["parent_id"]
                        else None
                    ),
                    pending_writes=self._pending_writes(thread_id, checkpoint_ns, checkpoint_id),
                )
                emitted += 1
                if limit is not None and emitted >= limit:
                    return

    # ------------------------------------------------------------------ writes
    def put(self, config, checkpoint, metadata: CheckpointMetadata, new_versions) -> Any:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        index = self._index_key(thread_id, checkpoint_ns)
        checkpoint_key = self._checkpoint_key(thread_id, checkpoint_ns, checkpoint_id)
        stored = {
            "checkpoint": checkpoint,
            "metadata": get_checkpoint_metadata(config, metadata),
            "parent_id": config["configurable"].get("checkpoint_id"),
        }
        self._client.set(checkpoint_key, self._pack(stored))
        self._client.zadd(index, {checkpoint_id: 0})
        # `list(None)` needs the real thread id back; the digest alone cannot supply it.
        self._client.hset(f"{self._prefix}threads", index, f"{thread_id}\x00{checkpoint_ns}")
        self._expire(checkpoint_key, index, f"{self._prefix}threads")
        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    def put_writes(self, config, writes: Sequence[tuple[str, Any]], task_id: str, task_path: str = "") -> None:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"]["checkpoint_id"]
        writes_key = self._writes_key(thread_id, checkpoint_ns, checkpoint_id)
        for position, (channel, value) in enumerate(writes):
            index = WRITES_IDX_MAP.get(channel, position)
            field = f"{task_id}:{index}"
            if index >= 0 and self._client.hexists(writes_key, field):
                continue
            kind, data = self.serde.dumps_typed(value)
            packed = self._pack({"task_id": task_id, "channel": channel, "kind": kind, "data": data, "path": task_path})
            self._client.hset(writes_key, field, packed)
        self._expire(writes_key)

    def delete_thread(self, thread_id: str) -> None:
        for field, raw in self._client.hgetall(f"{self._prefix}threads").items():
            stored_thread, _, checkpoint_ns = raw.decode("utf-8").partition("\x00")
            if stored_thread != thread_id:
                continue
            index = self._index_key(thread_id, checkpoint_ns)
            for raw_id in self._client.zrange(index, 0, -1):
                checkpoint_id = raw_id.decode("utf-8")
                self._client.delete(self._checkpoint_key(thread_id, checkpoint_ns, checkpoint_id))
                self._client.delete(self._writes_key(thread_id, checkpoint_ns, checkpoint_id))
            self._client.delete(index)
            self._client.hdel(f"{self._prefix}threads", field)

    # ------------------------------------------------------------------ helpers
    def _pending_writes(self, thread_id: str, checkpoint_ns: str, checkpoint_id: str):
        rows = []
        for field, packed in self._client.hgetall(self._writes_key(thread_id, checkpoint_ns, checkpoint_id)).items():
            stored = self._unpack(packed)
            position = int(field.decode("utf-8").rsplit(":", 1)[1])
            rows.append((stored["task_id"], position, stored))
        return [
            (stored["task_id"], stored["channel"], self.serde.loads_typed((stored["kind"], stored["data"])))
            for _, _, stored in sorted(rows, key=lambda row: (row[0], row[1]))
        ]


def build_checkpointer():
    """The configured saver; raises instead of silently keeping state per process."""
    url = (
        os.environ.get("AGENT_CHECKPOINT_REDIS_URL")
        or os.environ.get("ASSERTION_REPLAY_REDIS_URL")
        or ""
    ).strip()
    backend = (os.environ.get("AGENT_CHECKPOINT_BACKEND") or "auto").strip().lower()
    environment = (os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "").strip().lower()
    ttl = int(os.environ.get("AGENT_CHECKPOINT_TTL_S") or 0)
    prefix = (os.environ.get("AGENT_CHECKPOINT_PREFIX") or DEFAULT_PREFIX).strip()
    if backend == "auto":
        backend = "redis" if url else "memory"
    if backend == "redis":
        if not url:
            raise CheckpointUnavailable("checkpoints are misconfigured: no Redis URL")
        try:
            client = redis.Redis.from_url(url, socket_connect_timeout=1.0, socket_timeout=1.0)
            client.ping()
        except (redis.RedisError, OSError) as exc:
            raise CheckpointUnavailable(f"checkpoint store is unavailable: {exc}") from exc
        return RedisCheckpointSaver(client, prefix=prefix, ttl_s=ttl)
    if backend == "memory":
        if environment in PRODUCTION_ENV:
            raise CheckpointUnavailable("checkpoints cannot use process-local memory in production")
        return InMemorySaver()
    raise CheckpointUnavailable(f"checkpoint backend {backend!r} is not supported")
