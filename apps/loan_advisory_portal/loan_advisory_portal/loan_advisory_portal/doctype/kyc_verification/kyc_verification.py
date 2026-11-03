"""KYC Verification: masked PAN, PAN hash and Aadhaar last 4 only (full values are NEVER_STORE)."""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards


class KYCVerification(Document):
	def validate(self):
		try:
			lms_guards.check_masked_pan(self.pan_masked)
			lms_guards.check_aadhaar_last4(self.aadhaar_last4)
			lms_guards.check_sha256(self.pan_hash, "pan_hash")
			for fieldname in ("verified_identity", "identity_fields", "extracted_identity_fields"):
				lms_guards.parse_json(self.get(fieldname), fieldname, expect=dict)
			lms_guards.parse_json(self.supplied_identity_fields, "supplied_identity_fields", expect=list)
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		for fieldname in ("kyc_name_match_score", "name_similarity", "address_similarity"):
			value = self.get(fieldname)
			if value is not None and not 0 <= value <= 1:
				frappe.throw(_("{0} must be between 0 and 1.").format(fieldname), frappe.ValidationError)
