"""Explanation tone for the advisory agent (builds on PR #43's customer segmentation).

The tone is picked from the synthetic bureau record passed in (``bureau-report/1``) and
only changes HOW the reply is written. It never changes the decision, the decision card,
the improvement plan, the what-if result or which facts reach the model.

Privacy: the segmentation is ``{"segment", "how_to_explain"}`` only. It lives in the
agent's state, is never put on the API response, and its label never reaches the prompt:
the prompt gets the plain-language tone lines, nothing else.
"""
from __future__ import annotations

from typing import Any

from decision_engine.segmentation import BUREAU_SCHEMA, GUIDANCE, classify_bureau_report

_TONE_FOOTER = ("This changes only how you write, never the decision or which facts you use. "
                "Do not mention this style, and never describe the applicant as a kind of borrower.")


def bureau_report_from_record(record: dict[str, Any] | None) -> dict[str, Any] | None:
    """The bureau-report/1 record attached to a decision-evidence record, if any."""
    if not isinstance(record, dict):
        return None
    report = record.get("bureau_report")
    if isinstance(report, dict) and report.get("schema_version") == BUREAU_SCHEMA:
        return report
    return None


def get_customer_segmentation(bureau_report: dict[str, Any] | None) -> dict[str, Any] | None:
    """Tone for this bureau record, or None when no bureau-report/1 record was passed in.

    There is no lookup by applicant or application id: the caller passes the record.
    """
    if not isinstance(bureau_report, dict) or bureau_report.get("schema_version") != BUREAU_SCHEMA:
        return None
    return classify_bureau_report(bureau_report)


def tone_instruction(segmentation: dict[str, Any] | None) -> str:
    """Plain-language tone lines for the prompt (the label itself is left out)."""
    seg = (segmentation or {}).get("segment")
    if seg not in GUIDANCE:
        return ""
    return "How to explain: " + " ".join(GUIDANCE[seg]) + " " + _TONE_FOOTER


def with_tone(base_style: str, segmentation: dict[str, Any] | None) -> str:
    """Prefix the plain-language prompt style with the tone; unchanged when there is none."""
    tone = tone_instruction(segmentation)
    return f"{tone} {base_style}" if tone else base_style
