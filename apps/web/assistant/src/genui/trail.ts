import type { DecisionCard } from "../types";
import { limitText } from "./meter";

/**
 * Plain words for the activity trail. Each line is either a real graph stage the server reported
 * (PROGRESS_LABELS' allowlist) or a rule row from the recorded decision card. Nothing is inferred.
 */
const STAGES: Record<string, { doing: string; done: string }> = {
  authenticate: { doing: "Confirming this is your application", done: "Confirmed this is your application" },
  load_evidence: { doing: "Reading your recorded decision", done: "Read your recorded decision" },
  retrieve_policy: { doing: "Searching the lender's policy documents", done: "Searched the lender's policy documents" },
  what_if: { doing: "Re-running the checks with your numbers", done: "Re-ran the checks with your numbers" },
  compose: { doing: "Writing the explanation", done: "Wrote the explanation" },
};

export function trailLabel(stage: string | null | undefined, done: boolean): string | null {
  const entry = stage ? STAGES[stage] : undefined;
  if (!entry) return null;
  return done ? entry.done : entry.doing;
}

function lower(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").replace(/^\w/, (c) => c.toLowerCase());
}

/** "Compared credit score: 612 against a minimum of 650 (not met)", for each evaluated rule. */
export function ruleTrailLines(card: DecisionCard | undefined): string[] {
  if (!card) return [];
  return card.rules
    .filter((rule) => (rule.result === "PASS" || rule.result === "FAIL") && rule.actual && rule.operator)
    .map((rule) => {
      const bound = rule.operator === ">=" ? "a minimum of" : "a limit of";
      const limit = limitText(rule.threshold, rule.threshold_value ?? 0);
      const outcome = rule.result === "PASS" ? "met" : "not met";
      return `Compared ${lower(rule.name)}: ${rule.actual} against ${bound} ${limit} (${outcome})`;
    });
}
