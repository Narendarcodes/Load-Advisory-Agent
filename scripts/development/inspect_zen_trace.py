"""Print/save ZEN trace for one application: decision, result, trace, timing."""
import json
import sys

sys.path.insert(0, ".")
sys.path.insert(0, "apps/api/src")

from loan_advisory.application.decision_orchestrator import decide

app_id = sys.argv[1] if len(sys.argv) > 1 else "APP-TEST-005"
ev = decide(app_id)
log = ev.pop("_log")
print("=== DECISION ===")
print(ev["decision"])
print("=== STRUCTURED RESULT ===")
print(json.dumps({k: v for k, v in ev.items() if k != "zen_trace"}, indent=1))
print("=== TRACE NODES ===")
for node_id, node in ev["zen_trace"].items():
    print(f"- {node_id} ({node.get('name')}): in={json.dumps(node.get('input'), default=str)[:160]} out={json.dumps(node.get('output'), default=str)[:160]} perf={node.get('performance')}")
print("=== TIMING ===")
print(json.dumps(log, indent=1))
