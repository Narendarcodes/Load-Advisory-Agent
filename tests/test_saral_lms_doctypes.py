"""Saral LMS doctypes, field map and the officer review desk (feat/saral-lms-doctypes).

Runs without a Frappe bench: doctype JSON, custom fields and the field map are checked as
data, and the pure-Python review / guard modules are imported directly. The Decision
Snapshot controller is exercised against a minimal `frappe` stub.
"""
import ast
import importlib
import json
import re
import sys
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = ROOT / "apps" / "loan_advisory_portal"
APP = APP_ROOT / "loan_advisory_portal"
DOCTYPE_DIR = APP / "loan_advisory_portal" / "doctype"
FIELD_MAP = json.loads((ROOT / "contracts" / "frappe_field_map.json").read_text(encoding="utf-8"))
DICTIONARY = json.loads((ROOT / "contracts" / "data_dictionary.json").read_text(encoding="utf-8"))

if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from loan_advisory_portal import custom_fields  # noqa: E402
from loan_advisory_portal.portal import lifecycle, lms_guards, review  # noqa: E402

NEW_DOCTYPES = {
    "Bureau Report Summary", "KYC Verification", "Bank Statement Summary", "Consent Record", "Consent Text",
    "Document Extraction", "Document Extraction Field", "Signature Screening Result", "Decision Snapshot", "Rule Result",
    "Decision Policy Parameter", "Loan Review Action", "Borrower Employment History", "Negative List Entry",
    "Employer Caution Entry", "Contact Fingerprint",
}
# Doctypes that Frappe / ERPNext / Frappe Lending provide (not vendored in this repo).
NATIVE_DOCTYPES = {"Loan Application", "Loan Product", "Customer", "User", "File", "Loan Document Type", "Company"}
FIELDTYPES = {
    "Data", "Link", "Select", "Int", "Float", "Currency", "Percent", "Check", "Date", "Datetime", "Small Text", "Long Text",
    "Text", "Section Break", "Column Break", "Table", "Password", "JSON", "Attach",
}
LAYOUT = {"Section Break", "Column Break"}
OFFICER_ROLES = {"Loan Officer", "System Manager"}
KNOWN_ROLES = OFFICER_ROLES | {"Agent Integration", "Evidence Service", "Loan Borrower", "Loan Reporter"}


def _doctypes() -> dict:
    out = {}
    for path in sorted(DOCTYPE_DIR.glob("*/*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("doctype") == "DocType":
            out[data["name"]] = (path, data)
    return out


DOCTYPES = _doctypes()


def _fieldnames(doctype: str) -> set:
    if doctype == "Loan Application":
        return {f["fieldname"] for f in custom_fields.LOAN_APPLICATION_FIELDS} | set(FIELD_MAP["native_fields"]["Loan Application"])
    if doctype in FIELD_MAP["native_fields"]:
        return set(FIELD_MAP["native_fields"][doctype])
    return {f["fieldname"] for f in DOCTYPES[doctype][1]["fields"]}


# ------------------------------------------------------------------ doctype JSON validity
def test_every_new_doctype_exists():
    assert NEW_DOCTYPES <= set(DOCTYPES), NEW_DOCTYPES - set(DOCTYPES)


@pytest.mark.parametrize("name", sorted(DOCTYPES))
def test_doctype_json_is_valid(name):
    path, data = DOCTYPES[name]
    assert path.parent.name == path.stem == name.lower().replace(" ", "_")
    assert data["module"] == "Loan Advisory Portal"
    names = [f["fieldname"] for f in data["fields"]]
    assert len(names) == len(set(names)), "duplicate fieldnames"
    assert data["field_order"] == names
    for f in data["fields"]:
        assert re.fullmatch(r"[a-z][a-z0-9_]*", f["fieldname"]), f["fieldname"]
        assert f["fieldtype"] in FIELDTYPES, f
        if f["fieldtype"] in ("Link", "Table"):
            assert f.get("options") in set(DOCTYPES) | NATIVE_DOCTYPES, f
        if f["fieldtype"] == "Table":
            assert DOCTYPES[f["options"]][1].get("istable") == 1, f
        if f["fieldtype"] == "Select":
            assert [o for o in f["options"].split("\n") if o], f
    if data.get("istable"):
        assert data["permissions"] == []
    else:
        assert data["permissions"], "a non-child doctype needs permissions"
        assert {p["role"] for p in data["permissions"]} <= KNOWN_ROLES
    # The controller module defines the class Frappe derives from the doctype name.
    module = ast.parse((path.parent / f"{path.stem}.py").read_text(encoding="utf-8"))
    classes = {n.name for n in module.body if isinstance(n, ast.ClassDef)}
    assert name.replace(" ", "").replace("-", "") in classes
    assert (path.parent / "__init__.py").exists()


def test_custom_fields_are_valid_and_chain_correctly():
    fields = custom_fields.LOAN_APPLICATION_FIELDS
    names = [f["fieldname"] for f in fields]
    assert len(names) == len(set(names))
    known = set(names) | {"loan_amount"}
    for f in fields:
        assert f["fieldname"].startswith("custom_"), f
        assert f["fieldtype"] in FIELDTYPES, f
        assert f["insert_after"] in known, f
        if f["fieldtype"] in ("Link", "Table"):
            assert f["options"] in set(DOCTYPES) | NATIVE_DOCTYPES, f


def test_loan_application_saral_fields():
    by_name = {f["fieldname"]: f for f in custom_fields.LOAN_APPLICATION_FIELDS}
    purpose = by_name["custom_purpose_code"]
    assert purpose["fieldtype"] == "Select"
    assert [o for o in purpose["options"].split("\n") if o] == [
        "wedding", "higher_education", "home_renovation", "medical_emergency"]
    assert by_name["custom_credit_score"]["read_only"] == 1  # bureau-only, never typed
    assert "custom_credit_score_origin" in by_name
    for name in ("custom_pan_hash", "custom_decision_snapshot", "custom_offer_amount", "custom_offer_emi",
                 "custom_offer_tenure_months", "custom_offer_rate", "custom_review_actions"):
        assert name in by_name, name


def test_applicant_cannot_type_a_credit_score():
    source = (APP / "api" / "applications.py").read_text(encoding="utf-8")
    assert '"custom_credit_score":' not in source
    assert 'db_set("custom_credit_score"' not in source


def test_decision_outcomes_extended_and_backward_compatible():
    evidence = DOCTYPES["Loan Decision Evidence"][1]
    options = next(f for f in evidence["fields"] if f["fieldname"] == "decision")["options"].split("\n")
    assert {"APPROVED", "REJECTED", "ERROR"} <= set(options)
    assert {"ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "DECLINE"} <= set(options)
    snapshot = DOCTYPES["Decision Snapshot"][1]
    outcome = next(f for f in snapshot["fields"] if f["fieldname"] == "outcome")["options"].split("\n")
    assert set(outcome) == set(lms_guards.DECISION_OUTCOMES)
    rule = DOCTYPES["Rule Result"][1]
    assert next(f for f in rule["fields"] if f["fieldname"] == "outcome")["options"].split("\n") == [
        "PASS", "FAIL", "REVIEW", "INSUFFICIENT_DATA"]


# ------------------------------------------------------------------ mapping completeness
def _resolve(location: str) -> bool:
    if location in DOCTYPES:
        return True
    doctype, _, field = location.partition(".")
    if doctype not in DOCTYPES and doctype not in FIELD_MAP["native_fields"] and doctype != "Loan Application":
        return False
    return field in _fieldnames(doctype)


def test_every_storable_field_has_a_frappe_location():
    storable = [f for f in DICTIONARY["fields"] if f["storage"] != "NEVER_STORE"]
    assert len(storable) == 230  # + residency_status (PL-130, catalogue 2.1)
    missing = [f["name"] for f in storable if f["name"] not in FIELD_MAP["fields"] or not FIELD_MAP["fields"][f["name"]]["location"]]
    assert missing == [], f"fields without a Frappe location: {missing}"
    assert FIELD_MAP["deferred"] == []


@pytest.mark.parametrize("name", sorted(FIELD_MAP["fields"]))
def test_every_location_resolves(name):
    row = FIELD_MAP["fields"][name]
    assert row["kind"] in FIELD_MAP["kinds"]
    for location in [row["location"], *row.get("also", [])]:
        assert _resolve(location), f"{name}: {location} does not exist"


def test_dictionary_json_carries_the_location():
    for f in DICTIONARY["fields"]:
        assert f["frappe_location"] == FIELD_MAP["fields"][f["name"]]["location"], f["name"]


def test_policy_parameter_rows_have_a_key_field():
    assert "parameter_name" in _fieldnames("Decision Policy Parameter")


def test_gap_list_reports_zero_remaining():
    text = (ROOT / "docs" / "saral" / "DATA_DICTIONARY.md").read_text(encoding="utf-8")
    assert "**0 remaining**" in text
    for gap in [f"G{n:02d}" for n in range(1, 15)]:
        assert re.search(rf"\| {gap} \|.*\| RESOLVED", text), gap


# ------------------------------------------------------------------ NEVER_STORE
FORBIDDEN_FIELD = re.compile(
    r"^(custom_)?(pan|pan_full|pan_number|full_pan|aadhaar|aadhaar_full|aadhaar_number|aadhaar_no|uid|otp|otp_.*|.*_otp|"
    r"ocr_raw_text|raw_text|raw_ocr_text|ocr_text|.*raw_text.*)$")


def _all_app_fieldnames():
    for name, (_, data) in DOCTYPES.items():
        for f in data["fields"]:
            yield name, f["fieldname"]
    for f in custom_fields.LOAN_APPLICATION_FIELDS:
        yield "Loan Application", f["fieldname"]


def test_no_never_store_field_exists_anywhere():
    hits = [(d, f) for d, f in _all_app_fieldnames() if FORBIDDEN_FIELD.match(f)]
    assert hits == []
    for item in FIELD_MAP["never_store"].values():
        assert item["location"] is None
    assert set(FIELD_MAP["never_store"]) == {"pan_full", "aadhaar_full", "otp_values", "ocr_raw_text"}


def test_identifier_patterns_match_the_contracts():
    from contracts import common

    assert lms_guards.MASKED_PAN_PATTERN == common.MASKED_PAN_PATTERN
    assert lms_guards.AADHAAR_LAST4_PATTERN == common.AADHAAR_LAST4_PATTERN
    assert lms_guards._FULL_PAN.pattern == common._FULL_PAN.pattern
    assert lms_guards._FULL_AADHAAR.pattern == common._FULL_AADHAAR.pattern


@pytest.mark.parametrize("blob", [
    {"applicant": {"name": "A", "id": "ABCPE1234F"}},
    {"aadhaar_number": "XXXX"},
    {"notes": "aadhaar 1234 5678 9012"},
    {"otp": "123456"},
    {"raw_text": "payslip"},
])
def test_json_blobs_refuse_never_store_values(blob):
    with pytest.raises(lms_guards.GuardError):
        lms_guards.parse_json(json.dumps(blob), "blob")


def test_masked_values_are_accepted():
    lms_guards.check_masked_pan("XXXXX1234X")
    lms_guards.check_aadhaar_last4("9012")
    for bad in ("ABCPE1234F", "1234"):
        with pytest.raises(lms_guards.GuardError):
            lms_guards.check_masked_pan(bad)
    with pytest.raises(lms_guards.GuardError):
        lms_guards.check_aadhaar_last4("123456789012")
    assert lms_guards.parse_json('{"pan_hash": "%s", "sha256": "123412341234"}' % ("a" * 64), "x")


# ------------------------------------------------------------------ review transitions
def test_review_actions_follow_the_lifecycle_table():
    assert set(lifecycle.STATES) >= {"MANUAL_REVIEW", "APPROVED", "REJECTED", "INFO_REQUESTED"}
    for action, (_, target) in review.ACTIONS.items():
        assert target in lifecycle.TRANSITIONS["MANUAL_REVIEW"], action
    assert {t for _, t in review.ACTIONS.values()} == set(lifecycle.TRANSITIONS["MANUAL_REVIEW"])


@pytest.mark.parametrize("action,target,native", [
    ("approve", "APPROVED", "Approved"), ("decline", "REJECTED", "Rejected"), ("request_info", "INFO_REQUESTED", None)])
def test_review_plan_from_manual_review(action, target, native):
    step = review.plan(action, "MANUAL_REVIEW", "  Checked payslips   against the bank statement.  ")
    assert (step["from_state"], step["to_state"], step["native_status"]) == ("MANUAL_REVIEW", target, native)
    assert step["note"] == "Checked payslips against the bank statement."


@pytest.mark.parametrize("state", [s for s in lifecycle.STATES if s != "MANUAL_REVIEW"])
def test_review_is_refused_outside_manual_review(state):
    for action in review.ACTIONS:
        with pytest.raises(review.ReviewError):
            review.plan(action, state, "A long enough note here.")


@pytest.mark.parametrize("note", [None, "", "   ", "too short", "x" * 2001])
def test_review_needs_a_real_note(note):
    with pytest.raises(review.ReviewError):
        review.plan("approve", "MANUAL_REVIEW", note)


def test_unknown_action_is_refused():
    with pytest.raises(review.ReviewError):
        review.plan("override", "MANUAL_REVIEW", "A long enough note here.")


def test_review_api_never_writes_the_snapshot_and_checks_the_role():
    source = (APP / "api" / "review.py").read_text(encoding="utf-8")
    assert not re.search(r'set_value\(\s*"Decision Snapshot"', source)
    assert not re.search(r'db_set|\.save\(|\.submit\(|\.cancel\(', source.split("snap = ")[-1]), "snapshot is read only"
    assert "_require_officer()" in source
    for method in ("approve", "decline", "request_info"):
        assert re.search(rf'@frappe\.whitelist\(methods=\["POST"\]\)\ndef {method}\(application: str, note: str\)', source)
    audit = {f["fieldname"]: f for f in DOCTYPES["Loan Review Action"][1]["fields"]}
    for name in ("reviewer", "acted_at", "note", "from_state", "to_state"):
        assert audit[name].get("reqd") == 1, name


# ------------------------------------------------------------------ snapshot immutability
def test_snapshot_schema_is_immutable():
    data = DOCTYPES["Decision Snapshot"][1]
    assert data["is_submittable"] == 1
    for name in ("Decision Snapshot", "Rule Result", "Decision Policy Parameter"):
        assert not [f["fieldname"] for f in DOCTYPES[name][1]["fields"] if f.get("allow_on_submit")], name
    for perm in data["permissions"]:
        assert not perm.get("cancel") and not perm.get("amend") and not perm.get("delete"), perm
    fields = {f["fieldname"] for f in data["fields"]}
    assert {"zen_input_json", "zen_input_sha256", "catalogue_version", "outcome", "offer_amount", "offer_emi",
            "offer_tenure_months", "offer_rate", "borrower_categories", "internal_reasons", "rule_results"} <= fields


class _ValidationError(Exception):
    pass


@pytest.fixture
def snapshot_controller(monkeypatch):
    frappe = types.ModuleType("frappe")
    frappe.ValidationError = _ValidationError

    def throw(msg, exc=_ValidationError):
        raise exc(msg)

    frappe.throw = throw
    frappe._ = lambda s: s
    model = types.ModuleType("frappe.model")
    document = types.ModuleType("frappe.model.document")

    class Document:
        def __init__(self, **values):
            self.__dict__.update(values)

        def get(self, key, default=None):
            return self.__dict__.get(key, default)

    document.Document = Document
    for name, mod in (("frappe", frappe), ("frappe.model", model), ("frappe.model.document", document)):
        monkeypatch.setitem(sys.modules, name, mod)
    modname = "loan_advisory_portal.loan_advisory_portal.doctype.decision_snapshot.decision_snapshot"
    sys.modules.pop(modname, None)
    module = importlib.import_module(modname)
    yield module
    sys.modules.pop(modname, None)


def _snapshot(module, **overrides):
    zen = json.loads((ROOT / "contracts" / "fixtures" / "zen_input_wedding_prime.json").read_text(encoding="utf-8"))
    values = dict(zen_input_json=json.dumps(zen), zen_input_sha256=None, borrower_categories='["CREDIT_HISTORY"]',
                  catalogue_sha256=None, outcome="MANUAL_REVIEW", offer_amount=None, offer_tenure_months=None,
                  rule_results=[types.SimpleNamespace(rule_id="PL-029", parameters_json='{"min": 650}', evidence_refs=None)],
                  policy_parameters=[types.SimpleNamespace(parameter_name="approved_minimum_score", value_json="650")],
                  docstatus=0)
    values.update(overrides)
    return module.DecisionSnapshot(**values)


def test_snapshot_freezes_the_input_hash(snapshot_controller):
    doc = _snapshot(snapshot_controller)
    doc.validate()
    assert re.fullmatch(r"[0-9a-f]{64}", doc.zen_input_sha256)
    assert doc.zen_input_sha256 == lms_guards.canonical_sha256(json.loads(doc.zen_input_json))


def test_snapshot_refuses_a_tampered_input(snapshot_controller):
    doc = _snapshot(snapshot_controller)
    doc.validate()
    tampered = json.loads(doc.zen_input_json)
    tampered["tampered"] = True
    doc.zen_input_json = json.dumps(tampered)
    with pytest.raises(_ValidationError):
        doc.validate()


def test_snapshot_refuses_raw_identifiers_and_unknown_categories(snapshot_controller):
    with pytest.raises(_ValidationError):
        _snapshot(snapshot_controller, zen_input_json='{"applicant": {"pan": "ABCPE1234F"}}').validate()
    with pytest.raises(_ValidationError):
        _snapshot(snapshot_controller, borrower_categories='["YOUR_SCORE_IS_640"]').validate()


def test_submitted_snapshot_cannot_change_cancel_or_be_deleted(snapshot_controller):
    doc = _snapshot(snapshot_controller, docstatus=1)
    for hook in (doc.before_update_after_submit, doc.before_cancel, doc.on_trash):
        with pytest.raises(_ValidationError):
            hook()


def test_counter_offer_needs_terms(snapshot_controller):
    with pytest.raises(_ValidationError):
        _snapshot(snapshot_controller, outcome="COUNTER_OFFER").validate()
    _snapshot(snapshot_controller, outcome="COUNTER_OFFER", offer_amount=300000, offer_tenure_months=36).validate()


# ------------------------------------------------------------------ permissions and the desk
INTERNAL_FIELDS = {
    "Decision Snapshot": {"internal_reasons", "rule_results", "review_flags", "fraud_indicators", "conflict_flags"},
    "Rule Result": {"internal_message"},
    "KYC Verification": {"pan_hash", "negative_list_hit", "duplicate_match_result"},
}


def test_borrowers_never_see_internal_reasons():
    for name in NEW_DOCTYPES:
        assert "Loan Borrower" not in {p["role"] for p in DOCTYPES[name][1]["permissions"]}, name
    for name, internal in INTERNAL_FIELDS.items():
        by_name = {f["fieldname"]: f for f in DOCTYPES[name][1]["fields"]}
        for field in internal:
            assert by_name[field].get("permlevel", 0) >= 1, (name, field)
    for name, (_, data) in DOCTYPES.items():
        high = {p["role"] for p in data["permissions"] if p.get("permlevel", 0) >= 1}
        assert high <= OFFICER_ROLES, (name, high)
    by_name = {f["fieldname"]: f for f in custom_fields.LOAN_APPLICATION_FIELDS}
    for field in ("custom_internal_reasons", "custom_review_actions", "custom_pan_hash", "custom_disbursal_account_number"):
        assert by_name[field].get("permlevel", 0) >= 1, field
    # The borrower portal never reads the officer-only data.
    portal_sources = [APP / "api" / f for f in ("applications.py", "profile.py", "documents.py", "agent.py", "session.py")]
    portal_sources += list((APP / "www").rglob("*.py")) + list((APP / "www").rglob("*.html"))
    for path in portal_sources:
        text = path.read_text(encoding="utf-8")
        for token in ("internal_reasons", "internal_message", "custom_review_actions", "Decision Snapshot"):
            assert token not in text, (path.name, token)


def test_officer_role_and_permissions_are_installed():
    install = (APP / "install.py").read_text(encoding="utf-8")
    assert 'OFFICER_ROLE = "Loan Officer"' in install
    assert "ensure_officer_permissions()" in install and '"desk_access": 1' in install
    assert "doctype_js" in (APP / "hooks.py").read_text(encoding="utf-8")


def test_saral_review_workspace_and_queue():
    ws = json.loads((APP / "loan_advisory_portal" / "workspace" / "saral_review" / "saral_review.json").read_text(encoding="utf-8"))
    assert ws["doctype"] == "Workspace" and ws["name"] == "Saral Review" and ws["public"] == 1
    assert {r["role"] for r in ws["roles"]} == OFFICER_ROLES
    queue = [["Loan Application", "custom_lifecycle_state", "=", "MANUAL_REVIEW", False]]
    assert json.loads(ws["quick_lists"][0]["quick_list_filter"]) == queue
    content = json.loads(ws["content"])
    names = {b["data"].get("shortcut_name") for b in content if b["type"] == "shortcut"}
    assert names == {s["label"] for s in ws["shortcuts"]}
    report = json.loads((APP / "loan_advisory_portal" / "report" / "saral_manual_review_queue" /
                         "saral_manual_review_queue.json").read_text(encoding="utf-8"))
    spec = json.loads(report["json"])
    assert report["ref_doctype"] == "Loan Application" and report["report_type"] == "Report Builder"
    assert spec["filters"] == queue
    assert spec["order_by"].endswith("`creation` desc")
    columns = {c[0] for c in spec["fields"]}
    assert {"custom_borrower_categories", "custom_internal_reasons", "custom_decision_snapshot"} <= columns
    assert {r["role"] for r in report["roles"]} == OFFICER_ROLES


# ------------------------------------------------------------------ ADR-0009: consent texts and demo officer
def test_consent_texts_are_versioned_prototypes():
    data = json.loads((APP / "consent_texts.json").read_text(encoding="utf-8"))
    texts = data["texts"]
    assert {t["consent_type"] for t in texts} == {"BUREAU_PULL", "KYC_AADHAAR", "BANK_DATA_AA", "DATA_USE_AND_PROCESSING"}
    assert "PROTOTYPE" in data["status"] and "legal review" in data["status"]
    options = next(f for f in DOCTYPES["Consent Text"][1]["fields"] if f["fieldname"] == "consent_type")["options"].split("\n")
    for text in texts:
        assert text["version"] and text["title"]
        assert text["body"].startswith("PROTOTYPE TEXT, PENDING LEGAL REVIEW.")
        assert text["consent_type"] in options
    status = next(f for f in DOCTYPES["Consent Text"][1]["fields"] if f["fieldname"] == "status")
    assert status["default"] == "PROTOTYPE"
    record = {f["fieldname"] for f in DOCTYPES["Consent Record"][1]["fields"]}
    assert {"consent_type", "consent_text", "purpose", "version", "granted_at", "channel"} <= record


def test_demo_officer_has_no_committed_password():
    source = (APP / "setup_demo.py").read_text(encoding="utf-8")
    assert "secrets.token_urlsafe" in source
    assert not re.search(r'password\s*=\s*["\']', source, re.IGNORECASE)
    assert "developer_mode" in source and "allow_demo_users" in source


def test_purpose_codes_from_portal_text():
    assert custom_fields.purpose_code_for("Home renovation") == "home_renovation"
    assert custom_fields.purpose_code_for("Medical costs") == "medical_emergency"
    assert custom_fields.purpose_code_for("higher_education") == "higher_education"
    assert custom_fields.purpose_code_for("a new bike") is None


def test_snapshot_outcome_options_match_loan_application_outcomes_d04():
    """Guard for E2E D-04 (2026-11-04): the runner now snapshots every decision, DECLINE included."""
    field = next(f for f in DOCTYPES["Decision Snapshot"][1]["fields"] if f["fieldname"] == "outcome")
    snap = {o for o in field["options"].split("\n") if o}
    la = {o for o in custom_fields.DECISION_OUTCOMES.split("\n") if o}
    assert snap == la and "DECLINE" in snap
