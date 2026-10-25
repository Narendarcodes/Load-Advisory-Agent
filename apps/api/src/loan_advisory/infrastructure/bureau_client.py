"""HTTP client for the local synthetic bureau service.

Failure mapping is deliberate and non-retrying: transient provider problems map
to retryable REVIEW codes, malformed or unsafe payloads map to non-retryable
errors. The client never invents a score.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit

import httpx
from pydantic import ValidationError

from decision_engine.schemas.bureau import BureauErrorResponse, BureauReport

DEFAULT_BASE_URL = "http://127.0.0.1:8001"
LOOPBACK_HOSTS = ("127.0.0.1", "localhost")
DEFAULT_TIMEOUT_SECONDS = 5.0
REPORTS_PATH = "/v1/bureau/reports"

STATUS_FALLBACK = {
    429: ("BUREAU_RATE_LIMITED", True),
    503: ("BUREAU_UNAVAILABLE", True),
    504: ("BUREAU_TIMEOUT", True),
}


@dataclass(frozen=True)
class BureauFetch:
    report: BureauReport | None = None
    error_code: str | None = None
    message: str | None = None
    retryable: bool = False
    correlation_id: str | None = None

    @property
    def ok(self) -> bool:
        return self.report is not None


class BureauClient:
    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        *,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
        client: httpx.Client | None = None,
    ):
        parsed = urlsplit(base_url)
        if parsed.scheme != "http" or parsed.hostname not in LOOPBACK_HOSTS:
            raise ValueError("synthetic bureau must be reached on localhost")
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport
        self._client = client

    def __enter__(self) -> "BureauClient":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def close(self) -> None:
        if self._client is not None and self._transport is None:
            self._client.close()

    def _request(self, payload: dict) -> httpx.Response:
        if self._client is not None:
            return self._client.post(f"{self._base_url}{REPORTS_PATH}", json=payload)
        with httpx.Client(
            base_url=self._base_url, timeout=self._timeout, transport=self._transport
        ) as client:
            return client.post(REPORTS_PATH, json=payload)

    @staticmethod
    def _error_from(response: httpx.Response) -> BureauFetch:
        correlation_id = response.headers.get("x-correlation-id")
        try:
            parsed = BureauErrorResponse.model_validate(response.json())
        except (ValueError, ValidationError):
            code, retryable = STATUS_FALLBACK.get(
                response.status_code, ("BUREAU_MALFORMED_RESPONSE", False)
            )
            return BureauFetch(
                error_code=code,
                message=f"bureau returned HTTP {response.status_code} without the error contract",
                retryable=retryable,
                correlation_id=correlation_id,
            )
        return BureauFetch(
            error_code=parsed.error.code,
            message=parsed.error.message,
            retryable=parsed.error.retryable,
            correlation_id=parsed.error.correlation_id,
        )

    def fetch_report(
        self,
        application_id: str,
        applicant_id: str,
        scenario: str | None = None,
    ) -> BureauFetch:
        payload = {"application_id": application_id, "applicant_id": applicant_id}
        if scenario is not None:
            payload["scenario"] = scenario
        try:
            response = self._request(payload)
        except httpx.TimeoutException:
            return BureauFetch(error_code="BUREAU_TIMEOUT", message="bureau request timed out", retryable=True)
        except httpx.TransportError as exc:
            return BureauFetch(error_code="BUREAU_UNAVAILABLE", message=str(exc), retryable=True)

        if response.status_code != 200:
            return self._error_from(response)

        try:
            report = BureauReport.model_validate(response.json())
        except (ValueError, ValidationError) as exc:
            return BureauFetch(
                error_code="BUREAU_MALFORMED_RESPONSE",
                message=f"bureau report does not match the contract: {exc}",
                retryable=False,
            )
        if not report.provider.synthetic or report.score.type != "SYNTHETIC":
            return BureauFetch(
                error_code="BUREAU_UNSAFE_NON_SYNTHETIC",
                message="refusing a bureau payload that is not marked synthetic",
                retryable=False,
                correlation_id=report.correlation_id,
            )
        if report.application_id != application_id:
            return BureauFetch(
                error_code="BUREAU_MALFORMED_RESPONSE",
                message="bureau report is for a different application",
                retryable=False,
                correlation_id=report.correlation_id,
            )
        return BureauFetch(report=report, correlation_id=report.correlation_id)
