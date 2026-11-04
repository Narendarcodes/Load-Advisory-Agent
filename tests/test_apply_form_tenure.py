"""E2E defect D-02 (2026-11-04 live run): the apply form stopped at 60 months, so a borrower could not ask for
the 72/84-month terms the higher-education and home-renovation products allow (catalogue PL-110 tenure cap 84)."""
import re
from pathlib import Path

APPLY = Path(__file__).resolve().parents[1] / "apps/loan_advisory_portal/loan_advisory_portal/www/borrower/apply.html"


def _tenure_options():
	html = APPLY.read_text(encoding="utf-8")
	block = re.search(r'<select id="loan-tenure">(.*?)</select>', html, re.S).group(1)
	return [int(v) for v in re.findall(r'<option value="(\d+)"', block)]


def test_apply_form_offers_every_product_tenure_up_to_84_months():
	opts = _tenure_options()
	for months in (12, 24, 36, 48, 60, 72, 84):
		assert months in opts, f"{months} months missing from the apply form"


def test_apply_form_tenure_options_are_sorted_and_capped():
	opts = _tenure_options()
	assert opts == sorted(opts)
	assert max(opts) <= 84
