# Saral threshold approvals

Every **ASSUMPTION** in [ZEN_DESIGN.md](ZEN_DESIGN.md) is listed here. **None is live.** Bajaj Finance (*public reference lender, not a partner*) publishes no FOIR cap, no employment-length figure and no per-purpose caps, and none of the other numbers below either. Each value is a Saral proposal. Mark each row ✅ approve, ✏️ change (give the value) or ❌ reject. Until every row a policy uses is approved, that policy stays `DRAFT`, and its outputs carry `not_for_live_use = true` (enforced by `contracts/`).

Effects: **DECLINE** = fails the application; **REFER** = sends it to review or asks for information; it never declines.

| ID | What | Proposed value | Effect | Rules | Rationale | Decision |
|---|---|---|---|---|---|---|
| A-01 | Which income is compared with Bajaj's ₹25,001 / ₹40,000 "monthly salary" | **Net take-home** | — | B10 | Bajaj does not say net or gross. Net is the conservative reading, and it is the money that actually services an EMI. | ☐ |
| A-02 | Income used for assessment | **min(payslip net avg, bank salary credit avg)**. If one is missing, the other, flagged as a fallback. Then the employment-letter gross, then the declared figure; both of those REFER. | — | B10, B11 | When two sources exist, taking the lower avoids over-stating capacity. A single source is allowed but is marked. | ☐ |
| A-03 | Cities that take the ₹40,000 floor | **Pune, Bengaluru, Mumbai, Delhi only.** Every other city takes ₹25,001. | — | B10, SALARIED_METRO | These are the only cities Bajaj names ("for instance"). Adding Hyderabad, Chennai and others would raise the floor for them without a source. Known gap: Bajaj says the figure is "based on the city", so unnamed cities may really sit between the two figures. | ☐ |
| A-04 | FOIR cap (base) and definition | **≤ 0.50**, with FOIR = (existing EMIs + new EMI) ÷ assessed income | DECLINE | B11 | Bajaj names "High FOIR (as per lender criteria)" as a rejection reason, gives no number, and calls a DTI under 40% "generally favourable" (advice). 0.50 leaves room above that comfort zone. Including the new EMI replaces the v1 definition, which left it out. | ☐ |
| A-05 | Interest rate used to compute the new EMI | **20% p.a.** (Bajaj's EMI formula) | — | B11 | The offered rate is unknown before sanction. 20% sits near the middle of Bajaj's published 10–30.5%, so affordability is neither flattered nor worst-cased. | ☐ |
| A-06 | Card/overdraft obligation when the bureau reports EMI 0 | **max(reported, 5% of outstanding balance)** | — | B11 | The synthetic bureau reports 0 on cards. A revolving balance still costs money each month. | ☐ |
| A-07 | Minimum months with current employer | **≥ 6** | REFER | B12 | Bajaj names "probation at a new job" without a figure. Six months covers a typical probation. REFER, not decline, because an employment letter can confirm the job. This replaces the synthetic 12. | ☐ |
| A-08 | Delinquency (bureau buckets) | **60+ DPD in 12 m → DECLINE; any DPD (30) in 12 m → REFER; 90+ DPD in 24 m → DECLINE** | DECLINE / REFER | B13, B14, B15 | Bajaj cites late payments and defaults (INSIGHT-REJECTION#009) with no numbers. Serious recent arrears decline; a single late payment goes to review. | ☐ |
| A-09 | Credit enquiries in the last 6 months | **≤ 4**, above that REFER | REFER | B16 | Bajaj cites "multiple recent loan applications" without a count. REFER, because shopping around is not default. | ☐ |
| A-10 | Write-off / settlement lookback | **Within 24 m → DECLINE; older → REFER.** No date known → treated as within 24 m. | DECLINE / REFER | B17, B18 | Bajaj names past settlements and write-offs, with no window. 24 m matches the bureau history the synthetic provider returns. | ☐ |
| A-11 | Payslip vs bank salary-credit tolerance | **≤ 10%** of payslip net | REFER | B19 | Net pay should land almost unchanged in the salary account. 10% absorbs reimbursements and arrears. | ☐ |
| A-12 | Salary credits in the bank statement | **A credit in each of the 3 months** | REFER | B20 | Bajaj asks for 3 months of statements and gives no regularity test. | ☐ |
| A-13 | Bank debits vs credits | **total debits ÷ total credits ≤ 1.0** | REFER | B21 | Spending more than comes in over the period is a review signal, not proof of inability to pay. | ☐ |
| A-14 | Name match across PAN, Aadhaar, payslip, bank, record | **≥ 0.85** (token-set similarity) | REFER | B22 | Bajaj names "document mismatched". OCR misreads look like mismatches, so the result is REFER. | ☐ |
| A-15 | DOB and PAN/Aadhaar last-4 mismatch | **Exact match required; mismatch REFERs** | REFER | B23, B24 | Same reasoning as A-14. | ☐ |
| A-16 | OCR confidence floor | **60** (Tesseract 0–100, the same as PR #41's LOW_CONFIDENCE). A DECLINE that rests on a low-confidence value becomes REFER. | REFER only | S01 (+ all DECLINE rules) | One threshold for "check this", in both the UI and ZEN. Nobody is declined on a misread digit. | ☐ |
| A-17 | Signature similarity (experimental) | **≥ 0.80**, below that REFER. Missing → no effect. | REFER only | S02 | No signature module exists. It is screening only and never declines. | ☐ |
| A-18 | Missing required data | **REFER, never DECLINE** | REFER | All required rules | Missing data means asking for the document. It does not mean refusing. | ☐ |
| A-19 | Employer category outside public / private / MNC | **REFER** | REFER | B08 | Bajaj's list covers almost every salaried applicant. "Other" is usually a classification gap. | ☐ |
| A-20 | Score bands | **PRIME ≥ 750; NEAR_PRIME 650–749** | — | Segments | 650 is Bajaj's floor. 750 is the "ideal" in Bajaj's education article (C2), and is used only as a band edge. | ☐ |
| A-21 | PRIME FOIR cap | **≤ 0.55** | DECLINE | B11 | A strong repayment record earns a little more room. This is the only relaxation proposed. | ☐ |
| A-22 | New-to-credit | **Score rule → REFER (never auto-approve or decline); FOIR ≤ 0.40; indicative cap ₹2,00,000** | REFER | B09, B11, NTC01 | Bajaj requires CIBIL 650+ and has no thin-file rule, so nobody with no history can be auto-approved. A tighter FOIR and a small cap guide the reviewer. | ☐ |
| A-23 | Self-employed | **Income = average monthly bank credits; floor ₹25,001; 6 months of statements; skip B08/B12/B19/B20; always REFER (SE01)** | REFER | B10, SE01 | Bajaj lists the profile, but gives no income rule, and accepts ITR or bank statements (ELIG-DOCS#012). PR #41 reads no ITR, so ZEN cannot verify the income alone. | ☐ |
| A-24 | Existing customer | **KYC checks may use the existing KYC record; no threshold relaxed** | — | B22–B24 | Bajaj allows reuse of existing KYC (APP-TNC-2023#012). It publishes no pricing or eligibility advantage. | ☐ |
| A-25 | Wedding cap | **₹15,00,000; tenure ≤ 60 months** | REFER | P02, P03 | Bajaj has no purpose cap. A moderate cap with a shorter tenure suits an event expense. | ☐ |
| A-26 | Higher-education cap | **₹20,00,000; tenure ≤ 84 months** | REFER | P02, P03 | Bajaj positions this as a top-up beside an education loan (OVERVIEW#002). A longer tenure suits study years. | ☐ |
| A-27 | Home-renovation cap | **₹25,00,000; tenure ≤ 84 months** | REFER | P02, P03 | The largest-ticket purpose of the four, and a long-lived asset. | ☐ |
| A-28 | Medical-emergency cap | **₹10,00,000; tenure ≤ 60 months** | REFER | P02, P03 | An urgent need is often decided fast on thin documents. A smaller cap limits exposure. | ☐ |
| A-29 | Breaching a purpose cap; purpose proof | **REFER, not DECLINE; no purpose-proof document required** | REFER | P02, P03 | The amount is still inside Bajaj's ₹40k–₹75L. Bajaj asks for no purpose proof, and OCR cannot read one. | ☐ |
| A-30 | Two segments setting the same threshold | **The more conservative value wins** | — | Segments | Stops a future segment from loosening a rule by accident. | ☐ |

## Conflicts to confirm (sourced figures that disagree)

| ID | Conflict | Proposed choice | Effect today | Decision |
|---|---|---|---|---|
| C1 | Max amount: ₹75 lakh (product pages, 14 chunks) vs ₹55 lakh (BFL-PL-RATES-FEES#011 tables; `bajaj_v1` anchors) | **₹75 lakh** for B05, citing BFL-PL-OVERVIEW#003. Answers should give the page and fetch date. | None for the four products, since every purpose cap is ≤ ₹25 lakh. The benchmark anchors are another owner's to fix. | ☐ |
| C2 | Credit score: 650 (product pages) vs 685 / 750 (BFL-INSIGHT-REJECTION, education article) | **650** for B09. 750 is used only as the PRIME edge (A-20). | Applicants scoring 650–684 are eligible under the draft. | ☐ |

Sourced thresholds, which need no approval but are listed for completeness: age 21 / 80 at maturity, Indian nationality, ₹40,000 minimum amount, 12–108 months tenure, CIBIL 650, ₹25,001 / ₹40,000 income floors, public/private/MNC employer, the 3 slips + 3 months of statements document list, and the purpose-matches-application end-use clause. Chunks are in ZEN_DESIGN.md §1 and §3.
