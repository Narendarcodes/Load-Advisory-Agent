import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest runs from apps/web/assistant. The island renders inside portal pages, so every global
// rule in portal.css also reaches the island's markup. These are the collisions found in the
// 2026-11 visual pass; each one broke a real screen.
const portalCss = readFileSync(
  resolve(process.cwd(), "../../loan_advisory_portal/loan_advisory_portal/public/css/portal.css"),
  "utf8",
);
const islandCss = readFileSync(resolve(process.cwd(), "src/assistant.css"), "utf8");

function rules(css: string, selector: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, "g")), (m) => m[1]);
}

describe("portal stylesheet collisions", () => {
  it("lets the run's progress list grow: portal.css makes .progress an 8px clipped bar", () => {
    expect(rules(portalCss, ".progress").join("")).toMatch(/height:\s*8px/);
    const island = rules(islandCss, ".assistant .progress").join("");
    expect(island).toMatch(/height:\s*auto/);
    expect(island).toMatch(/overflow:\s*visible/);
  });

  it("names the finished-steps list so the wizard's numbered .steps pills never apply", async () => {
    expect(rules(portalCss, ".steps li").length).toBeGreaterThan(0);
    const source = readFileSync(resolve(process.cwd(), "src/chat-panel.tsx"), "utf8");
    expect(source).not.toMatch(/className="steps"/);
    expect(rules(portalCss, ".run-steps")).toEqual([]);
  });
});

/** Bodies of every `@media (<query>) { ... }` block (one level of nesting). */
function mediaBlocks(css: string, query: string): string[] {
  const out: string[] = [];
  const head = `@media (${query})`;
  let at = css.indexOf(head);
  while (at !== -1) {
    let i = css.indexOf("{", at) + 1;
    const start = i;
    let depth = 1;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    out.push(css.slice(start, i - 1));
    at = css.indexOf(head, i);
  }
  return out;
}

describe("phone layout against the portal's tab bar", () => {
  it("opens the tools sheet above the bottom tab bar, which portal.css shows below 768px", () => {
    expect(mediaBlocks(portalCss, "max-width: 767px").join("")).toMatch(/\.tabbar[^{]*\{\s*display:\s*grid/);
    const phone = mediaBlocks(islandCss, "max-width: 767px").join("");
    const sheet = phone.match(/\.assistant__aside\.tools-drawer\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(sheet).toMatch(/bottom:\s*calc\(62px/);
  });

  it("v2: the conversation flows in the page (nothing clipped) and the composer docks above the tab bar", () => {
    const v2 = islandCss.slice(islandCss.indexOf("Saral v2: the assistant as a workspace"));
    const log = v2.match(/\.assistant \.log,\s*\.assistant \.log:focus\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(log).toMatch(/max-height:\s*none/);
    expect(log).toMatch(/overflow:\s*visible/);
    const composer = v2.match(/\.assistant \.composer\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(composer).toMatch(/position:\s*sticky/);
    expect(composer).toMatch(/bottom:\s*var\(--ws-dock\)/);
    expect(mediaBlocks(v2, "max-width: 767px").join("")).toMatch(/--ws-dock:\s*calc\(62px/);
  });
});

describe("card tables on narrow screens", () => {
  it("wraps header cells, column and row, between words only (\"Monthl / y incom / e\" at 390px)", () => {
    const rule = islandCss.match(/((?:\.assistant [a-z ]*th,?\s*)+)\{([^}]*)\}/g) ?? [];
    const wordSafe = rule.filter((r) => /overflow-wrap:\s*normal/.test(r) && /word-break:\s*normal/.test(r));
    const selectors = wordSafe.map((r) => r.split("{")[0]).join(",");
    expect(selectors).toMatch(/\.assistant thead th/);
    expect(selectors).toMatch(/\.assistant tbody th/);
  });
});

describe("decision card on phones", () => {
  it("fits the four-column rules table inside the answer bubble (no sideways scroll hiding 'Not met')", () => {
    const phone = mediaBlocks(islandCss, "max-width: 767px").join("");
    expect(phone).toMatch(/\.msg__card thead th\s*\{[^}]*letter-spacing:\s*0/);
    expect(phone).toMatch(/\.msg__card > \.card-block\s*\{[^}]*padding-left:\s*10px/);
  });
});
