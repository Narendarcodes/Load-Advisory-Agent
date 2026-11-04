/**
 * Plain words for the activity trail. Each line is a real graph stage the server reported
 * (PROGRESS_LABELS' allowlist). There is no line per rule: a recorded value or cut-off is never repeated.
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

/** The finished turn's trail: one line per real stage, unknown stages dropped. */
export function trailLines(stages: readonly string[]): string[] {
  return stages.map((stage) => trailLabel(stage, true)).filter((line): line is string => Boolean(line));
}
