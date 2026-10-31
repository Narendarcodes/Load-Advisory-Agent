import type { ImprovementTask } from "./types";

export function PlanPanel({ plan }: { plan: ImprovementTask[] }) {
  return (
    <section className="plan" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="assistant__title">
        Improvement plan
      </h2>
      {plan.length === 0 ? (
        <p className="empty">Ask “What can I do to improve before reapplying?”</p>
      ) : (
        <>
          <ol>
            {plan.map((item) => (
              <li key={`${item.rule_id}-${item.task}`} data-rule={item.rule_id}>
                <b>{item.task}</b>
                {item.target_display ? <span className="note"> Target: {item.target_display}.</span> : null}
                <br />
                <span className="note">
                  {item.general_guidance}
                  {item.guidance_source ? ` (${item.guidance_source})` : null}
                </span>
              </li>
            ))}
          </ol>
          <p className="note">
            Targets are arithmetic on the synthetic thresholds, re-checked by the decision engine as a what-if.
            Not a guarantee — a lender decides on a new application.
          </p>
        </>
      )}
    </section>
  );
}
