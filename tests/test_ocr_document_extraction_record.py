"""The OCR confirm endpoint writes the one Saral `Document Extraction` doctype.

PR #47 (OCR) and PR #48 (LMS doctypes) both added a `Document Extraction` doctype with
different fields. They are now one doctype: the PR #48 LMS record plus the PR #47 audit
fields. These checks run without a Frappe bench: they read the doctype JSON and the
`api/ocr.py` source as data.
"""
import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps" / "loan_advisory_portal" / "loan_advisory_portal"
DOCTYPE_JSON = APP / "loan_advisory_portal" / "doctype" / "document_extraction" / "document_extraction.json"
OCR_API = APP / "api" / "ocr.py"
OCR_SCHEMAS = APP / "ocr" / "schemas.py"

DOCTYPE = json.loads(DOCTYPE_JSON.read_text(encoding="utf-8"))
FIELDS = {f["fieldname"]: f for f in DOCTYPE["fields"]}
SOURCE = OCR_API.read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)


def _record_dicts():
    """Every dict literal in api/ocr.py that carries "doctype": DOCTYPE."""
    out = []
    for node in ast.walk(TREE):
        if isinstance(node, ast.Dict):
            keys = [k.value for k in node.keys if isinstance(k, ast.Constant)]
            if "doctype" in keys:
                out.append(node)
    return out


def _filter_keys():
    keys = set()
    for node in ast.walk(TREE):
        if isinstance(node, ast.Call) and getattr(node.func, "attr", "") == "get_all":
            for kw in node.keywords:
                if kw.arg == "filters" and isinstance(kw.value, ast.Dict):
                    keys |= {k.value for k in kw.value.keys if isinstance(k, ast.Constant)}
    return keys


def _select(name):
    return [o for o in FIELDS[name]["options"].split("\n") if o]


def test_one_doctype_carries_lms_and_ocr_audit_fields():
    lms = {"loan_application", "document_kind", "document_sha256", "engine", "fields", "document_integrity_result"}
    audit = {"status", "file_name", "engine_version", "pages", "extracted_values", "confirmed_values", "warnings",
             "confirmed_by", "confirmed_on", "document_type"}
    assert lms | audit <= set(FIELDS), (lms | audit) - set(FIELDS)
    assert "application" not in FIELDS, "one link to the Loan Application: loan_application"
    assert _select("status") == ["Extracted", "Confirmed"]


def test_confirm_writes_only_fields_the_doctype_has():
    records = _record_dicts()
    assert records, "api/ocr.py must build a Document Extraction record"
    for node in records:
        keys = {k.value for k in node.keys if isinstance(k, ast.Constant)} - {"doctype"}
        assert keys <= set(FIELDS), keys - set(FIELDS)
        required = {n for n, f in FIELDS.items() if f.get("reqd")}
        assert required <= keys, f"required fields not written: {required - keys}"


def test_lookup_filters_use_real_fields():
    keys = _filter_keys()
    assert keys, "get_extraction filters by fields"
    assert keys <= set(FIELDS), keys - set(FIELDS)


def test_engine_labels_cover_the_select_options():
    tree = ast.parse(SOURCE)
    labels = None
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "ENGINE_LABELS" for t in node.targets):
            labels = ast.literal_eval(node.value)
    assert labels is not None, "api/ocr.py maps engine ids to the doctype's Select labels"
    assert set(labels) == {"tesseract", "paddle"}
    assert set(labels.values()) <= set(_select("engine"))


def test_document_kinds_fit_the_select_options():
    tree = ast.parse(OCR_SCHEMAS.read_text(encoding="utf-8"))
    kinds = set()
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "DocumentKind":
            for item in node.body:
                if isinstance(item, ast.Assign) and isinstance(item.value, ast.Constant):
                    kinds.add(item.value.value)
    assert kinds and kinds <= set(_select("document_kind")), kinds - set(_select("document_kind"))


def test_borrower_cannot_read_the_lms_record_directly():
    roles = {p["role"] for p in DOCTYPE["permissions"]}
    assert "Loan Borrower" not in roles
    assert "ignore_permissions=True" in SOURCE
