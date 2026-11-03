"""Data dictionary: one row per distinct input field across every rule in the v2 catalogue.

Columns of TABLE (pipe-separated):
  name | type | unit | source | mvp_supply | frappe_today | pii | storage | derived_from | formula / note

- source: APPLICATION | SYNTHETIC_BUREAU | SYNTHETIC_BUREAU_V2 | SYNTHETIC_PAN | SYNTHETIC_AADHAAR | SYNTHETIC_BANK | OCR |
  DERIVED | INTERNAL_LIST | FRAPPE_HISTORY | EXTERNAL | POLICY_PARAMETER | SYSTEM
  (POLICY_PARAMETER and SYSTEM are added to the brief's list: thresholds the user's YAML lists as inputs, and
  clock/trace values the engine supplies itself.)
- mvp_supply: FRONTEND:<field_id> (contracts/frontend_fields.json) | <SOURCE>:<path> (contracts/synthetic_sources.json)
  | DERIVED | POLICY | SYSTEM | FRAPPE_HISTORY | NONE. SYNTHETIC_BUREAU_V2 and NONE are not available in the MVP.
- frappe_today: where the LMS holds it at 716db49 (doctype.field) or MISSING. BP = Borrower Profile, LA = Loan
  Application, LDE = Loan Decision Evidence. LA native fields are Frappe Lending version-16; only the ones the portal
  writes (api/applications.py) are verified.
- storage: LMS = LMS_SNAPSHOT, REF = SOURCE_REFERENCE, NEVER = NEVER_STORE.
"""

STORAGE = {"LMS": "LMS_SNAPSHOT", "REF": "SOURCE_REFERENCE", "NEVER": "NEVER_STORE"}
FRAPPE_ABBR = {"BP.": "Borrower Profile.", "LA.": "Loan Application.", "LDE.": "Loan Decision Evidence."}

PII = {
    "NONE": "Not personal. No masking.",
    "PERSONAL": "Personal data. Borrower and authorised staff only; never in logs, traces sent to observability, or LLM prompts.",
    "CONTACT": "Contact data. As PERSONAL; cross-applicant matching uses a salted sha256 hash only.",
    "GOV_ID": "Government identifier. PAN as XXXXX1234X, Aadhaar as last 4 digits; the full number is NEVER_STORE.",
    "FINANCIAL": "Financial data. Underwriter role; borrower sees own values; LLM sees only Decision Evidence values; never in logs.",
    "CREDIT": "Bureau data (synthetic). Underwriter role; the borrower is told categories, never bureau line items by the agent.",
    "INTERNAL_RISK": "Risk signal. Underwriter role only; never shown to the borrower or used in borrower-facing text.",
    "BIOMETRIC_LIKE": "Signature-derived. LMS keeps presence, crop hash and scores only; the image stays at the source with a short TTL.",
}

RETENTION = {
    "LMS_SNAPSHOT": "Kept immutable with the decision record (ADR-0010 #3, owner 2026-11-03 23:58 IST). Disbursed loan: at least 5 "
                    "years after the business relationship ends (loan closure). Basis: RBI (NBFC – Know Your Customer) Directions, 2025 "
                    "para 47(2), identification records 'for at least five years after the business relationship has ended', and para "
                    "47(1), transaction records 'for at least five years from the date of transaction' (rbi.org.in id=12943). Declined "
                    "or withdrawn application: 5 years from the decision date, which is SARAL'S CHOICE (no RBI period was found for "
                    "applications that never became a relationship). The earlier 8-year proposal is withdrawn; it had no RBI basis.",
    "SOURCE_REFERENCE": "Raw payload stays at the synthetic API / object store (PROPOSED 180-day TTL for synthetic data); the LMS "
                        "keeps reference id, sha256 and fetch time as LMS_SNAPSHOT. For digital lending RBI sets no period: the NBFC "
                        "must define and publish 'the length of time for which data can be stored' and a 'data destruction protocol' "
                        "(RBI (NBFC – Credit Facilities) Directions, 2025 para 14(2), rbi.org.in id=12957); data stays on servers "
                        "in India (para 14(4)).",
    "NEVER_STORE": "Held in memory for the request only; never written to the LMS, logs or traces.",
}

B = "SYNTHETIC_BUREAU:"
B2 = "SYNTHETIC_BUREAU_V2:"
K = "SYNTHETIC_BANK:"

TABLE = r"""
active_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status|PRE-BUREAU: count(accounts[] where status == ACTIVE)
active_credit_accounts|list|accounts|SYNTHETIC_BUREAU|B:accounts[].monthly_obligation|MISSING (LDE.record_json keeps only a bureau summary)|CREDIT|REF||accounts[] where status == ACTIVE
active_personal_loan_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].account_type,B:accounts[].status|PRE-BUREAU: count(PERSONAL_LOAN and ACTIVE)
actual_emi_debits|int|count|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category|PRE-BANK: EMI debits observed per expected loan
address_match_status|enum|MATCH/MISMATCH/UNAVAILABLE|DERIVED|DERIVED|MISSING|PERSONAL|LMS|address_similarity|PRE-KYC
address_similarity|float|0..1|DERIVED|DERIVED|MISSING|PERSONAL|LMS|applicant_address,bureau_address|PRE-KYC: token-set ratio
age_at_assessment|int|years|DERIVED|DERIVED|MISSING|PERSONAL|LMS|date_of_birth,assessment_date|PRE-AGE: completed years
age_at_maturity|int|years|DERIVED|DERIVED|MISSING|PERSONAL|LMS|age_at_assessment,tenure_months|PRE-AGE: age_at_assessment + ceil(tenure_months/12)
amount_band|enum|B1..B4|DERIVED|DERIVED|MISSING|NONE|LMS|requested_amount|PL-119
anomaly_indicators|list|codes|EXTERNAL|NONE|MISSING|INTERNAL_RISK|LMS||No screening service exists (PL-085 deferred)
applicant_address|object|text|APPLICATION|FRONTEND:current_address|MISSING|PERSONAL|LMS||Current address from step 3
applicant_city|str|city|APPLICATION|FRONTEND:current_city|MISSING|PERSONAL|LMS||From PIN lookup, user-correctable
applicant_dob|date|date|APPLICATION|FRONTEND:date_of_birth|MISSING|PERSONAL|LMS||Alias of date_of_birth
applicant_identifier|str|hash|DERIVED|DERIVED|MISSING (seeded Customer name is used today)|GOV_ID|LMS|pan_hash|PRE-ID: pan_hash
applicant_identity|object||DERIVED|DERIVED|BP.full_name (name only)|PERSONAL|LMS|applicant_name,date_of_birth,pan_hash|PRE-ID: name + DOB + pan_hash bundle
applicant_name|str||APPLICATION|FRONTEND:full_name|BP.full_name; LA.applicant_name|PERSONAL|LMS||
applicant_pricing_band|enum||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||Bajaj publishes no per-applicant pricing band (UNVERIFIED); stays empty
approved_card_obligation_method|str||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-059 parameter
approved_enquiry_threshold|int|count|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-053 parameter
approved_exposure_limit|float|INR|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-077: multiple x monthly_net_income
approved_interest_rate_range|list|per annum|POLICY_PARAMETER|POLICY|Loan Product.rate_of_interest (single value, not a range)|NONE|LMS||PL-075 parameter
approved_maximum_foir|float|ratio|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-064/PL-067 parameter
approved_minimum_score|int|score|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-029 parameter
approved_utilisation_threshold|float|ratio|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-037 parameter
assessment_date|date||SYSTEM|SYSTEM|LDE.evaluated_at (decision time)|NONE|LMS||Decision clock, Asia/Kolkata date
assessment_period|int|months|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-010 parameter
assessment_rate|float|per annum|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-107 parameter (A-05)
assessment_window|int|months|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-041..PL-043 parameter
average_monthly_balance|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].balance_after,K:transactions[].date|PRE-BANK: mean end-of-day balance per month
average_monthly_income|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_income_history|PL-010
bank_salary_credit_avg|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category,K:transactions[].amount|PRE-BANK: mean SALARY credits per month; fallback OCR bank_statement.salary_credits / salary_credit_months
bank_transactions|list|transactions|SYNTHETIC_BANK|K:transactions[].txn_id|MISSING|FINANCIAL|REF||Raw AA-style transactions; LMS keeps consent id, sha256, fetch time
bureau_accounts|list|accounts|SYNTHETIC_BUREAU|B:accounts[].account_id|MISSING|CREDIT|REF||Raw accounts[]; LMS keeps report_id, sha256, fetched_at
bureau_address|object||SYNTHETIC_BUREAU_V2|B2:subject.addresses[].city|MISSING|PERSONAL|REF||Not in bureau-report/1
bureau_data_quality_flags|list|issues|SYNTHETIC_BUREAU|DERIVED|LDE.record_json (bureau.data_quality)|NONE|LMS|B:data_quality.issues[].code,B:data_quality.issues[].severity|Codes + severity
bureau_dob|date||SYNTHETIC_BUREAU_V2|B2:subject.dob|MISSING|PERSONAL|REF||Not in bureau-report/1
bureau_enquiries|list|enquiries|SYNTHETIC_BUREAU|B:enquiries[].enquired_on|MISSING|CREDIT|REF||Raw enquiries[]
bureau_identity|bool||SYNTHETIC_BUREAU|B:identity.match|LDE.record_json (bureau summary)|CREDIT|LMS||identity.match
bureau_match_status|enum|HIT/NO_HIT/INSUFFICIENT_HISTORY|SYNTHETIC_BUREAU|B:score.status|LDE.record_json (score resolution)|CREDIT|LMS||score.status
bureau_name|str||SYNTHETIC_BUREAU_V2|B2:subject.name|MISSING|PERSONAL|REF||Not in bureau-report/1
bureau_report_date|date||SYNTHETIC_BUREAU|B:report_date|LDE.record_json (bureau.report_date)|NONE|LMS||report_date
bureau_report_status|enum|RECEIVED_VALID/ERROR/TIMEOUT/...|DERIVED|DERIVED|LDE.record_json (bureau.fetched, provider_error)|NONE|LMS|B:data_quality.valid,B:schema_version|PRE-BUREAU: transport + schema + DQ outcome
bureau_score|int|300-900|SYNTHETIC_BUREAU|B:score.value|LA.custom_credit_score (Int NOT NULL DEFAULT 0, typed by the applicant today: must become bureau-only and nullable)|CREDIT|LMS||score.value; null when unavailable, never 0
calculated_emi|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|requested_amount,interest_rate,tenure_months|PL-061 system value
cash_deposit_percentage|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].mode,K:transactions[].amount|PRE-BANK: CASH credits / total credits
closed_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status|PL-034
conflict_flags|list|codes|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|evidence_comparison_results|PRE-CONFLICT
course_start_date|date||APPLICATION|FRONTEND:course_start_date|MISSING|PERSONAL|LMS||Higher education only
credit_card_balance|float|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].current_balance,B:accounts[].account_type|PRE-BUREAU: balance per card
credit_card_balances|list|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].current_balance,B:accounts[].account_type|PRE-BUREAU: ACTIVE CREDIT_CARD/OVERDRAFT balances
credit_card_payment_history|list|statuses|SYNTHETIC_BUREAU|B:accounts[].payment_history|MISSING|CREDIT|REF||payment_history of CREDIT_CARD accounts
credit_history_months|int|months|DERIVED|DERIVED|MISSING|CREDIT|LMS|oldest_account_date,assessment_date|PL-031
current_default_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status|PRE-BUREAU: count(status == DEFAULT)
current_exposure|float|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].current_balance|PRE-BUREAU: sum of ACTIVE balances
current_score|int|300-900|SYNTHETIC_BUREAU|B:score.value|LA.custom_credit_score (see bureau_score)|CREDIT|LMS||Alias of bureau_score
date_of_birth|date||APPLICATION|FRONTEND:date_of_birth|MISSING|PERSONAL|LMS||Declared; verified against PAN OCR and synthetic Aadhaar
days_since_last_decline|int|days|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|last_decline_date,assessment_date|PL-114
days_since_last_dpd|int|days|DERIVED|DERIVED|MISSING|CREDIT|LMS|last_dpd_date,assessment_date|PL-045
debit_credit_ratio|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|total_debits,total_credits|PL-106
debt_mismatch|int|count|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|observed_recurring_debits,declared_obligations,active_credit_accounts|PRE-BANK: EMI-like recurring debits not explained by bureau or declaration
declared_income|float|INR/month|APPLICATION|FRONTEND:declared_net_monthly_income|BP.monthly_income; LA.custom_monthly_income (net vs gross unspecified)|FINANCIAL|LMS||Declared take-home
declared_obligations|float|INR/month|APPLICATION|FRONTEND:declared_monthly_emis|BP.monthly_obligations; LA.custom_monthly_obligations|FINANCIAL|LMS||Declared EMIs
declared_purpose|enum||APPLICATION|FRONTEND:declaration_end_use|LA.custom_loan_purpose|NONE|LMS||Purpose the borrower declares for end use
declared_salary|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|payslip_net_avg|In PL-012 this is the payslip net average
deductions|float|INR/month|OCR|OCR:salary_slip.total_deductions|MISSING (PR #41 Document Extraction.extracted_values, not on 716db49)|FINANCIAL|LMS||
dob_match_status|enum|MATCH/MISMATCH/UNAVAILABLE|DERIVED|DERIVED|MISSING|PERSONAL|LMS|applicant_dob,bureau_dob|PL-022
document_age_days|int|days|DERIVED|DERIVED|MISSING|NONE|LMS|document_date,assessment_date|PL-103
document_date|date||OCR|OCR:document.date|MISSING|NONE|LMS||pay_period / statement_period end date
document_hash|str|sha256|OCR|OCR:document.sha256|File.content_hash (native Frappe File; UNVERIFIED that it is set for private uploads)|NONE|LMS||sha256 of file bytes
document_integrity_result|enum||EXTERNAL|NONE|MISSING|INTERNAL_RISK|LMS||No tamper detector exists (PL-090 deferred)
document_kind|enum||SYSTEM|SYSTEM|LA.documents[].document_type|NONE|LMS||Upload slot type
dpd_history|list|statuses|SYNTHETIC_BUREAU|DERIVED|MISSING|CREDIT|REF|B:accounts[].payment_history,B:accounts[].worst_delinquency_days|Also worst_delinquency_days. Order of entries UNVERIFIED (generator suggests last = newest)
dpd_occurrence_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|dpd_history|PRE-BUREAU: months with DPD > 0 in 24
duplicate_document_result|enum|UNIQUE/SEEN_ELSEWHERE|FRAPPE_HISTORY|FRAPPE_HISTORY|MISSING|INTERNAL_RISK|LMS|document_hash|Lookup of document_hash across applicants
duplicate_match_result|enum|NO_MATCH/MATCH|FRAPPE_HISTORY|FRAPPE_HISTORY|MISSING (no PAN on LA)|INTERNAL_RISK|LMS|pan_hash|Open applications with the same pan_hash
duplicate_tradeline_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_accounts|PRE-BUREAU: same type, opened_on, original_amount/limit
eligible_amount|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|maximum_affordable_emi,interest_rate,tenure_months|PL-068 / PL-125
eligible_employment_categories|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-005
eligible_loan_purposes|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-076
eligible_nationalities|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-003
email_hash|str|sha256|DERIVED|DERIVED|BP.email (plain)|CONTACT|LMS|FRONTEND:email|Salted sha256 of the normalised email
employer_caution_list_hit|bool||INTERNAL_LIST|NONE|MISSING|INTERNAL_RISK|LMS||List not built (PL-116 deferred)
employer_changes_24m|int|count|DERIVED|DERIVED|MISSING|PERSONAL|LMS|employer_history|PL-013
employer_history|list||APPLICATION|NONE|MISSING|PERSONAL|LMS||Not collected in the lean MVP form
employer_name|str||APPLICATION|FRONTEND:employer_name|BP.employer|PERSONAL|LMS||Declared; payslip OCR employer_name cross-checks
employer_name_similarity|float|0..1|DERIVED|DERIVED|MISSING|PERSONAL|LMS|salary_credit_employer,employer_name|PRE-BANK: fuzzy match
employer_stability_indicator|enum||DERIVED|DERIVED|MISSING|PERSONAL|LMS|employer_history|PL-013
employment_category|enum|PUBLIC/PRIVATE/MNC/OTHER|APPLICATION|FRONTEND:employer_category|MISSING|NONE|LMS||
employment_gap_months|int|months|DERIVED|DERIVED|MISSING|PERSONAL|LMS|employment_history|PL-015
employment_history|list||APPLICATION|NONE|MISSING|PERSONAL|LMS||Not collected in the lean MVP form
employment_months|int|months|DERIVED|DERIVED|BP.employment_months; LA.custom_employment_months (declared integer)|PERSONAL|LMS|employment_start_date,assessment_date|PRE-EMP: months from joining date; employment letter OCR as fallback
employment_start_date|date||APPLICATION|FRONTEND:joining_date|MISSING (months only)|PERSONAL|LMS||
employment_status|enum|PERMANENT/PROBATION/CONTRACT|APPLICATION|NONE|MISSING|PERSONAL|LMS||Not in the MVP step-4 list (PL-016 deferred)
employment_type|enum|SALARIED|APPLICATION|FRONTEND:employment_type|BP.employment_type (Salaried/Self-employed/Business/Student/Retired/Unemployed)|NONE|LMS||Fixed SALARIED in the MVP
enquiries_last_30_days|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_enquiries,assessment_date|PRE-BUREAU
enquiries_last_6_months|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_enquiries,assessment_date|PRE-BUREAU
enquiries_last_90_days|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_enquiries,assessment_date|PRE-BUREAU
enquiry_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_enquiries|PRE-BUREAU: 6 months
evidence_comparison_results|list||DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|declared_income,verified_income,employer_name,salary_credit_employer,kyc_name_match_score|PRE-CONFLICT
evidence_references|list|ids|SYSTEM|SYSTEM|LDE.record_json (partial); LDE.trace_sha256|NONE|LMS||Document ids, report id, statement reference
existing_monthly_obligations|float|INR/month|DERIVED|DERIVED|LA.custom_monthly_obligations (declared only)|FINANCIAL|LMS|active_credit_accounts,credit_card_balance|PL-058; declared value as fallback when the bureau is NO_HIT
existing_obligations|float|INR/month|DERIVED|DERIVED|LA.custom_monthly_obligations (declared only)|FINANCIAL|LMS|existing_monthly_obligations|Alias
expected_emi_debits|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|active_credit_accounts|PRE-BANK
exposure_growth_percentage|float|ratio|DERIVED|DERIVED|MISSING|CREDIT|LMS|historical_exposure,current_exposure|PL-056
extracted_identity_fields|object||DERIVED|DERIVED|MISSING|GOV_ID|LMS|OCR:pan_card.name,OCR:pan_card.date_of_birth,OCR:pan_card.pan_number,SYNTHETIC_AADHAAR:name,SYNTHETIC_AADHAAR:dob,SYNTHETIC_AADHAAR:aadhaar_last4,SYNTHETIC_PAN:pan_masked|PRE-KYC: masked values only
foir|float|ratio|DERIVED|DERIVED|MISSING (LDE.record_json holds the v1 FOIR without the new EMI)|FINANCIAL|LMS|total_monthly_obligations,monthly_net_income|PL-063
fraud_indicators|list|codes|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|duplicate_match_result,duplicate_document_result,signature_similarity,shared_contact_pan_count|PRE-RISK: sensitive rule hits
gross_income|float|INR/month|APPLICATION|FRONTEND:gross_monthly_salary|MISSING|FINANCIAL|LMS||OCR salary_slip.gross_salary cross-checks
historical_exposure|float|INR|SYNTHETIC_BUREAU_V2|B2:accounts[].balance_history[].balance|MISSING|CREDIT|REF||Not in bureau-report/1
historical_income|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_income_history|PRE-INC: earlier half of the window
historical_scores|list|scores|SYNTHETIC_BUREAU_V2|B2:score_history[].value|MISSING|CREDIT|REF||Not in bureau-report/1
identity_fields|object||DERIVED|DERIVED|BP.full_name|PERSONAL|LMS|applicant_name,date_of_birth,pan_hash|PRE-KYC
identity_match_status|enum|MATCH/MISMATCH|DERIVED|DERIVED|LDE.record_json (identity)|PERSONAL|LMS|bureau_identity,kyc_name_match_score|PL-020 / PL-094
identity_verification_status|enum|COMPLETE/PARTIAL/NOT_STARTED|DERIVED|DERIVED|MISSING|GOV_ID|LMS|SYNTHETIC_AADHAAR:verification_status,SYNTHETIC_PAN:pan_status|PRE-KYC
income_match_status|enum||DERIVED|DERIVED|MISSING|FINANCIAL|LMS|declared_income,verified_income|PL-017
income_reduction_percentage|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|historical_income,recent_income|PL-018
income_variance_ratio|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|payslip_net_avg,bank_salary_credit_avg|PL-012: abs(payslip - bank)/payslip
income_variation|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_income_history|PRE-INC: coefficient of variation
independently_calculated_emi|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|requested_amount,interest_rate,tenure_months|PL-074: second implementation of the Bajaj formula
interest_rate|float|per annum|DERIVED|DERIVED|LA.rate_of_interest (native, not written by the portal; UNVERIFIED); Loan Product.rate_of_interest|NONE|LMS|assessment_rate|PL-107
kyc_dob_match|bool||DERIVED|DERIVED|MISSING|PERSONAL|LMS|date_of_birth,OCR:pan_card.date_of_birth,SYNTHETIC_AADHAAR:dob|PRE-KYC: exact over the values present
kyc_id_last4_match|bool||DERIVED|DERIVED|MISSING|GOV_ID|LMS|SYNTHETIC_PAN:pan_masked,OCR:pan_card.pan_number,SYNTHETIC_AADHAAR:aadhaar_last4|PRE-KYC
kyc_name_match_score|float|0..1|DERIVED|DERIVED|MISSING|PERSONAL|LMS|applicant_name,OCR:pan_card.name,SYNTHETIC_AADHAAR:name,OCR:salary_slip.employee_name,SYNTHETIC_BANK:account.holder_name|PRE-KYC: lowest pairwise token-set ratio
last_decline_date|date||FRAPPE_HISTORY|FRAPPE_HISTORY|LDE.decision + LDE.evaluated_at (needs pan_hash on LA to join)|INTERNAL_RISK|LMS|pan_hash|
last_dpd_date|date||SYNTHETIC_BUREAU_V2|B2:accounts[].payment_history_months|MISSING|CREDIT|REF||Needs dated history
loan_purpose|enum|4 purposes|APPLICATION|FRONTEND:loan_purpose|LA.custom_loan_purpose (free Data)|NONE|LMS||
loan_tenure_months|int|months|APPLICATION|FRONTEND:tenure_months|LA.repayment_periods|NONE|LMS||Alias of tenure_months
low_confidence|bool||DERIVED|DERIVED|MISSING|NONE|LMS|OCR:chain.field_confidence|PRE-OCR: any source field below the floor
max_dpd_12m|int|days (bucket floor)|DERIVED|DERIVED|MISSING|CREDIT|LMS|dpd_history|PRE-BUREAU: worst of the last 12 entries
max_dpd_24m|int|days (bucket floor)|DERIVED|DERIVED|MISSING|CREDIT|LMS|dpd_history|PRE-BUREAU: worst of the last 24 entries
maximum_affordable_emi|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|approved_maximum_foir,monthly_net_income,existing_obligations|PL-067
maximum_age_at_maturity|int|years|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-002/PL-073
maximum_loan_amount|int|INR|POLICY_PARAMETER|POLICY|Loan Product.maximum_loan_amount|NONE|LMS||PL-070
maximum_report_age_days|int|days|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-024
maximum_tenure_months|int|months|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-072
minimum_age|int|years|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-001
minimum_confidence|float|0-100|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-089
minimum_income|int|INR/month|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-008
minimum_loan_amount|int|INR|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-069
minimum_tenure_months|int|months|POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-071
missed_payment_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|credit_card_payment_history|PL-051
monthly_income_history|list|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category,K:transactions[].amount,K:transactions[].date|PRE-BANK: salary credits per month; payslip OCR as fallback
monthly_income_variance|float|ratio|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].amount,K:transactions[].type|PRE-BANK: CV of monthly credits
monthly_net_income|float|INR/month|DERIVED|DERIVED|LA.custom_monthly_income (declared only)|FINANCIAL|LMS|payslip_net_avg,bank_salary_credit_avg|PL-009
months_at_current_address|int|months|APPLICATION|FRONTEND:years_at_current_address|MISSING|PERSONAL|LMS||
name_match_status|enum||DERIVED|DERIVED|MISSING|PERSONAL|LMS|name_similarity|PL-021
name_similarity|float|0..1|DERIVED|DERIVED|MISSING|PERSONAL|LMS|applicant_name,bureau_name|PRE-KYC
nationality|str|ISO alpha-2|APPLICATION|FRONTEND:nationality|MISSING|PERSONAL|LMS||
negative_balance_count|int|days|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].balance_after|PRE-BANK
negative_list_hit|bool||INTERNAL_LIST|NONE|MISSING|INTERNAL_RISK|LMS||List not built (PL-113 deferred)
observed_recurring_debits|list||DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].narration,K:transactions[].category|PRE-BANK: recurring same-payee debits
observed_salary_credits|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|bank_salary_credit_avg|Alias
ocr_extracted_income|float|INR/month|OCR|OCR:salary_slip.net_salary|MISSING (PR #41 only)|FINANCIAL|LMS||
ocr_field_confidence|float|0-100|OCR|OCR:chain.field_confidence|MISSING (PR #41 only)|NONE|LMS||Paddle returns 0..1: normalise
oldest_account_date|date||DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].opened_on|PRE-BUREAU: min(opened_on)
other_monthly_obligations|float|INR/month|SYSTEM|SYSTEM|MISSING|FINANCIAL|LMS||MVP: 0 (all EMIs are declared in one field)
pan_format_valid|bool||DERIVED|DERIVED|MISSING|GOV_ID|LMS|FRONTEND:pan,SYNTHETIC_PAN:pan_status|PRE-ID: checked on the full PAN in memory
pan_hash|str|sha256|DERIVED|DERIVED|MISSING|GOV_ID|LMS|FRONTEND:pan|Salted sha256 of the full PAN, computed in memory
payee_account_present|bool||SYSTEM|SYSTEM|MISSING|NONE|LMS||MVP: false (payee bank details are not collected), so disbursal is to the borrower
payment_regularity_indicator|float|ratio|DERIVED|DERIVED|MISSING|CREDIT|LMS|dpd_history|PL-046
payslip_count|int|count|SYSTEM|SYSTEM|LA.documents (count of salary-slip rows)|NONE|LMS||
payslip_net_avg|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|OCR:salary_slip.net_salary|PRE-INC: mean over slips
phone_hash|str|sha256|DERIVED|DERIVED|BP.phone (plain)|CONTACT|LMS|FRONTEND:mobile_number|Salted sha256
policy_version|str||SYSTEM|SYSTEM|LA.custom_policy_version; LDE.policy_version|NONE|LMS||
principal|float|INR|APPLICATION|FRONTEND:requested_amount|LA.loan_amount|FINANCIAL|LMS||Alias of requested_amount
product_purpose|enum||DERIVED|DERIVED|LA.loan_product (product doc)|NONE|LMS|loan_purpose|Product selected by purpose
property_ownership|enum||APPLICATION|FRONTEND:property_ownership|MISSING|PERSONAL|LMS||Home renovation only
proposed_emi|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|requested_amount,interest_rate,tenure_months|PL-061
purpose_evidence_amount|float|INR|APPLICATION|FRONTEND:fee_amount|MISSING|FINANCIAL|LMS||fee_amount / quote_amount / estimate_amount by purpose
purpose_evidence_status|enum|PRESENT/MISSING|SYSTEM|SYSTEM|LA.documents[].document_type|NONE|LMS||Purpose document slot filled
recent_income|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_income_history|PRE-INC: later half of the window
recent_loan_application_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_enquiries,B2:enquiries[].enquiry_type|Needs enquiry_type (bureau-report/2)
recent_open_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].opened_on|PRE-BUREAU: opened in 6 months
recent_unsecured_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].opened_on,B:accounts[].account_type|PRE-BUREAU
recently_opened_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].opened_on|Alias of recent_open_account_count
recorded_consents|list|consent records|APPLICATION|DERIVED|BP.consent_terms/consent_privacy (+versions, consent_at) only|NONE|LMS|FRONTEND:consent_bureau_soft_pull,FRONTEND:consent_kyc_aadhaar,FRONTEND:consent_document_processing,FRONTEND:consent_bank_data,FRONTEND:consent_terms,FRONTEND:consent_privacy|Purpose, version, timestamp per consent
repayment_history|list|statuses|SYNTHETIC_BUREAU|B:accounts[].payment_history|MISSING|CREDIT|REF||
reported_card_emi|float|INR/month|SYNTHETIC_BUREAU|B:accounts[].monthly_obligation|MISSING|CREDIT|LMS||0 on cards in the synthetic provider
requested_amount|int|INR|APPLICATION|FRONTEND:requested_amount|LA.loan_amount|FINANCIAL|LMS||
required_consents|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-095
required_documents|list||POLICY_PARAMETER|POLICY|LA.documents link Loan Document Type (types only)|NONE|LMS||PL-088
required_fields|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-096
required_identity_fields|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-006
residual_income|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_net_income,total_monthly_obligations|PL-065
restructured_account_count|int|count|SYNTHETIC_BUREAU_V2|B2:accounts[].restructured|MISSING|CREDIT|REF||Not in bureau-report/1
return_count|int|count|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category|PRE-BANK: NACH_RETURN + CHEQUE_RETURN in 3 months
review_flags|list|codes|SYSTEM|SYSTEM|MISSING|INTERNAL_RISK|LMS||Rule results with REVIEW
risk_grade|enum|A/B/C/NTC|DERIVED|DERIVED|MISSING|CREDIT|LMS|bureau_score,bureau_match_status,max_dpd_12m,max_dpd_24m|PL-124
rule_results|list||SYSTEM|SYSTEM|LDE.record_json; trace file by LDE.trace_sha256|NONE|LMS||
salary_credit_consistency|int|months|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|salary_credit_months|Alias
salary_credit_employer|str||DERIVED|DERIVED|MISSING|PERSONAL|LMS|K:transactions[].narration,K:transactions[].category|PRE-BANK: payer name on SALARY credits
salary_credit_months|int|months|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category,K:transactions[].date|PRE-BANK; fallback OCR bank_statement.salary_credit_months
salary_match_status|enum||DERIVED|DERIVED|MISSING|FINANCIAL|LMS|income_variance_ratio|PL-012
salary_reversal_indicator|bool||DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].category|PRE-BANK: SALARY_REVERSAL present
score_trend|int|points|DERIVED|DERIVED|MISSING|CREDIT|LMS|historical_scores,current_score|PL-030
secured_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].account_type|PL-032
settled_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status|PRE-BUREAU
settled_within_lookback|bool||DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status,B:accounts[].closed_on,B:accounts[].last_payment_date|PRE-BUREAU: closed_on, then last_payment_date, as status-change proxy; unknown -> true
shared_contact_pan_count|int|count|FRAPPE_HISTORY|FRAPPE_HISTORY|MISSING|INTERNAL_RISK|LMS|phone_hash,email_hash|Contact-hash index across applicants
signature_anomaly_score|float|0..1|OCR|OCR:signature.anomaly_score|MISSING|BIOMETRIC_LIKE|LMS||Screening only
signature_crop_sha256|str|sha256|OCR|OCR:signature.crop_sha256|MISSING|BIOMETRIC_LIKE|LMS||Crop image itself is SOURCE_REFERENCE
signature_present|bool||OCR|OCR:signature.present|MISSING|BIOMETRIC_LIKE|LMS||
signature_similarity|float|0..1|OCR|OCR:signature.similarity|MISSING|BIOMETRIC_LIKE|LMS||
statement_integrity_result|enum|VALID/INVALID|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|K:summary.opening_balance,K:summary.closing_balance,K:transactions[].amount|PRE-BANK: opening + credits - debits = closing; date continuity
statement_months|int|months|DERIVED|DERIVED|MISSING|NONE|LMS|K:period.from,K:period.to|PRE-BANK
statement_validation_flags|list|codes|DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|K:summary.opening_balance,K:summary.closing_balance,K:transactions[].date|PRE-BANK
submitted_documents|list||SYSTEM|SYSTEM|LA.documents[].document_type|NONE|LMS||
suit_filed_status|bool||SYNTHETIC_BUREAU_V2|B2:accounts[].suit_filed|MISSING|CREDIT|REF||Not in bureau-report/1
supplied_fields|list||SYSTEM|SYSTEM|MISSING|NONE|LMS||Keys present in the ZEN input
supplied_identity_fields|list||SYSTEM|SYSTEM|MISSING|NONE|LMS||
supported_employment_types|list||POLICY_PARAMETER|POLICY|MISSING|NONE|LMS||PL-004
tampering_flags|list|codes|EXTERNAL|NONE|MISSING|INTERNAL_RISK|LMS||No tamper detector exists
tenure_months|int|months|APPLICATION|FRONTEND:tenure_months|LA.repayment_periods|NONE|LMS||
total_credit_limits|list|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].credit_limit|PRE-BUREAU
total_credits|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].amount,K:transactions[].type|PRE-BANK; fallback OCR bank_statement.total_credits
total_debits|float|INR|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|K:transactions[].amount,K:transactions[].type|PRE-BANK; fallback OCR bank_statement.total_debits
total_existing_exposure|float|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|total_unsecured_exposure|Alias
total_experience_months|int|months|APPLICATION|FRONTEND:total_experience_months|MISSING|PERSONAL|LMS||
total_monthly_obligations|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|existing_monthly_obligations,other_monthly_obligations,proposed_emi|PL-062
total_overdue_amount|float|INR|SYNTHETIC_BUREAU_V2|B2:accounts[].amount_overdue|MISSING|CREDIT|REF||Not in bureau-report/1
total_unsecured_exposure|float|INR|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].current_balance,B:accounts[].account_type|PL-038
treatment_date|date||APPLICATION|FRONTEND:treatment_date|MISSING|PERSONAL|LMS||Medical only
unresolved_conflicts|list||DERIVED|DERIVED|MISSING|INTERNAL_RISK|LMS|conflict_flags|
unsecured_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].account_type|PL-032
utilisation_ratio|float|ratio|DERIVED|DERIVED|MISSING|CREDIT|LMS|credit_card_balances,total_credit_limits|PL-036
verified_income|float|INR/month|DERIVED|DERIVED|MISSING|FINANCIAL|LMS|monthly_net_income|Alias of the assessed income
wedding_date|date||APPLICATION|FRONTEND:wedding_date|MISSING|PERSONAL|LMS||Wedding only
written_off_account_count|int|count|DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status|PRE-BUREAU
written_off_within_lookback|bool||DERIVED|DERIVED|MISSING|CREDIT|LMS|B:accounts[].status,B:accounts[].closed_on,B:accounts[].last_payment_date|As settled_within_lookback
"""

# Fields that are never stored at all (not rule inputs, but the dictionary records them).
NEVER_STORE_EXTRA = [
    ("pan_full", "Full PAN typed in step 2", "GOV_ID", "Used in memory for the synthetic PAN and bureau calls, then dropped; LMS keeps pan_masked + pan_hash."),
    ("aadhaar_full", "Full Aadhaar number", "GOV_ID", "Never requested or accepted. The synthetic Aadhaar API returns last 4 + verification status."),
    ("otp_values", "OTP codes", "NONE", "Never stored or logged."),
    ("ocr_raw_text", "Raw OCR text of documents", "PERSONAL", "PR #41 masks before values reach a dataclass; raw text is not kept."),
]


def _expand(v):
    for prefix, full in (("B2:", B2), ("B:", B), ("K:", K)):
        if v.startswith(prefix):
            return full + v[len(prefix):]
    return v


def _frappe(v):
    for k, full in FRAPPE_ABBR.items():
        v = v.replace(k, full)
    return v


def rows():
    out = []
    for line in TABLE.strip().splitlines():
        parts = line.split("|")
        assert len(parts) == 10, line
        name, typ, unit, source, supply, frappe, pii, storage, derived, note = parts
        out.append({
            "name": name, "type": typ, "unit": unit or None, "source": source,
            "mvp_supply": _expand(supply),
            "derived_from": [_expand(x) for x in derived.split(",") if x],
            "formula_or_note": note, "frappe_today": _frappe(frappe), "pii_class": pii,
            "masking_rule": PII[pii], "storage": STORAGE[storage], "retention": RETENTION[STORAGE[storage]],
        })
    return out
