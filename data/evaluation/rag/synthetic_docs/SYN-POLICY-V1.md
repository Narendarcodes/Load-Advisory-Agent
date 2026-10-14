# Prototype personal-loan eligibility policy synthetic-v1 (SYNTHETIC - NOT A REAL LENDER POLICY)

Policy id PERSONAL_LOAN, version synthetic-v1, effective from 8 October 2026. Currency INR.
This prototype policy was written by the capstone team for testing. It is not a VaaniLabs policy,
not an RBI requirement and not the policy of any bank or NBFC.

## Rule MIN_MONTHLY_INCOME (reason code ERR_INCOME_BELOW_MINIMUM)
The applicant's monthly income must be at least Rs 25,000.

## Rule FOIR_MAX_45 (reason code ERR_FOIR_EXCEEDED)
The Fixed-Obligation-to-Income Ratio, calculated as monthly obligations divided by monthly income,
must not exceed 0.45 (45 percent). A FOIR of exactly 0.45 passes.

## Rule MIN_CREDIT_SCORE (reason code ERR_CREDIT_SCORE_BELOW_MINIMUM)
The credit score must be at least 700.

## Rule MIN_EMPLOYMENT_TENURE (reason code ERR_EMPLOYMENT_TENURE_SHORT)
Continuous employment must be at least 12 months.

## Outcome
An application is approved only if all four rules pass; otherwise it is rejected. Missing or
invalid values are not decided; the application is returned for information.
This policy does not define any waiting period before reapplying.
