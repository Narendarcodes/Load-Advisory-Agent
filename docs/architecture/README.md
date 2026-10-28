# Architecture

Mermaid sources live in [`diagrams/`](diagrams/) next to their rendered SVG and PNG (re-render with
`bash docs/architecture/diagrams/render.sh`). The revised diagrams (01, 02, 05) were checked against `main` at
`9a6e3f6` (2026-10-27), so they cover the bureau entry point (PR #17) and optional Langfuse export (PR #18) as well
as the advisory agent; 03 and 04 keep their PR #10 scope. Other docs here:
[synthetic-bureau.md](synthetic-bureau.md) (bureau flow, `REVIEW` vs `ERROR`, score precedence),
[conventional-workflow.md](conventional-workflow.md) (Phase 3 decision workflow) and
[repository-structure.md](repository-structure.md) (layout notes). Rationale is in
[../../APPROACH.md](../../APPROACH.md), observability in [../observability/langfuse.md](../observability/langfuse.md).

All applicant data and the four thresholds are synthetic (`synthetic-v1`). Bajaj Finance is a public reference lender,
not a partner. The synthetic bureau is a development-only FastAPI service, not CIBIL/FICO.

## 1. System context

Who and what the agent talks to. Everything is self-hosted and bound to 127.0.0.1 on the droplet. The advisory server
is the Python standard library; the synthetic bureau is a separate FastAPI service. `/api/bureau/run` evaluates the
signed-in application through that bureau and the data-quality gates, then the unchanged ZEN decision.

![System context](diagrams/01-system-context.png)

Source: [01-system-context.mmd](diagrams/01-system-context.mmd) · [SVG](diagrams/01-system-context.svg)

## 2. Components

The advisory server and its bureau entry point, the LangGraph graph and its helpers, the least-privilege tools, the
decision core, the bureau data-quality gates, the policy retriever (Qdrant + BM25 + reranker), Frappe, the gpt-oss LLM,
the optional Phoenix/Langfuse exporters and the LiveKit voice stack (STT/TTS).

![Components](diagrams/02-components.png)

Source: [02-components.mmd](diagrams/02-components.mmd) · [SVG](diagrams/02-components.svg)

## 3. Agent request sequence

One text turn, including the authorization, guard (boundary), simple-template, abstain and rewrite/fallback paths.

![Agent request sequence](diagrams/03-agent-request-sequence.png)

Source: [03-agent-request-sequence.mmd](diagrams/03-agent-request-sequence.mmd) · [SVG](diagrams/03-agent-request-sequence.svg)

## 4. Voice turn sequence

One voice turn: VAD, STT, the same graph via `/api/chat/stream`, sentence-by-sentence guarding and TTS, the filler and
the timeout relationship.

![Voice turn sequence](diagrams/04-voice-turn-sequence.png)

Source: [04-voice-turn-sequence.mmd](diagrams/04-voice-turn-sequence.mmd) · [SVG](diagrams/04-voice-turn-sequence.svg)

## 5. Data and policy ingestion

Offline paths: dataset audit and synthetic personas, the conventional decision workflow that writes Decision Evidence,
the synthetic-bureau fixture generator and its 120-case replay, the policy register → fetch → chunks → Qdrant/BM25
index, plus the evaluation sets.

![Data and policy ingestion](diagrams/05-data-policy-ingestion.png)

Source: [05-data-policy-ingestion.mmd](diagrams/05-data-policy-ingestion.mmd) · [SVG](diagrams/05-data-policy-ingestion.svg)
