"""Consent Text: versioned consent wording (ADR-0009).

The wording of a version never changes once saved: a change is a new version, so every
Consent Record points at exactly the text the borrower saw.
"""

import frappe
from frappe import _
from frappe.model.document import Document

FROZEN_FIELDS = ("text_id", "consent_type", "version", "title", "body")


def text_id_for(consent_type: str, version: str) -> str:
	return f"{consent_type}@{version}"


class ConsentText(Document):
	def validate(self):
		expected = text_id_for(self.consent_type, self.version)
		if not self.text_id:
			self.text_id = expected
		if self.text_id != expected:
			frappe.throw(_("text_id must be {0}.").format(expected), frappe.ValidationError)
		if self.status == "APPROVED" and self.legal_review != "APPROVED":
			frappe.throw(_("A consent text can be APPROVED only after legal review."), frappe.ValidationError)
		previous = self.get_doc_before_save()
		if previous is not None:
			changed = [f for f in FROZEN_FIELDS if (previous.get(f) or "") != (self.get(f) or "")]
			if changed:
				frappe.throw(_("Consent wording is versioned; create a new version instead of editing ({0}).").format(
					", ".join(changed)), frappe.ValidationError)
