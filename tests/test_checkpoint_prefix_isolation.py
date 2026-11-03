"""Phase 1.6 C: a production checkpoint namespace has to be this deployment's own.

Keys are `<prefix>idx:<thread digest>`, `<prefix>ckpt:<digest>:<id>`, `<prefix>writes:...` and a shared
`<prefix>threads` hash. With the shipped default prefix, two deployments pointed at the same Redis
database are in one keyspace: each can list and load the other's conversation state, which holds raw
borrower messages. Production therefore has to name a prefix, and naming the shared default is not
naming one.
"""
import pytest

from loan_advisory.agent import checkpoint
from loan_advisory.agent.checkpoint import DEFAULT_PREFIX, CheckpointUnavailable, RedisCheckpointSaver
from tests.test_shared_checkpointer import FakeRedis

CHECKPOINT = {"id": "c1", "ts": "2026-11-03T00:00:00Z", "channel_values": {"intent": "explain"},
              "versions_seen": {}, "parent_id": None}
META = {"step": 1, "source": "input"}


def _config(thread):
    return {"configurable": {"thread_id": thread, "checkpoint_ns": "", "checkpoint_id": "c1"}}


def _production(monkeypatch, prefix=None, backend="redis"):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", backend)
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", "redis://127.0.0.1:1")
    monkeypatch.setenv("AGENT_CHECKPOINT_TTL_S", "3600")          # isolate this test from the TTL rule
    monkeypatch.delenv("AGENT_CHECKPOINT_PREFIX", raising=False)
    if prefix is not None:
        monkeypatch.setenv("AGENT_CHECKPOINT_PREFIX", prefix)


class _Client(FakeRedis):
    """The saver's few commands, on one shared dict — the same stand-in the Phase F suite uses."""

    def expire(self, key, seconds):
        return True

    def hgetall(self, key):
        return dict(self.hashes.get(key, {}))     # redis-py hands back a new dict, not its live store

    def hset(self, key, *args, **kwargs):
        row = self.hashes.setdefault(key, {})
        if kwargs:
            row.update({k: _bytes(v) for k, v in kwargs.items()})
        else:
            field, value = args
            row[_bytes(field)] = _bytes(value)
        return 1

    def hexists(self, key, field):
        return field in self.hashes.get(key, {})

    def hdel(self, key, *fields):
        row = self.hashes.get(key, {})
        for f in fields:
            row.pop(_bytes(f), None)
        return 1

    def zadd(self, key, mapping):
        z = self.zsets.setdefault(key, {})
        z.update({_bytes(k): float(v) for k, v in mapping.items()})
        return len(mapping)

    def zrange(self, key, start, stop):
        return list(self.zsets.get(key, {}))

    def zrevrange(self, key, start, stop):
        return list(reversed(self.zsets.get(key, {})))

    def scan_iter(self, match=None, count=None):
        prefix = (match or "*").rstrip("*")
        for store in (self.strings, self.hashes, self.zsets):
            for k in list(store):
                if k.startswith(prefix):
                    yield k.encode()


def _bytes(value):
    return value.encode() if isinstance(value, str) else value


# ------------------------------------------------------------------ the production rule
def test_production_refuses_a_missing_prefix(monkeypatch):
    _production(monkeypatch)
    with pytest.raises(CheckpointUnavailable, match="AGENT_CHECKPOINT_PREFIX"):
        checkpoint.build_checkpointer()


def test_production_refuses_the_shared_default_prefix_explicitly_named(monkeypatch):
    """Naming the default is the same collision as leaving it unset, so it is not accepted either."""
    _production(monkeypatch, prefix=DEFAULT_PREFIX)
    with pytest.raises(CheckpointUnavailable, match="unique per deployment"):
        checkpoint.build_checkpointer()


def test_production_accepts_its_own_prefix_and_the_keyspace_uses_it(monkeypatch):
    _production(monkeypatch, prefix="loan-rangers:web:")
    monkeypatch.setattr(checkpoint.redis.Redis, "from_url", staticmethod(lambda url, **kw: _Client()))
    saver = checkpoint.build_checkpointer()
    assert saver._prefix == "loan-rangers:web:"
    saved = saver.put(_config("t1"), CHECKPOINT, META, {})
    keys = {k.decode() for k in saver._client.scan_iter(match="*", count=500)}
    assert keys, "nothing was written"
    assert all(k.startswith("loan-rangers:web:") for k in keys), sorted(keys)
    assert saved["configurable"]["thread_id"] == "t1"


def test_development_still_defaults_without_being_forced_to_choose(monkeypatch):
    """Compatibility: outside production the default namespace remains available and works."""
    for var in ("APP_ENV", "ENVIRONMENT"):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("AGENT_CHECKPOINT_BACKEND", "redis")
    monkeypatch.setenv("AGENT_CHECKPOINT_REDIS_URL", "redis://127.0.0.1:1")
    monkeypatch.delenv("AGENT_CHECKPOINT_PREFIX", raising=False)
    monkeypatch.setattr(checkpoint.redis.Redis, "from_url", staticmethod(lambda url, **kw: _Client()))
    saver = checkpoint.build_checkpointer()
    assert saver._prefix == DEFAULT_PREFIX
    saved = saver.put(_config("dev-thread"), CHECKPOINT, META, {})
    assert saver.get_tuple({"configurable": saved["configurable"]}) is not None


# ------------------------------------------------------------------ the isolation property itself
def test_two_deployments_on_one_store_cannot_read_each_others_threads():
    """One Redis client object, two prefixes, two worlds — including for the same thread id."""
    shared = _Client()
    web = RedisCheckpointSaver(shared, prefix="loan-rangers:web:", ttl_s=3600)
    voice = RedisCheckpointSaver(shared, prefix="loan-rangers:voice:", ttl_s=3600)
    thread = "conversation-42"

    saved = web.put(_config(thread), CHECKPOINT, META, {})
    assert web.get_tuple({"configurable": saved["configurable"]}) is not None, "the owner cannot read its own"

    # the second deployment asks for the same thread id and the same checkpoint id: it finds nothing
    same_thread = {"configurable": {"thread_id": thread, "checkpoint_ns": "", "checkpoint_id": "c1"}}
    assert voice.get_tuple(same_thread) is None, "a second prefix read another deployment's checkpoint"
    assert list(voice.list(same_thread)) == [], "a second deployment listed a thread it does not own"
    assert list(voice.list(None, limit=5)) == [], "an empty namespace reported someone else's threads"

    # each side writes its own state under the same thread id, and neither sees the other's
    theirs = {"id": "c1", "ts": "x", "channel_values": {"intent": "policy"}, "versions_seen": {}, "parent_id": None}
    mine = dict(CHECKPOINT)
    voice.put(_config(thread), theirs, META, {})
    web_saved = web.put(_config("conversation-43"), mine, META, {})

    # each namespace lists exactly its own threads: web holds conversation-42 and -43, voice one
    assert [t.checkpoint["channel_values"]["intent"] for t in voice.list(None, limit=5)] == ["policy"]
    assert len(list(web.list(None, limit=5))) == 2
    assert {t.config["configurable"]["thread_id"] for t in voice.list(None, limit=5)} == {thread}
    assert thread in {t.config["configurable"]["thread_id"] for t in web.list(None, limit=5)}
    assert web.get_tuple({"configurable": web_saved["configurable"]}).checkpoint["channel_values"]["intent"] == "explain"
    own = voice.get_tuple(same_thread)
    assert own is not None and own.checkpoint["channel_values"]["intent"] == "policy",         "the same thread id under another prefix resolved to someone else's state"

    web.delete_thread(thread)
    assert len(list(web.list(None, limit=5))) == 1, "deleting one namespace removed a thread from itself"
    survived = voice.get_tuple(same_thread)
    assert survived is not None and survived.checkpoint["channel_values"]["intent"] == "policy",         "one namespace's deletion removed the other's state"
    assert len(list(voice.list(None, limit=5))) == 1, "the other namespace lost a thread it owns"
