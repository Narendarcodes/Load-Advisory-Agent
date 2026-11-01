"""Phase H browser and HTTP checks that B4 deferred to the final regression.

Covers the response-header set, HSTS emission behind a TLS-terminating proxy, `Retry-After`
on a spent budget, the invitation token being stripped from the address bar before the
first call, and the INFO_REQUESTED resubmit panel. Live voice is reported BLOCKED because
this environment has no LiveKit server or worker.

    python tests/e2e/phase_h_checks.py --seed <seed.json> --setup <setup.json>

`setup.json` is written by the container-side fixture (invitation token + application).
"""
import argparse
import json
import os
import re
import subprocess
import sys

import requests
from playwright.sync_api import sync_playwright

BASELINE = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "SAMEORIGIN",
    "permissions-policy": "geolocation=(), camera=(), microphone=(self)",
}
CONTAINER = "loanrangers-backend-1"


def check(results, name, ok, detail=None):
    results.append({"name": name, "ok": bool(ok), "detail": detail})
    print(("PASS " if ok else "FAIL ") + name + (f"  {detail}" if detail is not None else ""))


def login(session, base, email, password):
    response = session.post(base + "/api/method/login", data={"usr": email, "pwd": password}, timeout=30)
    if response.status_code != 200:
        raise SystemExit(f"login failed: {response.status_code}")
    page = session.get(base + "/borrower", timeout=30)
    match = re.search(
        r'<script id="portal-bootstrap" type="application/json">(.*?)</script>', page.text, re.S
    )
    if not match:
        raise SystemExit("no portal bootstrap on /borrower")
    return json.loads(match.group(1))["csrf_token"]


def headers_checks(results, base, session):
    public = session.get(base + "/borrower/help", timeout=30)
    check(results, "the public notice page answers 200", public.status_code == 200, public.status_code)
    for name, value in BASELINE.items():
        check(results, f"baseline header {name}", public.headers.get(name) == value, public.headers.get(name))
    csp = public.headers.get("content-security-policy", "")
    check(
        results,
        "the CSP scopes scripts to self and forbids framing off-site",
        "script-src 'self' blob:" in csp and "frame-ancestors 'self'" in csp,
        csp[:120],
    )
    signed_in = session.get(base + "/borrower", timeout=30)
    check(results, "a signed-in portal page answers 200", signed_in.status_code == 200, signed_in.status_code)
    missing = {k: signed_in.headers.get(k) for k, v in BASELINE.items() if signed_in.headers.get(k) != v}
    check(results, "the signed-in page carries the same header set", not missing, missing or None)
    check(
        results,
        "HSTS is not sent on plain HTTP",
        "strict-transport-security" not in signed_in.headers,
        signed_in.headers.get("strict-transport-security"),
    )
    probe = subprocess.run(
        [
            "docker",
            "exec",
            CONTAINER,
            "curl",
            "-sI",
            "-H",
            "X-Forwarded-Proto: https",
            "http://127.0.0.1:8001/borrower/help",
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    check(
        results,
        "HSTS is emitted when the request says it arrived over TLS",
        "strict-transport-security: max-age=31536000" in probe.stdout.lower(),
        probe.stdout.splitlines()[:1],
    )


def retry_after_check(results, base, session, csrf):
    url = base + "/api/method/loan_advisory_portal.api.profile.update_profile"
    status, retry = None, None
    for _ in range(75):
        response = session.post(
            url,
            json={"monthly_obligations": "13000"},
            headers={"X-Frappe-CSRF-Token": csrf},
            timeout=30,
        )
        if response.status_code == 429:
            status, retry = 429, response.headers.get("Retry-After")
            break
        if response.status_code != 200:
            check(results, "the profile endpoint accepts an authenticated write", False, response.status_code)
            return
    check(results, "a spent profile budget answers 429", status == 429, status)
    check(
        results,
        "the 429 carries a positive Retry-After",
        bool(retry and retry.isdigit() and int(retry) > 0),
        retry,
    )


def browser_checks(results, base, seed, setup):
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1360, "height": 900})
        page = context.new_page()

        requests_seen = []
        page.on("request", lambda r: requests_seen.append(r.url))
        response = page.goto(base + setup["url"], wait_until="networkidle")
        page.wait_for_selector("#invite-form:not(.hidden)", timeout=20000)
        token = setup["token"]
        check(
            results,
            "the invitation token is removed from the address bar",
            "token=" not in page.url and token not in page.url,
            page.url,
        )
        later = [url for url in requests_seen[1:] if token in url]
        check(results, "no later request carries the token in its URL", not later, later[:2])
        check(
            results,
            "the invitation page sends no referrer",
            (response.headers.get("referrer-policy") or "").lower() == "no-referrer",
            response.headers.get("referrer-policy"),
        )

        page.goto(base + "/login", wait_until="domcontentloaded")
        page.fill("#login_email", seed["victim"]["user"])
        page.fill("#login_password", seed["victim"]["password"])
        page.click("form.form-login button[type=submit]")
        page.wait_for_url(lambda url: "/login" not in url, timeout=20000)

        page.goto(
            f"{base}/borrower/application?name={setup['application']}", wait_until="networkidle"
        )
        page.wait_for_selector("#info-request:not(.hidden)", timeout=20000)
        check(results, "an information-requested application shows the correction panel", True)
        page.fill("#resubmit-income", "90000")
        page.fill("#resubmit-obligations", "12000")
        page.fill("#resubmit-credit", "760")
        page.fill("#resubmit-employment", "48")
        page.click("#resubmit-button")
        page.wait_for_function(
            "() => /Submitted/i.test(document.getElementById('app-badge').textContent)", timeout=30000
        )
        check(
            results,
            "resubmitting returns the application to Submitted",
            "submitted" in page.inner_text("#app-badge").lower(),
            page.inner_text("#app-badge"),
        )
        browser.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True)
    parser.add_argument("--setup", required=True)
    parser.add_argument("--base", default="http://127.0.0.1:8081")
    parser.add_argument("--out", default="tests/e2e/out/phase-h")
    args = parser.parse_args()

    seed = json.load(open(args.seed, encoding="utf-8"))
    setup = json.load(open(args.setup, encoding="utf-8"))
    base = args.base.rstrip("/")
    os.makedirs(args.out, exist_ok=True)

    results = []
    session = requests.Session()
    csrf = login(session, base, seed["victim"]["user"], seed["victim"]["password"])
    headers_checks(results, base, session)
    retry_after_check(results, base, session, csrf)
    browser_checks(results, base, seed, setup)

    blocked = [
        {
            "name": "live voice call",
            "ok": None,
            "detail": "BLOCKED: no LiveKit server, worker process or valid site credential in this environment.",
        }
    ]
    payload = {"checks": results, "blocked": blocked}
    with open(os.path.join(args.out, "phase_h.json"), "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=1)

    failed = [item for item in results if not item["ok"]]
    print(f"{len(results) - len(failed)}/{len(results)} checks passed; 1 blocked")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
