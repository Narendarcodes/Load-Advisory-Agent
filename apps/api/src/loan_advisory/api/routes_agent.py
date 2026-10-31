"""Agent routes: JSON chat, NDJSON streaming chat, the bureau pipeline and a health probe.

Frappe renders every borrower page, so the legacy static UI, demo sign-in, account and
application routes are gone. What remains is what the CopilotKit runtime and the voice worker
actually call, with the same status codes and framing the legacy server used.
"""
import asyncio
import json
import sys
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from loan_advisory.agent.server import BadRequest, _require_strings
from loan_advisory.api.auth import claims_from_request, require_application, spend_budget

MAX_BODY = 64_000
NDJSON_MEDIA = "application/x-ndjson; charset=utf-8"
CHAT_LIMIT, CHAT_WINDOW = 60, 60
BUREAU_LIMIT, BUREAU_WINDOW = 10, 3600


def json_body(raw: bytes) -> dict:
    """404-by-400 parity with the legacy handler: one JSON object, at most 64 KB."""
    if len(raw) > MAX_BODY:
        raise BadRequest("bad JSON body")
    try:
        body = json.loads(raw or b"{}")
    except ValueError:
        raise BadRequest("bad JSON body") from None
    if not isinstance(body, dict):
        raise BadRequest("bad JSON body")
    return body


async def body_of(request: Request) -> dict:
    return json_body(await request.body())


def require_conversation(claims: dict, body: dict) -> None:
    """Refuse a body that names a conversation other than the one the assertion authorises."""
    asserted = claims.get("thread")
    requested = body.get("conversation_id")
    if asserted and requested and requested != asserted:
        raise HTTPException(status_code=403, detail="conversation does not match the signed-in session")


def build_router(service: Any) -> APIRouter:
    router = APIRouter()

    @router.get("/healthz")
    def healthz():
        return {"ok": True}

    @router.post("/api/chat")
    def chat(request: Request, body: dict = Depends(body_of)):
        _require_strings(body, ("request_id", "conversation_id", "message"))  # 400 before auth, as before
        claims = claims_from_request(request)
        require_application(claims)
        require_conversation(claims, body)
        spend_budget(claims, "agent-turn", CHAT_LIMIT, CHAT_WINDOW)
        return service.chat(claims, body, request.headers)[1]

    @router.post("/api/chat/stream")
    async def chat_stream(request: Request, body: dict = Depends(body_of)):
        _require_strings(body, ("request_id", "conversation_id", "message"))
        claims = claims_from_request(request)
        require_application(claims)  # 409 before the 200 stream starts, never an error line inside it
        require_conversation(claims, body)
        spend_budget(claims, "agent-turn", CHAT_LIMIT, CHAT_WINDOW)
        return StreamingResponse(_ndjson(service, claims, body, request.headers),
                                 media_type=NDJSON_MEDIA)

    @router.post("/api/bureau/run")
    def bureau_run(request: Request, body: dict = Depends(body_of)):
        claims = claims_from_request(request)
        require_application(claims)
        # Provider calls cost money: a borrower gets a small hourly allowance, not a loop.
        spend_budget(claims, "bureau-run", BUREAU_LIMIT, BUREAU_WINDOW)
        return service.bureau_run(claims, body)[1]

    return router


async def _ndjson(service, claims, body, headers):
    """One JSON line per guarded sentence, then the final AgentResponse — byte-compatible with the legacy body.

    The blocking turn runs in a worker thread. A client disconnect ends this generator but does not
    cancel the turn: it completes and is audited, and the admission slot is released by middleware.
    """
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    done = object()

    def put(item):
        try:
            loop.call_soon_threadsafe(queue.put_nowait, item)
        except RuntimeError:  # event loop already closed (server shutdown); nothing left to deliver
            pass

    def work():
        try:
            _, resp = service.chat(claims, body, headers, on_sentence=lambda text: put({"type": "sentence", "text": text}))
            put({"type": "final", "response": resp})
        except Exception as e:  # never leak a stack trace to the client
            sys.stderr.write(f"error {type(e).__name__}: {e}\n")
            put({"type": "error", "error": "internal error"})
        finally:
            put(done)

    task = loop.run_in_executor(None, work)
    task.add_done_callback(lambda t: t.exception() if not t.cancelled() else None)
    while True:
        item = await queue.get()
        if item is done:
            return
        yield (json.dumps(item, ensure_ascii=False, default=str) + "\n").encode()
