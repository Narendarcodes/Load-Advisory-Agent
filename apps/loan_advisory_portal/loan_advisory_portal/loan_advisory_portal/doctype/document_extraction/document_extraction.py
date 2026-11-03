"""Document Extraction: masked OCR values for one document. Raw OCR text is NEVER_STORE.

One doctype for both writers: the LMS record (PR #48) and the applicant's OCR confirmation
audit (PR #47). Audit rows are append-only by convention: the API never edits an existing
row, so `extracted_values` stays as the engine produced it even after the applicant corrects
a field. A correction is visible by comparing it with `confirmed_values`.
"""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards

STATUSES = ("Extracted", "Confirmed")


class DocumentExtraction(Document):
	def validate(self):
		if (self.status or "Extracted") not in STATUSES:
			frappe.throw(_("Unknown extraction status."), frappe.ValidationError)
		try:
			lms_guards.check_sha256(self.document_sha256, "document_sha256")
			for fieldname in ("tampering_flags", "anomaly_indicators"):
				lms_guards.parse_json(self.get(fieldname), fieldname, expect=list)
			for row in self.get("fields") or []:
				if lms_guards.find_raw_identifiers({row.field_key: row.masked_value or ""}):
					raise lms_guards.GuardError(f"field {row.field_key} holds an unmasked identifier")
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		for row in self.get("fields") or []:
			if row.confidence is not None and not 0 <= row.confidence <= 100:
				frappe.throw(_("Field confidence must be on the 0-100 scale."), frappe.ValidationError)
