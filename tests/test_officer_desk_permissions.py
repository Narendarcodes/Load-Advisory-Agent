"""E2E A4 (2026-11-04): on the Loan Application desk form the officer got "No permission for Loan Origination
Settings" (the Lending form script reads it), and could not open the Application State Log (audit trail)."""
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal" / "loan_advisory_portal"


def test_officer_can_read_the_state_log():
    meta = json.loads((APP / "loan_advisory_portal" / "doctype" / "application_state_log" / "application_state_log.json").read_text())
    officer = [p for p in meta["permissions"] if p["role"] == "Loan Officer"]
    assert officer and officer[0].get("read") == 1
    assert not any(officer[0].get(k) for k in ("write", "create", "delete"))  # audit rows stay append-only


def test_install_grants_officer_read_on_origination_settings():
    src = (APP / "install.py").read_text()
    body = src.split("def ensure_officer_permissions")[1].split("\ndef ")[0]
    assert '"Loan Origination Settings"' in body
