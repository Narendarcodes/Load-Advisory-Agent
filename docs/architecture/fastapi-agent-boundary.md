# FastAPI agent boundary

Status: **implemented.** Frappe owns borrower identity, accounts, applications, documents and feedback.
The FastAPI service serves only the agent routes, behind an assertion verifier; the account/application/demo
routes and the legacy stdlib server are gone. The voice worker exchanges its `Voice Session` row for an
assertion per turn (Phase 7).

## The rule

> Frappe is the system of record for people, applications, documents and decisions. FastAPI runs the agent: LangGraph, RAG over the policy corpus, the ZEN policy engine, the evidence record and Langfuse tracing. FastAPI never becomes a second source of borrower data, and the browser never talks to it with a borrowed credential.

## Legacy surface (verified inventory)

Repository: legacy worktree `Load-advisory-agent`. `API` = `apps/api/src/loan_advisory/api`, `SRV` = `apps/api/src/loan_advisory/agent/server.py`.

| Method & path | File | Caller | Auth | Class |
| --- | --- | --- | --- | --- |
| POST `/api/accounts/invitation` | `API/accounts.py:91` | React sign-up | none | moves to Frappe |
| POST `/api/accounts/register` | `API/accounts.py:108` | React sign-up | none | moves to Frappe |
| POST `/api/accounts/login` | `API/accounts.py:130` | React sign-in | none | retired (Frappe session) |
| POST `/api/accounts/logout` | `API/accounts.py:148` | React | bearer | retired |
| GET `/api/accounts/me` | `API/accounts.py:156` | tests only | bearer | retired |
| POST `/api/applications` | `API/applications.py:81` | React apply | bearer | moves to Frappe |
| GET `/api/applications` | `API/applications.py:86` | React list | bearer | moves to Frappe |
| GET `/api/applications/{ref}` | `API/applications.py:90` | React detail | bearer | moves to Frappe |
| GET `/api/applications/{ref}/decision` | `API/applications.py:94` | React decision card | bearer | moves to Frappe (`get_decision`) |
| POST `/api/session/select` | `API/applications.py:98` | React | bearer | moves to Frappe (`select_application`) |
| POST `/api/session` (demo) | `API/routes_legacy.py:119` | legacy pages | none, 404 unless demo mode | retired |
| GET `/api/demo-accounts` | `API/routes_legacy.py:108` | legacy pages | none, 404 unless demo mode | retired |
| POST `/api/agui` | `API/agui.py:34` | CopilotKit runtime | bearer → assertion | **stays** |
| POST `/api/chat` | `API/routes_legacy.py:125` | voice worker | bearer → assertion | **stays** |
| POST `/api/chat/stream` | `API/routes_legacy.py:131` | voice worker | bearer → assertion | **stays** |
| GET `/api/decision` | `API/routes_legacy.py:114` | legacy UI | bearer | removed (portal reads `get_decision`) |
| POST `/api/bureau/run` | `API/routes_legacy.py:139` | tests / operator | bearer → assertion | **stays** |
| POST `/api/livekit-token` | `API/routes_legacy.py:144` | voice page | bearer | removed (Frappe mints the room token) |
| GET `/healthz` | `API/routes_legacy.py:100` | external | none | **stays** |

No document-upload, feedback or invitation-issuing routes exist in FastAPI today; those features were built in Frappe from the start (`api/documents.py`, `api/feedback.py`, `services/invitations.py`).

Auth in the legacy service is a stateless HMAC bearer token (`<b64url(json)>.<hex hmac>`, TTL 4 h, claims `iss/aud/iat/exp` + `applicant_ref`, optionally `acct/user/application_ref`), verified by `require_claims` (`API/auth.py:30`) → `verify_token` (`SRV:122`). The browser keeps it in a module variable; no cookies are used anywhere.

## Target boundary

```
browser ──(Frappe session cookie)──► Frappe pages + whitelisted methods
   │                                      │
   │  (iframe / island, same site)        │ mint_assertion  (60 s, HMAC, jti)
   ▼                                      ▼
CopilotKit Node runtime ──(Authorization: Bearer <assertion>)──► FastAPI /api/agui
                                                                       │
                                                    LangGraph + RAG + ZEN + Langfuse
                                                                       │
                                                                       └─► evidence sink
                                                                            (Frappe `Loan Decision Evidence`)
```

- **One credential in the browser**: the Frappe session. Nothing else is stored in page memory.
- **One credential to FastAPI**: the short-lived Frappe assertion from `services/assertion.py` (`iss = frappe:loan_advisory_portal`, `aud = loan-advisory-agent`, 60 s TTL, 30 s clock skew, `jti`).
- **One writer for borrower data**: Frappe. FastAPI reads applications through the evidence/doctypes it is granted and writes only evidence rows.
- **Evidence is written, not recomputed, by the portal**: the portal renders `Loan Decision Evidence.record_json` through a strict projection (`api/applications.py:_borrower_detail`) containing only `customer_visible` failing reason codes, missing fields, provider-error flag and outcome.

### Assertion contract (implemented on both sides)

Frappe `services/assertion.py`:

- payload `{iss, aud, sub (user), customer, application, thread, literacy, locale, iat, exp, jti}`
- HMAC-SHA256 over compact sorted JSON, base64url without padding, `body.signature`
- secret from site config `agent_assertion_secret` (minimum 32 chars), never from code
- `literacy`/`locale` are translated from the borrower profile into agent vocabulary
  (`plain → low`, `standard → medium`; locale passes through only when the agent supports it)
- `mint_assertion` (`api/agent.py:68`) resolves the application through `owned_application`,
  records/refreshes the `Advisory Conversation` row, and returns
  `{assertion, expires_in, jti, application, customer}`

FastAPI `api/assertion.py` verifies `iss`, `aud`, `exp`, `iat`, the maximum lifetime and a single-use
`jti`; `api/auth.py` turns a verified payload into the claims the agent's tools already expect.

## Current state in this worktree

`apps/api/src/loan_advisory/` contains `agent/`, `application/`, `infrastructure/`, `state_paths.py`
and the new `api/` package: `app.py` (factory, security headers, admission, JSON errors), `auth.py`
(assertion claims), `assertion.py` (verifier + shared replay guard), `agui.py`, `events.py`,
`routes_agent.py` and `admission.py`.

Serving surface: `GET /healthz`, `POST /api/agui`, `POST /api/chat`, `POST /api/chat/stream`,
`POST /api/bureau/run`. Removed: `/api/session`, `/api/demo-accounts`, `/api/decision`,
`/api/livekit-token`, `/api/accounts/*`, `/api/applications/*`, `/api/session/select` and the static
UI/`/advisory` routes. A test asserts each removed path is a JSON 404.

`decision_engine/` and `rag/` are present and unmodified at the repo root. `apps/runtime` is the
assertion-minting gateway (see [copilotkit-agui-integration.md](copilotkit-agui-integration.md)).
`apps/voice/agent_worker.py` reads `{session_id, user, customer, application}` from the participant
metadata and exchanges it for an assertion through `api/voice.py:voice_assertion` (service role
`Agent Integration`, room and identity checked, `Voice Session` status Created → Joined), so a leaked
room token cannot be replayed after expiry or on another application.

## Trust boundaries and rules of engagement

| Concern | Rule |
| --- | --- |
| Identity | FastAPI derives the borrower *only* from verified assertion claims; it never accepts `user`, `customer` or `application` from the request body. |
| Scope | An assertion may name one application; the agent must treat the thread's application as fixed for the run. |
| Replay | `jti` is single-use for 60 s across every API worker through Redis `SET NX EX`; a store error is a 503, never an accepted credential. See [assertion-security-and-scaling.md](assertion-security-and-scaling.md). |
| PII | Trace/log allowlists stay as they are (`agent/observability.py:46-47,162-180`); no free text in Langfuse attributes. |
| Evidence | Only FastAPI/`decision_engine` writes `Loan Decision Evidence`; the portal and the browser are read-only. Writes go through one trusted whitelisted method (`loan_advisory_portal.api.evidence.ingest`) called by a dedicated `Evidence Service` account that holds **no DocType grants** and is not System Manager. The method enforces `record.application_ref == expected_application`, refuses rebinding a record id, rejects simulations and values outside the allowlists, writes only `allow_on_submit` lifecycle fields (native `status` only while `docstatus == 0`), and inserts an `Evidence Ingestion Log` row naming the actor. The sink requires `EVIDENCE_FRAPPE_*` and never falls back to the read credential. See `evidence.py:57-159` and `test_evidence_api.py`. |
| Secrets | `agent_assertion_secret`, `livekit_api_secret` and LLM keys live in site/bench config, never in the browser or in docs. |

## Unresolved

- Who consumes `GET /healthz` in deployment; no in-repo evidence.
- A live Redis instance and a real multi-process uvicorn run are not part of the unit suite;
  the replay tests use an injected atomic fake, and Phase F exercises the real topology.
- The `literacy`/`locale` vocabulary in `Borrower Profile` (`standard/plain`, `en/hi/mr`) still differs
  from the agent's (`low/medium/high`, `en/hi/te`); the mint translates what it can and falls back to
  `medium`/`en`. Aligning the portal options is tracked separately.
- The voice worker's assertion exchange is tested on both sides (Frappe contract + worker with a fake
  HTTP session) and its refusals are exercised over HTTP, but no live LiveKit room has run — there is
  no LiveKit container in this environment.
- A submitted application keeps its native `status`: the trusted method checks `docstatus` and writes
  the portal lifecycle fields, but leaves Lending's status alone (`417 UpdateAfterSubmitError` is
  avoided by never attempting that write). `custom_lifecycle_state`, `custom_policy_version` and
  `custom_latest_evidence` carry `allow_on_submit`; the native status is left to Lending.
