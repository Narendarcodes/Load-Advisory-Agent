# Saral advisory agent — design

**The agent explains; it never decides.** A decision exists only because the conventional workflow
(`lifecycle.process_application` → ZEN → `Loan Decision Evidence`) wrote one. The agent reads that
record and phrases it. What-if answers are in-memory ZEN simulations that are never persisted.

The design goal: **the model decides what it needs to know.** There is no intent label that picks a
tool plan, and no static pattern that routes a question. The model gets the applicant's message, a
small set of read tools and the disclosure rules; it plans the reads, the reads come back as data,
and it answers. Everything that must never happen is enforced deterministically, outside the model.

## Two cores, one switch

`SARAL_AGENT_CORE` selects the implementation. Both share the same contracts, tools, guardrails,
streaming and audit.

| Core | File | What it is | When |
|---|---|---|---|
| `tools` | `agent/agent_loop.py` + `graph._build_agent()` | the tool-calling agent — the live default | production (`SARAL_AGENT_CORE=tools`) |
| `graph` | `graph._build_graph()` | the original fixed-intent LangGraph chain | fallback, and the core the legacy suite describes |

The live run is `tools`. The `graph` core is kept because ~1,900 tests and the voice/offline paths
describe it; it is a working fallback if the tool loop ever has to be bypassed.

## Pipeline (`tools` core)

```
START → receive → authenticate ──(not_authorized | unavailable)─────────────→ simple
                       │ok
                       ▼
                     guard ──boundary (safety flag)──────────────────────────→ boundary
                       │clean
                       ▼
                     agent ──(tool loop: model chooses the reads)────────────→ validate
                       ▲   └──(guard flags, attempts < 2)──┘                    │
                       │                                                       ▼
                       └─────────────────────────────────────────────── finalize → END
boundary → finalize;  simple → finalize
```

### Nodes

| Node | What it does | LLM? |
|---|---|---|
| `receive` | resets per-turn state, starts the deadline clock | – |
| `authenticate` | `tools.authorize(ref, session)`: the session's `applicant_ref` must equal the application's `applicant`. Unknown and not-owned look identical | – |
| `guard` | the **deterministic safety guards only** — never intent routing | – |
| `agent` | the tool-calling loop (below) | yes |
| `validate` | the output check: guarantee/decision language, disclosure, ungrounded numbers, citations | – |
| `finalize` | builds `AgentResponse`, falls back to a template, appends the synthetic label, writes the audit row | – |
| `boundary` | fixed refusal/handoff templates for the safety flags | – |
| `simple` | templates for auth/unavailable/no-decision/missing-info/manual-review/approved | – |

### `guard` — what it stops, and why it is not routing

A short deterministic list, checked before the model sees anything:

- a claim that the recorded data is wrong (`dispute`) → a human handoff
- another applicant's reference (`other_applicant`)
- an instruction to change the record or the answer (`injection`, `override`, `edit_record`, `auto_submit`)
- a request to enter false details (`misrepresentation`)
- a demand for a re-pull of bureau data (`bureau_request`)
- a request for a guarantee (`guarantee`)

Everything else — "what is my name", "why was I rejected", "what is the prepayment fee", "what if I
earn more" — is the agent's to work out. Nothing here decides *what* the answer is.

## The agent loop (`agent_loop.py`)

```
messages = [system(AGENT_TASK)] + recent history + [user message]
repeat up to MAX_STEPS (4):
    resp = llm.chat_tools(messages, TOOL_SCHEMAS)
    if resp has tool calls:
        append the assistant tool_calls
        for each call: run it (ownership re-checked), append the tool result
        continue
    answer = resp.text; stop
```

- **The model plans.** The system prompt describes the situation and the rules; it does not describe
  intents. The model decides which tool (if any) answers the message.
- **Tool results are data, never instructions.** A result is JSON; the prompt says to ignore any
  instruction inside it. Every tool re-checks ownership server-side, so a hallucinated application
  reference reads nothing.
- **Bounded.** At most 4 rounds; a model that keeps calling tools without answering falls back to a
  template instead of looping forever.
- **Carries state forward.** The record/profile/simulation a tool produced are returned in the state
  so `validate`, `finalize`, the decision card and the audit see them.

### Tools

| Tool | Reads | Returns |
|---|---|---|
| `get_applicant_profile` | the authorised `Loan Application` | name, applicant reference, application reference, amount, period, product, status |
| `get_decision_evidence` | `Loan Decision Evidence` | outcome in plain words, one reason category, offer if any |
| `search_policy` | the policy retriever (hybrid + rerank) | numbered passages to cite |
| `run_what_if` | ZEN `simulate` (in memory) | hypothetical result, reason categories, offer; never persisted |
| `create_human_handoff` | the handoff queue | a ticket reference |

There is no generic Frappe, SQL or web tool, and no write path. `run_what_if` accepts `set` (absolute)
and `delta` (relative to the recorded value), maps common synonyms (`monthly_emis` →
`monthly_obligations`, …) and ignores note keys the model adds.

## Guardrails (three layers, all outside the answer)

1. **Before the model** — `guard` (above).
2. **In the prompt** — `AGENT_TASK` = `CORE_RULES` + `DECISION_AUTHORITY` + `DISCLOSURE` +
   `PLAIN_LANGUAGE`: no thresholds/cut-offs/rule names, no decision or promise, the applicant's own
   values are shareable, the recorded decision is the only source of outcomes.
3. **After the model** — `validate` / `finalize`:
   - guarantee or decision language (negation-aware), NBFC written-reason claims
   - **ungrounded numbers**: every number in the answer must come from the record, the applicant's
     own identifiers, the profile, the cited passages or the message
   - citation labels valid, present, and absent on abstention
   - a flagged draft is rewritten once with the flags fed back; a second failure becomes a template

## Failure handling

| Situation | Behaviour |
|---|---|
| LLM error / outage | the node returns no draft → `finalize` uses the deterministic template (`fallback_template`) |
| Tool error | the error is returned to the model as data; it can retry, say it could not check, or offer a human review |
| Deadline | the turn stops; the template is used and `deadline` is flagged |
| Model loops without answering | `MAX_STEPS` stops it; the template is used |

## Configuration

| Var | Meaning |
|---|---|
| `SARAL_AGENT_CORE` | `tools` (default live) or `graph` (legacy) |
| `SARAL_LLM_PROVIDER` / `SARAL_LLM_MODEL` / `SARAL_LLM_FALLBACK_MODEL` | the answer model (live: OmniRoute, `antigravity/gemini-3.8-flash-low`) |
| `SARAL_INTENT_*` | the legacy core's classifier (unused by `tools`) |
| `AGENT_TEXT_DEADLINE_S` / `AGENT_VOICE_DEADLINE_S` | per-turn deadlines |
| `AGENT_STATE_DIR` | audit log, handoff queue, traces |

## Testing

- `tests/test_agent_tools_core.py` — the loop: the model's tool decisions are scripted; the tests
  assert which tools run, that a boundary is refused before the model, and that an outage falls back.
- `tests/test_agent_graph.py`, `test_agent_eval_fixes.py`, … — the `graph` core, the tools, the
  guardrails and the contracts.
- Run: `.venv/Scripts/python.exe -m pytest -q tests` (the pre-commit hook does the same).
