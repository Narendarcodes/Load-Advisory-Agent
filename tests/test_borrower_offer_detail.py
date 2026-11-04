"""E2E defect D-06 (2026-11-04 live run): get_decision never passed the borrower's own offer to the card, so a
counter-offer showed the requested amount and an EMI worked out from the request."""
import json
import sys
import types
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal"))
class _Stub(types.ModuleType):
    """Minimal frappe stand-in: any missing attribute is a harmless class or callable (pure helpers only)."""
    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        value = type(name, (Exception,), {}) if name[0].isupper() else (lambda *a, **k: (lambda f: f) if name == "whitelist" else None)
        setattr(self, name, value)
        return value


for mod in ("frappe", "frappe.utils"):
    sys.modules.setdefault(mod, _Stub(mod))
sys.modules["frappe"]._ = lambda s: s
sys.modules["frappe"].utils = sys.modules["frappe.utils"]

from loan_advisory_portal.api import applications  # noqa: E402

REC = {"outcome": "COUNTER_OFFER", "offer": {"amount": 2500000, "emi": 55515, "tenure_months": 84, "counter_offer": True,
                                             "request_outside_mvp_range": True},
       "rule_evaluations": [{"rule_id": "PL-110", "result": "FAIL", "threshold": 2500000, "actual_value": 3540000}]}


def test_borrower_detail_carries_only_the_borrowers_own_offer():
    d = applications._borrower_detail(SimpleNamespace(record_json=json.dumps(REC), decision="COUNTER_OFFER"), "APPROVED")
    assert d["offer"] == {"amount": 2500000, "emi": 55515, "tenure_months": 84, "counter_offer": True,
                          "request_outside_mvp_range": True}
    assert "2500000" not in json.dumps(d["reasons"])  # cut-offs stay in the evidence store


def test_no_offer_for_a_decline():
    d = applications._borrower_detail(SimpleNamespace(record_json=json.dumps({"outcome": "DECLINE"}), decision="DECLINE"), "REJECTED")
    assert d["offer"] is None
