"""HTTP-level security regressions for the Frappe borrower surface (Phase 9).

Covers the boundaries a browser cannot be trusted to enforce: guest access,
application ownership (IDOR), CSRF on the mint, conversation ownership,
assertion replay/tampering, application overrides in the request body, voice
bridge authorisation, runtime CORS and session teardown.

    python tests/e2e/portal_security.py --seed <seed.json> \
        [--base http://127.0.0.1:8081] [--agent http://127.0.0.1:8095] \
        [--runtime http://127.0.0.1:4200]

Everything runs against the disposable site; no assertion is printed and no
credential is written to disk.
"""
import argparse
import json
import re
import sys
import uuid

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RESULTS = []
TIMEOUT = 60


def check(name, ok, detail=""):
    RESULTS.append({"name": name, "ok": bool(ok), "detail": str(detail)[:400]})
    print(("PASS" if ok else "FAIL"), name, str(detail)[:300])


def bootstrap_csrf(page_html):
    match = re.search(r'<script id="portal-bootstrap" type="application/json">(.*?)</script>', page_html, re.S)
    return json.loads(match.group(1)).get("csrf_token") if match else None


def borrower_session(base, email, password):
    """A session shaped like a browser's: login plus one page render, which is what
    issues the CSRF token Frappe then requires for every unsafe method."""
    session = requests.Session()
    response = session.post(base + "/api/method/login", json={"usr": email, "pwd": password}, timeout=TIMEOUT)
    response.raise_for_status()
    page = session.get(base + "/borrower", timeout=TIMEOUT)
    return session, bootstrap_csrf(page.text), page


def call(session, base, method, payload=None, csrf=None):
    headers = {"Accept": "application/json"}
    if csrf:
        headers["X-Frappe-CSRF-Token"] = csrf
    return session.post(f"{base}/api/method/{method}", json=payload or {}, headers=headers, timeout=TIMEOUT)


def token_headers(service):
    return {"Authorization": f"token {service['api_key']}:{service['api_secret']}", "Accept": "application/json"}


def mint(base, session, csrf, application=None, thread=None):
    payload = {}
    if application:
        payload["application"] = application
    if thread:
        payload["thread_id"] = thread
    return call(session, base, "loan_advisory_portal.api.agent.mint_assertion", payload, csrf)


def chat(agent_base, assertion, body):
    headers = {"Authorization": f"Bearer {assertion}", "Content-Type": "application/json"}
    return requests.post(agent_base + "/api/chat", json=body, headers=headers, timeout=180)


def answer_body(message, **extra):
    return {
        "request_id": str(uuid.uuid4()),
        "conversation_id": f"sec-{uuid.uuid4().hex[:12]}",
        "message": message,
        **extra,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True)
    parser.add_argument("--base", default="http://127.0.0.1:8081")
    parser.add_argument("--agent", default="http://127.0.0.1:8095")
    parser.add_argument("--runtime", default="http://127.0.0.1:4200")
    parser.add_argument("--out", default="tests/e2e/out/security.json")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    agent = args.agent.rstrip("/")
    runtime = args.runtime.rstrip("/")
    seed = json.load(open(args.seed, encoding="utf-8"))
    victim = seed["victim"]
    other = seed["other"]
    victim_app = victim["application"]
    other_app = other["application"]
    other_email = other["user"]
    other_customer = other["customer"]

    # ---- guests -------------------------------------------------------------
    guest = requests.Session()
    response = guest.post(
        base + "/api/method/loan_advisory_portal.api.applications.list_applications", json={}, timeout=TIMEOUT
    )
    check("a guest cannot list applications", response.status_code == 403, response.status_code)
    response = guest.post(
        base + "/api/method/loan_advisory_portal.api.agent.mint_assertion", json={}, timeout=TIMEOUT
    )
    check("a guest cannot mint an assertion", response.status_code == 403, response.status_code)
    response = guest.get(base + "/borrower", timeout=TIMEOUT)
    check("a guest is redirected from the dashboard", "/login" in response.url, response.url)
    response = guest.get(f"{base}/borrower/application?name={victim_app}", timeout=TIMEOUT)
    check("a guest is redirected from an application page", "/login" in response.url, response.url)

    # ---- the victim's own session ------------------------------------------
    session, csrf, _ = borrower_session(base, victim["user"], victim["password"])
    check("the browser-shaped session gets a CSRF token", bool(csrf))
    listing = call(session, base, "loan_advisory_portal.api.applications.list_applications", {}, csrf)
    body = listing.text
    check("the borrower sees their own application", victim_app in body, listing.status_code)
    check(
        "the listing never includes another borrower's application",
        other_app not in body and other_email not in body and other_customer not in body,
        body[:200],
    )

    own = call(session, base, "loan_advisory_portal.api.applications.get_application", {"application": victim_app}, csrf)
    check("the borrower reads their own application", own.status_code == 200, own.status_code)

    # ---- ownership (IDOR) ---------------------------------------------------
    foreign = call(session, base, "loan_advisory_portal.api.applications.get_application", {"application": other_app}, csrf)
    check(
        "another borrower's application is a 404, not a 403",
        foreign.status_code == 404 and "not found" in foreign.text.lower(),
        foreign.text[:160],
    )
    foreign = call(session, base, "loan_advisory_portal.api.applications.get_decision", {"application": other_app}, csrf)
    check("another borrower's decision is a 404", foreign.status_code == 404, foreign.status_code)
    foreign = call(session, base, "loan_advisory_portal.api.documents.list_documents", {"application": other_app}, csrf)
    check("another borrower's documents are a 404", foreign.status_code == 404, foreign.status_code)

    page = session.get(f"{base}/borrower/application?name={other_app}", timeout=TIMEOUT)
    check(
        "another borrower's application page is a 404",
        page.status_code == 404 and "Medical costs" not in page.text,
        page.status_code,
    )
    page = session.get(f"{base}/borrower/assistant?application={other_app}", timeout=TIMEOUT)
    check(
        "another borrower's assistant page is a 404",
        page.status_code == 404 and "Medical costs" not in page.text,
        page.status_code,
    )

    documents = call(session, base, "loan_advisory_portal.api.documents.list_documents", {"application": victim_app}, csrf)
    rows = (documents.json().get("message") or []) if documents.ok else []
    check("the borrower's own documents are listed", len(rows) == 1, len(rows))
    if rows:
        stolen = call(
            session,
            base,
            "loan_advisory_portal.api.documents.download_document",
            {"application": other_app, "row": rows[0]["row"]},
            csrf,
        )
        check("a document cannot be downloaded through a foreign application", stolen.status_code == 404, stolen.status_code)
        missing = call(
            session,
            base,
            "loan_advisory_portal.api.documents.download_document",
            {"application": victim_app, "row": "no-such-row"},
            csrf,
        )
        check("an unknown document row is refused", missing.status_code in (403, 404), missing.status_code)

    # ---- CSRF on the mint ---------------------------------------------------
    response = call(session, base, "loan_advisory_portal.api.agent.mint_assertion", {"application": victim_app})
    check(
        "the mint refuses a request without the CSRF token",
        response.status_code in (400, 403) and "csrf" in response.text.lower(),
        response.text[:160],
    )
    response = call(
        session,
        base,
        "loan_advisory_portal.api.agent.mint_assertion",
        {"application": victim_app},
        "x" * 24,
    )
    check(
        "the mint refuses a wrong CSRF token",
        response.status_code in (400, 403) and "csrf" in response.text.lower(),
        response.text[:160],
    )

    # ---- conversations belong to one account --------------------------------
    thread = f"sec-{uuid.uuid4().hex}"
    response = mint(base, session, csrf, victim_app, thread)
    check("the borrower mints for their own conversation", response.status_code == 200, response.status_code)

    other_session, other_csrf, _ = borrower_session(base, other["user"], other["password"])
    response = mint(base, other_session, other_csrf, other_app, thread)
    check("another borrower cannot join that conversation", response.status_code == 403, response.status_code)
    response = call(
        other_session,
        base,
        "loan_advisory_portal.api.agent.record_turn",
        {"thread_id": thread, "turn_count": 1},
        other_csrf,
    )
    check("another borrower cannot advance that conversation", response.status_code == 403, response.status_code)

    # ---- the assertion is the only credential FastAPI accepts ---------------
    response = mint(base, session, csrf, victim_app)
    assertion = (response.json().get("message") or {}).get("assertion", "") if response.ok else ""
    check("the mint returns one assertion", bool(assertion) and assertion.count(".") == 1)

    response = chat(agent, assertion, answer_body("Why was my loan rejected?"))
    check("a fresh assertion is accepted by the agent", response.status_code == 200, response.status_code)

    replay = chat(agent, assertion, answer_body("Why was my loan rejected?"))
    check(
        "a replayed assertion is refused",
        replay.status_code == 401 and "sign in first" in replay.text,
        replay.text[:160],
    )
    tampered = assertion[:-3] + ("AAA" if assertion[-3:] != "AAA" else "BBB")
    response = chat(agent, tampered, answer_body("Why was my loan rejected?"))
    check("a tampered assertion is refused", response.status_code == 401, response.text[:160])
    response = chat(agent, "not-an-assertion", answer_body("Why was my loan rejected?"))
    check("a malformed credential is refused", response.status_code == 401, response.status_code)

    # The body may carry anything; the asserted application must win.
    victim_record = None
    reader = seed["reader"]
    record = requests.get(
        f"{base}/api/resource/Loan Application/{victim_app}",
        params={"fields": json.dumps(["custom_latest_evidence"])},
        headers=token_headers(reader),
        timeout=TIMEOUT,
    )
    if record.ok:
        victim_record = (record.json().get("data") or {}).get("custom_latest_evidence")
    check("the seeded decision is readable for the comparison", bool(victim_record), record.status_code)

    response = mint(base, session, csrf, victim_app)
    assertion = (response.json().get("message") or {}).get("assertion", "") if response.ok else ""
    override = chat(
        agent,
        assertion,
        answer_body(
            "Why was my loan rejected?",
            application=other_app,
            application_ref=other_app,
            customer=other_customer,
        ),
    )
    payload = override.json() if override.ok else {}
    refs = payload.get("evidence_refs") or []
    text = json.dumps(override.json() if override.ok else {}, default=str)
    check(
        "the request body cannot override the asserted application",
        override.status_code == 200 and bool(victim_record) and refs == [victim_record],
        {"status": override.status_code, "refs": refs, "expected": victim_record},
    )
    check(
        "the answer never mentions another borrower's file",
        other_customer not in text and "Medical costs" not in text and other_email not in text,
        text[:200],
    )
    check("the explain answer still matches the recorded decision", "REJECTED" in payload.get("answer", "").upper())

    # ---- the voice bridge is for the service, not the borrower --------------
    response = call(
        session,
        base,
        "loan_advisory_portal.api.voice.voice_assertion",
        {"session_id": "0" * 32, "room": "room", "identity": "borrower"},
        csrf,
    )
    check("a borrower cannot mint a voice assertion", response.status_code == 403, response.status_code)

    response = requests.post(
        base + "/api/method/loan_advisory_portal.api.voice.voice_assertion",
        json={"session_id": "0" * 32, "room": "room", "identity": "worker"},
        headers=token_headers(reader),
        timeout=TIMEOUT,
    )
    check("an unknown voice session is a 404", response.status_code == 404, response.status_code)
    response = requests.post(
        base + "/api/method/loan_advisory_portal.api.voice.voice_assertion",
        json={"session_id": "not-a-session", "room": "room", "identity": "worker"},
        headers=token_headers(reader),
        timeout=TIMEOUT,
    )
    check("a malformed voice session is a 404", response.status_code == 404, response.status_code)
    response = requests.post(
        base + "/api/method/loan_advisory_portal.api.voice.voice_assertion",
        json={"session_id": "0" * 32, "room": "room", "identity": "worker"},
        headers=token_headers(seed["evidence"]),
        timeout=TIMEOUT,
    )
    check("a service without the integration role is refused", response.status_code == 403, response.status_code)

    # ---- runtime CORS -------------------------------------------------------
    preflight = {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    response = requests.options(runtime + "/api/copilotkit", headers={"Origin": "https://evil.example", **preflight}, timeout=TIMEOUT)
    allowed = response.headers.get("access-control-allow-origin", "")
    check("the runtime does not allow a foreign origin", "evil.example" not in allowed, allowed or "(none)")
    response = requests.options(runtime + "/api/copilotkit", headers={"Origin": base, **preflight}, timeout=TIMEOUT)
    check(
        "the runtime allows the portal origin",
        response.headers.get("access-control-allow-origin") == base,
        response.headers.get("access-control-allow-origin"),
    )

    # ---- session teardown ---------------------------------------------------
    response = call(session, base, "logout", {}, csrf)
    check("logout succeeds", response.status_code == 200, response.status_code)
    response = call(session, base, "loan_advisory_portal.api.applications.list_applications", {}, csrf)
    check("a logged-out session cannot list applications", response.status_code == 403, response.status_code)
    response = call(session, base, "loan_advisory_portal.api.agent.mint_assertion", {"application": victim_app}, csrf)
    check("a logged-out session cannot mint", response.status_code == 403, response.status_code)

    passed = sum(1 for item in RESULTS if item["ok"])
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(RESULTS, handle, indent=2)
    print(f"\n{passed}/{len(RESULTS)} checks passed")
    return 0 if passed == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
