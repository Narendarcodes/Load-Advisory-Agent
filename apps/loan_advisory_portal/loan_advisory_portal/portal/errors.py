import frappe


class PortalError(frappe.ValidationError):
	"""Base class for portal failures with an explicit HTTP status.

	Frappe only returns a message to the browser when one is registered, so the
	text is stored in `frappe.flags.error_message` (serialised as `_error_message`).
	"""

	http_status_code = 400

	def __init__(self, message: str | None = None, *args, **kwargs):
		super().__init__(message, *args, **kwargs)
		if message:
			frappe.flags.error_message = str(message)


class SignInRequired(PortalError, frappe.AuthenticationError):
	http_status_code = 401


class Forbidden(PortalError, frappe.PermissionError):
	http_status_code = 403


class NotFound(PortalError, frappe.DoesNotExistError):
	http_status_code = 404


class Conflict(PortalError):
	http_status_code = 409


class SelectionRequired(PortalError):
	http_status_code = 409


class InvitationInvalid(PortalError):
	http_status_code = 400


class ServiceUnavailable(PortalError):
	http_status_code = 503


class TooManyRequests(PortalError, frappe.RateLimitExceededError):
	http_status_code = 429

	def __init__(self, message: str | None = None, retry_after: int | None = None, *args, **kwargs):
		super().__init__(message, *args, **kwargs)
		self.retry_after = retry_after
