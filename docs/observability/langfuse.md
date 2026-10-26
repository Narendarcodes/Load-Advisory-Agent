# Langfuse observability for the Loan Advisory Agent

Optional, self-hosted, local-only tracing and evaluation. Langfuse is **never** in the request path: a missing SDK,
an invalid key, a stopped stack or a rejected upload cannot change an advisory answer, a bureau gate or a credit
decision. When it is off (the default) the agent runs exactly as before.

- Stack runbook: [`infra/langfuse/README.md`](../../infra/langfuse/README.md)
- Local UI: `http://127.0.0.1:3000` (no public exposure, no Langfuse Cloud)
- Config module: [`apps/api/src/loan_advisory/agent/langfuse_config.py`](../../apps/api/src/loan_advisory/agent/langfuse_config.py)
- Exporter facade: [`apps/api/src/loan_advisory/agent/observability.py`](../../apps/api/src/loan_advisory/agent/observability.py)

## Architecture and data flow

```
advisory turn (LangGraph) / bureau evaluation
        │  manual OTel spans (one span tree per turn; no duplicate tracing)
        ▼
observability.py ── one TracerProvider ──┬─ Phoenix OTLP exporter (AGENT_TRACING=1, unchanged)
                                         └─ Langfuse BatchSpanProcessor (LANGFUSE_ENABLED=1)
                                                │  OTLP HTTP + Basic auth
                                                ▼
                                  POST {LANGFUSE_BASE_URL}/api/public/otel/v1/traces
                                                │  langfuse-web → Redis queue → langfuse-worker
                                                ▼
                                  ClickHouse (events/observations/scores) + MinIO (blobs)
                                                ▼
                                        Langfuse UI (127.0.0.1:3000)
```

There is one span tree and one provider. Langfuse is added as a second processor next to Phoenix, so a span is
never exported twice to the same backend. A custom span filter accepts only the `loan_advisory.agent` tracer scope
(Langfuse's default allowlist does not include it).

The Python SDK is `langfuse==5.0.4` (OTel-based) and speaks to the pinned Langfuse 4.70.0 server. The server runs
in v4 `events_only` mode: trace/score **read** APIs such as `/api/public/traces` return HTTP 404 by design; the UI
and `/api/public/v2/observations?traceId=...` read the same data.

## What is traced

| Span | Type | Useful attributes / metadata |
|---|---|---|
| `advisor.turn` | CHAIN | `langfuse.trace.name=advisory.turn`, tags (`loan-advisory`, channel, locale, intent), hashed `correlation_id`/`session.id`, intent, action, abstained, guard flags, citation document IDs, evidence refs, total ms, outcome |
| `node.<name>` | CHAIN | node, status, intent, action, abstained, guard flags, attempts, citation labels, retrieval count/mode/failed |
| `llm.<tag>` | GENERATION | model name/parameters, prompt/completion/total tokens, TTFT, latency, error category (`deadline`/`http`/`llm_error`), usage details |
| `tool.<name>` | TOOL | tool name, safe result fields (decision, record id, simulated decision, unchanged flag) |
| `tool.search_approved_policy` | RETRIEVER | mode, lender/entity, k, latency, top rerank score, document IDs, chunk IDs, historical flag, count |
| `zen.simulate` | TOOL | simulated decision, policy version, fields changed |
| `bureau.evaluation` | CHAIN | trace name/tags, hashed application ref, scenario, outcome, decision, lifecycle state, score source, data-quality category, provider error code, retryable, flags, missing fields |

Voice spans (STT/graph/TTS) are unchanged and use the same provider when tracing is enabled.

Not traced: raw applicant records, bureau reports, request headers/cookies, tokens, full policy passages, raw
conversations or model prompts/answers (unless content capture is explicitly enabled).

## Configuration

| Variable | Default | Notes |
|---|---|---|
| `LANGFUSE_ENABLED` | off | Master switch; absent/0 keeps a no-op tracer |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | none | Local project keys; both required when enabled |
| `LANGFUSE_BASE_URL` | `http://127.0.0.1:3000` | `LANGFUSE_HOST` is accepted as a fallback |
| `LANGFUSE_ENVIRONMENT` | `local` | `LANGFUSE_TRACING_ENVIRONMENT` wins if both exist |
| `LANGFUSE_RELEASE` | none | Optional revision label |
| `LANGFUSE_CAPTURE_CONTENT` | off | Explicit opt-in for prompt/answer text |
| `LANGFUSE_SAMPLE_RATE` | `1.0` | 0.0–1.0 |
| `LANGFUSE_TIMEOUT` | `5` | SDK HTTP timeout (seconds) |
| `LANGFUSE_ALLOW_REMOTE` | off | Allows a non-loopback endpoint; Langfuse Cloud hosts are always refused |
| `LANGFUSE_TRACING_ENABLED=false` | — | SDK-style hard off that overrides `LANGFUSE_ENABLED` |

Invalid configuration is reported (`missing_credentials`, `invalid_base_url`, `cloud_endpoint_refused`,
`non_loopback_endpoint`, `invalid_sample_rate`, `invalid_timeout`) and disables the exporter. It never raises and
never prints key material. `python scripts/development/langfuse_check.py` shows the validated summary (booleans,
never the keys).

## Privacy boundary

Three layers, all default-deny:

1. **Constructed allowlists** — only the attributes in the table above are set. Message/answer text is gated by
   content flags (`AGENT_TRACE_CONTENT` for Phoenix, `LANGFUSE_CAPTURE_CONTENT` for Langfuse); both default off.
   Applicant/application references are hashed (16 hex chars); session IDs are hashed; the raw request ID never
   becomes a correlation ID.
2. **Export-stage mask** — the Langfuse processor deletes `input.value`, `output.value`, `llm.system` and
   `llm.error` from every span before upload, even if a future code path sets them for Phoenix. Prompts and
   answers are never uploaded while capture is off.
3. **Exception hygiene** — spans disable OTel's default exception recording. On error only `error.type` (the class
   name) and a status description with the class name are exported: no exception message, no stacktrace, no
   provider body. Credentials are additionally redacted in `ChatLLM` errors before any local logging.

Never uploaded: names, phone numbers, emails, addresses, government/account identifiers, auth tokens, cookies,
headers, secrets, full bureau reports, financial records, complete raw application objects, full policy text,
unredacted conversations or model responses. Bureau provider error **codes** and flags are uploaded; error
messages are not.

Privacy tests use synthetic sensitive values (`tests/test_langfuse_tracing.py`): an applicant message containing a
name, phone, email, PAN and address is run through a full graph turn; no exported span contains any of those
values, and no span carries `input.value`/`output.value`. Other tests assert exception events are empty and the
mask removes free-text attributes.

## Verifying a trace

```bash
# 0. stack up, keys loaded (see infra/langfuse/README.md)
set -a; . infra/langfuse/.env; set +a

# 1. config + health + auth + one synthetic trace
python scripts/development/langfuse_check.py --stack-env --send-trace

# 2. run the app offline (scripted/no GPU required paths) and send a synthetic turn
PYTHONPATH=".;apps/api/src" python -m loan_advisory.agent.server --offline --no-rag --port 8095
# POSIX: PYTHONPATH=.:apps/api/src

# in another shell
curl -s -X POST http://127.0.0.1:8095/api/session -H 'Content-Type: application/json' \
     -d '{"external_ref":"APP-TEST-005"}'
curl -s -X POST http://127.0.0.1:8095/api/chat -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer <token>' \
     -d '{"message":"How do I file a complaint?","literacy":"medium","locale":"en","channel":"text","conversation_id":"obs-demo"}'
```

Open the UI, choose project `loan-advisory-local`, then **Tracing**. The turn appears as `advisor.turn` with nested
`node.*`, `tool.*`, retrieval and `llm.*` observations. Expand a node to see intent, action, guard flags, citation
labels and retrieval counts; expand `tool.search_approved_policy` for document/chunk IDs and latency; expand
`llm.classify`/`llm.compose_*` for model, token usage and TTFT. A bureau run (`POST /api/bureau/run`) appears as
its own `bureau.evaluation` trace with the outcome and data-quality fields, and a hashed application reference.

Automated read-back for scripts (v4 `events_only` mode):

```bash
curl -s -u "$LANGFUSE_PUBLIC_KEY:$LANGFUSE_SECRET_KEY" \
  "http://127.0.0.1:3000/api/public/v2/observations?traceId=<trace-id>&limit=100"
```

`tests/test_langfuse_live.py` does exactly this (opt-in with `LANGFUSE_LIVE=1`) and is skipped in the normal suite.

## Evaluation workflow

### 1. Reproducible offline eval (no Langfuse, no credentials, no Qdrant)

The deterministic citation audit is the shared evaluation contract:

```bash
PYTHONPATH=".;apps/api/src" python scripts/agent/eval_citation_audit.py \
    --cases data/evaluation/agent/citation_audit_v1/cases.jsonl \
    --label candidate --sha "$(git rev-parse HEAD)" --out runs/audit_candidate.json
```

It applies the tree's own citation/guard/graph functions to 68 fixed synthetic cases and 29 citation cases. Verified
baseline for mode `labels` (revision `8347600`): precision 0.707, coverage 1.0, material coverage 1.0, 15/29 cases
fully correct, 6 forbidden citations, 0/11 governance leakage, 4/4 conflict-safe. The fixture and scoring functions
are preserved unchanged; runs are written to the git-ignored `runs/` directory and are not committed.

### 2. Publish the same eval as a dataset + experiment (local Langfuse)

```bash
python scripts/development/langfuse_publish_eval.py --run-name baseline-<sha> --sha <sha>   # dry run
set -a; . infra/langfuse/.env; set +a
python scripts/development/langfuse_publish_eval.py --stack-env --publish \
    --run-name baseline-<sha> --sha <sha>
```

What is uploaded: dataset `loan-advisory-citation-audit-v1` with stable item IDs
(`citation_audit_v1-<case_id>`), the synthetic question, gold citation labels, category/kind/mode metadata and a
SHA-256 of the case file. Policy passage text, composer outputs and all local records stay on the machine. The
experiment is `citation-audit` with per-case evaluators:

- `case_ok` — the same deterministic boolean the offline eval reports;
- `forbidden_citations` — count, should be 0;
- `citation_precision` — TP/(TP+FP) for the claimed citations;
- run-level `case_ok_rate` and `mean_citation_precision`.

Verified publication (revision `8347600`, mode `labels`): 29/29 items produced results, 14 failed cases
(`CA-WV-01`, `CA-WL-01`, `CA-IR-01..04`, `CA-RN-01..04`, `CA-DS-01..04`), scores and experiment-linked events
stored in ClickHouse (`scores`, `events_full.experiment_id`). Re-running with a new `--run-name` is a new
experiment; re-running the same name appends to that experiment.

**No LLM judge is used** for this eval: every score is deterministic and derived from the fixed fixtures. That is
why it is cheap and reproducible; the limitation is that it measures citation selection/validation behaviour, not
end-to-end answer helpfulness. The RAG answer benchmarks under `scripts/policy/` and `data/evaluation/rag/` remain
the place for judged retrieval/answer quality; their judge model, prompts and results are documented alongside
those scripts and are not re-published here. Do not upload real applicant data to either workflow.

### 3. Compare runs and inspect failures

Open **Datasets → `loan-advisory-citation-audit-v1` → Experiments**, select two runs (e.g. `baseline-<sha>` and
`candidate-<sha>`), and compare `case_ok_rate` and `mean_citation_precision`. Open an item with `case_ok=0` to see
its `cited` labels, forbidden citations, required-label pass/fail and the linked trace. Generation latency, token
usage and errors for live synthetic turns are visible in those traces; the offline eval has no model calls and
therefore no token/cost data (reported as such, never estimated).

### 4. Dashboards

No dashboards are created automatically: automated dashboard creation was **not implemented or verified** for
this stack. This is a pending manual step:

1. UI → **Dashboards** → **New dashboard**, name it `loan-advisory-local`.
2. Add widgets filtered to `environment = local`:
   - observations by type (chain/generation/tool/retriever) and by `trace name`;
   - p95 latency of `advisor.turn` and of `llm.*` generations, plus TTFT;
   - error count grouped by `error.type` (application failures) and exporter/queue errors from worker logs
     (telemetry failures) — keep these visually separate;
   - token usage from `llm.token_count.total` (cost only when the model provider reports it; self-hosted vLLM does
     not, so cost widgets stay empty rather than guessed);
   - retrieval counts and citation document IDs for RAG turns;
   - bureau outcomes (`bureau.evaluation` metadata: outcome, data-quality category, provider error code).
3. Save and verify each widget against a known synthetic trace before relying on it.

## Failure behaviour and operations

- **Config/SDK failure** → exporter disabled, one warning with the exception *class*, request continues.
- **Stack down / upload rejected** → batch export retries and drops; `flush()` is bounded and swallows errors.
- **Shutdown** → bounded `force_flush` (5 s default in the app, SDK timeout for network calls); failures are logged
  by class only.
- **Telemetry cannot influence logic** → spans wrap evaluation; no bureau gate, retry, guard or decision reads
  telemetry. Tests (`tests/test_langfuse_resilience.py`) compare what-if and bureau outcomes with tracing off, with
  a failing SDK, and with an unreachable endpoint; they are identical, including the original record remaining
  unchanged.
- **Telemetry vs application failures** → the app logs request errors independently; traces carry `error.type` for
  application errors. Exporter/worker failures appear in container logs and as missing traces, never as agent
  failures.

## Data access, retention and deletion

- Access is limited to the local UI account created from `infra/langfuse/.env`; the port is bound to loopback.
- There is no automatic retention window. Events accumulate in ClickHouse/MinIO until deleted. For a course/demo
  deployment, prune by project/trace in the UI or reset the volumes deliberately (see the stack README).
- Backups are plain tar archives in the documented procedure; treat them as sensitive operational data even though
  the agent uploads only synthetic/allowlisted attributes. Store and delete them accordingly.
- Deletion: traces and datasets can be deleted in the UI; deleting the named volumes removes everything and is
  irreversible. Never do that to "fix" a dashboard.
- The agent never uploads real applicant, bureau or financial records, so retention of those is out of scope by
  construction. `LANGFUSE_CAPTURE_CONTENT` would upload conversations — keep it off outside a controlled demo.

## Resource expectations

Measured idle footprint is ~2.24 GiB for the whole stack (web 787 MiB, worker 657 MiB, ClickHouse 626 MiB,
Postgres 82 MiB, MinIO 77 MiB, Redis 9 MiB) on a 7.6 GiB Docker VM. A 16 GB host with an 8–12 GB Docker allocation
is the target; ClickHouse dominates memory during ingestion/merges. The application-side exporter adds a bounded
in-memory batch queue and a background thread only when `LANGFUSE_ENABLED=1`.

## Verified vs manual

Verified in this repository: stack start/health on a local 7.6 GiB Docker VM, synthetic and real graph traces with
hierarchy/types/environment and no content, metadata persistence in ClickHouse (`metadata_names`/`metadata_values`),
bureau trace with hashed reference, offline eval reproducibility, dataset item upsert, experiment scores/links,
live opt-in tests, privacy/resilience tests, and the full pytest suite.

Manual/pending: dashboard creation and widget verification (steps above); restore drills into fresh volumes;
retention pruning policy; long-running resource tuning under sustained load.
