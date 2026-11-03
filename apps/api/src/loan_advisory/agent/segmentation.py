"""Customer Segmentation integration for the Loan Advisory Agent.

Segments applicants based on borrowing experience and credit indicators to establish
a persona-based communication style for explaining loan decisions.

CRITICAL PRIVACY GUARANTEE:
The segmentation response contains ONLY:
  - segment (e.g. "Guided Explanation Required")
  - how_to_explain (list of persona communication guidelines)
No sensitive personal information, demographics, or PII are exposed.
"""

import json
from pathlib import Path
from typing import Any

from decision_engine.segmentation.classifier import classify_applicant
from decision_engine.segmentation.guidance import GUIDANCE

_CANDIDATE_PATHS = [
    Path(__file__).resolve().parents[5] / "data" / "synthetic" / "demo_applicants.json",
    Path("data/synthetic/demo_applicants.json").resolve(),
    Path("demo_applicants.json").resolve(),
]


def _find_demo_path() -> Path | None:
    for p in _CANDIDATE_PATHS:
        if p.exists():
            return p
    return None


_DEMO_CACHE: dict[str, dict[str, Any]] | None = None


def _get_demo_applicants() -> dict[str, dict[str, Any]]:
    """Lazy load demo applicants indexed by applicant_id and application_id."""
    global _DEMO_CACHE
    if _DEMO_CACHE is not None:
        return _DEMO_CACHE

    _DEMO_CACHE = {}
    demo_path = _find_demo_path()
    if demo_path and demo_path.exists():
        try:
            with open(demo_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            applicants = data.get("applicants") or data.get("cases") or []
            for app in applicants:
                aid = app.get("applicant_id")
                app_ref = app.get("application_id")
                if aid:
                    _DEMO_CACHE[str(aid)] = app
                if app_ref:
                    _DEMO_CACHE[str(app_ref)] = app
        except Exception:
            pass
    return _DEMO_CACHE


def get_customer_segmentation(
    applicant_data: dict[str, Any] | None = None,
    applicant_id: str | None = None,
    application_ref: str | None = None
) -> dict[str, Any]:
    """Determine customer communication segmentation for an applicant.

    Accepts an applicant dictionary, a Decision Evidence record, or an applicant/application ID.
    Always returns a sanitized dictionary containing only 'segment' and 'how_to_explain'.
    """
    candidate: dict[str, Any] | None = None

    if isinstance(applicant_data, dict):
        # Case 1: Direct applicant object or object containing cibil_report/bureau
        if (
            "cibil_report" in applicant_data
            or "bureau_report" in applicant_data
            or "bureau" in applicant_data
            or "accounts" in applicant_data
        ):
            candidate = applicant_data
        # Case 2: Decision Evidence record with applicant_ref / application_ref
        applicant_id = applicant_id or applicant_data.get("applicant_ref") or applicant_data.get("applicant_id")
        application_ref = application_ref or applicant_data.get("application_ref") or applicant_data.get("application_id")

    # Case 3: Check demo repository if candidate report not directly found
    if candidate is None:
        demos = _get_demo_applicants()
        if applicant_id and str(applicant_id) in demos:
            candidate = demos[str(applicant_id)]
        elif application_ref and str(application_ref) in demos:
            candidate = demos[str(application_ref)]

    # Fallback to standard/guided if no report details available
    if not candidate:
        segment = "Standard Explanation Required"
        return {
            "segment": segment,
            "how_to_explain": list(GUIDANCE[segment])
        }

    return classify_applicant(candidate)


def format_persona_guidance(segmentation: dict[str, Any] | None) -> str:
    """Format segmentation guidelines into system prompt style instructions."""
    if not segmentation or not segmentation.get("segment"):
        return ""

    segment = segmentation.get("segment", "Standard Explanation Required")
    guidelines = segmentation.get("how_to_explain") or GUIDANCE.get(segment, [])

    points = " ".join(guidelines)
    return f"Communication Persona ({segment}): {points}"
