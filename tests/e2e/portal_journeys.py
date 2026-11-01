"""Browser journeys through the Frappe borrower portal (Phase 9).

Runs against the disposable site fronted by `nginx.loanportal.conf`, the real
CopilotKit runtime, and the live FastAPI agent. Everything a borrower touches is
real: Frappe sessions, owned-application checks, evidence reads, the assertion
mint, the island, and the agent. Only the language model may be local (Ollama)
instead of the production provider.

    python tests/e2e/portal_journeys.py --seed <seed.json> [--base http://127.0.0.1:8081]

Writes PASS/FAIL lines, screenshots and `journeys.json` under --out.
"""
import argparse
import json
import os
import sys

from playwright.sync_api import sync_playwright

# The dashboard prints rupee amounts; a cp1252 console would abort the run.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append({"name": name, "ok": bool(ok), "detail": str(detail)[:400]})
    print(("PASS" if ok else "FAIL"), name, str(detail)[:300])


def login(page, base, email, password):
    page.goto(base + "/login", wait_until="domcontentloaded")
    page.fill("#login_email", email)
    page.fill("#login_password", password)
    page.click("form.form-login button[type=submit]")
    page.wait_for_url(lambda url: "/login" not in url, timeout=20000)


def boot(page):
    return json.loads(page.locator("#portal-bootstrap").text_content())


def pdf_bytes():
    minimal = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF\n"
    )
    try:
        from io import BytesIO

        from pypdf import PdfWriter

        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        buffer = BytesIO()
        writer.write(buffer)
        return buffer.getvalue()
    except Exception:
        return minimal


def ask(page, question):
    before = page.locator(".msg.bot").count()
    page.fill("#question", question)
    page.press("#question", "Enter")
    page.wait_for_function(
        "n => document.querySelectorAll('.msg.bot').length > n", arg=before, timeout=240000
    )
    body = page.locator(".msg.bot").nth(before)
    body.wait_for(state="visible")
    return body.inner_text()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True)
    parser.add_argument("--base", default="http://127.0.0.1:8081")
    parser.add_argument("--out", default="tests/e2e/out/journeys")
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()

    seed = json.load(open(args.seed, encoding="utf-8"))
    os.makedirs(args.out, exist_ok=True)
    base = args.base.rstrip("/")
    shots = lambda name: os.path.join(args.out, name)  # noqa: E731

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=not args.headed)
        context = browser.new_context(viewport={"width": 1360, "height": 900})
        page = context.new_page()

        console_errors, requests_seen = [], []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on(
            "request",
            lambda r: requests_seen.append({"url": r.url, "headers": {k.lower(): v for k, v in r.headers.items()}}),
        )

        try:
            page.goto(base + "/login", wait_until="domcontentloaded")
            check("guest is sent to the login page", "Login" in page.title(), page.title())

            login(page, base, seed["victim"]["user"], seed["victim"]["password"])
            check("sign-in lands on the borrower dashboard", page.url.rstrip("/").endswith("/borrower"), page.url)
            check("welcome heading renders", "Your applications" in page.inner_text("h1"), page.inner_text("h1"))

            page.wait_for_function(
                "() => document.querySelector('[data-stat=\\'count\\']').textContent !== '—'", timeout=20000
            )
            applications = page.inner_text("#applications")
            victim_app = seed["victim"]["application"]
            check("dashboard lists the seeded application", victim_app in applications, applications[:150])
            check(
                "dashboard shows the recorded outcome",
                "not approved" in applications.lower(),
                applications[:200],
            )
            page.screenshot(path=shots("01-dashboard.png"), full_page=True)

            # ---- application detail: decision, documents, timeline -------------
            page.goto(f"{base}/borrower/application?name={victim_app}", wait_until="domcontentloaded")
            page.wait_for_selector("#decision .badge", timeout=20000)
            reasons = page.locator("#decision .badge--fail").count()
            check("decision card shows the recorded rejection", reasons == 1, page.inner_text("#decision")[:120])
            visible_reasons = page.locator("#decision ul li").count()
            check("customer-visible reasons are listed", visible_reasons >= 2, visible_reasons)
            timeline = page.inner_text("#timeline")
            check("timeline records the evaluation", "Evaluated" in timeline, timeline[:160])
            document_rows = page.locator("#documents tbody tr").count()
            check("seeded document is attached", document_rows == 1, document_rows)
            page.screenshot(path=shots("02-application.png"), full_page=True)

            with page.expect_download(timeout=20000) as download:
                page.click("#documents tbody a:has-text('Download')")
            downloaded = download.value
            path = downloaded.path()
            head = open(path, "rb").read(5) if path else b""
            check("private document downloads for its owner", head == b"%PDF-", head)

            # ---- assistant: real runtime -> mint -> FastAPI -> evidence --------
            page.goto(f"{base}/borrower/assistant?application={victim_app}", wait_until="domcontentloaded")
            page.wait_for_selector("#question:not([disabled])", timeout=60000)
            check("assistant island mounts", page.locator("#assistant-root .chat").count() == 1)

            answer = ask(page, "Why was my loan rejected?")
            check("explain answers about the recorded decision", "REJECTED" in answer.upper(), answer[:220])
            intent_tags = page.locator(".details .tag").all_inner_texts()
            check("answer is labelled with its intent", any("explain" in t for t in intent_tags), intent_tags)
            page.screenshot(path=shots("03-assistant-explain.png"), full_page=True)

            answer = ask(page, "What if my monthly obligations were 10000?")
            # The answer text and the state snapshot arrive on separate AG-UI events.
            page.wait_for_selector(".whatif", timeout=30000)
            what_if = page.locator(".whatif")
            check("what-if runs as a simulation", what_if.count() == 1, answer[:160])
            if what_if.count():
                block = what_if.inner_text()
                check("simulation is labelled hypothetical", "imul" in block or "ypothetical" in block, block[:160])
            check(
                "the recorded decision is unchanged by the what-if",
                page.locator("#app-badge .badge--fail, .assistant__head .badge").count() >= 1,
            )
            page.screenshot(path=shots("04-assistant-what-if.png"), full_page=True)

            answer = ask(page, "Will I definitely get approved if I reapply?")
            check(
                "guarantee requests are refused",
                not __import__("re").search(r"you will (definitely )?be approved", answer, __import__("re").I),
                answer[:200],
            )
            action_tags = page.locator(".details .tag").all_inner_texts()
            check(
                "refusal is labelled as a boundary",
                any(("boundary" in t) or ("refuse" in t) for t in action_tags),
                action_tags,
            )
            page.screenshot(path=shots("05-assistant-guarantee.png"), full_page=True)

            page.click("button:has-text('New conversation')")
            page.wait_for_function("() => document.querySelectorAll('.msg').length === 0", timeout=10000)
            check("a new conversation starts empty", True)

            # ---- apply -> upload -> submit -> withdraw --------------------------
            page.goto(base + "/borrower/apply", wait_until="domcontentloaded")
            page.wait_for_function(
                "() => document.getElementById('about-name').value !== 'Loading…'", timeout=20000
            )
            check("wizard prefills the profile", bool(page.input_value("#about-name")), page.input_value("#about-name"))
            page.click("#next")
            page.wait_for_selector("[data-panel='work']:not(.hidden)")
            page.fill("#work-months", "")
            page.click("#next")  # empty employment field: the wizard blocks with an inline error
            check(
                "empty steps are rejected before the server",
                page.locator("[data-panel='work'] .error").count() == 1
                and page.locator("[data-panel='work']:not(.hidden)").count() == 1,
                page.locator("[data-panel='work'] .error").all_inner_texts(),
            )
            page.fill("#work-months", "30")
            page.click("#next")
            page.fill("#money-income", "80000")
            page.fill("#money-obligations", "12000")
            page.click("#next")
            page.fill("#loan-amount", "200000")
            page.fill("#loan-tenure", "18")
            page.fill("#loan-purpose", "School fees")
            page.click("#next")
            review = page.inner_text("#review-list")
            check("review step summarises the request", "School fees" in review, review[:160])
            page.screenshot(path=shots("06-wizard-review.png"), full_page=True)
            page.click("#submit")
            page.wait_for_url("**/borrower/application?name=**", timeout=30000)
            page.wait_for_selector("#app-badge .badge", timeout=20000)
            check(
                "wizard creates a draft",
                "draft" in page.inner_text("#app-badge").lower(),
                page.inner_text("#app-badge"),
            )

            page.select_option("#document-type", index=1)
            page.set_input_files("#document-file", {"name": "identity.pdf", "mimeType": "application/pdf",
                                                   "buffer": pdf_bytes()})
            page.click("#upload-button")
            page.wait_for_selector("#documents tbody tr", timeout=30000)
            check("document upload attaches a private file", page.locator("#documents tbody tr").count() == 1)

            page.click("#submit-app")
            page.wait_for_function(
                "() => /Submitted/.test(document.getElementById('app-badge').textContent)", timeout=30000
            )
            check(
                "submitting moves the application out of draft",
                "submitted" in page.inner_text("#app-badge").lower(),
                page.inner_text("#app-badge"),
            )
            check("timeline records the submission", "Submitted" in page.inner_text("#timeline"))
            check(
                "no assessment is invented before review",
                "No assessment yet" in page.inner_text("#decision"),
                page.inner_text("#decision")[:120],
            )
            page.screenshot(path=shots("07-submitted.png"), full_page=True)

            page.click("#withdraw")
            page.click("#withdraw-confirm")
            page.wait_for_function(
                "() => /Withdrawn/.test(document.getElementById('app-badge').textContent)", timeout=30000
            )
            check(
                "withdrawing closes the application",
                "withdrawn" in page.inner_text("#app-badge").lower(),
                page.inner_text("#app-badge"),
            )

            # ---- profile ---------------------------------------------------------
            page.goto(base + "/borrower/profile", wait_until="domcontentloaded")
            page.wait_for_function("() => document.getElementById('monthly-obligations').value !== ''", timeout=20000)
            page.fill("#monthly-obligations", "13000")
            page.click("#save")
            page.wait_for_selector("#flash .alert--success, #flash .alert--error", timeout=20000)
            flash = page.inner_text("#flash")
            check("profile saves", "error" not in flash.lower(), flash[:160])
            page.reload(wait_until="domcontentloaded")
            page.wait_for_function("() => document.getElementById('monthly-obligations').value !== ''", timeout=20000)
            check("saved profile value persists", page.input_value("#monthly-obligations") == "13000",
                  page.input_value("#monthly-obligations"))

            # ---- assertions never reach the browser -----------------------------
            leaked = [r for r in requests_seen if ":8095" in r["url"] or "/api/agui" in r["url"]]
            check("the browser never calls the agent directly", not leaked, [r["url"] for r in leaked][:3])
            bearer = [r["url"] for r in requests_seen if "authorization" in r["headers"]]
            check("no browser request carries an authorization header", not bearer, bearer[:3])
            check("no browser console errors", not console_errors, console_errors[:3])

            # ---- sign out --------------------------------------------------------
            page.click("[data-action='logout']")
            page.wait_for_url("**/login**", timeout=20000)
            page.goto(base + "/borrower", wait_until="domcontentloaded")
            check("signed-out pages redirect to login", "/login" in page.url, page.url)
            page.screenshot(path=shots("08-signed-out.png"))

            # ---- narrow viewport (390 x 844) ------------------------------------
            mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            phone = mobile.new_page()
            try:
                login(phone, base, seed["victim"]["user"], seed["victim"]["password"])
                signed_in_pages = (
                    "/borrower",
                    "/borrower/apply",
                    f"/borrower/application?name={victim_app}",
                    "/borrower/profile",
                    "/borrower/feedback",
                    f"/borrower/assistant?application={victim_app}",
                )
                overflows = {}
                for path in signed_in_pages:
                    phone.goto(base + path, wait_until="networkidle")
                    overflows[path] = phone.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                check("no signed-in page overflows a 390px viewport", max(overflows.values()) <= 1, overflows)
                phone.goto(base + "/borrower", wait_until="networkidle")
                links = phone.locator("header nav a:visible").count()
                check("the portal nav stays usable on a narrow viewport", links >= 5, links)
                phone.screenshot(path=shots("09-mobile-dashboard.png"), full_page=True)
            finally:
                mobile.close()
        except Exception as exc:  # a broken step must not hide the evidence already collected
            check("journey completed without an exception", False, f"{type(exc).__name__}: {exc}")
            try:
                page.screenshot(path=shots("99-failure.png"), full_page=True)
            except Exception:
                pass
        finally:
            context.close()
            browser.close()

    failed = [r for r in RESULTS if not r["ok"]]
    with open(os.path.join(args.out, "journeys.json"), "w", encoding="utf-8") as handle:
        json.dump(RESULTS, handle, indent=1)
    print(f"{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
