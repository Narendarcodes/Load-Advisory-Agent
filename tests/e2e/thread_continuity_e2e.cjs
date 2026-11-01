#!/usr/bin/env node
/*
 * Browser verification of the new-thread transcript contract (Part B, section 13).
 *
 * The finding was a 404 in the browser console on the assistant page's first load: the island asked
 * Frappe for the transcript of a thread id it had just minted, and a thread with no recorded turn
 * has no rows to return. The fix keeps a "pending" marker in sessionStorage so that request is never
 * made, while a thread that *does* have stored turns is still restored on load.
 *
 * This script proves the behaviour in a real browser, end to end, against the disposable site:
 *
 *   1. first load of a brand-new thread  -> no transcript request at all, no 404
 *   2. ask a question                    -> the turn is recorded, the marker is released
 *   3. reload the same tab               -> the transcript is requested, answers 200, restored
 *   4. "New conversation"                -> a fresh pending thread, still no transcript request
 *   5. reopen the other thread from the list -> requested, 200, restored
 *   6. control: marker removed by hand   -> the old 404 is reproduced and the panel stays empty
 *
 * Step 6 is a deliberate negative control, kept in its own browser context so its 404 cannot be
 * confused with the journey. It shows the fix removed the request, not the semantics: an unknown
 * thread id is still refused, and nothing is invented on screen.
 *
 * TEST-ONLY. The agent upstream is tests/e2e/agui_stub.cjs, so no model and no GPU are involved;
 * Frappe sessions, the mint_assertion bridge, the runtime and the real island bundle are all live.
 *
 *   BORROWER_EMAIL=... BORROWER_PASSWORD=... APPLICATION=ACC-LOAP-2026-00020 \
 *     node tests/e2e/thread_continuity_e2e.cjs
 *
 * Environment: BASE (default http://127.0.0.1:8081), BORROWER_EMAIL, BORROWER_PASSWORD,
 * APPLICATION, OUT.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "";
const PASSWORD = process.env.BORROWER_PASSWORD || "";
const APPLICATION = process.env.APPLICATION || "";
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01-findings-closure", "thread-continuity");

const ASSISTANT = `${BASE}/borrower/assistant?application=${encodeURIComponent(APPLICATION)}`;
const HISTORY_CALL = "loan_advisory_portal.api.agent.conversation_messages";
const RECORD_CALL = "loan_advisory_portal.api.agent.record_turn";
const FIXTURE = "Acceptance fixture response";
const THREAD_KEY_PREFIX = "loan-advisory:thread:";

const QUESTIONS = {
  first: "What information is missing from my application?",
  second: "Which policy source supports this?",
};

function nowIso() {
  return new Date().toISOString();
}

async function login(page) {
  await page.goto(`${BASE}/login?redirect-to=${encodeURIComponent("/borrower/assistant")}`, {
    waitUntil: "load",
    timeout: 45000,
  });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/borrower**", { timeout: 25000 }), page.click("#login-button")]);
}

async function waitForAssistant(page) {
  await page.waitForSelector("#question:not([disabled])", { timeout: 40000 });
}

/** Ask and wait for the answer to have landed in the transcript panel. */
async function ask(page, question) {
  await page.fill("#question", question);
  await page.click(".chat form.row button[type=submit]");
  await page.waitForFunction(
    (text) => {
      const bot = document.querySelectorAll(".chat .msg.bot");
      return (
        bot.length > 0 &&
        bot[bot.length - 1].textContent.includes(text) &&
        !document.querySelector(".chat .progress")
      );
    },
    question.length ? FIXTURE : undefined,
    { timeout: 40000 },
  );
  // The island records the turn after the run finishes; give it a beat to land.
  await page.waitForFunction(
    () => {
      const marker = Object.keys(sessionStorage).find((k) => k.endsWith(":pending"));
      return marker === undefined || !sessionStorage.getItem(marker);
    },
    undefined,
    { timeout: 20000 },
  );
}

function collectRequests(page, log) {
  page.on("response", (response) => {
    const request = response.request();
    log.push({
      method: request.method(),
      status: response.status(),
      url: response.url(),
      fromBrowser: request.frame() === page.mainFrame(),
    });
  });
  page.on("requestfailed", (request) => {
    log.push({
      method: request.method(),
      status: "failed",
      url: request.url(),
      failure: request.failure()?.errorText || "unknown",
    });
  });
}

function historyCalls(log) {
  return log.filter((row) => row.url.includes(HISTORY_CALL));
}

function notFound(log) {
  return log.filter((row) => row.status === 404);
}

function serverErrors(log) {
  return log.filter((row) => typeof row.status === "number" && row.status >= 500);
}

function failedRequests(log) {
  return log.filter((row) => row.status === "failed");
}

function threadState(page) {
  return page.evaluate((prefix) => {
    const state = {};
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(prefix)) state[key] = sessionStorage.getItem(key);
    }
    return state;
  }, THREAD_KEY_PREFIX);
}

function messageCounts(page) {
  return page.evaluate(() => ({
    user: Array.from(document.querySelectorAll(".chat .msg.user")).map((el) => el.textContent.trim().slice(0, 120)),
    bot: Array.from(document.querySelectorAll(".chat .msg.bot")).map((el) => el.textContent.trim().slice(0, 120)),
    emptyShown: Boolean(document.querySelector(".chat .empty")),
    errorShown: Boolean(document.querySelector(".chat .error")),
  }));
}

function checks(rows) {
  const failed = rows.filter((row) => !row.pass);
  return { pass: failed.length === 0, rows, failures: failed.map((row) => row.label) };
}

function check(list, label, pass, detail) {
  list.push({ label, pass: Boolean(pass), detail });
  return list;
}

async function openRun(browser, guard) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await guard.attach(page);
  return { context, page };
}

(async () => {
  if (!PASSWORD || !EMAIL) {
    console.error("BORROWER_EMAIL and BORROWER_PASSWORD are required (see the seeded credentials file).");
    process.exit(2);
  }
  if (!APPLICATION) {
    // The journey opens one specific application, and the island mounts only for a thread the signed-in
    // borrower owns. A stale default id fails as "the assistant never appeared", which reads like a defect.
    console.error("APPLICATION is required: pass the seeded fixture's application id.");
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const evidence = { capturedAt: nowIso(), base: BASE, application: APPLICATION, fixture: "tests/e2e/agui_stub.cjs", runs: [] };
  const consoleErrors = [];

  // ---- run 1: the journey a borrower actually takes -------------------------------------
  {
    const log = [];
    const guard = createWriteGuard({ label: "thread-continuity/journey", assistant: true });
    const { context, page } = await openRun(browser, guard);
    collectRequests(page, log);
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push({ run: "journey", text: m.text().slice(0, 300) });
    });
    page.on("pageerror", (e) => consoleErrors.push({ run: "journey", text: String(e.message).slice(0, 300) }));

    const steps = [];

    await login(page);
    await page.goto(ASSISTANT, { waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    await page.waitForTimeout(1500);
    const beforeFirst = historyCalls(log).length;
    const minted = await threadState(page);
    check(steps, "first load: brand-new thread mints a pending marker", Object.values(minted).some((v) => v), minted);
    check(steps, "first load: no transcript request is made", beforeFirst === 0, { historyCalls: beforeFirst });
    check(steps, "first load: no 404 responses", notFound(log).length === 0, notFound(log));
    check(steps, "first load: no server errors", serverErrors(log).length === 0, serverErrors(log));
    const emptyOnFirst = await messageCounts(page);
    check(steps, "first load: panel is empty rather than invented", emptyOnFirst.user.length === 0 && !emptyOnFirst.errorShown, emptyOnFirst);
    await page.screenshot({ path: path.join(OUT, "01-first-load-brand-new-thread.png"), fullPage: true });

    await ask(page, QUESTIONS.first);
    await page.waitForTimeout(800);
    const recordResponses = log.filter((row) => row.url.includes(RECORD_CALL));
    check(steps, "first answer: the turn is recorded", recordResponses.length > 0 && recordResponses.every((r) => r.status === 200), recordResponses);
    const afterFirstAsk = historyCalls(log).length;
    check(steps, "first answer: no transcript request yet this load", afterFirstAsk === 0, { historyCalls: afterFirstAsk });
    const afterMarker = await threadState(page);
    check(steps, "first answer: the pending marker is released", Object.entries(afterMarker).every(([k, v]) => !k.endsWith(":pending") || !v), afterMarker);
    await page.screenshot({ path: path.join(OUT, "02-after-first-answer.png"), fullPage: true });

    await page.reload({ waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    await page.waitForTimeout(2500);
    const reloadCalls = historyCalls(log);
    check(steps, "reload: the stored transcript is requested", reloadCalls.length >= 1, reloadCalls);
    check(steps, "reload: the transcript request answers 200", reloadCalls.every((row) => row.status === 200), reloadCalls);
    check(steps, "reload: no 404 responses", notFound(log).length === 0, notFound(log));
    check(steps, "reload: no server errors", serverErrors(log).length === 0, serverErrors(log));
    const restored = await messageCounts(page);
    check(
      steps,
      "reload: the recorded exchange is on screen",
      restored.user.some((t) => t.includes("missing from my application")) && restored.bot.some((t) => t.includes(FIXTURE)),
      restored,
    );
    await page.screenshot({ path: path.join(OUT, "03-reload-restored-transcript.png"), fullPage: true });

    await page.click("text=New conversation");
    await page.waitForTimeout(2000);
    const afterNew = historyCalls(log);
    check(steps, "new conversation: the fresh thread is not asked for", afterNew.length === reloadCalls.length, {
      before: reloadCalls.length,
      after: afterNew.length,
    });
    check(steps, "new conversation: no 404 responses", notFound(log).length === 0, notFound(log));
    const freshState = await messageCounts(page);
    check(steps, "new conversation: panel is empty, not carried over", freshState.user.length === 0 && !freshState.errorShown, freshState);
    await page.screenshot({ path: path.join(OUT, "04-new-conversation-brand-new-thread.png"), fullPage: true });

    await ask(page, QUESTIONS.second);
    await page.waitForTimeout(1200);
    const reopenable = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".history__item")).map((el) => ({
        label: el.textContent.trim().slice(0, 80),
        current: el.getAttribute("aria-current") === "true",
      })),
    );
    check(steps, "second answer: the list offers both conversations", reopenable.length >= 2, reopenable);

    const target = reopenable.findIndex((row) => !row.current);
    check(steps, "second answer: one listed conversation is not the current one", target >= 0, reopenable);
    await page.click(`.history__item >> nth=${target}`);
    await page.waitForTimeout(2500);
    const reopenCalls = historyCalls(log);
    check(steps, "reopen: the older conversation is requested", reopenCalls.length > afterNew.length, {
      before: afterNew.length,
      after: reopenCalls.length,
    });
    check(steps, "reopen: every transcript request answered 200", reopenCalls.every((row) => row.status === 200), reopenCalls);
    check(steps, "reopen: no 404 responses", notFound(log).length === 0, notFound(log));
    const reopened = await messageCounts(page);
    check(
      steps,
      "reopen: the older exchange is restored",
      reopened.user.some((t) => t.includes("missing from my application")) && reopened.bot.every((t) => t.includes(FIXTURE)),
      reopened,
    );
    await page.screenshot({ path: path.join(OUT, "05-reopened-older-conversation.png"), fullPage: true });

    evidence.runs.push({
      run: "journey",
      expectation: "a borrower's first load of a new thread makes no transcript request; a thread with stored turns is restored",
      threadKeys: minted,
      historyCalls: historyCalls(log),
      notFound: notFound(log),
      serverErrors: serverErrors(log),
      failedRequests: failedRequests(log),
      consoleErrors: consoleErrors.filter((row) => row.run === "journey"),
      writeGuard: guard.summary(),
      checks: checks(steps),
    });
    await context.close();
  }

  // ---- run 2: negative control, reproducing the original 404 ---------------------------
  {
    const log = [];
    const guard = createWriteGuard({ label: "thread-continuity/control", assistant: false });
    const { context, page } = await openRun(browser, guard);
    collectRequests(page, log);
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push({ run: "control", text: m.text().slice(0, 300) });
    });
    page.on("pageerror", (e) => consoleErrors.push({ run: "control", text: String(e.message).slice(0, 300) }));

    const steps = [];
    await login(page);
    await page.goto(ASSISTANT, { waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    await page.waitForTimeout(1200);

    // Replace the minted thread with an id this account has never used and drop the marker:
    // exactly the state that produced the finding. Nothing here writes to the site.
    await page.evaluate((prefix) => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith(prefix) && !k.endsWith(":pending"));
      const marker = Object.keys(sessionStorage).find((k) => k.startsWith(prefix) && k.endsWith(":pending"));
      if (key) sessionStorage.setItem(key, crypto.randomUUID());
      if (marker) sessionStorage.removeItem(marker);
      return { key, marker };
    }, THREAD_KEY_PREFIX);

    await page.reload({ waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    await page.waitForTimeout(2500);
    const controlCalls = historyCalls(log);
    check(steps, "control: the unknown thread is now asked for", controlCalls.length >= 1, controlCalls);
    check(steps, "control: the server refuses it as not found", controlCalls.every((row) => row.status === 404), controlCalls);
    const controlState = await messageCounts(page);
    check(
      steps,
      "control: the refusal leaves the panel empty, with no invented transcript and no raw error",
      controlState.user.length === 0 && controlState.bot.length === 0 && !controlState.errorShown,
      controlState,
    );
    check(
      steps,
      "control: the refusal text is not shown to the borrower",
      !(await page.evaluate(() => document.body.innerText.toLowerCase().includes("404"))),
      { bodyContains404: await page.evaluate(() => document.body.innerText.toLowerCase().includes("404")) },
    );
    await page.screenshot({ path: path.join(OUT, "06-control-unknown-thread-refused.png"), fullPage: true });

    evidence.runs.push({
      run: "control",
      expectation:
        "deliberate reproduction of the original finding: with the pending marker removed by hand, the island does ask for an unknown thread and Frappe does refuse it. Kept in its own context so this 404 cannot be read as a defect of the journey.",
      historyCalls: controlCalls,
      notFound: notFound(log),
      serverErrors: serverErrors(log),
      failedRequests: failedRequests(log),
      consoleErrors: consoleErrors.filter((row) => row.run === "control"),
      writeGuard: guard.summary(),
      checks: checks(steps),
    });
    await context.close();
  }

  await browser.close();

  const guards = evidence.runs.map((row) => row.writeGuard);
  const unexpectedWrites = guards.reduce((total, g) => total + g.writesBlocked, 0);
  const journey = evidence.runs.find((row) => row.run === "journey");
  const control = evidence.runs.find((row) => row.run === "control");
  const journeyFailed = journey.checks.failures;
  // The control run is expected to produce exactly one 404; anything else is a real failure.
  const controlStrays = control.historyCalls.filter((row) => row.status !== 404);

  writeFileSync(path.join(OUT, "thread-continuity-results.json"), JSON.stringify(evidence, null, 2));

  console.log(`journey checks: ${journey.checks.rows.filter((r) => r.pass).length}/${journey.checks.rows.length} passed`);
  console.log(`  transcript requests made during the journey: ${journey.historyCalls.length} (all ${journey.historyCalls.every((r) => r.status === 200) ? "200" : "not all 200"})`);
  console.log(`  404 responses during the journey: ${journey.notFound.length}`);
  console.log(`control checks: ${control.checks.rows.filter((r) => r.pass).length}/${control.checks.rows.length} passed`);
  console.log(`  404 responses in the control run (expected): ${control.notFound.length}`);
  console.log(`console errors: ${consoleErrors.length}`);
  console.log(`non-read requests: writes allowed ${guards.reduce((t, g) => t + g.writesAllowed, 0)}, blocked ${unexpectedWrites}`);
  if (journeyFailed.length || unexpectedWrites || controlStrays.length || control.checks.failures.length) {
    console.log(JSON.stringify({ journeyFailed, controlStrays, controlFailures: control.checks.failures }, null, 2));
    process.exit(1);
  }
  console.log(`wrote ${path.join(OUT, "thread-continuity-results.json")}`);
})().catch((error) => {
  console.error("thread continuity verification failed:", error);
  process.exit(1);
});
