# Phase 2: Synthetic applicant personas (`personas_v1`)

**Everything here is SYNTHETIC.** No real people are represented. Labels come from the prototype
policy `synthetic-v1`, whose four thresholds are prototype assumptions and **not** a VaaniLabs or
lender policy:

* monthly income ≥ ₹25,000
* FOIR ≤ 0.45
* credit score ≥ 700
* employment ≥ 12 months

## Files

| File | What it is |
|---|---|
| `data/synthetic/personas/personas_v1.jsonl` | 2,560 structured personas, pipeline labels and deterministic counterfactuals (seed `20261014`) |
| `data/synthetic/personas/personas_v1_narrated.jsonl` | The same rows plus `narration` (narrative, 3 questions, misconception) and `qc` |
| `data/synthetic/personas/narration_report.json` | Narration QC summary |
| `scripts/data/generate_personas.py` | Generator and labeller. It calls the **unchanged** `decide()` orchestrator (P0/P1 pipeline, ZEN 2.1.2). |
| `scripts/data/narrate_personas.py` | Narrator (gpt-oss-120b on the droplet). It has backoff for server restarts; at most 2 attempts count per row. |
| `tests/test_personas_dataset.py` | Re-labels a sample through the live pipeline and checks the counterfactuals |

## Coverage (measured)

* **Dimensions.**
  * Employment type: salaried private, salaried government, self-employed, gig/contract.
  * City tier: metro, tier 2, tier 3/rural.
  * Age band.
  * Preferred language: Telugu, Hindi, English, Tamil, Kannada, Marathi, Bengali.
  * Loan purpose (8 types).
  * Loan literacy: low 998, medium 1,050, high 512.
* **Decisions.** REJECTED 1,988 / APPROVED 492 / ERROR 80.
  * Rejections by number of failed rules: 1 → 1,152; 2 → 569; 3 → 180; 4 → 87.
  * Failed-rule counts: FOIR 822, score 822, tenure 771, income 763.
* **Edge cases** (160 rows, 10 of each):
  * exact boundary on each rule (all APPROVED, which confirms the inclusive operators);
  * just below each boundary (all REJECTED);
  * missing value for each field (ERROR);
  * invalid value for each field (ERROR).
* **Construction check.** The intended failing rules equal the pipeline's failing rules for all
  2,400 scenario rows (0 mismatches).

## Labels and counterfactuals

* `label`: `decision`, `failed_rules`, `reason_codes`, `foir`, `error`, `policy_version`,
  `policy_is_synthetic: true` and `labelled_by`.
* `counterfactuals`: one per failed rule. Each is a single-field change (e.g.
  `monthly_obligations_at_most`, `months_to_wait`) that was **re-run through the same pipeline in
  memory** (3,178/3,178 make that rule pass).
  * `decision_after_single_change` shows when other rules still fail.
  * Every counterfactual carries "hypothetical under synthetic-v1; not a guarantee of approval".
  * This is gold data for a future "path to reapply" evaluation, not advice.

## Narratives (gpt-oss-120b)

* **Run.** 2,560 rows, 64 workers, 709 s wall time, median latency 17.7 s per row, 34 retried.
* **QC passed: 2,548 / 2,560 (99.5%).** The 12 flagged rows are kept with `qc.passed=false`:
  * 2 mention a policy-like threshold;
  * 10 contain a number that is not a persona fact, all on missing-income edge personas.
* **QC is deterministic.**
  * Every money figure must match a persona fact within 2%.
  * No synthetic thresholds in the narrative.
  * No approval-guarantee language.
* **Language.** 2,267 narratives are in Latin script (English or romanised code-mix); 293 are in
  Indic script (mostly Hindi 212 and Marathi 54). This is useful for multilingual tests. Language
  was not forced.
* **Limits.**
  * The narratives are LLM-written fiction.
  * Background details such as a city name can be invented. They carry no decision information
    and must not be treated as facts.
  * No human review of tone or realism has been done yet (proposed: review 100 samples).

## Regenerate

```bash
PYTHONPATH=.:apps/api/src python scripts/data/generate_personas.py --n 2400 --seed 20261014
# on the droplet (shared vLLM, model "llm"):
python scripts/data/narrate_personas.py --workers 128
```
