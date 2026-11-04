"""Pure planning for the Saral ops seeder: synthetic applicants -> Frappe seed rows.

SYNTHETIC DATA ONLY. Runs anywhere (no Frappe import). The bench-side half is
`ops/saral_seed/frappe_seed.py`. Applicant data itself is never committed; it is read
from a directory produced by `python -m synthetic_data.saral_kyc_bank` (#50).
"""
from __future__ import annotations

import copy
import json
import re
from pathlib import Path

# DEMO_SCRIPT.md cast (+ SYN-APP-0098, the counter-offer slot after ADR-0011).
DEMO_IDS = ("SYN-APP-0001", "SYN-APP-0011", "SYN-APP-0031", "SYN-APP-0080", "SYN-APP-0082",
            "SYN-APP-0087", "SYN-APP-0098")
PRODUCT_CAP = 2_500_000  # ADR-0011: every product capped at ₹25L (prototype_synthetic)
PURPOSE_LABEL = {
    "PL_WEDDING": "Wedding",
    "PL_HIGHER_EDUCATION": "Higher education",
    "PL_HOME_RENOVATION": "Home renovation",
    "PL_MEDICAL_EMERGENCY": "Medical emergency",
}
_ID = re.compile(r"^SYN-APP-\d{4}$")
_RAW_PAN = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
_RAW_AADHAAR = re.compile(r"(?<![\w-])\d{4}\s?\d{4}\s?\d{4}(?![0-9a-fA-F])")


def assert_no_raw_ids(obj) -> None:
    """Refuse anything carrying an unmasked PAN or a 12-digit Aadhaar-like run (hex digests pass)."""
    text = json.dumps(obj, ensure_ascii=False)
    for rx, what in ((_RAW_PAN, "PAN"), (_RAW_AADHAAR, "Aadhaar")):
        m = rx.search(text)
        if m and not m.group(0).startswith("XXXXX"):
            raise ValueError(f"raw {what}-like identifier in seed data")


def load_applicants(data_dir: str | Path) -> list[dict]:
    p = Path(data_dir) / "applicants.jsonl"
    return [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]


def seed_row(rec: dict) -> dict:
    if rec.get("synthetic") is not True:
        raise ValueError("refusing a record that is not marked synthetic")
    aid = rec["applicant_id"]
    if not _ID.match(aid):
        raise ValueError(f"unexpected applicant id {aid!r}")
    req, dec = rec["loan_request"], rec["declared"]
    product = rec.get("label", {}).get("product_id") or req.get("product_id")
    purpose = PURPOSE_LABEL.get(product) or (req.get("purpose") or "other").replace("_", " ").capitalize()
    zen_inputs = {k: v for k, v in (rec.get("zen_inputs") or {}).items()}
    row = {
        "synthetic": True,
        "applicant_id": aid,
        "application_id": rec.get("application_id"),
        "borrower_name": aid,  # Q-10 workaround: no spaces in the name the bureau request carries
        "email": rec["identity"]["email"],
        "product_id": product,
        "purpose": purpose,
        "loan_amount": req["amount"],
        "tenure_months": req["tenure_months"],
        "monthly_income": dec.get("monthly_net_income"),
        "monthly_obligations": dec.get("monthly_obligations"),
        "employment_months": dec.get("months_with_current_employer"),
        "credit_score": ((rec.get("zen_data_points") or {}).get("credit_score") or {}).get("value"),
        "expected": (rec.get("label") or {}).get("expected_path"),
        "over_cap": req["amount"] > PRODUCT_CAP,
        "documents": list((rec.get("documents") or {}).get("submitted") or []),
        "zen_inputs": zen_inputs,
        "bank": rec.get("bank_ref") or {},
        "bureau_report_id": (rec.get("bureau_link") or {}).get("report_id"),
    }
    assert_no_raw_ids(row)
    return row


def build_plan(records: list[dict], limit_ids: list[str] | None = None) -> list[dict]:
    by_id = {r["applicant_id"]: r for r in records}
    if limit_ids:
        order = [i for i in limit_ids if i in by_id]
    else:
        order = [i for i in DEMO_IDS if i in by_id] + sorted(i for i in by_id if i not in DEMO_IDS)
    return [seed_row(by_id[i]) for i in dict.fromkeys(order)]


def rekey_bureau_fixture(fixture: dict, mapping: dict[str, str]) -> dict:
    """Key each case by the Frappe Loan Application name (the id the pipeline sends the bureau)."""
    out = []
    for case in fixture.get("cases", []):
        aid = (case.get("application") or {}).get("applicant_id")
        name = mapping.get(aid)
        if not name:
            continue
        c = copy.deepcopy(case)
        for key in ("application", "request", "report"):
            if isinstance(c.get(key), dict):
                c[key]["application_id"] = name
        out.append(c)
    return {"schema": "bureau-cases/1", "synthetic": True,
            "_warning": "SYNTHETIC. Saral cases re-keyed by Frappe application name for the ops bureau.",
            "cases": out}


if __name__ == "__main__":  # python -m ops.saral_seed.plan <data_dir> <out.json> [ids...]
    import sys

    rows = build_plan(load_applicants(sys.argv[1]), sys.argv[3:] or None)
    Path(sys.argv[2]).write_text(json.dumps(rows, ensure_ascii=False))
    print(f"{len(rows)} rows")


def rekey_cli(fixture_path: str, mapping_path: str, out_path: str) -> int:
    """python -c 'from ops.saral_seed.plan import rekey_cli; rekey_cli(fixture, mapping, out)'"""
    mapping = {aid: m["application"] for aid, m in json.loads(Path(mapping_path).read_text()).items()
               if m.get("application")}
    out = rekey_bureau_fixture(json.loads(Path(fixture_path).read_text()), mapping)
    Path(out_path).write_text(json.dumps(out, ensure_ascii=False))
    return len(out["cases"])
