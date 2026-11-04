"""ops/synthetic_kyc_bank: a loopback-only synthetic KYC + AA-style bank-fetch API over #50's data."""
import json

import pytest
from fastapi.testclient import TestClient

from ops.synthetic_kyc_bank.app import create_app


@pytest.fixture()
def client(tmp_path):
    rec = {"synthetic": True, "applicant_id": "SYN-APP-0001",
           "specimen_truth": {"pan_number": "ZZRPK5405J", "aadhaar_uid": "103472529847"},
           "pan": {"schema": "saral-kyc-pan/1", "synthetic": True, "pan_masked": "XXXXX9430X", "pan_status": "VALID_SYNTHETIC",
                   "name_on_pan": "IMRAN SHARMA"},
           "aadhaar_ekyc": {"schema": "saral-kyc-aadhaar/1", "synthetic": True, "aadhaar_last4": "0106",
                            "verification_status": "VERIFIED_SYNTHETIC_EKYC", "name": "Imran Sharma"},
           "consents": {"aa_data_fetch": True, "bureau_pull": True},
           "bank_ref": {"statement_id": "STM-1"}}
    no_consent = {**rec, "applicant_id": "SYN-APP-0002", "consents": {"aa_data_fetch": False}, "bank_ref": {"statement_id": "STM-2"}}
    no_stmt = {**rec, "applicant_id": "SYN-APP-0003", "bank_ref": {"statement_id": "STM-404"}}
    (tmp_path / "applicants.jsonl").write_text("\n".join(json.dumps(r) for r in (rec, no_consent, no_stmt)))
    stmt = {"schema": "saral-bank-statement-aa/1", "synthetic": True, "statement_id": "STM-1", "applicant_id": "SYN-APP-0001",
            "consent_id": "SYN-AACON-1", "transactions": [{"amount": 1}], "integrity": {"content_sha256": "ab"}}
    (tmp_path / "bank_statements.jsonl").write_text(json.dumps(stmt) + "\n" + json.dumps({**stmt, "statement_id": "STM-2", "applicant_id": "SYN-APP-0002"}))
    return TestClient(create_app(data_dir=str(tmp_path)))


def test_healthz_is_marked_synthetic(client):
    body = client.get("/healthz").json()
    assert body["status"] == "ok" and body["synthetic"] is True and body["applicants"] == 3


def test_pan_verify_returns_masked_record_only(client):
    r = client.post("/v1/kyc/pan/verify", json={"applicant_id": "SYN-APP-0001"})
    assert r.status_code == 200
    body = r.json()
    assert body["pan_masked"] == "XXXXX9430X" and body["synthetic"] is True
    assert "ZZRPK5405J" not in r.text and "103472529847" not in r.text


def test_aadhaar_ekyc_returns_last4_only(client):
    r = client.post("/v1/kyc/aadhaar/ekyc", json={"applicant_id": "SYN-APP-0001"})
    assert r.status_code == 200 and r.json()["aadhaar_last4"] == "0106"
    assert "103472529847" not in r.text


def test_unknown_applicant_is_404_with_code(client):
    r = client.post("/v1/kyc/pan/verify", json={"applicant_id": "SYN-APP-9999"})
    assert r.status_code == 404 and r.json()["code"] == "KYC_NOT_FOUND"


def test_bad_applicant_id_is_422(client):
    assert client.post("/v1/kyc/pan/verify", json={"applicant_id": "Imran Sharma"}).status_code == 422


def test_aa_fetch_returns_statement(client):
    r = client.post("/v1/aa/fetch", json={"applicant_id": "SYN-APP-0001"})
    assert r.status_code == 200
    body = r.json()
    assert body["statement_id"] == "STM-1" and body["synthetic"] is True and body["transactions"]


def test_aa_fetch_without_consent_is_403(client):
    r = client.post("/v1/aa/fetch", json={"applicant_id": "SYN-APP-0002"})
    assert r.status_code == 403 and r.json()["code"] == "AA_CONSENT_MISSING"


def test_aa_fetch_missing_statement_says_use_pdf_fallback(client):
    r = client.post("/v1/aa/fetch", json={"applicant_id": "SYN-APP-0003"})
    assert r.status_code == 404 and r.json()["code"] == "AA_STATEMENT_UNAVAILABLE"
    assert r.json()["fallback"] == "PDF_UPLOAD"


def test_refuses_non_synthetic_data(tmp_path):
    (tmp_path / "applicants.jsonl").write_text(json.dumps({"synthetic": False, "applicant_id": "SYN-APP-0001"}))
    (tmp_path / "bank_statements.jsonl").write_text("")
    with pytest.raises(ValueError):
        create_app(data_dir=str(tmp_path))
