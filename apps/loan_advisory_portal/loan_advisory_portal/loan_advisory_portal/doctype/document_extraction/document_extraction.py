import frappe
from frappe.model.document import Document


class DocumentExtraction(Document):
	"""Audit record of one OCR read and, when given, the applicant's confirmation.

	Rows are append-only by convention: the API never edits an existing row, so the
	`extracted_values` snapshot stays as the engine produced it even after the applicant
	corrects a field. A correction is visible by comparing it with `confirmed_values`.
	"""

	def validate(self):
		if self.status not in ("Extracted", "Confirmed"):
			frappe.throw("Unknown extraction status.")
