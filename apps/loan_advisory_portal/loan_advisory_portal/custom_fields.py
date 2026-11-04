"""Custom fields the app adds to Frappe Lending's `Loan Application` (pure data, no `frappe` import).

`install.ensure_custom_fields` applies this list on install and on every migrate, so every
site gets the same schema. Keeping it frappe-free lets CI check the Saral field mapping
(`contracts/frappe_field_map.json`) against it without a bench.

Saral additions (data dictionary gaps G06, G09, G12, G14 and ADR-0008):
- purpose as a Select of the four products, PAN hash, the offer, the decision links;
- `custom_credit_score` is read-only and bureau-only, with `custom_credit_score_origin`;
- `custom_internal_reasons` and the review audit table sit at permlevel 1, which only the
  Loan Officer and System Manager roles can read; borrowers hold no Desk permission at all.
"""

from loan_advisory_portal.portal.lifecycle import states_text

LIFECYCLE_STATES = states_text()

PURPOSE_CODES = ("wedding", "higher_education", "home_renovation", "medical_emergency")
DECISION_OUTCOMES = "\nELIGIBILITY_CONDITIONS_MET\nCOUNTER_OFFER\nMANUAL_REVIEW\nMORE_INFORMATION_REQUIRED\nDECLINE"
CREDIT_SCORE_ORIGINS = "\nBUREAU\nNO_HIT\nNOT_FETCHED\nAPPLICANT_TYPED_LEGACY"


def _f(fieldname, fieldtype, label, after, **kw):
	field = {"fieldname": fieldname, "label": label, "fieldtype": fieldtype, "insert_after": after}
	field.update(kw)
	return field


# Every Saral field below is written after submission by a trusted server path (evidence
# ingestion, snapshot recording, officer review), so it is `allow_on_submit` and read-only
# in the form. None of them is writable by a borrower: borrowers have no Desk role.
_SNAP = {"read_only": 1, "allow_on_submit": 1}

LOAN_APPLICATION_FIELDS = [
	_f("custom_underwriting_section", "Section Break", "Underwriting (synthetic)", "loan_amount"),
	_f("custom_loan_purpose", "Data", "Loan Purpose (portal)", "custom_underwriting_section"),
	_f("custom_monthly_income", "Currency", "Monthly Income", "custom_loan_purpose"),
	_f("custom_monthly_obligations", "Currency", "Monthly Obligations", "custom_monthly_income"),
	_f("custom_credit_score", "Int", "Credit Score (bureau)", "custom_monthly_obligations", read_only=1,
	   description="Filled from the bureau only. Applicants cannot type it. 0 means no bureau score; see Credit Score Origin."),
	_f("custom_employment_months", "Int", "Employment Months", "custom_credit_score"),
	_f("custom_external_ref", "Data", "External Ref (seed key)", "custom_employment_months", unique=1),
	# The decision on a submitted application is recorded after immutability locks the rest
	# of the document; the native `status` stays untouched.
	_f("custom_lifecycle_state", "Select", "Lifecycle State", "custom_external_ref", options=LIFECYCLE_STATES,
	   allow_on_submit=1, in_list_view=1, in_standard_filter=1),
	_f("custom_submitted_at", "Datetime", "Submitted At (portal)", "custom_lifecycle_state", read_only=1),
	_f("custom_policy_version", "Data", "Policy Version", "custom_submitted_at", read_only=1, allow_on_submit=1),
	_f("custom_latest_evidence", "Link", "Latest Decision Evidence", "custom_policy_version",
	   options="Loan Decision Evidence", read_only=1, allow_on_submit=1),
	# ---------------------------------------------------------------- Saral (G09)
	_f("custom_saral_section", "Section Break", "Saral assessment", "custom_latest_evidence"),
	_f("custom_purpose_code", "Select", "Purpose (product)", "custom_saral_section",
	   options="\n" + "\n".join(PURPOSE_CODES), in_standard_filter=1),
	_f("custom_pan_hash", "Data", "PAN Hash", "custom_purpose_code", length=64, read_only=1, permlevel=1),
	_f("custom_credit_score_origin", "Select", "Credit Score Origin", "custom_pan_hash", options=CREDIT_SCORE_ORIGINS, **_SNAP),
	_f("custom_bureau_report", "Link", "Bureau Report Summary", "custom_credit_score_origin", options="Bureau Report Summary", **_SNAP),
	_f("custom_kyc_verification", "Link", "KYC Verification", "custom_bureau_report", options="KYC Verification", **_SNAP),
	_f("custom_bank_statement_summary", "Link", "Bank Statement Summary", "custom_kyc_verification",
	   options="Bank Statement Summary", **_SNAP),
	_f("custom_decision_column", "Column Break", "", "custom_bank_statement_summary"),
	_f("custom_decision_snapshot", "Link", "Decision Snapshot", "custom_decision_column", options="Decision Snapshot",
	   in_list_view=1, **_SNAP),
	_f("custom_decision_outcome", "Select", "Decision Outcome", "custom_decision_snapshot", options=DECISION_OUTCOMES,
	   in_standard_filter=1, **_SNAP),
	_f("custom_borrower_categories", "Small Text", "Borrower Categories", "custom_decision_outcome", in_list_view=1, **_SNAP),
	_f("custom_internal_reasons", "Small Text", "Internal Reasons (officer only)", "custom_borrower_categories",
	   permlevel=1, **_SNAP),
	# ---------------------------------------------------------------- offer (G09, PL-119/PL-125)
	_f("custom_offer_section", "Section Break", "Offer", "custom_internal_reasons"),
	_f("custom_amount_band", "Select", "Amount Band", "custom_offer_section", options="\nB1\nB2\nB3\nB4", **_SNAP),
	_f("custom_assessment_rate", "Percent", "Assessment Rate (% p.a.)", "custom_amount_band", **_SNAP),
	_f("custom_proposed_emi", "Currency", "Proposed EMI", "custom_assessment_rate", **_SNAP),
	_f("custom_foir", "Float", "FOIR (with new EMI)", "custom_proposed_emi", precision="4", **_SNAP),
	_f("custom_offer_column", "Column Break", "", "custom_foir"),
	_f("custom_offer_outcome", "Select", "Offer Outcome", "custom_offer_column", options="\nAPPROVED\nCOUNTER_OFFER\nNO_OFFER", **_SNAP),
	_f("custom_eligible_amount", "Currency", "Eligible Amount", "custom_offer_outcome", **_SNAP),
	_f("custom_offer_amount", "Currency", "Offer Amount", "custom_eligible_amount", **_SNAP),
	_f("custom_offer_emi", "Currency", "Offer EMI", "custom_offer_amount", **_SNAP),
	_f("custom_offer_tenure_months", "Int", "Offer Tenure (months)", "custom_offer_emi", **_SNAP),
	_f("custom_offer_rate", "Percent", "Offer Rate (% p.a.)", "custom_offer_tenure_months", **_SNAP),
	# ---------------------------------------------------------------- purpose details (G12)
	_f("custom_purpose_section", "Section Break", "Purpose details", "custom_offer_rate", collapsible=1),
	_f("custom_wedding_date", "Date", "Wedding Date", "custom_purpose_section", depends_on="eval:doc.custom_purpose_code=='wedding'"),
	_f("custom_wedding_of", "Select", "Wedding Of", "custom_wedding_date", options="\nSELF\nCHILD\nSIBLING\nOTHER_RELATIVE",
	   depends_on="eval:doc.custom_purpose_code=='wedding'"),
	_f("custom_estimated_wedding_cost", "Currency", "Estimated Wedding Cost", "custom_wedding_of",
	   depends_on="eval:doc.custom_purpose_code=='wedding'"),
	_f("custom_institution_name", "Data", "Institution", "custom_estimated_wedding_cost",
	   depends_on="eval:doc.custom_purpose_code=='higher_education'"),
	_f("custom_course_name", "Data", "Course", "custom_institution_name", depends_on="eval:doc.custom_purpose_code=='higher_education'"),
	_f("custom_course_start_date", "Date", "Course Start Date", "custom_course_name",
	   depends_on="eval:doc.custom_purpose_code=='higher_education'"),
	_f("custom_fee_amount", "Currency", "Fee Amount", "custom_course_start_date",
	   depends_on="eval:doc.custom_purpose_code=='higher_education'"),
	_f("custom_student_relationship", "Select", "Student Is", "custom_fee_amount", options="\nSELF\nCHILD\nSPOUSE\nSIBLING",
	   depends_on="eval:doc.custom_purpose_code=='higher_education'"),
	_f("custom_purpose_column", "Column Break", "", "custom_student_relationship"),
	_f("custom_property_ownership", "Select", "Property Ownership", "custom_purpose_column", options="\nOWNED\nFAMILY_OWNED\nRENTED",
	   depends_on="eval:doc.custom_purpose_code=='home_renovation'"),
	_f("custom_property_pincode", "Data", "Property PIN Code", "custom_property_ownership", length=6,
	   depends_on="eval:doc.custom_purpose_code=='home_renovation'"),
	_f("custom_quote_amount", "Currency", "Contractor Quote", "custom_property_pincode",
	   depends_on="eval:doc.custom_purpose_code=='home_renovation'"),
	_f("custom_hospital_name", "Data", "Hospital", "custom_quote_amount", depends_on="eval:doc.custom_purpose_code=='medical_emergency'"),
	_f("custom_treatment_date", "Date", "Treatment Date", "custom_hospital_name",
	   depends_on="eval:doc.custom_purpose_code=='medical_emergency'"),
	_f("custom_estimate_amount", "Currency", "Hospital Estimate", "custom_treatment_date",
	   depends_on="eval:doc.custom_purpose_code=='medical_emergency'"),
	_f("custom_patient_relationship", "Select", "Patient Is", "custom_estimate_amount",
	   options="\nSELF\nSPOUSE\nCHILD\nPARENT\nSIBLING", depends_on="eval:doc.custom_purpose_code=='medical_emergency'"),
	_f("custom_purpose_evidence_amount", "Currency", "Purpose Evidence Amount", "custom_patient_relationship",
	   description="The amount on the purpose document (fee schedule, quote or estimate)."),
	# ---------------------------------------------------------------- disbursal account (G14)
	_f("custom_disbursal_section", "Section Break", "Disbursal account", "custom_purpose_evidence_amount", collapsible=1),
	_f("custom_disbursal_account_number", "Password", "Account Number (encrypted)", "custom_disbursal_section", permlevel=1),
	_f("custom_disbursal_account_last4", "Data", "Account Last 4", "custom_disbursal_account_number", length=4),
	_f("custom_disbursal_ifsc", "Data", "IFSC", "custom_disbursal_account_last4", length=11),
	_f("custom_disbursal_verified_via", "Select", "Verified Via", "custom_disbursal_ifsc", options="\nAA\nPENNY_DROP\nNOT_VERIFIED"),
	# ---------------------------------------------------------------- officer review (ADR-0008)
	_f("custom_review_section", "Section Break", "Officer review", "custom_disbursal_verified_via"),
	_f("custom_review_actions", "Table", "Review Actions (audit)", "custom_review_section", options="Loan Review Action",
	   permlevel=1, **_SNAP),
]


def purpose_code_for(text) -> str | None:
	"""Map the portal's free-text purpose onto one of the four products, or None."""
	key = (text or "").strip().lower().replace("-", " ").replace("_", " ")
	key = " ".join(key.split())
	aliases = {
		"wedding": "wedding", "marriage": "wedding",
		"higher education": "higher_education", "education": "higher_education",
		"home renovation": "home_renovation", "renovation": "home_renovation",
		"medical emergency": "medical_emergency", "medical": "medical_emergency", "medical costs": "medical_emergency",
	}
	return aliases.get(key)
