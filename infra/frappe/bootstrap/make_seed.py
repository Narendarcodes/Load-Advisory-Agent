"""Build seed_applications.json deterministically from repo fixtures + personas (synthetic only)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
fx = json.loads((ROOT / "data/synthetic/applicants.json").read_text())["cases"]
rows = []
p5 = next(c for c in fx if c["application_id"] == "APP-TEST-005")
# P1 parity record: CUS-TEST-001 carrying APP-TEST-005's values (as in the P1 live setup).
rows.append({**{k: p5[k] for k in ("monthly_income", "monthly_obligations", "credit_score", "employment_months", "loan_amount", "loan_tenure_months")},
             "applicant_id": "CUS-TEST-001", "external_ref": "P1-PARITY-APP-TEST-005"})
for c in fx:
    if all(isinstance(c.get(k), (int, float)) and c.get(k) is not None for k in ("monthly_income", "monthly_obligations", "credit_score", "employment_months")):
        rows.append({k: c[k] for k in ("applicant_id", "monthly_income", "monthly_obligations", "credit_score", "employment_months", "loan_amount", "loan_tenure_months")} | {"external_ref": c["application_id"]})
personas = [json.loads(l) for l in (ROOT / "data/synthetic/personas/personas_v1.jsonl").open()]
seen = {}
for p in personas:  # 4 per scenario incl. missing-data ones (Frappe accepts nulls; ZEN path must refuse)
    if seen.get(p["scenario"], 0) >= 4:
        continue
    if p["scenario"] == "invalid_data":
        continue  # invalid values are exercised in unit tests, not stored in the system of record
    seen[p["scenario"]] = seen.get(p["scenario"], 0) + 1
    rows.append({k: p[k] for k in ("applicant_id", "monthly_income", "monthly_obligations", "credit_score", "employment_months", "loan_amount", "loan_tenure_months")} | {"external_ref": p["application_id"]})
(Path(__file__).parent / "seed_applications.json").write_text(json.dumps(rows, indent=1))
print(len(rows), "seed rows")
