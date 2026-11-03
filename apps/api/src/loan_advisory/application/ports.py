"""The read-only ports the advisory agent is built against (Phase 1 security boundary B).

`DecisionTools` is the object graph a borrower turn can traverse, so it is where the boundary is
enforced — twice:

- **At type level.** Its constructor is annotated with `ApplicationReader` / `EvidenceSource`, so
  handing it a write-capable adapter is a type error at every call site a type checker sees.
- **At runtime.** `assert_reader` walks the state the object actually holds and refuses anything
  exposing a write method, so the boundary also survives a call site that ignores the annotation,
  and a future change that wires a sink or a full Frappe client back in fails at startup instead of
  on the first write.

**What this does not do.** Python cannot revoke a capability. A bound method keeps its owner
reachable through `method.__self__`, and this walk deliberately does not follow it: doing so would
flag every object that ever holds any method of anything. So the guard is a structural test of the
shipped wiring and a startup refusal of accidental re-wiring — not a sandbox against code already
running in this process. The two readers that hold a real credential (`ReadOnlyFrappeApplication`,
`FrappeEvidenceReader`) are built from configuration strings only and therefore pass the walk with
nothing behind them at all.

Two names need a qualification: `save` and `insert` are Frappe document verbs, and the agent's retriever
holds a cross-encoder whose library spells "write these weights" exactly that way. Matched everywhere, the
guard refused the real serving object while every fake in the suite passed. They are therefore matched
only on adapters this project owns; every other name is matched on every object, foreign or not, however
deeply nested — which is what keeps a raw `QdrantClient` or `FrappeClient` out of the graph.
"""
from collections.abc import Callable
from typing import Protocol

WRITE_METHOD_NAMES = frozenset({
    # Frappe / system-of-record writes
    "call_method", "create", "db_delete", "db_insert", "db_update", "delete", "delete_doc",
    "insert", "persist", "save", "set_status", "submit", "cancel", "revert",
    # vector-index writes: the serving runtime opens a collection, it never manages one
    "create_collection", "create_payload_index", "delete_collection", "delete_payload",
    "delete_points", "overwrite_payload", "recreate_collection", "update_collection", "upsert",
})

_NOT_WORTH_WALKING = (str, bytes, bool, int, float, complex, type(None), type(NotImplemented))

# `save` and `insert` are Frappe document writes, and the agent's retriever holds a cross-encoder whose
# library spells "persist these weights" exactly that way. Matched everywhere, the guard refused the real
# serving object and passed every fake in the suite (found live, Phase 1.6 §A). They are therefore checked
# only on adapters this project owns — which is where a document write can come from. Every other name is
# unambiguous and still matched on any object, foreign or not: that is what keeps a raw `QdrantClient`
# (upsert, delete_collection) and a `FrappeClient` (create, call_method) out of the graph.
_PROJECT_ONLY_WRITE_NAMES = frozenset({"save", "insert"})
_PROJECT_NAMESPACES = ("loan_advisory", "decision_engine", "rag", "zen")


def _is_project_adapter(obj) -> bool:
    module = (type(obj).__module__ or "").split(".", 1)[0]
    return module in _PROJECT_NAMESPACES


def _write_names(obj) -> list[str]:
    names = set(WRITE_METHOD_NAMES)
    if not _is_project_adapter(obj):
        names -= _PROJECT_ONLY_WRITE_NAMES
    return sorted(name for name in names if callable(getattr(obj, name, None)))


class ReadOnlyBoundaryViolation(TypeError):
    """The agent was handed an object that can write to the system of record."""


def _attributes(obj) -> list:
    """The instance state worth walking: attributes of user objects, not of values or builtins."""
    if isinstance(obj, _NOT_WORTH_WALKING) or isinstance(obj, (dict, list, tuple, set, frozenset, Callable)):
        return []
    return list(getattr(obj, "__dict__", {}).values())


def assert_reader(obj, *, role: str, max_depth: int = 3) -> None:
    """Refuse `obj` if it, or anything it holds within `max_depth`, exposes a write method."""
    frontier = [(obj, 0)]
    seen = set()
    while frontier:
        current, depth = frontier.pop()
        if id(current) in seen:
            continue
        seen.add(id(current))
        offending = _write_names(current)
        if offending:
            raise ReadOnlyBoundaryViolation(
                f"{role} is not read-only: {type(current).__name__} exposes {', '.join(offending)}")
        if depth >= max_depth:
            continue
        frontier.extend((value, depth + 1) for value in _attributes(current))


class ApplicationReader(Protocol):
    """Reads one Loan Application. Nothing in this interface can create or change a record."""

    def get(self, application_ref: str) -> dict: ...


class EvidenceSource(Protocol):
    """Reads the newest stored Decision Evidence for an application. Never writes one."""

    def latest(self, application_ref: str, doc: dict) -> dict | None: ...


__all__ = ["ApplicationReader", "EvidenceSource", "ReadOnlyBoundaryViolation", "WRITE_METHOD_NAMES", "assert_reader"]
