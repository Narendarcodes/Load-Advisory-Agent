/** Borrower-facing vocabulary for server values. The server sends codes; the UI owns the words. */

export interface OutcomeLabel {
  label: string;
  tone: "ok" | "bad" | "warn" | "neutral";
}

const OUTCOMES: Record<string, OutcomeLabel> = {
  APPROVED: { label: "Approved", tone: "ok" },
  REJECTED: { label: "Not approved", tone: "bad" },
  REVIEW: { label: "Needs review", tone: "warn" },
  ERROR: { label: "Check could not be completed", tone: "warn" },
};

export function outcomeLabel(value: string | null | undefined): OutcomeLabel {
  if (!value) return { label: "Not recorded", tone: "neutral" };
  return OUTCOMES[value] ?? { label: value, tone: "neutral" };
}

interface FieldHelp {
  label: string;
  explanation: string;
}

const FIELDS: Record<string, FieldHelp> = {
  monthly_income: {
    label: "Monthly income",
    explanation: "The income recorded for this application is missing or was flagged as needing correction.",
  },
  monthly_obligations: {
    label: "Monthly obligations",
    explanation: "Your total monthly loan payments (EMIs) are missing or were flagged as needing correction.",
  },
  credit_score: {
    label: "Credit history details",
    explanation: "We need your credit history details to finish checking your application.",
  },
  employment_months: {
    label: "Months in current employment",
    explanation: "Your time in the current job is missing or was flagged as needing correction.",
  },
  applicant_id: {
    label: "Identity details",
    explanation: "An identity detail on the application needs to be confirmed with a person before the check can run.",
  },
};

export interface MissingInformationItem {
  field: string;
  label: string;
  explanation: string;
  href: string;
  linkLabel: string;
}

/** Only routes that exist in the portal: the application's own correction form, or the help page. */
export function missingInformationItem(field: string, application: string): MissingInformationItem {
  const help = FIELDS[field] ?? {
    label: field.replaceAll("_", " "),
    explanation: "This detail is still needed before the decision can be completed.",
  };
  const name = encodeURIComponent(application);
  if (field === "applicant_id") {
    return { field, ...help, href: "/borrower/help", linkLabel: "Read how to resolve this" };
  }
  return {
    field,
    ...help,
    href: `/borrower/application?name=${name}#info-request`,
    linkLabel: "Correct this in your application",
  };
}

/** Node names the FastAPI endpoint may publish. Anything else is ignored, never labelled locally. */
export const PROGRESS_LABELS: Record<string, string> = {
  authenticate: "Checking your application",
  load_evidence: "Loading the decision record",
  retrieve_policy: "Searching the policy library",
  what_if: "Running the simulation",
  compose: "Preparing the explanation",
};

export function progressLabel(stage: string | null | undefined): string | null {
  return stage ? (PROGRESS_LABELS[stage] ?? null) : null;
}
