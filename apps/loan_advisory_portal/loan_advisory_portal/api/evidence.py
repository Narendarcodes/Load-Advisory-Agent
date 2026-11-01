"""Trusted evidence-ingestion boundary for the agent service.

The FastAPI decision pipeline must not hold a Desk role that can edit Loan Applications or
Customers. It calls this single method as a user holding only `Evidence Service`:

- the record's application must equal the application the agent was authorized for;
- the record id is immutable once linked to an application;
- only the portal's `allow_on_submit` fields and, for drafts, the native status are written;
- every accepted call leaves an `Evidence Ingestion Log` row naming the actor.

The method runs with `ignore_permissions` internally because the role itself holds no DocType
CRUD grants. Authorization is the explicit role check below, never a System Manager fallback.
"""

import hashlib
import json

import frappe
from frappe import _

from loan_advisory_portal.portal import lifecycle

EVIDENCE_ROLE = "Evidence Service"
EVIDENCE_DOCTYPE = "Loan Decision Evidence"
LOG_DOCTYPE = "Evidence Ingestion Log"
STATE_LOG_DOCTYPE = "Application State Log"
ALLOWED_DECISIONS = {"APPROVED", "REJECTED", "ERROR"}


def _require_service() -> None:
	if not frappe.session.user or frappe.session.user == "Guest":
		raise frappe.PermissionError(_("evidence ingestion requires a service account"))
	if EVIDENCE_ROLE not in frappe.get_roles():
		raise frappe.PermissionError(_("evidence ingestion requires the Evidence Service role"))


def _as_dict(value, label: str) -> dict:
	if isinstance(value, str):
		try:
			value = json.loads(value)
		except ValueError:
			frappe.throw(_("{0} must be a JSON object").format(label), frappe.ValidationError)
	if not isinstance(value, dict):
		frappe.throw(_("{0} must be a JSON object").format(label), frappe.ValidationError)
	return value


def _valid_lifecycle_states() -> set[str]:
	return set(lifecycle.STATES)


def _text(record: dict, key: str, default: str = "") -> str:
	value = record.get(key)
	return str(value).strip() if value is not None else default


def _engine(record: dict) -> str:
	engine = record.get("engine")
	if isinstance(engine, dict):
		return f"{engine.get('name') or ''} {engine.get('version') or ''}".strip()
	return str(engine or "").strip()


@frappe.whitelist(methods=["POST"])
def ingest(record: dict | str, native_status: str = "Open", expected_application: str | None = None,
		trace_store: str | None = None) -> dict:
	"""Persist one Decision Evidence record and move the application's portal fields."""
	_require_service()
	record = _as_dict(record, "record")
	application_ref = _text(record, "application_ref")
	record_id = _text(record, "record_id")
	decision = _text(record, "decision")
	lifecycle_state = _text(record, "lifecycle_state")
	expected = (expected_application or "").strip()
	native_status = (native_status or "Open").strip()

	if not record_id or len(record_id) > 128:
		frappe.throw(_("record_id is required and must be at most 128 characters"), frappe.ValidationError)
	if not application_ref:
		frappe.throw(_("application_ref is required"), frappe.ValidationError)
	if not expected:
		frappe.throw(_("expected_application is required"), frappe.ValidationError)
	if expected != application_ref:
		raise frappe.PermissionError(_("evidence does not belong to the authorized application"))
	if record.get("is_simulation"):
		frappe.throw(_("simulation records are never persisted"), frappe.ValidationError)
	if decision not in ALLOWED_DECISIONS:
		frappe.throw(_("decision must be one of {0}").format(sorted(ALLOWED_DECISIONS)), frappe.ValidationError)
	if lifecycle_state not in _valid_lifecycle_states():
		frappe.throw(_("unknown lifecycle state"), frappe.ValidationError)
	if native_status != lifecycle.native_status_for(lifecycle_state):
		frappe.throw(
			_("native status must be {0} for {1}").format(
				lifecycle.native_status_for(lifecycle_state), lifecycle_state
			),
			frappe.ValidationError,
		)
	if not frappe.db.exists("Loan Application", application_ref):
		raise frappe.DoesNotExistError(_("unknown application"))

	policy = record.get("policy") or {}
	inputs = record.get("inputs") or {}
	trace_ref = record.get("trace_ref") or {}
	record_json = json.dumps(record, sort_keys=True, ensure_ascii=False)
	# Ownership precedes state: a record id that already belongs elsewhere is refused as a
	# permission error even if the claimed application could not accept the transition.
	existing = frappe.db.get_value(
		EVIDENCE_DOCTYPE, record_id, ["loan_application", "record_json"], as_dict=True
	)
	if existing:
		if existing.loan_application != application_ref:
			raise frappe.PermissionError(_("record id is already linked to another application"))
		if existing.record_json != record_json:
			frappe.throw(_("record id already exists with different content"), frappe.ValidationError)
		action = "unchanged"

	application = frappe.get_doc("Loan Application", application_ref)
	current_state = application.get("custom_lifecycle_state") or "DRAFT"
	try:
		lifecycle.check_automated_transition(current_state, lifecycle_state)
	except ValueError as exc:
		frappe.throw(_("invalid lifecycle transition: {0}").format(exc), frappe.ValidationError)

	if not existing:
		doc = frappe.get_doc(
			{
				"doctype": EVIDENCE_DOCTYPE,
				"record_id": record_id,
				"loan_application": application_ref,
				"decision": decision,
				"lifecycle_state": lifecycle_state,
				"policy_id": str(policy.get("id") or ""),
				"policy_version": str(policy.get("version") or ""),
				"policy_sha256": str(policy.get("policy_sha256") or ""),
				"jdm_sha256": str(policy.get("jdm_sha256") or ""),
				"input_sha256": str(inputs.get("input_sha256") or ""),
				"engine": _engine(record),
				"evaluated_at": _text(record, "evaluated_at")[:19].replace("T", " ") or None,
				"trace_sha256": str(trace_ref.get("sha256") or ""),
				"trace_store": str(trace_store or trace_ref.get("store") or "")[:140],
				"is_simulation": 0,
				"record_json": record_json,
			}
		)
		doc.flags.ignore_permissions = True
		doc.insert()
		action = "created"

	application.db_set("custom_lifecycle_state", lifecycle_state, update_modified=False)
	application.db_set("custom_latest_evidence", record_id, update_modified=False)
	if policy.get("version"):
		application.db_set("custom_policy_version", str(policy["version"]), update_modified=False)
	wrote_native = application.docstatus == 0
	if wrote_native:
		application.db_set("status", native_status, update_modified=False)

	# Every transition and every ingestion is written in the same database transaction
	# as the evidence and the application, so a failure leaves none of them behind.
	if lifecycle_state != current_state:
		state_log = frappe.get_doc(
			{
				"doctype": STATE_LOG_DOCTYPE,
				"loan_application": application_ref,
				"from_state": current_state,
				"to_state": lifecycle_state,
				"actor": frappe.session.user,
				"source": "agent",
				"record_id": record_id,
				"native_status": native_status,
				"native_written": 1 if wrote_native else 0,
			}
		)
		state_log.flags.ignore_permissions = True
		state_log.insert()
	log = frappe.get_doc(
		{
			"doctype": LOG_DOCTYPE,
			"record_id": record_id,
			"loan_application": application_ref,
			"action": action,
			"actor": frappe.session.user,
			"expected_application": expected,
			"lifecycle_state": lifecycle_state,
			"wrote_native_status": 1 if wrote_native else 0,
			"record_sha256": hashlib.sha256(record_json.encode("utf-8")).hexdigest(),
		}
	)
	log.flags.ignore_permissions = True
	log.insert()

	return {
		"record_id": record_id,
		"application": application_ref,
		"action": action,
		"lifecycle_state": lifecycle_state,
		"docstatus": application.docstatus,
		"wrote_native_status": wrote_native,
	}


@frappe.whitelist()
def get_record(record_id: str) -> dict:
	"""Read one stored evidence record for the evidence service (no general read grant needed)."""
	_require_service()
	row = frappe.db.get_value(EVIDENCE_DOCTYPE, record_id, ["loan_application", "record_json"], as_dict=True)
	if not row:
		raise frappe.DoesNotExistError(_("evidence not found"))
	return json.loads(row.record_json)


@frappe.whitelist()
def audit_log(record_id: str) -> list[dict]:
	"""Audit rows for one record, oldest first; used by operators and tests."""
	_require_service()
	return frappe.get_all(
		LOG_DOCTYPE,
		filters={"record_id": record_id},
		fields=["name", "record_id", "loan_application", "action", "actor", "expected_application",
			"lifecycle_state", "wrote_native_status", "record_sha256", "creation"],
		order_by="creation asc",
		limit_page_length=100,
	)
