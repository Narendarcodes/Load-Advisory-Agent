"""Bureau Report Summary: the LMS_SNAPSHOT summary of one synthetic bureau pull.

Raw accounts, enquiries and payment history stay at the source; only the reference,
its sha256 and the fetch time are kept here (SOURCE_REFERENCE tier).
"""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards


class BureauReportSummary(Document):
	def validate(self):
		try:
			lms_guards.check_sha256(self.snapshot_sha256, "snapshot_sha256")
			for fieldname in ("dq_issue_codes", "credit_card_balances", "total_credit_limits"):
				lms_guards.parse_json(self.get(fieldname), fieldname, expect=list)
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		if self.score_status == "PRESENT":
			if not 300 <= (self.score_value or 0) <= 900:
				frappe.throw(_("A present bureau score must be between 300 and 900."), frappe.ValidationError)
		elif self.score_value:
			frappe.throw(_("score_value must be empty unless score_status is PRESENT."), frappe.ValidationError)
