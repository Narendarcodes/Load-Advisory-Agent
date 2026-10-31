# Loan lifecycle and the native ↔ portal mapping

Status: **implemented and tested** (B3, 2026-10-31). Applies to the disposable site
`loanportal.local`; the shared `p1loan.local` site is untouched. The workflow is a
prototype process, not a regulator- or lender-mandated one.

## 1. Two owners, one contract

| Field | Owner | Meaning |
|---|---|---|
| `Loan Application.status` (`Open` / `Approved` / `Rejected`) | Upstream Lending | Lending's coarse native state. It is **never** edited by this app while the document is submitted. |
| `Loan Application.custom_lifecycle_state` | This app (`loan_advisory_portal`) | The fine-grained borrower-facing state, one of the canonical states below. Written by the portal on submit/withdraw and by the agent through the trusted evidence method. |
| `Loan Application.docstatus` | Frappe / Lending | `0` draft, `1` submitted. Submission is the borrower's act; the portal never un-submits. |

The two runtimes that must agree — the Frappe portal and the FastAPI decision pipeline —
load the **same** contract file:

| Copy | Loaded by |
|---|---|
| `config/loan_lifecycle.json` (schema `loan-lifecycle/1`) | `loan_advisory/application/lifecycle.py` (FastAPI) |
| `apps/loan_advisory_portal/loan_advisory_portal/lifecycle.json` | `loan_advisory_portal/portal/lifecycle.py` (Frappe; must sit next to `hooks.py`) |

The app copy is vendored because Frappe packages cannot import from `apps/api/src`. It is
kept **byte-identical** to the repository copy; `tests/test_lifecycle_contract.py` fails if
either copy drifts, if the FastAPI module's constants differ from the JSON, or if the table
is internally inconsistent (unknown states, automated targets unreachable through the plain
transition table, terminal states automated, etc.).

## 2. Canonical states and transitions

```text
DRAFT ─▶ SUBMITTED ─▶ UNDER_REVIEW ─▶ APPROVED | REJECTED
   │           │             ├─▶ INFO_REQUESTED ─▶ SUBMITTED | WITHDRAWN
   │           │             └─▶ MANUAL_REVIEW
   └─▶ WITHDRAWN             MANUAL_REVIEW ─▶ APPROVED | REJECTED | INFO_REQUESTED
                             REJECTED ─▶ MANUAL_REVIEW            (dispute)
```

| State | Terminal? | Native `status` | Borrower action |
|---|---|---|---|
| `DRAFT` | no | `Open` | edit, submit, withdraw |
| `SUBMITTED` | no | `Open` | withdraw |
| `INFO_REQUESTED` | no | `Open` | resubmit, withdraw |
| `UNDER_REVIEW` | no | `Open` | — |
| `MANUAL_REVIEW` | no | `Open` | — |
| `APPROVED` | yes | `Approved` | — (dispute only via ops) |
| `REJECTED` | yes | `Rejected` | — (dispute via `MANUAL_REVIEW`) |
| `WITHDRAWN` | yes | `Open` | — |

The JSON also declares `automated_transitions`, the only edges the agent may persist:

| Source | Automated targets |
|---|---|
| `SUBMITTED` | `APPROVED`, `REJECTED`, `INFO_REQUESTED`, `MANUAL_REVIEW` |
| `UNDER_REVIEW` | `APPROVED`, `REJECTED`, `INFO_REQUESTED`, `MANUAL_REVIEW` |
| `MANUAL_REVIEW` | `APPROVED`, `REJECTED`, `INFO_REQUESTED` |

`check_automated_transition(source, target)` additionally accepts `target == source`
(idempotent replay of the same evidence record) and raises for any transition out of a
terminal state. That is what makes "a decided record cannot be silently re-decided" a
server-side rule, not a UI convention.

The borrower-facing flow (`check_transition`) uses the plain table: `DRAFT → SUBMITTED`,
`SUBMITTED/INFO_REQUESTED → WITHDRAWN`, `WITHDRAWN` is final.

## 3. Explicit adapters, never names

- `native_status_for(state)` is total over the canonical states; the portal and the agent
  both require the incoming native status to equal it, so an agent cannot smuggle
  `Sanctioned` in as an application status.
- `state_for_native(status)` deliberately returns `None` for `Open`. `Open` covers six
  portal states and is therefore **ambiguous**; guessing would fabricate a state. Only the
  two unambiguous values (`Approved`, `Rejected`) map back.
- Unknown portal states are never silently mapped to something else; they surface as
  `UNKNOWN` in reconciliation and are rejected at ingestion.

## 4. Atomicity

Every state change is written in one database transaction with the record that caused it:

- **Agent decision** — `evidence.ingest` (trusted method, `Evidence Service` only) inserts
  the `Loan Decision Evidence` record, updates only the allowlisted application fields
  (`custom_lifecycle_state`, `custom_latest_evidence`, `custom_policy_version`), optionally
  writes the native status **only when `docstatus == 0`**, inserts one
  `Application State Log` row when the state changed, and inserts one
  `Evidence Ingestion Log` row. A failure anywhere rolls the whole request back, so evidence
  never exists without its application update and audit rows.
- **Borrower submit** — `submit_application` validates the transition, saves and submits the
  document, then writes the state-log row in the same request.
- **Borrower withdraw** — `withdraw_application` validates the transition, changes the
  lifecycle field (submitted documents are updated with `db_set` so `docstatus` and Lending's
  `status` are preserved), and writes the state-log row.
- **What-if** — `simulate()` persists nothing; it never enters this path.

Field order matters: ownership and identity checks in `evidence.ingest` run **before** the
transition check, so a record id already bound to another application is refused as a
permission error even when the claimed application could not accept the transition.

## 5. Audit history

`Application State Log` is an append-only-in-practice DocType: the app only inserts rows and
never updates or deletes them.

| Field | Content |
|---|---|
| `loan_application` | Link to the application |
| `from_state`, `to_state` | The transition claimed |
| `actor` | User that caused it (borrower, or the service account for agent decisions) |
| `source` | `portal` or `agent` |
| `record_id` | Evidence record that caused an agent transition (empty for borrower actions) |
| `native_status`, `native_written` | What was (or was not) written to Lending's field |

Permissions: System Manager read/report/export only; no borrower or agent grants. The
borrower timeline (`application.get_application().timeline`) is rendered from these rows in
creation order, with the evidence evaluation inserted immediately before the decision row it
caused. The timeline no longer synthesises history from unrelated timestamps.

## 6. Post-submit and withdrawal semantics

- Submitting sets `custom_lifecycle_state = SUBMITTED`, `custom_submitted_at`, and submits the
  document. A second submit is refused (`Conflict`).
- A borrower may withdraw a draft or a submitted application. A submitted withdrawal keeps
  `docstatus = 1` and the native `status` untouched — Lending owns both fields, and this
  phase forbids editing upstream Lending. The borrower-facing state becomes `WITHDRAWN` and
  cannot be submitted again.
- An `INFO_REQUESTED` application is corrected and resubmitted through
  `resubmit_application`: the four scored inputs are replaced, the lifecycle returns to
  `SUBMITTED`, and a `portal` state-log row is written. `docstatus` stays `1` (this is not a
  second Frappe submit), Lending's `status` and the loan terms are untouched, and documents
  stay frozen. The decision card's "information needed" flag follows the application state,
  not the stored evidence snapshot, so it clears on resubmission.
- The agent may not withdraw, and may not move a withdrawn application.
- Submitted documents keep their protections: the evidence method writes only the
  `allow_on_submit` portal fields and never writes `status`; borrowers cannot edit submitted
  documents, and `resubmit_application` is the only endpoint that writes non-`allow_on_submit`
  scored fields after submission (with `db_set`, restricted to `INFO_REQUESTED`).

## 7. Reconciliation (the unavoidable divergence)

The portal can be more specific than Lending, so the two values are compared with a pure,
non-mutating function: `reconcile(portal_state, native_status, docstatus)`. It returns:

| Result | Meaning | Example |
|---|---|---|
| `IN_SYNC` | Native value equals the expected mapping | `APPROVED` + `Approved` submitted; `WITHDRAWN` + `Open` submitted |
| `PENDING_LENDING` | A submitted decision is final in the portal and the agent correctly left the native status to Lending | `APPROVED` + `Open`, `docstatus = 1` |
| `OUT_OF_SYNC` | A draft carries a decision the native status never received | `APPROVED` + `Open`, `docstatus = 0` |
| `CONFLICT` | The two values name different terminal outcomes | `REJECTED` + `Approved` |
| `UNKNOWN` | One side holds a value outside the table | `SUBMITTED` + `Sanctioned` |

`PENDING_LENDING` is the only expected divergence: the portal writes evidence, the decision
is visually final for the borrower, and Lending closes its own status when it processes the
application. This app does not edit Lending's document, so it cannot force that field; the
reconciliation result names the gap instead of hiding it. `CONFLICT` and `OUT_OF_SYNC` are
operational alarms, not states the application can enter through its own APIs.

Reconciliation is currently exercised by tests and available as a pure function; no operator
screen calls it yet (there is no ops surface in the prototype).

## 8. Presentation rule

The borrower UI renders only the canonical lifecycle. `lifecycleBadge(lifecycle, decision)`
uses the decision **only** as a fallback when the row has no lifecycle value, so a held
decision (`MANUAL_REVIEW`, e.g. obligations exceed income) can never render as Approved. The
native `status` is returned by the API for diagnostics but is not shown to borrowers.

## 9. Tests (current branch)

| Suite | What it proves |
|---|---|
| `tests/test_lifecycle_contract.py` (3, host pytest) | The two JSON copies are byte-identical, the FastAPI module equals the JSON, and the table is internally consistent. |
| `apps/.../tests/test_lifecycle.py` (14, Frappe) | Select options equal canonical states; every state has a native mapping; only `Approved`/`Rejected` map back; transition and automated-transition tables; idempotent replay; terminal states refused; every reconciliation result; submission audited; double submit refused; `INFO_REQUESTED` correction/resubmission keeps `docstatus` and native status, freezes terms, and clears the information-needed flag; resubmission refused outside `INFO_REQUESTED` and for a foreign application; withdrawn draft cannot submit; draft/submitted withdrawal preserves `docstatus`/native status; decided records not withdrawable; timeline is the state log in order. |
| `apps/.../tests/test_evidence_api.py` (15, Frappe) | Valid evidence persists and moves the app; native status written only for drafts; a draft cannot be decided; a terminal application cannot be re-decided; idempotency and audit; unrelated application and record-id rebinding refused; submitted document keeps `docstatus` and native status; guest/borrower denial; service holds no DocType grants and needs no System Manager. |

Fresh run on 2026-10-31: Frappe `Ran 116 tests … OK`; host `pytest` `651 passed, 15
skipped`.
