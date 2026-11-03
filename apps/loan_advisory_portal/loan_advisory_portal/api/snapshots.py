"""Trusted writer for Decision Snapshots (service accounts holding `Evidence Service` only).

`record_decision_snapshot` inserts and submits one immutable snapshot (frozen ZEN input,
catalogue version, outcome, offer, borrower categories, internal reasons and rule results)
and copies the queue columns onto the Loan Application. It never edits an existing
snapshot: a new decision is a new snapshot.
"""

import json

import frappe
from frappe import _

from loan_advisory_portal.portal import lms_guards

EVIDENCE_ROLE = "Evidence Service"
SNAPSHOT_FIELDS = (
	"loan_decision_evidence", "outcome", "profile", "not_for_live_use", "catalogue_version", "catalogue_sha256",
	"policy_version", "assessment_date", "evaluated_at", "zen_input_json", "offer_outcome", "offer_amount",
	"eligible_amount", "offer_emi", "offer_tenure_months", "offer_rate", "assessment_rate", "binding_cap",
	"risk_grade", "amount_band", "borrower_categories", "internal_reasons", "proposed_emi", "foir",
)
# Snapshot field -> Loan Application custom field shown in the Saral Review queue.
LA_COPY = {
	"outcome": "custom_decision_outcome",
	"internal_reasons": "custom_internal_reasons",
	"offer_outcome": "custom_offer_outcome",
	"eligible_amount": "custom_eligible_amount",
	"offer_amount": "custom_offer_amount",
	"offer_emi": "custom_offer_emi",
	"offer_tenure_months": "custom_offer_tenure_months",
	"offer_rate": "custom_offer_rate",
	"assessment_rate": "custom_assessment_rate",
	"amount_band": "custom_amount_band",
	"proposed_emi": "custom_proposed_emi",
	"foir": "custom_foir",
}


def _require_service() -> None:
	if not frappe.session.user or frappe.session.user == "Guest":
		raise frappe.PermissionError(_("snapshot recording requires a service account"))
	if EVIDENCE_ROLE not in frappe.get_roles():
		raise frappe.PermissionError(_("snapshot recording requires the Evidence Service role"))


def _as_json_text(value):
	return value if isinstance(value, str) or value is None else json.dumps(value, ensure_ascii=False)


@frappe.whitelist(methods=["POST"])
def record_decision_snapshot(application: str, snapshot) -> dict:
	_require_service()
	if isinstance(snapshot, str):
		snapshot = json.loads(snapshot)
	if not frappe.db.exists("Loan Application", application):
		raise frappe.DoesNotExistError(_("Loan Application not found."))
	values = {k: snapshot.get(k) for k in SNAPSHOT_FIELDS if k in snapshot}
	for key in ("zen_input_json", "borrower_categories"):
		values[key] = _as_json_text(values.get(key))
	doc = frappe.get_doc({
		"doctype": "Decision Snapshot",
		"loan_application": application,
		**values,
		"rule_results": [
			{**row, "parameters_json": _as_json_text(row.get("parameters_json")),
			 "evidence_refs": _as_json_text(row.get("evidence_refs"))}
			for row in snapshot.get("rule_results") or []
		],
		"policy_parameters": [
			{**row, "value_json": _as_json_text(row.get("value_json"))} for row in snapshot.get("policy_parameters") or []
		],
	})
	doc.flags.ignore_permissions = True
	doc.insert()
	doc.submit()

	categories = lms_guards.check_categories(doc.borrower_categories)
	updates = {la_field: doc.get(field) for field, la_field in LA_COPY.items()}
	updates["custom_decision_snapshot"] = doc.name
	updates["custom_borrower_categories"] = ", ".join(categories)
	frappe.db.set_value("Loan Application", application, updates)
	return {"snapshot": doc.name, "zen_input_sha256": doc.zen_input_sha256}
