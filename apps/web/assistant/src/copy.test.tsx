import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { answerBlocks, STARTERS, TRUST_LINE } from "./chat-panel";
import { renderBlock } from "./genui/registry";
import { PROGRESS_LABELS } from "./genui/catalog";
import { parsePublicState } from "./genui/schema";
import { followUps } from "./turns";

// Borrowers never see the machinery. Mirrors tests/test_borrower_copy.py for the portal templates.
const ACRONYMS = /\b(ZEN|RAG|API|APIs|LLM|JDM|AG-UI)\b/;
const WORDS = /\b(langgraph|embeddings?|orchestrat\w*|agent(?:ic|s)?|vector|qdrant|copilotkit|pipeline)\b/i;

function visible(markup: string): string {
  const element = document.createElement("div");
  element.innerHTML = markup;
  const labels = Array.from(element.querySelectorAll("[aria-label],[title],[alt],[placeholder]"))
    .map((node) => ["aria-label", "title", "alt", "placeholder"].map((name) => node.getAttribute(name) ?? "").join(" "))
    .join(" ");
  return `${element.textContent ?? ""} ${labels}`;
}

describe("borrower-visible copy in the assistant", () => {
  it("uses no internal vocabulary in fixed strings", () => {
    const strings = [...STARTERS, TRUST_LINE, ...Object.values(PROGRESS_LABELS), ...followUps(undefined)];
    for (const text of strings) {
      expect(text).not.toMatch(ACRONYMS);
      expect(text).not.toMatch(WORDS);
    }
  });

  it("uses no internal vocabulary in any answer card", () => {
    const state = parsePublicState({
      decision_card: {
        application_ref: "LA-1",
        decision: "REJECTED",
        recorded_outcome: "REJECTED",
        policy_synthetic: true,
        rules: [{ rule_id: "MIN_CREDIT_SCORE", name: "Credit score", result: "FAIL", actual: "640", threshold: "≥ 700" }],
        failed_reason_codes: [],
        missing_fields: ["monthly_income"],
        flags: [],
        bureau: { outcome_kind: "CREDIT_REJECTION", review_required: true, info_requested: true },
      },
      what_if: { changes: { credit_score: 720 }, simulated_decision: "APPROVED", rule_results: { MIN_CREDIT_SCORE: "PASS" } },
      missing_information: ["monthly_income", "applicant_id"],
      handoff_ref: "HO-1",
      abstained: true,
      citations: [{ label: "1", document_id: "d", title: "Credit policy" }],
      improvement_plan: [{ rule_id: "MIN_CREDIT_SCORE", task: "Raise your score", general_guidance: "Pay on time." }],
    });
    const context = { application: "LA-1", onAsk: () => undefined };
    const blocks = [
      ...answerBlocks(state, context),
      { type: "what_if_form" as const, card: state.decision_card },
    ];
    expect(blocks.length).toBeGreaterThan(5);
    const text = visible(renderToStaticMarkup(<>{blocks.map((block, i) => <div key={i}>{renderBlock(block, context)}</div>)}</>));
    expect(text).not.toMatch(ACRONYMS);
    expect(text).not.toMatch(WORDS);
    expect(text).toContain("Estimate only, your application is unchanged");
    expect(text).not.toMatch(/CIBIL|FOIR|threshold|cut-?off|PL-|score/i);
  });
});
