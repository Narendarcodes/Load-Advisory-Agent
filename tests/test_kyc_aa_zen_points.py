"""KYC/AA consumer: the synthetic service's data-point endpoint and the client (integration tree: needs #50/#54)."""
import json

import pytest


def _app(tmp_path, consent=True):
    pytest.importorskip("ops.synthetic_kyc_bank.app")
    from ops.synthetic_kyc_bank.zen_points import create_app

    rec = {"applicant_id": "SYN-APP-0001", "synthetic": True, "consents": {"aa_data_fetch": consent},
           "zen_inputs": {"bureau_score": 800, "applicant_name": "Specimen Name", "monthly_net_income": 50000}}
    (tmp_path / "applicants.jsonl").write_text(json.dumps(rec) + "\n")
    return create_app(str(tmp_path))


def test_data_points_without_identity_blocks(tmp_path):
    from fastapi.testclient import TestClient

    c = TestClient(_app(tmp_path))
    r = c.post("/v1/zen/data-points", json={"applicant_id": "SYN-APP-0001"})
    assert r.status_code == 200, r.text
    assert r.json()["data_points"] == {"bureau_score": 800, "monthly_net_income": 50000}
    assert c.post("/v1/zen/data-points", json={"applicant_id": "SYN-APP-0002"}).status_code == 404
    assert c.post("/v1/zen/data-points", json={"applicant_id": "nope"}).status_code == 422


def test_consent_is_honoured(tmp_path):
    from fastapi.testclient import TestClient

    c = TestClient(_app(tmp_path, consent=False))
    assert c.post("/v1/zen/data-points", json={"applicant_id": "SYN-APP-0001"}).status_code == 403


def test_client_fails_closed_without_configuration():
    from loan_advisory.infrastructure.kyc_aa_client import KycAaClient

    assert KycAaClient(base_url="").data_points("SYN-APP-0001").error == "KYC_AA_NOT_CONFIGURED"
    assert KycAaClient(base_url="http://127.0.0.1:9").data_points("Someone").error == "KYC_AA_UNKNOWN_APPLICANT"
