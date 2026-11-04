"""Pure-Python guards for the Saral LMS doctypes (no `frappe` import).

The doctype controllers call these so the same checks run in CI without a bench. The
identifier patterns mirror `contracts/common.py` (kept in step by
`tests/test_saral_lms_doctypes.py`): the Frappe app is deployed without the repo's
`contracts` package, so it carries its own copy.

NEVER_STORE (data dictionary): full PAN, full Aadhaar, OTP values and raw OCR text have no
field anywhere in the app, and these guards refuse them inside JSON blobs too.
"""

import hashlib
import json
import re

MASKED_PAN_PATTERN = r"^XXXXX[0-9]{4}X$"
AADHAAR_LAST4_PATTERN = r"^[0-9]{4}$"
SHA256_PATTERN = r"^[0-9a-f]{64}$"
IFSC_PATTERN = r"^[A-Z]{4}0[A-Z0-9]{6}$"

_FULL_PAN = re.compile(r"(?<![A-Z0-9])(?!XXXXX)[A-Z]{5}\s?[0-9]{4}\s?[A-Z](?![A-Z0-9])", re.IGNORECASE)
_FULL_AADHAAR = re.compile(r"(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)")

# Keys that must never appear in a stored JSON blob (NEVER_STORE items and their aliases).
FORBIDDEN_KEYS = frozenset({
	"pan", "pan_full", "pan_number", "aadhaar", "aadhaar_full", "aadhaar_number", "uid",
	"otp", "otp_value", "otp_values", "otp_code", "ocr_raw_text", "raw_text", "raw_ocr_text", "ocr_text",
})

BORROWER_REASON_CATEGORIES = frozenset({
	"EMPLOYMENT_STABILITY", "INCOME_NOT_VERIFIED_OR_INSUFFICIENT", "REPAYMENTS_TOO_HIGH", "CREDIT_HISTORY",
	"RECENT_CREDIT_APPLICATIONS", "DETAILS_NOT_VERIFIED", "DOCUMENTS_INCOMPLETE_OR_UNCLEAR",
	"REQUEST_OUTSIDE_OFFER", "OTHER",
})

# Four-level ZEN outcome plus the offer outcome; the legacy three stay valid on old evidence.
DECISION_OUTCOMES = ("ELIGIBILITY_CONDITIONS_MET", "COUNTER_OFFER", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "DECLINE")
LEGACY_DECISIONS = ("APPROVED", "REJECTED", "ERROR")


class GuardError(ValueError):
	pass


def _is_digest_key(key: str) -> bool:
	return key.endswith("sha256") or key.endswith("_hash") or key == "sha256"


def find_raw_identifiers(value, path: str = "$") -> list[str]:
	"""JSON paths of strings that look like a full PAN or Aadhaar, or keys that are NEVER_STORE."""
	hits: list[str] = []
	if isinstance(value, str):
		if _FULL_PAN.search(value) or _FULL_AADHAAR.search(value):
			hits.append(path)
	elif isinstance(value, dict):
		for key, item in value.items():
			if str(key).lower() in FORBIDDEN_KEYS:
				hits.append(f"{path}.{key}")
				continue
			if _is_digest_key(str(key)):
				continue
			hits.extend(find_raw_identifiers(item, f"{path}.{key}"))
	elif isinstance(value, (list, tuple)):
		for index, item in enumerate(value):
			hits.extend(find_raw_identifiers(item, f"{path}[{index}]"))
	return hits


def parse_json(value, label: str, *, expect=(list, dict), allow_blank: bool = True):
	"""Parse a Long Text JSON field; blank is allowed unless `allow_blank` is False."""
	if value in (None, ""):
		if allow_blank:
			return None
		raise GuardError(f"{label} is required")
	if isinstance(value, (list, dict)):
		parsed = value
	else:
		try:
			parsed = json.loads(value)
		except (TypeError, ValueError):
			raise GuardError(f"{label} must be valid JSON") from None
	if not isinstance(parsed, expect):
		names = "/".join(t.__name__ for t in (expect if isinstance(expect, tuple) else (expect,)))
		raise GuardError(f"{label} must be a JSON {names}")
	hits = find_raw_identifiers(parsed)
	if hits:
		raise GuardError(f"{label} holds a NEVER_STORE value at {', '.join(hits)}")
	return parsed


def canonical_json(value) -> str:
	return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def canonical_sha256(value) -> str:
	return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def check_pattern(value, pattern: str, label: str) -> None:
	if value in (None, ""):
		return
	if not re.match(pattern, str(value)):
		raise GuardError(f"{label} has an invalid format")


def check_masked_pan(value) -> None:
	check_pattern(value, MASKED_PAN_PATTERN, "pan_masked (expected XXXXX1234X)")


def check_aadhaar_last4(value) -> None:
	check_pattern(value, AADHAAR_LAST4_PATTERN, "aadhaar_last4 (exactly 4 digits)")


def check_sha256(value, label: str) -> None:
	check_pattern(value, SHA256_PATTERN, f"{label} (64 lowercase hex)")


def check_categories(value) -> list:
	categories = parse_json(value, "borrower_categories", expect=list) or []
	unknown = [c for c in categories if c not in BORROWER_REASON_CATEGORIES]
	if unknown:
		raise GuardError(f"unknown borrower categories: {unknown}")
	return categories


def freeze_input(zen_input_json, stored_sha256: str | None) -> str:
	"""Return the sha256 of the frozen ZEN input; refuse a hash that does not match."""
	parsed = parse_json(zen_input_json, "zen_input_json", expect=dict, allow_blank=False)
	digest = canonical_sha256(parsed)
	if stored_sha256 and stored_sha256 != digest:
		raise GuardError("zen_input_sha256 does not match the frozen ZEN input")
	return digest


def changed_fields(before: dict, after: dict, ignore=("modified", "modified_by")) -> list[str]:
	"""Field names whose values differ between two plain dicts (immutability check)."""
	keys = (set(before) | set(after)) - set(ignore)
	return sorted(k for k in keys if before.get(k) != after.get(k))
