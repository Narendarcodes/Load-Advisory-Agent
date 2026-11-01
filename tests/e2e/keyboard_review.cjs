#!/usr/bin/env node
/*
 * Keyboard and accessibility-tree review (test-only).
 *
 *   npm --prefix tests/e2e run keyboard
 *
 * axe answers "does the markup satisfy the rules". It cannot answer what a keyboard user actually
 * meets, so this walks the real Tab order of each page, checks that every stop is visible and named,
 * reads the accessibility tree Chromium computes (landmarks, headings, unnamed controls, live
 * regions), activates controls with Enter and Space, follows what happens to focus after a
 * validation error, looks for dismissible overlays and their Escape behaviour, and measures how much
 * motion the page still runs under `prefers-reduced-motion: reduce`.
 * No screen reader is installed on this machine, so nothing here is a screen-reader test: it is a
 * DOM/accessibility-tree review and is reported as such.
 *
 * Nothing here writes borrower data: the activation checks use the sign-in form with empty fields
 * (client-side validation, no POST) and a GET navigation link.
 *
 * Environment: BASE, BORROWER_EMAIL, BORROWER_PASSWORD, WIDTHS (default all five), OUT.
 */
const { chromium } = require("playwright");
const { mkdirSync, writeFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const { createWriteGuard } = require("./write_guard.cjs");

const BASE = process.env.BASE || "http://127.0.0.1:8081";
const EMAIL = process.env.BORROWER_EMAIL || "review.demo@example.invalid";
const PASSWORD = process.env.BORROWER_PASSWORD || "LoanReview!2026Demo";
const APPLICATION = process.env.APPLICATION || "ACC-LOAP-2026-00018";
const WIDTHS = (process.env.WIDTHS || "1440,1280,1024,768,390").split(",").map(Number);
const MAX_STOPS = Number(process.env.MAX_STOPS || 45);
const OUT =
  process.env.OUT ||
  path.join(__dirname, "..", "..", "docs", "borrower-frontend", "acceptance", "2026-11-01", "accessibility");

/**
 * What assistive technology is actually on this machine right now, stated as a fact rather than as a
 * fixed sentence. This harness runs headless with no AT attached, so it produces no screen-reader
 * result either way — the line exists so the evidence cannot imply an older machine state.
 */
function screenReaderState() {
  const roots = [process.env.LOCALAPPDATA, process.env.ProgramFiles, process["ProgramFiles(x86)"]]
    .filter(Boolean)
    .map((root) => path.join(root, "NVDA"));
  const installed = roots.filter((candidate) => existsSync(candidate));
  const running = installed.length > 0 && /nvda/i.test(String(process.env.NVDA_RUNNING || ""));
  if (installed.length) {
    return `NVDA is installed at ${installed.join(", ")} but not running in this session; this harness is headless and performs no screen-reader session regardless — keyboard reachability and the accessibility tree are not spoken output`;
  }
  return `no NVDA install directory or running process detected (${running ? "reported running" : "not running"}); this harness performs no screen-reader session — keyboard reachability and the accessibility tree are not spoken output`;
}

const VIEWS = [
  { id: "02-sign-in", url: "/login?redirect-to=%2Fborrower", guest: true },
  { id: "03-dashboard", url: "/borrower" },
  { id: "05-apply", url: "/borrower/apply" },
  { id: "07-documents", url: `/borrower/documents?name=${APPLICATION}` },
  { id: "09-application-not-approved", url: `/borrower/application?name=${APPLICATION}` },
  { id: "10-advisory-workspace", url: `/borrower/assistant?application=${APPLICATION}`, settle: 3500, ask: "What information is missing from my application?", waitFor: ".missing" },
];

const guards = [];

/** Attach the write guard to a fresh page so an undeclared mutating request is blocked, not trusted. */
async function guardPage(page, label, assistant) {
  const guard = createWriteGuard({ label, assistant });
  await guard.attach(page);
  guards.push(guard);
  return guard;
}

async function login(page) {
  await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load", timeout: 45000 });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click("#login-button");
  await page.waitForURL("**/borrower", { timeout: 45000 });
}

/** One Tab stop described the way a keyboard user experiences it. */
const STOP_PROBE = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const name =
    el.getAttribute("aria-label") ||
    (el.labels && el.labels.length ? el.labels[0].textContent.trim() : "") ||
    (el.getAttribute("aria-labelledby")
      ? String(el.getAttribute("aria-labelledby"))
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent.trim() || "")
          .join(" ")
      : "") ||
    (el.tagName === "IMG" ? el.getAttribute("alt") || "" : "") ||
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el.placeholder || el.value || "" : "") ||
    (el.textContent || "").replace(/\s+/g, " ").trim() ||
    el.getAttribute("title") ||
    "";
  // Node identity, not label text: a page can hold two controls with the same name and Tab must
  // reach both. A second visit to the same node is what a focus trap looks like.
  const seen = el.getAttribute("data-acc-key");
  let key = seen;
  if (key === null) {
    key = String(Number(document.documentElement.dataset.accCount || 0));
    document.documentElement.dataset.accCount = String(Number(key) + 1);
    el.setAttribute("data-acc-key", key);
  }
  return {
    key,
    repeated: seen !== null,
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    cls: typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] || null : null,
    role: el.getAttribute("role") || null,
    name: name.slice(0, 70),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    inViewport: rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0,
    tabIndex: el.getAttribute("tabindex"),
    whileFocused: {
      outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      boxShadow: style.boxShadow === "none" ? "" : style.boxShadow.slice(0, 80),
    },
  };
};

/**
 * A computed style alone cannot prove a focus indicator exists: the same outline may be on the
 * element when it is not focused. So each stop is measured unfocused, then focused, and only a
 * difference in the focus-bearing properties counts as a visible indicator. The walk reached these
 * elements with real Tab presses, so Chromium's `:focus-visible` heuristic still applies here.
 */
const FOCUS_PROBE = () => {
  const doc = document.documentElement;
  document.activeElement?.blur();
  const read = (el) => {
    const s = getComputedStyle(el);
    return {
      outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
      boxShadow: s.boxShadow === "none" ? "" : s.boxShadow.slice(0, 80),
    };
  };
  const out = {};
  for (const el of [...document.querySelectorAll("[data-acc-key]")]) {
    const before = read(el);
    el.focus({ preventScroll: true });
    const after = read(el);
    out[el.getAttribute("data-acc-key")] = {
      focusableProgrammatically: document.activeElement === el,
      hasVisibleChange: JSON.stringify(before) !== JSON.stringify(after),
      unfocused: before,
      focused: after,
    };
    el.removeAttribute("data-acc-key");
  }
  document.activeElement?.blur();
  for (const el of [...document.querySelectorAll("[data-acc-key]")]) el.removeAttribute("data-acc-key");
  doc.dataset.accCount = "0";
  return out;
};

/** What Chromium hands to an assistive technology. */
const TREE_PROBE = () => {
  const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const landmarks = [...document.querySelectorAll("main, nav, header, footer, aside, form, section[aria-labelledby], section[aria-label]")]
    .map((el) => el.tagName.toLowerCase() + (el.className ? "." + String(el.className).trim().split(/\s+/)[0] : ""));
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((el) => ({ level: Number(el.tagName[1]), text: text(el) }));
  const unnamed = [...document.querySelectorAll("a, button, input, select, textarea, [role=button]")]
    .filter((el) => {
      if (el.type === "hidden") return false;
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return false;
      const label =
        el.getAttribute("aria-label") ||
        (el.labels && el.labels.length ? el.labels[0].textContent : "") ||
        (el.getAttribute("aria-labelledby") ? "x" : "") ||
        (el.tagName === "IMG" ? el.alt : "") ||
        text(el) ||
        el.getAttribute("title") ||
        (el.tagName === "INPUT" ? el.placeholder || el.value : "");
      return !String(label).trim();
    })
    .map((el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className ? "." + String(el.className).trim().split(/\s+/)[0] : ""));
  const imagesWithoutAlt = [...document.querySelectorAll("img")].filter((img) => !img.hasAttribute("alt")).length;
  const live = [...document.querySelectorAll("[aria-live], [role=status], [role=alert], progress, meter")].map(
    (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} role=${el.getAttribute("role") || ""} live=${el.getAttribute("aria-live") || ""}`,
  );
  const lang = document.documentElement.lang || null;
  const skip = [...document.querySelectorAll("a[href^='#']")].slice(0, 3).map((a) => ({ href: a.getAttribute("href"), text: text(a) }));
  return { landmarks, headings, unnamed, imagesWithoutAlt, live, lang, skip };
};

/** Overlays, name/description references and the motion the page still runs. */
const EXTRA_PROBE = () => {
  const sel = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
  const dialogs = [
    ...document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], .modal, .sheet, [data-dialog]'),
  ].map((el) => ({
    sel: sel(el),
    role: el.getAttribute("role") || el.tagName.toLowerCase(),
    focusableInside: [...el.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")].length,
  }));
  const dangling = [];
  const resolved = [];
  for (const el of document.querySelectorAll("[aria-describedby], [aria-labelledby], [aria-controls]")) {
    for (const attr of ["aria-describedby", "aria-labelledby", "aria-controls"]) {
      for (const id of String(el.getAttribute(attr) || "")
        .split(/\s+/)
        .filter(Boolean)) {
        const target = document.getElementById(id);
        if (!target) dangling.push({ sel: sel(el), attr, missing: id });
        else if (attr !== "aria-controls") resolved.push({ sel: sel(el), attr, text: (target.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70) });
      }
    }
  }
  const animated = [...document.querySelectorAll("body *")].filter((el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    const duration = (parseFloat(s.transitionDuration) || 0) + (parseFloat(s.animationDuration) || 0);
    return duration > 0.05 || s.animationName !== "none";
  }).length;
  return {
    dialogs,
    danglingReferences: dangling,
    resolvedDescriptions: resolved,
    reducedMotionMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    animatedNodes: animated,
  };
};

/** Where focus sits and what is announced after a keyboard activation. */
const FOCUS_STATE = () => {
  const el = document.activeElement;
  const err = document.querySelector("#login-error");
  return {
    activeElement: el ? el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className ? "." + String(el.className).trim().split(/\s+/)[0] : "") : null,
    alertHidden: err ? err.hasAttribute("hidden") : null,
    alertRole: err ? err.getAttribute("role") : null,
    alertText: err ? (err.textContent || "").trim().slice(0, 90) : null,
    alertInDomOrderAfterTrigger: Boolean(err && el && el.compareDocumentPosition(err) & Node.DOCUMENT_POSITION_FOLLOWING),
  };
};

/**
 * Enter and Space on the control a borrower actually uses, and what the page does with focus
 * afterwards. The sign-in form is submitted with empty fields, so only client-side validation runs;
 * the navigation check follows a plain GET link.
 */
async function activationChecks(browser) {
  const out = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  await guardPage(page, "activation checks", false);
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));

  for (const key of ["Enter", "Space"]) {
    await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(600);
    const before = await page.evaluate(FOCUS_STATE);
    await page.focus("#login-button");
    await page.keyboard.press(key);
    await page.waitForTimeout(700);
    const after = await page.evaluate(FOCUS_STATE);
    out.push({
      check: `sign-in button activated with ${key}`,
      alertBefore: before.alertHidden === false,
      alertAfter: after.alertHidden === false,
      announcedViaRole: after.alertRole,
      message: after.alertText,
      focusBeforeActivation: before.activeElement,
      focusAfterError: after.activeElement,
      errorFollowsTriggerInDom: after.alertInDomOrderAfterTrigger,
      url: page.url().replace(BASE, ""),
    });
  }

  // a real sign-in, then keyboard navigation out of the dashboard through a normal link
  await login(page);
  const nav = await page.evaluate(() => {
    const here = location.pathname;
    const link = [...document.querySelectorAll("nav a[href]")].find((a) => a.getAttribute("href").split("#")[0] && a.pathname !== here);
    if (!link) return null;
    link.setAttribute("data-acc-nav", "1");
    return { href: link.getAttribute("href"), text: (link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60), from: here };
  });
  if (nav) {
    await page.focus('[data-acc-nav="1"]');
    await page.keyboard.press("Enter");
    await page.waitForLoadState("load");
    await page.waitForTimeout(900);
    out.push({
      check: "dashboard navigation link activated with Enter",
      link: nav.text,
      from: nav.from,
      to: page.url().replace(BASE, ""),
      navigated: page.url().replace(BASE, "") !== nav.from,
    });
  } else {
    out.push({ check: "dashboard navigation link activated with Enter", navigated: false, note: "no distinct navigation link found to focus" });
  }
  out.push({ check: "page errors during activation checks", pageErrors: errors });
  await context.close();
  return out;
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const width of WIDTHS) {
    for (const view of VIEWS) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      // Only the advisory view asks a question, so only there are the turn's own writes declared.
      await guardPage(page, `${width}/${view.id}`, Boolean(view.ask));
      page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
      if (!view.guest) await login(page);
      await page.goto(`${BASE}${view.url}`, { waitUntil: "load", timeout: 45000 });
      await page.waitForLoadState("load");
      await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
      await page.waitForTimeout(view.settle || 1200);
      if (view.ask) {
        await page.waitForSelector("#question:not([disabled])", { timeout: 45000 });
        await page.fill("#question", view.ask);
        await page.click('.chat form.row button[type="submit"]');
        await page.waitForSelector(view.waitFor, { timeout: 30000 });
        await page.waitForTimeout(400);
      }

      const tree = await page.evaluate(TREE_PROBE);
      const extra = await page.evaluate(EXTRA_PROBE);
      // Escape only means something when there is something to dismiss.
      let escape = "no dismissible overlay or dialog exists on this route, so Escape behaviour is not applicable";
      if (extra.dialogs.length) {
        const before = extra.dialogs.length;
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
        const after = await page.evaluate(() => document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], .modal, .sheet, [data-dialog]').length);
        escape = `${before} overlay node(s) present; after Escape ${after} remain — ${after < before ? "dismissed" : "NOT dismissed"}`;
      }
      let motionNoPreference = null;
      if (width === 1440) {
        const plain = await browser.newContext({ viewport: { width, height: 1000 } });
        const plainPage = await plain.newPage();
        await guardPage(plainPage, `${width}/${view.id}/no-preference`, Boolean(view.ask));
        if (!view.guest) await login(plainPage);
        await plainPage.goto(`${BASE}${view.url}`, { waitUntil: "load", timeout: 45000 });
        await plainPage.waitForLoadState("load");
        await plainPage.waitForTimeout(view.settle || 1200);
        if (view.ask) {
          await plainPage.waitForSelector("#question:not([disabled])", { timeout: 45000 });
          await plainPage.fill("#question", view.ask);
          await plainPage.click('.chat form.row button[type="submit"]');
          await plainPage.waitForSelector(view.waitFor, { timeout: 30000 });
          await plainPage.waitForTimeout(400);
        }
        motionNoPreference = await plainPage.evaluate(EXTRA_PROBE);
        await plain.close();
      }
      await page.evaluate(() => document.activeElement?.blur());
      const stops = [];
      let wrapAt = null;
      for (let i = 0; i < MAX_STOPS; i++) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(STOP_PROBE);
        if (!stop) break;
        if (stop.repeated) {
          wrapAt = { afterStops: stops.length, on: stop.name || stop.tag };
          break;
        }
        stops.push(stop);
        if (stop.tag === "body") break;
      }
      const focus = await page.evaluate(FOCUS_PROBE);
      const list = stops.map((s) => ({ ...s, focusIndicator: focus[s.key] || null }));
      const offscreen = list.filter((s) => !s.inViewport);
      const noRing = list.filter((s) => !s.focusIndicator?.hasVisibleChange);
      const noName = list.filter((s) => !s.name);
      const levels = tree.headings.map((h) => h.level);
      const headingJumps = levels.slice(1).filter((level, i) => level - levels[i] > 1).length;

      results.push({
        width,
        view: view.id,
        url: view.url,
        tabStops: list.length,
        walkLimitedByMaxStops: stops.length >= MAX_STOPS,
        wrapAround: wrapAt,
        allStops: list,
        offscreenStops: offscreen,
        stopsWithoutFocusRing: noRing.slice(0, 8),
        stopsWithoutName: noName.slice(0, 8),
        tree,
        overlays: extra.dialogs,
        escapeBehaviour: escape,
        danglingReferences: extra.danglingReferences,
        resolvedDescriptions: extra.resolvedDescriptions,
        animatedNodesReduced: extra.animatedNodes,
        animatedNodesDefault: motionNoPreference ? motionNoPreference.animatedNodes : null,
        headingLevelJumps: headingJumps,
        pageErrors: errors,
      });
      console.log(
        `${String(width).padStart(4)} ${view.id.padEnd(28)} stops=${list.length} offscreen=${offscreen.length} noRing=${noRing.length} noName=${noName.length} unnamedControls=${tree.unnamed.length} headingJumps=${headingJumps} dangling=${extra.danglingReferences.length} overlays=${extra.dialogs.length} motion=${extra.animatedNodes}${motionNoPreference ? "/" + motionNoPreference.animatedNodes : ""}`,
      );
      await context.close();
    }
  }

  const activation = await activationChecks(browser);
  await browser.close();

  const allStops = results.flatMap((r) => r.allStops);
  const assistant = results.find((r) => r.view === "10-advisory-workspace" && r.width === 1440);
  const checklist = {
    "logical tab order": {
      status: "reviewed",
      detail: `${allStops.length} stops across ${results.length} page/width walks; order recorded stop by stop in results[].allStops`,
    },
    "visible focus indicators": {
      status: allStops.filter((s) => s.focusIndicator?.hasVisibleChange).length === allStops.length ? "pass" : "findings",
      detail: `${allStops.filter((s) => s.focusIndicator?.hasVisibleChange).length}/${allStops.length} stops change outline or box-shadow between unfocused and focused`,
    },
    "no keyboard traps": {
      status: results.every((r) => !r.wrapAround) ? "pass" : "findings",
      detail: results.filter((r) => r.wrapAround).map((r) => `${r.view}@${r.width}`).join(", ") || "no walk returned to a control it had already visited",
    },
    "Enter/Space activation": { status: "reviewed", detail: activation },
    "Escape for dismissible overlays": {
      status: results.every((r) => r.overlays.length === 0) ? "not applicable on these routes" : "reviewed",
      detail: [...new Set(results.map((r) => r.escapeBehaviour))],
    },
    "focus management on dialog open/close": {
      status: results.every((r) => r.overlays.length === 0) ? "not applicable: no dialog or overlay exists on the reviewed routes" : "reviewed",
      detail: `${results.reduce((s, r) => s + r.overlays.length, 0)} overlay nodes found across all walks`,
    },
    "focus after form validation errors": {
      status: "reviewed",
      detail: activation.filter((a) => a.focusAfterError !== undefined),
    },
    "accessible names and descriptions": {
      status: allStops.every((s) => s.name) && results.every((r) => r.tree.unnamed.length === 0 && r.danglingReferences.length === 0) ? "pass" : "findings",
      detail: {
        stopsWithoutName: allStops.filter((s) => !s.name).length,
        unnamedVisibleControls: results.reduce((s, r) => s + r.tree.unnamed.length, 0),
        danglingAriaReferences: results.reduce((s, r) => s + r.danglingReferences.length, 0),
      },
    },
    "heading and landmark navigation": {
      status: results.every((r) => r.headingLevelJumps === 0) ? "pass" : "findings",
      detail: {
        headingLevelJumps: results.filter((r) => r.headingLevelJumps > 0).map((r) => `${r.view}@${r.width}`),
        landmarksPerView: [...new Set(results.map((r) => `${r.view}:${r.tree.landmarks.length}`))],
        skipLinks: assistant ? assistant.tree.skip : [],
        lang: [...new Set(results.map((r) => r.tree.lang))],
      },
    },
    "status updates communicated": {
      status: "reviewed",
      detail: results.filter((r) => r.width === 1440).map((r) => ({ view: r.view, liveRegions: r.tree.live })),
    },
    "assistant and GenUI semantics": {
      status: "reviewed",
      detail: assistant
        ? { headings: assistant.tree.headings, landmarks: assistant.tree.landmarks, liveRegions: assistant.tree.live, cardLinksNamed: assistant.allStops.filter((s) => s.tag === "a").map((s) => s.name) }
        : "assistant view not walked",
    },
    "reduced motion": {
      status: "reviewed",
      detail: results
        .filter((r) => r.animatedNodesDefault !== null)
        .map((r) => ({ view: r.view, animatedNodesUnderReduce: r.animatedNodesReduced, animatedNodesByDefault: r.animatedNodesDefault })),
    },
    "screen reader session": {
      status: "NOT PERFORMED",
      detail: "no NVDA/Orca on this machine; everything above is a DOM and Chromium accessibility-tree review, not a screen-reader test",
    },
  };

  const file = path.join(OUT, "keyboard-and-ax-tree.json");
  writeFileSync(
    file,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        base: BASE,
        widths: WIDTHS,
        screenReader: screenReaderState(),
        playwright: require("playwright/package.json").version,
        writeGuard: guards.map((g) => g.summary()),
        checklist,
        activation,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(checklist, null, 2).slice(0, 4000));
  console.log(`wrote ${file}`);
  const unexpectedWrites = guards.flatMap((g) => g.blocked());
  console.log(`non-read requests: writes allowed ${guards.reduce((s, g) => s + g.summary().writesAllowed, 0)}, blocked ${unexpectedWrites.length}`);
  for (const record of unexpectedWrites) {
    console.log(`  UNEXPECTED ${record.decision} ${record.method} ${record.path} [${record.label}]`);
  }
  if (unexpectedWrites.length) {
    console.error("read-only keyboard walk attempted undeclared writes");
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error("keyboard review failed:", e);
  process.exit(1);
});
