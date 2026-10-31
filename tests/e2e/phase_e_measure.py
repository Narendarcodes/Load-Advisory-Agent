"""Phase E measurements: reflow, tap targets, keyboard, axe, lazy chunks.

Runs against the disposable site fronted by `nginx.loanportal.conf`, with the
CopilotKit runtime reachable so the assistant island renders its real shell.

    python tests/e2e/phase_e_measure.py --seed <seed.json> --axe <axe.min.js> \
        [--base http://127.0.0.1:8081] [--out tests/e2e/out/phase-e]

Only numbers produced by this run are written to measurements.json. Nothing is
copied into the repo from the seed file except the borrower email used to sign
in; the password stays in the file passed on the command line.
"""

import argparse
import json
import os
import sys

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

VIEWPORTS = [
    ("mobile-390x844", 390, 844),
    ("tablet-768x1024", 768, 1024),
    ("small-1024x768", 1024, 768),
    ("laptop-1360x900", 1360, 900),
    ("desktop-1920x1080", 1920, 1080),
    ("reflow-320x640", 320, 640),
]

AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]


def login(page, base, email, password):
    page.goto(base + "/login", wait_until="domcontentloaded")
    page.fill("#login_email", email)
    page.fill("#login_password", password)
    page.click("form.form-login button[type=submit]")
    page.wait_for_url(lambda url: "/login" not in url, timeout=20000)


def visit(page, url, wait_ms=900):
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(wait_ms)


OVERFLOW_JS = """
() => {
  const doc = document.documentElement;
  const width = doc.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= width + 1 && rect.left >= -1) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'absolute') continue;
    let parent = el.parentElement, scrollable = false;
    while (parent) {
      const ps = getComputedStyle(parent);
      if ((ps.overflowX === 'auto' || ps.overflowX === 'scroll') && parent.scrollWidth > parent.clientWidth) {
        scrollable = true; break;
      }
      parent = parent.parentElement;
    }
    if (scrollable) continue;
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 80),
      text: (el.textContent || '').trim().slice(0, 60),
      left: Math.round(rect.left), right: Math.round(rect.right),
    });
  }
  return {
    viewport: width,
    scrollWidth: doc.scrollWidth,
    overflow: Math.max(0, doc.scrollWidth - width),
    offenders: offenders.slice(0, 8),
  };
}
"""

TAP_JS = """
() => {
  const selector = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const small = [];
  let total = 0;
  for (const el of document.querySelectorAll(selector)) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    total += 1;
    if (rect.width < 24 - 0.5 || rect.height < 24 - 0.5) {
      const inline = el.tagName === 'A' && el.closest('p, li, dd, dt, span');
      small.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.value || '').trim().slice(0, 40),
        w: Math.round(rect.width * 10) / 10,
        h: Math.round(rect.height * 10) / 10,
        inline_link: Boolean(inline),
      });
    }
  }
  const interactive = small.filter(s => !s.inline_link);
  return { total, small: small.length, non_inline_small: interactive.length, samples: interactive.slice(0, 8) };
}
"""

FOCUS_JS = """
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'body' };
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || el.value || '').trim().slice(0, 40),
    href: el.getAttribute('href') || '',
    visible: rect.width > 0 && rect.height > 0,
    outline: `${style.outlineStyle} ${style.outlineWidth}`,
    box_shadow: style.boxShadow,
    focus_visible: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
  };
}
"""


def axe_scan(page, axe_source, name):
    page.evaluate(axe_source)
    result = page.evaluate(
        """async (tags) => {
            const r = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
            return {
                violations: r.violations.map(v => ({
                    id: v.id, impact: v.impact, help: v.help,
                    nodes: v.nodes.map(n => ({ target: n.target, summary: (n.failureSummary || '').slice(0, 240) })),
                })),
                passes: r.passes.length,
                incomplete: r.incomplete.map(v => ({ id: v.id, impact: v.impact })),
            };
        }""",
        AXE_TAGS,
    )
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True)
    parser.add_argument("--axe", required=True)
    parser.add_argument("--base", default="http://127.0.0.1:8081")
    parser.add_argument("--out", default="tests/e2e/out/phase-e")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    seed = json.load(open(args.seed, encoding="utf-8"))
    email = seed["victim"]["user"]
    password = seed["victim"]["password"]
    application = seed["victim"]["application"]
    axe_source = open(args.axe, encoding="utf-8").read()

    pages = [
        ("home", "/borrower"),
        ("apply", "/borrower/apply"),
        ("application", f"/borrower/application?name={application}"),
        ("profile", "/borrower/profile"),
        ("feedback", "/borrower/feedback"),
        ("assistant", f"/borrower/assistant?application={application}"),
        ("help", "/borrower/help"),
        ("products", "/borrower/products"),
        ("terms", "/borrower/terms"),
        ("privacy", "/borrower/privacy"),
    ]

    report = {"base": args.base, "viewports": [], "pages": {}, "axe": {}, "manual": {}, "lazy": {}}

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        login(page, args.base, email, password)

        for label, width, height in VIEWPORTS:
            report["viewports"].append({"label": label, "width": width, "height": height})
            page.set_viewport_size({"width": width, "height": height})
            for name, path in pages:
                visit(page, args.base + path)
                overflow = page.evaluate(OVERFLOW_JS)
                taps = page.evaluate(TAP_JS)
                shot = os.path.join(args.out, f"{name}-{label}.png")
                page.screenshot(path=shot, full_page=True)
                entry = {
                    "url": path,
                    "overflow": overflow,
                    "tap_targets": taps,
                    "screenshot": shot,
                }
                report["pages"].setdefault(name, {})[label] = entry
                print(
                    f"{label:16} {name:14} overflow={overflow['overflow']:>3}px "
                    f"small_targets={taps['non_inline_small']}/{taps['total']}"
                )

                if label in ("mobile-390x844", "laptop-1360x900"):
                    result = axe_scan(page, axe_source, name)
                    report["axe"].setdefault(name, {})[label] = result
                    print(f"{'':16} {'':14} axe violations={len(result['violations'])}")

        # Keyboard: first Tab must reach the skip link, Enter must move focus to main.
        page.set_viewport_size({"width": 390, "height": 844})
        visit(page, args.base + "/borrower")
        page.keyboard.press("Tab")
        first = page.evaluate(FOCUS_JS)
        page.keyboard.press("Enter")
        page.wait_for_timeout(300)
        after_enter = page.evaluate("() => ({ hash: location.hash, active: document.activeElement && document.activeElement.id })")
        stop_focus = []
        visit(page, args.base + "/borrower")
        for _ in range(12):
            page.keyboard.press("Tab")
            stop_focus.append(page.evaluate(FOCUS_JS))
        report["manual"]["keyboard"] = {
            "first_tab": first,
            "after_enter": after_enter,
            "first_12_stops": stop_focus,
        }
        print("keyboard first_tab=", first.get("tag"), first.get("text"), "visible=", first.get("visible"))

        # Lazy-chunk measurement: a fresh context so nothing is cached.
        lazy_context = browser.new_context()
        lazy_page = lazy_context.new_page()
        scripts = []
        lazy_page.on(
            "response",
            lambda r: scripts.append(
                {
                    "url": r.url,
                    "status": r.status,
                    "type": r.request.resource_type,
                    "bytes": int(r.headers.get("content-length") or 0),
                }
            )
            if r.request.resource_type in ("script", "stylesheet", "document", "fetch", "xhr")
            else None,
        )
        login(lazy_page, args.base, email, password)
        lazy_page.goto(args.base + f"/borrower/assistant?application={application}", wait_until="load")
        lazy_page.wait_for_timeout(2500)
        timings = lazy_page.evaluate(
            "() => { const e = performance.getEntriesByType('navigation')[0]; return { dom_content_loaded: Math.round(e.domContentLoadedEventEnd), load: Math.round(e.loadEventEnd), transfer: performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) }; }"
        )
        initial = [s for s in scripts if s["url"].startswith(args.base)]
        island = [s for s in initial if "/js/assistant/" in s["url"]]
        lazy_flags = [s for s in initial if "shiki" in s["url"].lower() or "/chunks/" in s["url"]]
        report["lazy"] = {
            "navigation_timing_ms": timings,
            "initial_requests": initial,
            "initial_js_bytes": sum(s["bytes"] for s in initial if s["type"] == "script"),
            "island_js_bytes": sum(s["bytes"] for s in island if s["type"] == "script"),
            "island_js_urls": [s["url"] for s in island if s["type"] == "script"],
            "initial_total_declared_bytes": sum(s["bytes"] for s in initial),
            "chunk_requests_on_load": lazy_flags,
        }
        print("island js bytes:", report["lazy"]["island_js_bytes"], "chunk requests:", len(lazy_flags))
        lazy_context.close()

        # 200% text size (WCAG 1.4.4): only what is sized in rem may grow.
        page.set_viewport_size({"width": 1360, "height": 900})
        zoomed = {}
        for name in ("home", "application", "profile", "feedback", "help"):
            path = dict(pages)[name]
            visit(page, args.base + path)
            page.add_style_tag(content="html { font-size: 200% !important; }")
            page.wait_for_timeout(300)
            zoomed[name] = page.evaluate(OVERFLOW_JS)
            page.screenshot(path=os.path.join(args.out, f"text-200-{name}.png"), full_page=True)
        report["manual"]["text_200_percent"] = zoomed
        browser.close()

    with open(os.path.join(args.out, "measurements.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)
    print("wrote", os.path.join(args.out, "measurements.json"))


if __name__ == "__main__":
    main()
