"""Per-account fixed-window budgets for the borrower surface.

`frappe.rate_limiter.rate_limit` counts by IP and only runs inside an HTTP
request. The portal needs budgets that follow the signed-in account — a shared
household address must not let one borrower exhaust another's budget — and that
also apply when a whitelisted method is invoked directly. Counters live in the
shared cache, so every worker sees the same window.

Budgets are deliberately generous: they exist to stop loops and abuse, not to
shape normal use. The table is the contract and is documented in
`docs/architecture/rate-limits.md`.
"""

import frappe
from frappe import _

from loan_advisory_portal.portal.errors import TooManyRequests


def enforce(scope: str, limit: int, seconds: int, *, identity: str | None = None) -> None:
	identity = identity or frappe.session.user
	if identity in (None, "", "Guest"):
		# Authentication is the caller's job; a guest is refused before this point.
		return

	key = frappe.cache.make_key(f"portal-budget:{scope}:{identity}")
	if not frappe.cache.get(key):
		frappe.cache.setex(key, seconds, 0)
	count = frappe.cache.incrby(key, 1)
	if count > limit:
		retry_after = max(int(frappe.cache.ttl(key) or seconds), 1)
		# after_request copies this onto the 429 so well-behaved clients back off.
		frappe.local.retry_after = retry_after
		raise TooManyRequests(
			_("Too many attempts. Try again in a few minutes."), retry_after=retry_after
		)
