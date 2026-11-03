# Saral synthetic KYC, employment, bank and bureau-linked datasets

Status: **synthetic development data**. No record describes a real person, document, bank account or employer. None of it may be used for a real lending decision.

The datasets give ZEN a complete, linked, **salaried** applicant: the MVP is salaried only (owner decision, 2026-11-03 22:50). Each applicant carries:

- identity, an Aadhaar e-KYC-style record and a PAN record;
- employment with 3 payslips and simulated OCR reads;
- an account-aggregator-style bank statement;
- a synthetic bureau report;
- product (purpose) details and documents;
- signature specimens, consents and application history;
- a label: scenario, product, amount band, expected decision path;
- `zen_inputs`, every ZEN input already resolved, and `zen_data_points`, the 30 contract data points.

The point is that every rule in the PL rule catalogue (PL-001..PL-128) and `ZEN_RULES_PROPOSAL_v2.md` can be exercised end to end.

**Where things live:**

| What | Path |
|---|---|
| Code | `synthetic_data/saral_kyc_bank/` (outside every Qoder-owned directory) |
| Tests | `tests/test_saral_synthetic_kyc_bank.py` |
| Committed sample | `data/synthetic/saral_v1/` (20 applicants) |

## 1. How to regenerate

```bash
python -m synthetic_data.saral_kyc_bank --count 200 --seed 20261103 --out /tmp/saral_synth      # full universe (~13 MB, not committed)
python -m synthetic_data.saral_kyc_bank --count 20  --seed 20261103 --out data/synthetic/saral_v1   # committed sample
python -m synthetic_data.saral_kyc_bank --count 20 --out /tmp/s --render-docs /tmp/s_docs        # + SPECIMEN PNGs for the OCR chain
python -m synthetic_data.saral_kyc_bank --coverage-table                                          # regenerate the table in section 6
```

```python
from synthetic_data.saral_kyc_bank import build_universe
u = build_universe(200, seed=20261103)  # applicants, statements, bureau_cases, internal_lists, scenario_counts
from synthetic_data.saral_kyc_bank.zen_inputs import validate, zen_input_envelope
assert all(not validate(a) for a in u["applicants"])   # every ZEN input present
```

**Requirements:**
- `pydantic`, which the bureau schema already needs.
- Pillow, only for `--render-docs`.
- No numpy, no network, no wall clock.

**Determinism:**
- Every value comes from a SHA-256-seeded `random.Random` keyed on (seed, applicant index, key), as in `synthetic_bureau.generator`.
- `as_of` is the bureau's `DEFAULT_AS_OF`, 2026-10-24.
- The first N applicants of a larger run are identical to an N-applicant run. Universe-level inputs, such as duplicates and shared contacts, look only at earlier applicants.

**Plan order:**
1. Every non-matrix scenario once, CLEAN_PRIME first.
2. The 48-cell product × band matrix.
3. A second pass of every failure scenario.
4. CLEAN_PRIME padding.

**Output files:**

| File | Content |
|---|---|
| `applicants.jsonl` | `saral-synthetic-applicant/1`, one per line |
| `bank_statements.jsonl` | `saral-synthetic-aa-fi/1` statements |
| `bureau_cases.json` | `bureau-cases/1`, the bureau's own fixture shape (§4.3) |
| `bureau_mapping.csv` | applicant_id ↔ application_id ↔ display name ↔ bureau request/report ids ↔ statement id + hash |
| `internal_lists.json` | Synthetic negative list and employer caution list |
| `manifest.json` | Seed, counts, scenario counts, safety rules, SHA-256 per file |

The 20-applicant sample covers the first 20 scenarios. The 200-applicant run covers all of them; see the counts in §5.

## 2. Safety design

| Item | Rule | Why it can't be real |
|---|---|---|
| Aadhaar | 12 digits, **first digit 0 or 1**, valid Verhoeff check digit | UIDAI never issues 0/1-prefixed numbers. |
| Aadhaar display | `XXXX-XXXX-1234` (`uid_masked`) and contract form `XXXX XXXX 1234` (`uid_masked_contract`) | |
| PAN | `ZZ` + letter + `P` + surname initial + 4 digits + letter | No official test series exists. `ZZ` is a convention shared with the OCR branch, so the `synthetic` flag is authoritative. |
| PAN display | Contract form `XXXXX1234X` | |
| IFSC-like code | `XSYNS` + 6 digits | The 5th character is never `0`, so it fails `^[A-Z]{4}0[A-Z0-9]{6}$`. **"SYNB0" was rejected: `SYNB` was Syndicate Bank's real code.** |
| Account | `0000` + 10 digits, shown masked | |
| PIN | Starts with `0` | |
| Phone | `+910000` + 6 digits | Indian mobiles start 6–9. |
| Email | `@example.invalid` | Reserved TLD. |
| Names | Common given name + surname at random | A pairing may match a real person by chance. |
| Employers, lenders, banks, institutions, hospitals, contractors, vendors | Invented `Specimen`/`Demo`/`Sample` names | |
| Ids | Every hashed id body starts with a letter. Hashes inside ZEN blocks are base32. | Neither can form a 12-digit run or PAN shape that the contracts' `NoRawIdentifiers` check would reject. |
| ZEN blocks | `zen_inputs` and `zen_data_points` contain no full PAN or Aadhaar | A test applies the contracts' own regexes. |
| Markers | `synthetic: true` on every record and sub-record; `specimen_marker` on applicant, e-KYC, PAN, payslip, statement; rendered images carry a corner **SPECIMEN - SYNTHETIC** banner and a red frame | |

There are no secrets.

> **For the OCR owner.** `field_checks.aadhaar_ok` (feat/saral-ocr-paddle-signature) rejects a first digit of 0/1, as production validation should. It needs a synthetic-mode switch that accepts 0/1 **only** on documents flagged synthetic. That branch's own generator uses `9999…` (real-format) numbers. These datasets deliberately do not.

## 3. Products and amount bands

Products and caps follow the ZEN design draft (`rule_catalogue.draft.json` product rules; `contracts/zen.py` `ProductId`). They are DRAFT assumptions A-25..A-28.

| Product | Purpose | Max amount | Max tenure | Product documents | Product fields |
|---|---|---|---|---|---|
| PL_WEDDING | `wedding` | ₹15L | 60 | Wedding quote (optional) | `wedding_date`, relationship |
| PL_HIGHER_EDUCATION | `higher_education` | ₹20L | 84 | Admission letter + fee schedule (required) | Institution, course, `course_start_date`, `payee_account_present` |
| PL_HOME_RENOVATION | `home_renovation` | ₹25L | 84 | Contractor quote (required) | `property_ownership` (OWNED/FAMILY_OWNED) |
| PL_MEDICAL_EMERGENCY | `medical_emergency` | ₹10L | 60 | Hospital estimate or bill (required) | Patient relationship, `treatment_date`, `payee_account_present` |

`purpose_evidence_amount` is the quote, fee or estimate, used by PL-126. `purpose_evidence_status` is PROVIDED, MISSING, INSUFFICIENT or NOT_REQUIRED.

**Amount bands** (catalogue v2 PL-119): **B1** ≤ ₹2L, **B2** ₹2–10L, **B3** ₹10–25L, **B4** > ₹25L.

How amounts are spread:
- Generic scenarios rotate purpose and band B1–B3, jitter the amount, and draw tenure from 24–84 within the cap.
- Income is sized to a random FOIR of 0.25–0.42, so incomes, FOIR and tenure vary. Scores vary through the bureau target (735–800) and the overlays.

**Matrix:** 4 purposes × 4 bands × {approve, counter-offer, decline} = 48 applicants. Each cell's expected path is computed:

| Cell type | How it works |
|---|---|
| Approve | Affordable (FOIR ≤ 0.42 at the request) and within the cap. |
| Counter-offer, **longer tenure** | The request fails A01 at 12–36 months; the shortest passing tenure up to the cap is the counter. |
| Counter-offer, **reduced amount** | The request fails even at the cap tenure; A05 gives the largest passing amount, held at FOIR ≤ 0.45 above ₹10L for PL-123. |
| Small (B1) counter-offers | Use cities on the ₹25,001 income floor. With ₹40,000-floor cities and ₹11,000 existing EMIs, FOIR can't fail at B1. |
| Decline | Credit history whatever the amount: score 630, 90+ DPD, write-off or settlement. |
| **Cap-limited** | Amount above the product cap (medical/wedding in B3, all of B4). It can't approve. The B1–B3 approve cell becomes **COUNTER_OFFER** at the cap. |
| **B4** | Labelled **REFER:PRODUCT**, with an *indicative* counter-offer at the cap, because PL-123 always sends B4 to manual review and B4 is above every cap. |

`label` on each applicant gives `{scenario_id, product_id, purpose, amount_band, requested_amount, tenure_months, expected_path}`. `expected_outcome_hint.expected_counter_offer` gives `{kind, counter_amount, counter_tenure, cap_limited}`. A test re-checks the arithmetic of every approval and counter-offer with `product.failures()`.

**Conflicts recorded:**
- Cap-only failures: proposal v2 **P05** says REFER, while the v2 aggregation rule says counter-offer at the largest passing amount. Labelled COUNTER_OFFER, with `policy_conflict` set.
- HOME_QUOTE_BELOW_AMOUNT is labelled REFER (v2 P03). Catalogue v2 PL-126 would counter-offer at the evidence amount.
- **Grade-based sizing (PL-125) is not modelled.** Counters use v2 A01 FOIR 0.50, A03 ₹15k residual, A04 24× income and the cap. PL-125 grade caps (A 0.55 / B 0.50 / C 0.45) and multipliers could change counter amounts.

## 4. Schemas

### 4.1 Applicant (`saral-synthetic-applicant/1`)

| Key | Content |
|---|---|
| ids | `record_id`/`applicant_id` `SYN-APP-0001`, `application_id` `SYN-SARAL-0001`, `display_name` (has spaces) |
| `label`, `scenario`, `expected_outcome_hint` | Scenario id/groups/description/signature label. The hint holds `outcome`, `decision_path`, `reason_category`, rules, `also_triggers`, `expected_counter_offer`, `policy_conflict`, `decline_driver`. **Not a ZEN result.** |
| `identity` | Names, gender, `date_of_birth`, address `{house, street, locality, city, district, state, pincode, country}`, `metro_city`, `income_floor`, `months_at_address`, phone, email, nationality, residency |
| `aadhaar_ekyc` | `uid`, `uid_masked`, `uid_masked_contract`, `poi {name, dob, yob, gender}`, `poa {...}`, `photo {present:false, placeholder:true}`, `issue_date`, `verification_status` |
| `pan` | `pan`, `pan_masked`, `holder_type`, `name_as_on_pan`, `father_name_as_on_pan`, `dob_as_on_pan`, `name_match_variant {name, kind, used}`, `status`, `verification_status` |
| `employment` | SALARIED; employer name/category (PUBLIC/PRIVATE/MNC, ineligible PROPRIETORSHIP/UNREGISTERED_FIRM); `employment_type` (PERMANENT/PROBATION/CONTRACT); joining date; months with employer; total experience; gaps; `employer_changes_24m`; `history[]`; 3 `payslips[]` `{document_id, pay_period, document_date, gross, earnings, deductions, total_deductions, net}` |
| `declared` | Declared income/obligations/employer/city/address-months/nationality/residency |
| `loan_request` | `amount`, `tenure_months`, `purpose` (declared), `product_id`, `product_purpose`, `amount_band`, assessment rate 0.20, `proposed_emi_at_assessment_rate` |
| `product` | `fields`, `documents[]` (SYN-DOC ids), `required_kinds`, `purpose_evidence_status`, `purpose_evidence_amount`, `payee_account_present` |
| `ocr_extractions[]` | SIMULATED reads with per-field confidence for PAN, Aadhaar, 3 payslips and the statement. `SYN-EXT`/`SYN-DOC` ids. |
| `bank_ref` | LMS reference: `statement_id`, `content_sha256`, period, `txn_count`, masked account, IFSC |
| `bureau_link` | Request (a valid `BureauReportRequest`), `report_id`, `report_ref_contract` (`SYN-BUR-…`), origin, overlay changes, `installment_obligation_total`, `identity_on_file`, `history_sidecar` (scores and exposure 6/12 months ago) |
| `documents`, `consents`, `application_history` | Required/submitted; consents; `last_decline_date` |
| `signature` | Label (GENUINE_MATCH/SKILLED_FORGERY/RANDOM_FORGERY/MISSING), reference (on the PAN) and form signature (NACH mandate) strokes, document ids, simulated `screening {signature_present, signature_similarity, signature_anomaly_score}` |
| `zen_inputs` / `zen_data_points` | §6 |

`bureau_link.identity_on_file` and `history_sidecar` are **sidecars**. bureau-report/1 has no name, DOB, address, score history or balance history. They aren't part of Qoder's schema; catalogue v2 defers PL-021/022/023/030/056 until bureau-report/2.

### 4.2 Bank statement (`saral-synthetic-aa-fi/1`)

- **Statement fields:** `statement_id` (stable), `account {masked_account_number, account_ref, account_type, od_limit, ifsc, bank_name, branch, holder_name, currency}`.
- **Summary:** `{period_start, period_end, months, opening/closing_balance, txn_count, total_credits, total_debits}`.
- **Transactions:** each has a stable `txn_id` (`<statement_id>-T0001`), `txn_date`, `value_date`, `narration`, `mode` (UPI/NEFT/IMPS/NACH/ECS/CASH/ATM/CARD/CHEQUE/OTHERS), `type`, `amount`, running `balance`, `reference`, `synthetic_truth_tag`.
- **Integrity:** `integrity.content_sha256` is SHA-256 of canonical JSON of {account, summary, transactions}. `lms_reference` holds `{statement_id, content_sha256, period, txn_count}`, so the LMS stores a reference plus a hash, not transactions.
- **Arithmetic:** amounts are computed in integer paise, so balances are exact.
- **`synthetic_truth_tag`** is test ground truth; real AA data has none, and **rules must not read it**.
- **Periods:** 6 months (meets PL-121's 6 months for B3/B4). INCOME_DROP and SALARY_IRREGULAR use 12 months; MISSING_DOCUMENTS uses 2.

**Behaviour generated:**
- Employer-named salary credits.
- EMI NACH debits equal to each active bureau instalment `monthly_obligation`.
- Undeclared EMIs.
- NACH/ECS returns with reversal, ₹590 charge and re-presentation.
- Cheque returns (₹354 charge).
- OD-linked negative-balance days.
- Cash-deposit concentration.
- Salary reversal.
- Income drop.
- Variable incentive pay.
- Spending above inflow.
- Card bill payments (~5% of the card balance).
- Rent, utilities, and late-month discretionary spend (month-end lows).

### 4.3 Bureau link

- **Native reports** come from calling `synthetic_bureau.generator.build_report`, imported read-only and never modified: NO_HIT, THIN_HISTORY, STALE_REPORT, IDENTITY_MISMATCH, INCOMPLETE, UNAVAILABLE, and SUCCESS at scores 630/660/700.
- **Overlays** cover everything else. Each overlay applies documented changes to the native report, is re-scored with `synthetic_bureau.scoring.score_history`, and is re-validated against `BureauReport`. Report id `BUR-OVL-…`; `provenance.scenario_id = "SARAL-OVERLAY:<kinds>"`.
- **Overlay kinds:**
  - `AGED`: always first; 30–72-month vintage.
  - `DROP_AUTO`
  - `DUPLICATE_TRADELINE`
  - `STACKING`
  - `DPD_60`
  - `DPD_90`
  - `WRITTEN_OFF`
  - `SETTLED`
  - `ENQUIRY_BURST`
  - `DEFAULT`
- **Obligation consistency:** declared obligations = active bureau instalment EMIs = the bank EMI debits. Deliberate breaks: OBLIGATION_UNDERDECLARED, UNDECLARED_DEBT, EMI_DEBIT_MISSING and BOUNCE_HEAVY.
- **Served by the bureau itself:** `bureau_cases.json` is in the bureau's fixture shape, so `create_app(fixture_path=…)` serves these exact reports, and 503 for UNAVAILABLE. This is tested through FastAPI's TestClient.
- **applicant_id bug:** `BureauReportRequest.applicant_id` rejects names with spaces ("Synthetic Borrower"). All ids are space-free, and `bureau_mapping.csv` maps them to display names. A test pins the bug.
- **Id format mismatch:** the bureau's `BUR-…` report ids don't match the contracts' `SYN-[A-Z]{2,6}-…` pattern. `report_ref_contract` (`SYN-BUR-…`) is the alias used in `ZenInput.bureau_report_id`.

### 4.4 Internal lists

- **`negative_list[]`:** `{pan, reason_code, listed_on, applicant_id_hint}`, plus 3 decoys.
- **`employer_caution_list[]`:** `{employer_name, category, reason}`, plus one entry nobody uses.

## 5. Scenarios and decision paths

Each applicant has one scenario. `expected_outcome_hint.decision_path` is:
- `APPROVE`, `COUNTER_OFFER` or `MORE_INFORMATION_REQUIRED`; or
- `<DECLINE|REFER|STOP|RE_PULL>:<reason category>`, where REFER means manual review.

`signals.py` recomputes the target signals under the DRAFT thresholds as a generation self-check. Tests prove four things:
- CLEAN_PRIME and every APPROVE applicant raise nothing.
- Each failure scenario raises its target.
- Nothing fires outside `primary ∪ v2 refs ∪ also_triggers`.
- Every required decision path is present.

<!-- BEGIN:scenario-table (generated) -->
| Scenario | Groups | Expected path(s) | Primary PL rules | v2 refs | Count (200) |
|---|---|---|---|---|---|
| CLEAN_PRIME | ABCDEFGHIJ | APPROVE | - | - | 10 |
| UNDER_21 | A | DECLINE:ELIGIBILITY | PL-001 | E01 | 2 |
| OVER_AGE_AT_MATURITY | AH | DECLINE:ELIGIBILITY | PL-002, PL-073 | E02 | 2 |
| NON_RESIDENT | A | DECLINE:ELIGIBILITY | PL-003 | E03 | 2 |
| SALARY_IRREGULAR | BI | REFER:INCOME | PL-010, PL-011, PL-084 | - | 2 |
| INELIGIBLE_EMPLOYER_CATEGORY | A | REFER:EMPLOYMENT | PL-005 | E07 | 2 |
| IDENTITY_INCOMPLETE | AJ | MORE_INFORMATION_REQUIRED | PL-006, PL-096 | G06, K03 | 2 |
| DUPLICATE_APPLICANT | AJ | STOP:FRAUD | PL-007 | X03 | 2 |
| SHARED_CONTACT | J | REFER:FRAUD | PL-007, PL-098 | X04 | 2 |
| LOW_INCOME | B | DECLINE:INCOME | PL-008 | E08 | 2 |
| PAYSLIP_BANK_MISMATCH | BJ | REFER:INCOME | PL-009, PL-012, PL-017, PL-092 | I01 | 2 |
| INCOME_DROP | BI | REFER:INCOME | PL-010, PL-011, PL-018, PL-084 | - | 2 |
| SALARY_MISSING_MONTH | BI | REFER:INCOME | PL-012, PL-078 | I02 | 2 |
| EMPLOYER_NAME_MISMATCH | BI | REFER:INCOME | PL-012, PL-017 | I03 | 2 |
| PROBATION_SHORT_TENURE | B | REFER:EMPLOYMENT | PL-014, PL-016 | E09 | 2 |
| CONTRACT_EMPLOYMENT | B | REFER:EMPLOYMENT | PL-016, PL-013 | - | 2 |
| EMPLOYMENT_GAP | B | REFER:EMPLOYMENT | PL-013, PL-015 | E10 | 2 |
| BUREAU_NO_HIT | C | REFER:NO_HIT | PL-019, PL-027 | C02 | 2 |
| BUREAU_THIN_FILE | CD | REFER:THIN_FILE | PL-026, PL-031 | C02, C03 | 2 |
| BUREAU_STALE_REPORT | C | RE_PULL:STALE_REPORT | PL-024 | G03 | 2 |
| BUREAU_IDENTITY_MISMATCH | C | REFER:BUREAU_DATA | PL-020 | G04 | 2 |
| BUREAU_INCOMPLETE | C | REFER:BUREAU_DATA | PL-028 | G05 | 2 |
| BUREAU_UNAVAILABLE | C | REFER:BUREAU_DATA | PL-019 | G02 | 2 |
| NAME_MISMATCH_PAN | CJ | REFER:KYC | PL-021, PL-094 | K02 | 2 |
| NAME_MISMATCH_BUREAU | C | REFER:KYC | PL-021, PL-020 | K02 | 2 |
| NAME_MISMATCH_BANK | JI | REFER:KYC | PL-094, PL-097 | K02 | 2 |
| DOB_MISMATCH_PAN | CJ | REFER:KYC | PL-022, PL-094 | K03 | 2 |
| DOB_MISMATCH_BUREAU | C | REFER:KYC | PL-022 | K03 | 2 |
| ADDRESS_MISMATCH_BUREAU | C | REFER:KYC | PL-023 | - | 2 |
| DUPLICATE_TRADELINE | C | REFER:BUREAU_DATA | PL-025 | G05 | 2 |
| LOW_SCORE | D | DECLINE:CREDIT_SCORE | PL-029 | C01 | 2 |
| HIGH_UTILISATION | D | REFER:CREDIT_BEHAVIOUR | PL-036, PL-037 | C16 | 2 |
| NEW_ACCOUNTS_STACKING | DF | REFER:CREDIT_BEHAVIOUR | PL-035, PL-055, PL-056 | C14, C15 | 2 |
| DPD_30 | E | REFER:DELINQUENCY | PL-040, PL-041, PL-051 | C04 | 2 |
| DPD_60 | E | DECLINE:DELINQUENCY | PL-042, PL-044, PL-045 | C05 | 2 |
| DPD_90 | E | DECLINE:DELINQUENCY | PL-043 | C06 | 2 |
| WRITTEN_OFF | E | DECLINE:DELINQUENCY | PL-048 | C09 | 2 |
| SETTLED | E | DECLINE:DELINQUENCY | PL-047 | C09 | 2 |
| ENQUIRY_BURST | F | REFER:CREDIT_BEHAVIOUR | PL-052, PL-053, PL-054, PL-057 | C11, C12, C13 | 2 |
| FOIR_BREACH | G | COUNTER_OFFER | PL-061, PL-062, PL-063, PL-064 | A01 | 2 |
| RESIDUAL_INCOME_LOW | G | REFER:AFFORDABILITY | PL-065 | A03 | 2 |
| OBLIGATION_UNDERDECLARED | GB | REFER:AFFORDABILITY | PL-058, PL-060, PL-017 | I08 | 2 |
| PURPOSE_NOT_OFFERED | H | DECLINE:PRODUCT | PL-076 | P06 | 2 |
| PURPOSE_OVER_CAP | H | REFER:PRODUCT | PL-070 | P01, P05 | 2 |
| AMOUNT_BELOW_MIN | H | DECLINE:PRODUCT | PL-069 | E04 | 2 |
| TENURE_OUT_OF_RANGE | H | DECLINE:PRODUCT | PL-071, PL-072 | E06 | 2 |
| BOUNCE_HEAVY | I | DECLINE:BANK_CONDUCT | PL-081, PL-046 | I05 | 2 |
| CASH_HEAVY | I | REFER:BANK_CONDUCT | PL-083, PL-085 | I07 | 2 |
| NEGATIVE_BALANCE | I | REFER:BANK_CONDUCT | PL-080, PL-079 | I06 | 2 |
| UNDECLARED_DEBT | IG | REFER:BANK_CONDUCT | PL-086, PL-082 | I08 | 2 |
| SALARY_REVERSAL | I | REFER:BANK_CONDUCT | PL-087 | I02 | 2 |
| EMI_DEBIT_MISSING | I | REFER:BANK_CONDUCT | PL-082 | - | 2 |
| MISSING_DOCUMENTS | J | MORE_INFORMATION_REQUIRED | PL-088, PL-096 | K05 | 2 |
| CONSENT_MISSING | J | STOP:CONSENT | PL-095 | G01 | 2 |
| STATEMENT_TAMPERED | J | REFER:DOCUMENT | PL-093, PL-090 | K09 | 2 |
| DUPLICATE_DOCUMENT | J | REFER:FRAUD | PL-091, PL-092 | K09 | 2 |
| NEGATIVE_LIST_HIT | J | DECLINE:FRAUD | PL-098 | X01 | 2 |
| EMPLOYER_CAUTION_LIST | BJ | REFER:FRAUD | PL-013, PL-098 | X05 | 2 |
| OCR_LOW_CONFIDENCE | J | REFER:DOCUMENT | PL-089 | K07 | 2 |
| PAN_FORMAT_INVALID | J | REFER:KYC | PL-102, PL-094 | K01 | 2 |
| DOCUMENT_STALE | J | REFER:DOCUMENT | PL-103 | K06 | 2 |
| COOLING_OFF_RECENT_DECLINE | J | REFER:FRAUD | PL-114 | X02 | 2 |
| SHORT_ADDRESS_TENURE | A | REFER:ELIGIBILITY | PL-101 | E11 | 2 |
| EMPLOYER_CHURN | B | REFER:EMPLOYMENT | PL-013 | - | 2 |
| CURRENT_DEFAULT | E | DECLINE:DELINQUENCY | PL-039, PL-040 | C08 | 2 |
| SPEND_EXCEEDS_INFLOW | I | REFER:BANK_CONDUCT | PL-106 | I04 | 2 |
| PURPOSE_PRODUCT_MISMATCH | H | REFER:PRODUCT | PL-112 | - | 2 |
| HOME_QUOTE_BELOW_AMOUNT | HJ | REFER:PRODUCT | PL-111 | P03 | 2 |
| EDU_ADMISSION_MISSING | HJ | MORE_INFORMATION_REQUIRED | PL-111, PL-088 | P02 | 2 |
| SIG_SKILLED_FORGERY | J | REFER:SIGNATURE | PL-090, PL-098 | K08 | 2 |
| SIG_RANDOM_FORGERY | J | REFER:SIGNATURE | PL-090, PL-098 | K08 | 2 |
| SIG_MISSING | J | MORE_INFORMATION_REQUIRED | PL-088, PL-096 | K05, K08 | 2 |
| MATRIX_APPROVE | GH | APPROVE, COUNTER_OFFER, REFER:PRODUCT | PL-063, PL-064, PL-069, PL-070 | A01, P05 | 16 |
| MATRIX_COUNTER_OFFER | GH | COUNTER_OFFER, REFER:PRODUCT | PL-066, PL-067, PL-068 | A01, A05, P05 | 16 |
| MATRIX_DECLINE | DEH | DECLINE:CREDIT_SCORE, DECLINE:DELINQUENCY | PL-029, PL-043, PL-048 | C01, C06, C09 | 16 |

Applicants per amount band and outcome (200-applicant run):

| Band | APPROVE | COUNTER_OFFER | DECLINE | MORE_INFORMATION_REQUIRED | REFER | RE_PULL | STOP |
|---|---|---|---|---|---|---|---|
| B1 | 8 | 4 | 17 | 1 | 35 | 0 | 0 |
| B2 | 7 | 6 | 15 | 4 | 37 | 2 | 3 |
| B3 | 4 | 7 | 10 | 3 | 24 | 0 | 1 |
| B4 | 0 | 0 | 4 | 0 | 8 | 0 | 0 |

Applicants per purpose: crypto_investment 1, higher_education 50, home_renovation 52, medical_emergency 46, speculative_trading 1, wedding 50.
<!-- END:scenario-table -->

## 6. ZEN input coverage

**Coverage target:** every input name referenced by:
- `USER_RULE_CATALOGUE_PL.yaml` (PL-001..PL-099 inputs);
- catalogue v2 (`contracts/catalogue_v2/rules.py` on the rules worktree: PL-100..PL-128 inputs and per-rule extras);
- the 30 `ZenInput` data points (`contracts/zen.py` @ 7789416).

The snapshot is vendored as `synthetic_data/saral_kyc_bank/zen_input_catalogue.py`. `docs/saral/rule_catalogue.v2.json`, `contracts/data_dictionary.json`, `PRODUCT_MATRIX.md`, `product_matrix.json` and `ZEN_INPUT_COVERAGE.md` did not exist when it was taken. Re-snapshot when they land.

**Classes:**
- **APPLICANT:** must be present for every applicant.
- **POLICY:** a catalogue parameter, not per-applicant data.
- **ZEN:** produced by ZEN itself (`rule_results`, `policy_version`).

**What `validate()` checks:**
- It fails when an APPLICANT input is absent, or null where the applicant's scenario does not explain the null.
- `test_every_zen_input_present_for_every_applicant` runs it on all 200 applicants.
- `test_input_classification_is_total_and_doc_table_complete` checks every catalogue name appears in the table below.

**Envelopes:** `zen_input_envelope(app)` builds a full `saral-zen-input/1` document. All 198 product applicants validate against the contracts' `ZenInput` (run with `SARAL_CONTRACTS_DIR=<contracts worktree>`). The 2 PURPOSE_NOT_OFFERED applicants have no product, so they get no envelope.

**Notes:**
- `suit_filed_status` and `restructured_account_count` are present, but always false/0: bureau-report/1 can't carry them (PL-049/050 are deferred).
- `total_overdue_amount` is derived (3 × EMI on DEFAULT accounts) because bureau-report/1 has no overdue field.
- `interest_rate`/`applicant_pricing_band` are a dataset assumption by risk grade (A 13%, B 16%, C 21%, NTC 24%) inside Bajaj's 10–30.5%.
- OCR confidences and signature similarity are **simulated**. Real values come from running the OCR chain on `--render-docs` images.

<!-- BEGIN:coverage-table (generated) -->
| Input | Class | Rules / data point | Dataset origin | Null allowed | Present |
|---|---|---|---|---|---|
| `active_account_count` | APPLICANT | PL-026, PL-033 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `active_credit_accounts` | APPLICANT | PL-058 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `active_personal_loan_count` | APPLICANT | PL-033(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `actual_emi_debits` | APPLICANT | PL-082 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `address_match_status` | APPLICANT | PL-023 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `address_similarity` | APPLICANT | PL-023(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; no bureau identity on file | 200/200 |
| `age_at_application` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `age_at_assessment` | APPLICANT | PL-001(extra) | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `age_at_maturity` | APPLICANT | PL-002(extra), PL-073, ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `amount_band` | APPLICANT | PL-120, PL-121, PL-122, PL-123 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `anomaly_indicators` | APPLICANT | PL-085 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `applicant_address` | APPLICANT | PL-023 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `applicant_city` | APPLICANT | PL-008 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `applicant_dob` | APPLICANT | PL-022 | application, declared data, identity/e-KYC/PAN, or computed from them | IDENTITY_INCOMPLETE | 200/200 |
| `applicant_identifier` | APPLICANT | PL-007 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `applicant_identity` | APPLICANT | PL-020 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `applicant_name` | APPLICANT | PL-021 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `applicant_pricing_band` | APPLICANT | PL-075 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `approved_card_obligation_method` | POLICY | PL-059 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_enquiry_threshold` | POLICY | PL-053 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_exposure_limit` | POLICY | PL-077 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_interest_rate_range` | POLICY | PL-075 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_maximum_foir` | POLICY | PL-064, PL-067 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_minimum_score` | POLICY | PL-029 | rule catalogue parameter (not per applicant) | - | n/a |
| `approved_utilisation_threshold` | POLICY | PL-037 | rule catalogue parameter (not per applicant) | - | n/a |
| `assessment_date` | APPLICANT | PL-001, PL-002, PL-014, PL-024, PL-031, PL-103, PL-114, PL-127 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `assessment_period` | APPLICANT | PL-010 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `assessment_rate` | APPLICANT | PL-107 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `assessment_window` | APPLICANT | PL-041, PL-042, PL-043 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `average_monthly_balance` | APPLICANT | PL-079 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `average_monthly_income` | APPLICANT | PL-010(extra) | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `bank_salary_credit_avg` | APPLICANT | PL-009(extra), ZenInput | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `bank_transactions` | APPLICANT | PL-078, PL-079, PL-080, PL-081, PL-082, PL-083, PL-084, PL-085, PL-087 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `bureau_accounts` | APPLICANT | PL-025, PL-032(extra), PL-033, PL-034, PL-035, PL-038, PL-039, PL-040, PL-047, PL-048, PL-049, PL-050, PL-055 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `bureau_address` | APPLICANT | PL-023 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts); no bureau identity on file | 200/200 |
| `bureau_data_quality_flags` | APPLICANT | PL-028 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `bureau_dob` | APPLICANT | PL-022 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts); no bureau identity on file | 200/200 |
| `bureau_enquiries` | APPLICANT | PL-052, PL-053, PL-054 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `bureau_identity` | APPLICANT | PL-020 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts); no bureau identity on file | 200/200 |
| `bureau_match_status` | APPLICANT | PL-027, PL-118, PL-124 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `bureau_name` | APPLICANT | PL-021 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts); no bureau identity on file | 200/200 |
| `bureau_report_date` | APPLICANT | PL-024 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `bureau_report_status` | APPLICANT | PL-019, PL-027 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `bureau_score` | APPLICANT | PL-029, PL-120, PL-124 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `calculated_emi` | APPLICANT | PL-074 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `cash_deposit_percentage` | APPLICANT | PL-083 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `closed_account_count` | APPLICANT | PL-034 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `conflict_flags` | APPLICANT | PL-097 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `course_start_date` | APPLICANT | PL-127 | product details and documents (`product`) | null = none / not applicable to the product | 200/200 |
| `credit_card_balance` | APPLICANT | PL-059 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `credit_card_balances` | APPLICANT | PL-036 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `credit_card_payment_history` | APPLICANT | PL-051 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `credit_history_months` | APPLICANT | PL-026, PL-031 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `credit_score` | APPLICANT | ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `current_default_count` | APPLICANT | PL-040(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `current_exposure` | APPLICANT | PL-056 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `current_score` | APPLICANT | PL-030 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `date_of_birth` | APPLICANT | PL-001, PL-002 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `days_since_last_decline` | APPLICANT | PL-114 | internal lists, universe cross-check, `application_history` | null = none / not applicable to the product | 200/200 |
| `days_since_last_dpd` | APPLICANT | PL-045 | application, declared data, identity/e-KYC/PAN, or computed from them | null = none / not applicable to the product | 200/200 |
| `debit_credit_ratio` | APPLICANT | PL-106, ZenInput | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `debt_mismatch` | APPLICANT | PL-086 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `declared_income` | APPLICANT | PL-017, PL-092 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `declared_obligations` | APPLICANT | PL-086 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `declared_purpose` | APPLICANT | PL-112 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `declared_salary` | APPLICANT | PL-012 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `deductions` | APPLICANT | PL-009 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `dob_match_status` | APPLICANT | PL-022 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `document_age_days` | APPLICANT | PL-103 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `document_date` | APPLICANT | PL-103 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `document_hash` | APPLICANT | PL-091 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `document_integrity_result` | APPLICANT | PL-090 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `document_kind` | APPLICANT | PL-103 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `dpd_history` | APPLICANT | PL-040, PL-041, PL-042, PL-043, PL-044, PL-045 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `dpd_occurrence_count` | APPLICANT | PL-044 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `duplicate_document_result` | APPLICANT | PL-091 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `duplicate_match_result` | APPLICANT | PL-007 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `duplicate_tradeline_count` | APPLICANT | PL-025 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `eligible_amount` | APPLICANT | PL-068 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `eligible_employment_categories` | POLICY | PL-005 | rule catalogue parameter (not per applicant) | - | n/a |
| `eligible_loan_purposes` | POLICY | PL-076 | rule catalogue parameter (not per applicant) | - | n/a |
| `eligible_nationalities` | POLICY | PL-003 | rule catalogue parameter (not per applicant) | - | n/a |
| `email_hash` | APPLICANT | PL-115 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `employer_category` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employer_caution_list_hit` | APPLICANT | PL-116 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `employer_changes_24m` | APPLICANT | PL-013(extra) | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employer_history` | APPLICANT | PL-013 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employer_name` | APPLICANT | PL-105, PL-116 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employer_name_similarity` | APPLICANT | PL-105 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `employer_stability_indicator` | APPLICANT | PL-013 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_category` | APPLICANT | PL-005, PL-122 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_gap_months` | APPLICANT | PL-015 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_history` | APPLICANT | PL-015 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_months` | APPLICANT | PL-014, PL-122, ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_start_date` | APPLICANT | PL-014 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_status` | APPLICANT | PL-016 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `employment_type` | APPLICANT | PL-004, PL-005(extra), PL-016, PL-078(extra), PL-105, PL-117, PL-122 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `enquiries_6m` | APPLICANT | ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `enquiries_last_30_days` | APPLICANT | PL-052 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `enquiries_last_6_months` | APPLICANT | PL-053(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `enquiries_last_90_days` | APPLICANT | PL-053 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `enquiry_count` | APPLICANT | PL-057 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `evidence_comparison_results` | APPLICANT | PL-097 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `evidence_references` | APPLICANT | PL-099 | `documents`, `consents`, all evidence ids | never | 200/200 |
| `existing_emi_total` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `existing_monthly_obligations` | APPLICANT | PL-058, PL-062, PL-125 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `existing_obligations` | APPLICANT | PL-066, PL-067 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `expected_emi_debits` | APPLICANT | PL-082 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `exposure_growth_percentage` | APPLICANT | PL-056 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `extracted_identity_fields` | APPLICANT | PL-094 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `foir` | APPLICANT | PL-063, PL-064, PL-123, ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `fraud_indicators` | APPLICANT | PL-098 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `gross_income` | APPLICANT | PL-009 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `historical_exposure` | APPLICANT | PL-056 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `historical_income` | APPLICANT | PL-018 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `historical_scores` | APPLICANT | PL-030 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `identity_fields` | APPLICANT | PL-094 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `identity_match_status` | APPLICANT | PL-020, PL-094 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `identity_verification_status` | APPLICANT | PL-006 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `income_match_status` | APPLICANT | PL-017 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `income_reduction_percentage` | APPLICANT | PL-018 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `income_variance_ratio` | APPLICANT | PL-012(extra), ZenInput | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `income_variation` | APPLICANT | PL-011 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `independently_calculated_emi` | APPLICANT | PL-074 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `interest_rate` | APPLICANT | PL-061, PL-068, PL-074, PL-075(extra) | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `kyc_dob_match` | APPLICANT | PL-094(extra), ZenInput | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | IDENTITY_INCOMPLETE | 200/200 |
| `kyc_id_last4_match` | APPLICANT | PL-094(extra), ZenInput | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `kyc_name_match_score` | APPLICANT | PL-094(extra), ZenInput | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `last_decline_date` | APPLICANT | PL-114 | internal lists, universe cross-check, `application_history` | null = none / not applicable to the product | 200/200 |
| `last_dpd_date` | APPLICANT | PL-045 | application, declared data, identity/e-KYC/PAN, or computed from them | null = none / not applicable to the product | 200/200 |
| `loan_amount` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `loan_purpose` | APPLICANT | PL-076, PL-109, PL-110, PL-111, PL-125, PL-126, PL-127, PL-128 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `loan_tenure_months` | APPLICANT | PL-002 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `max_dpd_12m` | APPLICANT | PL-041(extra), PL-042(extra), PL-124, ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `max_dpd_24m` | APPLICANT | PL-043(extra), PL-124, ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `maximum_affordable_emi` | APPLICANT | PL-068 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `maximum_age_at_maturity` | POLICY | PL-002, PL-073 | rule catalogue parameter (not per applicant) | - | n/a |
| `maximum_loan_amount` | POLICY | PL-070 | rule catalogue parameter (not per applicant) | - | n/a |
| `maximum_report_age_days` | POLICY | PL-024 | rule catalogue parameter (not per applicant) | - | n/a |
| `maximum_tenure_months` | POLICY | PL-072 | rule catalogue parameter (not per applicant) | - | n/a |
| `min_ocr_confidence` | APPLICANT | ZenInput | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `minimum_age` | POLICY | PL-001 | rule catalogue parameter (not per applicant) | - | n/a |
| `minimum_confidence` | POLICY | PL-089 | rule catalogue parameter (not per applicant) | - | n/a |
| `minimum_income` | POLICY | PL-008 | rule catalogue parameter (not per applicant) | - | n/a |
| `minimum_loan_amount` | POLICY | PL-069 | rule catalogue parameter (not per applicant) | - | n/a |
| `minimum_tenure_months` | POLICY | PL-071 | rule catalogue parameter (not per applicant) | - | n/a |
| `missed_payment_count` | APPLICANT | PL-051 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `monthly_income_history` | APPLICANT | PL-010, PL-011 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `monthly_income_variance` | APPLICANT | PL-084 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `monthly_net_income` | APPLICANT | PL-008, PL-009, PL-063, PL-065, PL-066, PL-067, PL-077(extra), PL-108, PL-125 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `months_at_current_address` | APPLICANT | PL-101 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `name_match_status` | APPLICANT | PL-021 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `name_similarity` | APPLICANT | PL-021(extra) | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `nationality` | APPLICANT | PL-003, ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `negative_balance_count` | APPLICANT | PL-080 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `negative_list_hit` | APPLICANT | PL-113 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `net_monthly_income` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `observed_recurring_debits` | APPLICANT | PL-086 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `observed_salary_credits` | APPLICANT | PL-012 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `ocr_extracted_income` | APPLICANT | PL-092 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `ocr_field_confidence` | APPLICANT | PL-089 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `oldest_account_date` | APPLICANT | PL-031 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `other_monthly_obligations` | APPLICANT | PL-060, PL-062(extra), PL-125 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `pan_format_valid` | APPLICANT | PL-102 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `pan_hash` | APPLICANT | PL-113, PL-114 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `payee_account_present` | APPLICANT | PL-128 | product details and documents (`product`) | never | 200/200 |
| `payment_regularity_indicator` | APPLICANT | PL-046 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `payslip_count` | APPLICANT | PL-121 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `payslip_net_avg` | APPLICANT | PL-009(extra), ZenInput | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `phone_hash` | APPLICANT | PL-115 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `policy_version` | ZEN | PL-099 | produced by ZEN (decision trace) | - | n/a |
| `principal` | APPLICANT | PL-074 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `product_purpose` | APPLICANT | PL-112 | application, declared data, identity/e-KYC/PAN, or computed from them | PURPOSE_NOT_OFFERED | 200/200 |
| `property_ownership` | APPLICANT | PL-127 | product details and documents (`product`) | null = none / not applicable to the product | 200/200 |
| `proposed_emi` | APPLICANT | PL-061, PL-062, PL-066, PL-079(extra), ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `purpose` | APPLICANT | ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `purpose_evidence_amount` | APPLICANT | PL-126 | product details and documents (`product`) | no product document | 200/200 |
| `purpose_evidence_status` | APPLICANT | PL-111 | product details and documents (`product`) | never | 200/200 |
| `recent_income` | APPLICANT | PL-018 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `recent_loan_application_count` | APPLICANT | PL-054 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `recent_open_account_count` | APPLICANT | PL-035 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `recent_unsecured_account_count` | APPLICANT | PL-055 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `recently_opened_account_count` | APPLICANT | PL-057 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `recorded_consents` | APPLICANT | PL-095 | `documents`, `consents`, all evidence ids | never | 200/200 |
| `repayment_history` | APPLICANT | PL-046 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `reported_card_emi` | APPLICANT | PL-059(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `requested_amount` | APPLICANT | PL-061, PL-069, PL-070, PL-108, PL-109, PL-118, PL-119, PL-125, PL-126 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `required_consents` | POLICY | PL-095 | rule catalogue parameter (not per applicant) | - | n/a |
| `required_docs_present` | APPLICANT | ZenInput | `documents`, `consents`, all evidence ids | never | 200/200 |
| `required_documents` | APPLICANT | PL-088 | `documents`, `consents`, all evidence ids | never | 200/200 |
| `required_fields` | POLICY | PL-096 | rule catalogue parameter (not per applicant) | - | n/a |
| `required_identity_fields` | POLICY | PL-006 | rule catalogue parameter (not per applicant) | - | n/a |
| `residual_income` | APPLICANT | PL-065 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `restructured_account_count` | APPLICANT | PL-050 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `return_count` | APPLICANT | PL-081 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `review_flags` | APPLICANT | PL-098, PL-123 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `risk_grade` | APPLICANT | PL-125 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `rule_results` | ZEN | PL-099 | produced by ZEN (decision trace) | - | n/a |
| `salary_credit_consistency` | APPLICANT | PL-078 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `salary_credit_employer` | APPLICANT | PL-105 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `salary_credit_months` | APPLICANT | PL-078(extra), ZenInput | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `salary_match_status` | APPLICANT | PL-012 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `salary_reversal_indicator` | APPLICANT | PL-087 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `score_trend` | APPLICANT | PL-030 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE | 200/200 |
| `secured_account_count` | APPLICANT | PL-032 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `settled_account_count` | APPLICANT | PL-047 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `settled_within_lookback` | APPLICANT | PL-047(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `shared_contact_pan_count` | APPLICANT | PL-115 | internal lists, universe cross-check, `application_history` | never | 200/200 |
| `signature_anomaly_score` | APPLICANT | PL-104 | signature specimens + simulated screening (`signature`) | SIG_MISSING | 200/200 |
| `signature_crop_sha256` | APPLICANT | PL-104 | signature specimens + simulated screening (`signature`) | SIG_MISSING | 200/200 |
| `signature_present` | APPLICANT | PL-104 | signature specimens + simulated screening (`signature`) | never | 200/200 |
| `signature_similarity` | APPLICANT | PL-104, ZenInput | signature specimens + simulated screening (`signature`) | SIG_MISSING | 200/200 |
| `statement_integrity_result` | APPLICANT | PL-093 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `statement_months` | APPLICANT | PL-121 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `statement_validation_flags` | APPLICANT | PL-093 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `submitted_documents` | APPLICANT | PL-088 | `documents`, `consents`, all evidence ids | never | 200/200 |
| `suit_filed_status` | APPLICANT | PL-049 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `supplied_fields` | APPLICANT | PL-096 | `documents`, `consents`, all evidence ids | never | 200/200 |
| `supplied_identity_fields` | APPLICANT | PL-006(extra) | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `supported_employment_types` | POLICY | PL-004 | rule catalogue parameter (not per applicant) | - | n/a |
| `tampering_flags` | APPLICANT | PL-090 | payslips + simulated OCR (`employment.payslips`, `ocr_extractions`) | never | 200/200 |
| `tenure_months` | APPLICANT | PL-061, PL-068, PL-071, PL-072, PL-074, PL-110, PL-125, ZenInput | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `total_credit_limits` | APPLICANT | PL-036 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `total_credits` | APPLICANT | PL-106 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `total_debits` | APPLICANT | PL-106 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `total_existing_exposure` | APPLICANT | PL-077 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `total_experience_months` | APPLICANT | PL-100 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `total_monthly_obligations` | APPLICANT | PL-062, PL-063, PL-065 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `total_overdue_amount` | APPLICANT | PL-039 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `total_unsecured_exposure` | APPLICANT | PL-038 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `treatment_date` | APPLICANT | PL-127 | product details and documents (`product`) | null = none / not applicable to the product | 200/200 |
| `unresolved_conflicts` | APPLICANT | PL-098 | application, declared data, identity/e-KYC/PAN, or computed from them | never | 200/200 |
| `unsecured_account_count` | APPLICANT | PL-032 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `utilisation_ratio` | APPLICANT | PL-036, PL-037 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE; NO_HIT/THIN_FILE (no accounts) | 200/200 |
| `verified_income` | APPLICANT | PL-017, PL-092 | bank statement (`bank_statements.jsonl`) | never | 200/200 |
| `wedding_date` | APPLICANT | PL-127 | product details and documents (`product`) | null = none / not applicable to the product | 200/200 |
| `writeoff_settlement_24m` | APPLICANT | ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `writeoff_settlement_older` | APPLICANT | ZenInput | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `written_off_account_count` | APPLICANT | PL-048 | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
| `written_off_within_lookback` | APPLICANT | PL-048(extra) | bureau report (`bureau_cases.json`) + `bureau_link.history_sidecar`/`identity_on_file` | BUREAU_UNAVAILABLE | 200/200 |
<!-- END:coverage-table -->

## 7. Signatures and the OCR hook

The specimens follow feat/saral-ocr-paddle-signature @ 0b5dede (`generate_synthetic_docs.py`, `signature_screening.py`):
- **Writer:** 2–4 Catmull-Rom strokes plus a flourish.
- **Genuine:** jitter 3.5, ±4°, 0.92–1.08 scale.
- **Skilled forgery:** jitter 7, a different pen, one stroke redrawn.
- **Random forgery:** another writer.
- **Missing:** a blank box.

Strokes and render parameters live in JSON.

`--render-docs` writes, per applicant:
- `pan_card.png`, with the reference signature in box (640,440,960,580);
- `aadhaar_card.png`, masked;
- `bank_statement_p1.png`;
- `nach_mandate.png`, with the form signature in box (760,600,1160,780).

Each image has a ground-truth JSON with `signature_box`, `signature_present` and `signature_label`, so the OCR chain can crop and compare. Images use banner mode: a corner banner and red frame, no diagonal watermark. Signature similarity is a screening signal only: REFER, never decline.

## 8. LMS (Frappe) landing fields: PROPOSAL

The aim is to store references, hashes and masked values in the LMS, and keep raw identifiers and transactions in the evidence store.

| Data | Frappe target | Notes |
|---|---|---|
| `applicant_id` | Loan Application `custom_external_ref` (*existing*) | Also the bureau applicant_id |
| `display_name` | Customer `customer_name`, Borrower Profile `full_name` (*existing*) | Never use it as the bureau id |
| phone, email, employment_type, employer, months | Borrower Profile (*existing*) | |
| Declared income/obligations | `custom_monthly_income`, `custom_monthly_obligations` (*existing*) | |
| Purpose, amount, tenure | `custom_loan_purpose`, `loan_amount`, `repayment_periods` (*existing*) | |
| Product | Loan Application `loan_product` (*existing*) → one Loan Product per `product_id` (PROPOSED) | |
| Amount band, expected path | Not stored; derived / test fixture only | |
| Bureau score | `custom_credit_score` (*existing*) | Null when unavailable, never 0 |
| DOB | NEW Borrower Profile `date_of_birth` | |
| PAN | NEW `pan_masked` + `pan_hash` | Raw PAN only in the evidence store |
| Aadhaar | NEW `aadhaar_last4` + `ekyc_ref` | **Never the full number** |
| Nationality, residency, city, PIN, months at address | NEW Borrower Profile fields | |
| Employer category, joining date, total experience | NEW Borrower Profile fields | |
| Bank statement | NEW `custom_bank_statement_id` + `custom_bank_statement_sha256` | |
| Bureau report | NEW `custom_bureau_report_id` | Report itself in Loan Decision Evidence `record_json` (*existing*) |
| Product documents | NEW child table `custom_product_documents {kind, document_id, evidence_amount, sha256}` | |
| Signature screening | NEW `custom_signature_screening_ref` | |
| Consents | `consent_terms`, `consent_privacy`, `consent_at` (*existing*) + NEW `consent_bureau_pull`, `consent_aa_fetch` | |

## 9. Known limitations and follow-ups

- **Bureau generator limits:** the bureau generator can't express 60/90 DPD, default, write-off, settlement, enquiry burst, stacking, duplicate tradeline or aged history natively. Those are documented overlays (`origin: derived_overlay`).
- **Native pass history sits on a boundary:** native pass history opens every account exactly 183 days before `as_of`, on the C03/C14 boundaries. Most scenarios use `AGED`; the native-history ones list C03/C14 under `also_triggers`.
- **Purpose mismatch can't reach ZEN:** the contracts' `ZenInput` rejects a `purpose` data point that differs from `product_id`. PURPOSE_PRODUCT_MISMATCH therefore exposes the declared purpose only in `zen_inputs.declared_purpose` vs `product_purpose`. PL-112 can't be evaluated from a `ZenInput` alone.
- **Hex hashes and the raw-identifier check:** the contracts' `NoRawIdentifiers` Aadhaar pattern matches any 12-digit run, so hex hashes and numeric id bodies can trip it. This dataset avoids both; the contract owner may want to narrow the pattern.
- **Simulated values:** OCR confidence, signature similarity and risk-grade pricing are simulated. PL-125 grade-based offer sizing is not modelled.
- **Sample coverage:** the 20-applicant committed sample covers 20 scenarios. Use `--count 200` for the full mix.
