"""Dev mode: what the pipeline is doing for one application, step by step.

On only when the site config sets ``saral_dev_panel: 1`` (local and demo sites). It shows
the developer the OCR result for each document and every ZEN rule the engine evaluated,
including rule ids, which the borrower view never shows. Production sites leave it off.
"""

import json

import frappe

from loan_advisory_portal.portal.errors import Forbidden
from loan_advisory_portal.portal.identity import owned_application

STATE_LOG = "Application State Log"


def enabled() -> bool:
	return bool(frappe.conf.get("saral_dev_panel"))


def _step(key, label, state, detail="", at="", items=None):
	return {"key": key, "label": label, "state": state, "detail": detail, "at": str(at or ""),
	        "items": items or []}


def _documents(doc) -> list[dict]:
	steps = []
	rows = doc.get("documents") or []
	for index, row in enumerate(rows, 1):
		name = frappe.db.get_value("File", row.file, "file_name") if row.file else "Document"
		ext = frappe.get_all(
			"Document Extraction",
			filters={"loan_application": doc.name, "file": row.file},
			fields=["engine", "engine_version", "ocr_route", "status", "extracted_values", "creation"],
			order_by="creation desc",
			limit_page_length=1,
		)
		if ext:
			e = ext[0]
			try:
				found = len(json.loads(e.extracted_values or "{}"))
			except ValueError:
				found = 0
			detail = f"{e.engine or 'OCR'} · {found} fields · {e.status or 'read'}"
			if e.engine_version:
				detail += f" · {e.engine_version}"
			steps.append(_step(f"doc-{index}", f"OCR · {name}", "done", detail, e.creation))
		else:
			steps.append(_step(f"doc-{index}", f"OCR · {name}", "skipped", f"{row.document_type} · not read before submit"))
	return steps


@frappe.whitelist()
def get_progress(application: str) -> dict:
	if not enabled():
		raise Forbidden("Dev mode is off on this site.")
	doc = frappe.get_doc("Loan Application", owned_application(application).name)
	state = doc.get("custom_lifecycle_state") or "DRAFT"
	logs = frappe.get_all(STATE_LOG, filters={"loan_application": doc.name},
	                      fields=["from_state", "to_state", "source", "creation"], order_by="creation asc",
	                      limit_page_length=100)
	submitted = next((log for log in reversed(logs) if log.to_state == "SUBMITTED"), None)

	steps = [_step("submit", "Application submitted", "done" if submitted else "todo",
	               f"{doc.loan_amount:,.0f} over {doc.repayment_periods} months" if doc.loan_amount else "",
	               submitted.creation if submitted else "")]
	steps += _documents(doc)

	record = None
	record_id = doc.get("custom_latest_evidence")
	if record_id and frappe.db.exists("Loan Decision Evidence", record_id):
		evidence = frappe.db.get_value("Loan Decision Evidence", record_id, ["record_json", "creation"], as_dict=True)
		try:
			record = json.loads(evidence.record_json or "{}")
		except ValueError:
			record = {}
		# A resubmission makes the stored record stale until the runner writes a new one.
		if submitted and str(evidence.creation) < str(submitted.creation):
			record = None

	if state == "SUBMITTED" and record is None:
		steps.append(_step("queue", "Waiting for the decision runner", "current", "picks up SUBMITTED every few seconds"))
		steps.append(_step("bureau", "Bureau check", "todo"))
		steps.append(_step("zen", "ZEN rules", "todo"))
	elif record is not None:
		bureau = record.get("bureau") or {}
		score = (bureau.get("score") or {}).get("bureau_value")
		steps.append(_step("bureau", "Bureau check", "done" if bureau.get("fetched") else "failed",
		                   " · ".join(str(x) for x in (f"score {score}" if score else "", bureau.get("report_id"),
		                                               bureau.get("provider_error")) if x)))
		rules = record.get("rule_evaluations") or []
		engine = record.get("engine") or {}
		order = {"FAIL": 0, "INSUFFICIENT_DATA": 1, "REFER": 2, "PASS": 9}
		counts: dict[str, int] = {}
		for rule in rules:
			counts[rule.get("result") or "?"] = counts.get(rule.get("result") or "?", 0) + 1
		items = [{"id": r.get("rule_id"), "name": r.get("rule_name"), "result": r.get("result"),
		          "effect": r.get("effect")}
		         for r in sorted(rules, key=lambda r: (order.get(r.get("result"), 5), r.get("rule_id") or ""))]
		tally = " · ".join(f"{n} {k.lower().replace('_', ' ')}" for k, n in
		                   sorted(counts.items(), key=lambda kv: order.get(kv[0], 5)))
		steps.append(_step("zen", "ZEN rules", "done",
		                   f"{engine.get('name', 'zen')} {engine.get('version', '')} · {len(rules)} rules · {tally}",
		                   evidence.creation, items))
		flags = ", ".join(record.get("flags") or [])
		steps.append(_step("outcome", "Outcome", "done", f"{record.get('outcome')} → {state}" + (f" · {flags}" if flags else "")))
	elif state == "MANUAL_REVIEW":
		steps.append(_step("review", "Manual review", "current", "with a reviewer"))

	return {"application": doc.name, "state": state, "steps": steps,
	        "in_flight": state in ("SUBMITTED", "UNDER_REVIEW")}
