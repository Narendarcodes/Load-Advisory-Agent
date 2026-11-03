# Phase 0 — Repository and implementation-state verification

> **Snapshot.** State in this report (branches, PR status, running services) was verified on the date at the top of the file and is not maintained afterwards. For current PR/branch state use `git status`, `gh pr view`, and `reports/bajaj-alignment-status-and-blockers.md`.

Verified 2026-11-03 (IST) against the **Master Implementation Prompt: Security Boundaries, RAG Corpus Cleanup & Policy Alignment**.
**Phase 1 was NOT started.** No source file, configuration file, corpus document, index or evaluation dataset was modified.

Two findings require the owner before Phase 1 can proceed:

1. **PR #42 is still unmerged** → §3 of this prompt makes that an explicit stop condition.
2. **§1 of this prompt reverses the previously approved lender-identity decision.** The earlier roadmap said "lender identity fully synthetic (`SARAL_DEMO`, borrower label `Demo Sample Lender (Synthetic)`), delete the old lender corpus". This prompt says "Bajaj Finance is the actual lender… RETAIN all valid `BFL-*` documents… Do not rename Bajaj Finance or replace it with a synthetic lender identity." I will follow this prompt, but the contradiction must be confirmed in writing because it invalidates published recommendations in the audit report and one artefact I already produced (§4 below).

---

## 1. Git state

| Item | Value | Note |
|---|---|---|
| Current branch | `feat/agent-boundary-corpus-reset` | created from `main` @ `31cbe19` |
| Branch commit | `31cbe19` — identical to `main` and `origin/main` | **synchronized**: 0 ahead, 0 behind |
| `main` / `origin/main` | `31cbe19` / `31cbe19` | unchanged since Phase 0 of the previous prompt |
| Working tree | clean of tracked changes; untracked: `reports/` (5 files) and `data/source_archive/` (13 files) | both are my artefacts, nothing pre-existing was touched |
| Stashes | none | |
| Worktrees | 6, unchanged; live agent source `…-frappe` @ `15579b4` (ancestor of `main`) | |
| Pre-commit | `.githooks` (whitespace check → ruff on staged Python → full pytest); last run on `98ba876`: **685 passed, 15 skipped** | hook was never bypassed |

## 2. Open PR dependencies

| PR | Title | State | Relevance to this work |
|---|---|---|---|
| **#42** | docs(audit): RAG/policy/cost audit and Phase 0 implementation baseline | **OPEN**, `mergedAt: null`, `mergeable: MERGEABLE`, `mergeStateStatus: BLOCKED`, `REVIEW_REQUIRED`, **0 reviews** | **Hard blocker.** This prompt: "If PR #42 has not been merged… stop before Phase 1 and report the exact blocker." Also the implementation branch therefore still lacks its audit trail |
| #38 | Saral: borrower portal and assistant redesign (final) | OPEN, MERGEABLE, REVIEW_REQUIRED, head `931985a`, base = current `main`, 62 commits ahead | Deferred per §2.3. Its **backend delta is one commit `9af3a71`, 33 additive lines**; the four contract items §2.4 lists (`Citation.excerpt`, `actual_value`, `threshold_value`, `operator`) plus `citation_excerpt()` at `EXCERPT_MAX_CHARS = 320` are the compatibility surface — reviewed in `reports/pr38-backend-delta-review.md` |
| **#41** | Complete secure loan document OCR integration | OPEN (new since the last prompt) | **No conflict.** 30 files, +3,071/−14, entirely portal-side (`apps/loan_advisory_portal/…/ocr/`, a `document_extraction` DocType, `api/ocr.py`, `www/borrower/documents.html`, `.env.example`, docs, 5 new test files). **Zero overlap** with `apps/api/src/loan_advisory/{agent,api,application,infrastructure}`, `rag/`, `data/sources/` — verified by path diff |

## 3. Runtime state — materially different from the previous baseline

Checked now, not carried over:

| Check | Result |
|---|---|
| Listeners on `8095` (agent) / `4200` (runtime) / `8011` (bureau) / `3000` (Langfuse) / `8081` (portal proxy) | **none** |
| `python` / `node` service processes | **none** |
| Docker daemon | **not running** — `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`; so the Frappe `loanrangers-*` and `loan-advisory-langfuse-*` stacks are down |
| Qdrant collection lock | **released** — copying `qdrant_v2/.lock` now succeeds (it failed with `WinError 33` when the agent held it) |

**Consequences**
- Every "VERIFIED at runtime" statement in the audit and baseline reports is now **historical**: they describe the process that existed 2026-11-02 19:17 → sometime before now. Nothing here re-proves that the agent still starts with RAG enabled or that traces still reach Langfuse.
- **Good news for Phase 2/4:** the index is no longer locked, so a rebuild does not require stopping a running service.
- **New prerequisite:** Phase 1's "behavior preserved" tests that touch Frappe, and Phase 4's index rebuild + evaluation, require Docker Desktop and the two compose stacks to be brought up first. Which services to start, and in what order, is an owner/launcher matter (`%LOCALAPPDATA%\Temp\loanportal-manualqa\run_with_env.py` is outside the repo and was not modified).
- Verification that still does **not** need the stack: all Phase 1 security tests (they can run against in-memory fakes like the existing `tests/test_agent_graph.py`, `test_bureau_agent.py`, `test_assertion_replay.py`), all corpus/register classification work, and the Phase 3 rule-to-source mapping.

## 4. Data state — verified unchanged since the audit

| Item | Value | Verified |
|---|---|---|
| `runs/policy_local/chunks.jsonl` | **1,557 chunks / 37 documents** | recomputed |
| Corpus fingerprint | `0c64cb52a32f9da18f44d8c0113f62f44824ccfa12e2c6a65f7188cd2854af99` | **equals** `index_compat.json` → index and corpus still consistent |
| `storage.sqlite` | 12,832,768 bytes, mtime **2026-10-29 20:25:03** | unchanged — nothing rebuilt or touched |
| Source files | 37 `.raw` + 37 `.txt` + `src/manifest.json` + `src/review_events.json` (`[]`) + 3 `manual/` PDFs | present |
| Committed `data/sources/policy_manifest_v2.json` | still the 2026-10-14 / 1,544-chunk snapshot | **still stale** vs the served index; Phase 2 should re-export it |
| `data/source_archive/` (Stage B artefact) | 13 files; `RBI-RBC-NBFC-2025.pdf` re-hashed = `783413a9…f111`, matching its manifest record | intact |

## 5. The decision reversal, and what it changes

The new prompt's §1 inverts the corpus strategy. Under **Bajaj-as-lender** the plan becomes:

- **Remove from active retrieval:** `HDFC-PL-ELIG` (5 chunks) and `ICICI-PL-ELIG` (13 chunks) — the only two non-Bajaj lender product-policy documents in the registry. Verified: no other bank/NBFC product-policy doc exists (`lender_id` values are `BFL`, `SYNTHETIC`, or `null` for regulators). Total removal impact: **18 of 1,557 chunks**. Competitor pages are *already* unservable under `bajaj_finance` (`rag/retrieve.py:58-61`), so this is a hardening-by-removal, not a behaviour change.
- **Retain:** 18 `BFL-*`, applicable RBI, and the historical/withdrawn RBI set restricted to `mode: historical`.
- **Isolate:** `SYN-POLICY-V1` (synthetic profile only), `SYN-INJECT-001/002` (never production).

What this invalidates and must be re-issued:

1. **`docs/audit/agent-rag-policy-cost-audit.md` §3/§5 recommends excluding all 18 BFL documents** and building a synthetic SARAL pack. That recommendation is superseded by this prompt. It is unmerged (PR #42) — cleanest fix is to add a superseding note before merge rather than delete evidence.
2. **`data/source_archive/` rationale changes.** It was built to protect RBI sources ahead of a *full* corpus deletion. Under the reversal nothing lender-side is deleted, so the archive is now just an integrity baseline for regulatory sources. It is uncommitted and harmless; keeping it is still right, and the copyright question (public repo) is unchanged.
3. **`reports/stage-abc-gate-report.md` / Stage A** stay valid — PR #38's backend delta analysis and the contract-preservation rule are decision-independent.
4. Phase 3's synthetic pack (14 documents) is **cancelled**, not implemented.

## 6. Retain-with-checks: the documents §5.A asks to keep that carry integrity problems

The prompt itself says "Do not blindly serve every retained document. Apply approval, source integrity, currency, and applicability checks." Applying that to the retention list, these need status decisions rather than deletion:

| Document | Chunks | Served today | Integrity problem (evidence) | Proposed handling |
|---|---:|---|---|---|
| `BFL-KYC-PMLA-POLICY` | 11 | **No** (`pending_review`) | Undated; `source_url` on a **staging host** `cms-assets.bajajfinancestage…`; cites 2011-era circulars; not linked from the live policies page; internal AML/PMLA document | Keep `pending_review`; do not serve. An NBFC's internal AML policy is not borrower-facing content |
| `BFL-INSIGHT-REJECTION` | 15 | **No** (`lender_education` excluded by profile) | Marketing/SEO article: "CIBIL **685**… ideal **750**", "below 685 → wait 3–6 months"; contradicts the **650** on four *served* BFL product pages; yet **gold in 16 `bajaj_v1` rows** | Business decision: is this official lender guidance? Until then it must stay unserved **and** its 16 gold rows must be marked unscoreable (§7) |
| `BFL-PL-DETAILED-TNC` | 80 | Yes | Registered 2019-06-21; the PDF's own **"updated as on ____" is blank**; served as current (`policy_register.yaml:837`) | Add `version_verified: false` or obtain the current T&C page |
| `BFL-PL-OVERVIEW` | 30 | Yes | Contains the site's own **"AI Overview… AI-powered responses may not always be accurate"** block inside chunks 0–3 — third-party AI text cited as lender policy | Re-ingest with `start_marker`/`end_marker` to exclude the AI block |
| `BFL-GRIEVANCE` | 7 | Yes | Undated page **naming real officers and their emails** (GRO/PNO); register itself warns "Named officers change; re-check before use" (`:738`) | Currency re-check before serving; consider masking individual names |
| `BFL-DL-PARTNERS` | 43 | Yes | ~12 KB is a directory of **other companies'** DLA names, addresses, grievance emails and app links | Retain (regulatory disclosure) but flag as cross-brand content; lowest answer value per chunk |
| `BFL-FAQ-REJECTION` | 2 | Yes | Marker slice taken from the **EMI Network Card / consumer-durables FAQ**, not the personal-loan section (`:609`); the raw page's "CIBIL updated by the 18th of every month" falls *outside* the markers and is unreachable | Fix the markers — this is a real extraction bug, not a policy question |
| `BFL-FPC-2026` | 33 | Yes | Same "Ver 7.1" published at **two URLs with different bytes** (`:637`); document cites the **superseded** 2018 NBFC Ombudsman scheme | Pin the registered URL + note the stale internal reference |
| `BFL-PRIVACY` | 34 | Yes | Undated; **zero** references to the DPDP Act — the corpus's only privacy authority is a lender consent page (`IN-DPDP-2023` never fetched) | Acceptable for "what does this lender do with my data"; cannot answer "what are my legal rights" |

Also retained-but-unservable by design (correct behaviour): the 9 `approved_historical` BFL/RBI documents, and `RBI-RBC-CB-2025` (389 chunks, `applies_to_entity: [bank]`) — which §5.C explicitly wants excluded from NBFC answers; it already is, but it is **25% of the index** and worth excluding from the rebuilt production index rather than filtering at query time.

## 7. Phase 3's core problem, already evidenced (no code, no assumptions)

Under "explain Bajaj Finance decisions using Bajaj documents", the deterministic engine is the mismatch:

| ZEN rule (`personal_loan_synthetic_v1.json`) | Its own label | What Bajaj documents actually say |
|---|---|---|
| `MIN_CREDIT_SCORE >= 700` | "Prototype assumption… **NOT a VaaniLabs or lender policy**" (`registry.json:13`) | **650 or higher** — repeated ×18 across `BFL-PL-OVERVIEW`, `-ELIG-DOCS`, `-SALARIED`, `-RATES-FEES` (all served) |
| `FOIR_MAX_45 <= 0.45` | prototype | no Bajaj FOIR number; guidance says "Keeping total EMIs within **50% to 60%** of net monthly income" (`BFL-PL-RATES-FEES.txt:92`) |
| `MIN_MONTHLY_INCOME >= 25000` | prototype | "**Rs. 25,001** per month based on the city"; **₹40,000** for Pune/Bangalore/Mumbai/Delhi (`BFL-PL-SALARIED.txt:1,191`) |
| `MIN_EMPLOYMENT_TENURE >= 12` | prototype | **no Bajaj document states a months figure** |
| — | not scored by ZEN | tenure **12–108 months**, amount **₹40,000–₹75 lakh**, rates **10–30.5% p.a.**, processing fee **≤4.13%**, age **21–80** — all in served BFL documents |

So today the agent explains a "Bajaj decision" using thresholds that are **not Bajaj's**, while the citable Bajaj documents disagree with the engine. This prompt forbids inventing replacements, so the honest Phase 3 output is: (a) every rule mapped as **UNRESOLVED — requires business confirmation**, (b) the synthetic prototype labelling preserved in answers until resolved, (c) the 16 `BFL-INSIGHT-REJECTION` gold rows and the 17 `bajaj_v1`/`benchmark_v1` rows whose gold is unservable under their own profile marked **not scoreable** (a benchmark↔filter contradiction). Changing ZEN thresholds is **not** something I can do without an approved rule set.

Two more mapping notes: `SYN-POLICY-V1` is the only text matching ZEN and must stay out of Bajaj answers (§5.D agrees); and `IN-DPDP-2023` remains **MISSING** (never fetched) so privacy-rights questions cannot yet cite the statute.

## 8. Blockers and what unblocks them

| # | Blocker | Type | Needed from you |
|---|---|---|---|
| B1 | **PR #42 unmerged** (`REVIEW_REQUIRED`, 0 reviews, `BLOCKED`) | Hard gate from §3 of this prompt | Approve + merge #42, **or** explicitly waive the gate and I proceed on `feat/agent-boundary-corpus-reset` as-is |
| B2 | **Lender-identity reversal is undocumented in the repo** | Decision conflict | Confirm: "Bajaj is the product lender; the SARAL/synthetic-pack plan is cancelled; the audit's BFL-exclusion recommendation is superseded." I will record it as an in-repo decision note |
| B3 | **Docker Desktop and both stacks are down** | Environment | Say whether to bring them up (and which launcher to use) before Phase 1 runtime verification and Phase 4 rebuild — or confirm Phase 1 should be validated on offline tests only |
| B4 | **ZEN thresholds are not Bajaj's** | Business policy | Approved rule set (score floor, income by city, FOIR, tenure) or explicit instruction to keep labelling them prototype |
| B5 | **Index rebuild needs a stopped-locked directory + `LOAN_POLICY_DIR`** | Already satisfied | Lock is free now; rebuild is still forbidden until Phase 2 classification is approved — this prompt's §7 wants the production index rebuilt **after** cleanup |

**Ready to execute the moment B1–B2 are answered** (B3 affects only runtime-dependent checks, B4 only Phase 3 conclusions): Phase 1 security boundaries with the eight proof tests, Phase 2 corpus reclassification to exclude `HDFC-PL-ELIG`/`ICICI-PL-ELIG` reversibly plus the register-status hardening, Phase 3 mapping table, Phase 4 evaluation plan, Phase 6 regression.

## 9. What I did not do

Did not merge or approve any PR; did not modify `main`, PR #38, PR #41 or any worktree; did not touch `.env` values (variable names only, never printed); did not delete or edit any corpus document, index, register entry, evaluation dataset, Docker volume or Langfuse object; did not rebuild or re-embed anything; made no LLM call and no bureau call; did not start Phase 1 code changes; did not invent a single threshold, date, URL or document.
