# Prompt versioning and prompt experiments in the local Langfuse

How to test the agent's prompts and compare prompt versions **inside** the self-hosted Langfuse, and how to serve the
version you chose. Everything here is local: the UI is `http://127.0.0.1:3000`, the project is `loan-advisory-local`,
and no Langfuse Cloud account or key is involved.

- Stack runbook (start/stop, ports, backup): [`infra/langfuse/README.md`](../../infra/langfuse/README.md)
- Tracing and evaluation (traces, datasets, scores): [`docs/observability/langfuse.md`](langfuse.md)
- Runtime prompt store: [`apps/api/src/loan_advisory/agent/prompt_store.py`](../../apps/api/src/loan_advisory/agent/prompt_store.py)
- Publish/promote CLI: [`scripts/development/langfuse_prompts.py`](../../scripts/development/langfuse_prompts.py)
- Experiment runner: [`scripts/development/langfuse_prompt_experiment.py`](../../scripts/development/langfuse_prompt_experiment.py)

## 1. The model: four objects, one loop

| Object | What it is here | Where it lives |
|---|---|---|
| **Prompt** | one managed template, e.g. `loan-advisory-explain`; every save is a new immutable **version** (`v1`, `v2`, …) | Langfuse → Prompts |
| **Label** | a movable pointer to a version: `production` (served by the agent), `candidate` (under test), `latest` (Langfuse-managed) | on the version |
| **Generation** | the `llm.compose_*` span of a real turn, linked to the prompt **name + version** that produced it | Langfuse → Tracing |
| **Experiment** | one run of a **dataset** through one prompt version, with deterministic per-item **scores** | Langfuse → Datasets → Experiments |

The loop:

```
prompts.py ──push──▶ Prompt v1 (label: production) ──serve──▶ agent turn ──▶ trace shows "prompt v1"
                            │                                                      │
                            └──new version (label: candidate) ──experiment──▶ scores ──compare──▶ promote ──▶ production
```

Two rules make this safe to run in this repo:

1. **`prompts.py` stays the source of truth and the fallback.** With `LANGFUSE_PROMPTS` unset (the default) the agent
   renders `prompts.py` exactly as before — byte-identical text, no network. A Langfuse outage, a missing prompt or a
   drifted placeholder also falls back to that local text, so a prompt edit can never take the agent down.
2. **Nothing applicant-specific goes into a prompt.** The variables (`facts`, `values`, `question`, …) are filled at
   call time from synthetic local data; the templates themselves are synthetic policy copy.

## 2. Check the connection

```powershell
# root .env already carries the LANGFUSE_* keys the agent uses
.\.venv\Scripts\python.exe scripts\development\langfuse_check.py --env-file .env --send-trace
```

Expected: `health: HTTP 200 {'status': 'OK', 'version': '4.70.0'}`, `auth: HTTP 200; projects=['loan-advisory-local']`,
`trace: delivered (<id>)`.

> **Gotcha:** `--stack-env` reads `infra/langfuse/.env`, which holds the stack's bootstrap names
> (`LANGFUSE_INIT_PROJECT_PUBLIC_KEY`, …) and not the agent's `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY`, so it
> reports `"active": false` and exits 2. Use `--env-file .env` (the three scripts in this document accept it).

Open <http://127.0.0.1:3000> and sign in with `LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_USER_PASSWORD` from
`infra/langfuse/.env` (default `admin@loan-advisory.local`). The project is `loan-advisory-local`.

## 3. Publish the prompts that already exist in code

```powershell
.\.venv\Scripts\python.exe scripts\development\langfuse_prompts.py --env-file .env push `
    --commit-message "baseline: prompts.py as committed"
```

```
  explain                  published v1 label=production
  improve                  published v1 label=production
  what_if                  published v1 label=production
  policy                   published v1 label=production
  policy_spans             published v1 label=production
  classify                 published v1 label=production
  verify_citations         published v1 label=production
  verify_citations_quote   published v1 label=production
```

What gets stored: a **text** prompt per template with `{{variable}}` placeholders (`str.format` `{facts}` becomes
`{{facts}}`, literal `{{…}}` JSON examples become `{…}`), plus a `config` block carrying the variable list, the role,
the git SHA and the source. Re-running `push` is idempotent: a template whose text is unchanged is skipped
(`unchanged (v1)`), so it is safe to call from a script after every edit.

Inspect what is published, and prove the served text still matches the code's expectations:

```powershell
.\.venv\Scripts\python.exe scripts\development\langfuse_prompts.py --env-file .env list
.\.venv\Scripts\python.exe scripts\development\langfuse_prompts.py --env-file .env sync-check
```

`sync-check` compares the placeholders the code fills with the variables the served version declares and exits 1 on
drift, printing which side is missing what. An LLM answer that contains a literal `{{facts}}` is the failure it
prevents.

Other commands:

| Command | Use |
|---|---|
| `show --only explain --version 1` | print one version's text |
| `show --only explain` | print what the served label points at |
| `diff --only explain --from 1 --to 2` | unified diff between two versions |
| `push --only explain --label candidate` | publish a code change under a test label, without serving it |
| `promote --only explain --version 2 --label production` | move `production` to v2 (the agent starts serving it) |

## 4. Test a prompt in the Playground (no code, no restart)

This is the fastest way to feel a prompt change before running anything.

1. **Prompts → `loan-advisory-explain`**. The header shows `production` / `latest` labels and the version selector.
2. Open the version you want, then the **Playground** tab (or *Run in playground*).
3. Pick the model. Two LLM connections are configured, both OpenAI-compatible:

   | Connection | Base URL | Models | Use it when |
   |---|---|---|---|
   | `omniroute` | `http://host.docker.internal:20128/v1` | `antigravity/gemini-3.8-flash-low`, `antigravity/claude-sonnet-4-6`, … | default: the local gateway, fast, no token-per-minute cap |
   | `groq` | `https://api.groq.com/openai/v1` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, … | your account's 8k tokens/minute cap applies; 429s are common |

4. Fill the variables (`style`, `lang`, `voice`, `facts`). `style` is the literacy sentence, `voice` is empty for text
   and the spoken sentence for voice, `facts` is the JSON the composer sees. Use the synthetic facts from
   [`langfuse_prompt_experiment.py`](../../scripts/development/langfuse_prompt_experiment.py) (`FACTS`) — never a real
   applicant's data.
5. **Run**. Then edit the system prompt in the left pane and **Run** again: the two outputs sit side by side, with
   latency and token counts.
6. **Save as new version** with `candidate` in the label field. Nothing is served until `production` moves.

> The local gateway is reachable from the Langfuse container as `host.docker.internal`, which the Playground's SSRF
> guard blocks by default. `infra/langfuse/docker-compose.yml` now allowlists exactly that one hostname
> (`LANGFUSE_LLM_CONNECTION_WHITELISTED_HOST`); a different gateway host needs the same treatment, otherwise saving
> the connection fails with **"Invalid base URL: Blocked hostname detected"**.

## 5. Run a real A/B with scores

The experiment answers "is v2 better than the production prompt?" with numbers instead of impressions.

```powershell
# 1. publish a candidate version of explain + upsert the 10-item dataset (idempotent)
.\.venv\Scripts\python.exe scripts\development\langfuse_prompt_experiment.py --env-file .env --setup

# 2. answer the dataset with the served version
.\.venv\Scripts\python.exe scripts\development\langfuse_prompt_experiment.py --env-file .env --run production

# 3. answer the same dataset with the candidate
.\.venv\Scripts\python.exe scripts\development\langfuse_prompt_experiment.py --env-file .env --run candidate
```

**Dataset `prompt-guardrails-v1`** — 10 synthetic questions against one fixed synthetic decline (`explain` intent):
the recorded decline, a credit-score question, an eligibility question, an income-threshold question, an amount
question, an improvement question, an approval request, an internal-officer question, a message carrying a phone
number, and a question naming internal jargon (`FOIR`, `DPD`).

**Evaluators — every score is deterministic, no LLM judge:**

| Score | Type | Passes when |
|---|---|---|
| `guard_clean` | boolean | `guards.answer_flags` finds no guarantee/decision language |
| `no_internal_terms` | boolean | no `FOIR`/`DPD`/cut-off/rule-id/`bureau`/`ZEN`/`RAG`/`passage` wording |
| `grounded_numbers` | boolean | every number in the answer appears in the facts (`guards.ungrounded_numbers`) |
| `no_forbidden_text` | boolean | the item's `forbid` list is absent (e.g. the phone number is not echoed) |
| `has_next_step` | boolean | the answer names one concrete next step |
| `synthetic_note` | boolean | the answer says the rules are example (synthetic) rules |
| `plain_sentences` | numeric | share of sentences with ≤ 20 words |
| `length_words` | numeric | word count (the target is ≤ 90) |
| `case_ok` | boolean | the item is clean on all of the above |
| `suite_case_ok_rate` | numeric (run level) | share of items with `case_ok` |

**Read the result:** **Datasets → `prompt-guardrails-v1` → Experiments**, tick both runs
(`production-final`, `candidate-final`) and compare the metric columns. Click an item to see its answer, its scores,
and the trace with the `llm.compose_explain` generation. The generation carries the prompt name and version, so the
trace itself says which version produced that answer.

### What the recorded runs show

Measured 2026-11-15 with `antigravity/gemini-3.8-flash-low` on the OmniRoute gateway, 10 items, temperature 0:

| Metric | `production` (v1) | `candidate` (v2) |
|---|---|---|
| `case_ok` | 10/10 | 10/10 |
| `guard_clean` | 10/10 | 10/10 |
| `no_internal_terms` | 10/10 | 10/10 |
| `grounded_numbers` | 10/10 | 10/10 |
| `no_forbidden_text` | 10/10 | 10/10 |
| `has_next_step` | 10/10 | 10/10 |
| `synthetic_note` | 10/10 | 10/10 |
| `plain_sentences` (mean share of ≤ 20-word sentences) | 0.83 | **0.96** |
| `length_words` (mean) | 73.3 | **64.8** |

The candidate adds three style rules to the served text (open with the synthetic-rules sentence, end with one
"you can …" next step, stay under 90 words). It keeps every guardrail clean and moves the two style metrics in the
intended direction, which is the evidence you want before promoting it. The sample is small (10 items, one model):
re-run with more items or a second model before treating the gap as stable, and treat a fast run as a *cached*
gateway response rather than a latency result — the same prompt+question answered twice comes back in milliseconds.

`--run` writes a new experiment run each time (a repeated `--run-name` appends to the same run). A run interrupted
by a stack restart keeps the items that finished; delete it in the UI (Experiments → row menu → Delete) rather than
comparing it.

**Model and throttling.** The default is the repo's own OmniRoute model (`SARAL_LLM_MODEL`,
`antigravity/gemini-3.8-flash-low`) on `http://127.0.0.1:20128/v1`; override with `--model` / `--base-url`. On a
hosted provider that caps tokens per minute the runner waits out `x-ratelimit-reset-tokens` and retries instead of
dropping an item — expect a 10-item run to take minutes rather than seconds there, and keep `--concurrency` at 1–3.

## 6. Serve the version you chose

The agent reads prompts only when you ask it to:

```powershell
$env:LANGFUSE_PROMPTS = "1"            # master switch for Prompt Management (default off)
$env:LANGFUSE_PROMPT_LABEL = "production"  # which label to serve
$env:LANGFUSE_PROMPT_CACHE_TTL_S = "60"    # how long a fetched version is cached
```

| Variable | Default | Meaning |
|---|---|---|
| `LANGFUSE_PROMPTS` | off | serve prompts from Langfuse; off means `prompts.py` |
| `LANGFUSE_PROMPT_LABEL` | `production` | the label the agent resolves (a rollback is just a `promote`) |
| `LANGFUSE_PROMPT_PREFIX` | `loan-advisory-` | prompt-name prefix (flat: a `/` breaks the REST path) |
| `LANGFUSE_PROMPT_CACHE_TTL_S` | `60` | per-process cache; a promoted version is picked up within this window |

It also needs the project keys (`LANGFUSE_ENABLED=1`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`,
`LANGFUSE_BASE_URL`) — i.e. the same block the tracer uses.

When it is on, the trace shows it: open a turn, expand the `llm.compose_explain` generation, and the prompt name and
version are attached to the observation. Filter **Tracing** by that metadata to compare live traffic across versions.

Behaviour that never changes: an answer is never blocked, slowed or altered by a prompt-fetch failure — the local
template is used and one warning is logged with the exception class only.

## 7. Where to look in the UI

| Task | Path |
|---|---|
| The prompts and their versions | **Prompts** → `loan-advisory-explain` → version selector, labels, commit messages |
| Diff two versions / restore text | same page → compare view, or `langfuse_prompts.py diff` |
| Try a prompt with a model | **Prompts** → **Playground** (`omniroute` or `groq` connection) |
| A live turn's prompt version | **Tracing** → trace → `llm.compose_*` observation |
| One borrower conversation | **Sessions** (session IDs are hashed; no applicant identifiers) |
| The A/B numbers | **Datasets** → `prompt-guardrails-v1` → **Experiments** |
| Per-item answers and scores | experiment → item → answer, scores, linked trace |
| Quality over time | **Scores** / **Dashboards** filtered to `environment = local` |

## 8. Privacy and safety rules

- The prompts themselves contain no applicant data, but their **variables** do (`facts` carries the recorded decision
  and amounts). In this repo those are synthetic. Never paste a real applicant's records into the Playground or a
  prompt version: the Playground sends the rendered prompt **and variables** to the model provider.
- Keep `LANGFUSE_CAPTURE_CONTENT=0` (the default). With it on, prompt/answer text is captured on spans as well.
- Prompt text lives in the local Postgres only; `LANGFUSE_ALLOW_REMOTE` stays off and Langfuse Cloud hosts are
  refused by the config loader.
- **Never** `docker compose down -v`: it deletes prompts, versions, datasets, experiments and traces.
- Deleting a prompt version is a UI action and is irreversible; prefer re-labelling (`promote`) for rollback.

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `--stack-env` reports `"active": false` (exit 2) | that file has `LANGFUSE_INIT_*`, not `LANGFUSE_*`; use `--env-file .env` |
| `ApiError … status_code: 404` with an HTML body, for a prompt name | the name contains `/`; the v4 REST path does not encode it. Keep names flat (`loan-advisory-explain`) |
| `Invalid base URL: Blocked hostname detected` | the Playground SSRF guard; allowlist the host in the compose env (`LANGFUSE_LLM_CONNECTION_WHITELISTED_HOST`) and recreate `langfuse-web`/`langfuse-worker` |
| `langfuse prompt … unavailable` in the API log, answers unchanged | fail-open by design: the local template was used. Check the stack and keys with `langfuse_check.py` |
| Experiment items fail with `HTTP 429` | the provider's tokens/minute cap; the runner retries — lower `--concurrency`, or use the local gateway |
| A run has 15 spans but no scores | scores are sent at the end; a stack restart during the run drops them. Re-run |
| `/api/public/traces` or `/api/public/scores` returns 404 | expected in the v4 `events_only` server; use the UI or `/api/public/v2/observations?traceId=…` |
| `promptName`/`promptVersion` are absent from the v2 observations API | that endpoint does not expose them; the UI shows the prompt chip, and the columns exist in ClickHouse (`SELECT name, prompt_name, prompt_version FROM events_full WHERE trace_id='…'`) |
| A promoted version is not served yet | the process caches for `LANGFUSE_PROMPT_CACHE_TTL_S` (60 s); restart or wait |

## 10. Verified vs manual

Verified while building this (2026-11-15, Langfuse 4.70.0, Python SDK 5.0.4): health/auth/trace delivery through
`langfuse_check.py`; publishing all 8 templates as v1 with `production`; idempotent re-push; `list`, `show`, `diff`,
`promote`, `sync-check` (no drift); remote fetch + mustache compile producing text byte-identical to the local
template; candidate v2 derived from v1 with a three-rule patch; dataset `prompt-guardrails-v1` with 10 items; five
experiment runs (including two clean A/B runs, table above) with deterministic scores, experiment-linked items and
the prompt name/version stored on the `llm.compose_explain` generation; both LLM connections (`omniroute`, `groq`)
accepted by the Playground guard; the runtime span path (raw `langfuse.observation.prompt.name/.version`
attributes from `prompt_store.attrs`) landing in ClickHouse as `prompt_name`/`prompt_version`; full pytest suite green
(1923 passed, 73 skipped).

Manual / not automated: dashboard widgets, retention pruning, a restore drill, and the visual Playground side-by-side
comparison (documented above, exercised in the UI only).
