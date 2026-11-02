import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { meterModel, whatIfComparisons } from "./meter";
import { ruleTrailLines, trailLabel } from "./trail";
import { parseCitation, parseDecisionCard, parseDecisionRule, parsePublicState } from "./schema";
import { buildBlocks, renderBlock, type GenUiContext } from "./registry";

const context: GenUiContext = { application: "ACC-1", busy: false, onAsk: () => {} };

const FOIR = {
  rule_id: "FOIR_MAX_45",
  name: "Existing EMIs vs income",
  result: "FAIL",
  actual: "50.0%",
  threshold: "≤ 45.0%",
  actual_value: 0.5,
  threshold_value: 0.45,
  operator: "<=",
};
const SCORE = {
  rule_id: "MIN_CREDIT_SCORE",
  name: "Credit score",
  result: "FAIL",
  actual: "612",
  threshold: "≥ 650",
  actual_value: 612,
  threshold_value: 650,
  operator: ">=",
};

function rejectedCard() {
  return parseDecisionCard({
    application_ref: "ACC-1",
    decision: "REJECTED",
    recorded_outcome: "REJECTED",
    policy_synthetic: true,
    rules: [FOIR, SCORE, { rule_id: "MIN_EMPLOYMENT_TENURE", name: "Time in job", result: "NOT_EVALUABLE", actual: "missing", threshold: "≥ 6 months", threshold_value: 6, operator: ">=" }],
  })!;
}

describe("schema: v2 additive fields", () => {
  it("keeps the engine numbers and operator on a rule row, and drops anything malformed", () => {
    const rule = parseDecisionRule(FOIR)!;
    expect([rule.actual_value, rule.threshold_value, rule.operator]).toEqual([0.5, 0.45, "<="]);
    const bad = parseDecisionRule({ ...FOIR, actual_value: "0.5", threshold_value: Number.NaN, operator: "==" })!;
    expect([bad.actual_value, bad.threshold_value, bad.operator]).toEqual([null, null, null]);
  });

  it("keeps a citation excerpt as bounded plain text", () => {
    const citation = parseCitation({ label: "S1", document_id: "D", title: "T", excerpt: "x".repeat(900) })!;
    expect(citation.excerpt!.length).toBeLessThanOrEqual(601);
    expect(parseCitation({ label: "S1", document_id: "D", title: "T", excerpt: 7 })!.excerpt).toBeNull();
  });
});

describe("meterModel", () => {
  it("places a ceiling rule's value and limit on one scale and says which side passes", () => {
    const model = meterModel(parseDecisionRule(FOIR)!)!;
    expect(model.passes).toBe(false);
    expect(model.direction).toBe("at_most");
    expect(model.valuePct).toBeGreaterThan(model.limitPct);
    expect(model.valueLabel).toBe("50.0%");
    expect(model.limitLabel).toBe("45.0%");
  });

  it("uses the 300 to 900 bureau range for a credit score", () => {
    const model = meterModel(parseDecisionRule(SCORE)!)!;
    expect(model.min).toBe(300);
    expect(model.max).toBe(900);
    expect(model.valuePct).toBeCloseTo(((612 - 300) / 600) * 100, 5);
    expect(model.limitPct).toBeCloseTo(((650 - 300) / 600) * 100, 5);
    expect(model.direction).toBe("at_least");
  });

  it("draws nothing for a rule the engine did not evaluate or without an operator", () => {
    expect(meterModel(parseDecisionRule({ ...SCORE, actual_value: null })!)).toBeNull();
    expect(meterModel(parseDecisionRule({ ...SCORE, operator: undefined })!)).toBeNull();
    expect(meterModel(parseDecisionRule({ rule_id: "X", result: "PASS" })!)).toBeNull();
  });

  it("reports pass from the recorded result, never recomputes it", () => {
    const model = meterModel(parseDecisionRule({ ...SCORE, result: "PASS" })!)!;
    expect(model.passes).toBe(true);
  });
});

describe("whatIfComparisons", () => {
  it("pairs a changed field with its recorded rule value and the simulated result", () => {
    const rows = whatIfComparisons(
      { changes: { credit_score: 720 }, rule_results: { MIN_CREDIT_SCORE: "PASS", FOIR_MAX_45: "FAIL" } },
      rejectedCard(),
    );
    expect(rows).toEqual([
      expect.objectContaining({ field: "credit_score", label: "Credit score", before: 612, after: 720, recorded: "FAIL", simulated: "PASS" }),
    ]);
  });

  it("does not invent a before value for a field with no single recorded rule", () => {
    const rows = whatIfComparisons({ changes: { monthly_obligations: 9000 }, rule_results: { FOIR_MAX_45: "PASS" } }, rejectedCard());
    expect(rows[0].before).toBeNull();
    expect(rows[0].after).toBe(9000);
  });
});

describe("activity trail", () => {
  it("words each real stage as done or in progress, and ignores unknown stages", () => {
    expect(trailLabel("load_evidence", true)).toBe("Read your recorded decision");
    expect(trailLabel("load_evidence", false)).toBe("Reading your recorded decision");
    expect(trailLabel("made_up", true)).toBeNull();
  });

  it("adds one line per evaluated rule with the recorded figures", () => {
    const lines = ruleTrailLines(rejectedCard());
    expect(lines).toEqual([
      "Compared existing EMIs vs income: 50.0% against a limit of 45.0% (not met)",
      "Compared credit score: 612 against a minimum of 650 (not met)",
    ]);
  });
});

describe("rendered v2 blocks", () => {
  it("draws a meter per evaluated rule and lists unevaluated ones without a bar", () => {
    const markup = renderToStaticMarkup(<>{renderBlock({ type: "decision_card", card: rejectedCard() }, context)}</>);
    expect(markup.match(/class="meter"/g)?.length).toBe(2);
    expect(markup).toContain("Time in job");
    expect(markup).toContain("Not checked");
  });

  it("renders citations as expandable chips that show the excerpt as text", () => {
    const state = parsePublicState({
      citations: [{ label: "S1", document_id: "D", title: "Credit rules", section: "4", excerpt: "<b>Score</b> of 650 or more." }],
    });
    const markup = renderToStaticMarkup(<>{buildBlocks(state, context).map((b, i) => <div key={i}>{renderBlock(b, context)}</div>)}</>);
    expect(markup).toContain("<details");
    expect(markup).toContain("Credit rules");
    expect(markup).toContain("&lt;b&gt;Score&lt;/b&gt; of 650 or more.");
    expect(markup).not.toContain("<b>Score</b>");
  });

  it("shows a citation without an excerpt honestly", () => {
    const state = parsePublicState({ citations: [{ label: "S2", document_id: "D2", title: "Affordability" }] });
    const markup = renderToStaticMarkup(<>{buildBlocks(state, context).map((b, i) => <div key={i}>{renderBlock(b, context)}</div>)}</>);
    expect(markup).toContain("No excerpt was sent with this source.");
  });
});
