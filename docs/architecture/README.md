# Architecture

Mermaid sources live in [`diagrams/`](diagrams/) next to their rendered SVG and PNG (re-render with
`bash docs/architecture/diagrams/render.sh`). The revised diagrams (01, 02, 05) were checked against `main` at
`9a6e3f6` (2026-10-27), so they cover the bureau entry point (PR #17) and optional Langfuse export (PR #18) as well
as the advisory agent; 03 and 04 keep their PR #10 scope. Other docs here:
[synthetic-bureau.md](synthetic-bureau.md) (bureau flow, `REVIEW` vs `ERROR`, score precedence),
[conventional-workflow.md](conventional-workflow.md) (Phase 3 decision workflow) and
[repository-structure.md](repository-structure.md) (layout notes), plus
[hardening-baseline.md](hardening-baseline.md) (verified HEAD, P0 merge chain, roadmap status). Rationale is in
[../../APPROACH.md](../../APPROACH.md), observability in [../observability/langfuse.md](../observability/langfuse.md).

All applicant data and the four thresholds are synthetic (`synthetic-v1`). Bajaj Finance is a public reference lender,
not a partner. The synthetic bureau is a development-only FastAPI service, not CIBIL/FICO.

## Migration documentation (Frappe platform)

The diagrams below describe the **agent runtime** and are unchanged by the migration. The borrower platform, its
boundaries and its test plan are documented separately:

| Document | Covers |
| --- | --- |
| [frappe-borrower-platform.md](frappe-borrower-platform.md) | systems of record, routes, rendering contract, identity/roles, lifecycle, deployment topology, failure modes |
| [fastapi-agent-boundary.md](fastapi-agent-boundary.md) | what stays in FastAPI, the assertion contract, trust rules |
| [assertion-security-and-scaling.md](assertion-security-and-scaling.md) | single-use replay (Redis `SET NX EX`), fail-closed behaviour, multi-worker deployment |
| [loan-lifecycle-mapping.md](loan-lifecycle-mapping.md) | canonical `loan-lifecycle/1` states, native ↔ portal adapters, atomic transitions, audit log, reconciliation |
| [rate-limits.md](rate-limits.md) | per-account portal budgets, per-`sub` agent budgets, shared store and fail-closed behaviour |
| [copilotkit-agui-integration.md](copilotkit-agui-integration.md) | runtime → FastAPI identity bridge and AG-UI streaming |
| [livekit-integration.md](livekit-integration.md) | voice token minting in Frappe and the worker gap |
| [../migration/frappe-screen-inventory.md](../migration/frappe-screen-inventory.md) | legacy screen → Frappe destination |
| [../migration/screen-completion-matrix.md](../migration/screen-completion-matrix.md) | every borrower screen: route, purpose, data, permissions, validation, states, acceptance and owner-deferred gaps |
| [../migration/fastapi-endpoint-migration-matrix.md](../migration/fastapi-endpoint-migration-matrix.md) | every legacy endpoint, where it goes |
| [../migration/frappe-lending-doctype-mapping.md](../migration/frappe-lending-doctype-mapping.md) | Lending doctypes, custom fields, ownership |
| [../development/frappe-disposable-environment.md](../development/frappe-disposable-environment.md) | isolated site, commands, secrets, failure modes |
| [../testing/borrower-platform-test-plan.md](../testing/borrower-platform-test-plan.md) | Suite map and Addenda G/H: current-run 169 Frappe, 683 host (15 skipped), 13 runtime and 34 island tests, 36 journeys, 39 security checks |
| [../testing/responsive-accessibility-performance.md](../testing/responsive-accessibility-performance.md) | Phase E measurements: reflow at six widths, axe scans, keyboard/tap-target checks, Shiki/voice lazy-load |
| [../testing/production-readiness.md](../testing/production-readiness.md) | Phase F evidence: production-like proxy checks, two-worker Redis state, bounded load, deployment contract and residual risks; §9 Phase H confirmation |
| [../audit/frappe-implementation-audit.md](../audit/frappe-implementation-audit.md) | Independent audit findings, mapped to phases, with post-audit status per phase |
| [../audit/frappe-hardening-report.md](../audit/frappe-hardening-report.md) | Ten-section consolidation of the hardening campaign, labelled verified / test-only / unverified, with the current-run regression record |

## 1. System context

Who and what the agent talks to. Everything is self-hosted and bound to 127.0.0.1 on the droplet. The advisory server
is FastAPI (`apps/api/src/loan_advisory/api/`); the synthetic bureau is a separate FastAPI service. `/api/bureau/run`
evaluates the signed-in application through that bureau and the data-quality gates, then the unchanged ZEN decision.
The diagrams predate the migration and show the legacy bearer credential; the agent endpoints themselves are unchanged.

> Post-migration, the borrower-facing routes in this section belong to Frappe. The agent endpoints
> (`/api/agui`, `/api/chat`, `/api/chat/stream`, `/api/bureau/run`, `/healthz`) remain; the rest is retired.
> See the migration documents above.

![System context](diagrams/01-system-context.png)

Source: [01-system-context.mmd](diagrams/01-system-context.mmd) · [SVG](diagrams/01-system-context.svg)

## 2. Components

The advisory server and its bureau entry point, the LangGraph graph and its helpers, the least-privilege tools, the
decision core, the bureau data-quality gates, the policy retriever (Qdrant + BM25 + reranker), Frappe, the gpt-oss LLM,
the optional Phoenix/Langfuse exporters and the LiveKit voice stack (STT/TTS).

![Components](diagrams/02-components.png)

Source: [02-components.mmd](diagrams/02-components.mmd) · [SVG](diagrams/02-components.svg)

## 3. Agent request sequence

One text turn, including the authorization, guard (boundary), simple-template, abstain and rewrite/fallback paths.

![Agent request sequence](diagrams/03-agent-request-sequence.png)

Source: [03-agent-request-sequence.mmd](diagrams/03-agent-request-sequence.mmd) · [SVG](diagrams/03-agent-request-sequence.svg)

## 4. Voice turn sequence

One voice turn: VAD, STT, the same graph via `/api/chat/stream`, sentence-by-sentence guarding and TTS, the filler and
the timeout relationship.

![Voice turn sequence](diagrams/04-voice-turn-sequence.png)

Source: [04-voice-turn-sequence.mmd](diagrams/04-voice-turn-sequence.mmd) · [SVG](diagrams/04-voice-turn-sequence.svg)

## 5. Data and policy ingestion

Offline paths: dataset audit and synthetic personas, the conventional decision workflow that writes Decision Evidence,
the synthetic-bureau fixture generator and its 120-case replay, the policy register → fetch → chunks → Qdrant/BM25
index, plus the evaluation sets.

![Data and policy ingestion](diagrams/05-data-policy-ingestion.png)

Source: [05-data-policy-ingestion.mmd](diagrams/05-data-policy-ingestion.mmd) · [SVG](diagrams/05-data-policy-ingestion.svg)
