"""Synthetic bureau HTTP service. Local development only, bound to 127.0.0.1.

Serves the committed golden fixture when the application is known, and can
generate any supported scenario on demand for tests and demos. There is no
real credit data anywhere in this service.
"""
from __future__ import annotations

import time
from datetime import date

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from decision_engine.schemas.bureau import (
    BureauErrorDetail,
    BureauErrorResponse,
    BureauReport,
    BureauReportRequest,
)
from synthetic_bureau.fixtures import case_for
from synthetic_bureau.generator import build_report
from synthetic_bureau.settings import (
    DEFAULT_AS_OF,
    DEFAULT_HOST,
    DEFAULT_PORT,
    DEFAULT_SEED,
    TIMEOUT_DELAY_SECONDS,
)

PROVIDER_HTTP_STATUS = {
    "RATE_LIMIT": (429, "BUREAU_RATE_LIMITED", True),
    "UNAVAILABLE": (503, "BUREAU_UNAVAILABLE", True),
    "TIMEOUT": (504, "BUREAU_TIMEOUT", True),
    "MALFORMED_RESPONSE": (502, "BUREAU_MALFORMED_RESPONSE", False),
}

# Wire vocabulary (schema) -> generator scenario name.
GENERATOR_SCENARIO = {"STALE": "STALE_REPORT"}


def _error(status: int, code: str, message: str, retryable: bool, correlation_id: str) -> JSONResponse:
    body = BureauErrorResponse(
        error=BureauErrorDetail(
            code=code,
            message=message,
            retryable=retryable,
            correlation_id=correlation_id,
        )
    )
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


def create_app(*, seed: int = DEFAULT_SEED, as_of: date = DEFAULT_AS_OF, fixture_path: str | None = None) -> FastAPI:
    app = FastAPI(title="Synthetic Credit Bureau", version="1.0", docs_url="/docs")

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok", "synthetic": True, "seed": seed, "as_of": as_of.isoformat()}

    @app.post("/v1/bureau/reports", response_model=None)
    def fetch_report(request: BureauReportRequest):
        correlation_id = f"BUREAU-{request.application_id}-{request.scenario.value if request.scenario else 'FIXTURE'}"
        scenario = request.scenario.value if request.scenario else None

        if scenario in PROVIDER_HTTP_STATUS:
            status, code, retryable = PROVIDER_HTTP_STATUS[scenario]
            if scenario == "TIMEOUT":
                time.sleep(TIMEOUT_DELAY_SECONDS)
            if scenario == "MALFORMED_RESPONSE":
                # Deliberately not the versioned error contract: exercises client schema checks.
                return JSONResponse(
                    status_code=status,
                    content={"detail": "synthetic malformed payload", "correlation_id": correlation_id},
                )
            return _error(status, code, f"synthetic {scenario.lower()} response", retryable, correlation_id)

        if scenario is None:
            case = case_for(request.application_id, fixture_path)
            if case is not None:
                if case.get("report") is None:
                    status, code, retryable = PROVIDER_HTTP_STATUS.get(
                        case["scenario"], (503, "BUREAU_UNAVAILABLE", True)
                    )
                    return _error(status, code, "fixture declares a provider failure", retryable, correlation_id)
                return BureauReport.model_validate(case["report"])

        report = build_report(
            request.application_id,
            request.applicant_id,
            GENERATOR_SCENARIO.get(scenario, scenario or "SUCCESS"),
            seed=seed,
            as_of=as_of,
            correlation_id=correlation_id,
            record_origin="generated_on_demand",
        )
        if report is None:  # unreachable for the scenarios handled above
            return _error(503, "BUREAU_UNAVAILABLE", "synthetic provider failure", True, correlation_id)
        return report

    return app


app = create_app()


def parse_args(argv=None):
    """Only the port is configurable (the self-hosted LLM also defaults to :8001); the host stays loopback."""
    import argparse

    def port(value: str) -> int:
        n = int(value)
        if not 1 <= n <= 65535:
            raise argparse.ArgumentTypeError(f"port out of range: {n}")
        return n

    ap = argparse.ArgumentParser(description="Synthetic credit bureau (local development only, 127.0.0.1)")
    ap.add_argument("--port", type=port, default=DEFAULT_PORT)
    return ap.parse_args(argv)


if __name__ == "__main__":  # pragma: no cover - manual local run only
    import uvicorn

    uvicorn.run(app, host=DEFAULT_HOST, port=parse_args().port)
