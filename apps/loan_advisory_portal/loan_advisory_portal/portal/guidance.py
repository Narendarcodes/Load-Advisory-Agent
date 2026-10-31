"""Borrower-facing explanation of each lifecycle state.

The portal shows the canonical state (`custom_lifecycle_state`); this module says
what it means for the person who applied and what, if anything, they can do next.
It is deliberately pure text with no frappe import so it stays in step with the
canonical table in `portal/lifecycle.py`.
"""

from loan_advisory_portal.portal import lifecycle

GUIDANCE = {
	"DRAFT": {
		"title": "Draft",
		"summary": "This application has not been submitted yet, so it has not been assessed.",
		"next_steps": [
			"Add at least one document.",
			"Check the details and submit the application.",
			"Withdraw it if you no longer need it.",
		],
	},
	"SUBMITTED": {
		"title": "Submitted",
		"summary": "Your application is queued for the automated checks.",
		"next_steps": [
			"The checks run without any action from you.",
			"The outcome appears here when it is ready.",
			"You can withdraw while no decision has been made.",
		],
	},
	"INFO_REQUESTED": {
		"title": "Information needed",
		"summary": "The checks need a correction before the application can be assessed.",
		"next_steps": [
			"Update the values listed under Information needed.",
			"Resubmit the application; your documents stay as they are.",
		],
	},
	"UNDER_REVIEW": {
		"title": "Under review",
		"summary": "The application is being checked against the lending policy.",
		"next_steps": [
			"No action is needed from you.",
			"The outcome appears here when the checks finish.",
		],
	},
	"MANUAL_REVIEW": {
		"title": "Manual review",
		"summary": "The automated checks did not settle the outcome, so a person is looking at it.",
		"next_steps": [
			"No action is needed from you.",
			"Your loan advisor can tell you if anything else is required.",
		],
	},
	"APPROVED": {
		"title": "Approved",
		"summary": "The application met the lending policy.",
		"next_steps": [
			"Your loan advisor will contact you about the next steps.",
			"The decision section shows what was checked.",
		],
	},
	"REJECTED": {
		"title": "Not approved",
		"summary": "The application did not meet the lending policy.",
		"next_steps": [
			"Read what affected the outcome.",
			"Ask the assistant to explain the recorded decision.",
			"You can start a new application if your circumstances change.",
		],
	},
	"WITHDRAWN": {
		"title": "Withdrawn",
		"summary": "You closed this application. It cannot be reopened.",
		"next_steps": ["Start a new application whenever you need one."],
	},
}


def for_state(state: str) -> dict:
	"""Guidance for a known state; an unknown value is described, never guessed."""
	entry = GUIDANCE.get(state)
	if entry is None:
		return {
			"title": state.title() if state else "Unknown",
			"summary": "This application is in a state the portal does not describe.",
			"next_steps": ["Ask your loan advisor what happens next."],
		}
	return entry


def states_covered() -> set[str]:
	return set(GUIDANCE)


def assert_complete() -> None:
	"""Guard used by tests: every canonical state must have borrower guidance."""
	missing = set(lifecycle.STATES) - states_covered()
	if missing:
		raise AssertionError(f"no guidance for lifecycle states: {sorted(missing)}")
