"""Saral shared contracts (design track A).

Schemas only: no decision logic, no thresholds in force. Every record is synthetic.
See docs/saral/ZEN_DESIGN.md and docs/saral/THRESHOLD_APPROVALS.md.
"""
from contracts.applicant import Applicant
from contracts.bureau_report import BureauReport
from contracts.decision_trace import DecisionTrace, TraceRow
from contracts.document_extraction import DocumentExtraction, SignatureCheck
from contracts.segment import Segment, SegmentAssignment
from contracts.zen import ZenInput, ZenOutput

CONTRACTS = {
    "applicant": Applicant,
    "document_extraction": DocumentExtraction,
    "signature_check": SignatureCheck,
    "bureau_report": BureauReport,
    "segment": Segment,
    "segment_assignment": SegmentAssignment,
    "zen_input": ZenInput,
    "zen_output": ZenOutput,
    "decision_trace": DecisionTrace,
}

__all__ = ["CONTRACTS", "Applicant", "BureauReport", "DecisionTrace", "DocumentExtraction",
           "Segment", "SegmentAssignment", "SignatureCheck", "TraceRow", "ZenInput", "ZenOutput"]
