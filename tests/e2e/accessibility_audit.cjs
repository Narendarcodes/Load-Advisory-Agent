#!/usr/bin/env node
/*
 * Dynamic accessibility audit of the borrower portal (WCAG 2.2 AA) — TEST-ONLY harness.
 *
 *   npm --prefix tests/e2e run a11y
 *
 * It signs in through the real Frappe login form (no auth bypass, no token injection), walks the
 * portal's own route matrix — the same view ids as tests/e2e/borrower_views.cjs — reaches the
 * meaningful states by interacting in the browser, and runs axe-core against the rendered document.
 *
 * Rules are selected by WCAG tag only; nothing is disabled, excluded or suppressed. Every run
 * records whether its state was actually reached, so an untested state can never look tested.
 * Every request that would change server state is declared to write_guard.cjs first; an undeclared
 * one is blocked before it reaches Frappe and the run exits non-zero with it listed. The AI advisory
 * states come from tests/e2e/agui_stub.cjs (deterministic, test-only: no model, no GPU). Start that
 * stub and the review stack first — see tests/e2e/README.md.
 *
 * Environment: BASE, BORROWER_EMAIL, BORROWER_PASSWORD, WIDTHS (default 1440,1280,1024,768,390),
 * STATE_WIDTHS (widths that also get the interactive states, default 1440,390), OUT.
 * Writes accessibility-results.json, accessibility-report.md, a screenshot per violating run and a
 * screenshot of every interactive state that was reached.
 */
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "review.demo@example.invalid";
const PASSWORD = process.env.BORROWER_PASSWORD || "LoanReview!2026Demo";
const APPLICATION = process.env.APPLICATION || "ACC-LOAP-2026-00018";
const SUBMITTED = process.env.SUBMITTED_APPLICATION || "ACC-LOAP-2026-00019";
const WIDTHS = (process.env.WIDTHS || "1440,1280,1024,768,390").split(",").map(Number);
const STATE_WIDTHS = (process.env.STATE_WIDTHS || "1440,390").split(",").map(Number);
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01", "accessibility");

// WCAG 2.2 AA target: the 2.0/2.1 AA tags plus the 2.2-specific ones axe 4.14 exposes.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function pkgVersion(name) {
  try {
    return JSON.parse(readFileSync(path.join(__dirname, "node_modules", name, "package.json"), "utf8")).version;
  } catch {
    return "unknown";
  }
}

const nowIso = () => new Date().toISOString();

async function settle(page, ms = 900) {
  await page.waitForLoadState("load");
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(ms);
}

/** Validation and failure messages the portal actually shows. Deliberately narrow: static info and
 *  warning banners on these pages use `.alert`/`.alert--info`, which must not be mistaken for a
 *  validation error and reported as a reached error state. */
async function visibleErrors(page) {
  return page.evaluate(() => {
    const found = [];
    const shown = (el) => {
      if (!el || el.hidden) return false;
      if (el.classList && el.classList.contains("hidden")) return false;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
    };
    const name = (el) => (el.id ? `#${el.id}` : el.tagName.toLowerCase() + "." + String(el.className || "").trim().split(/\s+/).join("."));
    for (const el of document.querySelectorAll(".error, .alert--error")) {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (shown(el) && text) found.push({ sel: name(el), kind: "message", text: text.slice(0, 120) });
    }
    for (const el of document.querySelectorAll("[role=alert]")) {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (shown(el) && text) found.push({ sel: name(el), kind: "alert", text: text.slice(0, 120) });
    }
    for (const el of document.querySelectorAll("[aria-invalid=true]")) {
      if (shown(el)) found.push({ sel: name(el), kind: "aria-invalid", text: (el.name || el.id || "").slice(0, 60) });
    }
    return found;
  });
}

async function clickAndWait(page, selector, ms = 700) {
  await page.click(selector);
  await page.waitForTimeout(ms);
  const errors = await visibleErrors(page);
  const messages = errors.filter((e) => e.kind !== "aria-invalid");
  return {
    reached: messages.length > 0,
    note: messages.length
      ? messages.map((e) => `${e.kind} ${e.sel}: ${e.text}`).join(" | ").slice(0, 300)
      : `clicked ${selector}, no visible validation or error message appeared (aria-invalid: ${errors.filter((e) => e.kind === "aria-invalid").length})`,
  };
}

async function ask(page, question, waitFor, timeout = 20000) {
  await page.waitForSelector("#question:not([disabled])", { timeout: 45000 });
  await page.fill("#question", question);
  await page.click('.chat form.row button[type="submit"]');
  if (waitFor) await page.waitForSelector(waitFor, { timeout });
}

const GUEST_VIEWS = [
  {
    id: "01-landing-products",
    label: "Public loan products (landing)",
    url: "/borrower/products",
  },
  {
    id: "02-sign-in",
    label: "Sign in",
    url: "/login?redirect-to=%2Fborrower",
    states: [
      {
        id: "form-validation",
        label: "Empty sign-in submission shows the inline error",
        prepare: (page) => clickAndWait(page, "#login-button"),
      },
    ],
  },
  {
    id: "17-invite-unavailable",
    label: "Invitation link (unavailable state)",
    url: "/borrower/invite",
  },
];

const AUTH_VIEWS = [
  { id: "03-dashboard", label: "Borrower dashboard", url: "/borrower" },
  {
    id: "04-eligibility",
    label: "Indicative eligibility (empty + validation)",
    url: "/borrower/eligibility",
    states: [
      {
        id: "form-validation",
        label: "Required income left blank",
        prepare: async (page) => {
          await page.fill("#el-income", "");
          return clickAndWait(page, "#el-submit");
        },
      },
    ],
  },
  {
    id: "05-apply",
    label: "Application wizard (locked steps + validation)",
    url: "/borrower/apply",
    states: [
      {
        id: "form-validation",
        label: "Step 1 with the name left blank",
        prepare: async (page) => {
          // An empty name is stopped by the wizard's own rule before it can ask the server for
          // anything. A long name is not: `#about-name` carries maxlength=140, so the field can
          // never hold more than the limit, validation passes, and Continue posts the step to the
          // profile — a write. The first run of the write guard caught exactly that request
          // (see harness-write-guards.md), which is why this state asks for the blank case instead.
          await page.fill("#about-name", "");
          return clickAndWait(page, "#next");
        },
      },
    ],
  },
  {
    id: "06-kyc-workspace",
    label: "Identity (KYC) workspace (preview state)",
    url: "/borrower/kyc",
    states: [
      {
        id: "form-validation",
        label: "Malformed PAN in the preview",
        prepare: async (page) => {
          await page.fill("#kyc-pan-input", "12345");
          return clickAndWait(page, "#kyc-preview-next");
        },
      },
    ],
  },
  {
    id: "07-documents-empty",
    label: "Documents workspace (empty state)",
    url: `/borrower/documents?name=${SUBMITTED}`,
  },
  { id: "08-application-submitted", label: "Application tracker (submitted)", url: `/borrower/application?name=${SUBMITTED}` },
  { id: "09-application-not-approved", label: "Recorded decision (not approved)", url: `/borrower/application?name=${APPLICATION}` },
  {
    id: "10-advisory-workspace",
    label: "AI advisory workspace",
    url: `/borrower/assistant?application=${APPLICATION}`,
    settle: 3500,
    states: [
      {
        id: "loading-progress",
        label: "Progress stage card visible while the run is in flight",
        prepare: async (page) => {
          await page.waitForSelector("#question:not([disabled])", { timeout: 45000 });
          await page.fill("#question", "Take it slow: what information is missing from my application?");
          await page.click('.chat form.row button[type="submit"]');
          await page.waitForSelector(".chat .progress", { timeout: 15000 });
          const busy = await page.evaluate(() => ({
            progress: document.querySelectorAll(".chat .progress").length,
            inputDisabled: document.querySelector("#question")?.hasAttribute("disabled") ?? false,
            statusAnnounced: document.querySelectorAll('.chat p[role=status]').length,
          }));
          return {
            reached: busy.progress > 0,
            note: `progress cards=${busy.progress}, composer disabled=${busy.inputDisabled}, role=status nodes=${busy.statusAnnounced}`,
          };
        },
      },
      {
        id: "missing-info-card",
        label: "Missing Information GenUI card",
        prepare: (page) => ask(page, "What information is missing from my application?", ".missing").then(() => ({
          reached: true,
          note: "card rendered by the real registry",
        })),
      },
      {
        id: "citations-response",
        label: "Assistant answer with policy citations",
        prepare: (page) =>
          ask(page, "Which policy source supports this rule? show the citation", ".cites").then(() => ({
            reached: true,
            note: "sources block rendered",
          })),
      },
      {
        id: "error-alert",
        label: "Upstream failure surfaced as an alert",
        prepare: (page) =>
          ask(page, "Simulate an upstream failure.", ".chat .error[role=alert]").then(() => ({
            reached: true,
            note: "RUN_ERROR rendered as role=alert",
          })),
      },
    ],
  },
  { id: "11-servicing", label: "Repayments (demo fixture, disabled actions)", url: "/borrower/servicing" },
  { id: "12-profile", label: "Profile and consents", url: "/borrower/profile" },
  { id: "13-help", label: "Help", url: "/borrower/help" },
  {
    id: "14-feedback",
    label: "Feedback (empty form + validation)",
    url: "/borrower/feedback",
    states: [
      {
        id: "form-validation",
        label: "Send with no rating and no message",
        prepare: (page) => clickAndWait(page, "#send"),
      },
    ],
  },
  { id: "15-terms", label: "Terms of use", url: "/borrower/terms" },
  { id: "16-privacy", label: "Privacy notice", url: "/borrower/privacy" },
];

async function login(page) {
  await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load", timeout: 45000 });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click("#login-button");
  await page.waitForURL("**/borrower", { timeout: 45000 });
}

async function auditRun(page, run) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const violations = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact ?? "unknown",
    help: v.help,
    url: v.helpUrl,
    nodes: v.nodes.map((n) => ({
      target: n.target.join(" "),
      html: String(n.html).slice(0, 240),
      failureSummary: String(n.failureSummary || "").replace(/\s+/g, " ").slice(0, 300),
    })),
  }));
  // axe cannot always decide (overlapping backgrounds, images). Those are reported for manual
  // review rather than counted as passes.
  const incompleteNodes = results.incomplete.flatMap((i) =>
    i.nodes.slice(0, 6).map((n) => ({
      rule: i.id,
      target: n.target.join(" "),
      html: String(n.html).slice(0, 160),
      reason: String(n.any?.[0]?.reason ?? n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 200),
    })),
  );
  const record = {
    at: nowIso(),
    ...run,
    violations,
    violationNodeCount: violations.reduce((sum, v) => sum + v.nodes.length, 0),
    passes: results.passes.length,
    incomplete: results.incomplete.map((i) => i.id),
    incompleteNodes,
    inapplicable: results.inapplicable.length,
  };
  if (violations.length) {
    const file = path.join(OUT, "violations", `${run.width}-${run.view}-${run.state}.png`);
    mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
    record.screenshot = file.replace(/\\/g, "/");
  }
  // Visual proof that an interactive state was really on screen when it was audited. The default
  // views are covered by the responsive matrix; only the states need their own image evidence.
  if (run.state !== "default") {
    const dir = path.join(OUT, "states", `${run.width}`);
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${run.view}-${run.state}.png`);
    await page.screenshot({ path: file, fullPage: true });
    record.stateScreenshot = file.replace(/\\/g, "/");
  }
  return record;
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const runs = [];
  const consoleErrors = [];
  const failedRequests = [];
  const guards = [];

  for (const width of WIDTHS) {
    const contexts = [
      { kind: "guest", views: GUEST_VIEWS, authed: false },
      { kind: "authed", views: AUTH_VIEWS, authed: true },
    ];
    for (const { kind, views, authed } of contexts) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      // Declared before the first navigation: an unannounced write is a finding, not a detail.
      const guard = createWriteGuard({ label: `${width}/${kind}`, assistant: authed });
      await guard.attach(page);
      guards.push(guard);
      page.on("console", (m) => m.type() === "error" && consoleErrors.push({ width, kind, text: m.text().slice(0, 200) }));
      page.on("pageerror", (e) => consoleErrors.push({ width, kind, text: String(e.message).slice(0, 200) }));
      page.on("response", (r) =>
        r.status() >= 400 ? failedRequests.push({ width, kind, status: r.status(), url: r.url() }) : undefined,
      );
      if (authed) await login(page);

      for (const view of views) {
        const passes = [{ state: "default", label: "default render" }];
        if (view.states && STATE_WIDTHS.includes(width)) {
          for (const state of view.states) passes.push(state);
        }
        for (const pass of passes) {
          await page.goto(`${BASE}${view.url}`, { waitUntil: "load", timeout: 45000 });
          await settle(page, view.settle || 900);
          let reached = true;
          let note = "";
          if (pass.id) {
            try {
              const outcome = await pass.prepare(page);
              reached = outcome.reached;
              note = outcome.note;
              await page.waitForTimeout(150);
            } catch (error) {
              reached = false;
              note = `state could not be reached: ${String(error.message).slice(0, 160)}`;
            }
          }
          runs.push(
            await auditRun(page, {
              width,
              kind,
              view: view.id,
              viewLabel: view.label,
              url: view.url,
              state: pass.id || "default",
              stateLabel: pass.label,
              reached,
              note,
            }),
          );
        }
      }
      await context.close();
    }
    console.log(`width ${width}: ${runs.filter((r) => r.width === width).length} runs`);
  }

  await browser.close();

  const result = {
    capturedAt: nowIso(),
    base: BASE,
    authentication: "real Frappe login form (session cookie + CSRF); no auth bypass",
    target: "WCAG 2.2 AA",
    tags: TAGS,
    versions: { playwright: pkgVersion("playwright"), axe_playwright: pkgVersion("@axe-core/playwright"), axe_core: pkgVersion("axe-core") },
    suppressions: "none: no rules disabled, no includes/excludes, no overrides",
    widths: WIDTHS,
    stateWidths: STATE_WIDTHS,
    fixture: "tests/e2e/agui_stub.cjs (deterministic, test-only) for the advisory states",
    writeGuard: guards.map((g) => g.summary()),
    runs,
    consoleErrors,
    failedRequests: [...new Map(failedRequests.map((f) => [`${f.status}|${f.url}`, f])).values()],
  };
  writeFileSync(path.join(OUT, "accessibility-results.json"), JSON.stringify(result, null, 2));

  const violated = runs.filter((r) => r.violations.length);
  const unique = new Map();
  for (const run of violated) {
    for (const v of run.violations) {
      const key = `${v.rule}|${v.help}`;
      if (!unique.has(key)) unique.set(key, { ...v, occurrences: 0, where: [] });
      const entry = unique.get(key);
      entry.occurrences += v.nodes.length;
      entry.where.push(`${run.view}/${run.state}@${run.width}`);
    }
  }
  const lines = [
    "# Accessibility audit — borrower portal",
    "",
    `- Captured: ${result.capturedAt}`,
    `- Target: ${result.target}; tags: ${TAGS.join(", ")}`,
    `- axe-core ${result.versions.axe_core} via @axe-core/playwright ${result.versions.axe_playwright}; Playwright ${result.versions.playwright}`,
    `- Runs: ${runs.length} across widths ${WIDTHS.join(", ")}; states at ${STATE_WIDTHS.join(", ")}`,
    `- Suppressions: ${result.suppressions}`,
    `- Console errors during the audit: ${consoleErrors.length}`,
    "",
    `## Violations (${violated.length} runs, ${unique.size} distinct rules)`,
    "",
    "| Rule | Impact | Nodes | Help | Seen in (view/state@width) |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const entry of [...unique.values()].sort((a, b) => b.occurrences - a.occurrences)) {
    lines.push(
      `| ${entry.rule} | ${entry.impact} | ${entry.occurrences} | ${entry.help} | ${entry.where.slice(0, 6).join(", ")}${entry.where.length > 6 ? ` (+${entry.where.length - 6})` : ""} |`,
    );
  }
  if (!unique.size) lines.push("| — | — | — | no violations reported | |");
  lines.push("", "## States recorded as NOT reached in the browser", "");
  const missed = runs.filter((r) => !r.reached);
  for (const run of missed) lines.push(`- ${run.view}/${run.state}@${run.width}: ${run.note}`);
  if (!missed.length) lines.push("- none: every requested state was reached before it was audited");
  lines.push("", "## axe checks needing manual review (incomplete)", "");
  const incomplete = new Map();
  for (const run of runs) {
    for (const id of run.incomplete) incomplete.set(id, (incomplete.get(id) || 0) + 1);
  }
  for (const [id, count] of incomplete) lines.push(`- ${id}: ${count} runs`);
  if (!incomplete.size) lines.push("- none");
  const seen = new Set();
  const reviewRows = [];
  for (const run of runs) {
    for (const n of run.incompleteNodes || []) {
      const key = `${n.rule}|${n.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reviewRows.push(`| ${n.rule} | ${n.target} | ${String(n.html).replace(/\|/g, "\\|").slice(0, 90)} | ${run.view}/${run.state}@${run.width} |`);
    }
  }
  if (reviewRows.length) {
    lines.push("", "### Distinct nodes axe could not decide", "", "| Rule | Selector | Markup | First seen |", "| --- | --- | --- | --- |", ...reviewRows);
  }
  const failed = result.failedRequests;
  lines.push("", "## Failed HTTP responses during the audit", "");
  for (const f of failed) lines.push(`- ${f.status} ${f.url}`);
  if (!failed.length) lines.push("- none");

  const unexpectedWrites = guards.flatMap((g) => g.blocked());
  lines.push("", "## Mutating requests during the audit", "");
  lines.push(
    "A read-only run declares the calls a session cannot exist without (sign-in, sign-out, CSRF) and, for the advisory workspace, the calls that carry its own turn. Anything else was blocked before it reached Frappe.",
  );
  lines.push("");
  lines.push("| Run | Posted reads passed | Writes allowed | Writes blocked |");
  lines.push("| --- | --- | --- | --- |");
  for (const summary of result.writeGuard) {
    lines.push(
      `| ${summary.label} | ${summary.postedReads} | ${summary.writesAllowed} (${summary.byPath.map((a) => `${a.times}x ${a.request}`).join(", ") || "none"}) | ${summary.writesBlocked} |`,
    );
  }
  for (const record of unexpectedWrites) {
    lines.push(`- BLOCKED ${record.method} ${record.path} [${record.label}]: ${record.reason}`);
  }
  writeFileSync(path.join(OUT, "accessibility-report.md"), lines.join("\n") + "\n");

  console.log(`runs: ${runs.length}`);
  console.log(`runs with violations: ${violated.length}`);
  console.log(`distinct rules: ${unique.size}`);
  console.log(`states not reached: ${missed.length}`);
  console.log(`console errors: ${consoleErrors.length}`);
  console.log(`non-read requests: writes allowed ${guards.reduce((s, g) => s + g.summary().writesAllowed, 0)}, blocked ${unexpectedWrites.length}`);
  for (const record of unexpectedWrites) {
    console.log(`  UNEXPECTED ${record.decision} ${record.method} ${record.path} [${record.label}]`);
  }
  if (unexpectedWrites.length) {
    console.error("read-only audit attempted undeclared writes; results written, exiting non-zero");
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error("accessibility audit failed:", error);
  process.exit(1);
});
