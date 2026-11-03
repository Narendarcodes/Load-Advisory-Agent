"""Borrower-facing OCR endpoints.

Three whitelisted methods, all scoped to the signed-in borrower's own application:

* `extract`  — read one attached document and return fields for review (read-only)
* `confirm`  — store the applicant's confirmed values in an audit record
* `get_extraction` — return the last confirmation for a document, if any

Nothing here writes to a Loan Application. Confirmed values are offered as prefill for
the existing apply/resubmit form; the existing endpoint stays the only writer of scored
fields, and ZEN remains the only decision engine.

Sensitive handling: the file is read into memory, the OCR package masks PAN/Aadhaar
before the value reaches a dataclass, and no recognised text is returned or logged.
"""

import json
import math
import re

import frappe
from frappe import _
from frappe.utils import now_datetime

from loan_advisory_portal.api.documents import MAX_BYTES
from loan_advisory_portal.ocr import (
    ExtractionFailed,
    OcrUnavailable,
    UnsupportedDocument,
    extract_document,
    suggested_application_values,
)
from loan_advisory_portal.ocr.masking import mask_aadhaar, mask_pan, mask_sensitive_text
from loan_advisory_portal.ocr.synthetic import synthetic_mode
from loan_advisory_portal.ocr.validator import (
    MAX_AMOUNT,
    pan_format_valid,
    parse_date,
    verhoeff_valid,
)
from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Conflict, Forbidden, ServiceUnavailable
from loan_advisory_portal.portal.identity import borrower_context, owned_application

DOCTYPE = "Document Extraction"
MAX_TEXT = 120
NUMERIC_FIELDS = {
    "basic_salary",
    "gross_salary",
    "net_salary",
    "total_deductions",
    "salary_credits",
    "total_credits",
    "total_debits",
    "closing_balance",
    "monthly_gross",
    "employment_months",
    "salary_credit_months",
    "transaction_count",
}
DATE_FIELDS = {"salary_date", "date_of_birth", "employment_start_date"}
MASKED_FIELDS = {"pan_number": mask_pan, "aadhaar_number": mask_aadhaar}


def _document(application: str, row: str, ctx):
	"""Re-check ownership of both the application and the attached private file."""
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	target = next((item for item in doc.get("documents") or [] if item.name == row), None)
	if not target or not target.file:
		raise Forbidden(_("This document is not available."))

	file_doc = frappe.get_doc("File", target.file)
	if file_doc.owner != ctx.user:
		raise Forbidden(_("This document is not available."))
	if not file_doc.is_private:
		raise Forbidden(_("Documents must be uploaded as private files."))
	if (file_doc.file_size or 0) > MAX_BYTES:
		raise Forbidden(_("Files must be 10 MB or smaller."))
	return doc, target, file_doc


def _content(file_doc) -> bytes:
	content = file_doc.get_content()
	if isinstance(content, str):
		content = content.encode("utf-8")
	if not isinstance(content, (bytes, bytearray)):
		raise Forbidden(_("This document could not be opened."))
	return bytes(content)


def _synthetic(doc, target) -> bool:
	"""Synthetic mode comes from server-side state only, never from the request body.

	On when the application or document row is flagged ``synthetic`` (a field the synthetic
	dataset loader sets; absent on real records), or when the site config key
	``saral_synthetic_mode`` / the ``SARAL_SYNTHETIC_MODE`` env setting is on.
	"""
	flagged = bool(doc.get("synthetic") or target.get("synthetic") or frappe.conf.get("saral_synthetic_mode"))
	return synthetic_mode(flagged)


def _read(target, file_doc, synthetic: bool = False):
	"""Run OCR and translate engine failures into messages a borrower can act on."""
	try:
		result = extract_document(
			target.document_type, _content(file_doc), file_doc.file_name, synthetic=synthetic
		)
	except UnsupportedDocument as exc:
		raise Forbidden(str(exc)) from exc
	except ExtractionFailed as exc:
		raise Conflict(str(exc)) from exc
	except OcrUnavailable as exc:
		raise ServiceUnavailable(
			_("Automatic reading is not available on this site right now. A person will review the file.")
		) from exc
	return result


def _prefill(doc, suggestions: dict) -> dict:
	"""Show what the application already holds so nothing is overwritten by accident."""
	existing = {field: doc.get(field) for field in suggestions}
	return {
		"values": {key: item["value"] for key, item in suggestions.items()},
		"existing": {key: value for key, value in existing.items() if value not in (None, "")},
	}


@frappe.whitelist(methods=["POST"])
def extract(application: str, row: str) -> dict:
	ctx = borrower_context()
	limits.enforce("document-extract", 30, 3600)
	doc, target, file_doc = _document(application, row, ctx)
	if doc.docstatus != 0:
		raise Conflict(_("Documents are locked after submission."))

	result = _read(target, file_doc, _synthetic(doc, target))
	payload = result.as_dict()
	payload["row"] = target.name
	payload["file_name"] = file_doc.file_name
	payload["document_type_label"] = target.document_type
	payload["suggestions"] = suggested_application_values(result)
	payload["prefill"] = _prefill(doc, payload["suggestions"])
	return payload


def _clean_values(values, fields: dict, synthetic: bool = False) -> dict:
	"""Accept only keys the engine produced, and coerce them to the worksheet's types."""
	if isinstance(values, str):
		try:
			values = json.loads(values)
		except ValueError:
			raise Forbidden(_("The confirmed values could not be read.")) from None
	if not isinstance(values, dict):
		raise Forbidden(_("The confirmed values could not be read."))

	cleaned = {}
	for key, raw in values.items():
		item = fields.get(key)
		if item is None or raw is None:
			continue
		if key in NUMERIC_FIELDS:
			try:
				number = float(str(raw).replace(",", "").strip())
			except (TypeError, ValueError):
				raise Forbidden(_("{0} must be a number.").format(item["label"])) from None
			if not math.isfinite(number) or number < 0 or number > MAX_AMOUNT:
				raise Forbidden(_("{0} is outside a plausible range.").format(item["label"]))
			cleaned[key] = number
			continue
		if key in DATE_FIELDS:
			text = str(raw).strip()
			if not text:
				continue
			parsed = parse_date(text)
			if not parsed:
				raise Forbidden(
					_("{0} must be a date such as 2026-03-31.").format(item["label"])
				)
			cleaned[key] = parsed
			continue

		text = " ".join(str(raw).split())
		if not text:
			continue
		if key in MASKED_FIELDS:
			if key == "pan_number":
				masked = bool(re.fullmatch(r"(?i)X{5}\d{4}X", text))
				if masked and (
					item.get("status") not in {"found", "low_confidence"}
					or MASKED_FIELDS[key](str(item.get("value") or "")) != mask_pan(text)
				):
					raise Forbidden(_("The extracted PAN cannot be confirmed in masked form."))
				if not masked and not pan_format_valid(text, synthetic=synthetic):
					raise Forbidden(_("Enter a PAN in the correct format."))
			elif key == "aadhaar_number":
				masked = bool(re.fullmatch(r"(?i)X{4}\s?X{4}\s?\d{4}", text))
				if masked and (
					item.get("status") not in {"found", "low_confidence"}
					or MASKED_FIELDS[key](str(item.get("value") or "")) != mask_aadhaar(text)
				):
					raise Forbidden(_("The extracted Aadhaar cannot be confirmed in masked form."))
				if not masked and (
					not re.fullmatch(r"[\d\s-]+", text) or not verhoeff_valid(text, synthetic=synthetic)
				):
					raise Forbidden(_("Enter a valid Aadhaar number."))
			text = MASKED_FIELDS[key](text)
		else:
			text = mask_sensitive_text(text)
		text = text[:MAX_TEXT]
		cleaned[key] = text

	return cleaned


@frappe.whitelist(methods=["POST"])
def confirm(application: str, row: str, values) -> dict:
	"""Record the applicant's confirmation. This does not touch the application itself."""
	ctx = borrower_context()
	limits.enforce("document-confirm", 60, 3600)
	doc, target, file_doc = _document(application, row, ctx)
	if doc.docstatus != 0:
		raise Conflict(_("Documents are locked after submission."))

	# Re-read instead of trusting the browser: the row must still be the same document,
	# and the audit record must describe what this engine produced, not a client claim.
	synthetic = _synthetic(doc, target)
	result = _read(target, file_doc, synthetic)
	fields = result.as_dict()["fields"]
	confirmed = _clean_values(values, fields, synthetic)
	if not confirmed:
		raise Forbidden(_("Confirm at least one value, or close this panel."))

	record = frappe.get_doc(
		{
			"doctype": DOCTYPE,
			"application": doc.name,
			"document_type": target.document_type,
			"file": file_doc.name,
			"file_name": file_doc.file_name,
			"kind": result.kind.value,
			"status": "Confirmed",
			"engine": result.engine,
			"engine_version": result.engine_version,
			"pages": result.pages,
			"extracted_values": json.dumps(fields, sort_keys=True),
			"confirmed_values": json.dumps(confirmed, sort_keys=True),
			"warnings": "\n".join(result.warnings)[:2000],
			"confirmed_by": frappe.session.user,
			"confirmed_on": now_datetime(),
		}
	)
	record.insert(ignore_permissions=True)

	return {
		"record": record.name,
		"status": "Confirmed",
		"confirmed_values": confirmed,
		"prefill": _prefill(doc, suggested_application_values(result)),
		"message": _("Saved. Open your application to use these details."),
	}


@frappe.whitelist()
def get_extraction(application: str, row: str) -> dict | None:
	ctx = borrower_context()
	doc, target, file_doc = _document(application, row, ctx)
	rows = frappe.get_all(
		DOCTYPE,
		filters={"application": doc.name, "file": file_doc.name, "status": "Confirmed"},
		fields=["name"],
		order_by="creation desc",
		limit_page_length=1,
	)
	if not rows:
		return None
	record = frappe.get_doc(DOCTYPE, rows[0]["name"])
	return {
		"record": record.name,
		"status": record.status,
		"document_type": record.document_type,
		"kind": record.kind,
		"file_name": record.file_name,
		"confirmed_values": _loads(record.confirmed_values),
		"extracted_values": _loads(record.extracted_values),
		"engine": record.engine,
		"engine_version": record.engine_version,
		"confirmed_on": str(record.confirmed_on or ""),
	}


def _loads(raw):
	try:
		return json.loads(raw or "{}")
	except ValueError:
		return {}
