"""Generate the committed 120-case synthetic bureau fixture.

The 1,000-record run is on demand and must not be committed. Staleness and
variance gates are disabled unless the approved policy config enables them.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
for p in (ROOT, ROOT / "apps" / "api" / "src", ROOT / "apps" / "bureau" / "src"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from decision_engine.bureau.gates import (  # noqa: E402
    DQ_BUREAU_REPORT_STALE,
    DQ_INCOME_OBLIGATION_INCONSISTENT,
)
from decision_engine.schemas.bureau import BureauReport  # noqa: E402
from synthetic_bureau.generator import build_cases  # noqa: E402
from synthetic_bureau.labeling import label_cases  # noqa: E402
from synthetic_bureau.scoring import score_history  # noqa: E402


def validate_cases(cases: list[dict], as_of: date) -> None:
    seen: set[str] = set()
    for case in cases:
        cid = case["case_id"]
        if cid in seen:
            raise AssertionError(f"duplicate case_id {cid}")
        seen.add(cid)
        app = case["application"]
        report_data = case.get("report")
        if report_data is None:
            if case["expected"]["outcome"] != "ERROR":
                raise AssertionError(f"{cid}: provider case must be ERROR")
            continue
        report = BureauReport.model_validate(report_data)
        if report.report_date > as_of:
            raise AssertionError(f"{cid}: report_date is after as_of")
        if report.identity.match and report.applicant_id != app["applicant_id"]:
            raise AssertionError(f"{cid}: identity match but applicant IDs differ")
        result = score_history(report.accounts, report.enquiries, as_of)
        if result.status != report.score.status or result.value != report.score.value:
            raise AssertionError(f"{cid}: score does not match history")
        if report.score.status.value == "AVAILABLE" and report.score.value is None:
            raise AssertionError(f"{cid}: available score is null")
        if report.score.status.value != "AVAILABLE" and report.score.value is not None:
            raise AssertionError(f"{cid}: unavailable score is not null")
        if case["scenario"] == "STALE_REPORT":
            if case["expected"]["outcome"] == "REVIEW":
                raise AssertionError(f"{cid}: unapproved staleness must not affect outcome")
            if DQ_BUREAU_REPORT_STALE not in case["expected"]["pending_policy_reason_codes"]:
                raise AssertionError(f"{cid}: missing pending staleness code")
        if case["scenario"] == "INCONSISTENT_INCOME_OBLIGATIONS":
            if case["expected"]["outcome"] == "REVIEW":
                raise AssertionError(f"{cid}: unapproved variance must not affect outcome")
            if DQ_INCOME_OBLIGATION_INCONSISTENT not in case["expected"]["pending_policy_reason_codes"]:
                raise AssertionError(f"{cid}: missing pending variance code")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=20261024)
    parser.add_argument("--as-of", default="2026-10-24")
    parser.add_argument("--out", required=True)
    parser.add_argument("--record-origin", default="golden_fixture")
    args = parser.parse_args()

    as_of = date.fromisoformat(args.as_of)
    cases = build_cases(
        args.count,
        seed=args.seed,
        as_of=as_of,
        record_origin=args.record_origin,
    )
    cases = label_cases(cases, as_of)
    validate_cases(cases, as_of)

    envelope = {
        "schema": "bureau-cases/1",
        "synthetic": True,
        "seed": args.seed,
        "count": args.count,
        "generation_version": "bureau-cases-v1",
        "as_of": as_of.isoformat(),
        "cases": cases,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(envelope, f, indent=2, ensure_ascii=False)
        f.write("\n")

    counts = Counter(c["scenario"] for c in cases)
    print(json.dumps({"out": str(out), "count": len(cases), "scenarios": counts}, indent=2))


if __name__ == "__main__":
    main()
