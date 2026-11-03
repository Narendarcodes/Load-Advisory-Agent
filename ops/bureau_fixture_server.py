"""Run the synthetic bureau (apps/bureau, unchanged) with a Saral fixture re-keyed by Frappe
application name (see ops/saral_seed/plan.py::rekey_bureau_fixture). Loopback only. SYNTHETIC.

A new application from an applicant already in the fixture (e.g. a second application made in
the browser) is answered from that applicant's case: the request is rewritten to the fixture's
application id before the unchanged bureau app sees it. Anything else passes through.

    PYTHONPATH=.:apps/api/src:apps/bureau/src python -m ops.bureau_fixture_server \
        --fixture /data/workspace/saral/bureau_saral_frappe.json --port 8011
"""
import argparse
import copy
import json
from pathlib import Path

from starlette.responses import JSONResponse

from starlette.types import ASGIApp, Receive, Scope, Send

from synthetic_bureau.app import create_app


class ApplicantFallback:
    def __init__(self, inner: ASGIApp, by_applicant: dict[str, dict], known_apps: set[str]):
        self.inner, self.by_applicant, self.known = inner, by_applicant, known_apps

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http" or scope["path"] != "/v1/bureau/reports" or scope["method"] != "POST":
            return await self.inner(scope, receive, send)
        chunks, more = [], True
        while more:
            msg = await receive()
            chunks.append(msg.get("body", b""))
            more = msg.get("more_body", False)
        raw = b"".join(chunks)
        try:
            body = json.loads(raw or b"{}")
            if (not body.get("scenario") and body.get("application_id") not in self.known
                    and body.get("applicant_id") in self.by_applicant):
                case = self.by_applicant[body["applicant_id"]]
                if case.get("report") is not None:
                    # The applicant's own report, stamped with the application that asked for it.
                    report = copy.deepcopy(case["report"])
                    report["application_id"] = body["application_id"]
                    return await JSONResponse(report)(scope, receive, send)
                body["application_id"] = case["application"]["application_id"]  # provider-failure case
                raw = json.dumps(body).encode()
        except (ValueError, AttributeError):
            pass
        scope = {**scope, "headers": [(k, v) for k, v in scope["headers"] if k != b"content-length"]
                 + [(b"content-length", str(len(raw)).encode())]}
        sent = False

        async def replay():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": raw, "more_body": False}
            return await receive()

        return await self.inner(scope, replay, send)


def build_app(fixture: str):
    cases = json.loads(Path(fixture).read_text(encoding="utf-8")).get("cases", [])
    by_applicant = {c["application"]["applicant_id"]: c for c in cases}
    known = {c["application"]["application_id"] for c in cases}
    return ApplicantFallback(create_app(fixture_path=fixture), by_applicant, known)


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    ap = argparse.ArgumentParser()
    ap.add_argument("--fixture", required=True)
    ap.add_argument("--port", type=int, default=8011)
    a = ap.parse_args()
    uvicorn.run(build_app(a.fixture), host="127.0.0.1", port=a.port)
