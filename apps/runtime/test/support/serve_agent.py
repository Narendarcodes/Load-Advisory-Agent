"""Deterministic FastAPI service for the Node Runtime end-to-end test.

Runs the real FastAPI adapter, assertion verification, guards and decision pipeline against the
in-memory MockStore with a scripted LLM, so the test needs no GPU, network or model credentials.

There is no Frappe here: the Node test runs a stub mint endpoint that signs assertions with the same
secret (`AGENT_ASSERTION_SECRET`), which is exactly the contract the real portal implements.
Prints `READY <port>` once listening.
"""
import json
import os
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
for entry in (ROOT, ROOT / "apps" / "api" / "src", ROOT / "apps" / "bureau" / "src"):
    sys.path.insert(0, str(entry))

import uvicorn  # noqa: E402

from loan_advisory.agent import server as srv  # noqa: E402
from loan_advisory.agent.runtime import build_offline_agent  # noqa: E402
from loan_advisory.api.app import create_app  # noqa: E402
from tests.test_agent_graph import FakePolicy, ScriptedLLM  # noqa: E402

# MockStore fixtures: 005 is REJECTED, 001 is APPROVED — two distinguishable decision cards.
APPS = ("APP-TEST-005", "APP-TEST-001")


def main() -> None:
    secret = os.environ.get("AGENT_ASSERTION_SECRET")
    if not secret or len(secret) < 32:
        raise SystemExit("AGENT_ASSERTION_SECRET (>= 32 chars) is required")

    intent = os.environ.get("AGENT_FIXTURE_INTENT", "explain")  # manual browser walks pick the scripted intent
    policy = FakePolicy() if os.environ.get("AGENT_FIXTURE_POLICY") else None
    agent, store, _ = build_offline_agent(llm=ScriptedLLM(intent=intent), policy_tools=policy)
    service = srv.App(agent, store.get)

    trace_path = os.environ.get("AGENT_FIXTURE_TRACE")  # manual walks: record the props that survived the Runtime hop
    if trace_path:
        real_run = agent.run

        def run_and_trace(req, *args, **kwargs):
            with open(trace_path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"locale": req.locale, "literacy": req.literacy,
                                     "application_ref": req.application_ref}) + "\n")
            return real_run(req, *args, **kwargs)

        agent.run = run_and_trace

    app = create_app(service)
    seen: dict[str, dict] = {}  # presence only: the test asserts no cookie ever reaches FastAPI

    @app.middleware("http")
    async def record_headers(request, call_next):
        if request.url.path.startswith("/api/"):
            seen[request.url.path] = {
                "cookie": "cookie" in request.headers,
                "authorization": request.headers.get("authorization", "")[:7].lower() == "bearer ",
                "csrf": "x-frappe-csrf-token" in request.headers,
                "content_type": request.headers.get("content-type"),
            }
        return await call_next(request)

    @app.get("/__seen")
    def last_headers():
        return {"seen": seen}

    port = int(os.environ.get("AGENT_FIXTURE_PORT") or 0)  # 0 = ephemeral, as the Node test uses
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error", lifespan="off"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.time() + 60
    while not server.started and time.time() < deadline:
        time.sleep(0.02)
    if not server.started:
        raise SystemExit("uvicorn did not start")
    print(f"READY {server.servers[0].sockets[0].getsockname()[1]}", flush=True)
    while not server.should_exit:
        time.sleep(0.2)


if __name__ == "__main__":
    main()
