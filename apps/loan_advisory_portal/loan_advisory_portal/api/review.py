"""Loan Officer desk actions for MANUAL_REVIEW applications (ADR-0008).

`approve`, `decline` and `request_info` are the only writers of a human review decision:

- the caller must hold `Loan Officer` (or be System Manager); borrowers never can;
- the move must be a `lifecycle.json` transition out of MANUAL_REVIEW (`portal.review.plan`);
- a note is required; who, when, the note and the snapshot hash go into the Loan
  Application's `custom_review_actions` audit table, and an `Application State Log` row
  (source `ops`) is written as for every other transition;
- a final decision also writes Lending's native status (Approved / Rejected);
- the Decision Snapshot is read for its hash and never written.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.portal import review

OFFICER_ROLE = "Loan Officer"
REVIEW_TABLE = "custom_review_actions"
STATE_LOG_DOCTYPE = "Application State Log"


def _require_officer() -> str:
	user = frappe.session.user
	if not user or user == "Guest":
		raise frappe.PermissionError(_("Review requires a signed-in Loan Officer."))
	roles = set(frappe.get_roles(user))
	if OFFICER_ROLE not in roles and "System Manager" not in roles:
		raise frappe.PermissionError(_("Review requires the Loan Officer role."))
	return user


def _act(action: str, application: str, note) -> dict:
	user = _require_officer()
	if not frappe.db.exists("Loan Application", application):
		raise frappe.DoesNotExistError(_("Loan Application not found."))
	# Lock the row so two officers cannot both act on the same case.
	current = frappe.db.get_value("Loan Application", application, "custom_lifecycle_state", for_update=True) or "DRAFT"
	try:
		step = review.plan(action, current, note)
	except review.ReviewError as exc:
		frappe.throw(_(str(exc)), frappe.ValidationError)

	doc = frappe.get_doc("Loan Application", application)
	snapshot = doc.get("custom_decision_snapshot")
	snapshot_sha = frappe.db.get_value("Decision Snapshot", snapshot, "zen_input_sha256") if snapshot else None
	acted_at = now_datetime()

	row = frappe.get_doc({
		"doctype": "Loan Review Action",
		"parent": doc.name,
		"parenttype": "Loan Application",
		"parentfield": REVIEW_TABLE,
		"idx": len(doc.get(REVIEW_TABLE) or []) + 1,
		"action": step["action"],
		"from_state": step["from_state"],
		"to_state": step["to_state"],
		"reviewer": user,
		"acted_at": acted_at,
		"note": step["note"],
		"decision_snapshot": snapshot,
		"snapshot_sha256": snapshot_sha,
	})
	row.db_insert()

	doc.db_set("custom_lifecycle_state", step["to_state"])
	native_written = 0
	if step["native_status"] and doc.docstatus == 1:
		doc.db_set("status", step["native_status"])
		native_written = 1
	frappe.get_doc({
		"doctype": STATE_LOG_DOCTYPE,
		"loan_application": doc.name,
		"from_state": step["from_state"],
		"to_state": step["to_state"],
		"actor": user,
		"source": "ops",
		"record_id": doc.get("custom_latest_evidence"),
		"native_status": step["native_status"] or doc.status,
		"native_written": native_written,
	}).insert(ignore_permissions=True)
	return {
		"application": doc.name,
		"action": step["action"],
		"from_state": step["from_state"],
		"to_state": step["to_state"],
		"reviewer": user,
		"acted_at": str(acted_at),
	}


@frappe.whitelist(methods=["POST"])
def approve(application: str, note: str) -> dict:
	return _act("approve", application, note)


@frappe.whitelist(methods=["POST"])
def decline(application: str, note: str) -> dict:
	return _act("decline", application, note)


@frappe.whitelist(methods=["POST"])
def request_info(application: str, note: str) -> dict:
	return _act("request_info", application, note)


@frappe.whitelist()
def get_review_context(application: str) -> dict:
	"""What the officer sees beside the form: the frozen snapshot's outcome, categories,
	internal reasons and rule results. Officer-only; never exposed to the portal."""
	_require_officer()
	snapshot_name = frappe.db.get_value("Loan Application", application, "custom_decision_snapshot")
	if not snapshot_name:
		return {"snapshot": None}
	snap = frappe.get_doc("Decision Snapshot", snapshot_name)
	return {
		"snapshot": snap.name,
		"outcome": snap.outcome,
		"catalogue_version": snap.catalogue_version,
		"zen_input_sha256": snap.zen_input_sha256,
		"borrower_categories": snap.borrower_categories,
		"internal_reasons": snap.internal_reasons,
		"offer": {"amount": snap.offer_amount, "emi": snap.offer_emi, "tenure_months": snap.offer_tenure_months,
		          "rate": snap.offer_rate},
		"rule_results": [
			{"rule_id": r.rule_id, "outcome": r.outcome, "effect": r.effect, "internal_message": r.internal_message}
			for r in snap.rule_results if r.outcome != "PASS"
		],
	}
