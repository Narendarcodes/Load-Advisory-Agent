// Applicant-facing label for a decision card (shared by index.html and voice.html).
// Pure projection of what the server recorded: it never changes the decision, it only stops a data-quality hold,
// a bureau provider failure or an information request from being shown as a bare "ERROR" (or read as a rejection).
function outcomeView(card) {
  const b = (card && card.bureau) || {};
  const kind = b.outcome_kind;
  const missing = (card && card.missing_fields) || [];
  if (kind === "DATA_QUALITY_HOLD") {
    const codes = (b.review_reason_codes || []).join(", ");
    return { label: "UNDER REVIEW", cls: "dec-REVIEW",
             note: "Data-quality hold: a person will review your file. This is not a credit rejection." + (codes ? " Reason: " + codes + "." : "") };
  }
  if (kind === "PROVIDER_FAILURE") {
    const code = (b.provider_error && b.provider_error.code) || "BUREAU_ERROR";
    return { label: "CREDIT CHECK PENDING", cls: "dec-REVIEW",
             note: "The credit bureau could not be reached or read (" + code + "). No credit decision has been made. " +
                   (b.retryable ? "This is temporary and can be retried." : "Your file goes to manual review.") };
  }
  if (card && card.decision === "ERROR" && card.lifecycle_state === "INFO_REQUESTED") {
    return { label: "INFORMATION NEEDED", cls: "dec-REVIEW",
             note: "No credit decision has been made: some details are missing or invalid" + (missing.length ? " (" + missing.join(", ") + ")" : "") + "." };
  }
  const d = (card && card.decision) || "none";
  return { label: String(d), cls: "dec-" + d, note: "" };
}
if (typeof module !== "undefined") module.exports = { outcomeView };
