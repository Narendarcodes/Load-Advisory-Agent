"""E2E defect D-04b (2026-11-04 live run): record_decision_snapshot copied None into NOT NULL Currency columns
on Loan Application (custom_eligible_amount), so every live snapshot failed with IntegrityError 1048."""
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "loan_advisory_portal"))
if "frappe" not in sys.modules:
    fake = types.ModuleType("frappe")
    fake._ = lambda s: s
    fake.whitelist = lambda **kw: (lambda f: f)
    sys.modules["frappe"] = fake

from loan_advisory_portal.api import snapshots  # noqa: E402


def test_queue_updates_skip_values_the_decision_did_not_produce():
    doc = {"outcome": "DECLINE", "offer_outcome": "NO_OFFER", "eligible_amount": None, "offer_amount": None,
           "offer_emi": None, "internal_reasons": "[]", "foir": 0.31}
    up = snapshots.queue_updates(doc.get)
    assert up == {"custom_decision_outcome": "DECLINE", "custom_offer_outcome": "NO_OFFER",
                  "custom_internal_reasons": "[]", "custom_foir": 0.31}


def test_queue_updates_copy_a_counter_offer():
    doc = {"outcome": "COUNTER_OFFER", "offer_amount": 2500000, "offer_emi": 55515, "offer_tenure_months": 84}
    up = snapshots.queue_updates(doc.get)
    assert up["custom_offer_amount"] == 2500000 and up["custom_offer_tenure_months"] == 84
