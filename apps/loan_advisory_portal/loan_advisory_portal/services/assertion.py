"""Short-lived, user-scoped assertions between the trusted Node runtime and FastAPI.

The assertion is an HMAC-signed base64url JSON envelope. It is not a session and
it is not a JWT: FastAPI must verify issuer, audience, expiry and the `jti`
single-use rule (see docs/architecture/copilotkit-agui-integration.md).
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

import frappe

from loan_advisory_portal.portal import preferences as vocabulary
from loan_advisory_portal.portal.errors import Forbidden, ServiceUnavailable

ISSUER = "frappe:loan_advisory_portal"
AUDIENCE = "loan-advisory-agent"
TTL_SECONDS = 60
CLOCK_SKEW_SECONDS = 30


def _secret() -> str:
	secret = frappe.conf.get("agent_assertion_secret")
	if not secret or len(secret) < 32:
		raise ServiceUnavailable("agent assertion secret is not configured")
	return secret


def signing_secret() -> str:
	"""Only for tests: confirms the site has a usable secret."""
	return _secret()


def _b64(raw: bytes) -> str:
	return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _unb64(value: str) -> bytes:
	padding = "=" * (-len(value) % 4)
	return base64.urlsafe_b64decode(value + padding)


def sign(payload: dict) -> str:
	body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
	signature = hmac.new(_secret().encode("utf-8"), body, hashlib.sha256).digest()
	return f"{_b64(body)}.{_b64(signature)}"


def verify(token: str) -> dict:
	if not token or not isinstance(token, str) or token.count(".") != 1:
		raise Forbidden("invalid assertion")
	body_b64, signature_b64 = token.split(".", 1)
	try:
		body = _unb64(body_b64)
		signature = _unb64(signature_b64)
	except (ValueError, TypeError):
		raise Forbidden("invalid assertion") from None
	expected = hmac.new(_secret().encode("utf-8"), body, hashlib.sha256).digest()
	if not hmac.compare_digest(signature, expected):
		raise Forbidden("invalid assertion")
	payload = json.loads(body)
	now = int(time.time())
	if payload.get("iss") != ISSUER or payload.get("aud") != AUDIENCE:
		raise Forbidden("invalid assertion")
	if int(payload.get("iat", 0)) > now + CLOCK_SKEW_SECONDS:
		raise Forbidden("invalid assertion")
	if int(payload.get("exp", 0)) <= now:
		raise Forbidden("expired assertion")
	return payload


def preferences(literacy: str | None, locale: str | None) -> dict:
	"""Agent-vocabulary preferences from the shared table; unknown values use the default."""
	return {
		"literacy": vocabulary.normalise_literacy(literacy),
		"locale": vocabulary.normalise_locale(locale),
	}


def mint(
	user: str,
	customer: str,
	application: str | None,
	thread_id: str | None,
	literacy: str | None = None,
	locale: str | None = None,
) -> dict:
	now = int(time.time())
	payload = {
		"iss": ISSUER,
		"aud": AUDIENCE,
		"sub": user,
		"customer": customer,
		"application": application,
		"thread": thread_id,
		**preferences(literacy, locale),
		"iat": now,
		"exp": now + TTL_SECONDS,
		"jti": secrets.token_hex(16),
	}
	return {"assertion": sign(payload), "expires_in": TTL_SECONDS, "jti": payload["jti"]}
