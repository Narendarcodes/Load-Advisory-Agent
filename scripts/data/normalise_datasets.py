"""Normalise downloaded public datasets into ONE proxy schema (raw data stays out of git).

Usage: LOAN_DATA_DIR=/root/hx/loan/data python scripts/data/normalise_datasets.py

Output: $LOAN_DATA_DIR/normalised/<id>.parquet with the columns in PROXY_COLUMNS.
This is a *public proxy* of our canonical schema (decision_engine/schemas/underwriting.py),
NOT canonical input: currencies, score scales and DTI definitions differ, so rows must
never be fed to the INR synthetic policy as if they were Indian applications.
Every derived column states its derivation in docs/data/dataset_audit.md (§4).
"""
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

DATA = Path(os.environ.get("LOAN_DATA_DIR", "/root/hx/loan/data"))
RAW, OUT = DATA / "raw", DATA / "normalised"

PROXY_COLUMNS = [
    "source_id", "record_id", "application_date", "currency",
    "loan_amount", "loan_tenure_months", "monthly_income", "monthly_obligations",
    "debt_ratio", "debt_ratio_definition", "credit_score", "credit_score_scale",
    "employment_months_min", "employment_raw",
    "decision", "decision_reason_codes", "repayment_outcome", "label_semantics",
]

# LendingClub emp_length strings -> lower bound in months (bucketed; "10+" is open-ended)
EMP_LC = {"< 1 year": 0, "1 year": 12, **{f"{i} years": 12 * i for i in range(2, 10)}, "10+ years": 120}


def _frame(n, **cols):
    df = pd.DataFrame({c: cols.get(c, pd.Series([None] * n)) for c in PROXY_COLUMNS})
    return df


def lc_zenodo():
    f = RAW / "lc_zenodo_granting" / "LC_loans_granting_model_dataset.csv"
    d = pd.read_csv(f, low_memory=False)
    inc_m = d["revenue"] / 12.0
    return _frame(
        len(d), source_id=pd.Series(["lc_zenodo_granting"] * len(d)), record_id=d["id"].astype(str),
        application_date=d["issue_d"].astype(str), currency=pd.Series(["USD"] * len(d)),
        loan_amount=d["loan_amnt"], monthly_income=inc_m,
        monthly_obligations=inc_m * d["dti_n"] / 100.0,
        debt_ratio=d["dti_n"] / 100.0,
        debt_ratio_definition=pd.Series(["LC DTI: monthly debt payments excl. mortgage and requested LC loan / self-reported monthly income"] * len(d)),
        credit_score=d["fico_n"], credit_score_scale=pd.Series(["FICO 300-850 (mean of range)"] * len(d)),
        employment_months_min=d["emp_length"].map(EMP_LC), employment_raw=d["emp_length"].astype(str),
        decision=pd.Series(["APPROVED"] * len(d)),  # every row is an issued loan
        repayment_outcome=d["Default"].map({0: "PAID", 1: "DEFAULT"}),
        label_semantics=pd.Series(["issued loans only; target = repayment (Charged Off vs Fully Paid)"] * len(d)),
    )


LC_ACC_COLS = ["id", "issue_d", "loan_amnt", "term", "annual_inc", "dti", "fico_range_low",
               "fico_range_high", "emp_length", "loan_status", "application_type"]


def lc_accepted():
    f = RAW / "lc_kaggle_accepted" / "accepted_2007_to_2018Q4.csv"
    parts = []
    for d in pd.read_csv(f, usecols=LC_ACC_COLS, chunksize=500_000, low_memory=False):
        d = d[d["loan_amnt"].notna()]  # footer/summary rows have no amount
        inc_m = d["annual_inc"] / 12.0
        term = d["term"].astype(str).str.extract(r"(\d+)")[0].astype(float)
        out = _frame(
            len(d), source_id=pd.Series(["lc_kaggle_accepted"] * len(d)),
            record_id=d["id"].astype(str).values, application_date=d["issue_d"].astype(str).values,
            currency=pd.Series(["USD"] * len(d)), loan_amount=d["loan_amnt"].values,
            loan_tenure_months=term.values, monthly_income=inc_m.values,
            monthly_obligations=(inc_m * d["dti"] / 100.0).values, debt_ratio=(d["dti"] / 100.0).values,
            debt_ratio_definition=pd.Series(["LC DTI excl. mortgage and requested loan"] * len(d)),
            credit_score=((d["fico_range_low"] + d["fico_range_high"]) / 2).values,
            credit_score_scale=pd.Series(["FICO 300-850 (mean of range)"] * len(d)),
            employment_months_min=d["emp_length"].map(EMP_LC).values, employment_raw=d["emp_length"].astype(str).values,
            decision=pd.Series(["APPROVED"] * len(d)),
            repayment_outcome=d["loan_status"].map(lambda s: "PAID" if "Fully Paid" in str(s) else ("DEFAULT" if ("Charged Off" in str(s) or str(s) == "Default") else "OPEN_OR_LATE")).values,
            label_semantics=pd.Series(["issued loans; loan_status is post-origination"] * len(d)),
        )
        parts.append(out)
    return pd.concat(parts, ignore_index=True)


def lc_rejected():
    f = next((RAW / "lc_kaggle_rejected").glob("rejected_2007_to_2018Q4.csv*"))
    parts = []
    for d in pd.read_csv(f, chunksize=1_000_000, low_memory=False):
        dti = pd.to_numeric(d["Debt-To-Income Ratio"].astype(str).str.rstrip("%"), errors="coerce") / 100.0
        emp = d["Employment Length"].map(EMP_LC)
        parts.append(_frame(
            len(d), source_id=pd.Series(["lc_kaggle_rejected"] * len(d)), record_id=pd.Series(d.index.astype(str)),
            application_date=d["Application Date"].astype(str).values, currency=pd.Series(["USD"] * len(d)),
            loan_amount=d["Amount Requested"].values, debt_ratio=dti.values,
            debt_ratio_definition=pd.Series(["LC DTI excl. mortgage and requested loan"] * len(d)),
            credit_score=d["Risk_Score"].values,
            credit_score_scale=pd.Series(["FICO before 2013-11-05, VantageScore after (mixed scale)"] * len(d)),
            employment_months_min=emp.values, employment_raw=d["Employment Length"].astype(str).values,
            decision=pd.Series(["REJECTED"] * len(d)),
            label_semantics=pd.Series(["declined applications; NO reason codes"] * len(d)),
        ))
    return pd.concat(parts, ignore_index=True)


GER_EMP = {"A71": 0, "A72": 0, "A73": 12, "A74": 48, "A75": 84}


def uci_german():
    f = RAW / "uci_german_credit" / "unzipped" / "german.data"
    d = pd.read_csv(f, sep=r"\s+", header=None)
    return _frame(
        len(d), source_id=pd.Series(["uci_german_credit"] * len(d)), record_id=pd.Series(d.index.astype(str)),
        currency=pd.Series(["DM"] * len(d)), loan_amount=d[4], loan_tenure_months=d[1],
        employment_months_min=d[6].map(GER_EMP), employment_raw=d[6],
        debt_ratio_definition=pd.Series(["n/a (attr 8 = instalment rate as % of disposable income, banded 1-4)"] * len(d)),
        repayment_outcome=d[20].map({1: "GOOD_RISK", 2: "BAD_RISK"}),
        label_semantics=pd.Series(["credit-risk class (good/bad), NOT an approve/reject decision"] * len(d)),
    )


def uci_taiwan():
    f = next((RAW / "uci_taiwan_default" / "unzipped").glob("*.xls"))
    d = pd.read_excel(f, header=1)
    return _frame(
        len(d), source_id=pd.Series(["uci_taiwan_default"] * len(d)), record_id=d["ID"].astype(str),
        currency=pd.Series(["NTD"] * len(d)), loan_amount=d["LIMIT_BAL"],
        repayment_outcome=d["default payment next month"].map({0: "PAID", 1: "DEFAULT"}),
        label_semantics=pd.Series(["existing card clients; next-month default; LIMIT_BAL is a credit limit, not a loan request"] * len(d)),
    )


def uci_approval():
    f = RAW / "uci_credit_approval" / "unzipped" / "crx.data"
    d = pd.read_csv(f, header=None, na_values="?")
    return _frame(
        len(d), source_id=pd.Series(["uci_credit_approval"] * len(d)), record_id=pd.Series(d.index.astype(str)),
        decision=d[15].map({"+": "APPROVED", "-": "REJECTED"}),
        label_semantics=pd.Series(["approval decision; all 15 attributes anonymised (cannot map to canonical fields)"] * len(d)),
    )


BUILDERS = {"lc_zenodo_granting": lc_zenodo, "lc_kaggle_accepted": lc_accepted, "lc_kaggle_rejected": lc_rejected,
            "uci_german_credit": uci_german, "uci_taiwan_default": uci_taiwan, "uci_credit_approval": uci_approval}


def main(only=None):
    OUT.mkdir(parents=True, exist_ok=True)
    for sid, fn in BUILDERS.items():
        if only and sid not in only:
            continue
        try:
            df = fn()
            for c in ("loan_amount", "loan_tenure_months", "monthly_income", "monthly_obligations",
                      "debt_ratio", "credit_score", "employment_months_min"):
                df[c] = pd.to_numeric(df[c], errors="coerce")
            df = df.astype({c: "string" for c in PROXY_COLUMNS if df[c].dtype == object})
            df.to_parquet(OUT / f"{sid}.parquet", index=False)
            print(sid, "rows", len(df), flush=True)
        except (FileNotFoundError, StopIteration) as e:
            print(sid, "SKIPPED (raw file absent):", e, flush=True)


if __name__ == "__main__":
    main(sys.argv[1:] or None)
