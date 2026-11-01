# Borrower frontend — implementation record

Canonical app: `apps/loan_advisory_portal` (Frappe 16.51.0 website portal;
the live bench also runs ERPNext 16.50.0 and Frappe Lending 16.6.1).
Branch: `feat/frappe-borrower-platform`. Nothing in this record has been committed.

## 1. Architecture held

Frappe stays the single owner of sign-in, session, routing, data access and
authorisation. React/CopilotKit appears only inside the AI advisory workspace
(`/borrower/assistant`), mounted from
`public/js/assistant/assistant.js` with a JSON context element. There is no
SPA shell, no second auth stack, and no client-built ownership.

- CSRF: every mutating call goes through `Portal.call`, which sends
  `X-Frappe-CSRF-Token` from `frappe.boot`. No other token store exists in the
  browser.
- Session: `frappe.session.user` is authoritative on every request. A foreign
  or unknown application id is answered as `404`, exactly like a missing one.
- Ownership: resolved server-side from the session's Borrower Profile; the
  browser never establishes ownership from the id in the URL.
- No secrets in `localStorage` or `sessionStorage`; no raw Aadhaar, PAN or
  document content is written to logs, analytics or model context.

## 2. Design system (frozen)

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f7f3ee` | page ground |
| `--paper-2` | `#f1eae3` | recessed panels |
| `--card` | `#ffffff` | surfaces |
| `--ink` | `#241c1b` | primary text |
| `--muted` | `#71665f` | secondary text |
| `--coral` | `#fe7d6b` | primary action, brand accent |
| `--deep` | `#b23a2e` | links and emphasis (5.3:1 on paper) |

- **Type:** Sora for display, Manrope for body and UI, Space Grotesk for
  technical metadata only (amounts, references, status metadata, monospace
  labels). All self-hosted WOFF2 with OFL licences alongside.
- **No white text on coral.** Primary buttons are ink on coral (contrast-safe);
  white-on-coral was rejected at token level.
- **Shape lock:** 20 px cards, 12 px controls, 8 px small marks, pill buttons.
- **One accent:** coral. State colours (`ok`, `warn`, `bad`, `info`) are
  semantic only and always ship a label, never colour alone.

## 3. Screens and capture matrix

`tests/e2e/borrower_views.cjs` captures 17 views at 1440, 1280, 1024, 768 and
390 (85 PNGs) into `docs/borrower-frontend/screenshots/`, with per-view
measurements in `_summary.json`.

| # | View | Route | Notes |
| --- | --- | --- | --- |
| 01 | Public loan products | `/borrower/products` | guest, live catalogue, calculator |
| 02 | Sign-in | `/login` | branded, invite-only copy, `redirect-to` sanitised |
| 03 | Dashboard | `/borrower` | application table, next step, demo loan card |
| 04 | Indicative eligibility | `/borrower/eligibility` | no bureau, no Aadhaar/PAN, estimate only |
| 05 | Application wizard | `/borrower/apply` | five steps, review, submit |
| 06 | Identity workspace | `/borrower/kyc` | three columns, masked PAN/Aadhaar, preview only |
| 07 | Documents workspace | `/borrower/documents` | full page, not a modal; chooser state |
| 08 | Application tracker | `/borrower/application?name=…` | submitted, no decision recorded |
| 09 | Recorded decision | same route (decided application) | rejected, reasons from evidence |
| 10 | AI advisory workspace | `/borrower/assistant?application=…` | Layout H: context / chat / aside |
| 11 | Repayments | `/borrower/servicing` | demo fixture, no payment action |
| 12 | Profile and consents | `/borrower/profile` | consent versions, completion meter |
| 13 | Help | `/borrower/help` | decision vocabulary, human escalation |
| 14 | Feedback | `/borrower/feedback` | rating, category, message, history |
| 15 | Terms of use | `/borrower/terms` | versioned public page |
| 16 | Privacy notice | `/borrower/privacy` | versioned public page |
| 17 | Invitation link | `/borrower/invite` | unavailable/expired state |

The 14 core screens are 01–09 and 11–16; 10 is Layout H; 17 documents the
invitation edge case. All five widths were captured for every view.

## 4. Behaviour by screen

- **Dashboard** — live application list from the API, next-step card keyed by
  lifecycle, profile completion, demo servicing card only when fixtures are on.
- **Eligibility** — indicative estimate only. States plainly that it does not
  read a credit file, does not ask for Aadhaar or PAN, and is not a decision.
  A repayment-capacity calculation (45% of income after existing obligations,
  at the current product rate) runs only on a site with demo fixtures enabled,
  so the arithmetic can be reviewed. On a production site the page shows an
  unavailable state — "the indicative calculator is not connected to a
  calculation service on this site" — and offers the formal application
  instead of inventing a rate or an amount. With no product configured it
  shows a separate "no lending product" state.
- **Wizard** — draft save, document gate before submit, review step, honest
  submission state. A failed request keeps the draft and says what happened.
- **Identity workspace** — three columns (why we ask / preview / summary).
  PAN and Aadhaar are masked and only the last four characters are ever
  displayed. "Preview the check" simulates the states; it performs no OTP,
  biometric or identity-service call, stores no identity result, and says so.
  A failed check is explicitly not a loan rejection.
- **Documents workspace** — full page with application context, not a modal.
  Drag/drop or picker, 10 MB and type limits, per-file status, private
  download, remove dialog, locked state after submission. The preview card
  shows a loading skeleton, then either labelled demo sample fields with a
  masked number (`•••• 1234`) or, in production, a "person review" state that
  states automatic extraction is not connected. No full document number is
  ever rendered.
- **Application tracker** — four stages (started, submitted, checks, outcome)
  derived from lifecycle. Closed applications mark the outcome stage done;
  withdrawn applications stop at the stage they reached and record no outcome.
  Every status carries a title, explanation, timestamp and next action.
- **Decision and reasoning** — reads the structured evidence API only.
  Approved, rejected, manual review, more information and provider-unavailable
  states each have their own copy. Reasons are rendered from recorded evidence
  entries; when no reasons were recorded the page says so instead of inventing
  any. No thresholds are calculated in the browser, and tone is factual, never
  shaming.
- **Advisory workspace (Layout H)** — context column, conversation column and
  an aside with voice consent and conversation history. Answers come from the
  existing runtime API and cite policy passages; the assistant never decides,
  never changes the application, and cannot see raw identity numbers.
  What-if answers are labelled as estimates, not decisions.
- **Repayments** — demo schedule pinned to fixture data, with a persistent
  notice that no bank account, mandate, receipt or payment gateway exists.
  The pay button is disabled and "How payments would work" explains the gap.
- **Profile / feedback / help / notices** — real forms and versioned pages;
  feedback stores rating, category, message and application reference.

## 5. Demo and production gating

`boot.demo` comes from `frappe.conf.developer_mode` or the site-level
`enable_demo_fixtures` flag (`portal/jinja.py`). On the disposable review site,
telemetry is enabled through site config only; nothing in the repository turns
it on. Every fixture surface carries a visible `DEMO` flag and explanatory
copy: the dashboard loan card, repayments, identity preview sample fields and
document preview sample fields. With the flag off, those surfaces show an
unavailable/empty state and explain what is missing instead of fabricating
data.

## 6. Responsive model

| Width | Navigation | Layout |
| --- | --- | --- |
| 1440 | left rail, 240 px | three-column workspaces |
| 1280 | left rail, 216 px | columns tighten |
| 1024 | icon rail, 72 px | two-column workspaces |
| 768 | top bar with inline nav | single column, tables stack |
| 390 | bottom tab bar | single column, stacked cards |

- Sticky mobile tab bar pinned to the viewport bottom; capture harness puts it
  back in flow only for full-page screenshots.
- Tables with `table-wrap--stack` become labelled rows at ≤900 px; the first
  cell and sub-values stack so identifiers no longer wrap mid-token.
- `minmax(0, 1fr)` on grid and stack containers prevents min-content blowouts.
- Measured overflow across the matrix: **0 px at every view and width**.

## 7. Accessibility

- Skip link, landmarks (`main`, `nav`, `aside`), one `h1` per page.
- Labels on every input; errors linked with `aria-invalid` and live regions;
  `aria-live` on status and async result areas.
- Status is always text + explanation; colour never carries meaning alone.
- Focus-visible rings on all controls; dialogs are native `<dialog>` with
  explicit actions.
- Contrast: ink-on-paper, deep-on-paper for links, ink-on-coral for primary
  buttons. The 2.5:1 white-on-coral combination is not used.
- Motion respects `prefers-reduced-motion`; no infinite or attention-seeking
  animation.

## 8. QA evidence (run 2026-11-01)

| Check | Command | Result |
| --- | --- | --- |
| Portal suite | `bench --site loanportal.local run-tests --app loan_advisory_portal` | 169 tests, OK |
| Repository suite | `python -m pytest -q` | 683 passed, 15 skipped |
| Lint | `ruff check .` | All checks passed |
| JS syntax | `node --check` on changed page scripts | OK |
| Design detector | `impeccable detect` on CSS, templates and pages | 0 findings |
| Visual matrix | `node tests/e2e/borrower_views.cjs` | 85 screenshots, 0 px overflow, 0 console errors |

The detector waivers are recorded inline in `portal.css` with reasons: the
alert's semantic left accent, the brief-mandated Space Grotesk for technical
metadata, and the five-position step indicator's width transition.

## 9. Known limitations (not claimed as integrated)

- **No identity service.** The KYC workspace is a preview: no OTP, no
  biometric, no document verification API. It stores no identity result.
- **No OCR or automatic document reading.** The preview states this directly.
- **No bureau or credit pull anywhere.** The production eligibility page does
  not run a calculation at all; the demo-only estimate is arithmetic on
  entered values and is labelled indicative.
- **No payments.** Repayments are fixture data; no gateway, mandate or receipt.
- **No decision made in the UI.** Decisions and reasons come from the stored
  evidence record; the assistant explains but never decides.
- **Voice mode** is consent-gated UI over the existing voice API contract. The
  panel is enabled only when the site has `livekit_api_key`, `livekit_api_secret`
  and `livekit_url`; otherwise it says voice is unavailable and text still
  works. It was not exercised end-to-end in this environment, and an enabled
  service that cannot be reached reports a failed join rather than implying a
  call happened.
- **Generative UI is state-projected, not tool-rendered.** The island renders
  citations, what-if results, the improvement plan, missing information and
  abstention from the allowlisted AG-UI `STATE_SNAPSHOT`. The backend also
  emits a structured `decision_card`, but the island's `PublicState` and
  `AnswerDetails` do not consume it yet, and no AG-UI tool-call or step
  events are emitted, so there are no tool-call renderers.
- **Screenshots come from the disposable review site** with fixtures enabled;
  they are labelled DEMO wherever fixture data appears.

## 10. Final delivery report (14 points)

1. **Architecture preserved — PASS.** Frappe owns auth, session, pages, data
   and authorisation; React is limited to the advisory island. No SPA, no
   second auth.
2. **Design system frozen — PASS.** Paper/coral tokens, Sora + Manrope +
   Space Grotesk, one accent, no white-on-coral, one radius scale.
3. **All screens delivered — PASS.** 14 core screens plus Layout H and the
   invitation edge case; 17 captured views at 5 widths.
4. **Eligibility honest — PASS.** Indicative only; no Aadhaar, PAN, bureau or
   hard pull; demo data labelled. A production site shows an unavailable state
   rather than a fabricated estimate, and no product configured shows its own
   unavailable state.
5. **Identity workspace — PASS.** Three columns, masked values, preview-only
   states, failed check explicitly not a rejection, no real OTP or biometric.
6. **Documents workspace — PASS.** Dedicated page, upload/remove/preview
   states, private files, masked preview, no full ID numbers.
7. **Decision states — PASS.** Approved, rejected, manual review, more
   information, provider unavailable; reasons only from structured evidence.
8. **Status communication — PASS.** Every status has text, explanation,
   timestamp and next action; colour is never the only signal.
9. **Security and privacy — PASS.** Session authority, CSRF header on writes,
   server-side ownership, masked identity data, no secrets in storage, no raw
   identity content in model context or logs.
10. **Responsive behaviour — PASS.** 240/216/72 rail, top nav at 768, bottom
    tab bar at 390, stacked tables, 0 px overflow at every measured width.
11. **Accessibility — PASS.** Landmarks, labels, live regions, focus states,
    contrast-safe palette, reduced-motion support.
12. **Testing — PASS.** 169 portal tests, 683 repository tests, ruff clean,
    JS syntax checks, zero console errors in the visual run.
13. **Documentation and screenshots — PASS.** This record plus 85 screenshots
    and `_summary.json` measurements under `docs/borrower-frontend/`.
14. **Honesty and repository safety — PASS.** No unintegrated service is
    claimed; nothing was committed, pushed, merged or deleted; pre-existing
    working-tree changes were left untouched.
