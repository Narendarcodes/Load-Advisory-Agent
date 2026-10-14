# Phase 1: Dataset acquisition and audit

Date: 2026-10-14. Scope: public data for testing the **conventional** personal-loan pipeline
(Frappe → canonical schema → ZEN → Decision Evidence). It does not cover agent training.

Status labels used below: **verified** (seen on the source page or measured on the downloaded
file), **proposed** (our recommendation), **unresolved** (needs the user, the partner, or a
licence holder).

Reproduce (on the GPU droplet; raw data stays out of git):

```bash
export LOAN_DATA_DIR=/root/hx/loan/data
python scripts/data/download_datasets.py        # registry: data/sources/datasets.yaml
python scripts/data/normalise_datasets.py       # -> $LOAN_DATA_DIR/normalised/<id>.parquet
python scripts/data/audit_datasets.py > $LOAN_DATA_DIR/audit.json
```

Each download writes `raw/<id>/MANIFEST.json` (URL, bytes, sha256, md5, retrieved_at).
The Zenodo file is also checked against the md5 published on the record. The figures below
come from `audit.json` from the run on 2026-10-14.

## 1. Bottom line

* **No public dataset contains Indian personal-loan applications with lender decisions and
  recorded rejection reasons.** (verified for every candidate below; also stated as an open risk
  in the handoff.) Public data can **exercise** the pipeline. It cannot **validate** Indian lender
  decisions, and nothing here is presented as doing so.
* **Primary (proposed): LendingClub, two parts.**
  * The Zenodo "granting model" extract (CC BY 4.0) holds only decision-time fields and repayment
    labels for 1,347,681 issued loans.
  * The Kaggle `accepted_2007_to_2018Q4` file (CC0 as declared; 2,260,668 rows × 151 cols) gives
    full field coverage and the leakage study.
  * Once a Kaggle token is supplied, the `rejected_2007_to_2018Q4` file adds the declined
    population.
* **Fallback (proposed): UCI Statlog German Credit** (CC BY 4.0, 1,000 rows). It is small,
  clean and licensed, has an employment-duration field and a risk label, and is good for
  deterministic pipeline and fairness smoke tests.
  * UCI Credit Approval (690 rows) is the only open source with a real **approve/reject** label,
    but its attributes are anonymised, so it is useful only for label-handling tests.
* **The only source with our exact fields and reason codes is the synthetic personas set
  (Phase 2).** It is labelled synthetic everywhere and is driven by the synthetic-v1 policy.

## 2. Candidates, licence and provenance

| id | Source | Licence (as seen 2026-10-14) | Rows (measured) | Population | Status |
|---|---|---|---|---|---|
| `lc_zenodo_granting` | https://zenodo.org/records/11295916 (DOI 10.5281/zenodo.11295916, v0.1) | CC BY 4.0 (record metadata). Creators include "Lending Club"; derived from the Kaggle mirror. | 1,347,681 | Issued US P2P loans 2007–2018, final status Fully Paid / Charged Off only | downloaded, md5 verified |
| `lc_kaggle_accepted` | https://www.kaggle.com/datasets/wordsforthewise/lending-club (via CC0 HF mirror `codesignal/lending-club-loan-accepted`) | CC0 declared by the uploader. The uploader notes LendingClub later added a ToS popup. | 2,260,668 (151 cols) | Issued loans incl. post-origination fields | downloaded |
| `lc_kaggle_rejected` | same Kaggle dataset, `rejected_2007_to_2018Q4.csv.gz` | CC0 declared by the uploader | not downloaded | Declined applications, 9 fields | **gated**: needs `KAGGLE_USERNAME`/`KAGGLE_KEY`. No non-Kaggle mirror was found (HF search 2026-10-14). |
| `uci_german_credit` | https://archive.ics.uci.edu/dataset/144 (DOI 10.24432/C5NC77) | CC BY 4.0 (UCI licence block) | 1,000 | German bank, 1994, good/bad risk | downloaded |
| `uci_taiwan_default` | https://archive.ics.uci.edu/dataset/350 | CC BY 4.0 | 30,000 | Existing card clients, Taiwan 2005, next-month default | downloaded |
| `uci_credit_approval` | https://archive.ics.uci.edu/dataset/27 | CC BY 4.0 | 690 | Credit-card applications, +/− approval | downloaded |
| `home_credit_default_risk` | https://www.kaggle.com/competitions/home-credit-default-risk/data | Kaggle competition rules (login and acceptance required) | not downloaded | ~307k applications, repayment-difficulty TARGET | **gated / unresolved**. HF re-uploads that relabel it Apache-2.0 are third-party relabels, so they are **excluded**. |
| Indian individual-level data | Kaggle "loan approval" sets with `cibil_score` (e.g. 4,269-row sets, MIT/Apache/CC labels) and "Indian Banks Loan Dataset" (licence *Unknown*) | uploader-declared or unknown | none taken | — | **excluded**. Provenance is unknown and several are self-declared synthetic. None document a lender, a decision process or reason codes. |
| Indian official statistics | RBI DBIE / data.gov.in | Government open data | aggregate only | sector-level credit aggregates | not individual applications, so out of scope for record-level tests |

**Provenance caveats (unresolved):**

* LendingClub's own download page carries terms of use. The CC0/CC BY labels are applied by
  re-publishers, not by LendingClub.
* Use is therefore limited to non-commercial capstone research. We do not redistribute
  anything: no raw or derived rows go in git.
* Before any commercial or VaaniLabs use, LendingClub's terms must be reviewed.

## 3. Field coverage vs the canonical schema

Canonical (decision-time) schema: `decision_engine/schemas/underwriting.py`.

| Canonical field | LC Zenodo | LC accepted | LC rejected (per LC dictionary) | German | Taiwan | UCI approval |
|---|---|---|---|---|---|---|
| `application_id` | `id` | `id` | none (row index) | row index | `ID` | row index |
| `monthly_income` | `revenue/12` (USD, self-reported) | `annual_inc/12` (USD) | **absent** | absent | absent | anonymised |
| `monthly_obligations` | derived `income × dti_n` | derived `income × dti` | absent (DTI only) | absent | absent | anonymised |
| FOIR / DTI | `dti_n` (excl. mortgage and requested loan) | `dti` (same definition) | `Debt-To-Income Ratio` | instalment-rate band 1–4 only | none | — |
| `credit_score` | `fico_n` (FICO 300–850) | `fico_range_low/high` | `Risk_Score` (FICO before 2013-11-05, VantageScore after: **mixed scale**) | absent | absent | anonymised |
| `employment_months` | `emp_length` buckets (<1 … 10+ yrs) | same | `Employment Length` | A7 bands (<1, 1–4, 4–7, ≥7 yrs) | absent | anonymised |
| `loan_amount` | `loan_amnt` | `loan_amnt` | `Amount Requested` | A5 (DM) | `LIMIT_BAL` (a credit limit, not a request) | — |
| `loan_tenure_months` | **absent** (100% missing) | `term` 36/60 | absent | A2 duration | absent | — |
| Decision label | implicit APPROVED (issued only) | implicit APPROVED | implicit REJECTED | **none** (risk class) | none | **APPROVED/REJECTED** (307/383) |
| Rejection reason codes | none | none | **none** | none | none | none |
| Policy/scorecard version | none | none | `Policy Code` (meaning undocumented) | none | none | none |
| Repayment outcome | PAID 1,078,432 / DEFAULT 269,249 | PAID 1,078,739 / DEFAULT 269,360 / open-or-late 912,569 | n/a | good 700 / bad 300 | default 6,636 / 30,000 | n/a |

Normalisation rules (in `scripts/data/normalise_datasets.py`; every row carries
`debt_ratio_definition`, `credit_score_scale` and `label_semantics`):

* `employment_months_min` = lower bound of the bucket (`10+ years` → 120, **open-ended**).
* `monthly_obligations` is **derived** from DTI and is never a recorded value. LC DTI excludes
  mortgage and the requested loan, so it is **not** an Indian FOIR, which usually includes the
  proposed EMI. We do not mix the two formulas silently: the proxy keeps `debt_ratio` and its
  definition string side by side.
* Currencies (USD/DM/NTD) are not converted. **Proxy rows must never be fed to the INR
  synthetic-v1 policy as if they were Indian applicants.**

## 4. Quality, leakage and bias (measured)

* **Missingness.**
  * LC accepted: DTI 0.08%; employment 6.5% (`n/a`).
  * Zenodo: employment 5.8%, term 100% (the field is absent).
  * German, Taiwan and UCI approval lack income, score and DTI entirely.
  * No duplicate IDs in any normalised set.
* **Target leakage (LC accepted).** 28 of 151 columns exist only after the credit decision or
  origination:
  * `int_rate`, `grade`, `sub_grade`, `installment`, `funded_amnt*`, `issue_d`, `loan_status`,
    `pymnt_plan`, `out_prncp*`, `total_pymnt*`, `total_rec_*`, `recoveries`,
    `collection_recovery_fee`, `last_pymnt_*`, `next_pymnt_d`, `last_credit_pull_d`,
    `last_fico_range_*`, `hardship_flag`, `debt_settlement_flag`, `settlement_status`,
    `initial_list_status`.
  * They must be dropped for any decision-time experiment. The Zenodo extract has already
    removed them.
* **Decision label ≠ repayment target.** In LC every row was approved; `Default` is a repayment
  outcome on approved loans. Training an approval model on it would learn *repayment among the
  approved*, not *who gets approved*. German and Taiwan labels are also risk outcomes, not
  decisions.
* **Selection bias (observed).**
  * Accepted-loan FICO p01 = 662 and p50 = 692. The issued population is truncated at the
    bottom of the score range.
  * 99.1% of accepted rows have DTI ≤ 0.45.
  * Repayment data therefore says nothing about rejected applicants (reject inference would be
    needed and is out of scope).
* **Do not infer policy from data.** It is tempting to read "LC never approved FICO < 660" from
  the p01. That would be an inference, not a recorded rule, and must not be presented as
  LendingClub's or anyone's policy.
* **Sensitive or proxy attributes.**
  * LC: `zip_code` (3-digit), `addr_state`, free-text `emp_title`/`desc`/`title` (may contain
    PII-like text).
  * German: personal status and sex (A9), age (A13), foreign worker (A20).
  * Taiwan: SEX, EDUCATION, MARRIAGE, AGE.
  * Normalised outputs keep **none** of these. A fairness study would need them deliberately and
    with a written purpose.
* **Jurisdiction and time.** US 2007–2018, Germany 1994, Taiwan 2005. None reflects current
  Indian products, RBI rules (KFS, digital lending) or CIBIL score ranges (300–900).

## 5. What each source can support

| Experiment | Suitable sources |
|---|---|
| Pipeline robustness at scale (adapter → schema → ZEN latency, error handling on real-world messiness) | LC accepted or Zenodo, after mapping to a **test-only** policy in USD/FICO terms, never synthetic-v1 |
| Missing/invalid-data handling | LC (`n/a` employment, missing DTI), UCI approval (`?` values) |
| Approve/reject label plumbing | UCI Credit Approval; LC accepted + rejected (once the token is available) |
| Distribution realism for synthetic generation (income/DTI/score shapes) | LC: shapes only, rescaled; no values copied |
| Fairness and bias smoke tests | German (A9/A13/A20), Taiwan, with explicit purpose |
| Explaining **recorded** rejection reasons | **none**: synthetic personas only (Phase 2) |
| Validating Indian lender decisions | **none**: needs an authorised partner dataset (unresolved) |

## 6. Gaps that need synthetic scenarios or the partner

1. **Unresolved:** an authorised, anonymised VaaniLabs or partner lender dataset with applications,
   decisions, reason codes and policy versions. This is the only path to real validation.
2. **Unresolved:** rejected LendingClub records. These need the user's Kaggle API token on the
   droplet (`KAGGLE_USERNAME`, `KAGGLE_KEY`); rerun `download_datasets.py --only lc_kaggle_rejected`.
3. **Unresolved:** Home Credit. Its use requires the user to accept the competition rules
   personally. It is not needed for the current phases.
4. **Covered by Phase 2 synthetic personas:**
   * INR incomes;
   * FOIR including obligations;
   * CIBIL-range scores;
   * month-level tenure;
   * reason codes;
   * boundary, missing and invalid cases;
   * applicant literacy and background.

## 7. Recommendation

* **Primary (public proxy):** LendingClub. Use the Zenodo extract for decision-time fields and
  the accepted file for full-schema and leakage work; add the rejected file when the token
  arrives. Label it everywhere as a *US public proxy*.
* **Fallback:** UCI German Credit (CC BY 4.0).
* **For anything involving reasons, FOIR in INR or the advisory agent:** the Phase 2 synthetic
  personas, which are labelled synthetic.
* **Exit gate status:** met for *exercising* the pipeline (at least one permitted primary dataset
  is selected and its limits are documented). **Not met** for *validating* Indian lender
  decisions, and that cannot be met with public data.
