"""Bounded admission for the ASGI application.

The legacy server admits at most eight requests in flight and refuses the next one with 503 +
`Retry-After` instead of queueing. uvicorn's default worker-thread capacity is far higher, so the
cap must be enforced explicitly here. The slot is held for the whole response, including a
streamed NDJSON body, and is released on success, exceptions and client disconnects.

A client disconnect does not cancel the blocking agent turn (it runs in a worker thread); the turn
finishes and is audited exactly as before. The slot is still returned when the response ends.
"""
import json

from loan_advisory.agent.server import Admission

BUSY_BODY = json.dumps({"error": "server busy; retry shortly"}).encode()


class AdmissionMiddleware:
    def __init__(self, app, limit: int = 8):
        self.app = app
        self.admission = Admission(limit)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        slot = self.admission.acquire()
        if slot is None:
            await self._refuse(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        finally:
            slot.release()

    @staticmethod
    async def _refuse(scope, receive, send):
        headers = [(b"content-type", b"application/json; charset=utf-8"),
                   (b"retry-after", b"1"),
                   (b"cache-control", b"no-store"),
                   (b"x-content-type-options", b"nosniff"),
                   (b"content-length", str(len(BUSY_BODY)).encode())]
        await send({"type": "http.response.start", "status": 503, "headers": headers})
        await send({"type": "http.response.body", "body": BUSY_BODY})
