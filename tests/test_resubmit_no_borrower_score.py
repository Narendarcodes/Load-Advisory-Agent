"""E2E 2026-11-04: the credit score comes from the bureau only; the info-request resubmit form must not ask the
borrower to type one. The rate label reads as indicative and flat."""
from pathlib import Path

PORTAL = Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal" / "loan_advisory_portal"


def test_resubmit_form_has_no_credit_score_field():
    html = (PORTAL / "www" / "borrower" / "application.html").read_text(encoding="utf-8")
    js = (PORTAL / "public" / "js" / "pages" / "application.js").read_text(encoding="utf-8")
    assert "resubmit-credit" not in html and "resubmit-credit" not in js
    assert "credit_score: credit" not in js


def test_rate_label_is_indicative_and_flat():
    js = (PORTAL / "public" / "js" / "pages" / "application.js").read_text(encoding="utf-8")
    assert "flat (indicative)" in js
