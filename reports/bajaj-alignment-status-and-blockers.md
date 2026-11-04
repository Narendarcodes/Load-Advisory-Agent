# Bajaj Alignment — Decision Record, Marker Fix, Benchmark Reachability, and Remaining Blockers

> **Snapshot.** State in this report (branches, PR status, running services) was verified on the date at the top of the file and is not maintained afterwards. For current PR/branch state use `git status`, `gh pr view`, and `reports/bajaj-alignment-status-and-blockers.md`.

Date: 2026-11-03 (IST).
Branch: `feat/agent-boundary-corpus-reset`, base `main` @ `31cbe19`.
**Phase 1 (security boundaries) has NOT been started** — its gate, PR #42, is still unmerged (§6).

This report covers exactly what you authorised in your last message, plus the rule-to-source mapping
Phase 3 requires. It also corrects a claim I made earlier, which turned out to be wrong.

---

## 1. Commits and test evidence

| Commit | Subject | Files |
|---|---|---|
| `2408d7e` | docs(policy): record Bajaj Finance as the product lender and supersede the synthetic-lender plan | `docs/policy/bajaj_reference_lender.md` |
| `9afb5fc` | fix(corpus): narrow BFL-FAQ-REJECTION to the rejection answer it was registered for | `data/sources/policy_register.yaml` |
| `8044d42` | test(eval): state bajaj_v1 gold reachability under the production profile, and stop the hygiene check hiding it | `benchmark.jsonl`, `build_benchmark.py`, `tests/test_bajaj_rag.py` |

| Command | Result |
|---|---|
| `.venv-embed/Scripts/python.exe -m pytest tests -q` (run directly) | **685 passed, 15 skipped** — identical to the pre-change baseline at `31cbe19` |
| `.venv-embed/Scripts/python.exe -m pytest tests/test_bajaj_rag.py tests/test_rag_offline.py tests/test_rag_rebuild_safety.py -q` | 41 passed → then 1 failed (the new assertion caught my own error) → after correction **17 passed** in `test_bajaj_rag.py` |
| `.venv-embed/Scripts/python.exe -m ruff check data/evaluation/rag/bajaj_v1/build_benchmark.py tests/test_bajaj_rag.py` | All checks passed |
| Pre-commit hook (whitespace → ruff → full pytest) | Ran on **all three** commits: 685 passed / 15 skipped each time. **Never bypassed.** One commit was initially rejected for a blank line at EOF in the audit file and was fixed, not skipped |
| Environmental limitation | The 15 skips are pre-existing conditional skips (`pytest.importorskip`, `LANGFUSE_LIVE`), unchanged by this work. No test here needed Docker, network, an LLM call or the GPU |

---

## 2. Decision record (B2, confirmed)

Written into `docs/policy/bajaj_reference_lender.md` as a dated section above the original text, which is
**kept unchanged as history**. It records:

- Bajaj Finance product documents are this product's lender-policy source; they are not competitor material
  and must not be excluded from retrieval.
- `SARAL_DEMO`, the "Demo Sample Lender (Synthetic)" label, the 14-document synthetic pack and the
  delete-corpus-first sequence are withdrawn.
- Corpus change is limited to removing competing-lender product documents from active retrieval
  (`HDFC-PL-ELIG`, `ICICI-PL-ELIG`) via reversible archive + clean rebuilt index.
- Unchanged: synthetic/adversarial isolation, RBI applicability rules, bank-only sources staying inapplicable.
- **Two truthfulness constraints that survive the reversal**, which is the part I did not want to lose:
  1. "Our product's lender" is a statement of scope, **not** of authorisation. There is still no relationship
     with Bajaj Finance, so `lender_relationship: "public reference lender, not a partner"` stays in the register
     and in citations until you state otherwise in writing. Rewriting it to imply partnership, endorsement or an
     offer would misrepresent the position to a borrower. This also matters for PR #38, whose UI brand is
     "Saral": the platform brand must never read as the lending institution.
  2. ZEN still runs the prototype policy. Its thresholds are not Bajaj's, and §4 records that as unresolved
     business policy rather than quietly reconciling the two.

No file in PR #38 or PR #41 was touched; both remain OPEN and untouched.

## 3. BFL-FAQ-REJECTION marker bug — investigated and fixed (not re-ingested)

**Root cause.** The register's `start_marker` was `"What are the eligibility criteria to buy products at no-cost EMIs"`,
an EMI Network Card / consumer-durables question adjacent to the rejection question. So the document titled
"how will I know the reason for my loan rejection" ingested starting three questions earlier, and the rejection
answer landed in chunk 2 of 2.

**Verified against the stored raw bytes** (`runs/policy_local/src/BFL-FAQ-REJECTION.raw`, 725,475 B → extracted
111,036 chars), using `extract()` + the same slicing `rag/corpus.py:136-139` applies:

| Marker pair | Chars | Chunks | Opens with |
|---|---:|---:|---|
| Before | 1,356 | 2 | EMI-card eligibility text |
| **After (registered)** | **607** | **1** | the rejection question + the SMS statement, then the credit-policy factor sentence |

New markers: `How will I know the reason for my loan rejection?` → `How will I find out the due date of my EMI?`.

**Two findings worth more than the fix itself:**

1. **`end_marker` is sliced with `rindex`, so anchor uniqueness is mandatory.** A candidate end marker
   ("Why has my EMI Network Card been blocked?") appears **twice** on the page; using it produced 16,130 chars
   instead of 607. Both chosen anchors occur exactly once — verified, and recorded in the register note so a
   future editor cannot re-introduce a duplicated anchor unknowingly.
2. **A marker that no longer exists in the page is silently ignored.** `_get()` guards with `if marker in text`,
   so a Bajaj page redesign would make the ingestion capture the **entire 111k-char FAQ** rather than fail. I did
   not change ingestion code (out of scope, and it would alter Phase 2 behaviour); it is registered as a required
   guard and noted in the register entry.

**Not done, deliberately:** the document was **not** re-ingested. The active `chunks.jsonl` and index still carry
the 2-chunk version, so no corpus artefact, hash or index changed in this phase. The register note records the
expected 1-chunk / 607-char output so the Phase 2 rebuild can check itself against it.

## 4. Rule-to-source mapping (Phase 3) — no thresholds invented

ZEN policy `personal_loan_synthetic_v1.json`, self-labelled in `policies/registry.json:13` as
*"Prototype assumption … NOT a VaaniLabs or lender policy"*.

| Engine rule | Engine value | Authoritative Bajaj source for *that number* | What the served Bajaj documents actually say | Status |
|---|---|---|---|---|
| `MIN_CREDIT_SCORE` | **700** | **none** | `BFL-PL-OVERVIEW` / `-ELIG-DOCS` / `-SALARIED` / `-RATES-FEES`: "CIBIL Score: **650** or higher" (18 occurrences, all four servable). `BFL-INSIGHT-REJECTION`: **685** minimum / **750** ideal (unservable, `lender_education`) | **UNRESOLVED — business confirmation required.** The engine number is not Bajaj's published criterion |
| `FOIR_MAX_45` | **0.45** | **none** | `BFL-PL-RATES-FEES.txt:92`: "Keeping total EMIs within **50% to 60%** of net monthly income supports a better offer" (guidance, not a cutoff); `BFL-PL-OVERVIEW:433`: "High FOIR (as per lender criteria)" — no figure | **UNRESOLVED.** No Bajaj document states a FOIR cutoff |
| `MIN_MONTHLY_INCOME` | **₹25,000** | **none** | `BFL-PL-SALARIED.txt:1,55`: "minimum salary eligibility is **Rs. 25,001** per month based on the city"; `:191`: **₹40,000** for Pune/Bangalore/Mumbai/Delhi | **UNRESOLVED + structurally unsupported.** The engine evaluates one flat number; the lender publishes a city-dependent one |
| `MIN_EMPLOYMENT_TENURE` | **12 months** | **none** | **No Bajaj document states an employment-tenure figure at all.** (HDFC 24/12 months, ICICI 24 months — both now excluded as competitor documents) | **UNRESOLVED.** Nothing to map to; competitor numbers must not be borrowed |
| — (not scored) | — | — | tenure **12–108 months** (`BFL-PL-ELIG-DOCS:171`, `-OVERVIEW:52`), amount **₹40,000–₹75 lakh**, rates **10–30.5% p.a.**, processing fee **≤4.13%**, age **21–80** | **Document-only.** ZEN never scores amount or tenure; the validator admits up to 360 months, which every Bajaj page rejects |
| Rejection reasons | no rule | — | `BFL-FAQ-REJECTION` (SMS, sole discretion) + `BFL-APP-TNC-2023` ("without assigning any reason"); the *written-reasons duty* exists only in bank-side RBI text | **Asymmetry, correctly encoded in prompts** (`prompts.py:100`) — not a threshold conflict |
| Reapplication window | no rule | — | **no Bajaj document states any waiting period**; only "fix it and then reapply" | **Neither side** — must never be answered with a number |

Rules for the explanation layer that follow from this table, already implied by the existing guards and worth
keeping: the agent must not present 700/0.45/₹25,000/12 as *Bajaj's* criteria; the synthetic label stays; and no
threshold may be back-filled from marketing pages or competitor documents. **I have not changed any ZEN threshold,
any prompt, or any register value** — producing the approved rule set is your decision (blocker R3).

## 5. Benchmark reachability marking — and a correction to what I told you earlier

**What I claimed before, and what is actually true.** The master audit and my last two messages said 16–17
`bajaj_v1` rows "score as failures by design" because their gold document can never be served. **That was wrong.**
Recomputing per row against the production filter shows all 16 rows still have **three reachable gold documents
each**; `BFL-INSIGHT-REJECTION` is only an additional, unreachable member of a gold set that the builder *expands*
to every visible document containing the anchor. Those rows are scoreable. What they suffer is **capped achievable
citation precision** — a system that correctly cites three reachable gold docs is still marked as missing a fourth
it can never see. The correct fix is to record reachability, not to disable the rows. My first implementation did
exactly the wrong thing and **the new test caught it** (`AssertionError: HB-001 … assert False == True`), which is
the clearest possible evidence the assertion was worth adding.

**Changes made.**
- `benchmark.jsonl`: three new fields on **every** row — `scoreable` (all 149 true), `gold_unreachable_docs`
  (16 rows list `BFL-INSIGHT-REJECTION`), `scoreability_note` (explains the cap, names the mechanism and the date).
  **No row was removed or edited**: with the three new keys stripped, the file is byte-identical to the committed
  version (verified by diffing each row against `git show HEAD:…`), and key-order is preserved with a single
  17-key schema across all 149 rows (zero schema variance).
- `build_benchmark.py`: computes the same fields at build time from the **production** filter, and `stats.json`
  would gain `unscoreable` + `gold_unreachable_rows` on a rebuild.
- `tests/test_bajaj_rag.py`: the hygiene check now evaluates reachability with the filter production actually runs.
  It previously used `include_education=True` — the *same* exemption the builder used to create the gold — so it was
  validating the benchmark against a profile that `agent/runtime.py` never constructs, despite its own comment
  saying "gold must be servable under the question's own filter". **That is why this survived CI**, and the new
  assertions (`scoreable` present, matches reachability, `gold_unreachable_docs` exact, note present iff non-empty)
  close it.
- `build_benchmark.py` also gained explicit `encoding="utf-8"` on its four IO calls: with the platform default it
  raised `UnicodeDecodeError` reading the corpus on Windows, and would have mangled Devanagari/Telugu text writing
  the benchmark. The script was not runnable on this machine before that.

**New, more serious finding from trying to prove this.** Rebuilding `bajaj_v1` against the **current** corpus
fails gold checks and aborts before writing anything, on **5 rows** — `LB-002, LB-003, LB-008, LB-022, LB-026`
(all `origin: llm_draft_reviewed`), e.g. anchors quoting "**Rs. 55 lakh**" where the ingested page now says
**₹75 lakh**. So `bajaj_v1` is **not reproducible** against today's corpus, and its anchors were last validated
against the 2026-10-14 / 1,544-chunk build. Marking reachability does not fix that and this commit does not
pretend to. **Phase 4's "run the existing golden-set evaluation" must be preceded by anchor revalidation** (blocker R2).

## 6. Runtime state and the tests that remain pending

Checked now rather than assumed: Docker Desktop is up and the `loan-advisory-langfuse-*` + `loanrangers-*`
containers are healthy, but **nothing is listening on 8095 / 4200 / 8011 / 8081** — the agent, CopilotKit runtime,
bureau service and portal proxy are **not running**, and `qdrant_v2/.lock` copies cleanly, confirming no process
holds the index. Per your instruction I did not start them or touch any external service.

Corpus and index verified unchanged and consistent: 1,557 chunks / 37 documents, recomputed fingerprint equals
`index_compat.json`, `storage.sqlite` mtime still 2026-10-29 20:25:03. The Stage B source archive is intact
(13 files; `RBI-RBC-NBFC-2025.pdf` re-hashes to its recorded `783413a9…f111`).

**Deferred because they need a running service (not because they are optional):**
- Confirming the marker fix reaches answers: the **active index still holds the old 2-chunk FAQ**, so retrieval
  quality of the corrected excerpt can only be measured after the Phase 2 rebuild.
- Any Phase 1 test that requires live Frappe (ownership enforcement against the real `Loan Application` doc,
  `FrappeUnavailable` behaviour, evidence retrieval) — the offline equivalents exist as fakes and will run.
- Langfuse-side verification that retrieval spans and `search_approved_policy` observations still land after the
  boundary changes, and the corpus-version/config-hash run ledger.
- Latency/throughput regression (the `_RETRIEVER_LOCK` ceiling) — Phase 4 work, needs the GPU and the process up.

## 7. Remaining blockers, exactly

| # | Blocker | Status | Blocking |
|---|---|---|---|
| **R1** | **PR #42 unmerged** — `OPEN`, `mergedAt: null`, `REVIEW_REQUIRED`, 0 reviews, `mergeStateStatus: BLOCKED`; ruleset needs 1 approving review | **Open, and you said do not waive it** | **Phase 1 entirely.** Nothing in §4–§7 of the master prompt (bureau removal, read-only adapter, ZEN non-persistence, write paths, security tests) has been started |
| **R2** | `bajaj_v1` anchors fail against the current corpus (5 rows abort the build) | **New finding, unresolved** | Phase 4 step "run the existing golden-set evaluation"; needs anchor revalidation + human review before any before/after retrieval number is trustworthy |
| **R3** | ZEN thresholds are prototype assumptions, not Bajaj criteria (700 vs 650; 0.45 vs 50–60%; ₹25,000 vs ₹25,001/₹40,000 by city; 12 months vs no documented figure) | **Unresolved by design — needs your approved rule set** | Phase 3 sign-off and any decision that would let the agent state a Bajaj threshold as fact |
| **R4** | Competitor removal not performed | Deliberately deferred | `HDFC-PL-ELIG` (5) and `ICICI-PL-ELIG` (13) are still indexed. Phase 2 also needs the register's non-ingestible statuses (`archived_not_indexed`, `quarantined_test_fixture`) before removal sticks — a status edit alone cannot un-ingest, because `INGESTIBLE` still admits `approved_historical`/`pending_review` |
| **R5** | `BFL-KYC-PMLA-POLICY` retained-but-unserved: undated, `pending_review`, hosted on a **staging** AEM path, cites 2011-era circulars | Needs your review | Whether it stays `pending_review` (currently correct) or is `rejected`; either way it must not be served from a staging URL |
| **R6** | Two BFL documents still `approved` while carrying provenance defects | Needs review before the rebuild | `BFL-PL-DETAILED-TNC` (80 chunks; its own "updated as on \_\_\_\_" is blank), `BFL-PL-OVERVIEW` (embeds the site's "AI Overview … may not always be accurate" block inside indexed chunks) |
| **R7** | `data/source_archive/` (13 files, ~1.5 MB) is **untracked**: whether RBI publications belong in a **public** repo is an owner decision | Awaiting decision | Nothing in Phase 1; matters before Phase 2 deletion, and the off-machine copy is still the only extra protection for the two browser-fetched PDFs |
| **R8** | `IN-DPDP-2023` still **MISSING** (never fetched, legal review pending) | Unresolved | Any privacy answer that should cite the statute rather than a lender consent page |
| **R9** | Erratum owed in the audit report | The published §4.10/§7 text (16–17 rows "unscoreable") is wrong as described in §5 above | PR #42 content — recommend adding the erratum before it merges; I have not edited that branch |
| **R10** | Committed `data/sources/policy_manifest_v2.json` is still the 1,544-chunk 2026-10-14 snapshot while the served index is 1,557 | Unresolved | Any claim that the auditable provenance record describes the current index; re-export belongs to Phase 2 |

## 8. What I did not do

Did not start Phase 1 or touch agent security code, prompts, ZEN policy, thresholds or configuration; did not
merge/approve/close/edit PR #42, #38 or #41; did not delete or re-ingest any corpus document; did not rebuild,
migrate, clear or re-embed the index; did not start Docker or any external service; made no LLM call and no bureau
call; did not invent a threshold, date, URL or document; did not modify `.env` values (variable names only); and
did not bypass a single pre-commit check.
