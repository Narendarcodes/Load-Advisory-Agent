import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

CATEGORIES = {"General", "Application", "Decision", "Assistant", "Voice", "Other"}


class BorrowerFeedback(Document):
	def validate(self):
		if not (1 <= int(self.rating or 0) <= 5):
			frappe.throw(_("Rating must be between 1 and 5."), frappe.ValidationError)
		message = (self.message or "").strip()
		if not message:
			frappe.throw(_("Message is required."), frappe.ValidationError)
		if len(message) > 4000:
			frappe.throw(_("Message is too long."), frappe.ValidationError)
		if self.category not in CATEGORIES:
			frappe.throw(_("Unknown feedback category."), frappe.ValidationError)
		if self.application:
			# Repeat the API's ownership rule: only the write path is whitelisted, but a
			# privileged writer must not attach feedback to somebody else's application.
			applicant = frappe.db.get_value("Loan Application", self.application, "applicant")
			if applicant != self.customer:
				frappe.throw(
					_("This application does not belong to this customer."), frappe.ValidationError
				)
		self.message = message
		self.submitted_at = self.submitted_at or now_datetime()
