# Loan Advisory Agent

An evidence-grounded advisory agent for **rejected personal-loan applicants**, in **English, Hindi and Telugu**, by text
or voice. It explains the recorded reasons for a decision, shows how they relate to published policy, runs what-if
simulations and suggests legitimate next steps. **It explains; it never decides.** Decisions come only from a
deterministic ZEN rules engine run by the conventional Frappe Lending workflow.

Built for the VaaniLabs.AI capstone (CBIT AI/ML). Repository name is spelled `Load-Advisory-Agent`.

> **Read this first**
> - **All applicant data is synthetic.** The four underwriting thresholds (income ≥ ₹25,000, FOIR ≤ 0.45, credit score
>   ≥ 700, employment tenure ≥ 12 months) are the team's synthetic prototype policy `synthetic-v1`. They are not any
>   lender's real policy, and every answer, decision card and plan says so.
> - **Bajaj Finance Ltd is a *public reference lender, not a partner*.** Its public documents are used to build and
>   evaluate the policy RAG. The design is lender-neutral: the lender is a config profile
>   (`config/lender_profiles/`), and RBI rules are labelled per entity type (bank vs NBFC).
> - Scope is **personal loans only**.

Design and rationale: [APPROACH.md](APPROACH.md). Diagrams: [docs/architecture/](docs/architecture/README.md).

![System context](docs/architecture/diagrams/01-system-context.png)

## Features

| Area | What it does | Where |
|---|---|---|
| Decision core | Canonical pydantic schema → ZEN Engine 2.1.2 → rule-level PASS/FAIL evidence; sha256-pinned policy registry that fails closed | `decision_engine/`, `apps/api/src/loan_advisory/application/` |
| Conventional workflow | Frappe Lending 16 lifecycle (SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / INFO_REQUESTED / MANUAL_REVIEW, plus dispute/resubmit/withdraw); stores a `Loan Decision Evidence` record | `lifecycle.py`, `infra/frappe/` |
| Advisory agent | One LangGraph `StateGraph`: explain, improve (ZEN-verified plan), what-if (in-memory ZEN, never persisted), policy Q&A with citations, boundary refusals, human handoff | `apps/api/src/loan_advisory/agent/` |
| Guards | Deterministic request guards before the LLM (guarantee, override, record edit, other applicant, injection, auto-submit, dispute, misrepresentation, not-available); answer guards after it (guarantee/decision language, NBFC written-reason claims, ungrounded numbers, citation labels); one rewrite, then a template | `guards.py`, `graph.py` |
| Policy RAG | 38-source register with approval status and supersedes links; BM25 + EmbeddingGemma 2 in Qdrant, weighted RRF, `bge-reranker-v2-m3`; lender-profile filter applied before ranking | `data/sources/`, `rag/`, `config/rag.yaml` |
| Personalisation | Literacy level (low / medium / high) and locale (en / hi / te) shape the wording | `prompts.py` |
| Voice | Self-hosted LiveKit 1.13 + LiveKit Agents 1.8, Silero VAD, IndicConformer-600M (hi/te) and Whisper large-v3-turbo (en) STT, svara-tts-v1 TTS; sentence-streamed answers behind the same guards | `apps/voice/`, `infra/voice/` |
| Observability | OpenTelemetry → self-hosted Arize Phoenix; message text is not exported unless `AGENT_TRACE_CONTENT=1` | `observability.py` |

There is no FastAPI, LiteLLM, Hermes or multi-agent framework: the server is the Python standard library
(`http.server`) and the LLM is called with plain `requests`.

## Quick start

### 1. Decision core only (no Frappe, no GPU)

```bash
pip install -r requirements.txt
python -m pytest tests/test_zen_smoke.py tests/test_p0_integration.py -q
python scripts/development/run_p0.py             # all fixtures + what-if demo
python scripts/development/inspect_zen_trace.py  # decision + result + trace dump
```

### 2. Live Frappe Lending (P1/P3)

Start the stack (frappe_docker clone, outside this repo):
`docker compose --project-name loanrangers -f loanrangers.yml up -d --pull missing`
(site `p1loan.local` → `http://127.0.0.1:8080`). The droplet variant is `infra/frappe/loanrangers.droplet.yml`
(127.0.0.1-only, secrets from env), seeded by `infra/frappe/bootstrap/{create_site,seed}.sh`.

```bash
export FRAPPE_URL=http://127.0.0.1:8080 FRAPPE_API_KEY=<key> FRAPPE_API_SECRET=<secret>
python -m pytest tests -q
```

### 3. Advisory agent (text)

Needs an OpenAI-compatible endpoint serving gpt-oss-120b (vLLM in this project), plus the policy corpus and Qdrant
index on disk for policy questions. The agent and voice Python packages (LangGraph, sentence-transformers, qdrant-client,
OpenTelemetry, LiveKit Agents) are **not yet pinned in a requirements file**; see [Known gaps](#known-gaps).

```bash
# decide the seeded demo applications first: the agent only explains stored decisions
PYTHONPATH=.:apps/api/src python scripts/agent/prepare_demo.py

# chat server + web UI on http://127.0.0.1:8095
PYTHONPATH=.:apps/api/src python -m loan_advisory.agent.server --port 8095
#   --offline   MockStore + in-memory evidence instead of live Frappe
#   --no-rag    do not load the GPU retriever (policy questions abstain)
```

Endpoints: `GET /`, `GET /healthz`, `GET /api/demo-accounts`, `POST /api/session` (demo sign-in, synthetic accounts
only), `GET /api/decision`, `POST /api/chat`, `POST /api/chat/stream` (NDJSON sentences, then the final response),
`POST /api/livekit-token`, `GET /voice`.

The session token is an HMAC over (applicant_ref, application_ref, expiry). Application and applicant come from the
token, never from the chat body. Real authentication (OTP / lender SSO) is not implemented.

### 4. Voice

`infra/voice/up.sh` brings up LiveKit, the STT container, the TTS vLLM + SNAC sidecar and the worker on the GPU droplet,
all bound to 127.0.0.1. The worker on its own:

```bash
LIVEKIT_URL=ws://127.0.0.1:7880 LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... \
AGENT_HTTP=http://127.0.0.1:8095 STT_HTTP=http://127.0.0.1:8791 TTS_HTTP=http://127.0.0.1:8793 \
  python apps/voice/agent_worker.py start
```

`infra/voice/side_stack.sh` starts an isolated second stack (own server, LiveKit and worker) for side-by-side tests.

## Configuration

Copy `.env.example` to `.env`. Never commit real secrets.

| Variable | Default | Purpose |
|---|---|---|
| `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` | – | Frappe Lending REST access (token auth) |
| `LLM_BASE`, `LLM_MODEL` | `http://127.0.0.1:8001/v1`, `llm` | OpenAI-compatible LLM endpoint (gpt-oss-120b on vLLM) |
| `LLM_TIMEOUT_S`, `LLM_RETRIES` | `120`, `3` | Per-call limits; the per-turn deadline below still applies |
| `LOAN_POLICY_DIR` | `/root/hx/loan/policy` | Policy text, `chunks.jsonl`, Qdrant dir (text stays off git) |
| `AGENT_QDRANT_DIR` | `$LOAN_POLICY_DIR/qdrant_v2` | Local Qdrant collection `policy_chunks_v2` |
| `EMBED_MODEL` | `google/embeddinggemma-2` | Dense embedder |
| `LENDER_PROFILE` | `bajaj_finance` (from `config/rag.yaml`) | Lender profile for retrieval filters |
| `AGENT_RETRIEVER_DEVICE`, `AGENT_GPU_FRACTION` | auto, unset | Retriever device; VRAM cap on the shared GPU (e.g. `0.016` ≈ 3 GB on MI300X) |
| `AGENT_SESSION_SECRET` | random per start | HMAC key for session tokens |
| `AGENT_VOICE_DEADLINE_S`, `AGENT_TEXT_DEADLINE_S` | `25`, `75` | Per-turn deadline; a template answers when time runs out |
| `AGENT_CLASSIFY_BUDGET_S`, `AGENT_MIN_COMPOSE_S` | `6`, `4` | Classifier budget; minimum time left to start or retry a compose |
| `AGENT_FAST_CLASSIFY` | `voice` | `off` / `voice` / `all`: high-precision regex intents skip the LLM classifier |
| **`AGENT_CITATION_MODE`** | **`labels`** | How policy citations are kept (below) |
| `AGENT_TRACING`, `AGENT_TRACE_CONTENT` | off | OpenTelemetry export to Phoenix; include message text only when `=1` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://127.0.0.1:6006` | Phoenix OTLP endpoint |
| `AGENT_AUDIT_LOG`, `AGENT_HANDOFF_LOG` | – | Audit rows (ids, intent, flags, timings; no message text or money values) and the handoff JSONL queue |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | – | Voice; `/api/livekit-token` returns 503 without them |
| `AGENT_HTTP`, `STT_HTTP`, `TTS_HTTP` | `:8095`, `:8791`, `:8793` | Voice worker targets |
| `VOICE_STREAM`, `VOICE_HTTP_TIMEOUT_S`, `VOICE_FILLER_AFTER_S` | `1`, `40`, `4` | Sentence streaming; worker timeout (must exceed the graph deadline); "one moment" filler |

### `AGENT_CITATION_MODE`

| Mode | Behaviour | TEST split (80 answerable, 3 runs) |
|---|---|---|
| `labels` (**default**) | Keep the passage labels the model cited | strict 0.592, support 0.838, judged faithful 0.904, p50 7.3 s |
| `primary_source` (**recommended opt-in**) | Keep only cited passages from the document of the top-ranked cited passage; no extra LLM call | strict 0.800, support 0.800, judged faithful 0.819, p50 7.1 s |
| `llm_verify` (opt-in, PR #8) | Extra LLM call prunes unsupported citations | strict 0.671, support 0.763, judged faithful 0.870, p50 9.1–11.6 s |

Also accepted, explored on dev only: `verify`, `spans`, `spans_verify`, `one_source`, `one_source_soft`.

**Trade-off.** `primary_source` raises strict citation accuracy by about 21 points at no latency cost, but an answer
that combines two documents keeps only one citation, so support drops about 4 points and same-model-judged faithfulness
about 8 points. The default stays `labels`; switching is a product decision. Source: `docs/agent/citation_accuracy.md`.

## Tests

```bash
python -m pytest tests -q                       # live-env suites skip without FRAPPE_* / GPU / LLM
BASE=http://127.0.0.1:8095 node tests/e2e/chat_smoke.mjs     # Playwright chat smoke (needs playwright + Chromium)
BASE=http://127.0.0.1:8095 node tests/e2e/voice_contrast.mjs # /voice caption contrast check (WCAG AA)
```

Last recorded runs (droplet, live Frappe): **205 passed, 0 failed** on PR #10; chat Playwright smoke **16/16** with 0
console errors (PR #9, both citation modes).

Evaluation harnesses:

```bash
PYTHONPATH=.:apps/api/src python scripts/agent/eval_policy_split.py run --split test --mode labels --cache retrieval.json --out runs/x --judge
PYTHONPATH=.:apps/api/src python scripts/agent/eval_policy_split.py run --bench data/evaluation/rag/bajaj_v1/abstain_v2.jsonl --split abstain_v2 --mode labels --cache retrieval_ab.json --out runs/ab
PYTHONPATH=.:apps/api/src python scripts/agent/eval_agent.py --out <dir>        # A1-A5 personas, B policy, C boundary
python scripts/voice/voice_loop_test.py --out <dir>                             # synthetic utterances end to end through LiveKit
```

## Repository layout

```
apps/api/src/loan_advisory/
  agent/            LangGraph graph, guards, citations, streaming, tools, prompts, settings, server, observability
  application/      decision_orchestrator.py, lifecycle.py (process_application, simulate)
  infrastructure/   frappe_adapter.py (mock store + REST client), evidence_store.py
apps/voice/         agent_worker.py (LiveKit Agents), tts_sidecar.py (svara + SNAC streaming)
apps/web/chat/      index.html (chat), voice.html (/voice)
config/             rag.yaml, lender_profiles/{bajaj_finance,generic_bank,generic_nbfc,synthetic_prototype}.yaml
data/sources/       datasets.yaml, policy_register.yaml, policy_manifest_v2.json (metadata only)
data/synthetic/     applicants.json (8 fixtures), personas/ (2,560 synthetic personas)
data/evaluation/    rag/benchmark_v1, rag/bajaj_v1 (benchmark, abstain_v2, results), agent/boundary_v1
decision_engine/    ZEN model, synthetic policy + registry, canonical schema, evidence builder
rag/                corpus.py (fetch, hash, chunk), retrieve.py (BM25, Qdrant, RRF, reranker, profile filters)
scripts/            data/, policy/, agent/, voice/, development/
infra/              frappe/ (compose, bootstrap), voice/ (up.sh, side_stack.sh)
tests/              pytest suites + e2e/ Playwright scripts
docs/               architecture/, agent/, policy/, data/, research/, prototypes/ (P0/P1 history)
```

## Evaluation results (summary)

All on synthetic applicants. The LLM judge is the same gpt-oss-120b that generates answers, so judge figures are
indicative only; `strict` and `support` citation scores are deterministic gold-document / gold-anchor checks.

| What | Result | Source |
|---|---|---|
| Retrieval, bajaj_v1 TEST (80 answerable) | Hybrid + rerank R@5 **0.950**, MRR@10 **0.843** (BM25 0.738 / 0.526; dense 0.838 / 0.666; weighted RRF 0.825 / 0.664). MRR vs dense +0.177, 95% CI [0.101, 0.253] | PR #5 |
| Governance | 0 non-permitted chunks in any top-10 with filters; without filters the injection page reaches the top-10 for 30/149 questions | PR #5 |
| Explain (EN, n=300) | Reason-value coverage 100%, ungrounded numbers 0, guard flags 0 | PR #6 (eval_v3) |
| Improve / what-if (n=150 each) | Plan targets pass in ZEN 100%; what-if extraction 100%, simulation = direct ZEN 100%, original unchanged 100% | PR #6 |
| Boundary (n=40) | 40/40; deterministic guarantee or decision language in final answers: 0 | PR #6, re-run PR #10 |
| Policy answers, TEST, `labels` | answered 0.95, correct 0.875, support 0.8375, strict 0.6125, unanswerable 11/11 | PR #10 |
| abstain_v2 (41, agent-authored) | `labels` 39/41 and 40/41; `primary_source` 40/41 | PR #10 |
| Voice, #8+ code (side stack, LLM idle) | 11/11 turns with audio, 11/11 intents, first audio p50 **3.44 s** (en 2.00 / hi 3.73 / te 3.81 s), max 6.63 s; STT CER 0.008 / 0.000 / 0.014 | PR #10 run |
| Voice, production :8095 (PR #6/#7 code, LLM idle) | 11/11 audio, 10/11 intents, p50 5.20 s | PR #10 run |

Details: `docs/policy/bajaj_reference_lender.md`, `docs/agent/README.md`, `docs/agent/citation_accuracy.md`.

## Known gaps

- **`scripts/agent/eval_agent.py` set B (policy) answers only about 30%** on PR #8+ code (0.29 on PR #10, 0.31 on the
  PR #9 base), while `eval_policy_split.py` answers 95% on the same TEST split. Probes ruled out the retriever and the
  policy path (identical retrieval under 16 threads; live-retriever policy turns answer 36/40 at 40 threads), so this is a
  harness issue. Sets A1-A4 and C are unaffected. Not yet fixed.
- **Production `:8095` still runs PR #6/#7 code.** PRs #8-#10 (sentence streaming, deadlines, citation modes, new
  guards) are measured on a side stack only. One HI complaint utterance is routed to `other` in production; the #8+ fast
  classifier fixes it. Deploying is the owner's call.
- **`abstain_v2` is agent-authored and not human-reviewed**, and the PR #9 guard fix was written after seeing its misses,
  so after-fix numbers are not held-out. Remaining misses: AB2-018 (co-applicant "confirm it will be sanctioned") goes to
  the what-if clarify path; AB2-042 (another bank's prepayment) is sometimes answered from RBI bank rules.
- Strict citation accuracy is about 0.6 in the default mode (see the trade-off above).
- No public dataset validates Indian lender decisions; LendingClub is a US public proxy only. Real validation needs an
  authorised partner dataset.
- Register v2 needs human sign-off (two repeals are inferred), and more unanswerable questions are needed to calibrate
  abstention.
- Demo sign-in only, and the human handoff is a local JSONL queue with no real escalation channel.
- In voice, only English explain/improve turns get the deterministic lead sentence; Hindi and Telugu wait for the first
  guarded LLM sentence. PR #8 also recorded the explain/improve/what-if deadline template as English-only.
- Voice VRAM: 10.4 GB right after restart, about 11.9 GB after use, against a 12 GB budget.
- Agent and voice Python dependencies are not pinned in a requirements file (`requirements.txt` covers the decision core).

## Stacked PRs

Nothing is merged; each PR targets the one before it.

| PR | Branch | Content |
|---|---|---|
| #1 | `data/dataset-audit` | Dataset acquisition and audit |
| #2 | `data/synthetic-personas` | 2,560 synthetic personas labelled by the decision pipeline |
| #3 | `feat/frappe-zen-workflow` | Conventional Frappe + ZEN workflow, versioned policy, stored evidence |
| #4 | `feat/policy-register-rag` | Policy register + hybrid RAG, 96-question eval |
| #5 | `feat/bajaj-policy-rag` | Bajaj Finance reference lender, register v2, weighted RRF + rerank, bajaj_v1 |
| #6 | `feat/langgraph-agent` | LangGraph advisory agent |
| #7 | `feat/livekit-voice` | Self-hosted LiveKit voice |
| #8 | `feat/agent-upgrades` | Sentence streaming, per-turn deadline, opt-in citation verification |
| #9 | `feat/citation-accuracy` | `primary_source` mode, abstain_v2, record-tampering guards |
| #10 | `feat/abstain-unavailable` | "Not available to me" abstention + misrepresentation guard |

## Earlier milestones (P0 / P1)

P0: mock Frappe → canonical schema → ZEN → decision + evidence + trace. P1: live Frappe Lending 16.6.1 through the same
adapter and schema (live `ACC-LOAP-2026-00001` ≡ mock `APP-TEST-005`: REJECTED, identical rules). Details in
`docs/prototypes/p0-*.md` and `p1-*.md` (footprint: +7.28 GB images, +301 MB volumes, ≈845 MB idle RAM).

- Live DocTypes use Frappe autonames (`ACC-LOAP-…`); `APP-TEST-00x` IDs exist only in the mock store.
- ZEN 2.x nodes see only the previous node's output, so the model is one self-contained expression node
  (`docs/prototypes/p0-zen.md`).
