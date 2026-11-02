# Environment variables

Names, purpose, defaults and the failure you get when one is missing. **No values appear in this
file** — secrets live in the Frappe site config, in a shell environment you export, or in a file
outside the repository. Nothing in this project reads a `.env` automatically; whatever is not exported
into the process environment does not exist for it.

## Frappe site configuration (`bench --site <site> set-config`)

| Key | Purpose | Required | If missing |
| --- | --- | --- | --- |
| `agent_assertion_secret` | HMAC key for the 60-second per-turn assertion the portal mints and the agent verifies. Must equal the agent's `AGENT_ASSERTION_SECRET`, 32+ chars | yes, for the assistant | the runtime mints nothing and every assistant turn returns a service error |
| `allow_tests` | gate that lets `e2e_seed`, `seed_evidence` and the Frappe test modules run | yes for the harnesses | the seed scripts refuse to run |
| `enable_demo_fixtures` | switches on the demo dashboard loan card and the indicative eligibility estimate | no | those two screens say they are not connected to a calculation service |
| `livekit_url`, `livekit_api_key`, `livekit_api_secret` | voice join tokens | no | the voice control stays disabled |
| `db_host`, `db_name`, `db_password`, `db_user`, `redis-*` | written by the `configurator` service, not by you | managed | a stack with no `common_site_config.json` cannot open a site |

## Agent (FastAPI)

| Variable | Consumed by | Default | If missing or wrong |
| --- | --- | --- | --- |
| `AGENT_ASSERTION_SECRET` | `api/assertion.py` | none | **refuses to bind a port**: "AGENT_ASSERTION_SECRET is not set (or shorter than 32 characters)" |
| `FRAPPE_URL` | `infrastructure/frappe_adapter.py` | none | no live evidence; the adapter raises "FRAPPE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET not set". Point it at the front door (`http://127.0.0.1:8081`), **not** `:8080` |
| `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` | same | none | as above. Use the `reader` service account from the seed |
| `EVIDENCE_FRAPPE_URL` | evidence sink | falls back to `FRAPPE_URL` | the sink refuses to start without its own credentials |
| `EVIDENCE_FRAPPE_API_KEY` / `_SECRET` | evidence ingestion | none | the sink never falls back to the read credential; it exits |
| `FRAPPE_LOAN_COMPANY`, `FRAPPE_LOAN_PRODUCT` | application creation | `Loan Rangers Test NBFC` / `SYN-PERSONAL-001` | silently reads nothing, because the seeded fixtures use `LAP Test NBFC` / `LAP-TEST-001`. Set both whenever you seed with `e2e_seed` |
| `LLM_PROVIDER` | `agent/llm.py` | `omniroute` | must be `groq` or `omniroute`; anything else is a config error and the service must not start |
| `LLM_MODEL` | `agent/llm.py` | none | `LLM_MODEL is not set; configure the model ID exposed by the <provider> provider` |
| `GROQ_API_KEY` / `OMNIROUTE_API_KEY` / `LLM_API_KEY` | provider auth | none | the provider call fails; the turn falls back to a no-answer path rather than inventing text |
| `LLM_BASE` | any OpenAI-compatible endpoint | provider default | use this, plus `LLM_PROVIDER=groq` or `omniroute`, for a local server such as Ollama's `/v1` |
| `LLM_REASONING_EFFORT` | reasoning budget | `low` | **set it empty for `openai/gpt-oss-120b` on Groq**: with `low` the whole budget is spent on reasoning, `content` comes back empty, and the agent raises `LLM returned no content` |
| `LLM_TIMEOUT_S`, `LLM_RETRIES` | call budget | `120`, `3` | long or hung providers stall a turn until the turn deadline fires |
| `AGENT_TEXT_DEADLINE_S`, `AGENT_VOICE_DEADLINE_S`, `AGENT_CLASSIFY_BUDGET_S`, `AGENT_MIN_COMPOSE_S` | per-turn budgets | 75 / 25 / 6 / — | a slow retrieval or model can consume the turn; these are what produce a fallback answer instead of a hang |
| `ASSERTION_REPLAY_BACKEND`, `ASSERTION_REPLAY_REDIS_URL` | single-use assertion store | `auto`, localhost Redis | `memory` is allowed outside production only; without shared Redis two workers can accept a replayed assertion |
| `AGENT_CHECKPOINT_BACKEND`, `AGENT_CHECKPOINT_REDIS_URL`, `AGENT_CHECKPOINT_TTL_S` | LangGraph thread store | `auto`, replay URL, `0` | `0` keeps checkpoints forever; retention is an owner decision |
| `AGENT_STORE` | evidence store | live when Frappe is configured | `mock` answers from synthetic data — never present that as a real explanation |
| `BUREAU_BASE_URL` / `--bureau-url` | synthetic bureau origin | `http://127.0.0.1:8001` | must be loopback; a non-loopback origin is refused at startup. On the host, `:8001` may be taken, so `8011` is what the verified runs used |
| `LOAN_POLICY_DIR` | policy corpus and index root | `/root/hx/loan/policy` | a path that came from the original author's machine. Retrieval either fails or, worse, builds an index from the wrong corpus |
| `AGENT_QDRANT_DIR` | vector index location | `<LOAN_POLICY_DIR>/qdrant_v2` | a mismatch against the chunk set fails loudly on provenance validation rather than re-encoding silently |
| `AGENT_RETRIEVER_DEVICE` | `cuda` or `cpu` | auto-detect | a 4 GB card cannot hold the embedder and the reranker **and** another process; do not set `AGENT_GPU_FRACTION` below about 0.6 or the reranker load dies with a CUDA OOM |
| `EMBED_MODEL` | embedding model id | `google/embeddinggemma-2` | changing it invalidates the index identity; the index must be rebuilt |
| `AGENT_CITATION_MODE` | `labels`, `primary_source`, `llm_verify` | `labels` | measured strict accuracy differs by mode: 0.59 / 0.80 / 0.67 |
| `AGENT_TRACE_CONTENT`, `LANGFUSE_CAPTURE_CONTENT` | record prompt and answer text in traces | off | leaving them off is the privacy default; turning them on puts borrower text in the tracing store |

## CopilotKit runtime (`apps/runtime`)

| Variable | Default | Note |
| --- | --- | --- |
| `AGENT_RUNTIME_HOST`, `AGENT_RUNTIME_PORT` | `127.0.0.1`, `4000` | the verified runs used `4200`. An out-of-range port exits 2 |
| `AGENT_RUNTIME_BASE_PATH`, `AGENT_RUNTIME_AGENT_ID` | `/api/copilotkit`, `advisory` | the path the browser calls through the proxy |
| `AGENT_AGUI_URL` | `http://127.0.0.1:8000/api/agui` | point at the live agent (`:8095`). Pointing at the test stub `:8096` is how a deterministic fixture ends up presented as a real model |
| `FRAPPE_BASE_URL` | `http://localhost:8080` | must be the front door for the site you are testing |
| `FRAPPE_MINT_PATH`, `FRAPPE_MINT_TIMEOUT_MS` | the mint method, `5000` | below 100 exits 2 |
| `AGENT_WEB_ORIGINS` | the `FRAPPE_BASE_URL` origin | exact origins only, never `*`; the browser must not be able to call the runtime from elsewhere |
| `COPILOTKIT_TELEMETRY_DISABLED` | set to `true` by the code | the runtime does not phone home by default |

## Tracing

`LANGFUSE_ENABLED=1` with `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`
(default `http://127.0.0.1:3000`) and `LANGFUSE_ENVIRONMENT`. Langfuse Cloud endpoints and any
non-loopback host are refused unless `LANGFUSE_ALLOW_REMOTE=1`. `AGENT_TRACING=1` is a separate,
Phoenix-oriented exporter.

**Verified caveat:** on the current build the tracing exporter is constructed without any span
processor attached, so spans are created and dropped and no traces land in Langfuse. Do not document
or demo this as working trace coverage.

## What is deliberately absent

No bureau credential, KYC provider key, payment gateway key, government identity integration or SMTP
password exists in this project. A developer hunting for them will not find them because the product
does not have those integrations; see [reproducibility/known-limitations.md](../reproducibility/known-limitations.md).
