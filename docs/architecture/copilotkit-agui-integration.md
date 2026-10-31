# CopilotKit / AG-UI integration

Status: **implemented end to end (Frappe mint → Node runtime → FastAPI verifier, and the React
island served from `/borrower/assistant`); the browser path is verified through the Phase 9 harness
(`tests/e2e/`).**

## The legacy (pre-migration) wiring, for reference

The rows below describe the original React app in the pre-migration worktree; they are kept so the
migration's changes are readable, not as current state.

| Piece | Where | Behaviour |
| --- | --- | --- |
| React provider | `apps/web/advisory/src/main.tsx:21` | `CopilotKitProvider runtimeUrl="/api/copilotkit" agentId="advisory" headers={authHeaders}` wraps the whole router |
| Turn driver | `screens/ChatScreen.tsx:47-51` | `useAgent({ agentId: "advisory", updates, throttleMs: 60 })` |
| Run call | `components/ChatPanel.tsx:79-88` | `agent.runAgent({ runId: uuid, forwardedProps: { locale, literacy } })` |
| Browser credential | `api.ts:15-31` | HMAC session token held in a module variable; `authHeaders()` returns `Authorization: Bearer …` |
| Node gateway | `apps/runtime/src/gateway.ts:42-72` | base path `/api/copilotkit`, agent id `advisory`, upstream `AGENT_AGUI_URL` (default `http://127.0.0.1:8000/api/agui`) |
| Identity forwarding | `gateway.ts:37-39,49-54` | copies only `Authorization`; `x-user-id`/`x-applicant-ref` deliberately ignored |
| CORS | `gateway.ts:62-68` | `authorization, content-type`, `credentials: false` |
| Telemetry | `gateway.ts:28-29` | CopilotKit telemetry disabled |
| AG-UI service | `apps/api/src/loan_advisory/api/agui.py:34-59` | auth before streaming, validates thread/run ids, last user message capped at 4000 chars, reads `forwardedProps.locale/literacy` |

The gateway is stateless: one `HttpAgent` per request, no persistence, no token validation of its own. Thread state lives in FastAPI (`agent/checkpoint.py`, selected by `agent/runtime.py`; `MemorySaver` is the development default and Redis is required for more than one worker), scoped as `applicant_ref::conversation_id` (`graph.py:118`).

Versions (Phase 2 check): `@copilotkit/runtime` 1.83.0 and `@copilotkit/react-core` 1.83.0, `@ag-ui/client` 1.0.2 against Python `ag-ui-protocol` 1.0.0, React 19.2, host Node 24.18. Majors align; the Python endpoint encodes the AG-UI events itself (`api/events.py`), so the JS client is the only consumer whose upgrade can change the contract — pin it and keep the event-sequence test in `apps/runtime/test/`.

There is **no `identifyUser` call** anywhere in the React app and no user-id header. Identity is exactly the bearer token.

### AG-UI event sequence (verified in `api/agui.py:106-125`, builders in `api/events.py:21-43`)

`RUN_STARTED` → `TEXT_MESSAGE_START` → one `TEXT_MESSAGE_CONTENT` per guarded sentence (delta + trailing space) → `STATE_SNAPSHOT` → `TEXT_MESSAGE_END` → `RUN_FINISHED`, with `RUN_ERROR` on failure. The state snapshot is an allowlist that excludes timings and internal state (`events.py:11-13`). No AG-UI tool-call events are emitted: tools run inside the server-side graph.

## Target design

The browser keeps only the Frappe session. The runtime exchanges it for a 60-second assertion per run.

```
CopilotKit React (Frappe page)
   │ POST /api/copilotkit/agent/advisory/run   (same origin, cookie included)
   ▼
Node runtime  ──POST /api/method/loan_advisory_portal.api.agent.mint_assertion (Frappe cookie)
   │            ◄── {assertion, expires_in, jti, application, customer}
   │ POST <agui_url>  Authorization: Bearer <assertion>
   ▼
FastAPI /api/agui  ── verify issuer/audience/expiry + single-use jti
   └─► LangGraph turn → evidence sink (Frappe `Loan Decision Evidence`)
```

### Implemented on the Frappe side

| Endpoint | File | Notes |
| --- | --- | --- |
| `POST mint_assertion(application?, thread_id?)` | `api/agent.py:113` | borrower context + `agent-mint` budget; application resolved through `owned_application` or the cached selection (no unbound thread); creates or refreshes the `Advisory Conversation` with `user`, `customer` and `application` fixed; returns assertion, jti, application, customer, thread |
| `POST record_turn(thread_id, question?, answer?)` | `api/agent.py:169` | owner-checked, `conversation-log` budget; appends both sides to the transcript child table, trims to 200 rows, advances `turn_count` and sets the title from the first question |
| `GET list_conversations(application?)` | `api/agent.py:199` | the borrower's own threads (optionally for one owned application), newest activity first, at most 50 |
| `GET conversation_messages(thread_id)` | `api/agent.py:214` | owner-checked transcript: application, title, count and the last 100 messages |
| Assertion mint/verify | `services/assertion.py` | HMAC envelope, 60 s TTL, 30 s skew, `iss`/`aud`, `jti`, plus the borrower's `literacy`/`locale` in agent vocabulary (`plain → low`, `standard → medium`) |

`Advisory Conversation` stores `thread_id`, `user`, `customer`, `application`, `status`, `turn_count`,
`last_activity` and a `messages` child table (`Advisory Message`: role, text). The binding is
**immutable**: a thread that belongs to another account is `Forbidden`, and re-using one for a
different application is `Conflict` (`_touch_conversation`, `api/agent.py:67`); there is no silent
rebinding. A foreign or oversized thread id is rejected, and a foreign application is a 404. Reads of
a foreign conversation are `NotFound`, identical to a missing one.

Tests: `tests/test_agent_bridge.py` (16) covers scoping, selection fallback, selection required,
create-once/no-rebinding, foreign thread, relinked profile, foreign application, oversized thread,
transcript/title/buffer caps, transcript ownership, history scoping and cross-borrower read denial;
`tests/test_assertion.py` (9) covers round trip, tampering, wrong audience, expiry, malformed input,
scoping, agent preferences, missing secret.

### Implemented runtime bridge (`apps/runtime/src/gateway.ts`)

| Step | Where | Behaviour |
| --- | --- | --- |
| Read the session | `mintCredential` (`gateway.ts:88`) | POST runs only; requires both a `cookie` and an `x-frappe-csrf-token` header, otherwise no mint attempt |
| Read the run context | `runContextOf` (`gateway.ts:55`) | clones the run body once and keeps only a shape-valid `threadId` and `forwardedProps.application`; both are untrusted and re-validated by Frappe |
| Bind the conversation | `threadIdOf` (`gateway.ts:75`) | sends the thread id as `thread_id`; Frappe rejects a foreign or oversized thread |
| Scope the turn | `applicationOf` (`gateway.ts:80`) | sends the application as `application`; Frappe resolves it through `owned_application`, so somebody else's id is a 404 and the run fails closed |
| Mint | same | `POST {FRAPPE_BASE_URL}{FRAPPE_MINT_PATH}` with the cookie + CSRF header, JSON body, `FRAPPE_MINT_TIMEOUT_MS` (default 5000) |
| Fail closed | same | no cookie or CSRF header yields an agent with **no** `Authorization`; FastAPI answers 401 and the browser sees a genuine `RUN_ERROR` sign-out |
| Refuse visibly | `MintRefused` (`gateway.ts:50`) | the exchange runs inside the agent's `fetch` (`gateway.ts:205`), so a Frappe 403/404/409/503 becomes a `RUN_ERROR` carrying `HTTP <status>: <reason>` — never a fake 401 or a gateway 500 |
| Forward | `createGateway` (`gateway.ts:192`) | only `Authorization: Bearer <assertion>` reaches `/api/agui`; nothing is cached across requests |
| CORS | `gateway.ts:224-234` | exact origin list (defaults to the Frappe site origin), `x-frappe-csrf-token` allowed, `credentials: true` |

CopilotKit forwards every inbound `x-*` header (and `authorization`) to the agent URL by default,
which would leak the CSRF token to FastAPI and comma-join `content-type`. The runtime therefore sets
`forwardHeaders: { allow: ["x-loan-advisory-forward-nothing"] }` (`gateway.ts:170`): an allowlist
containing a name no client sends, so the effective set is empty. A test asserts FastAPI sees exactly
one `content-type` and never a cookie or CSRF header.

Environment: `FRAPPE_BASE_URL` (default `http://localhost:8080`), `FRAPPE_MINT_PATH`,
`FRAPPE_MINT_TIMEOUT_MS`, `AGENT_AGUI_URL`, `AGENT_WEB_ORIGINS`, `AGENT_RUNTIME_PORT/BASE_PATH/AGENT_ID`.

Tests: `apps/runtime/test/gateway.test.ts` (13: mint per run, no cookie/no CSRF/no mint, foreign
application, mint refusal with its own status, empty mint as a service failure, rebound conversation,
identity-header spoofing, replay, CORS with credentials, concurrent applicants, header minimisation,
application scoping and the malformed-reference drop).

### Implemented React island (`apps/web/assistant`)

A separate Vite app, not the legacy SPA: it mounts one CopilotKit provider and one chat panel into the
server-rendered page and nothing else. The merge of the two sources of truth is the point — identity,
language and tone stay in the assertion; only the application reference travels from the page.

| Piece | Where | Behaviour |
| --- | --- | --- |
| Bootstrap | `src/main.tsx:17-26` | `CopilotKitProvider runtimeUrl="/api/copilotkit" agentId="advisory" headers={() => ({ "x-frappe-csrf-token": context.csrfToken })} enableInspector={false}`; the cookie is attached by the browser, never by the island |
| Page context | `src/context.ts:19` | reads `#assistant-context` JSON; throws on a missing element, JSON, application, CSRF token or user; literacy ∈ low/medium/high and locale ∈ en/hi/te, defaulting to medium/en; `voice` is enabled only by an explicit `true` and carries the notice version |
| Turn driver | `src/island.tsx:14` | `useAgent({ agentId: "advisory", updates, throttleMs: 60 })` |
| Run call | `src/chat-panel.tsx:72-73` | `agent.runAgent({ runId: crypto.randomUUID(), forwardedProps: { application } })` — no locale, no literacy, no identity |
| Conversation | `src/thread.ts:21` | one id per **account + application** (`loan-advisory:thread:${user}:${application}`), reused from `sessionStorage`; a different borrower on the same browser never inherits it; "New conversation" mints a fresh one and stops the previous one |
| History list | `src/island.tsx` (aside) | `list_conversations` for the page's application, newest first, maximum 8; the current thread is `aria-current` |
| Restore | `src/island.tsx` (restore effect) | adopts the remembered thread only if it belongs to this account and application, then replays the server transcript (`conversation_messages`) into the agent without re-running it; 404 restores nothing, 401 sends the borrower back to sign in |
| Turn log | `src/chat-panel.tsx` (`onAnswered`) | after a successful run the panel sends the question and final answer to `record_turn`, then refreshes the list; the server decides role and ownership |
| Conflict | `src/chat-panel.tsx` (`onConversationReset`) | a `RUN_ERROR` naming another application or account starts a fresh thread for the current page instead of retrying the doomed one |
| Errors | `src/chat-panel.tsx:28-34` | 401 → sign-in redirect, 409 → "choose an application", 503 → busy/unavailable, each with a retry |
| Voice panel | `src/voice-panel.tsx`, `src/voice.ts`, `src/voice-transport.ts` | explicit consent before a session exists; real LiveKit states; mic mute; remote audio; End/expiry; transcript hide/clear; LiveKit SDK loaded as a lazy chunk. Not part of the AG-UI path — voice uses Frappe's own assertion exchange, see [livekit-integration.md](livekit-integration.md) |
| Page | `www/borrower/assistant.py`, `assistant.html` | borrower-only; `?application=` or the cached selection; a foreign/unknown id is a 404, a stale selection falls back to the chooser; the context carries `user`, `application` and `csrf_token` |
| Build | `apps/web/assistant/vite.config.ts` | lib mode → `public/js/assistant/assistant.js` + `assistant.css` + `chunks/`; the emitted CSS is a fixed name so the template can link it |

KaTeX's CSS is aliased to an empty module: CopilotKit imports it dynamically, and Rolldown inlines
the fonts as base64 regardless of `assetsInlineLimit`, which produced a 1.46 MB stylesheet. The chunk
directory is ~20 MB because CopilotKit ships optional syntax-highlighting grammars; the legacy bundle
had the same payload.

The run is same-origin, so the browser's default `same-origin` credentials policy attaches the Frappe
cookie to `/api/copilotkit`; only the CSRF header is supplied by the island.

Tests: `apps/web/assistant/src/*.test.ts(x)` (33: context parsing incl. the account key and the
voice block, thread reuse/rotation per account+application, history reads and the CSRF-protected turn
write, the panel's "only the application is forwarded", 401 handling, the stored exchange, the
conflict reset, and the voice API/panel suites described in
[livekit-integration.md](livekit-integration.md)).

### Implemented FastAPI verifier (`apps/api/src/loan_advisory/api/`)

| Piece | Where | Behaviour |
| --- | --- | --- |
| Verifier | `assertion.py:187` | HMAC over the raw body, `iss`/`aud` pinned, `iat` ≤ now+30 s, `exp` > now, lifetime ≤ 300 s |
| Replay | `assertion.py:155` | shared `ReplayGuard`; Redis `SET NX EX`, key TTL `exp + 90 s`; store failure fails closed (503); memory backend refused in production |
| Claims | `assertion.py:230` | `customer → applicant_ref` (Frappe Customer name), optional `application`, `thread`, `literacy`, `locale` |
| Auth | `auth.py:19` | missing/bad assertion → 401 `sign in first`; unconfigured secret → 503; `require_application` → 409 before any stream; `require_conversation` (`routes_agent.py:41`) → 403 when the body names a conversation other than the asserted one |
| Thread binding | `agui.py:44` | AG-UI refuses a run whose `threadId` is absent from or differs from the assertion's `thread` claim (403), so the token cannot be reused to stream into another conversation |
| Routes | `routes_agent.py:39`, `agui.py:31` | `/healthz`, `/api/chat`, `/api/chat/stream`, `/api/bureau/run`, `/api/agui` only |
| App | `app.py:64` | security headers, admission cap, JSON error shapes; no static UI, demo, account or application routes |

The agent's `literacy`/`locale` now come from the assertion (the borrower profile, translated in
`services/assertion.py`), not from AG-UI `forwardedProps`; a client-supplied value cannot change them.
The AG-UI event contract is unchanged, so the React island needs no protocol change.

Tests: `apps/runtime/test/gateway.test.ts` (13, listed above) and `tests/test_agent_api.py` (14:
401/503/409/422, event sequence, allowlisted state, claim-derived identity, thread reconciliation,
single-use, expiry/forgery/lifetime, NDJSON parity, conversation mismatch, body limits, removed
routes). The page itself is covered by
`apps/loan_advisory_portal/.../tests/test_assistant_page.py` (7: requested/selected application,
foreign and unknown id, chooser, stale selection, guest redirect, account key).

## Identity and privacy rules

- The assertion is the only thing crossing from Frappe to FastAPI; no cookie, no PII beyond the user/customer identifiers already required for tool scoping.
- Thread ids are untrusted input; FastAPI already treats them as such (`agui.py:39`) and the portal enforces ownership.
- Langfuse masking rules remain the source of truth for what may leave the process (`agent/observability.py:46-47,162-180`).

## Unresolved

- Cookie scope: cookies are host-scoped, not port-scoped, so the runtime must share the Frappe **host**
  (`localhost` in development, one domain in production). If it is moved to another host it needs the
  signed hand-off described above; the gateway currently assumes same-host.
- Replay state is shared through Redis (`ASSERTION_REPLAY_BACKEND=redis` plus
  `ASSERTION_REPLAY_REDIS_URL`); see [assertion-security-and-scaling.md](assertion-security-and-scaling.md).
- CopilotKit's `identifyUser` is unused; a stable display identity for threads may want it.
- The Frappe transcript is the durable conversation record and what the island restores. FastAPI's
  LangGraph checkpointer comes from `build_checkpointer()` (`agent/checkpoint.py`): process-local memory
  in development, shared Redis (`AGENT_CHECKPOINT_REDIS_URL`, defaulting to the replay URL) as soon as
  more than one worker exists, and a refusal to start on memory when `APP_ENV`/`ENVIRONMENT` is
  production. Retention is an owner decision — `AGENT_CHECKPOINT_TTL_S=0` keeps checkpoints until the
  operator sets a TTL. Two-process continuation is proven in `tests/e2e/two_worker_check.py`; a
  restored thread that predates the shared store still replays the transcript to the borrower without
  pretending the graph saw it.
- A restored thread is adopted only when the account and application match; a stale or foreign thread
  is answered as missing (404) and the island simply starts a new conversation. Identity change and
  logout are handled by the account-scoped key plus the assertion check at mint time.
- The island's `/api/copilotkit` URL assumes the reverse proxy in the documented topology. In the
  disposable environment a throw-away nginx container supplies it (`tests/e2e/nginx.loanportal.conf`,
  `127.0.0.1:8081`): `/api/copilotkit` → the local runtime, everything else → the site's dev server.
  Phase 9 exercised the full browser path through it (36 journey checks); the production proxy still
  has to route the same two upstreams.
