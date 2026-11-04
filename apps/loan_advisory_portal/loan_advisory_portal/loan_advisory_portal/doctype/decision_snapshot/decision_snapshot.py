"""Decision Snapshot: the immutable, replayable record of one ZEN decision.

- The frozen ZEN input is hashed on validate; a stored hash that does not match is refused.
- The document is submitted when recorded and is never edited, cancelled or deleted after:
  `before_update_after_submit`, `before_cancel` and `on_trash` all refuse. No field is
  `allow_on_submit`, so Frappe's own update-after-submit check refuses edits as well.
- Officer review (ADR-0008) writes only to the Loan Application's review audit table and
  never to this document.
"""

import frappe
from frappe import _
from frappe.model.document import Document

from loan_advisory_portal.portal import lms_guards

JSON_LIST_FIELDS = (
	"review_flags", "conflict_flags", "unresolved_conflicts", "fraud_indicators",
	"evidence_comparison_results", "supplied_fields", "submitted_documents", "evidence_references",
)
IMMUTABLE_MESSAGE = "A Decision Snapshot is immutable once submitted. Record a new decision instead."


class DecisionSnapshot(Document):
	def validate(self):
		try:
			self.zen_input_sha256 = lms_guards.freeze_input(self.zen_input_json, self.zen_input_sha256)
			lms_guards.check_categories(self.borrower_categories)
			lms_guards.check_sha256(self.catalogue_sha256, "catalogue_sha256")
			for fieldname in JSON_LIST_FIELDS:
				lms_guards.parse_json(self.get(fieldname), fieldname, expect=list)
			for row in self.get("rule_results") or []:
				lms_guards.parse_json(row.parameters_json, f"rule {row.rule_id} parameters_json")
				lms_guards.parse_json(row.evidence_refs, f"rule {row.rule_id} evidence_refs")
			for row in self.get("policy_parameters") or []:
				lms_guards.parse_json(row.value_json, f"parameter {row.parameter_name}", expect=(list, dict, str, int, float, bool))
		except lms_guards.GuardError as exc:
			frappe.throw(_(str(exc)), frappe.ValidationError)
		if self.outcome == "COUNTER_OFFER" and not (self.offer_amount and self.offer_tenure_months):
			frappe.throw(_("A counter offer needs an offer amount and tenure."), frappe.ValidationError)

	def before_update_after_submit(self):
		frappe.throw(_(IMMUTABLE_MESSAGE), frappe.ValidationError)

	def before_cancel(self):
		frappe.throw(_(IMMUTABLE_MESSAGE), frappe.ValidationError)

	def on_trash(self):
		if self.docstatus == 1:
			frappe.throw(_(IMMUTABLE_MESSAGE), frappe.ValidationError)
