"""Profile normalised proxy datasets + raw-column leakage/bias scan -> JSON report.

Usage: LOAN_DATA_DIR=/root/hx/loan/data python scripts/data/audit_datasets.py > audit.json
The JSON is summarised (not pasted wholesale) in docs/data/dataset_audit.md.
"""
import json
import os
from pathlib import Path

import pandas as pd

DATA = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data"))

# Fields that only exist AFTER the credit decision / origination (target leakage for any
# decision-time experiment). Names from the LendingClub data dictionary.
LC_POST_DECISION = [
    "int_rate", "grade", "sub_grade", "installment", "funded_amnt", "funded_amnt_inv", "issue_d",
    "loan_status", "pymnt_plan", "out_prncp", "out_prncp_inv", "total_pymnt", "total_pymnt_inv",
    "total_rec_prncp", "total_rec_int", "total_rec_late_fee", "recoveries", "collection_recovery_fee",
    "last_pymnt_d", "last_pymnt_amnt", "next_pymnt_d", "last_credit_pull_d", "last_fico_range_high",
    "last_fico_range_low", "hardship_flag", "debt_settlement_flag", "settlement_status", "initial_list_status",
]
SENSITIVE = {
    "lc_kaggle_accepted": ["zip_code", "addr_state", "emp_title", "desc", "title"],
    "lc_zenodo_granting": ["zip_code", "addr_state", "title", "desc"],
    "uci_german_credit": ["A9 personal status & sex", "A13 age", "A20 foreign worker"],
    "uci_taiwan_default": ["SEX", "EDUCATION", "MARRIAGE", "AGE"],
}
SYN = {"income": 25000, "foir": 0.45, "score": 700, "emp": 12}  # synthetic-v1 thresholds (NOT real policy)


def profile(df: pd.DataFrame) -> dict:
    num = ["loan_amount", "loan_tenure_months", "monthly_income", "monthly_obligations",
           "debt_ratio", "credit_score", "employment_months_min"]
    out = {"rows": int(len(df)), "missing_pct": {}, "quantiles": {}}
    for c in num:
        s = pd.to_numeric(df[c], errors="coerce")
        out["missing_pct"][c] = round(float(s.isna().mean() * 100), 2)
        if s.notna().any():
            q = s.quantile([0.01, 0.5, 0.99])
            out["quantiles"][c] = {k: round(float(v), 4) for k, v in zip(("p01", "p50", "p99"), q)}
    for c in ("decision", "repayment_outcome", "currency", "credit_score_scale"):
        vc = df[c].fillna("<null>").value_counts().head(8)
        out[c] = {str(k): int(v) for k, v in vc.items()}
    # Illustrative only: how the two scale-free synthetic rules would split the proxy rows.
    dr, cs = pd.to_numeric(df["debt_ratio"], errors="coerce"), pd.to_numeric(df["credit_score"], errors="coerce")
    if dr.notna().any():
        out["share_debt_ratio_le_0_45"] = round(float((dr <= SYN["foir"]).mean()), 4)
    if cs.notna().any():
        out["share_score_ge_700_native_scale"] = round(float((cs >= SYN["score"]).mean()), 4)
    em = pd.to_numeric(df["employment_months_min"], errors="coerce")
    if em.notna().any():
        out["share_employment_min_ge_12m"] = round(float((em >= SYN["emp"]).mean()), 4)
    out["duplicate_record_ids"] = int(df["record_id"].duplicated().sum())
    return out


def lc_raw_scan() -> dict:
    f = DATA / "raw" / "lc_kaggle_accepted" / "accepted_2007_to_2018Q4.csv"
    if not f.exists():
        return {}
    cols = list(pd.read_csv(f, nrows=0).columns)
    return {"n_columns": len(cols), "post_decision_columns_present": [c for c in LC_POST_DECISION if c in cols],
            "sensitive_or_proxy_columns_present": [c for c in SENSITIVE["lc_kaggle_accepted"] if c in cols]}


def main():
    rep = {"datasets": {}, "lc_accepted_raw_scan": lc_raw_scan(), "sensitive_columns": SENSITIVE}
    for p in sorted((DATA / "normalised").glob("*.parquet")):
        rep["datasets"][p.stem] = profile(pd.read_parquet(p))
    manifests = {}
    for m in (DATA / "raw").glob("*/MANIFEST.json"):
        j = json.loads(m.read_text())
        manifests[j["id"]] = [{k: f.get(k) for k in ("name", "bytes", "sha256")} for f in j["files"]]
    rep["manifests"] = manifests
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
