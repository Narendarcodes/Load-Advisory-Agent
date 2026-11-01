import type { ImprovementTask } from "./types";
import { ImprovementPlanBlock } from "./genui/blocks";

export function PlanPanel({ plan }: { plan: ImprovementTask[] }) {
  return (
    <section className="plan" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="assistant__title">
        Improvement plan
      </h2>
      {plan.length === 0 ? (
        <p className="empty">Ask “What can I do to improve before reapplying?”</p>
      ) : (
        <ImprovementPlanBlock plan={plan} showHeading={false} />
      )}
    </section>
  );
}
