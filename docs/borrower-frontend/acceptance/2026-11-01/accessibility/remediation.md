# Remediation record — accessibility defects found and fixed

Audit tooling: axe-core 4.14.0 through `@axe-core/playwright` 4.14.0, Playwright 1.63.0, tags
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`. No rule was disabled and no node was excluded.
Ratios below are computed from the design-system token values in
[portal.css](../../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css)
and re-measured on the rendered page by
[manual_contrast.cjs](../../../../../tests/e2e/manual_contrast.cjs).

Baseline before any fix — `baseline-before-remediation/`: 26 runs at 1440, **22 runs with
violations, 1 distinct rule (`color-contrast`, impact *serious*), 97 violating node reports
(11 distinct selectors)**. Re-run after the fixes — `accessibility-report.md`: 103 runs across five
widths, **0 violations**.

## 1. Sidebar section labels below AA

| | |
| --- | --- |
| Rule / impact | `color-contrast` / serious (WCAG 1.4.3) |
| Component | Portal shell, right-hand "what matters here" rail |
| Selectors | `#rail-overview`, `#rail-borrow`, `#rail-application`, `#rail-support` (`.rail__label`) |
| Seen in | 22 of 26 baseline runs — every authenticated view at 1440 |
| Cause | `.rail__label` used `color: var(--faint)` (`#9a8e87`) on the `--paper-2` rail (`#f1eae3`) = **2.67:1**, well under the 4.5:1 floor for this 11px uppercase text |
| Fix | `--faint` → `--muted` (`#71665f`) on the same background = **4.68:1**. One declaration in `portal.css`; no new colour, no size change |
| Retest | axe: 0 violations on all four selectors at 1440/1280/1024/768/390. Manual recomputation: 4.68:1, and the tightest passing measurement anywhere in the retest is this same 4.68:1 |
| File | [portal.css](../../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css) `.rail__label` |

## 2. Declined-application status block below AA

| | |
| --- | --- |
| Rule / impact | `color-contrast` / serious (WCAG 1.4.3) |
| Component | Application status page, the "not approved" block |
| Selectors | `#status-summary` (`.small.muted`), `#status-time` (`<time>`) inside `.status-block--bad` |
| Seen in | `09-application-not-approved/default@1440` |
| Cause | Generic `.muted` text (`--muted`) inherits onto the block's `--bad-soft` fill (`#f6e2de`) instead of the page background = **4.47:1**, marginally under the floor |
| Fix | Scoped to the bad-status block only: `.status-block--bad .muted` and `.status-block--bad .status-block__body time` use `--ink-2` (`#4a403c`) = **8.06:1**. The block's headline, colour and border are untouched, so the semantic signal (coral = adverse outcome) stays as designed |
| Retest | axe: no violation on this page at any width. Manual recomputation of every text node on the page: 0 failures |
| File | [portal.css](../../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css) `.status-block--bad` |

## 3. Borrower chat bubble below AA

| | |
| --- | --- |
| Rule / impact | `color-contrast` / serious (WCAG 1.4.3) |
| Component | Advisory assistant island, the borrower's own message bubble |
| Selectors | `.msg.user` (rendered as `<div class="msg user">…</div>`) |
| Seen in | `10-advisory-workspace` in the loading, missing-information, citations and error states (5 node reports) |
| Cause | White text on `--accent` (`--coral`, `#fe7d6b`) = **2.51:1**. The guidance for this palette is explicit that white on light coral must not be assumed to pass, and it does not |
| Fix | Kept the bubble fill, changed the ink to `--ink` (`#241c1b`) = **6.65:1** — the dark-on-light-coral pairing the design system prefers. Alternatives measured for the record: `--ink` on `--peach-soft` is 14.57:1 (would flatten the bubble hierarchy) and white on `--deep` is 5.94:1 (would darken the borrower's own turn to the escalation colour). No palette entry was added or retuned |
| Retest | axe: 0 `.msg.user` violations at any width; the missing-information card, citations response and error alert all pass with the bubble in view. Browser reproduction of the card at five widths also re-confirmed after this change |
| File | [assistant.css](../../../../../apps/web/assistant/src/assistant.css) `.msg.user` (built to `public/js/assistant/assistant.css`, md5 `c704f8d31ef41ae75f6d7d3253cbf394`, verified identical on host and in the container) |

## Not treated as an accessibility defect

- **12 text nodes remain `indeterminate`** for axe on the KYC workspace (`06-kyc-workspace`) because a
  `background-image` sits in their ancestor chain, so no opaque background can be resolved. The
  independent recomputation could not decide them either and did not guess; they are listed by
  selector in `manual-contrast.json`. They are not reported as passing contrast.
- **2 console errors / 2 failed requests** during the audit: the assistant island asks
  `loan_advisory_portal.api.agent.conversation_messages` for a thread id that has no stored
  transcript yet and Frappe answers 404. That is a first-load history bug, not a WCAG violation, and
  it is out of scope for a CSS-sized fix. It is carried into the final report as an open finding with
  the exact endpoint.
- The 390px card clipping fixed during the browser reproduction of the Missing Information card is a
  layout regression, not a rule violation; it is documented in
  `../missing-information/missing-information-report.md`.

## Scope discipline

Three declarations changed, all of them existing tokens recoloured within the frozen palette. No
component markup, no business logic, no route, no dependency and no test infrastructure was altered
to reach zero violations.
