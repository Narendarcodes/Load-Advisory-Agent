import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime


class AccountInvitation(Document):
	def validate(self):
		self.email = (self.email or "").strip().lower()
		if self.expires_at and get_datetime(self.expires_at) <= now_datetime():
			frappe.throw(_("Invitation expiry must be in the future."), frappe.ValidationError)
		if not frappe.db.exists("Customer", self.customer):
			frappe.throw(_("Customer does not exist."), frappe.LinkValidationError)
		if frappe.db.get_value("Customer", self.customer, "disabled"):
			frappe.throw(_("This customer is disabled."), frappe.ValidationError)

	def on_trash(self):
		if self.redeemed:
			frappe.throw(_("Redeemed invitations cannot be deleted."), frappe.ValidationError)
