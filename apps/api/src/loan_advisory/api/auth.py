"""Assertion authentication for the agent-only FastAPI surface.

The only credential this service accepts is a short-lived assertion minted by the Frappe portal
(`services/assertion.py`). Frappe still owns the browser session; the Node runtime exchanges the
borrower's Frappe cookie for an assertion and forwards nothing else, so no cookie, CSRF token or
browser-supplied identity header ever reaches this process.

Identity always comes from the verified assertion. A request without one — or with one that is
expired, forged, replayed or unconfigured at this end — is refused before any agent work starts.
"""
from fastapi import HTTPException, Request

from loan_advisory.api import assertion, limits
from loan_advisory.api.assertion import AssertionRejected, AssertionUnavailable, session_claims

AUTH_ERROR = "sign in first"


def require_claims(authorization: str | None) -> dict:
    """Verified claims in the shape the agent and its tools already understand, or 401/503."""
    token = ""
    if authorization and authorization[:7].lower() == "bearer ":
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    try:
        payload = assertion.verify(token)
    except AssertionUnavailable:
        raise HTTPException(status_code=503, detail="agent authentication is not configured") from None
    except AssertionRejected:
        # One message for every rejection: an expired assertion, a forgery and a replay are
        # indistinguishable to the caller, and only the reason is logged by Frappe.
        raise HTTPException(status_code=401, detail=AUTH_ERROR) from None
    return session_claims(payload)


def claims_from_request(request: Request) -> dict:
    return require_claims(request.headers.get("Authorization"))


def require_application(claims: dict) -> str:
    """The selected application, or 409 before any stream starts (never an error line inside it)."""
    application_ref = claims.get("application_ref")
    if not application_ref:
        raise HTTPException(status_code=409, detail="select an application first")
    return application_ref


def spend_budget(claims: dict, scope: str, limit: int, window: int) -> None:
    """Count one call against the verified borrower's budget; 429/503 before any work starts."""
    try:
        limits.enforce(scope, claims["sub"], limit, window)
    except limits.BudgetExceeded as exc:
        raise HTTPException(
            status_code=429, detail="rate limit exceeded", headers={"Retry-After": str(exc.retry_after)}
        ) from None
    except limits.BudgetUnavailable:
        # Same policy as replay: without the shared counter the service refuses, never guesses.
        raise HTTPException(status_code=503, detail="rate limit store unavailable") from None
