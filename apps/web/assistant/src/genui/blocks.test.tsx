import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ImprovementTask, PublicState } from "../types";
import { missingInformationItem } from "./catalog";
import { buildBlocks, GENUI_BLOCK_TYPES, renderBlock, type GenUiBlock, type GenUiContext } from "./registry";
import { parseDecisionCard, parsePublicState } from "./schema";

const context: GenUiContext = { application: "LA-2026-00001", busy: false, onAsk: () => {} };

function html(block: Parameters<typeof renderBlock>[0], ctx: GenUiContext = context) {
  return renderToStaticMarkup(<>{renderBlock(block, ctx)}</>);
}

function textOf(markup: string): string {
  const element = document.createElement("div");
  element.innerHTML = markup;
  return element.textContent ?? "";
}

/* What the API still sends today (Qoder Q-07): rule rows with values, cut-offs and rule ids. */
const RULES = [
  { rule_id: "FOIR_MAX_45", name: "Existing EMIs vs income (FOIR)", reason_code: "FOIR_TOO_HIGH", result: "FAIL",
    actual: "50.0%", threshold: "≤ 45.0%", threshold_source: "synthetic", actual_value: 0.5, threshold_value: 0.45, operator: "<=" },
  { rule_id: "MIN_CREDIT_SCORE", name: "Credit score", reason_code: "CREDIT_SCORE_LOW", result: "FAIL",
    actual: "612", threshold: "≥ 650", threshold_source: "synthetic", actual_value: 612, threshold_value: 650, operator: ">=" },
  { rule_id: "PL-104", name: "Signature screening", reason_code: "SIGNATURE_LOW", result: "FAIL",
    actual: "0.41", threshold: "≥ 0.60", actual_value: 0.41, threshold_value: 0.6, operator: ">=" },
  { rule_id: "MIN_MONTHLY_INCOME", name: "Monthly income", result: "PASS", actual: "₹52,000", threshold: "≥ ₹25,000",
    actual_value: 52000, threshold_value: 25000, operator: ">=" },
];

/** Every digit that appears in a rule field the API sent. None of them may be rendered. */
const RULE_DIGITS = /612|650|0\.41|0\.6|45|50|52,000|25,000|104/;
const BANNED = /CIBIL|FOIR|threshold|cut-?off|PL-|score/i;

function card(state: "APPROVED" | "REJECTED" | "REVIEW" | "ERROR", overrides: Record<string, unknown> = {}) {
  return parseDecisionCard({
    application_ref: "LA-2026-00001",
    decision: state,
    recorded_outcome: state,
    record_id: "DEC-0001",
    policy_version: "synthetic-v1",
    policy_synthetic: true,
    policy_label: "The thresholds on this decision are prototype assumptions.",
    evaluated_at: "Thu 2026-10-01 3:30 PM IST (UTC+05:30)",
    rules: state === "REJECTED" ? RULES : state === "REVIEW" ? [RULES[2]] : [RULES[3]],
    failed_reason_codes: state === "REJECTED" ? ["FOIR_TOO_HIGH", "CREDIT_SCORE_LOW"] : [],
    missing_fields: state === "REVIEW" ? ["monthly_income"] : [],
    flags: state === "REJECTED" ? ["SYNTHETIC_POLICY"] : [],
    ...overrides,
  })!;
}

describe("block catalogue", () => {
  it("is frozen to the calm set: no rule rows, progress or application context blocks", () => {
    expect(GENUI_BLOCK_TYPES).toEqual([
      "decision_card",
      "policy_citation",
      "what_if_form",
      "what_if_result",
      "improvement_plan",
      "missing_information",
      "human_assistance",
      "notice",
    ]);
    expect(Object.isFrozen(GENUI_BLOCK_TYPES)).toBe(true);
    for (const removed of ["rule_evaluation", "progress", "application_context"]) {
      expect(renderBlock({ type: removed, rules: RULES, stage: "load_evidence", application: "LA-1" } as unknown as GenUiBlock, context)).toBeNull();
    }
  });

  it("drops a block type that is not in the approved catalogue", () => {
    const forged = { type: "freeform_html", html: "<img src=x onerror=alert(1)>" } as unknown as GenUiBlock;
    expect(renderBlock(forged, context)).toBeNull();
    expect(buildBlocks(parsePublicState({ blocks: [{ type: "freeform_html", html: "<script>" }] }), context)).toEqual([]);
  });
});

describe("DecisionCardBlock", () => {
  it("shows an approval as outcome, amount, EMI and tenure only", () => {
    const markup = html({
      type: "decision_card",
      card: card("APPROVED", { offer: { amount: 200000, emi: 9555, tenure_months: 24 } }),
    });
    const text = textOf(markup);
    expect(text).toContain("Approved");
    expect(text).toContain("₹2,00,000");
    expect(text).toContain("₹9,555");
    expect(text).toContain("24 months");
    expect(text).not.toMatch(RULE_DIGITS);
    expect(text).not.toMatch(BANNED);
    expect(markup).not.toContain("meter");
    expect(markup).not.toContain("rule-");
  });

  // E2E D-16: a stored v2 outcome code never reaches the card, and a counter-offer shows its offer.
  it.each(["ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "DECLINE"])(
    "never shows the raw outcome code %s",
    (code) => {
      const parsed = parseDecisionCard({ decision: code, recorded_outcome: code, policy_synthetic: true, rules: [],
        offer: { amount: 2500000, emi: 55515, tenure_months: 84 }, reason_categories: ["REQUEST_OUTSIDE_OFFER"] })!;
      const text = textOf(html({ type: "decision_card", card: parsed }));
      expect(text).not.toContain(code);
      expect(text).not.toMatch(/[A-Z]{3,}_[A-Z_]{3,}/);
    },
  );

  it("shows a counter-offer's amount, EMI and tenure and never reads as approved", () => {
    const parsed = parseDecisionCard({ decision: "COUNTER_OFFER", recorded_outcome: "COUNTER_OFFER", rules: [],
      offer: { amount: 2500000, emi: 55515, tenure_months: 84, counter_offer: true } })!;
    expect(parsed.recorded_outcome).toBe("COUNTER");
    const text = textOf(html({ type: "decision_card", card: parsed }));
    expect(text).toContain("₹25,00,000");
    expect(text).toContain("₹55,515");
    expect(text).toContain("84 months");
    expect(text).toContain("can't offer the full amount");
    expect(text).not.toMatch(/approved/i);
  });

  it("explains a decline in one or two plain sentences and up to three themes, with no numbers", () => {
    const markup = html({ type: "decision_card", card: card("REJECTED") });
    const text = textOf(markup);
    expect(text).toContain("Not approved");
    expect(text).toContain("We can't approve this application right now.");
    expect(text).toContain("The new EMI would take too much of your monthly income.");
    expect(text).toContain("Your credit history doesn't meet our requirements right now.");
    expect(text).toContain("We couldn't verify some details.");
    expect(markup.match(/<li/g)?.length).toBeLessThanOrEqual(3);
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(BANNED);
    expect(text).not.toContain("DEC-0001");
    expect(text).not.toContain("SYNTHETIC_POLICY");
  });

  it("explains a review calmly, naming only the theme", () => {
    const text = textOf(html({ type: "decision_card", card: card("REVIEW") }));
    expect(text).toContain("Needs review");
    expect(text).toContain("closer look");
    expect(text).toContain("We couldn't verify some details.");
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(BANNED);
  });

  it("never shows bureau codes, score sources or provider errors", () => {
    const text = textOf(
      html({
        type: "decision_card",
        card: card("ERROR", {
          rules: [],
          bureau: { outcome_kind: "PROVIDER_FAILURE", provider_error: "BUREAU_TIMEOUT_504", retryable: true, score_source: "CIBIL", review_reason_codes: ["PL-019"] },
        }),
      }),
    );
    expect(text).toContain("We couldn't finish checking your application yet.");
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(BANNED);
    expect(text).not.toContain("BUREAU_TIMEOUT");
  });

  it("writes the reasons in Hindi or Telugu when the profile asks for it", () => {
    const hi = html({ type: "decision_card", card: card("REJECTED") }, { ...context, locale: "hi" });
    expect(hi).toContain('lang="hi"');
    expect(textOf(hi)).toContain("क्रेडिट इतिहास");
    const te = textOf(html({ type: "decision_card", card: card("REJECTED") }, { ...context, locale: "te" }));
    expect(te).toContain("క్రెడిట్ చరిత్ర");
    expect(te).not.toMatch(BANNED);
  });

  it("gives each card in a conversation its own heading id and keeps it out of the landmark list", () => {
    const markup = renderToStaticMarkup(
      <>
        {renderBlock({ type: "decision_card", card: card("REJECTED") }, context)}
        {renderBlock({ type: "decision_card", card: card("REJECTED") }, context)}
      </>,
    );
    const ids = [...markup.matchAll(/<h3 id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(markup).not.toContain("<section");
    expect(markup).toContain('role="group"');
  });

  it("renders nothing when the snapshot carries no card, including an unreadable one", () => {
    expect(buildBlocks({}, context)).toEqual([]);
    expect(buildBlocks(parsePublicState({ decision_card: null }), context)).toEqual([]);
    expect(buildBlocks(parsePublicState({ decision_card: { application_ref: "LA-1" } }), context)).toEqual([]);
  });
});

describe("sanitiser: rule fields never reach the page", () => {
  it("keeps no value, cut-off or rule id from a rule row after parsing", () => {
    const parsed = card("REJECTED");
    const serialised = JSON.stringify(parsed);
    for (const leak of ["612", "650", "0.45", "≥", "≤", "FOIR_MAX_45", "MIN_CREDIT_SCORE", "PL-104", "threshold", "actual"]) {
      expect(serialised).not.toContain(leak);
    }
    expect(parsed.themes).toEqual(["REPAYMENTS_TOO_HIGH", "CREDIT_HISTORY", "DETAILS_NOT_VERIFIED"]);
  });

  it("renders a whole answer with no digit from a rule field and none of the banned words", () => {
    const state = parsePublicState({
      decision_card: card("REJECTED"),
      what_if: { changes: { loan_amount: 300000 }, simulated_decision: "REJECTED", rule_results: { FOIR_MAX_45: "FAIL", MIN_CREDIT_SCORE: "FAIL" } },
      improvement_plan: [
        { rule_id: "MIN_CREDIT_SCORE", task: "Raise your credit score to 650", general_guidance: "Get CIBIL above 650.", target_display: "650", gap_display: "+38" },
        { rule_id: "FOIR_MAX_45", task: "Bring FOIR under 45%", general_guidance: "Cut EMIs by ₹4,100.", target_display: "45%", gap_display: "-5 pts" },
      ],
    });
    const blocks = buildBlocks(state, context);
    if (state.improvement_plan?.length) blocks.push({ type: "improvement_plan", plan: state.improvement_plan });
    const text = textOf(renderToStaticMarkup(<>{blocks.map((block, i) => <div key={i}>{renderBlock(block, context)}</div>)}</>));
    expect(text).not.toMatch(BANNED);
    expect(text).not.toMatch(/612|650|45|38|4,100|0\.41/);
  });
});

describe("human assistance", () => {
  it("names the local reference and says plainly that nobody has been contacted", () => {
    const markup = html({ type: "human_assistance", handoffRef: "HO-0123456789" });
    expect(markup).toContain("HO-0123456789");
    expect(markup).toContain("No message has been sent to a person yet");
    expect(markup).toContain("no advisor has been assigned");
    expect(markup).toContain("no external ticket has been created");
    expect(markup).toContain('href="/borrower/help"');
  });

  it("shows the handoff scene as decoration only (empty alt; the heading says what happened)", () => {
    const markup = html({ type: "human_assistance", handoffRef: "HO-1" });
    expect(markup).toMatch(/<img[^>]*src="\/assets\/loan_advisory_portal\/illustrations\/handoff\.svg"[^>]*>/);
    expect(markup).toMatch(/<img[^>]*alt=""/);
  });
});

describe("missing information", () => {
  it("shows a label and explanation and links to the application's correction form", () => {
    const state = parsePublicState({ missing_information: ["monthly_income", "credit_score"] });
    const blocks = buildBlocks(state, context);
    expect(blocks.map((block) => block.type)).toEqual(["missing_information"]);
    const markup = renderToStaticMarkup(<>{blocks.map((block, index) => <div key={index}>{renderBlock(block, context)}</div>)}</>);
    expect(markup).toContain("Monthly income");
    expect(markup).toContain("Credit history details");
    expect(textOf(markup)).not.toMatch(BANNED);
    expect(markup).toContain("/borrower/application?name=LA-2026-00001#info-request");
    expect(markup).toContain("Correct this in your application");
  });

  it("sends identity confirmations to the help page instead of inventing a KYC route", () => {
    const item = missingInformationItem("applicant_id", "LA-2026-00001");
    expect(item.href).toBe("/borrower/help");
    expect(item.linkLabel).toMatch(/resolve/);
  });
});

describe("what-if result", () => {
  it("shows the outcome and amount only, as an estimate that changes nothing", () => {
    const state: PublicState = parsePublicState({
      decision_card: card("REJECTED"),
      what_if: {
        changes: { loan_amount: 300000, monthly_obligations: 9000 },
        simulated_decision: "APPROVED",
        is_simulation: true,
        rule_results: { FOIR_MAX_45: "PASS", MIN_CREDIT_SCORE: "PASS" },
        original_record_unchanged: true,
      },
    });
    const markup = renderToStaticMarkup(<>{buildBlocks(state, context).map((block, index) => <div key={index}>{renderBlock(block, context)}</div>)}</>);
    const whatIf = markup.slice(markup.indexOf('class="whatif'));
    const text = textOf(whatIf);
    expect(text).toContain("Estimate only, your application is unchanged");
    expect(text).toContain("would likely meet");
    expect(text).toContain("₹3,00,000");
    expect(text).not.toContain("9,000");
    expect(whatIf).not.toContain("<table");
    expect(whatIf).not.toContain("meter");
    expect(text).not.toMatch(BANNED);
  });

  it("says wouldn't meet for anything but a likely approval", () => {
    const state = parsePublicState({ what_if: { changes: { monthly_income: 60000 }, simulated_decision: "REJECTED" } });
    const text = textOf(renderToStaticMarkup(<>{buildBlocks(state, context).map((b, i) => <div key={i}>{renderBlock(b, context)}</div>)}</>));
    expect(text).toContain("wouldn't meet");
    expect(text).not.toContain("60,000");
  });

  it("shows a refused estimate as a plain sentence, without the server's limits", () => {
    const state = parsePublicState({ what_if: { error: "credit_score must be between 300 and 900" } });
    const text = textOf(renderToStaticMarkup(<>{buildBlocks(state, context).map((b, i) => <div key={i}>{renderBlock(b, context)}</div>)}</>));
    expect(text).toContain("We couldn't work out that estimate.");
    expect(text).not.toMatch(/300|900|score/);
  });
});

describe("improvement plan", () => {
  it("gives two or three general steps with no targets or gaps", () => {
    const markup = html({
      type: "improvement_plan",
      // Raw server shape on purpose: even unparsed, only the theme survives.
      plan: [
        { rule_id: "MIN_CREDIT_SCORE", task: "Raise your credit score to 700", general_guidance: "Pay on time.", target_display: "700", gap_display: "+60" },
      ] as unknown as ImprovementTask[],
    });
    const text = textOf(markup);
    expect(markup.match(/<li/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup.match(/<li/g)?.length).toBeLessThanOrEqual(3);
    expect(text).toContain("Pay every EMI and card bill on time");
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/Target/);
    expect(text).not.toMatch(BANNED);
  });
});
