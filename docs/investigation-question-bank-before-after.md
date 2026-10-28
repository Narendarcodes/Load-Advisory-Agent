# Investigation question bank: before / after, per section

Share of questions the project materials ANSWER, per section of the question bank (1,040 questions, 59 sections). Full rows:
`docs/investigation-question-bank.md` and `docs/investigation-question-bank.csv`.

- **Before** (run `before_c`, Oct 15, 2026): the repo as it stood before the question-bank pass — code, docs, register, eval reports,
  PR #1-#9 bodies, the handoff document and run reports — **without** the indexed public policy-source chunks and without the research
  notes added in this pass. Assessor without the code/policy evidence rules.
- **After** (run `after_d`): the current branch, adding `docs/research/xai-and-reason-codes.md`,
  `docs/research/design-decisions-in-code.md`, `docs/research/regulation-and-design-references.md`, the 1,544 indexed public
  policy-source chunks (RBI directions, lender pages) and assessor rules that accept code/config and policy-source chunks as evidence.
  Part of the gain is therefore the assessor rule change, not new project content.
- **Noise:** a replicate of the after run (`after_d2`, same materials and settings) scored ANSWERED 56.6% / ANSWERED+PARTIAL 67.7%
  vs 56.0% / 68.4%, and agreed on 71% of individual rows. Differences of one or two questions in a section are noise.

| Section | Qs | ANSWERED before | ANSWERED after | ANSWERED+PARTIAL after |
|---|---|---|---|---|
| 1. PROBLEM DEFINITION | 30 | 40% | 40% | 63% |
| 2. USER JOURNEY | 26 | 65% | 62% | 77% |
| 3. APPLICANT DATA / PROFILE | 41 | 71% | 78% | 88% |
| 4. APPLICANT COMMUNICATION / KNOWLEDGE PROFILE | 46 | 17% | 26% | 30% |
| 5. LOAN APPLICATION | 18 | 44% | 44% | 61% |
| 6. DECISION ENGINE | 26 | 81% | 77% | 81% |
| 7. REJECTION REASONS | 24 | 58% | 67% | 79% |
| 8. EVIDENCE | 19 | 47% | 53% | 79% |
| 9. LENDER POLICY | 35 | 57% | 77% | 83% |
| 10. ELIGIBILITY VS APPROVAL | 14 | 57% | 57% | 79% |
| 11. REMEDIATION / ACTION PLAN | 28 | 25% | 39% | 54% |
| 12. COUNTERFACTUAL / "WHAT-IF" QUESTIONS | 26 | 73% | 77% | 88% |
| 13. REAPPLICATION | 19 | 21% | 32% | 58% |
| 14. MULTI-TURN CONVERSATION | 19 | 42% | 53% | 79% |
| 15. APPLICANT EMOTIONAL / COMMUNICATION STATES | 13 | 23% | 8% | 23% |
| 16. PERSONALIZATION | 13 | 46% | 54% | 85% |
| 17. QUESTION INTENT / ROUTING | 14 | 64% | 50% | 71% |
| 18. OUT-OF-SCOPE QUESTIONS | 13 | 38% | 54% | 62% |
| 19. DATA CORRECTION / DISPUTES | 12 | 58% | 100% | 100% |
| 20. PRIVACY | 16 | 38% | 75% | 81% |
| 21. SECURITY / PROMPT INJECTION / ABUSE | 16 | 62% | 56% | 56% |
| 22. HUMAN HANDOFF | 15 | 40% | 60% | 67% |
| 23. AGENTIC AI | 18 | 78% | 78% | 94% |
| 24. MODEL VS CODE VS RETRIEVAL | 18 | 67% | 56% | 61% |
| 25. RAG / KNOWLEDGE REPRESENTATION | 17 | 88% | 88% | 100% |
| 26. DECISION TRACEABILITY | 14 | 64% | 64% | 79% |
| 27. EXPLANATION QUALITY | 20 | 45% | 50% | 80% |
| 28. FINANCIAL EDUCATION | 20 | 45% | 40% | 55% |
| 29. ADAPTIVE EDUCATION | 12 | 8% | 25% | 42% |
| 30. EDGE CASES — APPLICATION STATE | 14 | 57% | 57% | 79% |
| 31. EDGE CASES — POLICY | 11 | 64% | 73% | 91% |
| 32. EDGE CASES — EVIDENCE | 7 | 71% | 71% | 71% |
| 33. EDGE CASES — CONVERSATION | 16 | 31% | 44% | 56% |
| 34. EDGE CASES — COUNTERFACTUALS | 9 | 56% | 78% | 78% |
| 35. EDGE CASES — SAFETY / COMPLIANCE | 12 | 50% | 75% | 75% |
| 36. BUSINESS VALUE | 17 | 35% | 18% | 41% |
| 37. APPLICANT VALUE | 12 | 17% | 17% | 33% |
| 38. EXISTING SOLUTIONS | 21 | 38% | 33% | 48% |
| 39. EXPLAINABLE AI / XAI | 18 | 44% | 89% | 100% |
| 40. REGULATION / COMPLIANCE | 21 | 52% | 76% | 76% |
| 41. FAIRNESS / BIAS | 14 | 36% | 57% | 93% |
| 42. DATASET DESIGN | 19 | 63% | 79% | 79% |
| 43. EVALUATION DATASET | 19 | 32% | 16% | 32% |
| 44. EVALUATION METRICS | 27 | 37% | 63% | 74% |
| 45. BASELINES | 8 | 62% | 38% | 38% |
| 46. OBSERVABILITY | 16 | 50% | 56% | 75% |
| 47. SYSTEM FAILURE | 13 | 77% | 92% | 100% |
| 48. PROMPT ENGINEERING | 16 | 38% | 56% | 62% |
| 49. MODEL SELECTION | 12 | 17% | 50% | 58% |
| 50. TOOL DESIGN | 15 | 53% | 67% | 67% |
| 51. USER EXPERIENCE | 17 | 47% | 47% | 53% |
| 52. VOICE | 8 | 38% | 25% | 38% |
| 53. PRODUCT SCOPE | 8 | 62% | 62% | 88% |
| 54. PROTOTYPING | 8 | 38% | 12% | 38% |
| 55. DEPLOYMENT | 12 | 75% | 92% | 92% |
| 56. DATA SECURITY / ARCHITECTURE | 11 | 45% | 55% | 55% |
| 57. TEAM / IMPLEMENTATION | 10 | 10% | 20% | 20% |
| 58. FINAL SYSTEM BEHAVIOR | 23 | 61% | 74% | 83% |
| 59. CORE DESIGN QUESTIONS | 24 | 62% | 38% | 54% |
| **All** | 1040 | **49.1%** | **56.0%** | **68.4%** |
