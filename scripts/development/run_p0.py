"""End-to-end P0 run: all fixtures + one what-if simulation (read-only)."""
import sys

sys.path.insert(0, ".")
sys.path.insert(0, "apps/api/src")

from loan_advisory.application.decision_orchestrator import decide
from loan_advisory.infrastructure.frappe_adapter import MockStore

store = MockStore()
for app in [f"APP-TEST-00{i}" for i in range(1, 9)]:
    ev = decide(app, store=store)
    fails = [r["rule_id"] for r in ev["rule_evaluations"] if r["result"] == "FAIL"]
    print(f"{app}: {ev['decision']} fails={fails} trace={ev['_log']['trace_available']} err={ev['_log']['error']}")

print("--- WHAT-IF: APP-TEST-005 with obligations 18500 -> 14000 (in-memory only) ---")
sim = decide("APP-TEST-005", store=store,
             overrides={"custom_monthly_obligations": 14000})
print("simulated:", sim["decision"],
      [(r["rule_id"], r["result"]) for r in sim["rule_evaluations"]])
orig = store.get("APP-TEST-005")
assert orig["custom_monthly_obligations"] == 18500, "original mutated!"
print("original unchanged: OK")
