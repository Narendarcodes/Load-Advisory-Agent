import type { Citation, PublicState, WhatIf } from "./types";

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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

function WhatIfBlock({ whatIf }: { whatIf: WhatIf }) {
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
  return (
    <div className="whatif">
      <h3>
        What-if <span className="badge badge--warn">Hypothetical simulation — not a decision</span>
      </h3>
      {changes.length ? (
        <p className="note">
          With {changes.map(([field, value]) => `${field.replaceAll("_", " ")} = ${value}`).join(", ")}:
        </p>
      ) : null}
      {whatIf.simulated_decision ? (
        <p>
          Simulated outcome: <b>{whatIf.simulated_decision}</b>
          {whatIf.is_simulation === false ? "" : " (simulation only)"}
        </p>
      ) : null}
      {results.length ? (
        <table>
          <caption className="sr-only">Hypothetical rule results</caption>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Hypothetical result</th>
            </tr>
          </thead>
          <tbody>
            {results.map(([rule, result]) => (
              <tr key={rule}>
                <td>{rule}</td>
                <td className={`r-${result}`}>{result}</td>
              </tr>
            ))}
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

export function AnswerDetails({ state }: { state: PublicState }) {
  const hasMeta = state.intent || state.action || state.trace_id || state.handoff_ref || state.abstained;
  const citations = state.citations ?? [];
  const missing = state.missing_information ?? [];
  const evidence = state.evidence_refs ?? [];
  if (!hasMeta && citations.length === 0 && !state.what_if && missing.length === 0 && evidence.length === 0) {
    return null;
  }
  return (
    <section className="details" aria-labelledby="details-heading">
      <h2 id="details-heading">About the latest answer</h2>
      <div className="tags">
        {state.intent ? <span className="tag">intent: {state.intent}</span> : null}
        {state.action ? <span className="tag">action: {state.action}</span> : null}
        {state.abstained ? <span className="tag warn">abstained</span> : null}
        {state.handoff_ref ? <span className="tag">handoff {state.handoff_ref}</span> : null}
        {state.trace_id ? <span className="tag">trace {state.trace_id}</span> : null}
      </div>
      {state.abstained ? (
        <p className="note" role="status">
          The assistant did not answer this one on its own; it will not guess about your file.
        </p>
      ) : null}
      {missing.length ? <p className="note">Missing information: {missing.join(", ")}.</p> : null}
      {citations.length ? (
        <div className="cites">
          <h3>Sources</h3>
          <ul>
            {citations.map((citation) => (
              <CitationItem key={`${citation.label}-${citation.document_id}-${citation.section ?? ""}`} citation={citation} />
            ))}
          </ul>
        </div>
      ) : null}
      {evidence.length ? <p className="note">Evidence records: {evidence.join(", ")}.</p> : null}
      {state.what_if ? <WhatIfBlock whatIf={state.what_if} /> : null}
    </section>
  );
}
