"""Officer review of MANUAL_REVIEW cases (ADR-0008), pure Python (no `frappe` import).

The three desk actions follow `lifecycle.json`: each one is legal only from MANUAL_REVIEW and
only to a target the transition table allows from there. A note is required on every action
and is kept in the Loan Application's audit table. The frozen Decision Snapshot is read,
never written.
"""

from loan_advisory_portal.portal import lifecycle

REVIEW_STATE = "MANUAL_REVIEW"
ACTIONS = {
	"approve": ("Approve", "APPROVED"),
	"decline": ("Decline", "REJECTED"),
	"request_info": ("Request info", "INFO_REQUESTED"),
}
MIN_NOTE_LENGTH = 10
MAX_NOTE_LENGTH = 2000


class ReviewError(ValueError):
	pass


def clean_note(note) -> str:
	text = " ".join(str(note or "").split())
	if len(text) < MIN_NOTE_LENGTH:
		raise ReviewError(f"A review note of at least {MIN_NOTE_LENGTH} characters is required.")
	if len(text) > MAX_NOTE_LENGTH:
		raise ReviewError(f"A review note can be at most {MAX_NOTE_LENGTH} characters.")
	return text


def plan(action: str, current_state: str, note) -> dict:
	"""Validate one officer action and return what to write. Raises ReviewError."""
	if action not in ACTIONS:
		raise ReviewError(f"Unknown review action: {action!r}.")
	label, target = ACTIONS[action]
	if current_state != REVIEW_STATE:
		raise ReviewError(f"Only an application in {REVIEW_STATE} can be reviewed (this one is {current_state}).")
	try:
		lifecycle.check_transition(current_state, target)
	except lifecycle.IllegalTransition as exc:
		raise ReviewError(str(exc)) from None
	native = lifecycle.native_status_for(target) if target in lifecycle.TERMINAL else None
	return {
		"action": label,
		"from_state": current_state,
		"to_state": target,
		"note": clean_note(note),
		"native_status": native,
	}
