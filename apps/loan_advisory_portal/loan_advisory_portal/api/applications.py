"""Borrower application endpoints.

Every read funnels through `owned_application`, so a foreign or unknown
application id is indistinguishable from a missing one (404).
"""

import json
import uuid

import frappe
from frappe import _
from frappe.utils import flt, now_datetime, nowdate, validate_phone_number_with_country_code

from loan_advisory_portal.portal import guidance, lifecycle, limits
from loan_advisory_portal.portal.errors import Conflict, Forbidden, ServiceUnavailable
from loan_advisory_portal.portal.identity import (
	borrower_context,
	owned_application,
	set_selected_application,
)

STATE_LOG_DOCTYPE = "Application State Log"
STATE_EVENTS = {
	"SUBMITTED": "Submitted",
	"INFO_REQUESTED": "Information requested",
	"UNDER_REVIEW": "Under review",
	"MANUAL_REVIEW": "Manual review",
	"APPROVED": "Approved",
	"REJECTED": "Not approved",
	"WITHDRAWN": "Withdrawn",
}

LIST_FIELDS = (
	"name",
	"status",
	"custom_lifecycle_state",
	"loan_product",
	"loan_amount",
	"repayment_periods",
	"posting_date",
	"custom_submitted_at",
	"custom_latest_evidence",
	"custom_policy_version",
	"custom_loan_purpose",
)

MIN_TENURE, MAX_TENURE = 1, 360
MIN_CREDIT_SCORE, MAX_CREDIT_SCORE = 300, 900
MAX_EMPLOYMENT_MONTHS = 720
MAX_PURPOSE = 200


def _resolve_product() -> dict:
	configured = frappe.conf.get("loan_advisory_product")
	if configured:
		product = frappe.db.get_value(
			"Loan Product",
			configured,
			["name", "product_name", "company", "maximum_loan_amount", "rate_of_interest", "disabled"],
			as_dict=True,
		)
		if not product or product.disabled:
			raise ServiceUnavailable(_("No lending product is available right now."))
		return product

	products = frappe.get_all(
		"Loan Product",
		filters={"disabled": 0, "is_term_loan": 1},
		fields=["name", "product_name", "company", "maximum_loan_amount", "rate_of_interest", "disabled"],
		limit_page_length=2,
	)
	if len(products) != 1:
		raise ServiceUnavailable(_("No lending product is available right now."))
	return products[0]


def _number(value, field: str, *, minimum: float = 0, maximum: float | None = None) -> float | None:
	if value in (None, ""):
		return None
	try:
		number = flt(value)
	except (TypeError, ValueError):
		raise Forbidden(_("Enter a valid number for {0}.").format(field)) from None
	if number < minimum or (maximum is not None and number > maximum):
		raise Forbidden(_("Value out of range for {0}.").format(field))
	return number


def _serialise(doc, evidence: dict | None = None) -> dict:
	return {
		"name": doc.name,
		"status": doc.status,
		"lifecycle": doc.get("custom_lifecycle_state") or "",
		"loan_product": doc.loan_product,
		"loan_amount": doc.loan_amount,
		"tenure_months": doc.repayment_periods,
		"posting_date": str(doc.posting_date or ""),
		"submitted_at": str(doc.get("custom_submitted_at") or ""),
		"purpose": doc.get("custom_loan_purpose") or "",
		"policy_version": doc.get("custom_policy_version") or "",
		"decision": evidence,
	}


def _evidence_summary(record_id: str | None) -> dict | None:
	if not record_id or not frappe.db.exists("Loan Decision Evidence", record_id):
		return None
	record = frappe.db.get_value(
		"Loan Decision Evidence",
		record_id,
		["decision", "policy_version", "evaluated_at", "is_simulation"],
		as_dict=True,
	)
	if not record:
		return None
	return {
		"decision": record.decision,
		"policy_version": record.policy_version,
		"evaluated_at": str(record.evaluated_at or ""),
		"simulation": bool(record.is_simulation),
	}


@frappe.whitelist()
def list_applications() -> list[dict]:
	ctx = borrower_context()
	rows = frappe.get_all(
		"Loan Application",
		filters={"applicant_type": "Customer", "applicant": ctx.customer},
		fields=list(LIST_FIELDS),
		order_by="creation desc",
		limit_page_length=100,
	)
	return [_serialise(frappe._dict(row), _evidence_summary(row.custom_latest_evidence)) for row in rows]


@frappe.whitelist()
def get_application(application: str) -> dict:
	doc = frappe.get_doc("Loan Application", owned_application(application).name)
	payload = _serialise(doc, _evidence_summary(doc.get("custom_latest_evidence")))
	payload.update(
		{
			"docstatus": doc.docstatus,
			"documents": _documents(doc),
			"product": frappe.db.get_value(
				"Loan Product",
				doc.loan_product,
				["product_name", "rate_of_interest", "maximum_loan_amount"],
				as_dict=True,
			),
			"inputs": {
				"monthly_income": doc.get("custom_monthly_income"),
				"monthly_obligations": doc.get("custom_monthly_obligations"),
				# Int fields read back as 0 when never set; 0 is not a credit score.
				"credit_score": doc.get("custom_credit_score") or None,
				"employment_months": doc.get("custom_employment_months"),
			},
			"contact": {
				"name": doc.applicant_name,
				"email": doc.applicant_email_address,
				"phone": doc.applicant_phone_number,
			},
			"timeline": _timeline(doc),
			"guidance": guidance.for_state(doc.get("custom_lifecycle_state") or "DRAFT"),
		}
	)
	return payload


def _documents(doc) -> list[dict]:
	return [
		{
			"row": row.name,
			"document_type": row.document_type,
			"file": row.file,
			"file_name": frappe.db.get_value("File", row.file, "file_name") if row.file else None,
		}
		for row in doc.get("documents") or []
	]


def _record_state(application: str, from_state: str, to_state: str, actor: str, *,
                  source: str = "portal", record_id: str | None = None,
                  native_status: str | None = None, native_written: int = 0) -> None:
	log = frappe.get_doc(
		{
			"doctype": STATE_LOG_DOCTYPE,
			"loan_application": application,
			"from_state": from_state,
			"to_state": to_state,
			"actor": actor,
			"source": source,
			"record_id": record_id,
			"native_status": native_status,
			"native_written": 1 if native_written else 0,
		}
	)
	log.flags.ignore_permissions = True
	log.insert()


def _timeline(doc) -> list[dict]:
	"""One ordered history: the immutable transition log plus the evaluation that caused a decision."""
	rows = frappe.get_all(
		STATE_LOG_DOCTYPE,
		filters={"loan_application": doc.name},
		fields=["from_state", "to_state", "source", "record_id", "creation"],
		order_by="creation asc",
		limit_page_length=100,
	)
	record_id = doc.get("custom_latest_evidence")
	record = frappe.db.get_value(
		"Loan Decision Evidence", record_id, ["evaluated_at", "decision", "policy_version"], as_dict=True
	) if record_id else None

	events = [(str(doc.creation), 0, {"at": str(doc.creation), "event": "Started"})]
	for row in rows:
		if record and row.record_id == record_id and row.to_state == doc.get("custom_lifecycle_state"):
			events.append((str(row.creation), -1, {
				"at": str(record.evaluated_at or row.creation),
				"event": f"Evaluated ({record.decision})",
				"policy_version": record.policy_version,
			}))
		events.append((str(row.creation), 0, {
			"at": str(row.creation),
			"event": STATE_EVENTS.get(row.to_state, row.to_state.title()),
			"state": row.to_state,
			"source": row.source,
		}))
	events.sort(key=lambda item: (item[0], item[1]))
	return [event for _, _, event in events]


@frappe.whitelist()
def get_decision(application: str) -> dict:
	doc = frappe.get_doc("Loan Application", owned_application(application).name)
	record_id = doc.get("custom_latest_evidence")
	if not record_id or not frappe.db.exists("Loan Decision Evidence", record_id):
		return {"available": False}
	record = frappe.get_doc("Loan Decision Evidence", record_id)
	payload = {
		"available": True,
		"decision": record.decision,
		"lifecycle": record.lifecycle_state,
		"policy_version": record.policy_version,
		"evaluated_at": str(record.evaluated_at or ""),
		"simulation": bool(record.is_simulation),
	}
	payload.update(_borrower_detail(record, doc.get("custom_lifecycle_state") or "DRAFT"))
	return payload


def _borrower_detail(record, application_state: str) -> dict:
	"""Only what the borrower is entitled to see.

	The policy marks each rule `customer_visible`; thresholds, actual values,
	hashes and trace paths stay in the evidence store for audit and reviewers.
	"""
	try:
		detail = json.loads(record.record_json or "{}")
	except ValueError:
		detail = {}
	reasons = [
		{"code": entry.get("reason_code"), "text": entry.get("description")}
		for entry in detail.get("rule_evaluations") or []
		if entry.get("customer_visible") and entry.get("result") == "FAIL"
	]
	review = detail.get("review") or {}
	missing = (detail.get("inputs") or {}).get("missing_fields") or []
	return {
		"outcome": detail.get("outcome") or record.decision,
		"reasons": reasons,
		"missing_fields": missing,
		# The application owns the current state; the evidence record is a snapshot. After a
		# resubmission the app is SUBMITTED again even though the stored record says INFO_REQUESTED.
		"information_needed": bool(review or missing) and application_state == "INFO_REQUESTED",
		"provider_error": bool(review.get("provider_error")),
		"flags": detail.get("flags") or [],
	}


@frappe.whitelist(methods=["POST"])
def create_application(
	loan_amount,
	tenure_months,
	purpose: str,
	monthly_income=None,
	monthly_obligations=None,
	credit_score=None,
	employment_months=None,
	select: int | bool = 0,
) -> dict:
	ctx = borrower_context()
	limits.enforce("application-create", 30, 3600)
	product = _resolve_product()

	amount = _number(loan_amount, "loan amount", minimum=1)
	if not amount:
		raise Forbidden(_("Enter the amount you need."))
	if product.maximum_loan_amount and amount > product.maximum_loan_amount:
		raise Forbidden(_("The amount exceeds this product's maximum of {0}.").format(product.maximum_loan_amount))
	tenure = _number(tenure_months, "tenure", minimum=MIN_TENURE, maximum=MAX_TENURE)
	if not tenure:
		raise Forbidden(_("Choose a repayment tenure."))
	purpose = (purpose or "").strip()
	if not purpose or len(purpose) > MAX_PURPOSE:
		raise Forbidden(_("Describe what the loan is for."))

	score = _number(credit_score, "credit score", minimum=MIN_CREDIT_SCORE, maximum=MAX_CREDIT_SCORE)
	months = _number(employment_months, "employment months", minimum=0, maximum=MAX_EMPLOYMENT_MONTHS)

	profile = frappe.get_doc("Borrower Profile", ctx.profile)
	user = frappe.get_doc("User", ctx.user)
	if profile.phone:
		try:
			validate_phone_number_with_country_code(profile.phone, "phone")
		except frappe.ValidationError:
			raise Forbidden(_("Add a phone number with country code to your profile first.")) from None

	doc = frappe.get_doc(
		{
			"doctype": "Loan Application",
			"applicant_type": "Customer",
			"applicant": ctx.customer,
			"applicant_name": profile.full_name or user.full_name,
			"applicant_email_address": profile.email or user.email,
			"applicant_phone_number": profile.phone,
			"company": product.company,
			"loan_product": product.name,
			"posting_date": nowdate(),
			"is_term_loan": 1,
			"loan_amount": amount,
			"rate_of_interest": product.rate_of_interest or 0,
			"repayment_method": "Repay Over Number of Periods",
			"repayment_periods": int(tenure),
			"custom_loan_purpose": purpose,
			"custom_monthly_income": _number(monthly_income, "monthly income")
			if monthly_income not in (None, "")
			else profile.monthly_income,
			"custom_monthly_obligations": _number(monthly_obligations, "monthly obligations")
			if monthly_obligations not in (None, "")
			else profile.monthly_obligations,
			"custom_credit_score": int(score) if score is not None else None,
			"custom_employment_months": int(months) if months is not None else profile.employment_months,
			"custom_external_ref": f"POR-{uuid.uuid4().hex}",
		}
	)
	doc.flags.ignore_permissions = True
	doc.insert()

	if select:
		set_selected_application(doc.name)
	return _serialise(doc)


@frappe.whitelist(methods=["POST"])
def submit_application(application: str) -> dict:
	ctx = borrower_context()
	limits.enforce("application-transition", 30, 3600)
	ref = owned_application(application, ctx).name
	doc = frappe.get_doc("Loan Application", ref)
	if doc.docstatus != 0:
		raise Conflict(_("This application has already been submitted."))
	if not doc.get("documents"):
		raise Conflict(_("Attach at least one document before submitting."))

	current_state = doc.get("custom_lifecycle_state") or "DRAFT"
	try:
		lifecycle.check_transition(current_state, "SUBMITTED")
	except lifecycle.IllegalTransition:
		raise Conflict(_("This application can no longer be submitted.")) from None

	doc.custom_lifecycle_state = "SUBMITTED"
	doc.custom_submitted_at = now_datetime()
	doc.flags.ignore_permissions = True
	doc.save()
	doc.submit()
	_record_state(doc.name, current_state, "SUBMITTED", ctx.user, native_status=doc.status)
	set_selected_application(doc.name)
	return _serialise(doc)


@frappe.whitelist(methods=["POST"])
def resubmit_application(application: str, monthly_income=None, monthly_obligations=None,
                         credit_score=None, employment_months=None) -> dict:
	"""Correct scored inputs on an information-requested application and resubmit it.

	The document stays submitted (`docstatus = 1`) and Lending's `status` is untouched;
	only the four scored inputs and the portal lifecycle marker change. Documents remain
	frozen, so a submission cannot be altered while it is being re-reviewed.
	"""
	ctx = borrower_context()
	limits.enforce("application-transition", 30, 3600)
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	current_state = doc.get("custom_lifecycle_state") or "DRAFT"
	if doc.docstatus != 1 or current_state != "INFO_REQUESTED":
		raise Conflict(_("Only an application that needs more information can be resubmitted."))
	try:
		lifecycle.check_transition(current_state, "SUBMITTED")
	except lifecycle.IllegalTransition:
		raise Conflict(_("This application can no longer be resubmitted.")) from None
	if not doc.get("documents"):
		raise Conflict(_("Attach at least one document before submitting."))

	income = _number(monthly_income, "monthly income")
	obligations = _number(monthly_obligations, "monthly obligations")
	score = _number(credit_score, "credit score", minimum=MIN_CREDIT_SCORE, maximum=MAX_CREDIT_SCORE)
	months = _number(employment_months, "employment months", minimum=0, maximum=MAX_EMPLOYMENT_MONTHS)

	# The scored fields stay non-allow_on_submit on purpose; this endpoint is their only
	# post-submit writer, so no role can edit a submitted application through document save.
	doc.db_set("custom_monthly_income", income, update_modified=False)
	doc.db_set("custom_monthly_obligations", obligations, update_modified=False)
	doc.db_set("custom_credit_score", int(score) if score is not None else None, update_modified=False)
	doc.db_set("custom_employment_months", int(months) if months is not None else None,
	           update_modified=False)
	doc.db_set("custom_lifecycle_state", "SUBMITTED", update_modified=False)
	doc.custom_lifecycle_state = "SUBMITTED"
	_record_state(doc.name, current_state, "SUBMITTED", ctx.user, native_status=doc.status)
	set_selected_application(doc.name)
	return _serialise(doc)


@frappe.whitelist(methods=["POST"])
def withdraw_application(application: str) -> dict:
	ctx = borrower_context()
	limits.enforce("application-transition", 30, 3600)
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	current_state = doc.get("custom_lifecycle_state") or "DRAFT"
	try:
		lifecycle.check_transition(current_state, "WITHDRAWN")
	except lifecycle.IllegalTransition:
		raise Conflict(_("This application can no longer be withdrawn.")) from None
	if doc.docstatus == 1:
		# Submitted applications keep docstatus (and Lending's native status) for
		# the audit trail; only the borrower-facing lifecycle marker changes.
		frappe.db.set_value("Loan Application", doc.name, "custom_lifecycle_state", "WITHDRAWN")
		doc.custom_lifecycle_state = "WITHDRAWN"
	else:
		doc.custom_lifecycle_state = "WITHDRAWN"
		doc.flags.ignore_permissions = True
		doc.save()
	_record_state(doc.name, current_state, "WITHDRAWN", ctx.user, native_status=doc.status)
	return _serialise(doc)
