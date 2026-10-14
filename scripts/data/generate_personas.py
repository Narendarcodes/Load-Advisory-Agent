"""Synthetic applicant personas (>=2,000) labelled by the EXISTING P0/P1 pipeline.

    python scripts/data/generate_personas.py --n 2400 --seed 20261014

Writes data/synthetic/personas/personas_v1.jsonl (structured fields + pipeline label +
deterministic what-if counterfactuals). Narratives/questions are added separately by
scripts/data/narrate_personas.py (gpt-oss-120b on the droplet).

Everything here is SYNTHETIC. Labels come from decision_engine policy `synthetic-v1`
(income >= 25,000 INR, FOIR <= 0.45, score >= 700, tenure >= 12 months), which is a
prototype assumption, NOT a real lender policy. No real people.
"""
import argparse
import json
import math
import random
from collections import Counter
from pathlib import Path

from loan_advisory.application.decision_orchestrator import decide

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "synthetic" / "personas" / "personas_v1.jsonl"
POLICY_VERSION = "synthetic-v1"
T_INC, T_FOIR, T_SCORE, T_EMP = 25000, 0.45, 700, 12

EMPLOYMENT = {  # type -> (median monthly income INR, sigma of log-income)
    "salaried_private": (38000, 0.55), "salaried_government": (52000, 0.4),
    "self_employed": (35000, 0.75), "gig_or_contract": (21000, 0.45),
}
LITERACY = ["low", "medium", "high"]
LANGS = ["Telugu", "Hindi", "English", "Tamil", "Kannada", "Marathi", "Bengali"]
CITY = ["metro", "tier2", "tier3_or_rural"]
PURPOSE = ["medical", "wedding", "education", "home_renovation", "debt_consolidation", "travel", "business_working_capital", "vehicle_repair"]
AGE = ["21-25", "26-35", "36-45", "46-58"]

# Scenario quotas: which rules should fail (by construction) — pipeline label is still authoritative.
SCENARIOS = (
    [("all_pass", ())] * 5
    + [("single_fail", (r,)) for r in ("INC", "FOIR", "SCORE", "EMP")] * 3
    + [("double_fail", p) for p in (("FOIR", "SCORE"), ("INC", "FOIR"), ("SCORE", "EMP"), ("INC", "EMP"), ("FOIR", "EMP"), ("INC", "SCORE"))]
    + [("triple_fail", ("FOIR", "SCORE", "EMP")), ("triple_fail", ("INC", "FOIR", "SCORE")), ("all_fail", ("INC", "FOIR", "SCORE", "EMP"))]
)


def _income(rng, emp, fail):
    med, sig = EMPLOYMENT[emp]
    for _ in range(200):
        v = round(math.exp(rng.gauss(math.log(med), sig)) / 500) * 500
        if 6000 <= v <= 400000 and ((v < T_INC) == fail):
            return v
    return rng.choice([12000, 18000, 22500]) if fail else rng.choice([30000, 45000, 70000])


def _foir(rng, fail):
    return round(rng.uniform(0.46, 0.85), 3) if fail else round(rng.choice([rng.uniform(0.0, 0.2), rng.uniform(0.2, 0.45)]), 3)


def _score(rng, fail):
    return rng.randint(450, 699) if fail else rng.randint(700, 880)


def _emp_months(rng, fail):
    return rng.randint(0, 11) if fail else rng.choice([rng.randint(12, 36), rng.randint(37, 300)])


def base_persona(rng, i, scenario, fails):
    emp = rng.choice(list(EMPLOYMENT))
    inc = _income(rng, emp, "INC" in fails)
    foir = _foir(rng, "FOIR" in fails)
    tenure = rng.choice([12, 18, 24, 36, 48, 60])
    amount = round(min(inc * rng.uniform(2, 14), 1_500_000) / 5000) * 5000 or 25000
    return {
        "persona_id": f"PER-{i:05d}", "application_id": f"SYN-APP-{i:05d}", "applicant_id": f"SYN-CUS-{i:05d}",
        "scenario": scenario, "constructed_failures": list(fails),
        "employment_type": emp, "city_tier": rng.choice(CITY), "age_band": rng.choice(AGE),
        "preferred_language": rng.choice(LANGS), "loan_literacy": rng.choices(LITERACY, [0.4, 0.4, 0.2])[0],
        "loan_purpose": rng.choice(PURPOSE),
        "monthly_income": inc, "monthly_obligations": round(inc * foir), "credit_score": _score(rng, "SCORE" in fails),
        "employment_months": _emp_months(rng, "EMP" in fails), "loan_amount": amount, "loan_tenure_months": tenure,
    }


def edge_personas(rng, start):
    """Exact boundaries, just-below boundaries, missing and invalid data."""
    rows, i = [], start
    ok = dict(monthly_income=40000, monthly_obligations=8000, credit_score=760, employment_months=30)
    variants = [
        ("boundary_exact", dict(monthly_income=25000)), ("boundary_exact", dict(monthly_income=40000, monthly_obligations=18000)),
        ("boundary_exact", dict(credit_score=700)), ("boundary_exact", dict(employment_months=12)),
        ("boundary_just_below", dict(monthly_income=24999)), ("boundary_just_below", dict(monthly_obligations=18001)),
        ("boundary_just_below", dict(credit_score=699)), ("boundary_just_below", dict(employment_months=11)),
        ("missing_data", dict(credit_score=None)), ("missing_data", dict(monthly_income=None)),
        ("missing_data", dict(employment_months=None)), ("missing_data", dict(monthly_obligations=None)),
        ("invalid_data", dict(credit_score=950)), ("invalid_data", dict(monthly_income=-5000)),
        ("invalid_data", dict(employment_months=-3)), ("invalid_data", dict(monthly_obligations=-1)),
    ]
    for _ in range(10):
        for scen, ov in variants:
            p = base_persona(rng, i, scen, ())
            p.update(ok)  # a clean all-pass profile (income 40,000; FOIR 0.20) ...
            p.update(ov)  # ... with exactly one field moved to the edge / removed / corrupted
            if "monthly_income" in ov and isinstance(ov["monthly_income"], int) and ov["monthly_income"] > 0:
                p["monthly_obligations"] = round(ov["monthly_income"] * 0.2)
            p["constructed_failures"] = []
            rows.append(p)
            i += 1
    return rows


class DictStore:
    def __init__(self, personas):
        self._d = {p["application_id"]: p for p in personas}

    def get(self, app_id):
        p = self._d[app_id]
        return {"name": app_id, "applicant": p["applicant_id"], "loan_amount": p["loan_amount"],
                "repayment_periods": p["loan_tenure_months"],
                "custom_monthly_income": p["monthly_income"], "custom_monthly_obligations": p["monthly_obligations"],
                "custom_credit_score": p["credit_score"], "custom_employment_months": p["employment_months"]}


def counterfactuals(store, p, failed):
    """Deterministic single-rule what-ifs, re-verified through the same pipeline (in memory)."""
    cfs = []
    inc, obl = p["monthly_income"], p["monthly_obligations"]
    for rid in failed:
        if rid == "FOIR_MAX_45":
            target = math.floor(T_FOIR * inc)
            ov = {"custom_monthly_obligations": target}
            desc = {"monthly_obligations_at_most": target, "reduce_by": obl - target}
        elif rid == "MIN_MONTHLY_INCOME":
            ov = {"custom_monthly_income": T_INC}
            desc = {"monthly_income_at_least": T_INC, "increase_by": T_INC - inc}
        elif rid == "MIN_CREDIT_SCORE":
            ov = {"custom_credit_score": T_SCORE}
            desc = {"credit_score_at_least": T_SCORE, "gap_points": T_SCORE - p["credit_score"]}
        else:
            ov = {"custom_employment_months": T_EMP}
            desc = {"employment_months_at_least": T_EMP, "months_to_wait": T_EMP - p["employment_months"]}
        ev = decide(p["application_id"], store=store, overrides=ov)
        still = [r["rule_id"] for r in ev["rule_evaluations"] if r["result"] == "FAIL"]
        cfs.append({"rule_id": rid, "change": desc, "rule_passes_after_change": rid not in still,
                    "decision_after_single_change": ev["decision"],
                    "note": "hypothetical under synthetic-v1; not a guarantee of approval"})
    return cfs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=2400)
    ap.add_argument("--seed", type=int, default=20261014)
    a = ap.parse_args()
    rng = random.Random(a.seed)
    personas = [base_persona(rng, i, *rng.choice(SCENARIOS)) for i in range(a.n)]
    personas += edge_personas(rng, a.n)
    store = DictStore(personas)
    stats = Counter()
    with OUT.open("w") as f:
        for p in personas:
            ev = decide(p["application_id"], store=store)
            failed = [r["rule_id"] for r in ev["rule_evaluations"] if r["result"] == "FAIL"]
            p["label"] = {
                "decision": ev["decision"], "policy_version": ev["policy"]["version"], "policy_is_synthetic": True,
                "failed_rules": failed,
                "reason_codes": [r["reason_code"] for r in ev["rule_evaluations"] if r["result"] == "FAIL"],
                "foir": next((r["actual_value"] for r in ev["rule_evaluations"] if r["rule_id"] == "FOIR_MAX_45"), None),
                "error": ev.get("error"),
                "labelled_by": "loan_advisory.application.decision_orchestrator.decide (P0/P1 pipeline, ZEN 2.1.2)",
            }
            p["counterfactuals"] = counterfactuals(store, p, failed) if ev["decision"] == "REJECTED" else []
            stats[(p["scenario"], ev["decision"])] += 1
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    print(json.dumps({"rows": len(personas), "by_scenario_decision": {f"{k[0]}|{k[1]}": v for k, v in sorted(stats.items())}}, indent=1))


if __name__ == "__main__":
    main()
