import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DecisionCard } from "./types";
import { WhatIfForm, whatIfQuestion } from "./what-if-form";
import { parseDecisionCard } from "./genui/schema";

const recorded = parseDecisionCard({
  application_ref: "LA-2026-00001",
  recorded_outcome: "REJECTED",
  policy_synthetic: true,
  rules: [
    { rule_id: "MIN_CREDIT_SCORE", name: "Credit score", result: "FAIL", actual: "640", threshold: "≥ 700" },
    { rule_id: "MIN_MONTHLY_INCOME", name: "Monthly income", result: "PASS", actual: "₹45,000", threshold: "≥ ₹40,000" },
  ],
}) as DecisionCard;

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement | undefined;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

async function mount(props: { disabled?: boolean; onAsk?: (question: string) => void } = {}) {
  const onAsk = props.onAsk ?? vi.fn();
  await act(async () => {
    root = createRoot(container!);
    root.render(<WhatIfForm disabled={Boolean(props.disabled)} recorded={recorded} onAsk={onAsk} />);
  });
  return { onAsk, element: container! };
}

function submit(element: HTMLElement) {
  element.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("whatIfQuestion", () => {
  it("asks a single field as a what-if question", () => {
    expect(whatIfQuestion({ loan_amount: "300000" })).toBe("What if I borrowed 300000?");
    expect(whatIfQuestion({ tenure_months: "48" })).toBe("What if the repayment period was 48 months?");
  });

  it("joins several changes in one sentence the intent parser can recognise", () => {
    expect(whatIfQuestion({ loan_amount: "300000", monthly_income: "45000", monthly_obligations: "12000" })).toBe(
      "What if I borrowed 300000, my existing EMIs were 12000 and my monthly income was 45000?",
    );
  });

  it("ignores fields that are not editable in an estimate, and returns null when nothing usable was entered", () => {
    expect(whatIfQuestion({ credit_score: "720", employment_months: "36" } as never)).toBeNull();
    expect(whatIfQuestion({})).toBeNull();
    expect(whatIfQuestion({ loan_amount: "  " })).toBeNull();
    expect(whatIfQuestion({ loan_amount: "lots" })).toBeNull();
  });
});

describe("WhatIfForm", () => {
  it("offers exactly loan amount, tenure, existing EMIs and income; never the credit score", async () => {
    const { element } = await mount();
    const ids = [...element.querySelectorAll("input")].map((input) => input.id);
    expect(ids).toEqual(["whatif-loan_amount", "whatif-tenure_months", "whatif-monthly_obligations", "whatif-monthly_income"]);
    expect(element.textContent).not.toMatch(/credit score|score|Recorded:|640|700/i);
    expect(element.textContent).toContain("Estimate only, your application is unchanged");
  });

  it("refuses an empty submission", async () => {
    const { element, onAsk } = await mount();
    await act(async () => submit(element));
    expect(onAsk).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/at least one number/i);
  });

  it("validates values before anything is sent to the agent", async () => {
    const { element, onAsk } = await mount();
    await act(async () => type(element.querySelector("#whatif-tenure_months") as HTMLInputElement, "12.5"));
    await act(async () => type(element.querySelector("#whatif-loan_amount") as HTMLInputElement, "-5"));
    await act(async () => submit(element));

    expect(onAsk).not.toHaveBeenCalled();
    const errors = [...element.querySelectorAll('[role="alert"]')].map((node) => node.textContent);
    expect(errors.join(" ")).toMatch(/whole number/);
    expect((element.querySelector("#whatif-loan_amount") as HTMLInputElement).getAttribute("aria-invalid")).toBe("true");
  });

  it("sends the composed question through the existing ask handler", async () => {
    const onAsk = vi.fn();
    const { element } = await mount({ onAsk });
    await act(async () => type(element.querySelector("#whatif-loan_amount") as HTMLInputElement, "300000"));
    await act(async () => type(element.querySelector("#whatif-monthly_obligations") as HTMLInputElement, "12000"));
    await act(async () => submit(element));

    expect(onAsk).toHaveBeenCalledOnce();
    expect(onAsk).toHaveBeenCalledWith("What if I borrowed 300000 and my existing EMIs were 12000?");
  });

  it("disables the fields while a turn is running", async () => {
    const { element } = await mount({ disabled: true });
    for (const input of element.querySelectorAll("input")) expect((input as HTMLInputElement).disabled).toBe(true);
    expect((element.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
