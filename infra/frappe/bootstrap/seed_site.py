"""Idempotent seeding of the Frappe Lending site (runs INSIDE the backend container).

    docker cp seed_site.py seed_applications.json <backend>:/tmp/
    docker exec <backend> bench --site <site> execute "exec(open('/tmp/seed_site.py').read(), {'__name__': 'seed'})"

Creates (only if missing): company via the ERPNext setup wizard, Loan Demand Offset
Order, synthetic Loan Product, custom fields on Loan Application, the companion
DocType "Loan Decision Evidence", Customers and draft Loan Applications.
Applications are keyed by `custom_external_ref` (Frappe autonames cannot be forced —
see docs/prototypes/p1-frappe-api.md), so re-running never duplicates records.
All data is SYNTHETIC. Prints a JSON summary incl. the external_ref -> name map.
"""
import json

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

COMPANY, ABBR = "Loan Rangers Test NBFC", "LRT"
PRODUCT = "SYN-PERSONAL-001"
OFFSET = "Standard Collection Order"
LIFECYCLE = "\n".join(["SUBMITTED", "INFO_REQUESTED", "UNDER_REVIEW", "MANUAL_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"])


def setup_company():
    if frappe.db.exists("Company", COMPANY):
        return "exists"
    from erpnext.setup.setup_wizard.setup_wizard import setup_complete
    setup_complete(frappe._dict(
        currency="INR", country="India", timezone="Asia/Kolkata", language="English",
        company_name=COMPANY, company_abbr=ABBR, chart_of_accounts="Standard",
        fy_start_date="2026-04-01", fy_end_date="2027-03-31", domain="Services",
        full_name="Administrator", email="admin@example.invalid"))
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    return "created"


def setup_fields():
    create_custom_fields({"Loan Application": [
        dict(fieldname="custom_underwriting_section", label="Underwriting (synthetic)", fieldtype="Section Break", insert_after="loan_amount"),
        dict(fieldname="custom_monthly_income", label="Monthly Income", fieldtype="Currency", insert_after="custom_underwriting_section"),
        dict(fieldname="custom_monthly_obligations", label="Monthly Obligations", fieldtype="Currency", insert_after="custom_monthly_income"),
        dict(fieldname="custom_credit_score", label="Credit Score", fieldtype="Int", insert_after="custom_monthly_obligations"),
        dict(fieldname="custom_employment_months", label="Employment Months", fieldtype="Int", insert_after="custom_credit_score"),
        dict(fieldname="custom_external_ref", label="External Ref (seed key)", fieldtype="Data", unique=1, insert_after="custom_employment_months"),
        dict(fieldname="custom_lifecycle_state", label="Lifecycle State", fieldtype="Select", options=LIFECYCLE, insert_after="custom_external_ref"),
        dict(fieldname="custom_policy_version", label="Policy Version", fieldtype="Data", read_only=1, insert_after="custom_lifecycle_state"),
        dict(fieldname="custom_latest_evidence", label="Latest Decision Evidence", fieldtype="Link", options="Loan Decision Evidence", read_only=1, insert_after="custom_policy_version"),
    ]}, update=True)


def setup_evidence_doctype():
    if frappe.db.exists("DocType", "Loan Decision Evidence"):
        return "exists"
    F = lambda n, t, **k: dict(fieldname=n, label=n.replace("_", " ").title(), fieldtype=t, **k)
    frappe.get_doc({
        "doctype": "DocType", "name": "Loan Decision Evidence", "module": "Loan Management", "custom": 1,
        "autoname": "field:record_id", "track_changes": 0, "in_create": 0,
        "fields": [
            F("record_id", "Data", reqd=1, unique=1, in_list_view=1),
            F("loan_application", "Link", options="Loan Application", reqd=1, in_list_view=1),
            F("decision", "Select", options="APPROVED\nREJECTED\nERROR", reqd=1, in_list_view=1),
            F("lifecycle_state", "Data"),
            F("policy_id", "Data"), F("policy_version", "Data", in_list_view=1),
            F("policy_sha256", "Data"), F("jdm_sha256", "Data"), F("input_sha256", "Data"),
            F("engine", "Data"), F("evaluated_at", "Datetime"),
            F("trace_sha256", "Data"), F("trace_store", "Data"),
            F("is_simulation", "Check"),
            F("record_json", "Long Text"),
        ],
        "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
    }).insert()
    return "created"


def setup_product():
    if not frappe.db.exists("Loan Demand Offset Order", OFFSET):
        frappe.get_doc({"doctype": "Loan Demand Offset Order", "title": OFFSET,
                        "components": [{"demand_type": "EMI (Principal + Interest)"}]}).insert()
    if not frappe.db.exists("Loan Product", PRODUCT):
        frappe.get_doc({
            "doctype": "Loan Product", "product_code": PRODUCT, "product_name": "Personal Loan - Synthetic",
            "company": COMPANY, "rate_of_interest": 14, "is_term_loan": 1, "maximum_loan_amount": 1500000,
            **{f"collection_offset_sequence_for_{k}": OFFSET for k in ("standard_asset", "sub_standard_asset", "written_off_asset", "settlement_collection")},
        }).insert()


def seed_apps(rows):
    names = {}
    for r in rows:
        if not frappe.db.exists("Customer", r["applicant_id"]):
            frappe.get_doc({"doctype": "Customer", "customer_name": f"Synthetic Applicant {r['applicant_id']}",
                            "customer_type": "Individual"}).insert(set_name=r["applicant_id"])
        existing = frappe.db.get_value("Loan Application", {"custom_external_ref": r["external_ref"]}, "name")
        if existing:
            names[r["external_ref"]] = existing
            continue
        doc = frappe.get_doc({
            "doctype": "Loan Application", "applicant_type": "Customer", "applicant": r["applicant_id"],
            "company": COMPANY, "loan_product": PRODUCT, "posting_date": "2026-10-14", "is_term_loan": 1,
            "loan_amount": r["loan_amount"], "repayment_method": "Repay Over Number of Periods",
            "repayment_periods": r["loan_tenure_months"],
            "custom_monthly_income": r["monthly_income"], "custom_monthly_obligations": r["monthly_obligations"],
            "custom_credit_score": r["credit_score"], "custom_employment_months": r["employment_months"],
            "custom_external_ref": r["external_ref"], "custom_lifecycle_state": "SUBMITTED",
        }).insert()
        names[r["external_ref"]] = doc.name
    return names


def run():
    out = {"company": setup_company()}
    out["evidence_doctype"] = setup_evidence_doctype()  # must exist before the Link custom field
    setup_fields()
    setup_product()
    out["apps"] = seed_apps(json.load(open("/tmp/seed_applications.json")))
    frappe.db.commit()
    print("SEED_RESULT " + json.dumps(out))


run()
