import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards


class NegativeListEntry(Document):
	def validate(self):
		try:
			lms_guards.check_sha256(self.pan_hash, "pan_hash")
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
