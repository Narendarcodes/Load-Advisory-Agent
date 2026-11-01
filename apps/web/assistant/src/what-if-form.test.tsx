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
  it("asks a single field as a what-if question, in backend vocabulary", () => {
    expect(whatIfQuestion({ credit_score: "720" })).toBe("What if my credit score was 720?");
    expect(whatIfQuestion({ employment_months: "36" })).toBe("What if my employment tenure was 36 months?");
  });

  it("joins several changes in one sentence the intent parser can recognise", () => {
    expect(whatIfQuestion({ credit_score: "720", monthly_income: "45000", monthly_obligations: "12000" })).toBe(
      "What if my credit score was 720, my monthly income was 45000 and my monthly obligations were 12000?",
    );
    expect(whatIfQuestion({ monthly_income: "45000", employment_months: "36" })).toBe(
      "What if my monthly income was 45000 and my employment tenure was 36 months?",
    );
  });

  it("returns null when nothing usable was entered", () => {
    expect(whatIfQuestion({})).toBeNull();
    expect(whatIfQuestion({ credit_score: "  " })).toBeNull();
    expect(whatIfQuestion({ credit_score: "lots" })).toBeNull();
  });
});

describe("WhatIfForm", () => {
  it("shows the recorded value where the decision record has one", async () => {
    const { element } = await mount();
    expect(element.querySelector("#credit_score-recorded")?.textContent).toBe("Recorded: 640");
    expect(element.querySelector("#monthly_income-recorded")?.textContent).toBe("Recorded: ₹45,000");
    expect(element.querySelector("#employment_months-recorded")?.textContent).toContain("0 to 600");
  });

  it("refuses an empty submission", async () => {
    const { element, onAsk } = await mount();
    await act(async () => submit(element));
    expect(onAsk).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toMatch(/at least one number/i);
  });

  it("validates ranges before anything is sent to the agent", async () => {
    const { element, onAsk } = await mount();
    await act(async () => type(element.querySelector("#whatif-credit_score") as HTMLInputElement, "950"));
    await act(async () => type(element.querySelector("#whatif-employment_months") as HTMLInputElement, "12.5"));
    await act(async () => submit(element));

    expect(onAsk).not.toHaveBeenCalled();
    const errors = [...element.querySelectorAll('[role="alert"]')].map((node) => node.textContent);
    expect(errors.join(" ")).toMatch(/between 300 and 900/);
    expect(errors.join(" ")).toMatch(/whole number/);
    expect((element.querySelector("#whatif-credit_score") as HTMLInputElement).getAttribute("aria-invalid")).toBe("true");
  });

  it("sends the composed question through the existing ask handler", async () => {
    const onAsk = vi.fn();
    const { element } = await mount({ onAsk });
    await act(async () => type(element.querySelector("#whatif-credit_score") as HTMLInputElement, "720"));
    await act(async () => type(element.querySelector("#whatif-monthly_obligations") as HTMLInputElement, "12000"));
    await act(async () => submit(element));

    expect(onAsk).toHaveBeenCalledOnce();
    expect(onAsk).toHaveBeenCalledWith(
      "What if my credit score was 720 and my monthly obligations were 12000?",
    );
  });

  it("disables the fields while a turn is running", async () => {
    const { element } = await mount({ disabled: true });
    for (const input of element.querySelectorAll("input")) expect((input as HTMLInputElement).disabled).toBe(true);
    expect((element.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
