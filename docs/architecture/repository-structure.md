# Repository Structure

Organized by system responsibility, not by tool or prototype stage.
Refactored after P1 (see Git history: P0 → Discovery → Status → P1 → refactor);
`prototype_0/` was removed, history preserved in Git + `docs/prototypes/`.

## Layout

- `apps/api/src/loan_advisory/application/` — orchestration (Frappe → ZEN → evidence).
  Depends on infrastructure + decision_engine.
- `apps/api/src/loan_advisory/infrastructure/` — Frappe boundary: REST client,
  mock store, explicit field mapping. Only place that knows Frappe shapes.
- `apps/bureau/src/synthetic_bureau/` — local-only synthetic bureau service
  (FastAPI, `127.0.0.1` only) and deterministic case generator. Never real data.
- `decision_engine/` — ZEN boundary: `policies/`, `decisions/` (JDM),
  `schemas/` (canonical pydantic contract), `evidence/`, `bureau/` (data-quality
  gates + score precedence), `paths.py` (root helper).
  No Frappe imports allowed here.
- `apps/api/src/loan_advisory/agent/` — advisory agent: graph, guards, tools,
  state paths, HTTP server, observability. Consumes Decision Evidence only.
- `apps/api/src/loan_advisory/api/` — the agent-only HTTP surface: `app.py`
  (factory, error handlers), `assertion.py` (verifier + replay cache), `auth.py`,
  `agui.py` + `events.py` (AG-UI stream), `routes_agent.py` (chat, bureau,
  health), `admission.py`.
- `apps/runtime/` — CopilotKit Node gateway: `/api/copilotkit` → mint an
  assertion from the Frappe session → FastAPI `/api/agui`.
- `apps/web/assistant/` — the chat island mounted on the Frappe page: one
  CopilotKit provider, one panel, no router. Builds into
  `apps/loan_advisory_portal/.../public/js/assistant/` with fixed asset names.
- `apps/loan_advisory_portal/` — the Frappe app: borrower Doctypes, pages
  (`www/borrower/`, including `/borrower/assistant`), whitelisted API (`api/`),
  services (invitations, assertion, livekit, documents) and integration tests.
- `rag/` — policy retrieval: corpus assembly, hybrid Qdrant + BM25 retrieval,
  rerank, index provenance metadata.
- `apps/voice/agent_worker.py` — LiveKit voice worker (STT/TTS around the same graph).
- `apps/web/chat/` — legacy static chat/voice pages. The chat page is superseded by
  the island and nothing serves these files any more (the FastAPI static handler is gone);
  the voice page has no replacement yet.
- `data/` — `synthetic/` (dev/test fixtures + provenance note in docs);
  `evaluation/` reserved for evaluation-only data. Never mixed.
- `infra/frappe/` — deployment/config only (compose file, apps.json).
  Upstream Frappe/ERPNext/Lending source must NEVER be copied in.
- `scripts/development/` — runnable demos (P0 matrix, trace inspector).
- `tests/` — root suite (smoke, P0 matrix, connection, P1 live, `test_agent_api.py`
  for the agent surface, `test_voice_assertions.py` for the worker exchange). The
  legacy account/session suites are gone; the only remaining session-contract test
  checks that startup fails closed without `AGENT_ASSERTION_SECRET`.
- `docs/` — `architecture/` (current truth), `research/`, `prototypes/`
  (frozen P0/P1 history — old `prototype_0/` paths inside are historical),
  `operations/` (reserved).

## Boundaries

- Frappe-specific code → `infrastructure/`. ZEN-specific → `decision_engine/`.
- Domain contract = `decision_engine/schemas/` (no separate `domain/` until the
  agent needs its own models — not created yet).
- Future agent work (`prompts/`, `evaluation/`) consumes Decision Evidence
  only — never MariaDB, never Frappe docs, never raw ZEN internals.
- Rules live in ZEN models, never in prompts.

## Unapproved future placement (planning only — do not implement)

Nothing in this section exists or is approved. The authoritative roadmap is unresolved; see
[hardening-baseline.md](hardening-baseline.md).

Prompt pack → `prompts/` (versions included); eval datasets/runners/results → `evaluation/`;
custom Frappe app → `apps/frappe_app/`; observability deployment → `infra/`.
The agent itself is already at `apps/api/src/loan_advisory/agent/`, not a future `agent/` root.
