"""CLI for the explanation-tone classifier over synthetic ``bureau-report/1`` records.

Usage:
    python decision_engine/segmentation/customer_segmentation.py --reports path/to/reports.json

The file holds one bureau-report/1 record, a list of them, or ``{"cases": [{"report": ...}]}``
(the shape of data/synthetic/saral_v1/bureau_cases.json). There is no default data file.
Output per record: ``report_id`` (synthetic) plus ``segment`` and ``how_to_explain``.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ is None or __package__ == "":
    _root = Path(__file__).resolve().parent.parent.parent
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))
    from decision_engine.segmentation.classifier import BUREAU_SCHEMA, classify_bureau_report
else:
    from .classifier import BUREAU_SCHEMA, classify_bureau_report


def load_reports(file_path: str | Path) -> list[dict[str, Any]]:
    """Load bureau-report/1 records from a JSON file."""
    data = json.loads(Path(file_path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "cases" in data:
        items = [c.get("report") for c in data["cases"]]
    elif isinstance(data, list):
        items = data
    else:
        items = [data]
    reports = [r for r in items if isinstance(r, dict) and r.get("schema_version") == BUREAU_SCHEMA]
    if len(reports) != len(items):
        raise ValueError(f"every record must be a {BUREAU_SCHEMA} report")
    return reports


def main() -> None:
    parser = argparse.ArgumentParser(description="Explanation tone from a synthetic bureau-report/1 record")
    parser.add_argument("--reports", required=True, help="JSON file with bureau-report/1 record(s)")
    args = parser.parse_args()
    results = [{"report_id": r.get("report_id"), **classify_bureau_report(r)} for r in load_reports(args.reports)]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
