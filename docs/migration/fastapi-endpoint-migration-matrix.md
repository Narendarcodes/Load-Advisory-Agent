# FastAPI endpoint migration matrix

One row per HTTP surface that exists in the legacy repository (`Load-advisory-agent`) and where it goes. The classification rule is in [fastapi-agent-boundary.md](../architecture/fastapi-agent-boundary.md): Frappe owns people, applications, documents and decisions; FastAPI keeps only the agent runtime.

Status legend:

| Status | Meaning |
| --- | --- |
| **migrated** | Equivalent behaviour implemented in this worktree **and** verified by tests and an HTTP call on `loanportal.local`. |
| **added** | New in Frappe; no legacy endpoint existed. |
| **pending** | Destination decided, port not written yet. |
| **retired** | Deliberately removed; no replacement. |

Legacy paths below are relative to `apps/api/src/loan_advisory/` in the legacy worktree. Frappe paths are relative to `apps/loan_advisory_portal/loan_advisory_portal/`.

## 1. Credential change (applies to every row)

| | Legacy | Target |
| --- | --- | --- |
| Browser identity | HMAC bearer token in a module variable, 4 h TTL (`agent/server.py` `sign`/`verify_token`) | Frappe session cookie (`sid`) |
| Agent credential | The same bearer, forwarded by the CopilotKit gateway (`runtime/src/gateway.ts:37-40`) | 60 s HMAC assertion minted by `api/agent.py:mint_assertion` (`services/assertion.py`) |
| Voice credential | The same bearer embedded in LiveKit participant metadata (`voice/agent_worker.py:274,293`) | `Voice Session` row + `session_id` in metadata; token minted by `api/livekit.py:create_voice_session` |
| Account guard | `application/session_status.py` revalidation window | Frappe session lifecycle; `Borrower Profile.status = Suspended` blocks the portal (`portal/identity.py`) |

No route below accepts `user`, `customer` or `application` from the request body as identity. The legacy routes already followed that rule; the target keeps it.

## 2. Accounts

| Legacy endpoint | Legacy file:line | Legacy auth | Frappe replacement | FastAPI action | Status |
| --- | --- | --- | --- | --- | --- |
| POST `/api/accounts/invitation` | `api/accounts.py:91` | none | `api/invitations.py:validate` (guest); page `/borrower/invite` | remove | migrated |
| POST `/api/accounts/register` | `api/accounts.py:108` | none | `api/invitations.py:redeem` (guest) → creates User, profile, binds Customer, then Frappe login | remove | migrated |
| POST `/api/accounts/login` | `api/accounts.py:130` | none | Frappe `/login?redirect-to=` (portal routing) | remove | retired |
| POST `/api/accounts/logout` | `api/accounts.py:148` | bearer | Frappe built-in logout + portal sign-out button | remove | retired |
| GET `/api/accounts/me` | `api/accounts.py:156` | bearer | `api/session.py:me` (guest-allowed; returns `{authenticated:false}` for guests) | remove | migrated |
| — | — | — | `api/invitations.py:issue`, `revoke`, `list_invitations` (System Manager only) | none | added |
| — | — | — | `api/profile.py:get_profile`, `update_profile` | none | added |

Redeem starts the Frappe session itself (`services/invitations.py` calls `login_as` after the profile is created), so the invite page lands the new borrower in `/borrower` without a second credential prompt. Legacy registration only created the account and left sign-in to the client; this is a deliberate, verified difference.

## 3. Applications and session selection

| Legacy endpoint | Legacy file:line | Legacy auth | Frappe replacement | FastAPI action | Status |
| --- | --- | --- | --- | --- | --- |
| POST `/api/applications` | `api/applications.py:81` | bearer (account) | `api/applications.py:create_application` | remove | migrated |
| GET `/api/applications` | `api/applications.py:86` | bearer (account) | `api/applications.py:list_applications` (scoped to `ctx.customer`) | remove | migrated |
| GET `/api/applications/{ref}` | `api/applications.py:90` | bearer (account) | `api/applications.py:get_application` | remove | migrated |
| GET `/api/applications/{ref}/decision` | `api/applications.py:94` | bearer (account) | `api/applications.py:get_decision` (borrower projection) | remove | migrated |
| POST `/api/session/select` | `api/applications.py:98` | bearer (account) | `api/session.py:select_application` (server-side cache keyed by `sha256(sid)`, 4 h TTL) | remove | migrated |
| — | — | — | `api/applications.py:submit_application`, `withdraw_application` | none | added |
| — | — | — | `api/documents.py:attach_document`, `remove_document`, `download_document`, `list_documents`, `list_document_types` | none | added |
| — | — | — | `api/session.py:clear_application` | none | added |
| — | — | — | `api/feedback.py:submit_feedback`, `list_feedback` | none | added |

## 4. Agent surface (stays in FastAPI)

| Legacy endpoint | Legacy file:line | Caller | Frappe-side prerequisite | FastAPI action | Status |
| --- | --- | --- | --- | --- | --- |
| POST `/api/agui` | `api/agui.py:34` | CopilotKit Node runtime | `mint_assertion` + runtime minting (`gateway.ts`) + verifier (`api/assertion.py`) | keep | migrated |
| POST `/api/chat` | `api/routes_legacy.py:125` | voice worker | assertion verifier + `api/voice.py:voice_assertion` + worker port | keep | migrated |
| POST `/api/chat/stream` | `api/routes_legacy.py:131` | voice worker | same as above | keep | migrated |
| GET `/api/decision` | `api/routes_legacy.py:114` | legacy web UI | none (agent reads Frappe evidence) | remove | retired |
| POST `/api/bureau/run` | `api/routes_legacy.py:139` | tests / operator tooling | none | keep | migrated |
| GET `/healthz` | `api/routes_legacy.py:100` | deployment probes | none | keep | migrated |

`GET /api/decision` duplicated what the portal now reads through `get_decision`; the route was removed
with the legacy UI. The chat routes accept assertions from the voice worker, which now exchanges its
`Voice Session` row for a fresh one per turn (`api/voice.py:voice_assertion`).

## 5. Voice

| Legacy endpoint | Legacy file:line | Legacy auth | Frappe replacement | FastAPI action | Status |
| --- | --- | --- | --- | --- | --- |
| POST `/api/livekit-token` | `api/routes_legacy.py:144` | bearer | `api/livekit.py:create_voice_session` | remove | migrated |
| — (worker reads token from metadata) | `voice/agent_worker.py:274,293` | LiveKit participant metadata | `api/voice.py:voice_assertion` (service role `Agent Integration`; `Voice Session` row checked for room, identity, expiry and status) | port worker | migrated |

The Frappe response shape is `{token, url, room, identity, expires_at}` — the legacy payload also carried `room`/`token`/`url`; the extra fields are additive. Frappe writes `{session_id, user, customer, application}` into the LiveKit metadata and the worker exchanges that `session_id` for a 60-second assertion before every turn; a missing, foreign, mismatched, expired or ended session is refused and the worker leaves the room. See [livekit-integration.md](../architecture/livekit-integration.md).

## 6. Demo-only and static routes (retire)

| Legacy endpoint | Legacy file:line | Why it goes |
| --- | --- | --- |
| POST `/api/session` | `api/routes_legacy.py:119` | demo identity minting; the portal has no demo mode |
| GET `/api/demo-accounts` | `api/routes_legacy.py:108` | synthetic demo picker; no replacement |
| GET `/` and `/index.html` | `api/routes_legacy.py:72-75` | replaced by `/borrower` (Frappe website routing) |
| GET `/advisory`, `/advisory/{rel}` | `api/routes_legacy.py:77-87` | React app is retired; the island mounts inside Frappe (Phase 6) |
| GET `/voice` | `api/routes_legacy.py:89` | replaced by the assistant voice mode inside the portal |
| GET `/static/{rel}` | `api/routes_legacy.py:96` | Frappe serves `/assets/loan_advisory_portal/*` |
| GET `/favicon.ico` | `api/routes_legacy.py:104` | Frappe website assets |

All rows: FastAPI action **remove**, status **retired**.

## 7. Contract changes the client must absorb

| Concern | Legacy | Frappe |
| --- | --- | --- |
| Create application | JSON body `{loan_amount, tenure_months, purpose, ...}` → `201` | Form-encoded `frappe.call` → `{name, lifecycle:"DRAFT", ...}`; CSRF token required |
| Status vocabulary | `submitted` / `under_review` / `approved` … | `status` (upstream Lending) is not shown; `custom_lifecycle_state` is (`DRAFT` first in the Select) |
| Decision | `DecisionResponse` with policy internals | `{available, decision, lifecycle, policy_version, evaluated_at, simulation, outcome, reasons, missing_fields, information_needed, provider_error, flags}` — `reasons` only contains `customer_visible` failures |
| Select application | Re-issued bearer token | No token; a server-side selection keyed by session id; `me` reports `selected_application` |
| Errors | `{"error": "..."}` with status | `{"exc_type", "_error_message"}` from `frappe.call`; portal JS reads `_error_message` first |
| Foreign resource | `404 application not found` | Same, including the HTML page (`_not_found.html`, status 404) |
| Credit score | Client-declared, 300–900 | Optional, still accepted on create; the wizard no longer asks for it (the policy engine scores) |

## 8. Removal checklist

1. ~~Delete `api/accounts.py`, `api/applications.py`, `api/routes_legacy.py` static/demo handlers, `api/auth.py` bearer verification and `application/session_status.py` in the **new** `apps/api` port.~~ Done: the new `apps/api/src/loan_advisory/api/` never contained them, and `agent/server.py` now serves only the FastAPI app (the legacy stdlib handler, `BoundedServer` and session-token helpers are deleted).
2. ~~Keep `api/agui.py`, the chat/bureau handlers and `agent/*`; add the assertion verifier in front of them.~~ Done (`auth.py`, `assertion.py`).
3. ~~Delete `apps/runtime/src/gateway.ts` bearer forwarding; replace with mint-on-request.~~ Done.
4. Legacy static pages: the chat UI is superseded by the island at `/borrower/assistant`; `apps/web/chat/*` is still in the tree but nothing serves it (the stdlib static handler is deleted). The voice page has no replacement yet — the voice UI is not part of this migration's delivered scope.
5. No `demo_mode` switch or `/api/session` route exists in the new app factory; a test asserts the removed paths are 404 — Done.
6. Grep gate: no occurrence of `Authorization: Bearer` in browser code (no browser code ships yet); no demo route in the FastAPI app factory — Done for FastAPI.

## 9. Unresolved

- Who consumes `/healthz` in deployment; no in-repo evidence.
- Whether `/api/decision` keeps a consumer after the legacy UI is deleted.
- Assertion failures are `401 {"error": "sign in first"}` — one wording for missing, malformed, expired, forged and replayed assertions; a verified assertion without an application is `409 select an application first`; an unconfigured verifier secret is `503 agent authentication is not configured`. The portal treats every 401 as "sign in again".
- No legacy endpoint covers document upload, feedback or invitation issuing; those rows are Frappe-native and have no parity target to test against.
