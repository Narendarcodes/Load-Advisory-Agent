#!/usr/bin/env node
/*
 * Browser-level acceptance test for the Missing Information GenUI card.
 *
 * TEST-ONLY harness. It drives the real Frappe page, the real built island bundle, the real
 * CopilotKit runtime and the island's real schema/registry/render path. Only the agent upstream
 * is replaced, by tests/e2e/agui_stub.cjs, so the run is deterministic and needs no model or GPU.
 *
 *   npm --prefix tests/e2e run missing-info
 *
 * Environment: BASE (default http://127.0.0.1:8081), BORROWER_EMAIL, BORROWER_PASSWORD,
 * APPLICATION, WIDTHS. Writes screenshots and missing-information-results.json under docs/.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "review.demo@example.invalid";
const PASSWORD = process.env.BORROWER_PASSWORD || "LoanReview!2026Demo";
const APPLICATION = process.env.APPLICATION || "ACC-LOAP-2026-00018";
const WIDTHS = (process.env.WIDTHS || "1440,1280,1024,768,390").split(",").map(Number);
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01", "missing-information");
const ASSISTANT = `${BASE}/borrower/assistant?application=${encodeURIComponent(APPLICATION)}`;

const QUESTIONS = {
  valid: "What information is missing from my application?",
  longtext: "Show a very long missing information field.",
  malformed: "Render a malformed payload.",
  unknown: "Render an unknown component payload.",
  absent_fields: "Render a payload where required fields are absent.",
  no_missing: "Confirm there is no missing information.",
  no_key: "Answer without a missing information state.",
  citations: "Which policy source supports this?",
  slow: "Render the slow loading state.",
  error: "Simulate failure of the upstream.",
};

function nowIso() {
  return new Date().toISOString();
}

async function login(page) {
  await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load", timeout: 45000 });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/borrower", { timeout: 25000 }), page.click("#login-button")]);
}

async function waitForAssistant(page) {
  await page.waitForSelector("#question:not([disabled])", { timeout: 40000 });
}

async function ask(page, question) {
  await page.fill("#question", question);
  await page.click(".chat form.row button[type=submit]");
  await page.waitForFunction(
    () => {
      const button = document.querySelector(".chat form.row button[type=submit]");
      return Boolean(button) && button.textContent.trim() === "Send" && !document.querySelector(".chat .progress");
    },
    { timeout: 30000 },
  );
  await page.waitForTimeout(250);
}

async function measure(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - window.innerWidth;
    const offenders = [];
    if (overflow > 1) {
      document.querySelectorAll("body *").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 1 && rect.width > 8) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 60),
            right: Math.round(rect.right),
          });
        }
      });
    }
    const card = document.querySelector(".missing");
    let clipped = null;
    const scrollables = [];
    if (card) {
      const rect = card.getBoundingClientRect();
      let node = card.parentElement;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        const parent = node.getBoundingClientRect();
        const outside =
          rect.bottom > parent.bottom + 1 || rect.right > parent.right + 1 || rect.top < parent.top - 1;
        if (outside && (style.overflowY !== "visible" || style.overflowX !== "visible")) {
          const entry = {
            by: node.tagName.toLowerCase() + "." + (node.className || "").toString().slice(0, 50),
            overflowY: style.overflowY,
            overflowX: style.overflowX,
            cardBottom: Math.round(rect.bottom),
            parentBottom: Math.round(parent.bottom),
          };
          // A scroll container is reachable; only hidden/clip actually severs content.
          if (/auto|scroll/.test(style.overflowY) || /auto|scroll/.test(style.overflowX)) scrollables.push(entry);
          else {
            clipped = entry;
            break;
          }
        }
        node = node.parentElement;
      }
    }
    const inner = card
      ? Array.from(card.querySelectorAll("li, li *")).map((el) => ({
          tag: el.tagName.toLowerCase(),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflow: el.scrollWidth - el.clientWidth,
        }))
      : [];
    return {
      url: location.pathname + location.search,
      viewport: window.innerWidth,
      scrollWidth: root.scrollWidth,
      overflowPx: overflow,
      offenders: offenders.slice(0, 5),
      cardRect: card
        ? (() => {
            const r = card.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
          })()
        : null,
      clipped,
      scrollables,
      innerOverflow: inner.filter((row) => row.overflow > 1).slice(0, 5),
    };
  });
}

async function readCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector(".missing");
    if (!card) return null;
    const heading = card.querySelector("h3");
    const labelledBy = card.getAttribute("aria-labelledby");
    const items = Array.from(card.querySelectorAll("li")).map((li) => ({
      label: (li.querySelector("b") || {}).textContent || "",
      explanation: (li.querySelector("p.note") || {}).textContent || "",
      href: (li.querySelector("a") || {}).getAttribute ? li.querySelector("a").getAttribute("href") : null,
      linkText: (li.querySelector("a") || {}).textContent || "",
    }));
    return {
      heading: heading ? heading.textContent.trim() : null,
      headingId: heading ? heading.id : null,
      labelledBy,
      labelResolves: Boolean(labelledBy && document.getElementById(labelledBy)),
      itemCount: items.length,
      items,
    };
  });
}

async function leakage(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const needles = [
      "missing_information",
      "record_json",
      "authorization",
      "Bearer ",
      "assertion",
      "window.__fixtureXss",
      "<script",
    ];
    return {
      needles: needles.filter((needle) => text.includes(needle)),
      injectedImages: document.querySelectorAll('img[src="x"]').length,
      xssFlag: typeof window.__fixtureXss === "undefined" ? null : String(window.__fixtureXss),
    };
  });
}

async function keyboardReview(page) {
  await page.click("#question");
  const order = [];
  let reached = null;
  for (let index = 0; index < 90; index += 1) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || "").trim().slice(0, 60),
        href: el.getAttribute ? el.getAttribute("href") : null,
        inCard: Boolean(el.closest(".missing")),
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow === "none" ? "none" : "set",
        visible: rect.width > 0 && rect.height > 0,
      };
    });
    if (!active) break;
    order.push(active);
    if (active.inCard) {
      reached = { index, active };
      break;
    }
  }
  const focusVisible = Boolean(
    reached && (reached.active.outlineStyle !== "none" || reached.active.boxShadow !== "none"),
  );
  return {
    tabStopsBeforeCard: reached ? reached.index : null,
    reachedCardLink: Boolean(reached),
    focused: reached ? reached.active : null,
    focusIndicator: focusVisible,
    order: order.map((stop) => `${stop.tag}:${stop.text.slice(0, 30)}`).slice(-12),
  };
}

async function capture(page, file) {
  await page.addStyleTag({ content: ".tabbar { position: static !important; }" });
  await page.screenshot({ path: file, fullPage: true });
}

async function validScenario(page, width, record, errors) {
  const question = QUESTIONS.valid;
  await ask(page, question);
  await page.waitForSelector(".missing", { timeout: 8000 });

  const keyboard = await keyboardReview(page);
  await page.locator(".missing").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const card = await readCard(page);
  const layout = await measure(page);
  const leaks = await leakage(page);
  const visibleAfterScroll = await page.evaluate(() => {
    const el = document.querySelector(".missing");
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= -1 && rect.bottom <= window.innerHeight + 1 && rect.width > 0;
  });

  const pageShot = path.join(OUT, `missing-information-${width}.png`);
  const viewportShot = path.join(OUT, `missing-information-viewport-${width}.png`);
  const cardShot = path.join(OUT, `missing-information-card-${width}.png`);
  await capture(page, pageShot);
  await page.screenshot({ path: viewportShot });
  await page.locator(".missing").screenshot({ path: cardShot });

  const expected = ["Monthly income", "Monthly obligations", "Credit score"];
  const checks = {
    cardVisible: Boolean(card),
    headingCopy: card?.heading === "Information still needed",
    headingLabelResolves: Boolean(card?.labelResolves),
    itemCount: card?.itemCount === 3,
    labels: expected.every((label) => (card?.items || []).some((item) => item.label.trim() === label)),
    everyItemExplained: (card?.items || []).every((item) => item.explanation.trim().length > 20),
    linksNamed: (card?.items || []).every((item) => item.linkText.trim().length > 0),
    linkTargets: (card?.items || []).every((item) =>
      String(item.href).startsWith(`/borrower/application?name=${APPLICATION}#info-request`),
    ),
    noOverflow: layout.overflowPx <= 1,
    noClipping: layout.clipped === null,
    noInnerOverflow: layout.innerOverflow.length === 0,
    cardInsideViewport: Boolean(layout.cardRect && layout.cardRect.left >= 0 && layout.cardRect.right <= width + 1),
    visibleAfterScroll,
    noLeakage: leaks.needles.length === 0,
    noConsoleErrors: errors.length === 0,
    keyboardReachesCard: keyboard.reachedCardLink,
    focusVisible: keyboard.focusIndicator,
  };
  record.push({
    width,
    scenario: "valid",
    at: nowIso(),
    checks,
    card,
    layout,
    leakage: leaks,
    keyboard,
    consoleErrors: errors,
    screenshots: [
      pageShot.replace(/\\/g, "/"),
      viewportShot.replace(/\\/g, "/"),
      cardShot.replace(/\\/g, "/"),
    ],
    pass: Object.values(checks).every(Boolean),
  });
}

async function negativeScenario(page, width, scenario, expectation, record, errors) {
  await ask(page, QUESTIONS[scenario]);
  if (scenario === "error") {
    await page.waitForSelector(".chat .error[role=alert]", { timeout: 10000 });
  } else {
    await page.waitForSelector(".chat .log .msg.bot", { timeout: 10000 });
    await page.waitForTimeout(300);
  }
  const state = await page.evaluate(() => ({
    missingCards: document.querySelectorAll(".missing").length,
    errorAlerts: document.querySelectorAll(".chat .error[role=alert]").length,
    decisionCards: document.querySelectorAll(".card-block.decision").length,
    detailsBlocks: document.querySelectorAll(".details__block").length,
    botText: Array.from(document.querySelectorAll(".chat .log .msg.bot"))
      .map((el) => el.textContent)
      .join(" ")
      .trim(),
  }));
  const layout = await measure(page);
  const leaks = await leakage(page);
  const shot = path.join(OUT, `negative-${scenario}-${width}.png`);
  await capture(page, shot);
  const checks = {
    missingCardsAsExpected: state.missingCards === (expectation.missingCards ?? 0),
    noConsoleCrash: errors.length === 0,
    noOverflow: layout.overflowPx <= 1,
    noInjectedMarkup: leaks.injectedImages === 0 && leaks.xssFlag === null,
    noLeakage: leaks.needles.length === 0,
    answerStillRendered: state.botText.includes("Acceptance fixture response") || scenario === "error",
    errorShown: scenario === "error" ? state.errorAlerts === 1 : true,
  };
  record.push({
    width,
    scenario,
    at: nowIso(),
    expectation,
    checks,
    state,
    layout,
    leakage: leaks,
    consoleErrors: errors,
    screenshot: shot.replace(/\\/g, "/"),
    pass: Object.values(checks).every(Boolean),
  });
}

(async () => {
  if (!PASSWORD) {
    console.error("BORROWER_PASSWORD is required.");
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });

  const valid = [];
  const negative = [];
  const consoleErrors = [];
  const guards = [];
  const browser = await chromium.launch();

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width <= 768 ? 900 : 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    // This journey holds a real conversation, so the calls that carry a turn are declared and every
    // other mutating request is still blocked: a card render must not touch a loan record.
    const guard = createWriteGuard({ label: `valid@${width}`, assistant: true });
    await guard.attach(page);
    guards.push(guard);
    page.on("console", (message) => {
      if (message.type() === "error") {
        const entry = { width, scenario: "valid", text: message.text().slice(0, 300) };
        consoleErrors.push(entry);
        errors.push(entry);
      }
    });
    page.on("pageerror", (error) => {
      const entry = { width, scenario: "valid", text: String(error.message).slice(0, 300) };
      consoleErrors.push(entry);
      errors.push(entry);
    });

    await login(page);
    await page.goto(ASSISTANT, { waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    await validScenario(page, width, valid, errors);
    await context.close();
  }

  for (const scenario of ["malformed", "unknown", "absent_fields", "no_missing", "no_key", "error"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const scenarioErrors = [];
    const guard = createWriteGuard({ label: `negative/${scenario}`, assistant: true });
    await guard.attach(page);
    guards.push(guard);
    page.on("console", (message) => {
      if (message.type() === "error") {
        const entry = { width: 1440, scenario, text: message.text().slice(0, 300) };
        consoleErrors.push(entry);
        scenarioErrors.push(entry);
      }
    });
    page.on("pageerror", (error) => {
      const entry = { width: 1440, scenario, text: String(error.message).slice(0, 300) };
      consoleErrors.push(entry);
      scenarioErrors.push(entry);
    });
    await login(page);
    await page.goto(ASSISTANT, { waitUntil: "load", timeout: 45000 });
    await waitForAssistant(page);
    const expectation =
      scenario === "unknown"
        ? { missingCards: 1, note: "unknown channels ignored, known card still renders" }
        : scenario === "error"
          ? { missingCards: 0, note: "RUN_ERROR surfaces as a friendly alert" }
          : { missingCards: 0, note: "invalid or empty payload renders no card" };
    await negativeScenario(page, 1440, scenario, expectation, negative, scenarioErrors);
    await context.close();
  }

  await browser.close();

  const result = {
    capturedAt: nowIso(),
    base: BASE,
    application: APPLICATION,
    fixture: "tests/e2e/agui_stub.cjs (deterministic, test-only)",
    playwright: require("playwright/package.json").version,
    widths: WIDTHS,
    writeGuard: guards.map((g) => g.summary()),
    valid,
    negative,
    consoleErrors,
  };
  writeFileSync(path.join(OUT, "missing-information-results.json"), JSON.stringify(result, null, 2));

  const failures = [...valid, ...negative].filter((row) => !row.pass);
  const unexpectedWrites = guards.flatMap((g) => g.blocked());
  console.log(`valid runs: ${valid.filter((row) => row.pass).length}/${valid.length}`);
  console.log(`negative runs: ${negative.filter((row) => row.pass).length}/${negative.length}`);
  console.log(`console errors: ${consoleErrors.length}`);
  console.log(`non-read requests: writes allowed ${guards.reduce((s, g) => s + g.summary().writesAllowed, 0)}, blocked ${unexpectedWrites.length}`);
  for (const record of unexpectedWrites) {
    console.log(`  UNEXPECTED ${record.decision} ${record.method} ${record.path} [${record.label}]`);
  }
  if (failures.length) {
    console.log(JSON.stringify(failures.map((row) => ({ width: row.width, scenario: row.scenario, checks: row.checks })), null, 2));
    process.exit(1);
  }
  if (unexpectedWrites.length) {
    console.error("journey attempted writes beyond the conversation it declared");
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error("missing-information E2E failed:", error);
  process.exit(1);
});
