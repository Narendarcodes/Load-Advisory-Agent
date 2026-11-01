#!/usr/bin/env node
/*
 * Proof that the write guard is a control and not a comment (Part A, section 7).
 *
 *   node tests/e2e/write_guard_proof.cjs
 *
 * A guard nobody has seen fire is indistinguishable from a guard that does nothing. This script
 * therefore *tries* to write, five different ways, from inside a signed-in borrower session running
 * under the same guard the read-only harnesses use:
 *
 *   1. the profile page's own Save button, after ticking the consent box
 *      (this is the exact call behind the consent_at finding);
 *   2. a direct POST to the application-creation method;
 *   3. a direct PUT to Frappe's generic REST update for the borrower's own profile;
 *   4. a direct POST to frappe.client.set_value;
 *   5. a direct POST to upload_file with a real one-pixel file.
 *
 * Each attempt is made with the page's own session cookie and CSRF token, so it is a request that
 * would have been accepted if it reached Frappe. The guard stops it in the browser instead. The
 * evidence is the pair of read-only SQL probes around this run: the row counts, the consent fields
 * and the Borrower Profile Version list must be identical before and after.
 *
 * Exits non-zero if any attempt reaches the server, i.e. if the guard fails to block it.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard, POSTED_READS } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "";
const PASSWORD = process.env.BORROWER_PASSWORD || "";
const APPLICATION = process.env.APPLICATION || "ACC-LOAP-2026-00020";
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01-findings-closure", "database");

async function login(page) {
  await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load", timeout: 45000 });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/borrower", { timeout: 25000 }), page.click("#login-button")]);
}

/** The portal's own boot payload: the run needs the real CSRF token so its attempts are valid. */
function boot(page) {
  return page.evaluate(() => {
    const node = document.getElementById("portal-bootstrap");
    return node ? JSON.parse(node.textContent) : null;
  });
}

/** A fetch from inside the page, so it passes through the guard exactly like the app's own calls. */
function attemptFromPage(page, { label, url, method, headers, body }) {
  return page.evaluate(
    async ({ url, method, headers, body }) => {
      const startedAt = new Date().toISOString();
      try {
        const response = await fetch(url, {
          method,
          credentials: "same-origin",
          headers,
          body: body && body.kind === "json" ? JSON.stringify(body.value) : undefined,
        });
        const status = response.status;
        const text = await response.text();
        return { startedAt, reachedServer: true, status, echo: text.slice(0, 200) };
      } catch (error) {
        return { startedAt, reachedServer: false, error: String(error && error.message ? error.message : error).slice(0, 200) };
      }
    },
    { url, method, headers, body },
  );
}

(async () => {
  if (!EMAIL || !PASSWORD) {
    console.error("BORROWER_EMAIL and BORROWER_PASSWORD are required.");
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });

  const guard = createWriteGuard({ label: "write-attempt-proof", assistant: false });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await guard.attach(page);

  const responses = [];
  page.on("response", (response) => {
    const request = response.request();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method().toUpperCase())) {
      responses.push({ method: request.method(), url: response.url(), status: response.status() });
    }
  });
  page.on("requestfailed", (request) => {
    const method = request.method().toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      responses.push({ method, url: request.url(), status: "aborted", failure: request.failure()?.errorText });
    }
  });

  const attempts = [];
  await login(page);

  // 1. the page's own save path, driven like a borrower would
  await page.goto(`${BASE}/borrower/profile`, { waitUntil: "load", timeout: 45000 });
  await page.waitForSelector("#save:not([disabled])", { timeout: 30000 });
  const consentBefore = await page.evaluate(() => ({
    terms: document.getElementById("consent-terms").checked,
    privacy: document.getElementById("consent-privacy").checked,
  }));
  await page.click("#consent-privacy");
  await page.click("#save");
  await page.waitForTimeout(3000);
  const consentAfterClick = await page.evaluate(() => ({
    terms: document.getElementById("consent-terms").checked,
    privacy: document.getElementById("consent-privacy").checked,
  }));
  const flashText = await page.evaluate(() => (document.getElementById("flash")?.innerText || "").slice(0, 300));
  attempts.push({
    label: "profile page Save button (loan_advisory_portal.api.profile.update_profile)",
    kind: "real user interface",
    consentBefore,
    consentAfterClick,
    pageFeedback: flashText,
    serverResponsesForThatCall: responses.filter((r) => r.url.includes("update_profile")),
  });

  const csrf = (await boot(page))?.csrf_token || "";
  // The profile name comes from the portal's own read call. It is posted, like every whitelisted
  // method in this app, and the guard passes it because it is a read.
  const profile = await page.evaluate(
    async (csrf) => {
      const response = await fetch("/api/method/loan_advisory_portal.api.profile.get_profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Frappe-CSRF-Token": csrf },
        body: "{}",
      });
      return { status: response.status, body: await response.json().catch(() => null) };
    },
    csrf,
  );
  const profileName = profile.body?.message?.name || null;
  const jsonHeaders = { "Content-Type": "application/json", Accept: "application/json", "X-Frappe-CSRF-Token": csrf };

  // 2..5. direct API attempts, all with the session's own CSRF token
  const direct = [
    {
      label: "POST /api/method/loan_advisory_portal.api.applications.create_application",
      url: `${BASE}/api/method/loan_advisory_portal.api.applications.create_application`,
      method: "POST",
      body: { kind: "json", value: { product: "personal_loan", amount: 100000, tenure_months: 12, purpose: "guard proof" } },
    },
    {
      label: "PUT /api/resource/Borrower Profile/<name>",
      url: `${BASE}/api/resource/Borrower%20Profile/${encodeURIComponent(profileName || "unknown")}`,
      method: "PUT",
      body: { kind: "json", value: { consent_terms: 0, consent_privacy: 0 } },
    },
    {
      label: "POST /api/method/frappe.client.set_value",
      url: `${BASE}/api/method/frappe.client.set_value`,
      method: "POST",
      body: { kind: "json", value: { doctype: "Borrower Profile", name: profileName || "unknown", fieldname: "employer", value: "guard proof" } },
    },
    {
      label: "POST /api/method/upload_file",
      url: `${BASE}/api/method/upload_file`,
      method: "POST",
      form: true,
    },
  ];
  for (const entry of direct) {
    let result;
    if (entry.form) {
      result = await page.evaluate(async ({ url, csrf }) => {
        const form = new FormData();
        form.append("file", new Blob([new Uint8Array([0])], { type: "image/png" }), "guard-proof.png");
        form.append("is_private", "1");
        form.append("folder", "Home");
        try {
          const response = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: { Accept: "application/json", "X-Frappe-CSRF-Token": csrf },
            body: form,
          });
          return { startedAt: new Date().toISOString(), reachedServer: true, status: response.status, echo: (await response.text()).slice(0, 200) };
        } catch (error) {
          return { startedAt: new Date().toISOString(), reachedServer: false, error: String(error?.message || error).slice(0, 200) };
        }
      }, { url: entry.url, csrf });
    } else {
      result = await attemptFromPage(page, { label: entry.label, url: entry.url, method: entry.method, headers: jsonHeaders, body: entry.body });
    }
    attempts.push({ label: entry.label, kind: "direct API call with the session's CSRF token", ...result });
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "write-attempt-proof.png"), fullPage: true });

  const summary = guard.summary();
  const blocked = guard.records.filter((r) => r.decision === "blocked");
  const reachedServer = attempts.filter(
    (a) => a.reachedServer === true || (a.serverResponsesForThatCall || []).some((r) => r.status !== "aborted"),
  );
  const isPostedRead = (url) => POSTED_READS.some((entry) => entry.pattern.test(new URL(url).pathname));
  const mutatingResponses = responses.filter((r) => !r.url.includes("/api/method/login") && !isPostedRead(r.url));

  const evidence = {
    capturedAt: new Date().toISOString(),
    base: BASE,
    application: APPLICATION,
    csrfTokenPresent: Boolean(csrf),
    profileReadThroughTheGuard: { status: profile.status, name: profileName, consentTerms: profile.body?.message?.consent_terms, consentPrivacy: profile.body?.message?.consent_privacy, consentAt: profile.body?.message?.consent_at },
    note:
      "The profile is fetched through the same guard, as a posted read: the run needs a real document name so that the REST and set_value attempts address something the server would have accepted. The read succeeding while the five writes are aborted is the point of the exercise.",
    attempts,
    guard: { ...summary, blocked },
    mutatingResponsesSeenByTheBrowser: mutatingResponses,
  };
  writeFileSync(path.join(OUT, "write-guard-proof.json"), JSON.stringify(evidence, null, 2));

  console.log(`attempts made:      ${attempts.length}`);
  console.log(`blocked by guard:   ${blocked.length}`);
  console.log(`reached the server: ${reachedServer.length}`);
  console.log(`mutating requests that got any server response: ${mutatingResponses.filter((r) => r.status !== "aborted").length}`);
  for (const entry of attempts) {
    const responses = entry.serverResponsesForThatCall || [];
    const outcome =
      entry.reachedServer === true
        ? "REACHED THE SERVER"
        : entry.reachedServer === false || responses.every((r) => r.status === "aborted")
          ? "aborted in the browser"
          : "no request was sent";
    console.log(`  - ${entry.label}: ${outcome}`);
  }
  await context.close();
  await browser.close();

  if (reachedServer.length || blocked.length < 5) {
    console.error("the write guard did not behave as expected");
    process.exit(1);
  }
  console.log(`wrote ${path.join(OUT, "write-guard-proof.json")}`);
})().catch((error) => {
  console.error("write guard proof failed:", error);
  process.exit(1);
});
