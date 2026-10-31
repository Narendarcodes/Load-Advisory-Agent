"""Security headers for responses this app serves.

Frappe Desk is left alone: the CSP is scoped to `/borrower`, the only HTML this
app renders. The baseline headers are safe for asset and API responses too, so a
portal page cannot be sniffed, framed off-site or leak its path to a third party.

HSTS is emitted only when the request arrived over TLS (directly or through the
pinned proxy's `X-Forwarded-Proto`); browsers ignore it on plain HTTP anyway.
"""

import frappe

CSP = "; ".join(
	(
		"default-src 'self'",
		"script-src 'self' blob:",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		"media-src 'self' blob:",
		"connect-src 'self' https: wss:",
		"frame-src 'self'",
		"worker-src 'self' blob:",
		"frame-ancestors 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'",
	)
)

BASELINE = {
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer",
	"X-Frame-Options": "SAMEORIGIN",
	"Permissions-Policy": "geolocation=(), camera=(), microphone=(self)",
}


def apply(response, request=None):
	path = getattr(request, "path", "") or ""
	if path.startswith("/app"):
		# Desk brings its own policy; a portal CSP would break its asset pipeline.
		return

	for name, value in BASELINE.items():
		response.headers.setdefault(name, value)
	if path == "/borrower" or path.startswith("/borrower/"):
		response.headers.setdefault("Content-Security-Policy", CSP)
	if is_secure(request):
		response.headers.setdefault(
			"Strict-Transport-Security", "max-age=31536000; includeSubDomains"
		)

	retry_after = getattr(frappe.local, "retry_after", None)
	if retry_after and response.status_code == 429:
		response.headers.setdefault("Retry-After", str(int(retry_after)))


def is_secure(request) -> bool:
	if request is None:
		return False
	if (getattr(request, "scheme", "") or "").lower() == "https":
		return True
	forwarded = (request.headers.get("X-Forwarded-Proto") or "").split(",", 1)[0].strip()
	return forwarded.lower() == "https"
