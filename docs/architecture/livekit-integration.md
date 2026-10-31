# LiveKit integration

Status: **implemented and unit-tested end to end across Frappe, the worker contract and the island UI, including explicit consent and session lifecycle. A live LiveKit room has not been exercised — the configured URL is `wss://livekit.invalid` and no LiveKit server or voice worker container is running, so the live test is BLOCKED (see below).**

## What existed before this phase (legacy worktree, historical)

| Step | Where | Detail |
| --- | --- | --- |
| Session start | `apps/web/chat/voice.html:74-97` | `POST /api/session` (demo sign-in), then `POST /api/livekit-token {literacy, locale}`, then `room.connect(url, token)` |
| Token minting | `apps/api/src/loan_advisory/agent/server.py:427-447` | requires a selected application; 503 unless `LIVEKIT_API_KEY/SECRET/URL` are set; room `loan-<sha256(app)[:10]>-<uuid6>`; participant identity `applicant-<uuid8>` |
| Credential | same | JWT metadata carried a freshly signed **1-hour advisory bearer token** plus `literacy`/`locale` |
| Worker | `apps/voice/agent_worker.py` | reads participant metadata, builds `AdvisorAgent`, sends the bearer to `/api/chat/stream`, `conversation_id = voice-<session_id>` |

The legacy page had no consent gate or record, and its UI was a synthetic demo retired with the static frontend. Both are replaced below.

## Current design

Frappe issues the LiveKit token; the `Voice Session` row is the authorisation.

```
/borrower/assistant (voice panel) ──POST create_voice_session {application, consent: 1}──► Frappe
        │                                                       │ writes Voice Session row
        │◄── {token, url, room, identity, session_id, expires_at} ┘   (consent_version + consent_at)
        ▼
LiveKit room ── participant metadata {session_id, user, customer, application} ──► worker
                                                                                   │
                                        verify Voice Session row (session_id, room,
                                        identity, consent_version, not expired, status)
                                                                                   ▼
                                                    mint/obtain assertion → FastAPI /api/chat/stream
```

### Frappe side (implemented)

- `POST api/livekit.create_voice_session(application?, consent)` (`api/livekit.py:31`):
  - borrower context required; the application comes from the argument or the cached selection and is ownership-checked **before** consent, so a foreign id is a 404 whether or not the notice was ticked;
  - **without `consent` the call is refused with `403` and no row is written**; the notice version (`services/livekit_token.CONSENT_VERSION = "voice-consent/1"`) and `consent_at` are stored on the row;
  - rate limit `voice-session` 10/hour applies only to consented starts;
  - room `loan-<sha256(customer:application)[:16]>-<8 hex>`, identity `applicant-<uuid4>`, `session_id` 32 hex;
  - metadata is `{session_id, user, customer, application}` — **no bearer token**;
  - writes the `Voice Session` row (`session_id`, `room`, `identity`, `user`, `customer`, `application`, `expires_at`, `status`, `created_at`, `consent_version`, `consent_at`) *before* returning the token;
  - the response adds `session_id` so the browser can close its own session; it is an identifier, not a credential — the assertion still requires the worker's service role.
- `POST api/livekit.end_voice_session(session_id)` (`api/livekit.py:95`):
  - borrower context required; another borrower's or an unknown id is a 404;
  - a live session becomes `Ended` with `ended_at`; a terminal session is reported unchanged, so retries from a closing tab and a second tab converge on one state;
  - no rate limit: the effect is idempotent and bounded to the caller's own row.
- `services/livekit_token.py`: HS256 JWT built without the LiveKit SDK (`iss`, `sub`, `name`, `nbf`, `iat`, `exp`, `jti`, `video` grant with join/publish/subscribe/data), 600 s TTL, secret read from site config (`livekit_api_key`, `livekit_api_secret`, `livekit_url`), `ServiceUnavailable` when any is missing.
- `POST api/voice.voice_assertion(session_id, room, identity)` (`api/voice.py:80`): reserved for the `Agent Integration` service role. Looks up the row by `session_id`, requires room and identity to match, **refuses a row whose `consent_version` is not the current notice (`403`)**, marks Created → Joined, refuses `Ended`/`Expired` with `409` and marks a past-`expires_at` row `Expired`. Returns a fresh 60-second assertion (thread `voice-<session_id>`) plus `{application, customer, thread, session_id}`.
- Page context (`www/borrower/assistant.py`): the island receives `voice: {enabled, consent_version}`. `enabled` reflects configuration only, so an unreachable service is reported by the panel as a failed join rather than hiding a feature the site offers.

### Island UI (implemented)

`apps/web/assistant/src/voice-panel.tsx`, mounted in the assistant aside:

- **Explicit consent** — a checkbox with the notice text and version; Start is disabled until it is ticked. Consent is sent with the create request and recorded server-side; the browser never receives an assertion.
- **Real room states** — `connecting`, `connected`, `reconnecting`, `ended`, `failed` come from LiveKit's `ConnectionStateChanged`/`Disconnected` events (`voice-transport.ts`), not from UI guesses.
- **Microphone** — enabled only after `room.connect`; a Mute/Unmute toggle calls `setMicrophoneEnabled` and reflects that state. Blocked or missing microphones are explained.
- **Audio** — remote audio tracks are attached to media elements on `TrackSubscribed` and detached on `TrackUnsubscribed`/disconnect; the LiveKit SDK is a lazy chunk (≈658 kB, loaded only when a call starts).
- **Transcript controls** — the worker's per-turn JSON on the `advisor` topic (`transcript` = recognised question, `answer` = spoken answer) is appended to the panel. Hide/Show toggles it with `aria-pressed`; Clear removes it from this page only.
- **Lifecycle** — End session disconnects the room and calls `end_voice_session` with `keepalive`; the panel also ends itself at the server-provided `expires_at` and on unmount (navigation), so no live room is left behind. A new session can be started afterwards.
- **Failure** — create refusals, 401 redirects to `/login`, connect/microphone failures and reconnects each have their own message; the text chat stays usable throughout.

### The worker exchange

`apps/voice/agent_worker.py`:

1. reads `{session_id, user, customer, application}` from participant metadata and validates `session_id` against `^[0-9a-f]{32}$`; missing metadata leaves the room instead of starting a turn;
2. calls Frappe with the worker's own API key (`Authorization: token <key>:<secret>`, env `FRAPPE_URL` / `FRAPPE_API_KEY` / `FRAPPE_API_SECRET`) to obtain an assertion — the browser never supplies a credential;
3. posts each turn to `/api/chat/stream` with `Authorization: Bearer <assertion>` and `conversation_id = voice-<session_id>`, refreshing the assertion per turn so a long call never reuses one;
4. publishes `{answer, intent, action, abstained, citations, decision_card, improvement_plan, what_if, handoff_ref, transcript}` on the `advisor` data topic; the turn log records metadata and omits the transcript;
5. a session without recorded consent, wrong room/identity, an ended session or an expired one ends the call before any turn is processed.

There is no local fallback: without the Frappe credential the worker raises before greeting.

## Privacy rules that hold

- The LiveKit API secret never leaves the server; the browser gets a scoped, short-lived JWT only.
- Participant metadata carries identifiers, not credentials.
- A session exists only after the borrower accepted the notice; the version and time are on the row, and the worker refuses a row that lacks them.
- Transcripts stay on the data channel and in the borrower's open page; the audit log records turn metadata only.
- Room names are derived from a hash of customer + application, so a leaked room name does not expose who applied.
- No permanent audio retention policy is defined in this document; nothing here promises one.

## Tests (current run, 2026-10-31)

| Suite | Count | Evidence |
| --- | --- | --- |
| `tests/test_livekit.py` | 9 | signed/scoped token, `session_id` returned, consent required and recorded, foreign application 404, missing config 503, owner end + idempotent retry, expiry reported as closed, foreign/unknown end 404 |
| `tests/test_voice_assertion.py` | 11 | per-turn scoped assertion, borrower/guest refused, wrong room/identity/unknown id, expired marked, ended refused, **missing or older consent version refused without flipping status** |
| `test_authorization_matrix.py` | 8 | `end_voice_session` listed, POST-only, guest/plain-user refused |
| `test_assistant_page.py` | 8 | `voice.enabled` true when configured, false when not, version always sent |
| Island `voice.test.ts` | 5 | consent payload, keepalive end, typed refusals, redirect = signed out, borrower-facing messages |
| Island `voice-panel.test.tsx` | 7 | disabled state, consent gating + join, transcript hide/clear, end in room + server, blocked microphone closes the session, reconnect state, 401 sign-in |

Full app run: `Ran 154 tests … OK`; island `33 passed`; typecheck clean.

## Live test: BLOCKED

No successful live call is claimed. Observed on 2026-10-31:

- site config `livekit_url` is `wss://livekit.invalid` (a deliberately non-routable host);
- `docker ps` shows no LiveKit server container and no voice-worker container;
- the backend container has no worker API credential environment.

With no reachable SFU there is no room to join, so the browser, audio, transcript and hang-up paths are verified only by the unit suites above. The live test stays BLOCKED until valid credentials and a running LiveKit server/worker exist; nothing was fabricated or invented.

## Unresolved

- **Live room** — requires a real LiveKit deployment with credentials; see BLOCKED above.
- **Consent copy** — engineering now records consent and version; the exact wording is still a product/legal decision. Changing it means bumping `CONSENT_VERSION`, which invalidates older rows by design.
- **Retention** — no permanent retention policy for audio or voice transcripts is defined; the text transcript lives in the open page only, and the server-side conversation row is bounded like text chat (Phase F/H review).
- LiveKit's room-level permissions for the agent participant are unchanged from the legacy service.
