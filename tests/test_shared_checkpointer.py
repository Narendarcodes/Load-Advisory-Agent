"""Shared graph checkpoints across workers (Phase F).

`RedisCheckpointSaver` is exercised through an in-memory fake with the Redis command
surface it uses, shared by two saver instances that stand in for two uvicorn workers.
The last test compiles the same graph twice and proves the second worker continues the
first worker's thread.
"""
import operator
from typing import Annotated, TypedDict

import pytest

from loan_advisory.agent import checkpoint
from loan_advisory.agent.checkpoint import CheckpointUnavailable, RedisCheckpointSaver


class FakeRedis:
    def __init__(self):
        self.strings: dict[str, bytes] = {}
        self.hashes: dict[str, dict[bytes, bytes]] = {}
        self.zsets: dict[str, dict[bytes, float]] = {}

    def ping(self):
        return True

    def set(self, key, value, **_):
        self.strings[key] = value.encode() if isinstance(value, str) else value
        return True

    def get(self, key):
        return self.strings.get(key)

    def delete(self, *keys):
        removed = 0
        for key in keys:
            removed += key in self.strings
            self.strings.pop(key, None)
            self.hashes.pop(key, None)
            self.zsets.pop(key, None)
        return removed

    def expire(self, key, _seconds):
        return key in self.strings or key in self.hashes or key in self.zsets

    def zadd(self, key, mapping):
        bucket = self.zsets.setdefault(key, {})
        for member, score in mapping.items():
            bucket[member.encode() if isinstance(member, str) else member] = float(score)
        return len(mapping)

    def _ordered(self, key):
        return [member for member, _ in sorted(self.zsets.get(key, {}).items())]

    def zrange(self, key, start, end):
        members = self._ordered(key)
        return _slice(members, start, end)

    def zrevrange(self, key, start, end):
        return _slice(list(reversed(self._ordered(key))), start, end)

    def hset(self, key, field, value):
        bucket = self.hashes.setdefault(key, {})
        encoded = field.encode() if isinstance(field, str) else field
        bucket[encoded] = value.encode() if isinstance(value, str) else value
        return 1

    def hexists(self, key, field):
        encoded = field.encode() if isinstance(field, str) else field
        return encoded in self.hashes.get(key, {})

    def hgetall(self, key):
        return dict(self.hashes.get(key, {}))

    def hdel(self, key, field):
        encoded = field.encode() if isinstance(field, str) else field
        return 1 if self.hashes.get(key, {}).pop(encoded, None) is not None else 0


def _slice(items, start, end):
    length = len(items)
    start = length + start if start < 0 else start
    end = length + end if end < 0 else end
    return items[start : end + 1]


def _checkpoint(checkpoint_id: str, step: int, messages: list[str] | None = None):
    return {
        "v": 1,
        "id": checkpoint_id,
        "ts": f"2026-10-31T00:00:0{step}.000000+00:00",
        "channel_values": {"messages": list(messages or [])},
        "channel_versions": {"messages": step},
        "versions_seen": {},
        "pending_sends": [],
    }


METADATA = {"source": "loop", "step": 1, "parents": {}}


def test_checkpoint_is_visible_to_a_second_saver():
    server = FakeRedis()
    first = RedisCheckpointSaver(server, prefix="test:")
    second = RedisCheckpointSaver(server, prefix="test:")

    saved = first.put(
        {"configurable": {"thread_id": "borrower::thread-1", "checkpoint_ns": ""}},
        _checkpoint("ckpt-1", 1),
        METADATA,
        {"messages": 1},
    )
    assert saved["configurable"]["checkpoint_id"] == "ckpt-1"

    loaded = second.get_tuple(saved)
    assert loaded is not None
    assert loaded.checkpoint["channel_values"]["messages"] == []
    assert loaded.metadata["step"] == 1
    assert loaded.config["configurable"]["thread_id"] == "borrower::thread-1"


def test_latest_checkpoint_is_returned_and_parent_links():
    server = FakeRedis()
    saver = RedisCheckpointSaver(server, prefix="test:")
    config = {"configurable": {"thread_id": "t", "checkpoint_ns": ""}}
    saver.put(config, _checkpoint("ckpt-1", 1), METADATA, {})
    saver.put(
        {"configurable": {"thread_id": "t", "checkpoint_ns": "", "checkpoint_id": "ckpt-1"}},
        _checkpoint("ckpt-2", 2),
        METADATA,
        {},
    )

    latest = saver.get_tuple(config)
    assert latest.checkpoint["id"] == "ckpt-2"
    assert latest.parent_config["configurable"]["checkpoint_id"] == "ckpt-1"

    first = saver.get_tuple({"configurable": {"thread_id": "t", "checkpoint_ns": "", "checkpoint_id": "ckpt-1"}})
    assert first.checkpoint["id"] == "ckpt-1"
    assert first.parent_config is None


def test_pending_writes_are_shared_ordered_and_idempotent():
    server = FakeRedis()
    first = RedisCheckpointSaver(server, prefix="test:")
    second = RedisCheckpointSaver(server, prefix="test:")
    config = {"configurable": {"thread_id": "t", "checkpoint_ns": "", "checkpoint_id": "ckpt-1"}}
    first.put({"configurable": {"thread_id": "t", "checkpoint_ns": ""}}, _checkpoint("ckpt-1", 1), METADATA, {})
    first.put_writes(config, [("messages", ["a"]), ("answer", "b")], task_id="task-1")
    first.put_writes(config, [("answer", "ignored")], task_id="task-1")

    loaded = second.get_tuple(config)
    assert loaded.pending_writes == [("task-1", "messages", ["a"]), ("task-1", "answer", "b")]


def test_list_is_newest_first_and_filters_by_metadata():
    server = FakeRedis()
    saver = RedisCheckpointSaver(server, prefix="test:")
    base = {"configurable": {"thread_id": "t", "checkpoint_ns": ""}}
    saver.put(base, _checkpoint("ckpt-1", 1), METADATA, {})
    saver.put(base, _checkpoint("ckpt-2", 2), {"source": "input", "step": 2, "parents": {}}, {})

    rows = list(saver.list(base))
    assert [row.checkpoint["id"] for row in rows] == ["ckpt-2", "ckpt-1"]
    assert [row.checkpoint["id"] for row in saver.list(base, filter={"source": "input"})] == ["ckpt-2"]
    assert [row.checkpoint["id"] for row in saver.list(base, limit=1)] == ["ckpt-2"]
    assert [row.checkpoint["id"] for row in saver.list(base, before={"configurable": {"thread_id": "t", "checkpoint_id": "ckpt-2"}})] == ["ckpt-1"]


def test_delete_thread_removes_checkpoints_and_writes():
    server = FakeRedis()
    saver = RedisCheckpointSaver(server, prefix="test:")
    config = {"configurable": {"thread_id": "t", "checkpoint_ns": "", "checkpoint_id": "ckpt-1"}}
    saver.put({"configurable": {"thread_id": "t", "checkpoint_ns": ""}}, _checkpoint("ckpt-1", 1), METADATA, {})
    saver.put_writes(config, [("answer", "b")], task_id="task-1")

    saver.delete_thread("t")
    assert saver.get_tuple({"configurable": {"thread_id": "t", "checkpoint_ns": ""}}) is None
    assert list(saver.list(None)) == []


class CounterState(TypedDict):
    n: Annotated[int, operator.add]


def test_two_compiled_graphs_continue_the_same_thread():
    from langgraph.graph import END, START, StateGraph

    def bump(state):
        return {"n": 1}

    builder = StateGraph(CounterState)
    builder.add_node("bump", bump)
    builder.add_edge(START, "bump")
    builder.add_edge("bump", END)

    server = FakeRedis()
    worker_a = builder.compile(checkpointer=RedisCheckpointSaver(server, prefix="test:"))
    worker_b = builder.compile(checkpointer=RedisCheckpointSaver(server, prefix="test:"))
    config = {"configurable": {"thread_id": "borrower::thread-9"}}

    first = worker_a.invoke({"n": 0}, config=config)
    second = worker_b.invoke({"n": 0}, config=config)

    assert first["n"] == 1
    assert second["n"] == 2, "worker B did not see worker A's checkpoint"


def test_production_refuses_process_local_checkpoints(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "memory")
    with pytest.raises(CheckpointUnavailable, match="process-local memory"):
        checkpoint.build_checkpointer()


def test_redis_backend_without_a_url_fails_closed(monkeypatch):
    monkeypatch.delenv("ASSERTION_REPLAY_REDIS_URL", raising=False)
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    with pytest.raises(CheckpointUnavailable, match="no Redis URL"):
        checkpoint.build_checkpointer()
