# Phase 5 — Loan Advisory Agent (one LangGraph graph) + Phase 6 voice

**The agent explains; it never decides.** Decisions come only from the conventional workflow
(`lifecycle.process_application` → ZEN 2.1.2 → Decision Evidence record, PR #3). The graph reads that stored record.
What-if answers are in-memory ZEN simulations (`lifecycle.simulate`) that are never persisted. All four thresholds
(income ≥ ₹25,000, FOIR ≤ 0.45, score ≥ 700, tenure ≥ 12 months) belong to the **synthetic prototype policy
`synthetic-v1`**. Every explanation, card and plan says so; if a draft forgets, `finalize` appends the label.
Scope is personal loans only and lender-neutral. Bajaj Finance is a *public reference lender, not a partner*. NBFCs owe
no written rejection reasons, and a guard blocks any claim that they do.

Stack: LangGraph 1.2 (`StateGraph` + `MemorySaver`), pydantic contracts, plain `requests` to gpt-oss-120b (vLLM,
OpenAI-compatible), and the existing ZEN / Frappe / RAG code, unchanged. The HTTP server uses the Python standard
library: no FastAPI, LiteLLM, Hermes or multi-agent framework. Tracing goes over OpenTelemetry to a self-hosted
Arize Phoenix.

## Graph (`apps/api/src/loan_advisory/agent/graph.py`)

```
START → receive → authenticate ──(not_authorized | unavailable)──────────────────────────────→ simple
                       │ok
                       ▼
                    classify ──boundary (guarantee/override/edit/other-applicant/injection/auto-submit/dispute)──→ boundary
                       │──explain | improve | what_if──→ load_evidence ──(no decision / INFO_REQUESTED / MANUAL_REVIEW
                       │                                       │          / APPROVED / bad what-if)──────────→ simple
                       │                                       ├─explain──────────────→ compose
                       │                                       ├─improve──→ plan ─────→ compose
                       │                                       └─what_if──→ what_if ──→ compose
                       │──policy──→ retrieve_policy ─────────────────────────────────→ compose
                       └──greeting | other──────────────────────────────────────────────→ simple
compose → validate ──(guard flags and attempts < 2)──→ compose      (one rewrite with the flags fed back)
                    └─────────────────────────────────→ finalize   (still flagged → deterministic template)
boundary → finalize;  simple → finalize;  finalize → END
```

| Node | What it does | LLM? |
|---|---|---|
| `receive` | Resets per-turn state and starts the timer | – |
| `authenticate` | `tools.authorize(application_ref, session)`: the session's `applicant_ref` must equal the Loan Application's `applicant`. An unknown ref returns the same answer as a not-owned ref | – |
| `classify` | Deterministic request guards run first (regex, EN plus some HI/TE). They catch guarantee, override, record edit, other applicant, injection, auto-submit and dispute. After that, the gpt-oss intent classifier picks explain / improve / what_if / policy / greeting / other and extracts what-if changes (`set`/`delta`). A regex fallback covers an LLM outage | yes (JSON) |
| `load_evidence` | `get_decision_evidence`: the latest stored `Loan Decision Evidence`. It maps lifecycle state to a status: no record → no_decision, INFO_REQUESTED → missing fields, MANUAL_REVIEW → handoff, APPROVED → no reasons | – |
| `plan` | `improvement_plan`: the smallest single-field target per FAILED rule. Each target and all targets combined are re-checked through ZEN `simulate` | – |
| `what_if` | Validates the field allow-list and ranges, then `run_what_if` → ZEN `simulate`. It re-reads the record to prove it is unchanged | – |
| `retrieve_policy` | `search_approved_policy`, a hybrid+rerank top-5 under the lender-profile filter. A temporal question switches to historical mode. A short follow-up inherits the previous question. A retriever failure means abstain | – |
| `compose` | The LLM phrases **only** the deterministic facts (`facts.py`). Style comes from literacy (low/medium/high), language from locale (en/hi/te), and voice gets ≤70 spoken words. For policy, the model returns `{abstain, answer, citations[P1..P5]}` | yes |
| `validate` | Checks for guarantee or decision language (negation-aware), NBFC written-reason claims, ungrounded numbers (every number must come from the record, thresholds, ZEN targets, the message or the cited passages), and citation labels that must be valid, present and absent on abstention | – |
| `boundary` | Fixed templates (en/hi/te). A dispute files a human handoff (`create_human_handoff`). A guarantee request still gets the labelled ZEN improvement plan | – |
| `simple` | Templates for greeting/other/auth/unavailable/no-decision/missing-info/manual-review/approved/bad what-if | – |
| `finalize` | Builds `AgentResponse` (decision card, plan, what-if, citations, evidence_refs, guard flags, timings). Falls back to a template if a draft failed twice, appends the synthetic label if it is missing, and writes the audit row (`persist_turn`): ids, intent, flags, timings, with **no message text and no financial values** | – |

Memory: a LangGraph `MemorySaver` thread keyed `applicant_ref::conversation_id`, so one applicant cannot read another
applicant's thread. Conversation memory is never treated as loan data. The authoritative state stays in Frappe.

## Tools (`tools.py`, the only things the graph can touch)

| Tool | Backend | Writes? |
|---|---|---|
| `authorize(ref, session)` | `store.get(ref)` (Frappe `GET /api/resource/Loan Application/<name>`), owner check | no |
| `get_application_summary(ref, session)` | same doc, non-scored fields only | no |
| `get_decision_evidence(ref, session)` | Frappe `Loan Decision Evidence/<custom_latest_evidence>` → `record_json` (schema `decision-evidence/1`) | no |
| `run_what_if(ref, session, changes)` | `lifecycle.simulate` → `decide(overrides=…)` → ZEN `evaluate` with the trace on. Fields are limited to the 4 scored ones with schema ranges | **no** (it asserts the record is unchanged) |
| `improvement_plan(ref, session, record)` | `facts.counterfactual_targets` + `run_what_if` for each target and for all targets combined | no |
| `search_approved_policy(query, historical)` | `HybridRetriever.search` with `RetrievalFilter` from the lender profile | no |
| `create_human_handoff(category, refs, summary)` | Appends to a local JSONL queue (prototype; there is no real escalation channel yet) | queue only |

There is no generic Frappe, SQL or web tool, and no decision or record write path. The ZEN decision object is
shared, so calls to it are serialised by a lock.

## How it calls Frappe and ZEN
1. **Decide (conventional workflow, not the agent).** `scripts/agent/prepare_demo.py` runs `process_application`
   for each seeded record: Frappe doc → `from_frappe_doc` (pydantic) → ZEN → `build_record` → `FrappeEvidenceSink`.
   The sink creates `Loan Decision Evidence`, and the Loan Application gets `custom_lifecycle_state`, `status`,
   `custom_latest_evidence`.
2. **Explain (agent).** `FrappeClient.get` reads the Loan Application (token auth, read-only). `FrappeEvidenceSink.get_record`
   reads the evidence doc. `facts.reason_facts` keeps the FAIL rows only. The LLM phrases them.
3. **What-if (agent).** `simulate` merges overrides into the doc *in memory* → `decide` → ZEN. The result is an
   `is_simulation` record that is returned and never persisted. The live tests confirm Frappe's `modified` is unchanged.

## How it queries the policy RAG
`runtime.load_policy_tools()` loads the `chunks.jsonl` corpus (1,544 chunks; text lives only on the droplet). It also
loads EmbeddingGemma 2 over the existing Qdrant collection `policy_chunks_v2`, BM25, weighted RRF (w_bm25 = 0.5,
k = 10, from `config/rag.yaml`), and the `bge-reranker-v2-m3` rerank of the top 50. `profile_filter(profile, mode)`
applies the approval status, entity type (bank/nbfc), own-lender-only and source-type allow-list rules **before** ranking.
The top 5 passages become `P1..P5`, labelled `[historical]` where that applies. The model must cite labels; the server
maps them to `Citation` objects (document id, title, section, page, URL, approval status, applies-to entity,
relationship label). The GPU footprint was about 4.1–4.5 GB uncapped; with `AGENT_GPU_FRACTION=0.016` (allocator cap
~3 GB) and the CUDA cache released after each query it measures 3.74 GB in `rocm-smi --showpids` (Oct 14, 2026).

## Observability
`observability.py` uses the OpenTelemetry SDK plus an OTLP/HTTP exporter to self-hosted **Arize Phoenix**
(`hx-loan-phoenix`, `127.0.0.1:6006`, SQLite in `/root/hx/loan/phoenix`, ~450 MB RAM, no GPU). It is enabled with
`AGENT_TRACING=1` and is a no-op otherwise. Spans use OpenInference names, so Phoenix shows LLM, TOOL and CHAIN views:
* **Turn and graph:** `advisor.turn` (root), `node.<name>` for every graph node, `tool.<name>`.
* **Backend calls:** `frappe.get_loan_application`, `frappe.get_loan_decision_evidence`, `zen.simulate`.
* **LLM calls:** `llm.<tag>`, with prompt/completion/total tokens, TTFT and latency.
* **Voice:** the worker emits `voice.turn` (back-dated to the end of user speech) with a `voice.stt` child, the stage
  timings and a `tts_first_audio` event. It propagates W3C `traceparent` to `/api/chat`, so the voice turn and the
  graph run share one trace. LiveKit Agents' own spans (`agent_turn`, `tts_node`, `tts_request`) land in the same trace.

Message and answer text are **not** exported unless `AGENT_TRACE_CONTENT=1`, to minimise PII. Phoenix was preferred
over Langfuse because it is a single container with no Postgres, ClickHouse or Redis, and it accepts plain OTLP.

## Voice (Phase 6, `apps/voice/`, `infra/voice/up.sh`)
Browser (`/voice`, livekit-client) → **self-hosted LiveKit 1.13.10** (127.0.0.1, dev keys generated locally) →
LiveKit Agents 1.8 worker:
* **VAD:** Silero.
* **STT:** the Hyperion asr-http sidecar (Hyperion PR #20): IndicConformer-600M ONNX on CPU for te/hi, Whisper
  large-v3-turbo for en.
* **Reply:** `llm_node`, which POSTs `/api/chat` with the session token from the LiveKit participant metadata. It is
  the same graph and the same authorization as text.
* **TTS:** kenpath/svara-tts-v1 (Apache-2.0) on vLLM (fp8, `--gpu-memory-utilization 0.025` plus an explicit
  768 MB KV cache, because utilization-based profiling is unreliable on the shared GPU) with a streaming SNAC sidecar.
  Measured Oct 14, 2026: STT 2.47 GB + TTS 6.87 GB + SNAC sidecar 1.08 GB = 10.4 GB, inside the 12 GB voice budget.

The answer card (decision, citations) goes over the data channel.
