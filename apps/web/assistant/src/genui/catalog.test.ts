import { describe, expect, it } from "vitest";
import { outcomeLabel } from "./catalog";

// E2E D-16: the decision badge never shows a raw outcome code.
describe("outcomeLabel", () => {
  it.each([
    ["ELIGIBILITY_CONDITIONS_MET", "Approved"],
    ["COUNTER_OFFER", "Smaller offer"],
    ["COUNTER", "Smaller offer"],
    ["MANUAL_REVIEW", "Needs review"],
    ["MORE_INFORMATION_REQUIRED", "Details needed"],
    ["INFO_REQUESTED", "Details needed"],
    ["DECLINE", "Not approved"],
    ["REJECTED", "Not approved"],
  ])("%s reads as %s", (code, label) => {
    expect(outcomeLabel(code).label).toBe(label);
  });

  it("never echoes an unknown code", () => {
    const got = outcomeLabel("SOME_NEW_CODE").label;
    expect(got).not.toMatch(/[A-Z]{3,}_/);
    expect(got).toBe("Decision recorded");
  });
});
