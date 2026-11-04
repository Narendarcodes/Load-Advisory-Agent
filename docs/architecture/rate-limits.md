# Rate limits and budgets

Playbook for abuse and cost control on the borrower surface. Limits are per **account**, not
per IP: a household or office behind one address must not let one borrower exhaust another's
allowance, and a shared address must not make legitimate use impossible. Guest invitation
endpoints are the exception — there is no account yet, so those stay IP-based.

Two independent layers enforce this:

| Layer | Store | Key | Failure mode |
| --- | --- | --- | --- |
| Frappe whitelisted methods | site cache (`frappe.cache`, Redis on this bench) | signed-in `User` | a cache error fails the request; it never silently uncounts |
| FastAPI agent routes | `ASSERTION_REPLAY_REDIS_URL` | verified assertion `sub` | 503 `rate limit store unavailable` (same fail-closed policy as replay) |

Every budget is a fixed window that starts on the first hit and does not slide. The Frappe
counter is `portal-budget:<scope>:<user>`; the FastAPI counter is
`loan-advisory:budget:<sha256(scope:sub)>` so no email or customer id appears in the store.

## Frappe portal methods

Implemented in `portal/limits.py`, called immediately after `borrower_context()` so a guest is
refused as unauthenticated (401) rather than counted.

| Scope | Methods | Limit |
| --- | --- | ---: |
| `application-create` | `create_application` | 30 / hour |
| `application-transition` | `submit_application`, `resubmit_application`, `withdraw_application` | 30 / hour |
| `document-attach` | `attach_document` | 60 / hour |
| `document-remove` | `remove_document` | 60 / hour |
| `document-download` | `download_document` | 240 / hour |
| `feedback-submit` | `submit_feedback` | 20 / hour |
| `profile-update` | `update_profile` | 60 / hour |
| `agent-mint` | `mint_assertion` (one per agent turn) | 90 / minute |
| `conversation-log` | `record_turn` (one transcript write per answered turn) | 120 / hour |
| `voice-session` | `create_voice_session` (consented starts only) | 10 / hour |
| `voice-assertion` | `voice_assertion` (service account, one per spoken turn) | 600 / hour |
| guest invitation validation | `invitations.validate` (IP, existing decorator) | 20 / hour |
| guest invitation redemption | `invitations.redeem` (IP, existing decorator) | 10 / hour |

A refused call raises `TooManyRequests` (429). `portal/headers.py` copies
`frappe.local.retry_after` onto the response as `Retry-After`, so a well-behaved client can back
off instead of retrying immediately.

## FastAPI agent routes

Implemented in `api/limits.py` and spent in `api/auth.py:spend_budget()` after authentication,
application selection and (for AG-UI) input validation — never inside a stream.

| Scope | Routes | Limit |
| --- | --- | ---: |
| `agent-turn` | `/api/chat`, `/api/chat/stream`, `/api/agui` | 60 / minute |

> **2026-11-03 (Phase 1 boundary A).** A `bureau-run` scope of 10 / hour used to cap
> `POST /api/bureau/run`. That route is removed, so the scope no longer exists: a borrower cannot
> trigger a provider call at all, which is a stronger limit than a count of them.

Budgets are counted per verified `sub`, so rotating assertions does not reset them. The store
selection mirrors replay: Redis when configured; process-local counters only outside
production; `APP_ENV=production` with no Redis, or an unreachable store, refuses the call (503).

## Why these numbers

They are guard rails, not product policy. A borrower cannot produce 30 applications an hour by
hand, and 60 agent turns a minute is far above a person typing. The bureau allowance used to be
the tightest because it spent provider credit and wrote evidence; it is now gone entirely, which is
why the table has one scope. Any future product decision that needs different numbers changes the
table here and the matching test.

## Verification

| Test | Proves |
| --- | --- |
| `tests/test_limits.py` (Frappe) | a budget is per account, 429 carries `retry_after`, guests are not counted |
| `tests/test_agent_guards.py::test_chat_budget_is_per_borrower` | the 3rd call in a 2-call window is 429 with `Retry-After`; another borrower still succeeds |
| `tests/test_agent_guards.py::test_no_bureau_scope_is_budgeted_on_the_agent_surface` | no bureau scope is spent; the only counter a borrower turn touches is `agent-turn` |
| `tests/test_agent_guards.py::test_the_bureau_execution_route_is_not_part_of_the_agent_surface` | the removed route is 404 with forged headers *and* with a valid assertion |
| `tests/test_agent_guards.py::test_budget_store_failure_fails_closed` | an unavailable store is 503, never an uncounted call |
| `tests/test_agent_guards.py::test_memory_budget_is_refused_in_production` | no process-local fallback in production |
| `tests/test_agent_guards.py::test_redis_budget_is_shared_across_workers` | two store instances (two workers) share one counter |

Phase F verified the cross-process case against live Redis 7.4.9 (`tests/e2e/two_worker_check.py`:
ten turns allowed across two processes, the eleventh refused with `retry_after=40`). Not verified
here: two uvicorn workers behind a load balancer, provider-side quotas, and the bureau allowance
against a real provider.
