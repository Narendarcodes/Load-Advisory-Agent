"""AG-UI (text/event-stream) endpoint over the existing guarded agent.

Request flow: CopilotKit Runtime -> POST /api/agui -> this endpoint -> AdvisoryAgent.run() in a
worker thread -> official AG-UI events. Identity, application and the borrower's language
preferences come from the verified Frappe assertion; `threadId` / `runId` are untrusted
identifiers and are echoed back unchanged.

Conversation isolation: the graph keys its checkpointer by "{applicant_ref}::{conversation_id}",
so two applicants reusing the same `threadId` still get separate threads. Nothing here can read
another applicant's conversation.
"""
import asyncio
import re
import sys
import uuid
from typing import Any

from ag_ui.core import RunAgentInput
from ag_ui.encoder import EventEncoder
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse

from loan_advisory.agent.contracts import AgentRequest, Session
from loan_advisory.api import events as E
from loan_advisory.api.auth import require_application, require_claims, spend_budget

_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


def build_router(service: Any) -> APIRouter:
    router = APIRouter()

    @router.post("/api/agui")
    async def agui(request: Request, inp: RunAgentInput, authorization: str | None = Header(None)):
        # authenticate before the stream opens; there is no per-request account lookup here
        claims = require_claims(authorization)
        if not (_ID.fullmatch(inp.thread_id) and _ID.fullmatch(inp.run_id)):
            raise HTTPException(status_code=422, detail="invalid AG-UI request")
        text = _last_user_text(inp)
        if text is None:
            raise HTTPException(status_code=422, detail="invalid AG-UI request")
        # The run must use the conversation Frappe minted the assertion for: a client cannot
        # authenticate one thread and stream another.
        if not claims.get("thread") or claims["thread"] != inp.thread_id:
            raise HTTPException(status_code=403, detail="conversation does not match the signed-in session")
        req = AgentRequest(
            request_id=inp.run_id,
            conversation_id=inp.thread_id,
            message=text[:4000] or "hello",
            channel="text",
            locale=claims["locale"],
            literacy=claims["literacy"],
            application_ref=require_application(claims),
        )
        spend_budget(claims, "agent-turn", 60, 60)
        encoder = EventEncoder(accept=request.headers.get("accept"))
        return StreamingResponse(
            _sse(service, req, claims, request.headers, inp.thread_id, inp.run_id, encoder),
            media_type=encoder.get_content_type(),
            headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
        )

    return router


def _last_user_text(inp: RunAgentInput) -> str | None:
    for message in reversed(inp.messages):
        if getattr(message, "role", None) != "user":
            continue
        content = getattr(message, "content", "")
        if isinstance(content, str):
            return content
        parts = [getattr(p, "text", "") for p in content or [] if getattr(p, "type", None) == "text"]
        return " ".join(p for p in parts if p)
    return None


async def _sse(service, req: AgentRequest, claims: dict, headers, thread_id: str, run_id: str, encoder: EventEncoder):
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    done = object()
    message_id = f"msg-{uuid.uuid4().hex}"

    def put(item):
        try:
            loop.call_soon_threadsafe(queue.put_nowait, item)
        except RuntimeError:  # loop closed at shutdown; the turn still completes and is audited
            pass

    def emit(sentence: str):
        put(E.sentence_delta(message_id, sentence))

    def work():
        try:
            from loan_advisory.agent import observability as obs
            resp = service.agent.run(req, Session(applicant_ref=claims["applicant_ref"]),
                                     trace_context=obs.extract_context(headers), on_sentence=emit)
            put(("final", resp.model_dump()))
        except Exception as e:  # generic client message; the detail stays in the server log
            sys.stderr.write(f"agui error {type(e).__name__}: {e}\n")
            put(("error", None))
        finally:
            put(done)

    task = loop.run_in_executor(None, work)
    task.add_done_callback(lambda t: t.exception() if not t.cancelled() else None)

    yield encoder.encode(E.run_started(thread_id, run_id))
    yield encoder.encode(E.message_start(message_id))
    final = None
    while True:
        item = await queue.get()
        if item is done:
            break
        if isinstance(item, tuple):
            if item[0] == "final":
                final = item[1]
            elif item[0] == "error":
                yield encoder.encode(E.message_end(message_id))
                yield encoder.encode(E.run_error())
                return
        else:
            yield encoder.encode(item)

    yield encoder.encode(E.state_snapshot(final))
    yield encoder.encode(E.message_end(message_id))
    yield encoder.encode(E.run_finished(thread_id, run_id))
