# Saral architecture and approach

State of the integration build (`saral/integration`) on 2026-11-04. All data is synthetic. Bajaj Finance Ltd is a
public reference lender, not a partner. The diagrams are Mermaid and render on GitHub. Their editable sources are also in
[`../architecture/diagrams/`](../architecture/diagrams/) as `12-saral-system.mmd`, `13-saral-approach.mmd`,
`14-saral-decision-flow.mmd`, `15-saral-agent-turn.mmd` and `16-saral-policy-rag.mmd` (SVG/PNG not rendered yet:
run `bash docs/architecture/diagrams/render.sh`). Older diagrams 01-11 in that folder
describe the pre-Saral agent and portal and are kept for history.

## 1. Approach drawing: who does what

The one idea behind Saral: **a deterministic engine decides, and the language model only explains what was decided.**

```mermaid
flowchart TB
  subgraph APPLY["1. Apply (English form)"]
    A1["Pick a purpose:<br/>wedding / higher education /<br/>home renovation / medical emergency"]
    A2["7-step form<br/>(salaried only)"]
    A3["Consents: credit check,<br/>KYC, bank fetch, data use"]
    A4["Documents: PAN, Aadhaar,<br/>salary slips, bank statement,<br/>employment letter"]
    A1 --> A2 --> A3 --> A4
  end

  subgraph CHECK["2. Check (synthetic services, no LLM)"]
    C1["KYC: PAN + Aadhaar"]
    C2["Bank: account-aggregator fetch<br/>(PDF + OCR as fallback)"]
    C3["Credit bureau report"]
    C4["OCR fields + signature screening<br/>(screening only, refer never decline)"]
  end

  subgraph DECIDE["3. Decide (ZEN only)"]
    D1["Rule catalogue v2<br/>(single source of truth)"]
    D2["Outcome: approve / counter-offer /<br/>decline / more info / manual review"]
    D3["Offer sized per applicant<br/>(largest passing amount, cap ₹25L)"]
    D1 --> D2 --> D3
  end

  subgraph RECORD["4. Record (Frappe Lending)"]
    R1["Decision evidence +<br/>plain reason category"]
    R2["Decision card:<br/>outcome, amount, EMI, tenure"]
    R3["Loan Officer desk<br/>for manual review"]
  end

  subgraph EXPLAIN["5. Explain (Saral assistant, EN / HI / TE)"]
    E1["Read the stored decision<br/>(exact, read-only)"]
    E2["One plain reason,<br/>2-3 general next steps"]
    E3["What-if: in memory,<br/>max 3, 'estimate only'"]
    E4["Policy questions:<br/>RAG with citations,<br/>indicative only"]
    E5["Hand off to a person"]
  end

  APPLY --> CHECK --> DECIDE --> RECORD --> EXPLAIN
  E3 -. "same rules, nothing saved" .-> D1
```

What each step never does:

| Step | Never |
|---|---|
| Check | Uses real data or real services |
| Decide | Uses an LLM or a retrieved passage |
| Record | Shows rule numbers, cut-offs or fraud words to the borrower |
| Explain | Changes the application, approves anything, names a threshold, or ties a published Bajaj number to the borrower's own case |

## 2. System and deployment (integration build)

```mermaid
flowchart LR
  subgraph USERS["People"]
    BOR["Borrower"]
    OFF["Loan Officer"]
  end

  subgraph ORCH["Orchestration machine (dev sandbox)"]
    FD["Front door :18100<br/>one origin for portal + assistant"]
    RT["Assistant runtime :4200<br/>CopilotKit (Node)"]
    AG["Saral agent :8095<br/>FastAPI + LangGraph"]
    RUN["Decision runner<br/>(always on, polls Frappe)"]
    ZEN["ZEN Engine<br/>catalogue v2 (in process)"]
    RUN --> ZEN
    AG -- "what-if" --> ZEN
  end

  subgraph IB2["InstaBox 2"]
    FR["Frappe stack :8080<br/>frappe 16 + erpnext 16 +<br/>lending 16 + loan_advisory_portal"]
    DB[("MariaDB + Redis")]
    LF["Langfuse 4.70 :3000<br/>(optional)"]
    FR --- DB
  end

  subgraph IB1["InstaBox 1"]
    QD[("Qdrant :6333<br/>saral_nbfc_policy 329<br/>rbi_regulatory 317")]
    EMB["Embedding service :8013<br/>EmbeddingGemma (768-d)"]
    BUR["Synthetic bureau :8011"]
    KYC["Synthetic KYC + AA :8012"]
  end

  LLM["LLM endpoint<br/>(OpenAI-compatible)"]
  KG["Kaggle 2x T4<br/>(eval retrieval only)"]

  BOR --> FD
  OFF --> FR
  FD --> FR
  FD --> RT
  RT -- "60 s assertion" --> AG
  AG -- "read-only views" --> FR
  AG --> QD
  AG --> EMB
  AG --> LLM
  AG -.-> LF
  RUN --> FR
  RUN --> BUR
  RUN --> KYC
```

All service ports listen on 127.0.0.1 on their own host; the orchestration machine reaches them through SSH port
forwards. Details: [INTEGRATION_DEPLOY.md](INTEGRATION_DEPLOY.md).

## 3. Decision flow (no LLM anywhere)

```mermaid
flowchart TD
  S["Application SUBMITTED in Frappe"] --> K["KYC: PAN + Aadhaar (synthetic API)"]
  K --> BK["Bank: AA fetch, else PDF + OCR"]
  BK --> BU["Bureau report"]
  BU --> G{"Bureau gate"}
  G -- "no hit / thin file /<br/>data-quality issue" --> MR["MANUAL_REVIEW<br/>(plain reason)"]
  G -- "ok" --> Z["ZEN: catalogue v2 rules<br/>(per product and amount band)"]
  Z --> O{"Outcome"}
  O -- "all pass" --> AP["APPROVED"]
  O -- "fails only on amount" --> CO["COUNTER_OFFER<br/>largest passing amount"]
  O -- "hard fail" --> DE["DECLINED<br/>one reason category"]
  O -- "missing document or field" --> MI["MORE_INFORMATION_REQUIRED"]
  O -- "review trigger, fraud or list hit,<br/>low OCR confidence" --> MR
  AP & CO & DE & MI & MR --> EV["Decision evidence + snapshot<br/>stored in Frappe (audit log)"]
  MR --> DESK["Loan Officer desk:<br/>Approve / Decline / Request info"]
```

Design rules shown here: fraud, list and signature hits refer to a person and are never an automated decline; a
low-confidence decline is downgraded to review; missing data refers or asks for more information.

Known gaps in this flow as of 2026-11-04 03:50 IST (D-11..D-15): a bureau provider error ended as `ERROR` instead of
review; contract employment, residency and missing EMI debits did not reach the rules; a missing signature
(`INSUFFICIENT_DATA`) still approved. Status after the fixes: {{ZEN_GAP_STATUS}}.

## 4. One assistant turn

```mermaid
sequenceDiagram
  autonumber
  participant B as Borrower
  participant P as Saral portal (Frappe)
  participant R as Assistant runtime
  participant A as Saral agent (LangGraph)
  participant L as LLM
  participant Q as Policy RAG (Qdrant)
  participant F as Frappe records

  B->>P: message (EN / HI / TE)
  P->>R: mint a 60 s signed assertion (borrower, application, locale)
  R->>A: AG-UI request + assertion
  A->>A: verify assertion, check ownership
  A->>A: request guards (injection, edit record, other applicant, guarantee ...)
  A->>L: classify intent
  alt explain / improve / what-if / status
    A->>F: read the stored decision (read-only)
    opt what-if (max 3 per session)
      A->>A: run ZEN in memory, nothing saved
    end
  else policy question
    A->>Q: hybrid search over both collections
  else needs a person
    A->>F: create a human handoff
  end
  A->>L: compose the answer in the borrower's language
  A->>A: answer guards + sanitiser (no labels, enums, cut-offs)
  A-->>R: streamed answer + minimal card
  R-->>B: reply
```

Graph nodes (`apps/api/src/loan_advisory/agent/graph.py`): `receive` → `authenticate` → `classify` →
(`boundary` | `load_evidence` | `retrieve_policy` | `simple`) → (`plan` | `what_if`) → `compose` → `validate` (one
rewrite, then a template) → `finalize`.

Agent changes queued for today (2026-11-04) and not yet reflected above: route before fetching the decision, fetch it
once and cache it; new intents for human review, distress and misrepresentation; a clarifying question for vague
messages; what-if cap enforced in the agent; an optional fast intent router (Laya, off by default). Status:
{{AGENT_FIX_STATUS}}.

## 5. Policy RAG

```mermaid
flowchart LR
  subgraph CORPUS["Cleaned corpus (G1)"]
    BJ["Bajaj Finance public docs<br/>15 docs, 329 chunks<br/>authority: indicative"]
    RB["RBI directions<br/>6 docs, 317 chunks"]
  end
  BJ --> C1[("saral_nbfc_policy")]
  RB --> C2[("rbi_regulatory")]
  Qy["Question"] --> DQ["Optional sub-queries<br/>(multi-hop)"]
  DQ --> BM["BM25"] & DN["Dense: EmbeddingGemma"]
  C1 & C2 --> BM & DN
  BM & DN --> RRF["Weighted RRF"] --> RR["Reranker (optional)"] --> TOP["Top 5 passages"] --> ANS["Cited answer,<br/>labels stripped"]
```

HDFC, ICICI and synthetic documents were removed from the corpus. ZEN rules are never indexed.
