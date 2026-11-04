"""Synthetic KYC + AA-style bank-fetch API over the Saral synthetic universe (#50). SYNTHETIC ONLY.

Loopback only. Serves the masked PAN / Aadhaar eKYC records and the AA-style bank statement for a
SYN-APP id. Never returns `specimen_truth` (raw specimen identifiers). Consent is honoured: no
`aa_data_fetch` consent -> 403. A missing statement -> 404 with `fallback: PDF_UPLOAD` (ADR-0007:
AA fetch first, PDF + OCR fallback).

    SARAL_SYNTH_DIR=/path/to/full200 python -m ops.synthetic_kyc_bank.app --port 8012
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

_ID = re.compile(r"^SYN-APP-\d{4}$")
WARNING = "SYNTHETIC DEVELOPMENT DATA. Not a UIDAI, Income Tax Department or bank record."


class ApplicantRequest(BaseModel):
    applicant_id: str

    @field_validator("applicant_id")
    @classmethod
    def _synthetic_id(cls, v: str) -> str:
        if not _ID.match(v):
            raise ValueError("applicant_id must look like SYN-APP-0001")
        return v


def _jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]


def _err(status, code, message, **extra):
    return JSONResponse(status_code=status, content={"code": code, "message": message, "synthetic": True, **extra})


def create_app(data_dir: str | None = None) -> FastAPI:
    d = Path(data_dir or os.environ.get("SARAL_SYNTH_DIR", ""))
    applicants = {r["applicant_id"]: r for r in _jsonl(d / "applicants.jsonl")}
    statements = {r["statement_id"]: r for r in _jsonl(d / "bank_statements.jsonl")}
    if any(r.get("synthetic") is not True for r in [*applicants.values(), *statements.values()]):
        raise ValueError("refusing to serve data that is not marked synthetic")

    app = FastAPI(title="Saral synthetic KYC + AA bank fetch", version="1.0")

    def _rec(aid):
        return applicants.get(aid)

    @app.get("/healthz")
    def healthz():
        return {"status": "ok", "synthetic": True, "applicants": len(applicants), "statements": len(statements)}

    @app.post("/v1/kyc/pan/verify")
    def pan_verify(req: ApplicantRequest):
        rec = _rec(req.applicant_id)
        if not rec or not rec.get("pan"):
            return _err(404, "KYC_NOT_FOUND", "no synthetic PAN record for this applicant")
        return {**rec["pan"], "applicant_id": req.applicant_id, "synthetic": True, "warning": WARNING}

    @app.post("/v1/kyc/aadhaar/ekyc")
    def aadhaar_ekyc(req: ApplicantRequest):
        rec = _rec(req.applicant_id)
        if not rec or not rec.get("aadhaar_ekyc"):
            return _err(404, "KYC_NOT_FOUND", "no synthetic eKYC record for this applicant")
        return {**rec["aadhaar_ekyc"], "applicant_id": req.applicant_id, "synthetic": True, "warning": WARNING}

    @app.post("/v1/aa/fetch")
    def aa_fetch(req: ApplicantRequest):
        rec = _rec(req.applicant_id)
        if not rec:
            return _err(404, "AA_NOT_FOUND", "unknown synthetic applicant")
        if not (rec.get("consents") or {}).get("aa_data_fetch"):
            return _err(403, "AA_CONSENT_MISSING", "no account-aggregator consent recorded")
        stmt = statements.get((rec.get("bank_ref") or {}).get("statement_id"))
        if not stmt:
            return _err(404, "AA_STATEMENT_UNAVAILABLE", "statement not available; upload a PDF instead",
                        fallback="PDF_UPLOAD")
        return {**stmt, "synthetic": True, "warning": WARNING}

    return app


if __name__ == "__main__":  # pragma: no cover
    import argparse

    import uvicorn

    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8012)
    uvicorn.run(create_app(), host="127.0.0.1", port=ap.parse_args().port)
