import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  classify,
  decisionSummary,
  FORBIDDEN,
  improvementSteps,
  reasonThemes,
  safeText,
  STEPS,
  SUMMARIES,
  THEMES,
  themeText,
  WHAT_IF,
  whatIfMeets,
} from "./plain";

// vitest runs from apps/web/assistant; the portal copy sits beside it in the same tree.
const PORTAL = resolve(process.cwd(), "../../loan_advisory_portal/loan_advisory_portal/public/js/reasons.js");

describe("plain decision copy", () => {
  it("is word for word the same as the portal's copy, so both surfaces say the same thing", () => {
    expect(existsSync(PORTAL)).toBe(true);
    const portal = createRequire(PORTAL)(PORTAL);
    expect(THEMES).toEqual(portal.THEMES);
    expect(SUMMARIES).toEqual(portal.SUMMARIES);
    expect(STEPS).toEqual(portal.STEPS);
    expect(String(FORBIDDEN)).toBe(String(portal.FORBIDDEN));
    for (const code of ["FOIR_TOO_HIGH", "CREDIT_SCORE_LOW", "PL-104", "BUREAU_TIMEOUT", "ERR_EMPLOYMENT_TENURE_SHORT", "PL-077"]) {
      expect(classify(code)).toBe(portal.classify(code));
    }
  });

  it("has no digit and no banned word in any language", () => {
    for (const table of [THEMES, SUMMARIES, STEPS, WHAT_IF]) {
      for (const locale of ["en", "hi", "te"] as const) {
        for (const text of Object.values(table[locale])) {
          expect(text).not.toMatch(/\d/);
          expect(text).not.toMatch(FORBIDDEN);
        }
      }
    }
  });

  it("maps categories, codes and raw texts onto at most three themes", () => {
    expect(classify({ category: "EMPLOYMENT_STABILITY", rule_id: "MIN_CREDIT_SCORE" })).toBe("EMPLOYMENT");
    expect(classify({ rule_id: "FOIR_MAX_45", name: "Existing EMIs vs income (FOIR)" })).toBe("REPAYMENTS_TOO_HIGH");
    expect(classify({ code: "PL-104", text: "Signature similarity 0.41 is below the 0.60 cut-off." })).toBe("DETAILS_NOT_VERIFIED");
    expect(reasonThemes(["FOIR_TOO_HIGH", "CREDIT_SCORE_LOW", "ERR_INCOME_BELOW_MINIMUM", "ERR_EMPLOYMENT_TENURE_SHORT"])).toEqual([
      "REPAYMENTS_TOO_HIGH",
      "CREDIT_HISTORY",
      "INCOME",
    ]);
    expect(reasonThemes(["PL-077", "FOIR_TOO_HIGH"])).toEqual(["REPAYMENTS_TOO_HIGH"]);
  });

  it("speaks Hindi and Telugu when the profile asks for them, English otherwise", () => {
    expect(themeText("CREDIT_HISTORY", "hi")).toContain("क्रेडिट इतिहास");
    expect(themeText("CREDIT_HISTORY", "te")).toContain("క్రెడిట్ చరిత్ర");
    expect(themeText("CREDIT_HISTORY", "fr")).toBe("Your credit history doesn't meet our requirements right now.");
    expect(decisionSummary("MANUAL_REVIEW", "en")).toBe(decisionSummary("REVIEW", "en"));
    expect(decisionSummary("WITHDRAWN", "en")).toBeNull();
  });

  it("builds two or three general steps, and keeps server text only when it is clean", () => {
    expect(improvementSteps(["CREDIT_HISTORY"]).length).toBe(2);
    expect(improvementSteps(["CREDIT_HISTORY", "INCOME", "EMPLOYMENT", "DOCUMENTS"]).length).toBe(3);
    expect(improvementSteps([]).length).toBe(2);
    expect(safeText("Raise your credit score to 700")).toBeNull();
    expect(safeText("Pay on time.")).toBe("Pay on time.");
    expect(whatIfMeets("APPROVED")).toBe(true);
    expect(whatIfMeets("REJECTED")).toBe(false);
    expect(whatIfMeets(undefined)).toBeNull();
    expect(whatIfMeets("COULD_NOT_ESTIMATE")).toBeNull();
    expect(whatIfMeets("ERROR")).toBeNull();
    expect(whatIfMeets("WOULD_NOT_MEET")).toBe(false);
  });
});
