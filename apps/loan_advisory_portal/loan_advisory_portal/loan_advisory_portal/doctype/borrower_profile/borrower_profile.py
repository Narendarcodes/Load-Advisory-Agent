import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

REQUIRED_FIELDS = (
	"full_name",
	"phone",
	"employment_type",
	"employment_months",
	"monthly_income",
	"monthly_obligations",
)


def completion_of(doc) -> int:
	done = sum(1 for field in REQUIRED_FIELDS if doc.get(field) not in (None, ""))
	done += 1 if doc.get("consent_terms") and doc.get("consent_privacy") else 0
	return round(100 * done / (len(REQUIRED_FIELDS) + 1))


class BorrowerProfile(Document):
	def validate(self):
		if not frappe.db.exists("Customer", self.customer):
			frappe.throw(_("Customer does not exist."), frappe.LinkValidationError)
		if self.monthly_income and self.monthly_income < 0:
			frappe.throw(_("Monthly income cannot be negative."), frappe.ValidationError)
		if self.monthly_obligations and self.monthly_obligations < 0:
			frappe.throw(_("Monthly obligations cannot be negative."), frappe.ValidationError)
		if self.employment_months and self.employment_months < 0:
			frappe.throw(_("Employment months cannot be negative."), frappe.ValidationError)
		self.consent_at = now_datetime() if self.consent_terms and self.consent_privacy else None
		self.profile_completion = completion_of(self)
		if self.profile_completion >= 100:
			self.onboarding_state = "Profile Complete"
