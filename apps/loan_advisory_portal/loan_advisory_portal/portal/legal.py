"""Versions of the borrower-facing notices.

The invitation form and the profile consent checkboxes point at `/borrower/terms`
and `/borrower/privacy`. The version recorded with an acceptance is the version
of the text that was shown, so bumping the copy means bumping the constant.
"""

TERMS_VERSION = "portal-terms/1"
PRIVACY_VERSION = "portal-privacy/1"
UPDATED = "2026-10-31"
