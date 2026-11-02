#!/usr/bin/env node
/*
 * TEST-ONLY capture of the Saral redesign against the fixture render (fixture_portal.py).
 *
 *   MODE=shots   BASE=http://127.0.0.1:8081 OUT=<dir> node tests/e2e/redesign_capture.cjs
 *   MODE=before  BASE=http://127.0.0.1:8082 OUT=<dir> ...   (origin/main screens)
 *   MODE=record-assistant | record-wizard   (headed kiosk window; ffmpeg grabs the X display)
 *   MODE=axe     BASE=... OUT=<dir>        (axe-core WCAG 2.2 AA over the rendered pages)
 *
 * The browser is the system Chromium, headed on the X display in $DISPLAY. Every answer the
 * assistant shows comes from tests/e2e/agui_stub.cjs and starts with "Acceptance fixture response".
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const OUT = process.env.OUT || "out/redesign";
const MODE = process.env.MODE || "shots";
const WIDTHS = (process.env.WIDTHS || "1280,820,390").split(",").map(Number);
const HEIGHT = { 1280: 860, 820: 1180, 390: 844 };
const REJECTED = "ACC-LOAP-2026-00021";
const APPROVED = "ACC-LOAP-2026-00012";
const PENDING = "ACC-LOAP-2026-00024";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
const log = [];

async function launch(extraArgs = []) {
  return chromium.launch({
    headless: false,
    executablePath: process.env.CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--disable-gpu", ...extraArgs],
  });
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await sleep(350);
}

async function shot(page, name, full = true) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: full });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log.push({ name, file, horizontalOverflowPx: overflow });
  console.log(`${name} overflow=${overflow}`);
}

async function ask(page, text) {
  const box = page.locator(".composer textarea, .composer input").first();
  await box.fill(text);
  await page.locator(".composer button", { hasText: /Send/ }).first().click();
}

/** v2: the conversation flows in the page. Scroll the window so `selector`'s last match sits near the top. */
async function focusLatest(page, selector = ".msg.bot", offset = 72) {
  await page.evaluate(([sel, off]) => {
    const items = document.querySelectorAll(sel);
    const last = items[items.length - 1];
    if (last) window.scrollTo({ top: last.getBoundingClientRect().top + window.scrollY - off, behavior: "instant" });
  }, [selector, offset]);
  await sleep(300);
}

async function waitAnswer(page, count) {
  await page.waitForFunction(
    (n) => document.querySelectorAll(".msg.bot:not(.msg--live):not(.msg--error)").length >= n &&
      !document.querySelector(".msg--live"),
    count,
    { timeout: 60000 },
  );
  await sleep(500);
}

async function newContext(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT[width] || 900 },
    deviceScaleFactor: 1,
    isMobile: width <= 420,
    hasTouch: width <= 420,
  });
  return context;
}

async function wizard(page, prefix, width) {
  await page.goto(`${BASE}/borrower/apply`);
  await settle(page);
  await page.waitForFunction(() => document.getElementById("about-name")?.value, null, { timeout: 10000 }).catch(() => {});
  await shot(page, `${prefix}apply-1-about-${width}`);
  const next = page.locator("#next");
  await next.click(); await sleep(300); // -> work
  await shot(page, `${prefix}apply-1b-work-${width}`);
  await next.click(); await sleep(300); // -> money
  await shot(page, `${prefix}apply-1c-money-${width}`);
  await next.click(); await sleep(300); // -> loan
  await page.fill("#loan-amount", "250000");
  await page.selectOption("#loan-tenure", { index: 2 }).catch(() => {});
  await page.selectOption("#loan-purpose", { index: 1 }).catch(() => {});
  await sleep(200);
  await shot(page, `${prefix}apply-2-loan-${width}`);
  await next.click(); await sleep(400); // -> review
  await shot(page, `${prefix}apply-3-review-${width}`);
}

async function assistant(page, prefix, width) {
  await page.goto(`${BASE}/borrower/assistant?application=${REJECTED}`);
  await settle(page);
  await page.waitForSelector(".composer", { timeout: 20000 });
  await sleep(800);
  await shot(page, `${prefix}assistant-0-empty-${width}`, false);
  await ask(page, "Why was this decision made?");
  await page.waitForFunction(() => document.querySelectorAll(".msg--live .trail li").length >= 2, null, { timeout: 15000 }).catch(() => {});
  await focusLatest(page, ".msg.user");
  await shot(page, `${prefix}assistant-1-streaming-trail-${width}`, false);
  await waitAnswer(page, 1);
  await focusLatest(page, ".msg.user");
  await shot(page, `${prefix}assistant-2-answer-${width}`, false);
  await focusLatest(page, ".msg.bot .decision", 24);
  await shot(page, `${prefix}assistant-2b-meters-${width}`, false);
  await ask(page, "Which policy source sets these limits?");
  await waitAnswer(page, 2);
  await page.locator(".source-chip summary").first().click().catch(() => {});
  await sleep(300);
  await focusLatest(page, ".msg.user");
  await shot(page, `${prefix}assistant-3-citations-${width}`, false);
  await ask(page, "What if my credit score was 720?");
  await waitAnswer(page, 3);
  await focusLatest(page, ".msg.bot .whatif", 24);
  await shot(page, `${prefix}assistant-4-whatif-${width}`, false);
  await page.locator(".whatif button", { hasText: "Try other numbers" }).last().click().catch(() => {});
  await sleep(400);
  await focusLatest(page, ".whatif-panel", 24);
  await shot(page, `${prefix}assistant-4b-whatif-form-${width}`, false);
  await page.locator(".whatif-panel button", { hasText: "Close what-if" }).click().catch(() => {});
  await ask(page, "Please simulate failure");
  await page.waitForSelector(".msg--error", { timeout: 30000 }).catch(() => {});
  await sleep(600);
  await focusLatest(page, ".msg.user", 24);
  await shot(page, `${prefix}assistant-5-error-retry-${width}`, false);
  const history = page.locator(".drawer-tab", { hasText: "History" });
  if (await history.count()) {
    await history.first().click();
    await sleep(600);
    await shot(page, `${prefix}assistant-6-drawer-${width}`, false);
    await page.locator(".tools-drawer button", { hasText: "Close" }).first().click().catch(() => {});
  }
}

async function shots() {
  const browser = await launch();
  for (const width of WIDTHS) {
    const context = await newContext(browser, width);
    const page = await context.newPage();
    page.on("pageerror", (e) => log.push({ width, pageerror: String(e) }));
    const routes = [
      ["login", "/login"],
      ["dashboard", "/borrower?fx=full"],
      ["dashboard-empty", "/borrower?fx=empty"],
      ["documents-empty", "/borrower/documents?fx=empty"],
      ["documents", `/borrower/documents?name=${REJECTED}`],
      ["profile", "/borrower/profile"],
      ["help", "/borrower/help?fx=full"],
      ["decision-rejected", `/borrower/application?name=${REJECTED}`],
      ["decision-approved", `/borrower/application?name=${APPROVED}`],
      ["decision-pending", `/borrower/application?name=${PENDING}`],
      ["assistant-choose", "/borrower/assistant"],
    ];
    if (process.env.ONLY !== "assistant") for (const [name, route] of routes) {
      await page.goto(BASE + route);
      await settle(page);
      await shot(page, `${name}-${width}`);
    }
    if (process.env.ONLY === "screens") { await context.close(); continue; }
    if (process.env.ONLY !== "assistant") await wizard(page, "", width);
    await assistant(page, "", width);
    if (width <= 420) {
      await page.locator('[data-action="nav-toggle"]').last().click().catch(() => {});
      await sleep(500);
      await shot(page, `nav-drawer-${width}`, false);
    }
    await context.close();
  }
  await browser.close();
}

async function before() {
  const browser = await launch();
  for (const width of WIDTHS) {
    const context = await newContext(browser, width);
    const page = await context.newPage();
    for (const [name, route] of [
      ["login", "/login"],
      ["dashboard", "/borrower?fx=full"],
      ["decision-rejected", `/borrower/application?name=${REJECTED}`],
    ]) {
      await page.goto(BASE + route);
      await settle(page);
      await shot(page, `before-${name}-${width}`);
    }
    await page.goto(`${BASE}/borrower/assistant?application=${REJECTED}`);
    await settle(page);
    await sleep(1500);
    await shot(page, `before-assistant-0-empty-${width}`);
    try {
      const box = page.locator("textarea, input[type=text]").last();
      await box.fill("Why was this decision made?");
      await box.press("Enter");
      await sleep(9000);
      await shot(page, `before-assistant-2-answer-${width}`);
    } catch (e) {
      log.push({ width, beforeAssistant: String(e) });
    }
    await context.close();
  }
  await browser.close();
}

async function record(kind) {
  // Kiosk window filling the Xvfb screen; ffmpeg (started by the caller) grabs the display.
  const width = Number(process.env.REC_WIDTH || 1280);
  const height = Number(process.env.REC_HEIGHT || 800);
  // Playwright's headed contexts open their own windows, which ignore --kiosk, and Chromium will
  // not make a window narrower than ~500px. So the page gets an exact viewport inside a larger
  // window at 0,0 and the caller crops the X grab to the page area (REC_TOP = browser UI height).
  const browser = await launch(["--window-position=0,0", `--window-size=${Math.max(width, 600) + 20},${height + 140}`]);
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width <= 420,
    hasTouch: width <= 420,
  });
  const page = await context.newPage();
  if (kind === "wizard") {
    await page.goto(`${BASE}/borrower?fx=full`); await settle(page); await sleep(1500);
    await page.goto(`${BASE}/borrower/apply`); await settle(page); await sleep(1800);
    const next = page.locator("#next");
    for (let i = 0; i < 3; i += 1) { await next.click(); await sleep(1600); }
    await page.fill("#loan-amount", "250000"); await sleep(500);
    await page.selectOption("#loan-tenure", { index: 2 }).catch(() => {}); await sleep(500);
    await page.selectOption("#loan-purpose", { index: 1 }).catch(() => {}); await sleep(1200);
    await next.click(); await sleep(1500);
    await page.mouse.wheel(0, 600); await sleep(2000);
  } else {
    await page.goto(`${BASE}/borrower/assistant?application=${REJECTED}`);
    await settle(page);
    await page.waitForSelector(".composer", { timeout: 20000 });
    await sleep(1800);
    await ask(page, "Why was this decision made?");
    await sleep(1500);
    await waitAnswer(page, 1);
    await sleep(1800);
    await page.mouse.wheel(0, 500); await sleep(1500);
    await ask(page, "What if my credit score was 720?");
    await waitAnswer(page, 2);
    await sleep(2500);
    await ask(page, "Please simulate failure");
    await page.waitForSelector(".msg--error", { timeout: 30000 }).catch(() => {});
    await sleep(2500);
    await page.locator(".msg--error button", { hasText: "Retry" }).click().catch(() => {});
    await sleep(3000);
    await page.locator(".drawer-tab", { hasText: "History" }).first().click().catch(() => {});
    await sleep(2500);
  }
  await browser.close();
}

async function axe() {
  const { AxeBuilder } = require("@axe-core/playwright");
  const browser = await launch();
  const results = [];
  for (const width of [1280, 390]) {
    const context = await newContext(browser, width);
    const page = await context.newPage();
    const routes = [
      ["login", "/login"], ["dashboard", "/borrower?fx=full"], ["dashboard-empty", "/borrower?fx=empty"],
      ["apply", "/borrower/apply"], ["documents-empty", "/borrower/documents?fx=empty"],
      ["help", "/borrower/help?fx=full"],
      ["profile", "/borrower/profile"],
      ["documents", `/borrower/documents?name=${REJECTED}`],
      ["decision-rejected", `/borrower/application?name=${REJECTED}`],
      ["decision-approved", `/borrower/application?name=${APPROVED}`],
      ["decision-pending", `/borrower/application?name=${PENDING}`],
      ["assistant", `/borrower/assistant?application=${REJECTED}`],
    ];
    for (const [name, route] of routes) {
      await page.goto(BASE + route);
      await settle(page);
      if (name === "assistant") {
        await page.waitForSelector(".composer", { timeout: 20000 });
        await ask(page, "Why was this decision made?");
        await waitAnswer(page, 1);
        await ask(page, "Which policy source sets these limits?");
        await waitAnswer(page, 2);
        await page.locator(".source-chip summary").first().click().catch(() => {});
        await ask(page, "What if my credit score was 720?");
        await waitAnswer(page, 3);
      }
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const violations = result.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help,
        nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(" "), summary: n.failureSummary })),
      }));
      results.push({ width, name, violations, incomplete: result.incomplete.length });
      console.log(width, name, violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(" ") || "clean");
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "axe.json"), JSON.stringify(results, null, 2));
}

(async () => {
  if (MODE === "shots") await shots();
  else if (MODE === "before") await before();
  else if (MODE === "record-assistant") await record("assistant");
  else if (MODE === "record-wizard") await record("wizard");
  else if (MODE === "axe") await axe();
  if (log.length) fs.writeFileSync(path.join(OUT, `capture-${MODE}.json`), JSON.stringify(log, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
