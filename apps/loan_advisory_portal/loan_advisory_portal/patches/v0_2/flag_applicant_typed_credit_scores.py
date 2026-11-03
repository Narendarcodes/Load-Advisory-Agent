"""Flag credit scores that applicants typed before the score became bureau-only (G09).

Nothing is deleted: a recorded decision may rest on the old value. Rows with a score and no
origin are marked APPLICANT_TYPED_LEGACY so officers and the agent can tell them apart; rows
without a score are marked NOT_FETCHED. Bureau-written rows already carry BUREAU / NO_HIT.
"""

import frappe


def execute():
	# Post-model-sync patches run before `after_migrate`, so create the Saral custom fields
	# first; `ensure_custom_fields` is idempotent.
	from loan_advisory_portal.install import ensure_custom_fields

	ensure_custom_fields()
	frappe.db.sql(
		"""update `tabLoan Application`
		set custom_credit_score_origin = if(ifnull(custom_credit_score, 0) > 0, 'APPLICANT_TYPED_LEGACY', 'NOT_FETCHED')
		where ifnull(custom_credit_score_origin, '') = ''"""
	)
	purposes = frappe.get_all("Loan Application", filters={"custom_purpose_code": ["in", ["", None]]},
	                          fields=["name", "custom_loan_purpose"])
	from loan_advisory_portal.custom_fields import purpose_code_for

	for row in purposes:
		code = purpose_code_for(row.custom_loan_purpose)
		if code:
			frappe.db.set_value("Loan Application", row.name, "custom_purpose_code", code, update_modified=False)
