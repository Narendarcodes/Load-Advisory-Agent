import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { trailLabel, trailLines } from "./trail";
import { parseCitation, parseDecisionCard, parsePublicState } from "./schema";
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

describe("schema", () => {
  it("keeps a citation excerpt as bounded plain text", () => {
    const citation = parseCitation({ label: "S1", document_id: "D", title: "T", excerpt: "x".repeat(900) })!;
    expect(citation.excerpt!.length).toBeLessThanOrEqual(601);
    expect(parseCitation({ label: "S1", document_id: "D", title: "T", excerpt: 7 })!.excerpt).toBeNull();
  });
});

describe("activity trail", () => {
  it("words each real stage as done or in progress, and ignores unknown stages", () => {
    expect(trailLabel("load_evidence", true)).toBe("Read your recorded decision");
    expect(trailLabel("load_evidence", false)).toBe("Reading your recorded decision");
    expect(trailLabel("made_up", true)).toBeNull();
  });

  it("never adds a line per rule: the trail names the stages only", () => {
    expect(trailLines(["load_evidence", "compose"])).toEqual(["Read your recorded decision", "Wrote the explanation"]);
    expect(trailLines(["load_evidence", "made_up"]).join(" ")).not.toMatch(/\d|score|limit|minimum/i);
  });
});

describe("rendered v2 blocks", () => {
  it("draws no meter and no rule row on a recorded decision", () => {
    const markup = renderToStaticMarkup(<>{renderBlock({ type: "decision_card", card: rejectedCard() }, context)}</>);
    expect(markup).not.toContain("meter");
    expect(markup).not.toContain("Time in job");
    expect(markup).not.toMatch(/612|650|45/);
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
