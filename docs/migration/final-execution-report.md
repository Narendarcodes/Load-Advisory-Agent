FRAPPE MIGRATION IMPLEMENTATION REPORT

1. WORKTREE
Original worktree: C:\Users\golla\Documents\Projects\Load-advisory-agent (branch docs/status-and-audit, HEAD 7b2bd0b)
New worktree: C:\Users\golla\Documents\Projects\Load-advisory-agent-frappe
New branch: feat/frappe-borrower-platform
Starting origin/main SHA: 7f3ef4885225ff45e23e946816d81a55aaec0ed3
Merge commit verified: 7f3ef4885225ff45e23e946816d81a55aaec0ed3 (the required PR #34 merge) is origin/main and the branch base; HEAD is still that commit because no commit has been made.

2. ORIGINAL WORK PRESERVATION
Original working tree unchanged: yes. Only read-only git queries and file reads were run in it; no reset, clean, stash, branch switch, checkout, deletion, commit or push. Its pre-existing modifications and untracked entries are intact.
Original frontend preserved: yes — apps/web/advisory and apps/web/chat in the original worktree were never edited or removed.
Original Node runtime preserved: yes — apps/runtime in the original worktree is untouched; the migration worktree carries its own adapted copy.
Selective files reused: CopilotKit chat components, plan panel, CSS and the AG-UI client were adapted into apps/web/assistant; the gateway skeleton into apps/runtime; the voice worker into apps/voice/agent_worker.py. No secrets, env files, protected HTML, build output or node_modules were copied.
Protected files untouched: yes — .gitignore, .env, infra/langfuse/.env, .cadra/, .freebuff/ and the session HTML were never inspected, printed, edited, moved, deleted or copied.

3. ARCHITECTURE
Frappe responsibilities: accounts and invitations, sessions and CSRF, borrower profiles, Loan Applications, documents, feedback, advisory conversations, voice session records, Loan Decision Evidence storage, and every borrower-facing page.
Frappe Lending responsibilities: Customer, Loan Product, Company and the Loan Application lifecycle (create → submit → docstatus 1); the portal adds custom fields and owns custom_lifecycle_state.
FastAPI retained responsibilities: the LangGraph agent, /api/agui, /api/chat and /api/chat/stream, the ZEN decision pipeline, RAG retrieval, the bureau runner, the evidence sink and Langfuse/OTel tracing.
FastAPI borrower endpoints migrated: /api/session, /api/demo-accounts, /api/decision, /api/livekit-token, /api/accounts/*, /api/applications/* and /api/session/select are removed; a test asserts each removed path is a JSON 404.
CopilotKit integration: the React island calls same-origin /api/copilotkit; the Node runtime mints a 60-second Frappe assertion per request with the browser cookie and CSRF header, without exposing it to page JavaScript.
Node runtime: apps/runtime, a thin CopilotKit gateway (mint + forward one Authorization header), 12 tests, exact-origin CORS.
AG-UI: /api/agui verifies the assertion (iss/aud/TTL/skew/single-use jti), fixes the application from the claim, and streams events; 12 agent-boundary tests.
LiveKit: Frappe mints a scoped room token and writes a Voice Session row before returning it; the ported worker exchanges {session_id, room, identity} for a per-turn assertion. No live room has been exercised and no voice UI exists.

4. FRAPPE APPLICATION
App name: loan_advisory_portal 0.1.0.
Installed versions: Frappe 16.51.0, ERPNext 16.50.0, Lending 16.6.1, bench 5.31.0, MariaDB 11.8, Python 3.14.8.
Disposable site: loanportal.local, reached for browser work through a throw-away nginx front door on 127.0.0.1:8081 that pins Host/X-Frappe-Site-Name to loanportal.local. The shared p1loan.local was never touched.
Custom DocTypes: Borrower Profile, Account Invitation, Account Invitation Redemption, Borrower Feedback, Advisory Conversation, Voice Session, Loan Decision Evidence (7).
Portal routes: /borrower, /borrower/apply, /borrower/application, /borrower/profile, /borrower/feedback, /borrower/invite, /borrower/assistant; Frappe /login for sign-in. Nine api modules back them.
Authentication: Frappe session cookie + CSRF; invitation redemption creates User/Profile/Customer binding and signs the borrower in; guests are redirected to /login?redirect-to=…; the portal is invitation-only and has no demo mode.
Permissions: Loan Borrower role scoped to its own Customer and applications; Agent Integration for the voice worker (read-only on evidence); System Manager for administration; Lending doctypes stay closed to borrowers.
Lending integration: custom fields on Loan Application via install.py (no upstream patch), submit sets docstatus 1, withdrawal keeps the audit trail, and post-submit writes are limited to allow_on_submit fields.

5. SCREEN IMPLEMENTATION
Screen groups completed: dashboard (stats, list, badges, empty state), five-step apply wizard with client and server validation, application detail (summary, documents/upload/download, timeline, withdraw, decision projection), profile, feedback, invitation (validate/redeem), assistant (application chooser, chat island, plan panel), friendly 404, login/logout.
Incomplete screens: voice mode. The legacy /voice page was a synthetic demo and was retired with the static UI; /borrower/assistant mounts text chat only.
Responsive verification: verified at 390 x 844 in Edge — six signed-in pages have zero document-level horizontal overflow and all five nav links remain visible; tablet widths and assistive technology are unmeasured. A full 1360 x 900 pass covers every journey.
Loading and error states: island loading/error recovery, page flash alerts, inline wizard errors, 404 pages, guest redirects and busy/unavailable responses are implemented and exercised; no console errors in the browser run.

6. INTEGRATION
Frappe ↔ Frappe Lending: verified — create → attach → submit (SUBMITTED, docstatus 1), evidence evaluation, decision card, withdraw; 87 Frappe tests plus browser journeys.
Frappe ↔ FastAPI agent: verified — mint_assertion under a real browser session, assertion accepted once, replay/tamper/malformed refused with 401 "sign in first"; body cannot override the asserted application.
CopilotKit ↔ Node runtime: verified — island → /api/copilotkit through the front door; the runtime mints with the cookie and CSRF header; foreign origins are not echoed.
Node runtime ↔ AG-UI: verified by 12 runtime tests; the gateway forwards only Authorization and never the cookie.
Frappe ↔ LiveKit: token mint and Voice Session row verified by L1 tests; the worker exchange is verified against the contract with mocked HTTP. No live LiveKit room and no browser voice session were exercised.

7. SECURITY
Session validation: guests get 302 (pages) or 403 (methods); non-borrowers are refused; suspended or unlinked profiles are blocked; logout invalidates the session for both listing and minting.
Ownership checks: foreign application → 404 on detail, decision, documents, assistant page; foreign download → 404; unknown evidence row → 403; listing contains no other borrower's id, email or customer.
Invite security: single-use <id>.<secret> token, hashed at rest, expiry, revocation, duplicate email/customer and password/consent validation; issuing requires System Manager; signed-in users are redirected away from the invite page.
Conversation ownership: foreign thread join and record_turn are 403; the assertion and thread are scoped to one verified borrower and application.
Voice token security: room-scoped JWT from site config; metadata carries identifiers, not credentials; the service role checks session row, room, identity, expiry and status (Created → Joined, 404/409 on mismatch); the API secret never reaches the browser.
Cross-borrower tests: 39/39 HTTP checks — IDOR set, CSRF missing/wrong, replay/tamper/malformed assertion, body override, PII absence, voice bridge refusals, CORS allow/deny, logout.

8. TEST RESULTS
Frappe tests: 87/87 OK (`bench --site loanportal.local run-tests --app loan_advisory_portal`).
Python tests: 633 passed, 15 skipped (live-Frappe, live-Langfuse, live-LLM gates and POSIX permission bits on Windows).
Ruff: all checks passed.
Node tests: runtime 12/12; island typecheck clean and 11/11.
Playwright: 36/36 browser checks on Edge through 127.0.0.1:8081.
Integration tests: 12 agent-boundary tests and 5 voice-exchange tests (inside the pytest total); 12 runtime tests; 11 island tests.
Security tests: 39/39, after a clean teardown → seed → seed_evidence → run cycle.
Skipped tests: 15, all opt-in live-environment gates or platform-specific assertions; none hide a failing area.
Reproducibility note: the final cycle exposed and fixed two fixture defects — the seeded evidence writer lacked Loan Application access (now System Manager + Loan Manager), and teardown deleted linked evidence before clearing the application's back-link (now cleared first).

9. FASTAPI STATUS
Agent endpoints retained: GET /healthz, POST /api/agui, POST /api/chat, POST /api/chat/stream, POST /api/bureau/run.
Borrower endpoints removed: /api/session, /api/demo-accounts, /api/decision, /api/livekit-token, /api/accounts/*, /api/applications/*, /api/session/select, the static UI and /advisory routes.
Internal APIs retained: decision_engine/ and rag/ (unmodified), the evidence sink, the Frappe read adapter, bureau execution, tracing and admission control.
Duplicate responsibilities remaining: none identified. /api/chat and /api/chat/stream serve turn and streaming callers respectively, both under the same assertion verifier.

10. REMAINING WORK
Known limitations: no voice UI and no live LiveKit room; no password reset or email verification (invitation links are handed over by an operator); responsive proof covers 390 px only; no load or automated accessibility testing; the island bundle carries ~19 MB of shiki chunks.
Unverified integrations: the voice worker's room join, transcript flow and hang-up; the production reverse proxy (the front door here is a dev harness); horizontal scaling of the assertion verifier (the jti cache is per process and needs Redis).
Required production configuration: SMTP or an identity provider for reset/verification; same-host reverse proxy for Frappe, /api/copilotkit, LiveKit and assets; a write grant or dedicated service account for evidence (Agent Integration is read-only); production LLM and Langfuse credentials; a deliberate site-name header instead of the shared default.
Outstanding technical decisions: voice UI placement and consent/retention policy; aligning Borrower Profile locale/literacy vocabulary (en/hi/mr, standard/plain) with the agent (en/hi/te, low/medium/high); whether to align Lending's native status with custom_lifecycle_state; thread-history hydration and identifyUser in the island.

11. GIT
Changed files: 21 modified tracked files (README.md, agent server/settings, evidence_store.py, voice worker, agent/architecture/observability docs, voice infra scripts, requirements.txt, nine test modules).
Untracked files: 20 entries — apps/loan_advisory_portal/, apps/runtime/, apps/web/assistant/, apps/api/src/loan_advisory/api/, apps/voice/voice_assertion_exchange.py, four architecture docs, docs/migration/ (including this report), docs/development/, docs/testing/, tests/e2e/ (README, proxy config, harnesses, seed_evidence, output), tests/test_agent_api.py, tests/test_voice_assertions.py.
Commits: none.
Push: none.
PR: none.
Merge: none.

No commits, pushes or merges were authorized.

12. POST-AUDIT HARDENING STATUS (2026-10-31)
This section is appended after the independent audit. Sections 1–11 above remain the original
report; where they differ from this section, this section and its linked records supersede them.
Labels: **verified** = current-run evidence in this branch; **test-only** = proven against local
harnesses/fixtures, not a deployment; **unverified** = not exercised.

| Phase | Status | Label | Record |
|---|---|---|---|
| A — independent audit | Complete; findings left as the original record | verified (read-only) | [frappe-implementation-audit.md](../audit/frappe-implementation-audit.md) |
| B1 — shared replay protection | Redis `SET NX EX`, fail closed, production refuses memory | verified (unit + two-process Redis) | audit §7; `tests/test_assertion_replay.py` |
| B2 — least-privilege evidence service | Dedicated `Evidence Service` identity, linkage, audit log | verified (unit) | `tests/test_evidence_api.py` |
| B3 — canonical lifecycle | One contract, audit history, resubmit path | verified (unit + browser resubmit) | [loan-lifecycle-mapping.md](../architecture/loan-lifecycle-mapping.md) |
| B4 — auth/authz, limits, proxy, headers | Ownership matrix, CSRF, budgets, CSP/HSTS/`Retry-After` | verified (unit + browser) | [rate-limits.md](../architecture/rate-limits.md) |
| B5 — identity and thread history | Thread binding, server-verified restore, history list | verified (unit + browser) | [copilotkit-agui-integration.md](../architecture/copilotkit-agui-integration.md) |
| C — voice UI and lifecycle | Consent-gated UI and server preconditions; worker auth unchanged | test-only; **live call unverified/BLOCKED** | audit §7; LiveKit has no server or credential here |
| D — remaining screens | Public help/products/terms/privacy, guidance, resubmit | verified (unit; browser where listed) | [screen-completion-matrix.md](screen-completion-matrix.md) |
| E — responsive/a11y/perf | Six widths, axe 20 scans, lazy-load measured | test-only (Edge + axe in the disposable environment) | [responsive-accessibility-performance.md](../testing/responsive-accessibility-performance.md) |
| F — proxy, multi-worker, load | Hostile-header proof, shared state, bounded load | test-only (local nginx/Redis/dev server) | [production-readiness.md](../testing/production-readiness.md) |
| G — canonical vocabulary | One `en/hi/te` + `low/medium/high` contract across portal and agent | verified (unit) | [config/borrower_preferences.json](../../config/borrower_preferences.json) |
| H — final regression | 169 Frappe OK, 683 host passed, runtime 13, island 34, journeys 36/36, security 39/39, targeted browser 17/17 | verified (current run) | [test plan Addendum H](../testing/borrower-platform-test-plan.md#addendum-h--final-full-regression-2026-10-31) |

Superseded statements: §7/§10's "duplicate responsibilities remaining: none identified" is
replaced by the B3/B5/G contracts; the per-process jti cache and "needs Redis" are resolved by
B1/F; the dev-harness-only front door is replaced by the in-repo production template (test-only,
not deployed); the locale/literacy mismatch is resolved by G; browser suites were rerun in H and
are now evidence rather than standing claims. Still open as owner decisions: SMTP/identity for
password reset and verification, checkpoint retention, LiveKit deployment and per-session worker
credentials, and the Lending↔portal status synchronization policy. The platform is **not**
production-ready: no deployment, no live voice call, no SMTP/IdP and no external LLM/Langfuse
integration is claimed.

No commits, pushes or merges were authorized.
