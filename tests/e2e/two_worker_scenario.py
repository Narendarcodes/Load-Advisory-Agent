"""One worker process for tests/e2e/two_worker_check.py.

Each invocation is a separate OS process with its own module-level guards, so a
successful handoff can only come from the shared Redis. Prints one JSON object.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Annotated, TypedDict

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "apps" / "api" / "src"))

from langgraph.graph import END, START, StateGraph  # noqa: E402

from loan_advisory.agent.checkpoint import CheckpointUnavailable, build_checkpointer  # noqa: E402
from loan_advisory.api.assertion import (  # noqa: E402
    AssertionRejected,
    AssertionUnavailable,
    replay,
    verify,
)
from loan_advisory.api.limits import BudgetExceeded, BudgetUnavailable, enforce  # noqa: E402


class TurnState(TypedDict):
    n: Annotated[int, lambda left, right: left + right]
    messages: Annotated[list, lambda left, right: left + right]


def _advance(state: dict) -> dict:
    return {"n": 1}


def _graph():
    builder = StateGraph(TurnState)
    builder.add_node("advance", _advance)
    builder.add_edge(START, "advance")
    builder.add_edge("advance", END)
    return builder.compile(checkpointer=build_checkpointer())


def emit(payload: dict) -> None:
    print(json.dumps(payload))


def main(argv: list[str]) -> int:
    command = argv[0]
    if command == "replay":
        token = argv[1]
        try:
            payload = verify(token)
        except AssertionRejected as exc:
            emit({"ok": False, "kind": "rejected", "error": str(exc)})
            return 0
        except AssertionUnavailable as exc:
            emit({"ok": False, "kind": "unavailable", "error": str(exc)})
            return 0
        emit({"ok": True, "sub": payload["sub"], "jti": payload["jti"]})
        return 0

    if command == "budget":
        scope, identity, limit, window = argv[1], argv[2], int(argv[3]), int(argv[4])
        try:
            enforce(scope, identity, limit, window)
        except BudgetExceeded as exc:
            emit({"ok": False, "kind": "exceeded", "retry_after": exc.retry_after})
            return 0
        except BudgetUnavailable as exc:
            emit({"ok": False, "kind": "unavailable", "error": str(exc)})
            return 0
        emit({"ok": True})
        return 0

    if command == "graph":
        thread, message = argv[1], argv[2]
        graph = _graph()
        state = graph.invoke(
            {"messages": [message]}, {"configurable": {"thread_id": thread}}
        )
        snapshot = graph.get_state({"configurable": {"thread_id": thread}})
        emit(
            {
                "ok": True,
                "n": state.get("n"),
                "messages": list(state.get("messages") or []),
                "checkpoint_id": snapshot.config.get("configurable", {}).get("checkpoint_id"),
            }
        )
        return 0

    if command == "memory-replay":
        now = int(__import__("time").time())
        try:
            replay.claim("probe-jti", now + 60, now)
        except AssertionUnavailable as exc:
            emit({"ok": False, "kind": "unavailable", "error": str(exc)})
            return 0
        except AssertionRejected as exc:
            emit({"ok": False, "kind": "rejected", "error": str(exc)})
            return 0
        emit({"ok": True})
        return 0

    if command == "memory-checkpoint":
        try:
            build_checkpointer()
        except CheckpointUnavailable as exc:
            emit({"ok": False, "kind": "unavailable", "error": str(exc)})
            return 0
        emit({"ok": True})
        return 0

    emit({"ok": False, "kind": "unknown-command", "error": command})
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
