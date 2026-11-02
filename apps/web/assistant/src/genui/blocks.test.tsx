import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { PublicState } from "../types";
import { missingInformationItem } from "./catalog";
import { buildBlocks, renderBlock, type GenUiBlock, type GenUiContext } from "./registry";
import { parseDecisionCard, parsePublicState } from "./schema";

const context: GenUiContext = { application: "LA-2026-00001", busy: false, onAsk: () => {} };

function html(block: Parameters<typeof renderBlock>[0]) {
  return renderToStaticMarkup(<>{renderBlock(block, context)}</>);
}

function card(state: "APPROVED" | "REJECTED" | "REVIEW", overrides: Record<string, unknown> = {}) {
  return parseDecisionCard({
    application_ref: "LA-2026-00001",
    decision: state,
    recorded_outcome: state,
    record_id: "DEC-0001",
    policy_version: "synthetic-v1",
    policy_synthetic: true,
    policy_label: "synthetic prototype policy (synthetic-v1)",
    evaluated_at: "2026-10-01T10:00:00Z",
    rules: [
      {
        rule_id: "MIN_CREDIT_SCORE",
        name: "Credit score",
        result: state === "APPROVED" ? "PASS" : state === "REVIEW" ? "NOT_EVALUABLE" : "FAIL",
        actual: state === "REVIEW" ? "missing" : "640",
        threshold: "≥ 700",
        threshold_source: "synthetic",
      },
    ],
    failed_reason_codes: state === "REJECTED" ? ["MIN_CREDIT_SCORE"] : [],
    missing_fields: state === "REVIEW" ? ["monthly_income"] : [],
    flags: state === "REJECTED" ? ["SYNTHETIC_POLICY"] : [],
    ...overrides,
  })!;
}

describe("DecisionCardBlock", () => {
  it("renders an approved record with its rules and provenance, never as a new assessment", () => {
    const markup = html({ type: "decision_card", card: card("APPROVED") });
    expect(markup).toContain("Recorded decision");
    expect(markup).toContain("Approved");
    expect(markup).toContain("Recorded for LA-2026-00001");
    expect(markup).toContain("not a new");
    expect(markup).toContain("Credit score");
    expect(markup).toContain("Met");
    expect(markup).toContain("Synthetic policy");
    expect(markup).toContain("Decision record DEC-0001");
    expect(markup).toContain("policy synthetic-v1");
  });

  it("renders a rejected record with the recorded reason codes", () => {
    const markup = html({ type: "decision_card", card: card("REJECTED") });
    expect(markup).toContain("Not approved");
    expect(markup).toContain("Not met");
    expect(markup).toContain("Reason codes on the record: MIN_CREDIT_SCORE");
    expect(markup).toContain("flags: SYNTHETIC_POLICY");
  });

  it("renders a review record and the fields that could not be checked", () => {
    const markup = html({ type: "decision_card", card: card("REVIEW") });
    expect(markup).toContain("Needs review");
    expect(markup).toContain("Not checked");
    expect(markup).toContain("Checks that could not run: monthly income");
  });

  it("shows bureau evidence only when the record carries it", () => {
    const withBureau = html({
      type: "decision_card",
      card: card("REVIEW", {
        bureau: {
          outcome_kind: "PROVIDER_FAILURE",
          provider_error: "BUREAU_TIMEOUT",
          retryable: true,
          synthetic_report: true,
        },
      }),
    });
    expect(withBureau).toContain("Bureau service could not be reached");
    expect(withBureau).toContain("BUREAU_TIMEOUT");
    expect(withBureau).toContain("retry may work later");
    expect(withBureau).toContain("synthetic report, demo data");
    expect(html({ type: "decision_card", card: card("APPROVED") })).not.toContain("Bureau check");
  });

  it("renders nothing when the snapshot carries no card, including an unreadable one", () => {
    expect(buildBlocks({}, context)).toEqual([]);
    expect(buildBlocks(parsePublicState({ decision_card: null }), context)).toEqual([]);
    expect(buildBlocks(parsePublicState({ decision_card: { application_ref: "LA-1" } }), context)).toEqual([]);
  });
});

describe("typed registry", () => {
  it("drops a block type that is not in the approved catalogue", () => {
    const forged = { type: "freeform_html", html: "<img src=x onerror=alert(1)>" } as unknown as GenUiBlock;
    expect(renderBlock(forged, context)).toBeNull();
    expect(
      buildBlocks(parsePublicState({ blocks: [{ type: "freeform_html", html: "<script>" }] }), context),
    ).toEqual([]);
  });

  it("renders the application context with links to real portal routes", () => {
    const markup = html({ type: "application_context", application: "LA-2026-00001" });
    expect(markup).toContain("/borrower/application?name=LA-2026-00001");
    expect(markup).toContain("/borrower/documents?name=LA-2026-00001");
    expect(markup).toContain("This conversation is about");
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
});

describe("missing information", () => {
  it("shows a label and explanation and links to the application's correction form", () => {
    const state = parsePublicState({ missing_information: ["monthly_income", "credit_score"] });
    const blocks = buildBlocks(state, context);
    expect(blocks.map((block) => block.type)).toEqual(["missing_information"]);
    const markup = renderToStaticMarkup(<>{blocks.map((block, index) => <div key={index}>{renderBlock(block, context)}</div>)}</>);
    expect(markup).toContain("Monthly income");
    expect(markup).toContain("Credit score");
    expect(markup).toContain("/borrower/application?name=LA-2026-00001#info-request");
    expect(markup).toContain("Correct this in your application");
  });

  it("sends identity confirmations to the help page instead of inventing a KYC route", () => {
    const item = missingInformationItem("applicant_id", "LA-2026-00001");
    expect(item.href).toBe("/borrower/help");
    expect(item.linkLabel).toMatch(/resolve/);
  });
});

describe("truthful progress", () => {
  it("labels only the allowlisted graph nodes and ignores anything else", () => {
    expect(html({ type: "progress", stage: "load_evidence" })).toContain("Loading the decision record");
    expect(html({ type: "progress", stage: "thinking_hard" })).toBe("");
    expect(html({ type: "progress", stage: "" })).toBe("");
  });

  it("does not invent tool-call output", () => {
    const markup = html({ type: "progress", stage: "retrieve_policy" });
    expect(markup).toContain('role="status"');
    expect(markup).not.toMatch(/tool|argument/i);
  });
});

describe("what-if result", () => {
  it("compares the recorded result with the hypothetical one and keeps the record unchanged", () => {
    const decision = card("REJECTED");
    const state: PublicState = parsePublicState({
      decision_card: decision,
      what_if: {
        changes: { credit_score: 720 },
        simulated_decision: "APPROVED",
        is_simulation: true,
        rule_results: { MIN_CREDIT_SCORE: "PASS" },
        original_record_unchanged: true,
      },
    });
    const markup = renderToStaticMarkup(<>{buildBlocks(state, context).map((block, index) => <div key={index}>{renderBlock(block, context)}</div>)}</>);
    expect(markup).toContain("Simulation, not your decision");
    // v2: a before/after row per changed field (no engine number on this card, so no "before").
    expect(markup).toContain("Credit score");
    expect(markup).toMatch(/set to <\/span><b>720<\/b>/);
    expect(markup).toContain("<b>720</b>");
    expect(markup).toContain("Recorded");
    expect(markup).toContain("Not met");
    expect(markup).toContain("Met");
    expect(markup).toContain("Simulated outcome");
    expect(markup).toContain("Approved");
    expect(markup).toContain("was not changed");
  });

  it("shows a refused simulation as a plain error", () => {
    const state = parsePublicState({ what_if: { error: "credit_score must be between 300 and 900" } });
    const markup = renderToStaticMarkup(<>{buildBlocks(state, context).map((block, index) => <div key={index}>{renderBlock(block, context)}</div>)}</>);
    expect(markup).toContain("could not be run");
    expect(markup).toContain("between 300 and 900");
  });
});
