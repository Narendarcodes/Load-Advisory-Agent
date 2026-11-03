import { useId } from "react";

import type { Locale } from "../types";
import type { Citation, DecisionCard, ImprovementTask, WhatIf } from "../types";
import { missingInformationItem, outcomeLabel, type MissingInformationItem } from "./catalog";
import { classify, decisionSummary, improvementSteps, lang, themeText, WHAT_IF, type ReasonSignal, type ThemeKey } from "./plain";

/*
 * Calm cards only. Nothing here renders a rule row, a meter, a threshold, a score, a rule id or a
 * per-rule result: the parsed card (schema.ts) no longer holds them. Words come from genui/plain.ts.
 */

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function rupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Hindi and Telugu copy carries its own lang so screen readers switch voice. */
function langOf(locale: Locale): string | undefined {
  return locale === "en" ? undefined : locale;
}

/** The borrower's own offer: amount, EMI and tenure. */
function OfferFacts({ card }: { card: DecisionCard }) {
  const offer = card.offer;
  if (!offer) return null;
  const rows: [string, string][] = [];
  if (offer.amount) rows.push(["Amount", rupees(offer.amount)]);
  if (offer.emi) rows.push(["Monthly EMI", rupees(offer.emi)]);
  if (offer.tenure_months) rows.push(["Tenure", `${offer.tenure_months} months`]);
  return (
    <dl className="offer-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ThemeList({ themes, locale }: { themes: ThemeKey[]; locale: Locale }) {
  if (!themes.length) return null;
  return (
    <ul className="reason-themes" lang={langOf(locale)}>
      {themes.slice(0, 3).map((key) => (
        <li key={key}>{themeText(key, locale)}</li>
      ))}
    </ul>
  );
}

export function DecisionCardBlock({ card, locale = "en" }: { card: DecisionCard; locale?: string }) {
  const language = lang(locale);
  const code =
    card.lifecycle_state === "INFO_REQUESTED"
      ? "INFO_REQUESTED"
      : (card.recorded_outcome ?? card.decision ?? card.lifecycle_state ?? "").toUpperCase();
  const outcome = outcomeLabel(card.recorded_outcome ?? card.decision);
  const summary = decisionSummary(code, language);
  const approved = code === "APPROVED";
  const showThemes = code === "REJECTED" || code === "REVIEW" || code === "MANUAL_REVIEW";
  // A conversation can hold several decision cards: each gets its own id and is a labelled group, not a
  // landmark, so repeated cards never produce duplicate landmarks.
  const heading = `decision-card-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className="card-block decision" role="group" aria-labelledby={heading}>
      <div className="card-block__head">
        <h3 id={heading}>Your decision</h3>
        <span className={`badge badge--${outcome.tone}`}>{outcome.label}</span>
      </div>
      {summary ? (
        <p className="decision__summary" lang={langOf(language)}>
          {summary}
        </p>
      ) : null}
      {approved ? <OfferFacts card={card} /> : null}
      {showThemes ? <ThemeList themes={card.themes} locale={language} /> : null}
      <p className="note">
        {card.policy_synthetic ? "Demo data. " : ""}This is the decision already on file, not a new assessment.
      </p>
    </div>
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

export function WhatIfResultBlock({
  whatIf,
  onAdjust,
  locale = "en",
}: {
  whatIf: WhatIf;
  card?: DecisionCard;
  onAdjust?: () => void;
  locale?: string;
}) {
  const copy = WHAT_IF[lang(locale)];
  const english = WHAT_IF.en;
  return (
    <div className="whatif">
      <div className="whatif__head">
        <h3>What-if</h3>
        <span className="badge badge--neutral">{english.label}</span>
      </div>
      {whatIf.error ? (
        <p className="note" lang={langOf(lang(locale))}>
          {copy.error}
        </p>
      ) : (
        <>
          {whatIf.amount ? (
            <p className="whatif__amount">
              <span className="whatif__label">Loan amount</span> <b>{rupees(whatIf.amount)}</b>
            </p>
          ) : null}
          {whatIf.meets !== null ? (
            <p className="whatif__outcome" lang={langOf(lang(locale))}>
              {whatIf.meets ? copy.meet : copy.miss}
            </p>
          ) : null}
        </>
      )}
      {lang(locale) !== "en" ? (
        <p className="note" lang={lang(locale)}>
          {copy.label}
        </p>
      ) : null}
      {onAdjust ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onAdjust}>
          Try other numbers
        </button>
      ) : null}
    </div>
  );
}

export function ImprovementPlanBlock({
  plan,
  showHeading = true,
  locale = "en",
}: {
  plan: ImprovementTask[];
  showHeading?: boolean;
  locale?: string;
}) {
  const id = useId();
  if (!plan.length) return null;
  const language = lang(locale);
  const heading = `improvement-plan-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const steps = improvementSteps(
    // A step that skipped the parser (raw server shape) is still reduced to its theme here.
    plan.map((step) => step.theme ?? classify(step as unknown as ReasonSignal)),
    language,
  );
  return (
    <div className="plan" role="group" aria-labelledby={showHeading ? heading : undefined}>
      {showHeading ? <h3 id={heading}>What could help</h3> : null}
      <ol lang={langOf(language)}>
        {steps.map((step) => (
          <li key={step}>
            <p>{step}</p>
          </li>
        ))}
      </ol>
      <p className="note">General guidance, not a promise. A person decides on a new application.</p>
    </div>
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
      <div className="handoff__head">
        <img className="handoff__art" src="/assets/loan_advisory_portal/illustrations/handoff.svg" alt="" width={96} height={72} />
        <h3 id="handoff-heading">Human help requested</h3>
      </div>
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
