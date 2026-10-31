"""FastAPI application factory for the agent backend.

`create_app(service)` is the canonical entry point; `loan_advisory.agent.server.main()` builds the
same service (offline or live) and serves this app with uvicorn. The legacy stdlib server remains
available for compatibility and its tests.

This surface is reached only by the trusted Node runtime (AG-UI) and the voice worker; the browser
talks to Frappe, never here.
"""
import sys
from typing import Any

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from loan_advisory.agent.server import BadRequest
from loan_advisory.api.admission import AdmissionMiddleware
from loan_advisory.api.agui import build_router as build_agui_router
from loan_advisory.api.routes_agent import build_router as build_agent_router

_SECURITY_HEADERS = {
    b"cache-control": b"no-store",
    b"x-content-type-options": b"nosniff",
    b"referrer-policy": b"no-referrer",
}


class SecurityHeadersMiddleware:
    """Adds the legacy no-store/nosniff headers to every response, including streams and errors."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                message = {**message, "headers": _with_security_headers(message.get("headers") or [])}
            await send(message)

        await self.app(scope, receive, send_with_headers)


def _with_security_headers(headers):
    present = {k.lower() for k, _ in headers}
    return list(headers) + [(k, v) for k, v in _SECURITY_HEADERS.items() if k not in present]


class LegacyJSONResponse(JSONResponse):
    """Same `application/json; charset=utf-8` content type the stdlib handler sends."""

    media_type = "application/json; charset=utf-8"


def _error(status: int, message: str) -> JSONResponse:
    return LegacyJSONResponse({"error": message}, status_code=status)


def create_app(service: Any, *, max_inflight: int = 8) -> FastAPI:
    app = FastAPI(title="Loan Advisory Agent API", docs_url=None, redoc_url=None,
                  default_response_class=LegacyJSONResponse)
    app.state.service = service
    app.add_middleware(AdmissionMiddleware, limit=max_inflight)
    app.add_middleware(SecurityHeadersMiddleware)

    @app.exception_handler(BadRequest)
    async def bad_request(_request, exc: BadRequest):
        return _error(400, str(exc))

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request, _exc: RequestValidationError):
        return _error(422, "invalid AG-UI request")

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request, exc: StarletteHTTPException):
        if exc.status_code == 404:
            return _error(404, "not found")
        if exc.status_code == 405:
            return _error(405, "method not allowed")
        detail = exc.detail if isinstance(exc.detail, str) else "error"
        response = _error(exc.status_code, detail)
        for name, value in (exc.headers or {}).items():
            response.headers[name] = value
        return response

    @app.exception_handler(Exception)
    async def internal_error(_request, exc: Exception):
        sys.stderr.write(f"error {type(exc).__name__}: {exc}\n")
        return _error(500, "internal error")

    app.include_router(build_agent_router(service))
    app.include_router(build_agui_router(service))
    return app
