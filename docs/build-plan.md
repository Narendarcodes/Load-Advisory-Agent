# Saral build plan: what was done, when, and what is left

Dates and owners come from `git log` across all branches on GitHub and from the repository's pull requests (merge
times in IST, UTC+05:30). Only people are listed as owners. Who built what in detail: [../BUILD.md](../BUILD.md).
Architecture: [architecture.drawio.svg](architecture.drawio.svg) (opens in draw.io) and
[saral/ARCHITECTURE.md](saral/ARCHITECTURE.md).

## Phases done

| # | Phase | Dates | PRs | Owner(s) |
|---|---|---|---|---|
| 1 | Dataset audit (public proxies and gaps) and 2,560 synthetic applicant personas | 2026-10-08 to 10-14, merged 10-24 | #1, #2 | Golla Narendar |
| 2 | Conventional workflow: Frappe Lending + ZEN decisions with stored decision evidence | 10-14, merged 10-24 | #3 | Golla Narendar |
| 3 | Policy register and hybrid policy search; Bajaj Finance as the public reference lender | 10-14 to 10-25 | #4, #5, #15, #16, #32 | Golla Narendar |
| 4 | LangGraph advisory agent, explanations, abstention, citation accuracy | 10-14 to 10-25 | #6, #8, #9, #10, #13, #14 | Golla Narendar |
| 5 | Self-hosted voice on the same graph | 10-14 to 10-28 | #7, #29 | Golla Narendar |
| 6 | Synthetic credit bureau, self-hosted tracing, QA fixes, CI and pre-commit checks | 10-25 to 10-26 | #17 to #21, #30 | Golla Narendar |
| 7 | Security and privacy hardening | 10-28 | #22 to #25, #27, #28, #31, #33 | Golla Narendar |
| 8 | Borrower platform on Frappe, reproducible install, audits | 10-30 to 11-03 | #34 to #37, #39, #40, #42 | Golla Narendar |
| 9 | Saral product definition: name, four purpose products, rule catalogue v2, owner threshold decisions (ADR-0007 to ADR-0011) | 11-02 to 11-04 | #49 | Golla Narendar |
| 10 | Saral corpus split into Bajaj and RBI collections; golden datasets for RAG and conversations | 11-03, merged 11-04 | #45, #44 | Golla Narendar |
| 11 | Document OCR (Tesseract pipeline, parser, masking, review step) | 11-03 | #41 (carried in #47) | Vikram Kamishetti |
| 12 | OCR comparison, PaddleOCR default with Tesseract fallback, signature screening | 11-03 to 11-04 | #47 | Golla Narendar, on Vikram Kamishetti's OCR |
| 13 | Rule-based customer segmentation | 11-03 | #43 (carried in #52) | Bharath Kumar Goud |
| 14 | Explanation tone from segmentation | 11-03, merged 11-04 | #52 | Golla Narendar, on Bharath Kumar Goud's classifier |
| 15 | Frappe doctypes for all 229 data fields and the Loan Officer review desk; synthetic KYC / PAN / AA bank / bureau data | 11-03, merged 11-04 | #48, #50 | Golla Narendar |
| 16 | Saral borrower portal and assistant redesign | 11-02, merged 11-04 | #38 | Golla Narendar |
| 17 | Live end-to-end test bed: integration build, seeder, synthetic KYC/AA service, decision runner; GUI run (59 cases) | 11-03 to 11-04 | #53 (test bed, not merged), #54 | Golla Narendar |
| 18 | Fixes from the live test; decision-engine gap fixes; agent fixes (route-first decision fetch, new intents, clarify, what-if cap); intent classifier and answer model switch | 11-03 to 11-04, merged 11-04 | #56 | Golla Narendar |
| 19 | Plain-language prompts and decision authority | 11-03 to 11-04 | #46 | Golla Narendar |
| 20 | DeepEval RAG and agent evaluation: dev runs and one held-out agent run | 11-03 to 11-04 | #55 | Golla Narendar |
| 21 | Functional documentation | 11-04 | #51 (open) | Syed Imaaduddin |
| 22 | Optional fast intent router (Laya), flag off | 11-04 | #57 (open) | Golla Narendar |
| 23 | Final documentation | 11-04 | #58 | Golla Narendar |

## What is left

| Item | Why it is open | Owner |
|---|---|---|
| Agent-in-the-frontend live cases (A5) | Run on 2026-11-04 afternoon; totals go into the README when it finishes | Golla Narendar |
| Agent eval bars | Every agent bar fails on dev and held-out (README, Evaluation results) | Golla Narendar |
| RAG held-out run | Not run (owner decision 2026-11-04 14:49 IST) | Golla Narendar |
| Human review of both golden sets and of the judge | Both sets were drafted with an LLM; judge-human agreement is not measured | Team |
| Counter-offer accept action in the portal and desk | Blocked one live case | Golla Narendar |
| Multi-hop retrieval (recall 0.657 on multi-hop items) | Weakest RAG area | Golla Narendar |
| Laya router: fine-tune, re-benchmark, wire into the graph | Fine-tuned hybrid missed its +2-point gate (84.3% vs 82.9%) | Golla Narendar |
| Hosted deployment (Azure VM) | Submission runs on a laptop behind a tunnel | Golla Narendar |
| Merge #51 (functional documentation) | Open PR | Syed Imaaduddin |

Full limitations list: [../project-management/AGENT_LIMITATIONS.md](../project-management/AGENT_LIMITATIONS.md).
