import type { Citation, DecisionCard, DecisionRule, ImprovementTask, WhatIf } from "../types";
import {
  bureauKindLabel,
  missingInformationItem,
  outcomeLabel,
  progressLabel,
  ruleResultLabel,
  type MissingInformationItem,
} from "./catalog";

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function fieldName(field: string): string {
  return field.replaceAll("_", " ");
}

function amount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function ApplicationContextBlock({ application }: { application: string }) {
  const name = encodeURIComponent(application);
  return (
    <div className="appctx">
      <span className="appctx__label">This conversation is about</span>
      <span className="mono appctx__ref">{application}</span>
      <span className="appctx__links">
        <a href={`/borrower/application?name=${name}`}>Open the recorded decision</a>
        <a href={`/borrower/documents?name=${name}`}>Documents</a>
      </span>
    </div>
  );
}

export function RuleEvaluationList({ rules }: { rules: DecisionRule[] }) {
  if (!rules.length) {
    return <p className="note">No rule checks are recorded on this decision.</p>;
  }
  return (
    <table className="rules">
      <caption className="sr-only">Checks recorded on this decision</caption>
      <thead>
        <tr>
          <th scope="col">Check</th>
          <th scope="col">Your recorded value</th>
          <th scope="col">Requirement</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.rule_id}>
            <th scope="row">{rule.name}</th>
            <td>{rule.actual ?? "Not recorded"}</td>
            <td>{rule.threshold ?? "Not recorded"}</td>
            <td className={`r-${rule.result}`}>{ruleResultLabel(rule.result)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DecisionCardBlock({ card }: { card: DecisionCard }) {
  const outcome = outcomeLabel(card.recorded_outcome ?? card.decision);
  return (
    <section className="card-block decision" aria-labelledby="decision-card-heading">
      <div className="card-block__head">
        <h3 id="decision-card-heading">Recorded decision</h3>
        <span className={`badge badge--${outcome.tone}`}>{outcome.label}</span>
      </div>
      <p className="note">
        Recorded for {card.application_ref ?? "this application"}. This is the decision already on file, not a new
        assessment.
      </p>
      {card.policy_synthetic ? (
        <p className="synthetic">
          <span className="badge badge--warn">Synthetic policy</span>{" "}
          {card.policy_label ?? "The thresholds on this decision are prototype assumptions, not the lender's real policy."}
        </p>
      ) : card.policy_label ? (
        <p className="note">Policy source: {card.policy_label}</p>
      ) : null}
      <RuleEvaluationList rules={card.rules} />
      {card.missing_fields.length ? (
        <p className="note">
          Checks that could not run: {card.missing_fields.map(fieldName).join(", ")}.
        </p>
      ) : null}
      {card.failed_reason_codes.length ? (
        <p className="note">Reason codes on the record: {card.failed_reason_codes.join(", ")}.</p>
      ) : null}
      {card.bureau ? (
        <div className="bureau">
          <h4>Bureau check</h4>
          <p>
            {bureauKindLabel(card.bureau.outcome_kind)}
            {card.bureau.synthetic_report ? " · synthetic report, demo data" : ""}
          </p>
          {card.bureau.review_required ? <p>A person needs to review the bureau information.</p> : null}
          {card.bureau.info_requested ? <p>More information was requested before the check could finish.</p> : null}
          {card.bureau.provider_error ? (
            <p>
              The bureau service returned an error ({card.bureau.provider_error}).{" "}
              {card.bureau.retryable ? "A retry may work later." : "This error is not marked retryable."}
            </p>
          ) : null}
          {card.bureau.score_source ? <p>Score source recorded: {card.bureau.score_source}.</p> : null}
          {card.bureau.score_conflict ? <p>The bureau report and the application disagree on the recorded score.</p> : null}
          {card.bureau.review_reason_codes?.length ? (
            <p>Review codes: {card.bureau.review_reason_codes.join(", ")}.</p>
          ) : null}
        </div>
      ) : null}
      <p className="provenance">
        {card.record_id ? `Decision record ${card.record_id}` : "Decision record"}
        {card.policy_version ? ` · policy ${card.policy_version}` : ""}
        {card.evaluated_at ? ` · evaluated ${card.evaluated_at}` : ""}
        {card.flags.length ? ` · flags: ${card.flags.join(", ")}` : ""}
      </p>
    </section>
  );
}

function CitationItem({ citation }: { citation: Citation }) {
  const href = safeUrl(citation.source_url);
  const title = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {citation.title}
    </a>
  ) : (
    citation.title
  );
  return (
    <li>
      <span className="cite-label">[{citation.label}]</span> {title}
      {citation.section ? ` · ${citation.section}` : ""}
      {citation.page ? ` · p.${citation.page}` : ""}
      {citation.relationship ? <span className="rel"> · {citation.relationship}</span> : null}
      {citation.applies_to_entity?.length ? ` · applies to: ${citation.applies_to_entity.join("/")}` : null}
    </li>
  );
}

export function PolicyCitationBlock({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <div className="cites">
      <h3>Sources</h3>
      <ul>
        {citations.map((citation) => (
          <CitationItem key={`${citation.label}-${citation.document_id}-${citation.section ?? ""}`} citation={citation} />
        ))}
      </ul>
    </div>
  );
}

export function WhatIfResultBlock({ whatIf, card }: { whatIf: WhatIf; card?: DecisionCard }) {
  if (whatIf.error) {
    return (
      <div className="whatif">
        <h3>What-if</h3>
        <p className="note">That what-if could not be run: {whatIf.error}</p>
      </div>
    );
  }
  const changes = Object.entries(whatIf.changes ?? {});
  const results = Object.entries(whatIf.rule_results ?? {});
  const recorded = new Map((card?.rules ?? []).map((rule) => [rule.rule_id, rule]));
  return (
    <div className="whatif">
      <h3>
        What-if <span className="badge badge--warn">Simulation, not your decision</span>
      </h3>
      {changes.length ? (
        <p className="note">
          With {changes.map(([field, value]) => `${fieldName(field)} = ${amount(value)}`).join(", ")}:
        </p>
      ) : null}
      {whatIf.simulated_decision ? (
        <p>
          Simulated outcome: <b>{outcomeLabel(whatIf.simulated_decision).label}</b>
          {whatIf.is_simulation === false ? "" : " (simulation only)"}
        </p>
      ) : null}
      {results.length ? (
        <table>
          <caption className="sr-only">Hypothetical rule results compared with the recorded decision</caption>
          <thead>
            <tr>
              <th scope="col">Check</th>
              {card ? <th scope="col">Recorded</th> : null}
              <th scope="col">Hypothetical</th>
            </tr>
          </thead>
          <tbody>
            {results.map(([rule, result]) => {
              const prior = recorded.get(rule);
              return (
                <tr key={rule}>
                  <th scope="row">{prior?.name ?? rule}</th>
                  {card ? <td>{prior ? ruleResultLabel(prior.result) : "Not recorded"}</td> : null}
                  <td className={`r-${result}`}>{ruleResultLabel(result)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      <p className="note">
        {whatIf.label ?? "Hypothetical result under the synthetic prototype policy; not a decision and not a guarantee."}
      </p>
      {whatIf.original_record_unchanged === true ? (
        <p className="note">Your recorded application was not changed by this simulation.</p>
      ) : null}
    </div>
  );
}

export function ImprovementPlanBlock({ plan, showHeading = true }: { plan: ImprovementTask[]; showHeading?: boolean }) {
  if (!plan.length) return null;
  return (
    <section className="plan" aria-labelledby={showHeading ? "improvement-plan-heading" : undefined}>
      {showHeading ? <h3 id="improvement-plan-heading">What could change the outcome</h3> : null}
      <ol>
        {plan.map((step) => (
          <li key={step.rule_id}>
            <p>{step.task}</p>
            {step.target_display || step.gap_display ? (
              <p className="note">
                {step.target_display ? `Target: ${step.target_display}${step.gap_display ? ` (${step.gap_display})` : ""}` : null}
              </p>
            ) : null}
            <p className="note">{step.general_guidance}</p>
          </li>
        ))}
      </ol>
      <p className="note">
        Targets are worked out from the recorded thresholds and re-checked as a what-if. Not a guarantee: a person
        decides on a new application.
      </p>
    </section>
  );
}

export function MissingInformationBlock({ items }: { items: MissingInformationItem[] }) {
  if (!items.length) return null;
  return (
    <section className="missing" aria-labelledby="missing-heading">
      <h3 id="missing-heading">Information still needed</h3>
      <ul>
        {items.map((item) => (
          <li key={item.field}>
            <b>{item.label}</b>
            <p className="note">{item.explanation}</p>
            <a href={item.href}>{item.linkLabel}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HumanAssistanceBlock({ handoffRef }: { handoffRef: string }) {
  return (
    <section className="handoff" aria-labelledby="handoff-heading">
      <h3 id="handoff-heading">Human help requested</h3>
      <p>
        A handoff reference was saved: <span className="mono">{handoffRef}</span>.
      </p>
      <p className="note">
        This records your request in this site's queue. No message has been sent to a person yet, no advisor has been
        assigned, and no external ticket has been created.
      </p>
      <p className="note">
        For a response, use the <a href="/borrower/help">help page</a> to see how to reach the lender.
      </p>
    </section>
  );
}

export function ProgressBlock({ stage }: { stage: string }) {
  const label = progressLabel(stage);
  if (!label) return null;
  return (
    <div className="progress" role="status" aria-live="polite">
      <span className="progress__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function NoticeBlock({ tone, text }: { tone: "info" | "error"; text: string }) {
  return (
    <div className={tone === "error" ? "error" : "notice"} role={tone === "error" ? "alert" : "status"}>
      <p>{text}</p>
    </div>
  );
}

export function MissingInformationList({ fields, application }: { fields: string[]; application: string }) {
  return <MissingInformationBlock items={fields.map((field) => missingInformationItem(field, application))} />;
}
