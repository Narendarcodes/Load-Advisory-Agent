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
		self.sync_consent_timestamp()
		self.profile_completion = completion_of(self)
		if self.profile_completion >= 100:
			self.onboarding_state = "Profile Complete"

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
