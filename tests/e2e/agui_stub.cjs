#!/usr/bin/env node
/*
 * TEST-ONLY deterministic AG-UI agent stub.
 *
 * The acceptance run must not depend on a language model or GPU. This server replaces only the
 * agent upstream of the real CopilotKit runtime: the browser still goes through the Frappe page,
 * the real island bundle, the real runtime gateway (which still mints a Frappe assertion with the
 * borrower's cookie), and the island's real validation/registry/rendering path. It emits the same
 * event sequence as apps/api/src/loan_advisory/api/agui.py:
 *
 *   RUN_STARTED -> TEXT_MESSAGE_START -> (STATE_SNAPSHOT progress + TEXT_MESSAGE_CONTENT)*
 *   -> STATE_SNAPSHOT final -> TEXT_MESSAGE_END -> RUN_FINISHED      (RUN_ERROR on failure)
 *
 * Every answer is prefixed with "Acceptance fixture response" so a screenshot cannot be mistaken
 * for a live model answer. Scenario selection is by keyword in the last user message; see README.
 *
 *   node tests/e2e/agui_stub.cjs            # 127.0.0.1:8096
 */
const http = require("node:http");

const HOST = process.env.STUB_HOST || "127.0.0.1";
const PORT = Number(process.env.STUB_PORT || 8096);
const ANSWER_PREFIX = "Acceptance fixture response: ";
// Recordings slow the stream down so stacked progress is visible; defaults keep tests fast.
const STAGE_MS = Number(process.env.STUB_STAGE_MS || 120);
const CHUNK_MS = Number(process.env.STUB_CHUNK_MS || 60);

const APPLICATION = process.env.STUB_APPLICATION || "ACC-LOAP-2026-00018";

const DECISION_CARD = {
  application_ref: APPLICATION,
  decision: "REVIEW",
  recorded_outcome: "REVIEW",
  lifecycle_state: "INFO_REQUESTED",
  record_id: "DEC-FIXTURE-0001",
  policy_version: "synthetic-2026.1",
  policy_synthetic: true,
  policy_label: "Synthetic prototype policy - not the lender's real thresholds.",
  evaluated_at: "2026-11-01T09:00:00Z",
  rules: [
    {
      rule_id: "MIN_MONTHLY_INCOME",
      name: "Monthly income",
      reason_code: "INCOME_MISSING",
      result: "NOT_EVALUABLE",
      actual: "Not recorded",
      threshold: "\u2265 \u20b925,000",
      threshold_source: "synthetic",
    },
    {
      rule_id: "FOIR_MAX_45",
      name: "Existing EMIs vs income (FOIR)",
      reason_code: "INCOME_MISSING",
      result: "NOT_EVALUABLE",
      actual: "Not recorded",
      threshold: "\u2264 45%",
      threshold_source: "synthetic",
    },
    {
      rule_id: "MIN_CREDIT_SCORE",
      name: "Credit score",
      reason_code: "CREDIT_SCORE_MISSING",
      result: "NOT_EVALUABLE",
      actual: "Not recorded",
      threshold: "\u2265 650",
      threshold_source: "synthetic",
    },
    {
      rule_id: "MIN_EMPLOYMENT_TENURE",
      name: "Time in current job",
      reason_code: "EMPLOYMENT_MISSING",
      result: "NOT_EVALUABLE",
      actual: "Not recorded",
      threshold: "\u2265 6 months",
      threshold_source: "synthetic",
    },
  ],
  failed_reason_codes: [],
  missing_fields: ["monthly_income", "monthly_obligations", "credit_score"],
  flags: ["info_requested"],
};

// The rejected card the redesign screenshots use (fixture application ACC-LOAP-2026-00021).
const REJECTED_CARD = {
  ...DECISION_CARD,
  application_ref: process.env.STUB_REJECTED_APPLICATION || "ACC-LOAP-2026-00021",
  decision: "REJECTED",
  recorded_outcome: "REJECTED",
  lifecycle_state: "REJECTED",
  rules: [
    { rule_id: "FOIR_MAX_45", name: "Existing EMIs vs income (FOIR)", reason_code: "FOIR_TOO_HIGH",
      result: "FAIL", actual: "50%", threshold: "\u2264 45%", threshold_source: "synthetic" },
    { rule_id: "MIN_CREDIT_SCORE", name: "Credit score", reason_code: "CREDIT_SCORE_LOW",
      result: "FAIL", actual: "612", threshold: "\u2265 650", threshold_source: "synthetic" },
    { rule_id: "MIN_MONTHLY_INCOME", name: "Monthly income", reason_code: null,
      result: "PASS", actual: "\u20b952,000", threshold: "\u2265 \u20b925,000", threshold_source: "synthetic" },
  ],
  failed_reason_codes: ["FOIR_TOO_HIGH", "CREDIT_SCORE_LOW"],
  missing_fields: [],
  flags: [],
};

const MARKDOWN_ANSWER =
  "your application was **not approved** because two checks on the recorded decision did not pass.\n\n" +
  "### What did not pass\n\n" +
  "1. **Existing EMIs vs income:** your repayments are 50% of your income; the limit is 45%.\n" +
  "2. **Credit score:** 612 is recorded; this product needs at least 650.\n\n" +
  "### What you can do\n\n" +
  "- Pay down or close one existing loan to bring EMIs under 45%.\n" +
  "- Keep repayments on time for a few months, then check your score again.\n\n" +
  "> A what-if never changes your application. A person makes the final decision.";

const CITATIONS = [
  {
    label: "S1",
    document_id: "fixture-policy-credit",
    title: "Credit score requirement (synthetic policy excerpt)",
    section: "Eligibility",
    page: 4,
    source_url: "https://example.invalid/policy/credit",
    relationship: "synthetic fixture, not a live policy source",
    applies_to_entity: ["SME"],
  },
  {
    label: "S2",
    document_id: "fixture-policy-foir",
    title: "Fixed obligation to income ratio (synthetic policy excerpt)",
    section: "Affordability",
    page: 7,
    source_url: null,
    relationship: "synthetic fixture, not a live policy source",
  },
];

const LONG_FIELD =
  "additional_income_verification_document_for_the_co_applicant_named_on_this_application";

function stateFor(scenario) {
  const base = {
    trace_id: "trace-fixture",
    intent: "explain",
    action: "answer",
    abstained: false,
    citations: [],
    evidence_refs: ["DEC-FIXTURE-0001"],
    guard_flags: [],
  };
  switch (scenario) {
    case "valid":
      return {
        ...base,
        answer:
          ANSWER_PREFIX +
          "your application is paused because a few details are still needed before the checks can run. " +
          "The recorded decision below has not changed.",
        missing_information: ["monthly_income", "monthly_obligations", "credit_score"],
        decision_card: DECISION_CARD,
      };
    case "longtext":
      return {
        ...base,
        answer:
          ANSWER_PREFIX +
          "this turn uses a deliberately long field name to prove the card wraps instead of overflowing.",
        missing_information: ["monthly_income", LONG_FIELD],
        decision_card: DECISION_CARD,
      };
    case "malformed":
      return {
        ...base,
        answer:
          ANSWER_PREFIX +
          "this turn carries a deliberately malformed state payload; the island must drop it safely.",
        // Wrong types everywhere: a string where a list belongs, objects where strings belong,
        // and a decision card that is not an object.
        missing_information: "monthly_income",
        citations: "not-a-list",
        what_if: { changes: "not-an-object" },
        decision_card: "not-an-object",
      };
    case "unknown":
      return {
        ...base,
        answer:
          ANSWER_PREFIX +
          "this turn adds unsupported component channels; only the approved catalogue may render.",
        missing_information: ["monthly_income"],
        decision_card: DECISION_CARD,
        // Not part of the public contract. Must be ignored, never interpreted as markup.
        component: "raw_html",
        blocks: [{ type: "raw_html", html: '<img src="x" onerror="window.__fixtureXss=1">' }],
        html: '<script>window.__fixtureXss=2</script>',
      };
    case "absent_fields":
      return {
        ...base,
        answer: ANSWER_PREFIX + "the list arrived without usable field names, so nothing is shown.",
        missing_information: [null, "", 7, { field: "monthly_income" }],
        decision_card: DECISION_CARD,
      };
    case "no_missing":
      return {
        ...base,
        answer: ANSWER_PREFIX + "nothing is outstanding on this application right now.",
        missing_information: [],
        decision_card: DECISION_CARD,
      };
    case "no_key":
      return {
        ...base,
        answer: ANSWER_PREFIX + "this turn carries no missing-information field at all.",
        decision_card: DECISION_CARD,
      };
    case "citations":
      return {
        ...base,
        intent: "policy",
        answer:
          ANSWER_PREFIX +
          "the synthetic policy sets a minimum credit score and a fixed-obligation ceiling. " +
          "These passages are fixture text, not live policy.",
        citations: CITATIONS,
      };
    case "markdown":
      return {
        ...base,
        answer: ANSWER_PREFIX + MARKDOWN_ANSWER,
        decision_card: REJECTED_CARD,
      };
    case "whatif":
      return {
        ...base,
        intent: "what_if",
        action: "simulate",
        answer:
          ANSWER_PREFIX +
          "with a credit score of 720 the score check would pass, but the EMI check still would not, " +
          "so the simulated outcome stays **not approved**. Your recorded decision is unchanged.",
        decision_card: REJECTED_CARD,
        what_if: {
          changes: { credit_score: 720 },
          simulated_decision: "REJECTED",
          is_simulation: true,
          rule_results: { MIN_CREDIT_SCORE: "PASS", FOIR_MAX_45: "FAIL", MIN_MONTHLY_INCOME: "PASS" },
          failed_reason_codes: ["FOIR_TOO_HIGH"],
          original_record_unchanged: true,
          label: "Hypothetical - not your recorded decision",
        },
      };
    default:
      return {
        ...base,
        answer: ANSWER_PREFIX + "unknown fixture scenario; no structured state is attached.",
      };
  }
}

function answerText(scenario) {
  const state = stateFor(scenario);
  return typeof state.answer === "string" ? state.answer : ANSWER_PREFIX + "no answer.";
}

function scenarioOf(text) {
  const value = String(text || "").toLowerCase();
  if (value.includes("upstream failure") || value.includes("simulate failure")) return "error";
  if (value.includes("malformed")) return "malformed";
  if (value.includes("unknown component")) return "unknown";
  if (value.includes("required fields") && value.includes("absent")) return "absent_fields";
  if (value.includes("without a missing information state")) return "no_key";
  if (value.includes("no missing information")) return "no_missing";
  if (value.includes("very long")) return "longtext";
  if (value.includes("citation") || value.includes("policy source")) return "citations";
  if (value.includes("slow")) return "slow";
  if (value.includes("what if")) return "whatif";
  if (value.includes("why was this decision") || value.includes("markdown")) return "markdown";
  if (value.includes("missing")) return "valid";
  return "valid";
}

function lastUserText(input) {
  const messages = Array.isArray(input?.messages) ? input.messages : [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || message.role !== "user") continue;
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.content)) {
      return message.content.map((part) => (part && part.type === "text" ? part.text || "" : "")).join(" ");
    }
  }
  return "";
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [text];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(res, input) {
  const threadId = input.threadId || input.thread_id || "thread-fixture";
  const runId = input.runId || input.run_id || "run-fixture";
  const messageId = `msg-fixture-${Date.now().toString(36)}`;
  const question = lastUserText(input);
  const scenario = scenarioOf(question);
  const slow = scenario === "slow";

  const send = (event) => {
    if (res.writableEnded || res.destroyed) return false;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    return true;
  };
  const progress = (stage) => send({ type: "STATE_SNAPSHOT", snapshot: { progress: { stage } } });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  send({ type: "RUN_STARTED", threadId, runId });
  send({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });

  const stages = scenario === "whatif"
    ? ["authenticate", "load_evidence", "what_if", "compose"]
    : ["authenticate", "load_evidence", "compose"];
  for (const stage of stages) {
    if (!progress(stage)) return;
    await sleep(slow ? 900 : STAGE_MS);
  }

  if (scenario === "error") {
    send({ type: "RUN_ERROR", message: "simulated upstream failure", code: "fixture_error" });
    res.end();
    return;
  }

  const answer = answerText(scenario);
  for (const sentence of splitSentences(answer)) {
    if (!send({ type: "TEXT_MESSAGE_CONTENT", messageId, delta: sentence.trimEnd() + " " })) return;
    await sleep(slow ? 500 : CHUNK_MS);
  }

  send({ type: "STATE_SNAPSHOT", snapshot: { ...stateFor(scenario), request_id: runId } });
  send({ type: "TEXT_MESSAGE_END", messageId });
  send({ type: "RUN_FINISHED", threadId, runId });
  res.end();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || HOST}`);
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, fixture: "agui-stub" }));
    return;
  }
  if (req.method !== "POST" || url.pathname !== "/api/agui") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy();
  });
  req.on("end", () => {
    let input = {};
    try {
      input = JSON.parse(body || "{}");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid json" }));
      return;
    }
    run(res, input).catch((error) => {
      try {
        res.write(`data: ${JSON.stringify({ type: "RUN_ERROR", message: String(error), code: "stub_error" })}\n\n`);
      } catch {
        /* client gone */
      }
      res.end();
    });
  });
});

server.listen(PORT, HOST, () => {
  console.error(`AG-UI fixture stub on http://${HOST}:${PORT}/api/agui (test only)`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
