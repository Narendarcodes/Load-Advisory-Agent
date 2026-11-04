"""Consent Record: one append-only row per consent event (purpose, version, time, channel).

After insert only `withdrawn_at` may be set, once. Withdrawal is a new fact, not an edit.
"""

import frappe
from frappe import _
from frappe.model.document import Document

FROZEN_FIELDS = (
	"borrower_profile", "loan_application", "consent_type", "consent_text", "purpose", "version", "granted_at", "channel",
)


class ConsentRecord(Document):
	def validate(self):
		if self.consent_text:
			text = frappe.db.get_value("Consent Text", self.consent_text, ["consent_type", "version"], as_dict=True)
			if not text or (text.consent_type, text.version) != (self.consent_type, self.version):
				frappe.throw(_("The consent text does not match this consent type and version."), frappe.ValidationError)
		previous = self.get_doc_before_save()
		if previous is None:
			return
		changed = [f for f in FROZEN_FIELDS if str(previous.get(f) or "") != str(self.get(f) or "")]
		if changed:
			frappe.throw(_("A consent record cannot be changed ({0}). Record a new consent.").format(", ".join(changed)),
			             frappe.ValidationError)
		if previous.get("withdrawn_at") and str(previous.withdrawn_at) != str(self.withdrawn_at or ""):
			frappe.throw(_("A withdrawal is recorded once."), frappe.ValidationError)

	def on_trash(self):
		frappe.throw(_("Consent records are kept for audit and cannot be deleted."), frappe.ValidationError)
