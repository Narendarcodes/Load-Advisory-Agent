"""Bank Statement Summary: derived features of an Account Aggregator statement."""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards


class BankStatementSummary(Document):
	def validate(self):
		try:
			lms_guards.check_sha256(self.content_sha256, "content_sha256")
			lms_guards.check_pattern(self.account_masked, r"^[0-9]{4}$", "account_masked (last 4 digits)")
			lms_guards.check_pattern(self.ifsc, lms_guards.IFSC_PATTERN, "ifsc")
			for fieldname in ("monthly_income_history", "observed_recurring_debits", "statement_validation_flags"):
				lms_guards.parse_json(self.get(fieldname), fieldname, expect=list)
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		if self.period_from and self.period_to and str(self.period_from) > str(self.period_to):
			frappe.throw(_("period_from must not be after period_to."), frappe.ValidationError)
