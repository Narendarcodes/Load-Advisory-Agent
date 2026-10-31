# Frappe screen inventory

Translates every legacy React/static screen into its Frappe destination. “Migrated” means implemented **and** verified on the disposable site (HTTP + tests); “pending” means deliberately not built yet.

## Legacy surfaces (verified)

| Legacy route | Component | Purpose | Access |
| --- | --- | --- | --- |
| `/` | `HomeRedirect` (`router.tsx:15-18`) | redirect to applications or sign-in | public |
| `/signin` | `screens/SignInScreen.tsx` | email/password login + demo applicant picker | public |
| `/register?invite=` | `screens/RegisterScreen.tsx` | invitation-based account creation | public |
| `/applications` | `screens/ApplicationsScreen.tsx` | list applicant’s applications | guarded |
| `/applications/:ref` | `screens/DecisionScreen.tsx` | decision, rules, next steps, evidence | guarded |
| `/apply` | `screens/ApplyScreen.tsx` | five-step application form | guarded |
| `/chat` | `screens/ChatScreen.tsx` | CopilotKit chat + decision/plan context | guarded |
| `*` | `NotFoundScreen` | 404 card | public |
| `/` (static) | `apps/web/chat/index.html` | legacy chat page | public |
| `/voice` (static) | `apps/web/chat/voice.html` | LiveKit voice demo | public |

Client-side guard only (`components/RequireSession.tsx:22-28`); each API re-verified the bearer.

## Migration table

| Legacy | Frappe destination | Status | Notes |
| --- | --- | --- | --- |
| `/` HomeRedirect | `get_website_user_home_page` → `/borrower` for `Loan Borrower`, `/login` otherwise (`portal/routing.py:4`) | migrated | verified: borrower login returns `home_page: /borrower` |
| `/signin` | Frappe `/login?redirect-to=` with the portal's guest redirect | migrated | demo applicant picker intentionally dropped |
| `/register?invite=<id>` | `/borrower/invite?token=<token>` + `Account Invitation` doctype | migrated | token is `<id>.<secret>`; validate/redeem verified over HTTP |
| `/applications` | `/borrower` dashboard | migrated | stats (completion, count, latest badge), list with lifecycle badges, empty state |
| `/applications/:ref` | `/borrower/application?name=<ref>` | migrated (core) | summary, documents, timeline, withdraw, decision projection; raw evidence JSON deliberately not exposed |
| — (new) | `/borrower/apply` wizard | added | five steps: about (read-only profile), work, money, loan, review |
| `/apply` | same wizard | migrated | legacy self-declared credit score removed — the policy engine scores; income, obligations, employment months, amount, tenure, purpose remain |
| `/chat` | `/borrower/assistant` | migrated (core) | CopilotKit island on a server-rendered page; application chooser, thread per application, plan panel and error states. Streaming from a browser awaits the `/api/copilotkit` proxy (Phase 9) |
| — (new) | `/borrower/profile` | added | editable profile, completion indicator, consent flags |
| — (new) | `/borrower/feedback` | added | rating, category, optional application, history |
| `NotFoundScreen` | friendly 404 card (`templates/portal/_not_found.html`) + Frappe 404 elsewhere | migrated | foreign/unknown application id renders “Application not found” with status 404 |
| `/voice` | assistant voice mode (island panel) | migrated | consent + LiveKit room states, mute, hang-up, transcript controls, expiry; live call **BLOCKED** (no LiveKit server or worker credentials) — see [livekit-integration.md](../architecture/livekit-integration.md) |
| — (new) | `/borrower/help` | added | public help: workflow, status vocabulary, documents, assistant, voice, account and contact guidance |
| — (new) | `/borrower/products` | added | public, server-rendered catalogue of enabled term-loan products |
| — (new) | `/borrower/terms` | added | versioned terms of use referenced by the invitation and profile consents |
| — (new) | `/borrower/privacy` | added | versioned privacy notice referenced by the same consents |

The authoritative per-screen record (route, purpose, data, permissions, validation, states, acceptance and deferrals) is [screen-completion-matrix.md](screen-completion-matrix.md).

## Layout and design mapping

| Legacy | Frappe |
| --- | --- |
| `components/AppShell.tsx:16-82` (nav, sign-out, footer) | `templates/portal/base.html` — sticky header, nav driven by `signed_in and not blocked`, sign-out button, disclaimer footer |
| shadcn primitives in `components/ui/*.tsx` + `lib/utils.ts` | `public/css/portal.css` classes (`card`, `btn`, `badge`, `field`, `alert`, `table-wrap`, `timeline`, `steps`, `empty`) |
| Tailwind v4 CSS-first theme (`index.css:9-42`) | CSS custom properties in `:root` (`--ink`, `--accent`, `--pass`, …) |
| `ChatPanel` legacy class names (`components/ChatPanel.tsx:109-166`) | `.assistant` shell in `portal.css`, filled by the island's own scoped stylesheet (`public/js/assistant/assistant.css`); the portal classes (`btn`, `badge`, `alert`) are reused inside the island |
| Client-side route guard | server-side: guest redirect + `borrower_context()` on every page and method |

## Behavioural differences to keep in mind

- The portal has **no demo mode**: no demo account picker, no `/api/session` demo route, no seeded customer switcher.
- Documents, profile and feedback exist only in Frappe; they had no equivalent in the React app.
- The decision card shows the borrower-facing projection only: outcome, customer-visible failing reasons, missing fields, provider-error flag, evaluated date and policy version. Thresholds, hashes and traces stay in evidence.
- Frappe Lending's `status` field is not surfaced as the borrower's status; `custom_lifecycle_state` is.

## Pending screens

None of the legacy surfaces is unmigrated. The screens the next-phase brief asks for that are not built are listed with the owner decision that blocks them in [screen-completion-matrix.md](screen-completion-matrix.md#deferred-with-an-owner-decision): password reset/verification, invitation e-mail delivery, notification centre and preferences, a public landing page, a standalone eligibility/what-if screen, support channels and a post-registration verification state.
