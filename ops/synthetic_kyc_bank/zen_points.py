"""Synthetic KYC + AA service: add the ZEN data-point endpoint the catalogue-v2 decision path consumes. SYNTHETIC ONLY.

The synthetic universe (#50) precomputes, per applicant, what the KYC match, AA bank analytics, OCR, signature and
bureau preprocessors would produce (`zen_inputs`). `POST /v1/zen/data-points` serves those values, without the
identity blocks (names, DOB, masked PAN), and honours AA consent like `/v1/aa/fetch`: no `aa_data_fetch` consent ->
403. Run it in place of `ops.synthetic_kyc_bank.app`:

    SARAL_SYNTH_DIR=/path/to/full200 python -m ops.synthetic_kyc_bank.zen_points --port 8012

This is a test-bed stand-in for real preprocessors, not one: a live deployment derives these values itself.
"""
from __future__ import annotations

import os
from pathlib import Path

from fastapi.responses import JSONResponse

IDENTITY_KEYS = ("applicant_identity", "identity_fields", "extracted_identity_fields", "bureau_identity", "applicant_name",
                 "bureau_name", "applicant_dob", "bureau_dob", "date_of_birth", "applicant_address", "bureau_address",
                 "supplied_fields")


def register(app, data_dir: str | None = None):
    from ops.synthetic_kyc_bank.app import ApplicantRequest, _jsonl

    d = Path(data_dir or os.environ.get("SARAL_SYNTH_DIR", ""))
    applicants = {r["applicant_id"]: r for r in _jsonl(d / "applicants.jsonl")}

    @app.post("/v1/zen/data-points")
    def zen_data_points(req: ApplicantRequest):
        rec = applicants.get(req.applicant_id)
        if not rec or not rec.get("zen_inputs"):
            return JSONResponse(status_code=404, content={"code": "ZEN_POINTS_NOT_FOUND", "synthetic": True,
                                                          "message": "no synthetic data points for this applicant"})
        if not (rec.get("consents") or {}).get("aa_data_fetch"):
            return JSONResponse(status_code=403, content={"code": "AA_CONSENT_MISSING", "synthetic": True,
                                                          "message": "no account-aggregator consent recorded"})
        points = {k: v for k, v in rec["zen_inputs"].items() if k not in IDENTITY_KEYS}
        return {"applicant_id": req.applicant_id, "synthetic": True, "data_points": points}

    return app


def create_app(data_dir: str | None = None):
    from ops.synthetic_kyc_bank.app import create_app as base

    return register(base(data_dir), data_dir)


if __name__ == "__main__":  # pragma: no cover
    import argparse

    import uvicorn

    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8012)
    uvicorn.run(create_app(), host="127.0.0.1", port=ap.parse_args().port)
