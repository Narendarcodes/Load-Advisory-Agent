import { useState, type FormEvent } from "react";

import type { DecisionCard } from "./types";

/**
 * The four fields a borrower may change in an estimate (owner decision ADR-0005/Q-03): loan amount, tenure,
 * existing EMIs and income. The credit score and months in the job are not editable, so an estimate can
 * never be used to probe a cut-off. The form sends a normal question through the existing agent run; the
 * server re-validates every value. Nothing is computed here, and no recorded value is shown.
 */
const FIELDS = [
  {
    key: "loan_amount",
    label: "Loan amount",
    hint: "In rupees",
    min: 1,
    max: 100_000_000,
    integer: true,
    phrase: (value: number) => `I borrowed ${value}`,
  },
  {
    key: "tenure_months",
    label: "Repayment period",
    hint: "In months",
    min: 1,
    max: 600,
    integer: true,
    phrase: (value: number) => `the repayment period was ${value} months`,
  },
  {
    key: "monthly_obligations",
    label: "Existing EMIs",
    hint: "Total per month, in rupees",
    min: 0,
    max: 100_000_000,
    integer: false,
    phrase: (value: number) => `my existing EMIs were ${value}`,
  },
  {
    key: "monthly_income",
    label: "Monthly income",
    hint: "In rupees",
    min: 1,
    max: 100_000_000,
    integer: false,
    phrase: (value: number) => `my monthly income was ${value}`,
  },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];
type Values = Partial<Record<FieldKey, string>>;

/** The exact question a form submission sends, kept pure so the phrasing is testable. */
export function whatIfQuestion(values: Values): string | null {
  const parts: string[] = [];
  for (const field of FIELDS) {
    const raw = values[field.key]?.trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    parts.push(field.phrase(value));
  }
  if (!parts.length) return null;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `What if ${list}?`;
}

function validate(values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of FIELDS) {
    const raw = values[field.key]?.trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[field.key] = "Enter a number.";
    } else if (field.integer && !Number.isInteger(value)) {
      errors[field.key] = "Use a whole number.";
    } else if (value < field.min || value > field.max) {
      errors[field.key] = field.min > 0 ? "Enter a number above zero." : "Enter zero or more.";
    }
  }
  return errors;
}

interface WhatIfFormProps {
  disabled: boolean;
  recorded?: DecisionCard;
  onAsk: (question: string) => void;
}

export function WhatIfForm({ disabled, onAsk }: WhatIfFormProps) {
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const question = whatIfQuestion(values);
    if (!question) {
      setFormError("Enter at least one number to try.");
      return;
    }
    if (Object.keys(found).length) {
      setFormError("Check the values marked below.");
      return;
    }
    setFormError(null);
    onAsk(question);
  }

  return (
    <section className="whatif-form" aria-labelledby="whatif-form-heading">
      <h3 id="whatif-form-heading">Try a what-if</h3>
      <p className="note">Estimate only, your application is unchanged.</p>
      <form noValidate onSubmit={submit}>
        <div className="whatif-form__fields">
          {FIELDS.map((field) => {
            const error = errors[field.key];
            const describedBy = [`${field.key}-hint`, error ? `${field.key}-error` : null]
              .filter(Boolean)
              .join(" ");
            return (
              <div className="field" key={field.key}>
                <label htmlFor={`whatif-${field.key}`}>{field.label}</label>
                <input
                  id={`whatif-${field.key}`}
                  type="number"
                  inputMode={field.integer ? "numeric" : "decimal"}
                  min={field.min}
                  max={field.max}
                  step={field.integer ? 1 : "any"}
                  value={values[field.key] ?? ""}
                  disabled={disabled}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  onChange={(event) => {
                    const next = event.target.value;
                    setValues((current) => ({ ...current, [field.key]: next }));
                    setFormError(null);
                  }}
                />
                <p className="hint" id={`${field.key}-hint`}>
                  {field.hint}
                </p>
                {error ? (
                  <p className="field-error" id={`${field.key}-error`} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        {formError ? (
          <p className="field-error" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="form-actions">
          <button type="submit" className="btn btn--sm" disabled={disabled}>
            Run what-if
          </button>
        </div>
      </form>
    </section>
  );
}
