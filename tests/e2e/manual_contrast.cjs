#!/usr/bin/env node
/*
 * Independent contrast check for the nodes axe-core leaves undetermined (its "incomplete" list).
 * TEST-ONLY harness — axe cannot decide text over images, selects and layered backgrounds, so this
 * recomputes the WCAG ratio from the rendered styles instead of assuming a pass: foreground is the
 * computed colour, background is the first opaque ancestor, and anything with a background-image in
 * its chain is reported as indeterminate rather than guessed.
 *
 *   npm --prefix tests/e2e run contrast
 *
 * Writes manual-contrast.json next to the audit results and prints every node below AA.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "review.demo@example.invalid";
const PASSWORD = process.env.BORROWER_PASSWORD || "LoanReview!2026Demo";
const WIDTHS = (process.env.WIDTHS || "1440,390").split(",").map(Number);
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01", "accessibility");

const VIEWS = [
  { id: "01-landing-products", url: "/borrower/products", guest: true },
  { id: "02-sign-in", url: "/login?redirect-to=%2Fborrower", guest: true },
  { id: "04-eligibility", url: "/borrower/eligibility" },
  { id: "05-apply", url: "/borrower/apply" },
  { id: "06-kyc-workspace", url: "/borrower/kyc" },
  { id: "08-application-submitted", url: "/borrower/application?name=ACC-LOAP-2026-00019" },
  { id: "09-application-not-approved", url: "/borrower/application?name=ACC-LOAP-2026-00018" },
  { id: "10-advisory-workspace", url: "/borrower/assistant?application=ACC-LOAP-2026-00018", settle: 3500 },
  { id: "12-profile", url: "/borrower/profile" },
  { id: "14-feedback", url: "/borrower/feedback" },
];

const PROBE = () => {
  const parse = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const sel = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).join(".") : "");

  const out = { fails: [], indeterminate: [], card: [], checked: 0, tightest: null };
  const rootBg = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
    // only elements that paint text directly
    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length).length
      ? el.textContent.trim()
      : "";
    if (!text) continue;
    const fg = parse(style.color);
    if (!fg) continue;
    out.checked++;
    let bg = null;
    let overImage = false;
    for (let node = el; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") overImage = true;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.95) {
        bg = c;
        break;
      }
    }
    if (!bg) bg = rootBg;
    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && weight);
    const required = large ? 3 : 4.5;
    if (overImage) {
      out.indeterminate.push({ sel: sel(el), text: text.slice(0, 40), reason: "background-image in the ancestor chain" });
      if (el.closest(".identity-card")) {
        out.card.push({ sel: sel(el), text: text.slice(0, 40), fg: style.color, bg: null, required, measurable: false, reason: "background-image in the ancestor chain" });
      }
      continue;
    }
    const r = ratio(fg, bg);
    if (el.closest(".identity-card")) {
      // The identity card is the component whose background used to be a gradient, so every text
      // node inside it is reported with its own numbers rather than folded into a summary count.
      out.card.push({
        sel: sel(el),
        text: text.slice(0, 40),
        fg: style.color,
        bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
        ratio: Number(r.toFixed(2)),
        required,
        size,
        weight,
        pass: r >= required,
      });
    }
    if (r < required) {
      out.fails.push({
        sel: sel(el),
        text: text.slice(0, 40),
        ratio: Number(r.toFixed(2)),
        required,
        fg: style.color,
        bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
        size,
        weight,
      });
    } else if (!out.tightest || r < out.tightest.ratio) {
      // recorded so a "0 fails" result cannot hide a pass with no margin
      out.tightest = { sel: sel(el), text: text.slice(0, 40), ratio: Number(r.toFixed(2)), required, size, weight };
    }
  }
  return out;
};

(async () => {
  const browser = await chromium.launch();
  const summary = [];
  const guards = [];
  for (const width of WIDTHS) {
    for (const view of VIEWS) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      // Nothing in a contrast measurement should change server state, so no assistant writes are
      // declared here either: the island is rendered, never asked a question.
      const guard = createWriteGuard({ label: `${width}/${view.id}` });
      await guard.attach(page);
      guards.push(guard);
      if (!view.guest) {
        await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load" });
        await page.fill("#email", EMAIL);
        await page.fill("#password", PASSWORD);
        await page.click("#login-button");
        await page.waitForURL("**/borrower", { timeout: 45000 });
      }
      await page.goto(`${BASE}${view.url}`, { waitUntil: "load" });
      await page.waitForLoadState("load");
      await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
      await page.waitForTimeout(view.settle || 1200);
      const r = await page.evaluate(PROBE);
      summary.push({
        width,
        view: view.id,
        checked: r.checked,
        fails: r.fails,
        indeterminateCount: r.indeterminate.length,
        indeterminate: r.indeterminate,
        card: r.card,
        tightest: r.tightest,
      });
      console.log(
        `${String(width).padStart(4)} ${view.id.padEnd(26)} text nodes=${String(r.checked).padStart(4)} fails=${r.fails.length} indeterminate=${r.indeterminate.length}`,
      );
      for (const f of r.fails.slice(0, 12)) console.log(`      FAIL ${f.sel} "${f.text}" ${f.ratio}:1 (need ${f.required}) ${f.fg} on ${f.bg} @${f.size}px w${f.weight ? "700" : "400"}`);
      for (const c of r.card) {
        console.log(
          c.measurable === false
            ? `      CARD ${c.sel} "${c.text}" ${c.reason} (need ${c.required})`
            : `      CARD ${c.sel} "${c.text}" ${c.ratio}:1 (need ${c.required}) ${c.fg} on ${c.bg} @${c.size}px w${c.weight ? "700" : "400"} ${c.pass ? "pass" : "FAIL"}`,
        );
      }
      await context.close();
    }
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "manual-contrast.json"),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        base: BASE,
        widths: WIDTHS,
        method: "computed foreground against first opaque ancestor; background-image chains reported indeterminate",
        playwright: require("playwright/package.json").version,
        writeGuard: guards.map((g) => g.summary()),
        runs: summary,
      },
      null,
      2,
    ),
  );
  const total = summary.reduce((s, r) => s + r.fails.length, 0);
  const indeterminate = summary.reduce((s, r) => s + r.indeterminateCount, 0);
  const cardNodes = summary.flatMap((r) => r.card);
  const cardUnmeasured = cardNodes.filter((c) => c.measurable === false).length;
  const cardFailing = cardNodes.filter((c) => c.measurable !== false && !c.pass).length;
  const tightest = summary
    .filter((r) => r.tightest)
    .reduce((a, r) => (r.tightest.ratio < a.ratio ? { ...r.tightest, width: r.width, view: r.view } : a), { ratio: Infinity });
  console.log(`text nodes below AA across runs: ${total}; indeterminate: ${indeterminate}`);
  console.log(`tightest passing measurement: ${tightest.ratio}:1 (need ${tightest.required}) at ${tightest.sel} "${tightest.text}" [${tightest.width} ${tightest.view}]`);
  console.log(`identity-card text nodes: ${cardNodes.length} measured, ${cardFailing} below AA, ${cardUnmeasured} still unmeasurable`);
  console.log(`wrote ${path.join(OUT, "manual-contrast.json")}`);
  await browser.close();
  const unexpectedWrites = guards.flatMap((g) => g.blocked());
  console.log(`non-read requests: writes allowed ${guards.reduce((s, g) => s + g.summary().writesAllowed, 0)}, blocked ${unexpectedWrites.length}`);
  for (const record of unexpectedWrites) {
    console.log(`  UNEXPECTED ${record.decision} ${record.method} ${record.path} [${record.label}]`);
  }
  if (unexpectedWrites.length) {
    console.error("read-only contrast run attempted undeclared writes");
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error("manual contrast check failed:", e);
  process.exit(1);
});
