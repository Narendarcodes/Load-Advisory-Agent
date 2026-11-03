"""MVP frontend field spec: salaried applicants only, 7 steps (user decision 2026-11-03 22:50 IST).

Dropped on purpose: references, co-applicant, self-employed, education level, dependants, and the
applicant-typed credit score (the score comes from the bureau only). Gender and marital status are
KYC-only and never ZEN inputs. Father's/spouse name is an optional KYC field.
"""

STEPS = {
    1: "Mobile number + OTP",
    2: "Loan need + basics, then soft check",
    3: "Profile + current/permanent address, residence type, years there",
    4: "Work + money",
    5: "KYC + documents",
    6: "Bank account + statement",
    7: "Consents, declarations, review, e-sign",
}

REQ, OPT, COND = "REQUIRED", "OPTIONAL", "CONDITIONAL"
USER, API, OCRX, SYS = "USER_ENTERED", "API_FETCHED", "OCR_EXTRACTED", "SYSTEM"
LMS, REF, NEVER = "LMS_SNAPSHOT", "SOURCE_REFERENCE", "NEVER_STORE"


def F(fid, step, req, label, validation, origin, *, api=None, ocr=None, handling="DECLARED", consent=None,
      frappe="GAP", storage=LMS, zen=None, condition=None, note=""):
    return dict(field_id=fid, step=step, requirement=req, label=label, validation=validation, origin=origin,
                synthetic_api=api, ocr_source=ocr, handling=handling, consent_purpose=consent, frappe=frappe,
                storage=storage, zen_input=zen, condition=condition, note=note)


PURPOSES = "wedding | higher_education | home_renovation | medical_emergency"

FIELDS = [
    # 1. Mobile + OTP
    F("mobile_number", 1, REQ, "Mobile number", "+91 then 10 digits starting 6-9", USER, frappe="Borrower Profile.phone",
      zen="phone_hash", consent="ACCOUNT_CREATION_OTP", note="ZEN reads only the salted hash (PL-115)."),
    F("mobile_otp_verified", 1, REQ, "OTP verified", "6-digit OTP, 3 attempts, 5-minute expiry", SYS, handling="VERIFIED",
      frappe="GAP (only User login exists)", storage=LMS),
    # 2. Loan need + basics -> soft check
    F("loan_purpose", 2, REQ, "What is the loan for?", PURPOSES, USER, frappe="Loan Application.custom_loan_purpose (free Data today; GAP: Select of 4)",
      zen="loan_purpose"),
    F("requested_amount", 2, REQ, "How much do you need?", "integer INR, 40,000 to the product cap", USER, frappe="Loan Application.loan_amount",
      zen="requested_amount"),
    F("tenure_months", 2, REQ, "Repay over (months)", "integer, 12 to the product max", USER, frappe="Loan Application.repayment_periods",
      zen="tenure_months"),
    F("full_name", 2, REQ, "Full name as on PAN", "2-120 letters, spaces, . and '", USER, handling="DECLARED then VERIFIED against PAN/Aadhaar",
      frappe="Borrower Profile.full_name; Loan Application.applicant_name", zen="applicant_name"),
    F("date_of_birth", 2, REQ, "Date of birth", "valid date; age 21 or more today", USER, handling="DECLARED then VERIFIED against PAN/Aadhaar",
      frappe="GAP", zen="date_of_birth"),
    F("pan", 2, REQ, "PAN", "[A-Z]{5}[0-9]{4}[A-Z]", USER, api="SYNTHETIC_PAN (verify), SYNTHETIC_BUREAU (pull)", handling="DECLARED then VERIFIED",
      frappe="GAP (store pan_masked only)", storage=NEVER, zen="pan_format_valid",
      note="Full PAN is used in memory to call the synthetic PAN and bureau APIs, then dropped. LMS keeps pan_masked + pan_hash."),
    F("current_pincode", 2, REQ, "Current PIN code", "6 digits, first digit 1-9", USER, frappe="GAP", zen="applicant_city",
      note="City is looked up from the PIN; the user can correct it in step 3."),
    F("declared_net_monthly_income", 2, REQ, "Monthly take-home salary", "integer INR > 0", USER,
      handling="DECLARED; verified later from payslip OCR and bank salary credits",
      frappe="Borrower Profile.monthly_income; Loan Application.custom_monthly_income", zen="declared_income"),
    F("consent_bureau_soft_pull", 2, REQ, "Allow a credit bureau check", "explicit tick; purpose + version + timestamp recorded", USER,
      consent="BUREAU_PULL", frappe="GAP (Consent Record)", zen="recorded_consents",
      note="The soft check pulls the bureau, so this consent is taken here, separately, and shown again in step 7."),
    # purpose-specific (step 2, conditional on purpose)
    F("wedding_date", 2, COND, "Wedding date", "date within -90..+365 days", USER, condition="loan_purpose == wedding", zen="wedding_date"),
    F("wedding_of", 2, COND, "Whose wedding?", "SELF | CHILD | SIBLING | OTHER_RELATIVE", USER, condition="loan_purpose == wedding"),
    F("institution_name", 2, COND, "Institution", "2-120 chars", USER, condition="loan_purpose == higher_education"),
    F("course_name", 2, COND, "Course", "2-120 chars", USER, condition="loan_purpose == higher_education"),
    F("course_start_date", 2, COND, "Course start date", "date within -180..+365 days", USER, condition="loan_purpose == higher_education",
      zen="course_start_date"),
    F("fee_amount", 2, COND, "Total fee", "integer INR > 0", USER, handling="DECLARED then EXTRACTED from the fee schedule",
      condition="loan_purpose == higher_education", zen="purpose_evidence_amount"),
    F("student_relationship", 2, COND, "Student is your", "SELF | CHILD | SPOUSE | SIBLING", USER, condition="loan_purpose == higher_education"),
    F("property_pincode", 2, COND, "Property PIN code", "6 digits", USER, condition="loan_purpose == home_renovation"),
    F("estimated_wedding_cost", 2, OPT, "Estimated wedding cost", "integer INR > 0", USER, condition="loan_purpose == wedding"),
    F("property_ownership", 2, COND, "Who owns the home?", "OWNED | FAMILY_OWNED | RENTED", USER, condition="loan_purpose == home_renovation",
      zen="property_ownership"),
    F("quote_amount", 2, COND, "Contractor quote amount", "integer INR > 0", USER, condition="loan_purpose == home_renovation",
      zen="purpose_evidence_amount"),
    F("hospital_name", 2, COND, "Hospital", "2-120 chars", USER, condition="loan_purpose == medical_emergency"),
    F("treatment_date", 2, COND, "Treatment date", "date within -90..+90 days", USER, condition="loan_purpose == medical_emergency",
      zen="treatment_date"),
    F("estimate_amount", 2, COND, "Hospital estimate amount", "integer INR > 0", USER, condition="loan_purpose == medical_emergency",
      zen="purpose_evidence_amount"),
    F("patient_relationship", 2, COND, "Patient is your", "SELF | SPOUSE | CHILD | PARENT | SIBLING", USER, condition="loan_purpose == medical_emergency"),
    # 3. Profile + address
    F("email", 3, REQ, "Email", "RFC 5322, max 120", USER, frappe="Borrower Profile.email", zen="email_hash"),
    F("nationality", 3, REQ, "Nationality", "ISO alpha-2; default IN; declaration", USER, handling="DECLARED", frappe="GAP", zen="nationality"),
    F("current_address", 3, REQ, "Current address", "line 1 required, line 2 optional, 5-200 chars", USER,
      handling="DECLARED then compared with Aadhaar address (deferred bureau comparison)", frappe="GAP", zen="applicant_address"),
    F("current_city", 3, REQ, "City", "from PIN lookup, editable", USER, frappe="GAP", zen="applicant_city"),
    F("residence_type", 3, REQ, "Residence type", "OWNED | FAMILY_OWNED | RENTED | COMPANY_PROVIDED | PG_HOSTEL", USER, frappe="GAP"),
    F("years_at_current_address", 3, REQ, "Years at this address", "0-80, with months", USER, frappe="GAP", zen="months_at_current_address"),
    F("permanent_same_as_current", 3, REQ, "Permanent address same as current?", "yes/no", USER, frappe="GAP"),
    F("permanent_address", 3, COND, "Permanent address", "as current address", USER, condition="permanent_same_as_current == false", frappe="GAP"),
    F("father_or_spouse_name", 3, OPT, "Father's or spouse's name (KYC)", "2-120 letters", USER, handling="KYC only", frappe="GAP"),
    F("gender", 3, OPT, "Gender (KYC)", "as on Aadhaar", USER, api="SYNTHETIC_AADHAAR", handling="KYC only; never a ZEN input", frappe="GAP"),
    F("marital_status", 3, OPT, "Marital status (KYC)", "SINGLE | MARRIED | OTHER", USER, handling="KYC only; never a ZEN input", frappe="GAP"),
    # 4. Work + money
    F("employment_type", 4, REQ, "Employment type", "fixed SALARIED in the MVP", SYS, frappe="Borrower Profile.employment_type", zen="employment_type"),
    F("employer_name", 4, REQ, "Employer", "typeahead, 2-120 chars", USER, ocr="salary_slip.employer_name",
      handling="DECLARED then EXTRACTED (payslip) and matched to bank salary narration", frappe="Borrower Profile.employer", zen="employer_name"),
    F("employer_category", 4, REQ, "Employer type", "PUBLIC | PRIVATE | MNC | OTHER", USER, frappe="GAP", zen="employment_category"),
    F("joining_date", 4, REQ, "Joined current employer on", "date in the past", USER, ocr="employment_letter.employment_start_date",
      frappe="Borrower Profile.employment_months (months only; GAP: date)", zen="employment_start_date"),
    F("total_experience_months", 4, REQ, "Total work experience", "years + months, >= months with current employer", USER, frappe="GAP",
      zen="total_experience_months"),
    F("gross_monthly_salary", 4, REQ, "Monthly gross salary", "integer INR >= net", USER, ocr="salary_slip.gross_salary",
      handling="DECLARED then EXTRACTED", frappe="GAP", zen="gross_income"),
    F("net_monthly_salary", 4, REQ, "Monthly take-home salary", "prefilled from step 2", USER, ocr="salary_slip.net_salary",
      handling="DECLARED then EXTRACTED and VERIFIED against bank salary credits",
      frappe="Borrower Profile.monthly_income; Loan Application.custom_monthly_income", zen="declared_income"),
    F("declared_monthly_emis", 4, REQ, "Total EMIs you pay now", "integer INR >= 0", USER, handling="DECLARED then compared with bureau and bank",
      frappe="Borrower Profile.monthly_obligations; Loan Application.custom_monthly_obligations", zen="declared_obligations"),
    F("monthly_rent", 4, COND, "Monthly rent", "integer INR >= 0", USER, condition="residence_type == RENTED", frappe="GAP",
      note="Shown to the underwriter; not a debt obligation in FOIR."),
    # 5. KYC + documents
    F("pan_card_upload", 5, REQ, "PAN card", "PDF/JPG/PNG <= 10 MB", USER, ocr="pan_card.pan_number, pan_card.name, pan_card.date_of_birth",
      handling="EXTRACTED; PAN masked before storage", frappe="Loan Application.documents (File)", storage=REF, zen="extracted_identity_fields"),
    F("aadhaar_verification", 5, REQ, "Aadhaar verification", "synthetic API; last 4 digits only", API, api="SYNTHETIC_AADHAAR",
      handling="VERIFIED", consent="KYC_AADHAAR", frappe="GAP (KYC Verification)", zen="extracted_identity_fields",
      note="The full Aadhaar number is NEVER_STORE; the LMS keeps aadhaar_last4 + verification status."),
    F("salary_slips_upload", 5, REQ, "Last 3 salary slips", "3 files, latest within 60 days", USER,
      ocr="salary_slip.employee_name, employer_name, pay_period, gross_salary, total_deductions, net_salary",
      handling="EXTRACTED", consent="DOCUMENT_PROCESSING", frappe="Loan Application.documents (File)", storage=REF, zen="payslip_net_avg"),
    F("employee_id_upload", 5, REQ, "Employee ID card", "PDF/JPG/PNG <= 10 MB", USER, handling="PRESENCE only (no OCR)",
      frappe="Loan Application.documents (File)", storage=REF, zen="submitted_documents"),
    F("purpose_document_upload", 5, COND, "Purpose document", "per product (PRODUCT_MATRIX)", USER, handling="PRESENCE + amount (manual or OCR later)",
      condition="loan_purpose in [higher_education, home_renovation, medical_emergency]", frappe="Loan Application.documents (File)",
      storage=REF, zen="purpose_evidence_status"),
    # 6. Bank
    F("bank_account_number", 6, REQ, "Salary account number", "9-18 digits", USER, api="SYNTHETIC_BANK (account.masked_number)",
      handling="DECLARED then VERIFIED via the AA-style fetch", frappe="GAP (encrypted field for disbursal; masked last 4 elsewhere)", storage=LMS,
      note="Needed for disbursal, so stored encrypted with role-restricted access; logs and ZEN see last 4 only."),
    F("ifsc", 6, REQ, "IFSC", "[A-Z]{4}0[A-Z0-9]{6}", USER, frappe="GAP"),
    F("bank_statement_fetch", 6, REQ, "Fetch statement (AA-style)", "3 months; 6 months for amounts above 10 lakh", API, api="SYNTHETIC_BANK",
      handling="VERIFIED source data", consent="BANK_DATA_AA", frappe="GAP (Bank Statement Summary + source reference)", storage=REF,
      zen="bank_transactions"),
    F("bank_statement_upload", 6, COND, "Or upload statement PDF", "PDF <= 10 MB", USER,
      ocr="bank_statement.account_holder, statement_period, salary_credits, salary_credit_months, total_credits, total_debits",
      condition="AA fetch unavailable", handling="EXTRACTED (fallback; fewer features)", frappe="Loan Application.documents (File)", storage=REF,
      zen="bank_transactions"),
    # 7. Consents, declarations, review, e-sign
    F("consent_kyc_aadhaar", 7, REQ, "Consent: Aadhaar-based KYC", "separate tick; purpose, version, timestamp", USER, consent="KYC_AADHAAR",
      frappe="GAP (Consent Record)", zen="recorded_consents", note="Shown before step 5 runs; recorded here for review."),
    F("consent_document_processing", 7, REQ, "Consent: read my documents (OCR)", "separate tick", USER, consent="DOCUMENT_PROCESSING",
      frappe="GAP (Consent Record)", zen="recorded_consents"),
    F("consent_bank_data", 7, REQ, "Consent: fetch my bank statement", "separate tick", USER, consent="BANK_DATA_AA",
      frappe="GAP (Consent Record)", zen="recorded_consents"),
    F("consent_terms", 7, REQ, "Accept terms", "versioned", USER, consent="TERMS", frappe="Borrower Profile.consent_terms + terms_version + consent_at",
      zen="recorded_consents"),
    F("consent_privacy", 7, REQ, "Accept privacy notice", "versioned", USER, consent="PRIVACY",
      frappe="Borrower Profile.consent_privacy + privacy_version + consent_at", zen="recorded_consents"),
    F("consent_marketing", 7, OPT, "Product updates (optional)", "unticked by default", USER, consent="MARKETING", frappe="GAP (Consent Record)"),
    F("declaration_true_and_complete", 7, REQ, "Information is true and complete", "tick", USER, frappe="GAP"),
    F("declaration_all_emis_declared", 7, REQ, "I have declared all my current EMIs", "tick", USER, frappe="GAP"),
    F("declaration_end_use", 7, REQ, "I will use the loan only for the stated purpose", "tick (BFL-PL-DETAILED-TNC#020)", USER, frappe="GAP",
      zen="declared_purpose"),
    F("review_confirmed", 7, REQ, "I have reviewed my application", "tick after the summary screen", USER, frappe="Loan Application.custom_submitted_at"),
    F("esign", 7, REQ, "E-sign (signature + OTP)", "drawn signature + OTP", USER, ocr="signature.present, signature.similarity, signature.anomaly_score",
      handling="Signature compared with the PAN-card signature as a SCREENING signal only", frappe="GAP (Signature Screening Result)", storage=LMS,
      zen="signature_similarity", note="Image kept as SOURCE_REFERENCE; the LMS keeps presence, crop hash, anomaly score, similarity and the REFER flag."),
]
