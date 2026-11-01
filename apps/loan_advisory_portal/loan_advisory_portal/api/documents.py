"""Application documents.

Files are private by default. A borrower can only attach files they uploaded
and only to an application they own; downloads re-check ownership every time
instead of relying on the File permission model, which borrowers do not have.
"""

import os

import frappe
from frappe import _

from loan_advisory_portal.portal import limits
from loan_advisory_portal.portal.errors import Conflict, Forbidden
from loan_advisory_portal.portal.identity import borrower_context, owned_application

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_BYTES = 10 * 1024 * 1024
MAX_DOCUMENTS = 12


@frappe.whitelist()
def list_document_types() -> list[dict]:
	borrower_context()
	return frappe.get_all(
		"Loan Document Type",
		fields=["name", "loan_document_type"],
		order_by="name asc",
		limit_page_length=100,
	)


@frappe.whitelist()
def list_documents(application: str) -> list[dict]:
	doc = frappe.get_doc("Loan Application", owned_application(application).name)
	return _rows(doc)


def _rows(doc) -> list[dict]:
	rows = []
	for row in doc.get("documents") or []:
		file_name = frappe.db.get_value("File", row.file, "file_name") if row.file else None
		rows.append(
			{
				"row": row.name,
				"document_type": row.document_type,
				"file": row.file,
				"file_name": file_name,
				"size": frappe.db.get_value("File", row.file, "file_size") if row.file else 0,
			}
		)
	return rows


def _validate_file(file_ref: str, ctx) -> "frappe.model.document.Document":
	file = frappe.get_doc("File", file_ref)
	if file.owner != ctx.user:
		raise Forbidden(_("This file cannot be attached."))
	if not file.is_private:
		raise Forbidden(_("Documents must be uploaded as private files."))
	extension = os.path.splitext(file.file_name or "")[1].lower()
	if extension not in ALLOWED_EXTENSIONS:
		raise Forbidden(_("Only PDF, JPEG and PNG files are accepted."))
	if (file.file_size or 0) > MAX_BYTES:
		raise Forbidden(_("Files must be 10 MB or smaller."))
	if file.attached_to_doctype and file.attached_to_doctype != "Loan Application":
		raise Forbidden(_("This file is already attached."))
	return file


@frappe.whitelist(methods=["POST"])
def attach_document(application: str, document_type: str, file: str) -> dict:
	ctx = borrower_context()
	limits.enforce("document-attach", 60, 3600)
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	if doc.docstatus != 0:
		raise Conflict(_("Documents cannot be added after submission."))
	if len(doc.get("documents") or []) >= MAX_DOCUMENTS:
		raise Conflict(_("No more documents can be added."))
	if not frappe.db.exists("Loan Document Type", document_type):
		raise Forbidden(_("Unknown document type."))

	file_doc = _validate_file(file, ctx)
	for row in doc.get("documents") or []:
		if row.file == file_doc.name:
			raise Conflict(_("This file is already attached."))

	doc.append("documents", {"document_type": document_type, "file": file_doc.name})
	doc.flags.ignore_permissions = True
	doc.save()

	file_doc.attached_to_doctype = "Loan Application"
	file_doc.attached_to_name = doc.name
	file_doc.attached_to_field = "documents"
	file_doc.flags.ignore_permissions = True
	file_doc.save(ignore_permissions=True)
	return {"documents": _rows(doc)}


@frappe.whitelist(methods=["POST"])
def remove_document(application: str, row: str) -> dict:
	ctx = borrower_context()
	limits.enforce("document-remove", 60, 3600)
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	if doc.docstatus != 0:
		raise Conflict(_("Documents cannot be removed after submission."))
	target = next((item for item in doc.get("documents") or [] if item.name == row), None)
	if not target:
		raise Forbidden(_("This document is not attached to the application."))

	doc.remove(target)
	doc.flags.ignore_permissions = True
	doc.save()
	if target.file and frappe.db.exists("File", target.file):
		frappe.delete_doc("File", target.file, ignore_permissions=True, delete_permanently=True)
	return {"documents": _rows(doc)}


@frappe.whitelist()
def download_document(application: str, row: str) -> None:
	ctx = borrower_context()
	limits.enforce("document-download", 240, 3600)
	doc = frappe.get_doc("Loan Application", owned_application(application, ctx).name)
	target = next((item for item in doc.get("documents") or [] if item.name == row), None)
	if not target or not target.file:
		raise Forbidden(_("This document is not available."))
	file_doc = frappe.get_doc("File", target.file)
	if file_doc.owner != ctx.user and file_doc.attached_to_name != doc.name:
		raise Forbidden(_("This document is not available."))

	content = file_doc.get_content()
	if isinstance(content, str):
		# File.get_content() decodes text-decodable bytes; the HTTP layer wants bytes.
		content = content.encode("utf-8")
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = content
	frappe.local.response.type = "download"
