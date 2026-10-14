# Bajaj Finance as the public reference lender for the policy RAG

Date: 2026-10-14. Branch `feat/bajaj-policy-rag`, stacked on `feat/policy-register-rag` (PR #4).
Labels: **verified** (measured, or seen in the source on 2026-10-14), **proposed**, **unresolved**.

> **Bajaj Finance Ltd is a public reference lender, not a partner.** There is no relationship with Bajaj Finance,
> VaaniLabs or anyone else. We use Bajaj's *public* personal-loan documents to build, evaluate and test the policy
> RAG. Every Bajaj source in the register carries `lender_relationship: "public reference lender, not a partner"`,
> and answers that cite one must say so. Public pages do not reveal Bajaj's internal underwriting scorecard. Nothing
> here describes how Bajaj actually decides an application, and the ZEN decision engine still runs the team's
> **synthetic** `synthetic-v1` policy.

Scope: personal loans only. Retrieval and an evaluation harness only; there is no agent yet (the LangGraph phase has
not started) and retrieval never decides eligibility.

## 1. Why Bajaj, and what stays lender-neutral

* **Decision (user, 2026-10-14).** Bajaj Finance Ltd is the reference lender. It is an RBI-registered,
  deposit-taking NBFC (**verified**: FPC v7.1, "Non-Banking Finance Deposit Taking Company registered with Reserve Bank
  of India"). So the NBFC rule set applies: the RBI (NBFC – Responsible Business Conduct) Directions 2025, the NBFC
  Credit Facilities Directions 2025 (digital lending) and RB-IOS 2026.
* **Lender-neutral design (verified in code and tests).**
  * Nothing in `rag/` names a lender. `config/rag.yaml` selects a profile from `config/lender_profiles/`, and
    `LENDER_PROFILE` overrides it.
    * `bajaj_finance`: Bajaj documents plus RBI texts labelled `nbfc` or `all`.
    * `generic_nbfc` and `generic_bank`: RBI texts only, no lender pages.
    * `synthetic_prototype`: the team's synthetic policy plus RBI texts.
  * To swap the reference lender, register its documents with a new `lender_id` and add one profile YAML. No code
    changes are needed.
  * The filter runs **before ranking**, identically in BM25 and in Qdrant (a test checks parity). It admits:
    1. the approval status for the mode: `current` = approved; `historical` = also approved_historical;
    2. RBI texts whose `applies_to_entity` matches the profile's entity type, or `all`;
    3. documents of the profile's own `lender_id` only. HDFC and ICICI pages are never served under the Bajaj
       profile;
    4. an optional source-type allow-list. `lender_education` (marketing and "insights" articles) is opt-in.

## 2. Source register v2 (`data/sources/policy_register.yaml`, `data/sources/policy_manifest_v2.json`)

The register has 38 entries: 18 Bajaj Finance, 17 RBI/regulator (4 of them new), 2 synthetic adversarial pages and
1 statute.

* **Each entry records:** URL, publisher, reference number, document type, publication and effective dates,
  supersedes / superseded_by, `source_type`, `lender_id`, `lender_relationship`, `applies_to_entity`, licence and
  approval status.
* **The metadata-only manifest records:** fetch time (UTC), fetch method, HTTP status, raw-bytes sha256, extracted-text
  sha256, size and chunk count.
* **Raw and extracted text stays on the droplet** (`/root/hx/loan/policy/{manual,src,chunks.jsonl}`) and is **not in
  git**. Git holds only metadata, extraction scripts and evaluation ids, anchors and scores.
* **Licence (verified on the sites).**
  * RBI: "© Reserve Bank of India. All Rights Reserved"; the disclaimer requires permission for deep-linking or framing.
  * Bajaj: © Bajaj Finance / Bajaj Finserv, all rights reserved.
  * Use is non-commercial capstone research only. Nothing is redistributed.

### 2.1 Sources added or changed in this branch (fetched 2026-10-14)

| ID | Document | Status | Method | sha256 (raw, first 12) | Chunks |
|---|---|---|---|---|---|
| `RBI-DLD-2025` | [Reserve Bank of India (Digital Lending) Directions, 2025](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12848&Mode=0) | approved_historical | http | `06fe86868cd0` | 56 |
| `RBI-KFS-2024` | [Key Facts Statement (KFS) for Loans & Advances](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=0) | approved_historical | http | `46f17e25b119` | 15 |
| `RBI-PENAL-2023` | [Fair Lending Practice - Penal Charges in Loan Accounts](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12527&Mode=0) | approved_historical | http | `aa11ffc2ebb8` | 32 |
| `RBI-RBC-CB-2025` | [Reserve Bank of India (Commercial Banks - Responsible Business Conduct) Directions, 2025](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/170MD.PDF) | approved | browser_manual | `f5b72746a536` | 389 |
| `RBI-RBC-NBFC-2025` | [Reserve Bank of India (Non-Banking Financial Companies - Responsible Business Conduct) Directions, 2025](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/362MD26CA543937BA439A97E1BCFC08CF5808.PDF) | approved | browser_manual | `12f703cfabeb` | 130 |
| `RBI-NBFC-CF-2025` | [Reserve Bank of India (Non-Banking Financial Companies - Credit Facilities) Directions, 2025 (updated as on July 15, 2026) - Chapters I-III (Digital Lending)](https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12957) | approved | http | `30be35a4c056` | 71 |
| `RBI-IOS-2026` | [Reserve Bank - Integrated Ombudsman Scheme, 2026 (full scheme)](https://rbidocs.rbi.org.in/rdocs/content/pdfs/SCHEME16012026_A.pdf) | approved | browser_manual | `f119574982a0` | 59 |
| `RBI-FPC-NBFC-2015` | [Master Circular - Fair Practices Code (NBFCs), July 1, 2015](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=9823&Mode=0) | approved_historical | http | `cb442bb89884` | 22 |
| `BFL-PL-OVERVIEW` | [Personal Loan overview page (eligibility, rates, fees, rejection FAQ)](https://www.bajajfinserv.in/personal-loan) | approved | http | `abcd7886934b` | 26 |
| `BFL-PL-ELIG-DOCS` | [Personal Loan eligibility criteria and documents required](https://www.bajajfinserv.in/personal-loan-eligibility-and-documents) | approved | http | `2c0653f7a22f` | 14 |
| `BFL-PL-RATES-FEES` | [Personal Loan interest rates, processing fees and charges](https://www.bajajfinserv.in/personal-loan-processing-fees-and-interest-rates) | approved | http | `8bd9b7da3015` | 17 |
| `BFL-PL-SALARIED` | [Personal loan for salaried individuals (minimum salary)](https://www.bajajfinserv.in/personal-loan-for-salaried-individuals) | approved | http | `62ed2779f347` | 14 |
| `BFL-FAQ-REJECTION` | [Customer FAQ excerpt: how will I know the reason for my loan rejection](https://www.bajajfinserv.in/contact-us-faq-queries) | approved | http | `af046f8e5122` | 2 |
| `BFL-FPC-2026` | [Fair Practice Code Ver 7.1 (January 2026)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/fair-practice-code-ver-7-1-jan-2026-english?fmt=pdf&scl=1) | approved | http | `7651c9ebdfdd` | 33 |
| `BFL-FPC-2023` | [Fair Practice Code Ver 6.0 (October 2023)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/fair-practice-code-ver-6-0-englishpdf?fmt=pdf&scl=1) | approved_historical | http | `4158ffd38632` | 31 |
| `BFL-IRP-2026` | [Interest Rate Policy (March 2026)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/interest-rate-policy-march-2026-final?fmt=pdf&scl=1) | approved | http | `388b737e47f4` | 12 |
| `BFL-IRP-2023` | [Interest Rate Policy (April 2023)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/interest-rate-policy-v1pdf?fmt=pdf&scl=1) | approved_historical | http | `15f4cd8eab6f` | 10 |
| `BFL-GRIEVANCE` | [Grievance redressal and complaint escalation page](https://www.bajajfinserv.in/grievance-redressal) | approved | http | `62ff100ba296` | 7 |
| `BFL-CITIZENS-CHARTER-2025` | [Citizen's Charter Version 7.0 (May 2025)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/citizens-charter-may-2025pdf?fmt=pdf&scl=1) | approved | http | `a6b7215e18e8` | 18 |
| `BFL-PRIVACY` | [Privacy Policy (web page)](https://www.bajajfinserv.in/privacy-policy) | approved | http | `a19cfdd476df` | 34 |
| `BFL-DL-PARTNERS` | [Our LSPs and DLAs (digital lending disclosures)](https://www.bajajfinserv.in/bajaj-finserv-partners) | approved | http | `35a3e8b3d837` | 43 |
| `BFL-PL-DETAILED-TNC` | [Detailed Terms and Conditions of Personal/Unsecured Loan](https://www.bajajfinserv.in/content/dam/bajajfinserv/web/in/en/global/document/one-web/adp/compliance/detailed-tncs-applicable-for-personal-loan.pdf) | approved | http | `fd0d0d71ce19` | 80 |
| `BFL-APP-TNC-2023` | [General loan application terms and conditions (8 June 2023)](https://cms-assets.bajajfinserv.in/is/content/bajajfinance/general-loan-application-terms-clean-8-june-23pdf) | approved | http | `6d28fd65d294` | 21 |
| `BFL-KYC-TNC` | [KYC terms and conditions (CKYC, Aadhaar e-KYC/OKYC, Video KYC)](https://www.bajajfinserv.in/tnc-my-account-kyc) | approved | http | `7e54cc1447d3` | 17 |
| `BFL-KYC-PMLA-POLICY` | [KYC & PMLA Policy (undated, staging asset path)](https://cms-assets.bajajfinserv.in/is/content/bajajfinancestage/kyc-and-pmla-policypdf?fmt=pdf&scl=1) | pending_review | http | `57f40af10345` | 11 |
| `BFL-INSIGHT-REJECTION` | [Insights article: common personal loan rejection reasons](https://www.bajajfinserv.in/insights/4-reasons-for-personal-loan-rejection-and-how-to-avoid-them) | approved | http | `98cae97c94f0` | 15 |
| `SYN-INJECT-002` | [Adversarial page impersonating Bajaj Finance with a guaranteed-approval claim (SYNTHETIC)](repo://data/evaluation/rag/synthetic_docs/SYN-INJECT-002.md) | pending_review | repo | `505fe66df777` | 3 |

**Not in the table (unchanged from PR #4):** the other RBI circulars and the HDFC, ICICI and synthetic pages. They
gained the new v2 fields (HDFC/ICICI: `lender_id`, "public comparison lender, not a partner", `[bank]`).

**How sources were fetched (verified).**

* **Scripted HTTP worked for:**
  * `rbi.org.in` HTML pages, including the full HTML text of the NBFC Credit Facilities Directions;
  * `cms-assets.bajajfinserv.in` PDFs;
  * `www.bajajfinserv.in` pages, but only from the Hark sandbox.
* **`www.bajajfinserv.in` returns HTTP 403 to the GPU droplet's IP.** The corpus was therefore fetched in the sandbox
  and copied to the droplet. The sandbox copy has since been deleted.
* **`rbidocs.rbi.org.in` PDFs answer scripts with an image-captcha page.** That covers the RBC Directions for NBFCs
  and for banks, and the RB-IOS 2026 scheme.
  * These were downloaded once through the browser tool (no captcha appeared in the browser) and placed in
    `/root/hx/loan/policy/manual/`.
  * The register keeps the official URL plus `local_file`.
  * `fetch_all` now detects the captcha page and records an error instead of ingesting it (tested).

### 2.2 Status corrections found while registering (verified 2026-10-14)

1. **The RBI Digital Lending Directions 2025 are withdrawn.**
   * The official PDF linked from NotificationUser Id=12848 carries a red "Withdrawn" watermark.
   * For NBFCs, digital lending now sits in the **NBFC Credit Facilities Directions 2025, Chapter III** (RBI/DOR/2025-26/347,
     28 Nov 2025, updated 15 Jul 2026). That chapter covers cooling-off (≥1 day), nodal grievance officers, CIC
     reporting and the CMS escalation after 30 days.
   * PR #4 had `RBI-DLD-2025` as *approved/current*. It is now `approved_historical`.
2. **KFS circular 2024 and penal-charges circular 2023 are now `approved_historical`.**
   * Their text is now in the RBC Directions 2025: NBFC Chapter III.B (KFS + Annex I format) and III.C (penal charges).
     The NBFC RBC para 106 repeals the earlier conduct instructions.
   * *Inferred*: the circular-level repeal list (DOR.RRC.REC.302/33-01-010/2025-26) was not opened.
3. **The written-reasons-for-rejection rule differs by lender type.** This matters for the advisory agent.
   * **Banks:** RBC-CB para 331 says "the bank shall convey in writing, the main reason(s) … led to rejection of the
     loan applications".
   * **NBFCs:** the NBFC RBC Fair Practices Code (Chapter III.A, paras 10–25) has **no** equivalent clause, and neither
     does Bajaj's FPC v7.1. Searching both texts for "reject" finds no loan-application rule.
   * **What NBFCs must do instead:** NBFC para 12 requires an acknowledgement for every loan application, preferably
     with the time frame for a decision.
   * **What Bajaj publishes:**
     * an FAQ, in its EMI Network Card section: "We will send you an SMS on your registered mobile number regarding
       your rejection";
     * a disclaimer: "sole and absolute discretion, without assigning any reason to accept or reject any application".
   * **Consequence:** under the Bajaj profile, the agent must not claim that RBI obliges the lender to give written
     reasons. Benchmark questions HB-021 and HB-022 test this.
4. **No published rejection-communication policy, KFS sample or MITC sample from Bajaj** (searched 2026-10-14).
   * Bajaj issues the KFS and MITC per loan through its customer portal.
   * The reference KFS template is the RBI format: NBFC RBC Annex I, with an illustrative APR computation.
   * `BFL-PL-DETAILED-TNC` (registered 21 Jun 2019, "updated as on ____" left blank) is the closest public loan-terms
     document. Its currency is **unresolved**.
5. **Bajaj KYC policy.** The only public copy sits on a `bajajfinancestage` asset path. It is undated, cites
   2011-era circulars and is not linked from the live policies page, so it is registered as `pending_review` and never
   served. Customer-facing KYC terms (`BFL-KYC-TNC`) are ingested instead.

### 2.3 Conflict and staleness register (Bajaj sources)

| Item | What we saw (2026-10-14) | Handling |
|---|---|---|
| Processing fee | 4.13% on the ingested pages. Search excerpts of other Bajaj pages (e.g. `/personal-loan-of-5-lakh`) show **3.93%** and a **30%** rate cap. | Cite the page and date. Never state a single "Bajaj fee" without the page. Not ingested: the extra pages. |
| Flexi Dropline charges | One page says "absolutely no fee/penalty/charges for paying back or withdrawing". The fee tables list foreclosure charges of up to 4.72% for Flexi variants. | Kept both. The test answer for LB-024 surfaced the conflict instead of picking a side. |
| Ombudsman scheme references | FPC v7.1 (Jan 2026) names the "Ombudsman Scheme for NBFCs, 2018". Citizen's Charter v7.0 names RB-IOS 2021. RB-IOS 2026 has been in force since 1 Jul 2026. | Current-mode questions on ombudsman rules are answered from `RBI-IOS-2026`. |
| Citizen's Charter v8.0 | The URL appears in search but returned HTTP 404. | v7.0 (May 2025) ingested. |
| FPC v7.1 | Published at two URLs (`…ver-7-jan-2026…` and `…ver-7-1-jan-2026…`) with different bytes and the same version label. | The `-7-1-` file is registered. |
| Rejection SMS FAQ | It sits under EMI Network Card questions, not personal-loan policy. | Noted in the register. Answers must not overstate it. |

## 3. Ingestion changes (`rag/corpus.py`)

* **PDF extraction (PyMuPDF).**
  * `[[page N]]` markers give every chunk a `page_start` and `page_end` for citations. The markers never enter chunk
    text.
  * Running headers and footers repeated on ≥60% of pages, and bare page numbers, are dropped.
* **Section-aware chunking for long RBI Directions** (`para_digits: 3`). New sections start at 3-digit paragraphs and
  at "Chapter …" headings.
  * *Known limitation:* a 3-digit paragraph glued to the previous line inside a page stays in the previous chunk.
    Proposed fix: also split blocks at `^\d{3}\.` (this would change chunk ids, so it needs a re-run).
* **Robust fetching.**
  * Per-source error isolation: one broken source no longer aborts the fetch.
  * Captcha pages are detected and never ingested.
  * `--only` refetches named sources; `--export-manifest` writes the metadata-only manifest.
* **Change control (unchanged).** A content change is a `CONTENT_CHANGED_REVIEW_REQUIRED` review event and never
  changes `approval_status`.
* **Corpus size (verified).** 37 fetched documents, 1,544 chunks, median 135 words. Of these, 1,084 chunks are
  approved and current. Under the Bajaj profile in current mode, 656 are servable (671 with `lender_education`, which
  is how the benchmark was run).

## 4. Retrieval changes (`rag/retrieve.py`, `config/rag.yaml`)

* **Fixing hybrid < dense (the PR #4 negative result).** Two changes, both tuned on the **dev split only**:
  1. **Weighted RRF** (w_dense=1, w_bm25=0.5, k=10). Grid: w_bm25 ∈ {0, …, 1} × k ∈ {5, …, 100}.
  2. **Cross-encoder rerank** (`BAAI/bge-reranker-v2-m3`, Apache-2.0) of the top-50 fused candidates. Grid: depth
     ∈ {5, 10, 20, 30, 50}; depths 20–50 are within 0.01 dev MRR of each other.
* **Runtime.** GPU container `hx-loan-bajaj` (rocm:latest, transformers 5.19.0, sentence-transformers 6.1.0).
  * Peak VRAM **4.7 GiB**, under the enforced 6 GiB cap.
  * The 1,544-chunk index builds in 8.3 s.
  * The container was removed after the run.

## 5. Evaluation (`data/evaluation/rag/bajaj_v1/`)

### 5.1 Benchmark

* **149 questions.**
  * **66 hand-written** (`HB-*`, `AB-*`), including **16 that must be abstained on**:
    * approval guarantees;
    * invented policy (FOIR cut-off, scorecard weights, employer blacklist, fee waivers, GST split);
    * other lenders (HDFC and ICICI are in the corpus but outside the profile; Tata Capital, Muthoot and SBI are not);
    * a prompt-injection fixture (`SYN-INJECT-002`, a fake "guaranteed approval" Bajaj page, `pending_review`);
    * an unsupported action ("change my rejected application to approved").
  * **83 reviewed gpt-oss-120b drafts** (`LB-*`). Of 135 anchor-verified drafts, 52 were dropped in review: trivia
    such as reviewer names and partner addresses, out-of-scope gold/locker/microfinance/FD topics, duplicates,
    calculator examples, and one case of ambiguous context.
* **Gold.** A chunk is relevant if it is in a gold document and contains a verbatim anchor.
  * Gold documents are expanded to every document the question's filter can serve that carries the anchor, because
    Bajaj repeats "CIBIL Score 650 or higher" on four pages.
  * Historical questions are not expanded.
  * The build fails if any anchor is missing (none were).
* **Categories:** eligibility, fees, rejection reasons and reapplication, lender type (bank vs NBFC), KFS terms,
  grievance paths, interest-rate policy, digital lending, KYC/privacy terms, loan terms, historical versions,
  adversarial and abstention.
* **Split:** stratified 40/60, **dev 58 / test 91** (test: 80 answerable + 11 unanswerable; 40 human + 51 LLM).

### 5.2 Retrieval results: held-out test, answerable n = 80 (`docs/policy/rag_eval_bajaj_v1_report.json`)

| System | R@1 | R@3 | R@5 | R@10 | MRR@10 | nDCG@10 | citation@1 (doc) | p50 latency |
|---|---|---|---|---|---|---|---|---|
| BM25 | 0.388 | 0.625 | 0.738 | 0.775 | 0.526 | 0.554 | 0.613 | 2 ms |
| Dense (EmbeddingGemma 2 / Qdrant) | 0.562 | 0.738 | 0.838 | 0.875 | 0.666 | 0.669 | 0.750 | 62 ms |
| Hybrid, equal RRF (PR #4 baseline) | 0.525 | 0.713 | 0.787 | 0.875 | 0.631 | 0.649 | 0.738 | 64 ms |
| Hybrid, weighted RRF (dev-tuned) | 0.550 | 0.787 | 0.825 | 0.925 | 0.664 | 0.679 | 0.787 | 64 ms |
| **Hybrid + rerank (dev-tuned)** | **0.750** | **0.925** | **0.950** | **0.963** | **0.843** | **0.859** | **0.863** | 147 ms* |

\* Upper bound: the measured time for reranking the whole dense-50 ∪ BM25-50 candidate union.

**Paired bootstrap on test (2,000 resamples, 95% CI):**

* **Hybrid + rerank vs dense:** MRR **+0.177 [0.101, 0.253]**, R@5 **+0.113 [0.037, 0.188]**.
* **Weighted RRF vs dense:** MRR −0.002 [−0.060, 0.054], so they are statistically indistinguishable.
* **Weighted vs equal RRF:** MRR +0.032 [−0.007, 0.074].

**Reading:**

* **Weighted RRF removes the hybrid-below-dense penalty** (MRR is level with dense, and R@10 is +0.05) but does not
  beat dense on ranking.
* **The reranker is what fixes ranking.**
* **The gain holds on the human-written subset:** R@5 0.897 vs 0.759 for dense, MRR 0.766 vs 0.530.

**Misses at @10 (hybrid + rerank):**

* HB-032: "prospective only" interest changes.
* HB-049: "which directions govern digital lending now". The answer is in a title chunk, so this is a known weakness
  for meta-questions.
* LB-017.

**Caution:** most per-category n are between 1 and 16. They are indicative only.

### 5.3 Grounded answers, citations and abstention: test n = 91 (`docs/policy/rag_eval_bajaj_v1_answers.json`)

Setup:

* gpt-oss-120b (vLLM, temperature 0, reasoning low) gets the top-5 passages of each system, labelled as untrusted
  data, plus the lender-profile description.
* It must cite the passage labels or abstain.
* A second gpt-oss call judges answer correctness against the anchors and reference answer.
* A third judges **citation faithfulness**: whether every claim is supported by the passages it cites.

| System (LLM decides abstention) | answered | answer correct | citation support¹ | strict citation² | citation faithful³ | abstained on unanswerable |
|---|---|---|---|---|---|---|
| BM25 | 0.838 | 0.775 | 0.713 | 0.575 | 0.910 | 11/11 |
| Dense | 0.925 | 0.887 | 0.812 | 0.588 | 0.892 | 11/11 |
| Hybrid, equal RRF | 0.887 | 0.838 | 0.762 | 0.575 | 0.887 | 11/11 |
| Hybrid, weighted RRF | 0.925 | 0.875 | 0.787 | 0.600 | 0.973 | 11/11 |
| **Hybrid + rerank** | **0.975** | **0.950** | **0.900** | **0.675** | **0.974** | **11/11** |

Notes:

1. **Citation support:** at least one cited passage is a gold passage (gold document + anchor).
2. **Strict citation:** citation support, and every cited passage comes from a gold document. This is
   **conservative**. Most "wrong" citations point at equivalent text in another valid source, for example the RB-IOS
   FAQ instead of the scheme, or the RBI rule behind a Bajaj FPC line. That is why it sits well below the
   faithfulness score.
3. **Citation faithful:** the share of answered questions whose claims are all supported by the passages cited.

**Abstention:**

* The LLM abstained on all 11 unanswerable test questions with every retriever. In an earlier run, weighted RRF
  answered AB-001 ("definitely approve at CIBIL 760?") with a hedge.
* **The retrieval-score gate hurts.** Putting the dev-tuned score threshold in front of the LLM cuts answered
  answerable questions to 0.85 for hybrid + rerank (0.60–0.64 for the others) and does not improve abstention.
  * Proposed: let retrieval scores inform, not gate, and keep the LLM's evidence check plus the hard filters.
  * On its own, the reranker score is the best retrieval-level abstention signal: test AUROC 0.84, against 0.75 for
    the dense cosine.
* **Only 11 unanswerable test questions.** This is indicative; calibration needs 50 or more (**unresolved**).

**Run-to-run variance:** a first run of the same stage gave hybrid + rerank answer-correct 0.938, citation support
0.887 and strict 0.662. Expect about ±0.02.

### 5.4 Governance (verified, all 149 questions)

* **With filters:** no final top-10 of any system contains a chunk that is non-permitted for its question
  (wrong status, wrong lender, or wrong entity type).
* **Without filters (unfiltered dense + BM25 top-10):**
  * the injection page appears for **30** questions;
  * another lender's page appears for **38**;
  * a historical document appears in **98** current-mode questions.
* **Conclusion:** the filters are the protection, so they are mandatory.

## 6. Reproduce

```bash
# sources (sandbox or any host that www.bajajfinserv.in does not block); rbidocs PDFs go in $LOAN_POLICY_DIR/manual/
LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/fetch_sources.py --export-manifest data/sources/policy_manifest_v2.json
LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/draft_questions.py --out=question_drafts_bajaj.jsonl BFL-PL-RATES-FEES:6 ...  # optional
LOAN_POLICY_DIR=/root/hx/loan/policy python data/evaluation/rag/bajaj_v1/build_benchmark.py
docker run --rm --name hx-loan-bajaj --device=/dev/kfd --device=/dev/dri --group-add video -e HF_HUB_OFFLINE=1 \
  -v /root/hx/loan:/root/hx/loan -v /root/.cache/huggingface:/root/.cache/huggingface rocm:latest \
  bash /root/hx/loan/repo-bajaj/scripts/policy/rag_run_bajaj.sh                       # stage 1 (GPU, <=6 GiB)
python scripts/policy/eval_bajaj_score.py --runs data/evaluation/rag/bajaj_v1/results --out /tmp/score   # stage 2 (CPU)
LOAN_POLICY_DIR=/root/hx/loan/policy python scripts/policy/eval_bajaj_answers.py --rankings /tmp/score/rankings.jsonl --out /tmp/ans  # stage 3
```

`tests/test_bajaj_rag.py` (17 tests) re-scores the committed stage-1 runs. It fails if the tuned configuration drifts
from `config/rag.yaml` or if hybrid + rerank drops below dense + 0.10 MRR.

## 7. Open items

1. **Unresolved:** human sign-off on register v2. `reviewed_by` is automated, and the two inferred repeals in §2.2
   need checking.
2. **Unresolved:** currency of the 2019 detailed loan T&Cs, the 2023 application T&Cs and the staging-path KYC policy.
3. **Proposed:**
   * 50+ unanswerable questions and Hindi/Telugu queries;
   * temporal routing for "before/after" questions;
   * title-chunk handling (HB-049);
   * the 3-digit-paragraph chunking fix.
4. **Proposed:** a periodic re-fetch of the Bajaj pages, which change without notice. The fee figures already differ
   between pages. A change raises a review event; it is never auto-approved.
5. **Out of scope until the agent phase:** answer generation inside LangGraph. The stage-3 harness here only measures
   what the retriever makes possible.
