# Who built Saral

Saral was built by **Team Loan Rangers** for the VaaniLabs capstone at CBIT. This page credits each
person for the work that is in the repository. It is derived from `git log` across all branches on GitHub and from
the repository's pull requests, counted on 2026-11-04 at 16:00 IST, after the final merges into `main`. Nothing here is taken from memory or
estimated.

## Contributors

| Person | GitHub | Commits (all branches) | Pull requests opened |
|---|---|---:|---|
| Golla Narendar (project owner) | [@Narendarcodes](https://github.com/Narendarcodes) | 461 (333 excluding merges) | #1–#40, #42, #44–#50, #52–#59 (56 PRs; 52 merged on GitHub, plus #5 fast-forwarded into `main`; #53 integration test bed, #57 and #58 open) |
| Vikram Kamishetti | [@vikram-kamishetti](https://github.com/vikram-kamishetti) | 1 (`dd45a2f`, 30 files, +3,071 / −14) | #41 |
| Bharath Kumar Goud | [@BharathkumarGoud179](https://github.com/BharathkumarGoud179) | 3 (`7b648d2`, `9420290`, `dc09ea6`; +983 / −17) | #43 |
| Syed Imaaduddin | [@Itsimaady](https://github.com/Itsimaady) | 1 (`2e67fbd`, +241) | #51 (merged 2026-11-04) |

Commits by Golla Narendar appear under three author names on GitHub (`Golla Narendar`, `Narendarcodes`, and
GitHub's no-reply address for merges made in the web interface); they are counted together above.

## What each person contributed

### Vikram Kamishetti: document OCR

- **Commit `dd45a2f`** "feat(ocr): complete secure loan document OCR integration" (2026-11-03), opened as **PR #41**.
- Image and PDF OCR with Tesseract for PAN, Aadhaar, salary slips, bank statements and employment letters:
  text extraction, document classification, a field parser, field validation, confidence reporting and masking of
  sensitive numbers (`apps/loan_advisory_portal/.../ocr/`: `extractor.py`, `document_parser.py`, `validator.py`,
  `masking.py`, `pipeline.py`, `schemas.py`).
- The `Document Extraction` doctype, the OCR API for the portal, and the review-and-confirm step on the borrower
  documents page (OCR suggestions are not written into the loan application fields).
- Docker image and compose file for the OCR-enabled Frappe stack, install-script support and setup docs.
- Five test suites: extractor, masking, parsing, PDF and validation.
- How it is used: **PR #47** is built on top of his branch and keeps his commit unchanged (no squash). PR #41 was
  closed only because #47 contains it (2026-11-03). Saral keeps his Tesseract pipeline as the default OCR engine and
  his parser for every engine in the OCR comparison (`docs/saral/OCR_BAKEOFF.md`). His commit is in the
  `saral/integration` build.

### Bharath Kumar Goud: customer segmentation

- **Commits** `7b648d2` "Customer segmentation (For Better User experience)", `9420290` (lint fixes) and `dc09ea6`
  (root-level bureau accounts in the classifier, plus a graph integration test), all on 2026-11-03, in **PR #43**.
- A rule-based classifier that places an applicant in one of four segments using demographic, employment,
  financial and credit-bureau attributes (`decision_engine/segmentation/`), guidance text per segment, and the hook points in the advisory assistant's graph
  and prompts that let a segment change the explanation.
- Synthetic demo applicants and a test suite (`tests/test_customer_segmentation.py`).
- How it is used: **PR #52** starts at his head `dc09ea6` and keeps all three commits as they are. Saral uses the
  segment to choose *how* to explain (Guided, Simple, Standard or Detailed), never *what* to say, and never shows it
  to the borrower. The rule-based idea and the hook points are his. His commits are in the `saral/integration` build.
  GitHub marked #43 as merged when #52 landed on `main` (2026-11-04), since #52 contains its commits.

### Syed Imaaduddin: functional documentation

- **Commit `2e67fbd`**, **PR #51** (merged into `main` on 2026-11-04 with his commit kept): `docs/functional.md`, the functional description of the
  advisory system: its purpose, user context, inputs, capabilities, behaviours and acceptance criteria.
- How it is used: `docs/functional.md` keeps his structure and is updated to the final Saral system in #58
  (with a credit line to him), adding the problem, domain, interventions, user-journey and tech sections.

### Golla Narendar: project owner

Every other commit and PR in the repository. Grouped from the PR list:

| Area | PRs |
|---|---|
| Dataset audit and 2,560 synthetic applicant personas | #1, #2 |
| Frappe Lending + ZEN decision workflow with stored decision evidence | #3 |
| Policy register and hybrid policy search; Bajaj Finance as the public reference lender | #4, #5, #15, #16, #32 |
| The advisory assistant graph, explanations, abstention and citation accuracy | #6, #8, #9, #10, #13, #14 |
| Self-hosted voice | #7, #29 |
| Synthetic credit bureau | #17 |
| Self-hosted tracing | #18, #30 |
| QA fixes, CI and pre-commit checks | #19, #20, #21 |
| Security and privacy hardening (auth, admission control, state paths, log minimisation, fail-closed store, audit integrity, input validation, what-if privacy) | #22–#25, #27, #28, #31, #33 |
| Borrower platform on Frappe and backend baseline | #34, #35 |
| Documentation, reproducibility and audits | #11, #12, #26, #36, #37, #39, #40, #42 |
| Saral redesign of the borrower portal and assistant | #38, #59 |
| Saral golden datasets for RAG and conversations | #44 |
| Saral corpus split into Bajaj and RBI collections | #45 |
| Plain-language explanations and decision authority | #46 |
| OCR comparison (PaddleOCR vs Tesseract), fallback chain and signature screening, on Vikram's OCR | #47 |
| Frappe doctypes for all 229 data fields and the Loan Officer review desk | #48 |
| Rule catalogue v2, contracts and owner threshold decisions (ADR-0007..0011) | #49 |
| Synthetic KYC, PAN, account-aggregator bank and bureau data | #50 |
| Explanation tone from customer segmentation, on Bharath's classifier | #52 |
| Integration build used for the live end-to-end test | #53 |
| Live test seeding, synthetic KYC/AA service and decision runner | #54 |
| DeepEval RAG and conversation evaluation | #55 |
| Fixes found in the live end-to-end test, decision-engine gap fixes, intent classifier and answer model configuration | #56 |
| Optional fast intent router (off by default) | #57 |
| Final documentation, architecture drawing and build plan | #58 |

He also made every product decision recorded in `project-management/DECISION_LOG.md` and ADR-0001 to ADR-0011:
the Saral name, Bajaj Finance as the single reference NBFC, the four purpose products, salaried-only scope, ZEN as
the only decision authority, human review in the Frappe desk, the threshold approvals and the evaluation pass bars.

## Reviews

No formal pull-request reviews by people are recorded on GitHub. Golla Narendar merged the merged PRs (including #51 by Syed Imaaduddin), recorded
the fast-forward merge of #5 and an erratum on #42 in PR comments, and replied on #43 to explain how the segmentation
work was built on. Teammates' work was integrated by building on their branches with their commits kept intact
(#47 on #41, #52 on #43).
