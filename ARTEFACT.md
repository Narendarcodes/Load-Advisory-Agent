# Artefact (what this repo currently contains)

- `decision_engine/` — synthetic personal-loan policy, ZEN decision model, canonical
  underwriting schema, evidence builder, and the bureau data-quality gates. Deterministic, tested.
- `apps/api/src/loan_advisory/` — Frappe adapter (mock store + live REST client), decision
  orchestrator, bureau evaluation entry point, and the LangGraph advisory agent with its stdlib
  chat server.
- `apps/bureau/src/synthetic_bureau/` — local-only FastAPI synthetic credit bureau
  (`127.0.0.1`, deterministic fixture). Development only; not CIBIL/FICO.
- `apps/voice/`, `apps/web/chat/` — LiveKit voice worker, TTS sidecar, chat and `/voice` pages.
- `data/synthetic/` — 8 applicant fixtures, 2,560 personas, 120 bureau cases. No real people.
- `infra/frappe/`, `infra/voice/`, `infra/langfuse/` — local stack configuration; Frappe,
  LiveKit, the GPU services and Langfuse remain external dependencies.
- `tests/` — pytest suites plus Playwright e2e scripts.
- `docs/` — `architecture/`, `agent/`, `policy/`, `data/`, `observability/`, `research/`,
  `prototypes/` (P0/P1 history).
- `.github/workflows/ci.yml`, `.githooks/pre-commit` — ruff + pytest in CI and an optional
  staged-lint/test hook.

Explicitly NOT present: production deployment, real applicant data, a real bureau or lender
integration, real authentication (OTP / lender SSO), and a real escalation channel.
