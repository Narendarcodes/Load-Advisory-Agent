"""Pure AG-UI event construction for one advisory turn.

No I/O here: the endpoint in `agui.py` feeds these builders, so the protocol mapping can be unit
tested with the official `ag_ui` models. Only an explicit allowlist of response fields is exposed;
internal graph state, timings and raw model output never reach the browser.
"""
from ag_ui.core import (RunErrorEvent, RunFinishedEvent, RunStartedEvent, StateSnapshotEvent, TextMessageContentEvent,
                        TextMessageEndEvent, TextMessageStartEvent)

# Fields of AgentResponse a client may see. `timings` and internal graph state are deliberately absent.
PUBLIC_STATE_FIELDS = ("request_id", "trace_id", "intent", "action", "answer", "abstained", "citations",
                       "evidence_refs", "missing_information", "handoff_ref", "decision_card",
                       "improvement_plan", "what_if", "guard_flags")


def public_state(response: dict) -> dict:
    """Allowlisted, JSON-ready view of AgentResponse. None values are omitted, nothing is invented."""
    return {key: response[key] for key in PUBLIC_STATE_FIELDS if response.get(key) is not None}


def run_started(thread_id: str, run_id: str) -> RunStartedEvent:
    return RunStartedEvent(threadId=thread_id, runId=run_id)


def message_start(message_id: str) -> TextMessageStartEvent:
    return TextMessageStartEvent(messageId=message_id, role="assistant")


def sentence_delta(message_id: str, sentence: str) -> TextMessageContentEvent:
    """One guarded sentence; a trailing space keeps concatenated deltas readable."""
    return TextMessageContentEvent(messageId=message_id, delta=sentence + " ")


def state_snapshot(response: dict) -> StateSnapshotEvent:
    return StateSnapshotEvent(snapshot=public_state(response))


def message_end(message_id: str) -> TextMessageEndEvent:
    return TextMessageEndEvent(messageId=message_id)


def run_finished(thread_id: str, run_id: str) -> RunFinishedEvent:
    return RunFinishedEvent(threadId=thread_id, runId=run_id)


def run_error(message: str = "internal error", code: str = "internal_error") -> RunErrorEvent:
    return RunErrorEvent(message=message, code=code)
