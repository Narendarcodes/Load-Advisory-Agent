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
