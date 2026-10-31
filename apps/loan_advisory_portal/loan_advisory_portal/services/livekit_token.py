"""Minimal LiveKit access-token minting (HS256 JWT).

No LiveKit SDK dependency: the token contract is a standard HS256 JWT with a
`video` grant. The API secret is read from the site config and never leaves the
server.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

import frappe

from loan_advisory_portal.portal.errors import ServiceUnavailable

TOKEN_TTL_SECONDS = 600

# The borrower agrees to the voice notice that carried this version. A session records it so a
# later change to the wording can be told apart from sessions started under the old one.
CONSENT_VERSION = "voice-consent/1"


def _b64(raw: bytes) -> str:
	return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _encode(segment: dict) -> str:
	return _b64(json.dumps(segment, separators=(",", ":"), sort_keys=True).encode("utf-8"))


def configuration() -> dict:
	config = {
		"api_key": frappe.conf.get("livekit_api_key"),
		"api_secret": frappe.conf.get("livekit_api_secret"),
		"url": frappe.conf.get("livekit_url"),
	}
	if not all(config.values()):
		raise ServiceUnavailable("voice is not configured")
	return config


def create_token(*, api_key: str, api_secret: str, identity: str, name: str, room: str, metadata: dict) -> str:
	now = int(time.time())
	header = {"alg": "HS256", "typ": "JWT"}
	payload = {
		"iss": api_key,
		"sub": identity,
		"name": name,
		"nbf": now - 10,
		"iat": now,
		"exp": now + TOKEN_TTL_SECONDS,
		"jti": secrets.token_hex(8),
		"video": {
			"room": room,
			"roomJoin": True,
			"canPublish": True,
			"canSubscribe": True,
			"canPublishData": True,
		},
		"metadata": json.dumps(metadata, separators=(",", ":"), sort_keys=True),
	}
	signing_input = f"{_encode(header)}.{_encode(payload)}"
	signature = hmac.new(api_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
	return f"{signing_input}.{_b64(signature)}"
