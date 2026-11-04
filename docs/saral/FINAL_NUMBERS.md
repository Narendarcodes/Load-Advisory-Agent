# Final numbers still to fill (2026-11-04)

The final docs use `{{NAME}}` placeholders where a run finishing later today supplies the number. Fill each from the
source named here, keep its label (automated / GUI/live / blocked), then delete this file or mark every row done.
Check that no `{{` is left: `grep -rn "{{" README.md BUILD.md project-management/AGENT_LIMITATIONS.md docs/saral/`.

| Placeholder | What goes there | Source | Label | Used in |
|---|---|---|---|---|
| `{{AGENT_EVAL_RESULTS}}` | Agent dev eval re-run after the agent fixes: leak turns /158, RoleAdherence, tool correctness (exact and DeepEval), pass/fail per bar | `docs/saral/AGENT_EVAL.md` re-run (PR #55) | automated | README, AGENT_LIMITATIONS |
| `{{AGENT_HELDOUT}}`, `{{AGENT_HELDOUT_SOURCE}}` | Held-out run of the 11 Golden B conversations, or "not run" with the reason | agent eval report | automated / blocked | README, AGENT_LIMITATIONS |
| `{{RAG_HELDOUT}}`, `{{RAG_HELDOUT_SOURCE}}` | Held-out run of the 49 RAG items: Faithfulness, AnswerRelevancy, ContextualRecall, shown leaks; or "not run" with the reason | DEEPEVAL_BASELINE (next §) | automated / blocked | README, AGENT_LIMITATIONS |
| `{{CLARIFY_RESULT}}` | Vague questions answered with a clarifying question, x/11 (was 6/11) | RAG or agent re-run | automated | AGENT_LIMITATIONS |
| `{{A5_TOTALS}}`, `{{A5_SOURCE}}` | Agent-in-the-frontend live cases (64): GUI/live pass / fail / blocked, leaks found | live E2E report, A5 section | GUI/live or blocked | README, AGENT_LIMITATIONS |
| `{{ZEN_AGREEMENT}}` | 200-applicant re-decide after the ZEN gap fixes: x/200 (was 174/200, 87.0%), and the effective figure if design choices are accepted | REDECIDE report after the fixes | automated (live API) | README, AGENT_LIMITATIONS |
| `{{ZEN_GAP_STATUS}}` | D-11..D-15 and the six uncompiled rules (PL-074, 075, 079, 082, 099, 127): fixed / open, with the commit or PR | decision-engine fix PR | — | README, ARCHITECTURE, AGENT_LIMITATIONS |
| `{{AGENT_FIX_STATUS}}` | Route-first decision fetch with caching, new intents, clarify, what-if cap, new spans: landed / open, with the PR | agent-fix PR | — | ARCHITECTURE, AGENT_LIMITATIONS |
| `{{OCR_BENCH}}` | Final OCR figure to quote (keep the bake-off as is if nothing re-ran) | `docs/saral/OCR_BAKEOFF.md` | automated | README, AGENT_LIMITATIONS |
| `{{LAYA_BENCH}}`, `{{LAYA_SOURCE}}` | Optional Laya intent router: dev benchmark accuracy, routes accepted, latency; or "not merged" | Laya router report | automated | README, AGENT_LIMITATIONS |

Numbers already final and stated in the docs (do not change unless a source changes): RAG v2 dev split (0.981 /
0.960 / 0.837, 0/178 shown leaks), first agent dev run (22/158, 0.464, 0.456), live GUI 55 pass / 3 fail / 1
blocked of 59, re-decide 174/200 at 03:50 IST, OCR bake-off 65.5% vs 75.5%, Langfuse review 5 pass / 2 fail.

BUILD.md commit counts were taken at about 10:00 IST; refresh them with `git shortlog -sn --remotes=origin` if more
commits land before submission.
