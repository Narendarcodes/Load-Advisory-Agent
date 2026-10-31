import json

import frappe
from frappe import _
from frappe.model.document import Document


class LoanDecisionEvidence(Document):
	def validate(self):
		if self.record_json:
			try:
				json.loads(self.record_json)
			except ValueError:
				frappe.throw(_("record_json must be valid JSON."), frappe.ValidationError)

	def on_update(self):
		if self.is_simulation:
			frappe.throw(_("Simulation evidence must never be persisted."), frappe.ValidationError)
