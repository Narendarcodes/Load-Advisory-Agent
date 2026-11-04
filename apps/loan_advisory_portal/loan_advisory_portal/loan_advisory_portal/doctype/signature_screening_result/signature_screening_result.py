"""Signature Screening Result (experimental). The crop image itself is SOURCE_REFERENCE."""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards


class SignatureScreeningResult(Document):
	def validate(self):
		try:
			lms_guards.check_sha256(self.signature_crop_sha256, "signature_crop_sha256")
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		for fieldname in ("signature_similarity", "signature_anomaly_score"):
			value = self.get(fieldname)
			if value is not None and not 0 <= value <= 1:
				frappe.throw(_("{0} must be between 0 and 1.").format(fieldname), frappe.ValidationError)
