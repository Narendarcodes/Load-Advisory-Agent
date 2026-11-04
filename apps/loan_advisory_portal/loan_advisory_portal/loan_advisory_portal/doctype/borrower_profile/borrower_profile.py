import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

PINCODE_PATTERN = r"^[1-9][0-9]{5}$"

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
		self.validate_applicant_details()
		self.sync_consent_timestamp()
		self.profile_completion = completion_of(self)
		if self.profile_completion >= 100:
			self.onboarding_state = "Profile Complete"

	def validate_applicant_details(self):
		"""Saral applicant fields (data dictionary G10); each is checked only when present."""
		for fieldname in ("current_pincode", "permanent_pincode"):
			value = self.get(fieldname)
			if value and not re.match(PINCODE_PATTERN, str(value)):
				frappe.throw(_("{0} must be 6 digits and cannot start with 0.").format(fieldname), frappe.ValidationError)
		for fieldname in ("months_at_current_address", "total_experience_months"):
			if (self.get(fieldname) or 0) < 0:
				frappe.throw(_("{0} cannot be negative.").format(fieldname), frappe.ValidationError)
		if self.total_experience_months and self.employment_months and self.total_experience_months < self.employment_months:
			frappe.throw(_("Total experience cannot be shorter than the current employment."), frappe.ValidationError)
		if self.gross_monthly_salary and self.monthly_income and self.gross_monthly_salary < self.monthly_income:
			frappe.throw(_("Gross monthly salary cannot be below the net monthly income."), frappe.ValidationError)
		if self.date_of_birth and getdate(self.date_of_birth) >= getdate(nowdate()):
			frappe.throw(_("Date of birth must be in the past."), frappe.ValidationError)
		if self.employment_start_date and getdate(self.employment_start_date) > getdate(nowdate()):
			frappe.throw(_("The joining date cannot be in the future."), frappe.ValidationError)

	def sync_consent_timestamp(self):
		"""`consent_at` records when consent was given, not when this document was last saved.

		A consent event is consent being granted where it was not held before, or being granted
		against a notice version that is not yet recorded. Incomplete consent holds no timestamp at
		all, so a partial acceptance can never claim consent. A value that differs from the stored
		one was set deliberately by the caller — the profile API stamps an acceptance, and a
		historical value is restored through the document API — so it is kept rather than recomputed.
		"""
		if not (self.consent_terms and self.consent_privacy):
			self.consent_at = None
			return
		previous = self.get_doc_before_save()
		stored = previous.consent_at if previous else None
		if stored and self.consent_at != stored:
			return
		if previous is None or not stored:
			self.consent_at = now_datetime()
			return
		granted_before = bool(previous.consent_terms and previous.consent_privacy)
		notice_replaced = previous.get("terms_version") != self.get("terms_version") or previous.get(
			"privacy_version"
		) != self.get("privacy_version")
		if not granted_before or notice_replaced:
			self.consent_at = now_datetime()
