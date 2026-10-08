# P0 Data Mapping

```
Frappe Loan Application            Canonical (UnderwritingInput)   ZEN input
----------------------------      -----------------------------   ---------
name                         -->  application_id                  (carried)
applicant                    -->  applicant_id                    (carried)
custom_monthly_income        -->  monthly_income  (>0)            monthly_income
custom_monthly_obligations   -->  monthly_obligations  (>=0)     monthly_obligations
custom_credit_score          -->  credit_score  (300..900)        credit_score
custom_employment_months     -->  employment_months  (0..600)    employment_months
loan_amount                  -->  loan_amount  (>0)               (carried, unscored)
repayment_periods            -->  loan_tenure_months (1..360)    (carried, unscored)
```

Non-`custom_` fallbacks accepted (`monthly_income`, `repayment_periods`, …).
Validation: pydantic; missing/out-of-range/negative values raise — never coerced.

## ZEN output → evidence (rule join in Python)

```
ZEN result key    Policy rule          Evidence fields
---------------   ------------------   ---------------------------------------
income_pass       MIN_MONTHLY_INCOME   actual=monthly_income, threshold=25000
foir_pass         FOIR_MAX_45          actual=round(foir,4), threshold=0.45
credit_pass       MIN_CREDIT_SCORE     actual=credit_score, threshold=700
employment_pass   MIN_EMPLOYMENT_TENURE actual=employment_months, threshold=12
decision          —                    APPROVED iff all four pass
```

`reason_code` / `rule_name` come from `policy/personal_loan_synthetic_v1.json`
by `rule_id` — ZEN trace carries no rule metadata (see `p0-zen.md`).
