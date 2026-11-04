# Laya System-1 router and input guard (Saral)

Status: **built, deployed on hark-2, off by default.** Draft PR "Laya System-1 router and input guard". Prepared 2026-11-04 by Hark.
Scope was cut at 09:47 IST (submission deadline): **zero-shot only, no fine-tuning.** The fine-tuning plan is under "Limits and next steps".

## What it does

Before the LLM intent classifier runs, the agent can ask a small non-generative classifier what the applicant wants:

```
POST /route {"text": "...", "lang": "en|hi|te", "context": ""}
  -> {"intent", "probs" (13 intents), "confidence", "flags": {injection, misrepresentation, distress, wants_human},
      "latency_ms", "model", "questions_version"}
```

`loan_advisory.agent.routing.LayaRouter` calls it and applies per-intent thresholds:

* **above the threshold** -> `route` is set (and `graph_intent`, `needs_decision`), so the graph may skip the LLM classifier;
* **below the threshold, intent not enabled, service down, timeout (1.5 s), bad response** -> `route=None`, and the existing LLM classifier decides exactly as today (fail-open to the current path);
* `flags` are **signals only** (spans/logging). Zero-shot they are not precise enough to refuse or hand off on.

What it never does: touch a loan decision, answer the applicant, or override the deterministic guards. `guards.request_flags` still runs first; the deterministic leak checks remain the final guard on every answer.

Intents (plain-language option descriptions live in `routing/laya_questions.py`, version `saral-laya-q1`):
explain_decision, application_status, what_if, improve, policy_question, vague, human_review, distress, misrepresentation, other_applicant, injection, off_topic, greeting. `improve` was added to the brief's list because the graph already routes it.

## Where it runs

| | |
|---|---|
| Model | `convaiinnovations/laya`, subfolder `multilingual` (mmBERT-base, 322M, 100+ languages), published checkpoint, unmodified |
| Runtime | `laya` 0.4.22, torch 2.15 CPU, Python 3.13, venv `~/laya/venv` on **hark-2** (InstaBox, 4 vCPU / 8 GB) |
| Service | `routing/laya_service.py` (stdlib HTTP), bound to **127.0.0.1:8097** on hark-2, 2 torch threads, about 1.7 GB RSS; no request logging (messages can hold personal data) |
| Start / stop | `sh ~/laya/start_laya.sh` (writes `~/laya/service.pid`); stop with `kill "$(cat ~/laya/service.pid)"`. Not a systemd unit: it does not survive a box stop |
| Sandbox access | `ib_forward.py hark-2 18097:8097` -> `SARAL_LAYA_ROUTER_URL=http://127.0.0.1:18097` |
| Memory check | Before start: about 4.1 GB available, Langfuse/ClickHouse/Frappe running. After start: about 2.5 GB available |

Laya pads every question in one call to the longest one, so the 13-option intent and the four yes/no flags are two forward passes (one combined call took about 2.1 s on this CPU). `LAYA_FLAGS=0` skips the flags call and roughly halves latency.

## Benchmark (dev only)

Items: the 158 agent dev turns (Golden B dev, 49 conversations; probe labels from `agent_turns.jsonl`) plus the 178 RAG dev items (Golden A v2 dev: answer 149, clarify 11, refuse 10, abstain 8). That makes 336 items. **None of the 60 held-out ids were used.** Each item has a primary gold intent and an *acceptable* set: for example, a leak probe ("what score do I need?") is acceptable as policy_question or explain_decision, and the leak checks handle it downstream. Labels are agent-assigned from the probes, with a handful of hand overrides for context-dependent follow-ups. They have not been human-reviewed.

State = the latest message only. Adding the assistant's previous reply made the zero-shot model worse (acceptable 42.3% vs 51.8%), so the service ignores `context` for now.

### Zero-shot accuracy, all 336 dev items

Strict 49.1%, acceptable **51.8%**, route-group 53.3%.

| gold intent | n | acceptable | top confusions |
|---|---|---|---|
| policy_question | 204 | 115 (56.4%) | vague 34, explain_decision 21, application_status 9 |
| explain_decision | 36 | 30 (83.3%) | |
| application_status | 21 | 14 (66.7%) | policy_question 2 |
| vague | 14 | 2 (14.3%) | policy_question 9 |
| injection | 12 | 1 (8.3%) | vague 3, improve 3 |
| human_review | 12 | 1 (8.3%) | vague 3, distress 2, what_if 2 |
| improve | 12 | 2 (16.7%) | policy_question 5 |
| greeting | 7 | 6 (85.7%) | |
| misrepresentation | 7 | 1 (14.3%) | vague 3, explain_decision 2 |
| other_applicant | 4 | 1 (25%) | |
| what_if | 3 | 0 | |
| distress | 2 | 1 | |
| off_topic | 2 | 0 | |

| language / script | n | acceptable |
|---|---|---|
| en (agent + RAG) | 281 | 146 (52.0%) |
| hi native | 17 | 10 (58.8%) |
| hi romanised | 12 | 6 (50.0%) |
| te native | 12 | 7 (58.3%) |
| te romanised | 14 | 5 (35.7%) |
| hi+te native / romanised | 29 / 26 | 58.6% / 42.3% |

Question-design variants tried on a 171-item subset: plain keys with spaces 59.6%, current keys 56.1%, first-person descriptions 46.8%, letter keys 25.1%, coarse 6-way group 38.0%. None was good enough to change the conclusion. The model card says it plainly: base checkpoints are near chance zero-shot on domain decisions, and the accuracy comes from fine-tuning.

### Precision by predicted intent, and the thresholds chosen

| predicted intent | precision (any confidence) | at >= 0.90 | threshold |
|---|---|---|---|
| explain_decision | 58.6% | **22/24 (91.7%)** | **0.90** |
| policy_question | 83.9% | **20/22 (90.9%)** | **0.90** |
| greeting | 60.0% | **6/6** | **0.90** |
| every other intent | 0-43% | n/a or too few | **None (never auto-routed)** |

With these thresholds Laya routes 52 of 336 items (15.5%) at 92.3% acceptable. Everything else goes to the LLM classifier. The refusal-type routes (injection, misrepresentation, other_applicant, off_topic) stay off: a wrong refusal costs the applicant more than a slower classification. If they are enabled after fine-tuning, use 0.97 or higher.

### Guard flags (noul, separate call)

| flag | dev positives | AUROC | at 0.9: TP / FP |
|---|---|---|---|
| injection | 8 | 0.94 | 5 / 16 |
| misrepresentation | 7 | 0.57 | 0 / 2 |
| distress | 4 | 0.74 | 0 / 0 |
| wants_human | 7 | 0.69 | 0 / 0 |

Ranking is useful only for injection, and even that has 16 false positives at 0.9. So the flags are logged, never acted on. Choice-style flags (A/B) were worse except wants_human (AUROC 0.90).

### Versus the current LLM classifier (agent dev turns)

18 of the 158 turns are caught by `request_flags` and route the same either way. On the other 140:

| pipeline | route-group correct | LLM classify calls | classify-deadline hits |
|---|---|---|---|
| current (fast regex + LLM classifier + rules fallback) | 111/140 (79.3%) | 140 | 15 |
| Laya alone (zero-shot) | 80/140 (57.1%) | 0 | 0 |
| **hybrid: Laya at the thresholds above, else LLM** | **112/140 (80.0%)** | **107 (-24%)** | 13 |
| hi only: current / Laya / hybrid | 63.2% / 57.9% / 68.4% | | |
| te only: current / Laya / hybrid | 86.7% / 66.7% / 86.7% | | |
| en only: current / Laya / hybrid | 81.1% / 55.7% / 81.1% | | |

The 15 classify-deadline turns in the recorded run were 3 en, 6 hi and 6 te. Zero-shot Laya confidently answers only 2 of them, so **it does not fix the HI/TE timeout problem**. That still needs the keyword pre-route or a larger budget from the fix plan, or a fine-tuned Laya.

The thresholds were picked on the same dev items they are scored on, so the hybrid figure is optimistic. Held-out was not run (it stays untouched).

### Latency (CPU, hark-2, 2 threads)

| | p50 | p95 |
|---|---|---|
| intent call (13-option choice), service-side | 417 ms | 446 ms |
| flags call (4 noul), service-side | 387 ms | 490 ms |
| `/route` (intent + flags), service-side, 60 items | 846 ms | 985 ms |
| `LayaRouter.route()` from the sandbox through the forward | 888 ms | 995 ms |

For comparison, the LLM classifier's budget is 6 s (`AGENT_CLASSIFY_BUDGET_S`). With `LAYA_FLAGS=0` a route costs about 0.45 s.

## Licence

`convaiinnovations/laya` (including the `multilingual` subfolder) and the `laya` package are **Apache-2.0** (model card, retrieved 2026-11-04: https://huggingface.co/convaiinnovations/laya). Attribution: Convai Innovations. We redistribute no weights; the service downloads them from the Hub. The community guard fine-tunes (OidoStudio/laya-mm-guard-v3-gguf, ankitkr225/laya-agent-guard-softce) were **not evaluated**: scope was cut first, and their licences were not checked.

## Limits and next steps

* **Zero-shot is weak** (51.8% acceptable). The router is wired to be useful only where it is precise: about 15% of turns, and 24% fewer LLM classify calls on the agent dev set.
* **No fine-tune** (scope cut at 09:47 IST). Prepared but unused: an agent-authored synthetic training set (1,027 rows, en/hi/te native and romanised, deduplicated against every golden text including held-out, char-4-gram Jaccard < 0.6) and a Kaggle T4 kernel `nothinguser/saral-laya-router-ft` with a private dev-only dataset `nothinguser/saral-laya-router-dev`. The kernel was started before the cut, and its results are not used or reported here. Next step: fine-tune (soft-CE with option shuffling), refit temperatures, re-measure on dev, then raise thresholds intent by intent.
* **Labels**: agent-assigned from probes, not human-reviewed; small classes (what_if 3, distress 2, off_topic 2) give noisy per-intent numbers.
* **Romanised Telugu** is the weakest slice (35.7%).
* **Context-dependent follow-ups** ("which months", "Edi ivvali?") need the previous turn; the context state hurt zero-shot, so these always fall to the LLM.
* **Ops**: one process, no auth (loopback only), no systemd unit; lost on a hark-2 stop. Start it with `~/laya/start_laya.sh`.
* **Not wired yet**: graph.py is Qoder-owned. The exact wiring is in project-management/QODER_HANDOFF.md, Q-18, to apply on #56.
