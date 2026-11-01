# Screen completion matrix

What exists in the Frappe borrower portal after Phase D, what backs it, and what is deliberately deferred. Verified on the disposable site `loanportal.local` on 2026-10-31; browser runs are listed per row only where they were actually executed (the full browser sweep is Phase H).

Legend — **Status**: `done` = route + server guard + tests; `done (static)` = server-rendered copy, no API; `deferred` = not built, with the owner decision that blocks it.

## Implemented routes

| Route | Purpose | Data source | Permissions | Validation | States | Acceptance evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` (Frappe) | sign in, return to `redirect-to` | Frappe session | guest | Frappe credential check | invalid credentials, blocked account, expired session | existing auth tests; HTTP 200 | done |
| `/borrower` | dashboard: profile completion, application count, latest status, history | `profile.get_profile`, `applications.list_applications` | signed-in `Loan Borrower`, scoped to the account's Customer | server re-checks ownership | loading, empty, error, signed-out redirect | `test_borrower_access`; HTTP 302 → login for guests | done |
| `/borrower/apply` | five-step wizard: about, work, money, loan, review | `profile.get_profile`, `applications.create_application` | as above | amount/tenure/purpose/score/months bounds server-side; phone must carry a country code | validation per step, submitting, created, error | `test_borrower_access`; wizard tests in the browser suite (Phase H) | done |
| `/borrower/application?name=` | summary, status guidance, documents, decision, timeline, withdraw | `applications.get_application`, `get_decision`, documents API | owner only; foreign/unknown → 404 card | ownership on every call; doc type/size/count; submit needs ≥1 document; resubmit only in `INFO_REQUESTED` | draft, submitted, information needed, under review, manual review, approved, rejected, withdrawn, not found, provider error | `test_borrower_access`, `test_documents`, `test_screens` (guidance payload); page shell HTTP 404 for foreign id | done |
| `/borrower/assistant` | text assistant with per-application conversation, history list, what-if/plan panels, voice panel | `api/agent` (`mint_assertion`, `list_conversations`, `conversation_messages`, `record_turn`), `api/livekit` | assertion identity only; thread bound to account + application | thread ownership, conflict on application change, consent before voice, 10 starts/h | chooser, restoring, streaming, error (401/409/503), voice idle/connecting/connected/reconnecting/ended/failed | `test_assistant_page`, `test_agent_bridge`, island suite (33) | done |
| `/borrower/profile` | edit contact, employment, money, language/reading preference, consent | `profile.get_profile`, `update_profile` | own profile only | field allow-list; phone, ranges; language offered as `en/hi/te` and reading as `low/medium/high` from `config/borrower_preferences.json`, unknown values rejected, legacy `plain/standard/mr` rows normalised on read; consent version recorded on acceptance | loading, saved, validation error, consent on/off | `test_profile` (7, incl. consent version), `test_preferences` (7) | done |
| `/borrower/feedback` | rating, category, optional application, history | `feedback.submit_feedback`, `list_feedback` | own feedback; application ownership | rating 1–5, category map, length limit | empty history, submitted, error | `test_feedback` | done |
| `/borrower/invite?token=` | invitation validation and account creation | `invitations.validate` / `redeem` | guest with a single-use token | token hash/expiry/revocation, password, username, phone, both consents | checking, invalid/expired/used, form, created → `/borrower` | `test_invitations` (15, incl. recorded notice versions); token stripped from the URL before the first call | done |
| `/borrower/help` | how applications, statuses, documents, assistant and voice work; account and contact guidance | static page; notice versions from `portal/legal.py` | public (guest and any signed-in account) | none | one page | `test_screens`; HTTP 200 as guest | done (static) |
| `/borrower/products` | the enabled term-loan products with maximum amount and rate | `Loan Product` (`disabled = 0`, `is_term_loan = 1`) rendered server-side | public | none; read-only catalog | listed, none available (empty state) | `test_screens`; HTTP 200 as guest, product row rendered | done |
| `/borrower/terms` | terms of use the invitation/profile consent refers to | `portal/legal.py` + static copy | public | none | versioned page | `test_screens`; HTTP 200 as guest; version `portal-terms/1` rendered | done (static) |
| `/borrower/privacy` | privacy notice: what is held, who sees it, assistant/voice processing, choices | `portal/legal.py` + static copy | public | none | versioned page | `test_screens`; HTTP 200 as guest; `portal-privacy/1` rendered | done (static) |
| unknown `/borrower/*` | friendly 404 | `templates/portal/_not_found.html` / Frappe 404 | n/a | n/a | not found | `test_borrower_access` | done |
| blocked account | an account without borrower access sees why instead of a login loop | `portal/pages.py:borrower_page` | signed-in, non-borrower | n/a | suspended/disabled, unlinked profile | `test_borrower_access` | done |
| session expiry | a 401 from any portal call redirects to `/login?redirect-to=<current page>` | `public/js/portal.js` | n/a | n/a | expired mid-page | covered by browser security suite (Phase H) | done (redirect) |

## Decision-support content inside existing screens

The next-phase brief lists several decision-support screens. They are delivered as sections of the screens above rather than duplicate pages:

| Requested surface | Where it lives | Backing | Note |
| --- | --- | --- | --- |
| processing / pending / manual review | application page → “What this status means”, driven by `get_application.guidance` | `portal/guidance.py`, complete over `portal/lifecycle.py` states | `test_screens` asserts every canonical state has guidance |
| correction / resubmission after `INFO_REQUESTED` | application page → “Information needed” panel | `applications.resubmit_application` | only the four scored inputs change; documents stay frozen |
| rejection explanation | application page → decision card, customer-visible reasons only | `applications.get_decision` → `_borrower_detail` | thresholds, hashes and traces stay in evidence |
| reapplication guidance | rejection card “start a new application” + status guidance | application page | no promise of an outcome |
| eligibility insight / what-if | assistant → plan panel and what-if block, labelled as a simulation | agent tools over the decision engine | a simulation, never a decision |
| improvement recommendations | assistant → answer details and plan panel | agent output | advisory only |
| conversation history | assistant aside (“Recent conversations”) + restore | `api/agent` (B5) | one thread per account + application |
| terms / privacy consent | invitation form and profile consent, linked to the published notices | `portal/legal.py` | acceptance records the notice version |

## Deferred with an owner decision

These are real gaps, not hidden: each needs a product/legal/operations decision before a screen can be built honestly.

| Surface | Why it is deferred | Owner decision needed | Finding |
| --- | --- | --- | --- |
| Password reset and email verification | no SMTP or identity provider is configured; invitations are handed over by an operator | choose SMTP/IdP and the verification policy | F-M03 / F-P06 |
| Invitation e-mail delivery | same transport gap; the operator hand-over is the current process | send from the portal or keep a documented operator hand-over | F-P11 |
| Notification centre and notification preferences | there is no notification channel or delivery worker to configure; a preferences page without deliveries would be misleading | choose in-app, e-mail or both, and what events notify | F-M04 |
| Public landing / product marketing page | the portal has no public brand/copy owner; the factual product catalogue is `/borrower/products` | approve public copy, legal entity details and a route | F-M04 |
| Dedicated eligibility / what-if screen | the assistant already runs what-ifs against the same engine; a second surface would duplicate it and needs policy copy about estimates | approve standalone estimator copy, or keep it in the assistant | F-M04 |
| Support ticketing / live chat / published contact details | no support queue, SLA or approved contact channel exists; telling borrowers to contact their advisor is factual | choose a channel and publish it | F-M04 |
| Registration success / verification state | account creation signs the borrower in and redirects to `/borrower`; a verification state needs e-mail | same decision as password reset | F-M03 |

## Duplicate-page rules applied

- The product catalogue is one page (`/borrower/products`); the wizard does not repeat it, it links to it.
- Status explanations live on the application page and in `/borrower/help`; the help page owns the generic vocabulary, the application page owns the current application.
- Conversation history stays in the assistant aside; Phase D added no second history route.
- Terms, privacy and help are public pages, because the invitation flow must be able to show them before an account exists.
