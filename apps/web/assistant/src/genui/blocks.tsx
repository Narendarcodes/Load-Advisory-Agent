import type { Citation, DecisionCard, DecisionRule, ImprovementTask, WhatIf } from "../types";
import {
  bureauKindLabel,
  missingInformationItem,
  outcomeLabel,
  progressLabel,
  ruleResultLabel,
  type MissingInformationItem,
} from "./catalog";
import { meterModel, whatIfComparisons, type MeterModel } from "./meter";

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
    <ul className="rule-list" aria-label="Checks recorded on this decision">
      {rules.map((rule) => (
        <RuleRow key={rule.rule_id} rule={rule} />
      ))}
    </ul>
  );
}

/** The UI owns the words: "Existing EMIs vs income (FOIR)" shows without the acronym. */
export function ruleName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "") || name;
}

function resultTone(result: string): "ok" | "bad" | "neutral" {
  if (result === "PASS") return "ok";
  if (result === "FAIL") return "bad";
  return "neutral";
}

/** A horizontal scale with the recorded value and the policy limit. Decorative; the text says it all. */
export function Meter({ model }: { model: MeterModel }) {
  const passSide =
    model.direction === "at_least"
      ? { left: `${model.limitPct}%`, width: `${100 - model.limitPct}%` }
      : { left: "0%", width: `${model.limitPct}%` };
  return (
    <span className="meter" aria-hidden="true">
      <span className="meter__track">
        <span className="meter__ok" style={passSide} />
        <span className="meter__limit" style={{ left: `${model.limitPct}%` }} />
        <span className={`meter__value meter__value--${model.passes ? "ok" : "bad"}`} style={{ left: `${model.valuePct}%` }} />
      </span>
    </span>
  );
}

function RuleRow({ rule }: { rule: DecisionRule }) {
  const model = meterModel(rule);
  const tone = resultTone(rule.result);
  return (
    <li className="rule-row">
      <div className="rule-row__head">
        <span className="rule-row__name">{ruleName(rule.name)}</span>
        <span className={`badge badge--${tone}`}>{ruleResultLabel(rule.result)}</span>
      </div>
      {model ? (
        <>
          <Meter model={model} />
          <p className="rule-row__figures">
            <span>
              Yours <b>{model.valueLabel}</b>
            </span>
            <span>
              {model.direction === "at_least" ? "Minimum" : "Limit"} <b>{model.limitLabel}</b>
            </span>
          </p>
        </>
      ) : (
        <p className="rule-row__figures">
          <span>
            Yours <b>{rule.actual ?? "Not recorded"}</b>
          </span>
          <span>
            Requirement <b>{rule.threshold ?? "Not recorded"}</b>
          </span>
        </p>
      )}
    </li>
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
        Recorded for {card.application_ref ?? "this application"}. These are the figures on the decision already on
        file, not a new assessment.
      </p>
      <RuleEvaluationList rules={card.rules} />
      {card.missing_fields.length ? (
        <p className="note">Checks that could not run: {card.missing_fields.map(fieldName).join(", ")}.</p>
      ) : null}
      {card.policy_synthetic ? (
        <p className="synthetic">
          <span className="badge badge--warn">Synthetic policy</span>{" "}
          {card.policy_label ?? "The thresholds on this decision are prototype assumptions, not the lender's real policy."}
        </p>
      ) : card.policy_label ? (
        <p className="note">Policy source: {card.policy_label}</p>
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
      <details className="record-details">
        <summary>Record details</summary>
        {card.failed_reason_codes.length ? (
          <p className="note">Reason codes on the record: {card.failed_reason_codes.join(", ")}.</p>
        ) : null}
        <p className="provenance">
          {card.record_id ? `Decision record ${card.record_id}` : "Decision record"}
          {card.policy_version ? ` · policy ${card.policy_version}` : ""}
          {card.evaluated_at ? ` · evaluated ${card.evaluated_at}` : ""}
          {card.flags.length ? ` · flags: ${card.flags.join(", ")}` : ""}
        </p>
      </details>
    </section>
  );
}

function CitationChip({ citation }: { citation: Citation }) {
  const href = safeUrl(citation.source_url);
  const where = [citation.section ? `Section ${citation.section}` : null, citation.page ? `page ${citation.page}` : null]
    .filter(Boolean)
    .join(", ");
  return (
    <li>
      <details className="source-chip">
        <summary>
          <span className="source-chip__label">{citation.label}</span>
          <span className="source-chip__title">{citation.title}</span>
        </summary>
        <div className="source-chip__body">
          {citation.excerpt ? (
            <blockquote className="source-chip__quote">{citation.excerpt}</blockquote>
          ) : (
            <p className="note">No excerpt was sent with this source.</p>
          )}
          <p className="note">
            {where ? `${where}. ` : ""}
            {citation.relationship ? `${citation.relationship}. ` : ""}
            {citation.applies_to_entity?.length ? `Applies to: ${citation.applies_to_entity.join(", ")}.` : ""}
          </p>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              Open the source document
            </a>
          ) : null}
        </div>
      </details>
    </li>
  );
}

export function PolicyCitationBlock({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <div className="cites">
      <h3>Sources</h3>
      <ul className="source-chips">
        {citations.map((citation) => (
          <CitationChip key={`${citation.label}-${citation.document_id}-${citation.section ?? ""}`} citation={citation} />
        ))}
      </ul>
    </div>
  );
}

function formatNumber(field: string, value: number): string {
  if (field === "monthly_income" || field === "monthly_obligations") return `₹${amount(value)}`;
  return amount(value);
}

export function WhatIfResultBlock({ whatIf, card, onAdjust }: { whatIf: WhatIf; card?: DecisionCard; onAdjust?: () => void }) {
  if (whatIf.error) {
    return (
      <div className="whatif">
        <h3>What-if</h3>
        <p className="note">That what-if could not be run: {whatIf.error}</p>
      </div>
    );
  }
  const rows = whatIfComparisons(whatIf, card);
  const results = Object.entries(whatIf.rule_results ?? {});
  const recorded = new Map((card?.rules ?? []).map((rule) => [rule.rule_id, rule]));
  const simulated = whatIf.simulated_decision ? outcomeLabel(whatIf.simulated_decision) : null;
  const recordedOutcome = card ? outcomeLabel(card.recorded_outcome ?? card.decision) : null;
  return (
    <div className="whatif">
      <div className="whatif__head">
        <h3>What-if</h3>
        <span className="badge badge--warn">Simulation, not your decision</span>
      </div>
      {rows.length ? (
        <ul className="whatif__changes">
          {rows.map((row) => {
            const model = row.rule ? meterModel(row.rule) : null;
            const afterPct = model ? Math.min(100, Math.max(0, ((row.after - model.min) / (model.max - model.min)) * 100)) : null;
            return (
              <li key={row.field} className="whatif__change">
                <p className="whatif__figures">
                  <span className="whatif__label">{row.label}</span>
                  <span>
                    {row.before !== null ? (
                      <>
                        <span className="whatif__before">{formatNumber(row.field, row.before)}</span>
                        <span aria-hidden="true"> → </span>
                        <span className="sr-only"> changed to </span>
                      </>
                    ) : (
                      <span className="whatif__before">set to </span>
                    )}
                    <b>{formatNumber(row.field, row.after)}</b>
                  </span>
                </p>
                {model && afterPct !== null ? (
                  <>
                  <span className="meter meter--whatif" aria-hidden="true">
                    <span className="meter__track">
                      <span className="meter__limit" style={{ left: `${model.limitPct}%` }} />
                      <span className="meter__value meter__value--before" style={{ left: `${model.valuePct}%` }} />
                      <span
                        className={`meter__value meter__value--${row.simulated === "PASS" ? "ok" : "bad"}`}
                        style={{ left: `${afterPct}%` }}
                      />
                    </span>
                  </span>
                  <p className="rule-row__figures">
                    <span>Recorded and simulated, on the same scale</span>
                    <span>
                      {model.direction === "at_least" ? "Minimum" : "Limit"} <b>{model.limitLabel}</b>
                    </span>
                  </p>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {results.length ? (
        <table className="whatif__table">
          <caption className="sr-only">Hypothetical rule results compared with the recorded decision</caption>
          <thead>
            <tr>
              <th scope="col">Check</th>
              {card ? <th scope="col">Recorded</th> : null}
              <th scope="col">Simulation</th>
            </tr>
          </thead>
          <tbody>
            {results.map(([rule, result]) => {
              const prior = recorded.get(rule);
              return (
                <tr key={rule}>
                  <th scope="row">{prior ? ruleName(prior.name) : rule}</th>
                  {card ? (
                    <td>
                      {prior ? <span className={`badge badge--${resultTone(prior.result)}`}>{ruleResultLabel(prior.result)}</span> : "Not recorded"}
                    </td>
                  ) : null}
                  <td>
                    <span className={`badge badge--${resultTone(result)}`}>{ruleResultLabel(result)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      {simulated ? (
        <p className="whatif__outcome">
          {recordedOutcome ? (
            <>
              Recorded outcome <b>{recordedOutcome.label}</b> ·{" "}
            </>
          ) : null}
          Simulated outcome <b>{simulated.label}</b>
          {whatIf.is_simulation === false ? "" : " (simulation only)"}
        </p>
      ) : null}
      <p className="note">
        {whatIf.label ?? "Hypothetical result under the synthetic prototype policy; not a decision and not a guarantee."}
      </p>
      {whatIf.original_record_unchanged === true ? (
        <p className="note">Your recorded application was not changed by this simulation.</p>
      ) : null}
      {onAdjust ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onAdjust}>
          Try other numbers
        </button>
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
      <ul className="action-rows">
        {items.map((item) => (
          <li key={item.field} className="action-row">
            <div className="action-row__text">
              <b>{item.label}</b>
              <p className="note">{item.explanation}</p>
            </div>
            <a className="action-row__action" href={item.href}>
              {item.linkLabel}
            </a>
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
      <ul className="action-rows">
        <li className="action-row">
          <div className="action-row__text">
            <b>
              Reference <span className="mono">{handoffRef}</span>
            </b>
            <p className="note">
              This records your request in this site's queue. No message has been sent to a person yet, no advisor has
              been assigned, and no external ticket has been created.
            </p>
          </div>
          <a className="action-row__action" href="/borrower/help">
            See how to reach the lender
          </a>
        </li>
      </ul>
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
