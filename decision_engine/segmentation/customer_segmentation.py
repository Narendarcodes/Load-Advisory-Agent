"""Standalone and CLI interface for Customer Communication Segmentation.

Usage:
    python decision_engine/segmentation/customer_segmentation.py --application-id APP1001
    python decision_engine/segmentation/customer_segmentation.py --all
    python decision_engine/segmentation/customer_segmentation.py --all --data data/synthetic/demo_applicants.json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ is None or __package__ == "":
    # Add project root and decision_engine/segmentation to sys.path for direct execution
    _root = Path(__file__).resolve().parent.parent.parent
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))
    from decision_engine.segmentation.classifier import classify_applicant, derive_features
    from decision_engine.segmentation.guidance import GUIDANCE, SEGMENT_NAMES
else:
    from .classifier import classify_applicant, derive_features
    from .guidance import GUIDANCE, SEGMENT_NAMES


def load_applicants(file_path: str | Path) -> list[dict[str, Any]]:
    """Load and validate applicants from a JSON file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    applicants = data.get("applicants")
    if not isinstance(applicants, list):
        # Support cases format as fallback if applicants list isn't root
        applicants = data.get("cases")

    if not isinstance(applicants, list):
        raise ValueError("JSON must contain an applicants or cases list.")

    applicant_ids = set()
    for applicant in applicants:
        applicant_id = applicant.get("applicant_id") or applicant.get("application_id")
        if not applicant_id:
            raise ValueError("Applicant ID is missing in record.")
        if applicant_id in applicant_ids:
            raise ValueError(f"Duplicate Applicant ID: {applicant_id}")
        applicant_ids.add(applicant_id)

    return applicants


def find_applicant(applicants: list[dict[str, Any]], applicant_id: str) -> dict[str, Any] | None:
    """Find applicant by applicant_id or application_id."""
    for applicant in applicants:
        if (
            applicant.get("applicant_id") == applicant_id
            or applicant.get("application_id") == applicant_id
        ):
            return applicant
    return None


def main():
    parser = argparse.ArgumentParser(
        description="Customer Communication Segmentation for Persona-Based Loan Advisory"
    )
    parser.add_argument(
        "--application-id",
        "--applicant-id",
        dest="applicant_id",
        help="Applicant ID to segment"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Segment all applicants in the file"
    )
    parser.add_argument(
        "--data",
        default="data/synthetic/demo_applicants.json",
        help="Path to JSON data file (defaults to data/synthetic/demo_applicants.json)"
    )

    args = parser.parse_args()
    applicants = load_applicants(args.data)

    if args.all:
        results = [
            {
                "applicant_id": applicant.get("applicant_id") or applicant.get("application_id"),
                **classify_applicant(applicant)
            }
            for applicant in applicants
        ]
    else:
        applicant_id = args.applicant_id
        if not applicant_id:
            applicant_id = input("Enter Applicant ID: ").strip()

        applicant = find_applicant(applicants, applicant_id)
        if applicant is None:
            raise SystemExit(f"Applicant ID '{applicant_id}' not found.")

        results = classify_applicant(applicant)

    # Outputs only persona segment and communication guidance - zero PII.
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
