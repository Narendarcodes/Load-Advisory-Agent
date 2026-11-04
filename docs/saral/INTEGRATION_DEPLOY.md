# Saral integration build: how it is deployed

This is the test bed used for the live end-to-end run on 2026-11-03/04. It runs the `saral/integration` branch
(draft PR #53, never merged; it exists only to test the PRs together). It is **not** a production deployment. All
data is synthetic.

**No secrets are in this file or in the repository.** Passwords, API keys, the assertion secret and Langfuse keys
live in mode-0600 files outside the repository on each host. Never commit `.env`, `storage.sqlite`, trace exports
or seeded login files.

## 1. Machines

| Machine | Size | Role |
|---|---|---|
| InstaBox 1 | 4 vCPU, 7-8 GB RAM, no GPU | Qdrant, the embedding service, the synthetic bureau, the synthetic KYC + AA service; also the OCR bake-off |
| InstaBox 2 | 4 vCPU, 8 GB RAM, no GPU | Frappe stack (Docker) and the optional Langfuse server |
| Orchestration machine | 2 CPU, ~7 GB RAM (aarch64 dev sandbox) | Front door, assistant runtime, agent, decision runner; test harnesses and evals |
| Kaggle | 2x T4 | Eval retrieval only (embedding, indexing, retrieval, reranking). No LLM is served there |
| LLM endpoints | — | OmniRoute OpenAI-compatible gateway on the owner's laptop (answer model Gemini 3.8 Flash, Sonnet 4.6 fallback; eval judge), reached through a temporary Cloudflare quick tunnel during the final runs; Groq for the intent classifier (`gpt-oss-120b` → `gpt-oss-20b`) |

InstaBox sessions pause after 30 minutes idle and stop after 8 hours, so long runs are batched and the stack is
restarted by a script with a watchdog.

## 2. What runs where

Every service binds to **127.0.0.1 on its own host**. Nothing is exposed to the internet. The orchestration machine
reaches the InstaBox services through SSH port forwards (local port → remote port).

| Service | Host | Port on host | Forwarded to (orchestration) | Notes |
|---|---|---:|---:|---|
| Frappe stack: frappe 16.55, erpnext 16.53, lending 16.8, `loan_advisory_portal` 0.1.0 | InstaBox 2 | 8080 | 18080 | Docker compose project; site `saral.local`; MariaDB and Redis inside the stack |
| Langfuse 4.70.0 (web, worker, Postgres, ClickHouse, Redis, MinIO) | InstaBox 2 | 3000 | 3000 | Optional; repo's pinned `infra/langfuse/docker-compose.yml`. Needs Langfuse v3+ because the agent exports OTLP |
| Qdrant | InstaBox 1 | 6333 | 16333 | Collections `saral_nbfc_policy` (329 chunks) and `rbi_regulatory` (317 chunks), 768-d vectors |
| Embedding service (EmbeddingGemma, 768-d) | InstaBox 1 | 8013 | 18013 | The agent embeds queries remotely to save RAM on the orchestration machine |
| Synthetic bureau | InstaBox 1 | 8011 | 18011 | `ops/bureau_fixture_server.py` with the Saral fixture keyed by Frappe application name |
| Synthetic KYC + account-aggregator bank API | InstaBox 1 | 8012 | 18012 | `ops/synthetic_kyc_bank/app.py`; never returns the specimen truth |
| Front door | Orchestration | 18100 | — | One origin for the portal and the assistant runtime (avoids cross-origin cookies) |
| Assistant runtime (CopilotKit, Node) | Orchestration | 4200 | — | Calls the agent's `/api/agui`; allowed web origin is the front door |
| Saral agent (FastAPI + LangGraph) | Orchestration | 8095 | — | RAG over both collections; reranker off on CPU; retriever on CPU |
| Decision runner | Orchestration | — | — | `python -m ops.decision_runner`, `SARAL_POLICY_VERSION=synthetic-v2`; polls Frappe for SUBMITTED |

## 3. Start order

1. **Frappe** on InstaBox 2: start the compose stack, wait for `http://127.0.0.1:8080` to answer. The site was
   created with `infra/frappe/bootstrap/create_site.sh`, then `bash infra/frappe/bootstrap/install_portal_app.sh`
   (run it with `bash`; the file is not executable in git) and migrated.
2. **InstaBox 1 services:** Qdrant, embedding service, bureau (8011), KYC + AA (8012).
3. **Port forwards** from the orchestration machine: 18080→8080 (InstaBox 2); 16333→6333, 18011→8011,
   18012→8012, 18013→8013 (InstaBox 1).
4. **Seed** (once): synthetic applicants with `python -m synthetic_data.saral_kyc_bank --count 200 --seed 20261103`,
   then `ops/saral_seed` on the bench (borrowers, applications, 4 documents each, KYC / bank / bureau summary rows,
   service keys). The seeder writes logins only to a 0600 file.
5. **Decision runner**, then the **agent** (8095), the **assistant runtime** (4200) and the **front door** (18100).
6. **Health checks:** `/healthz` on 8011, 8012 and the agent; `GET /collections` on Qdrant; the Frappe login page
   through the front door.

## 4. Configuration (names only)

| Variable | Used by | Meaning |
|---|---|---|
| `AGENT_ASSERTION_SECRET` | agent, Frappe site | Must equal the site's `agent_assertion_secret`; the agent refuses to start without it |
| `SARAL_LLM_PROVIDER`, `SARAL_LLM_MODEL`, `SARAL_LLM_FALLBACK_MODEL`, `OMNIROUTE_BASE_URL`, `OMNIROUTE_API_KEY` | agent | answer model: `omniroute`, `antigravity/gemini-3.8-flash`, `antigravity/claude-sonnet-4-6@omniroute` |
| `SARAL_INTENT_PROVIDER`, `SARAL_INTENT_MODEL`, `SARAL_INTENT_FALLBACK_MODEL`, `SARAL_INTENT_GROQ_BACKUP`, `GROQ_API_KEY` | agent | intent classifier chain (Groq gpt-oss-120b → 20b → OmniRoute flash-lite → rules) |
| `AGENT_RAG_COLLECTIONS` | agent | `saral_nbfc_policy,rbi_regulatory` |
| `AGENT_QDRANT_URL` | agent | Forwarded Qdrant, e.g. `http://127.0.0.1:16333` |
| `AGENT_RERANK`, `AGENT_RETRIEVER_DEVICE` | agent | `off` and `cpu` on this test bed |
| `AGENT_STATE_DIR`, `AGENT_LOG_DIR` | agent | Private state paths (created 0700/0600) |
| `AGENT_RUNTIME_PORT`, `AGENT_AGUI_URL`, `AGENT_WEB_ORIGINS` | runtime | 4200, the agent's `/api/agui`, the front-door origin |
| `SARAL_POLICY_VERSION`, `SARAL_BUREAU_URL`, `SARAL_KYC_AA_URL` | decision runner | `synthetic-v2`, forwarded 18011 and 18012 |
| `SARAL_SYNTH_DIR` | KYC + AA service | Directory of the generated synthetic applicants |
| `LANGFUSE_*` (host, public/secret key), `LANGFUSE_CAPTURE_CONTENT` | agent | Optional tracing; message text is exported only when capture is switched on (it was, for synthetic QA traces only) |
| `SARAL_LAYA_ROUTER_URL` | agent | Optional fast intent router; unset means off |

Every variable, with defaults and failure modes: [../development/environment-variables.md](../development/environment-variables.md).

## 5. Security notes

- Borrowers authenticate to Frappe only. The agent accepts only a 60-second, single-use signed assertion minted by
  Frappe, and reads Frappe through read-only views. It cannot write records, start a bureau enquiry or run a decision.
- Officers work in the Frappe desk with a Loan Officer role (approve, decline, request info, audit trail).
- Logs and traces carry ids, not message text, unless content capture is switched on for synthetic QA.
- KYC numbers are masked in the portal (Aadhaar shows the last four digits only).

## 6. Known deployment limits

- Test bench, not production: production Frappe settings, permissions and load are untested.
- The LLM gateway used during the test ran on the owner's laptop and was a single point of failure (502 from about
  02:18 IST on 2026-11-04, which blocked the agent-in-frontend cases at the time).
- InstaBox 8-hour session limit; the orchestration machine is memory-tight, so a second in-process embedding model is
  not possible (embeddings are served from InstaBox 1).
- Diagrams: [ARCHITECTURE.md](ARCHITECTURE.md) §2.
