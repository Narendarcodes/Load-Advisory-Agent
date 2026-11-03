"""Unit tests for the experimental Paddle adapter helpers, field checks and fallback chain.

No PaddleOCR or Tesseract is needed: OCR is replaced by fixed synthetic lines.
"""

import sys
from datetime import date
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal"))

from loan_advisory_portal.ocr import chain  # noqa: E402
from loan_advisory_portal.ocr.document_parser import parse  # noqa: E402
from loan_advisory_portal.ocr.field_checks import (  # noqa: E402
    aadhaar_ok,
    apply_field_checks,
    check_raw_identifiers,
    pan_ok,
)
from loan_advisory_portal.ocr.paddle_engine import group_boxes_into_lines  # noqa: E402
from loan_advisory_portal.ocr.schemas import ExtractionResult, FieldStatus, TextLine  # noqa: E402


def test_boxes_on_one_row_become_one_line_left_to_right():
    boxes = [(400, 100, 520, 128), (70, 102, 200, 130), (680, 99, 800, 127)]
    lines = group_boxes_into_lines(boxes, ["43,000.00", "01/07/2026", "71,415.00"], [0.99, 0.98, 0.97])
    assert [line.text for line in lines] == ["01/07/2026 43,000.00 71,415.00"]
    assert lines[0].confidence == pytest.approx(98.0)


def test_tall_watermark_box_does_not_chain_rows_together():
    boxes = [(70, 100, 200, 128), (70, 140, 200, 168), (300, 60, 700, 260)]
    lines = group_boxes_into_lines(boxes, ["row one", "row two", "SPECIMEN"], [0.99, 0.99, 0.9])
    texts = [line.text for line in lines]
    assert "row one" in texts and "row two" in texts and "SPECIMEN" in texts


def test_low_score_boxes_are_dropped():
    lines = group_boxes_into_lines([(0, 0, 10, 10)], ["福"], [0.05])
    assert lines == []


def test_pan_and_aadhaar_validators_on_synthetic_values():
    assert pan_ok("ZZBPN8663I")
    assert not pan_ok("ZZBXN8663I")  # X is not a PAN holder-type letter
    assert not pan_ok("ZZBPN866I3")
    # Exactly one check digit makes a synthetic 9999-prefixed body Verhoeff-valid.
    body = "99991234567"
    valid = [d for d in "0123456789" if aadhaar_ok(body + d)]
    assert len(valid) == 1
    assert not aadhaar_ok("099912345678")  # Aadhaar never starts with 0 or 1


def test_raw_checks_skip_masked_tokens():
    checks = check_raw_identifiers("Bank A/c: XXXXXX7452\nZZBPN8663I")
    assert [c.check for c in checks] == ["pan_regex"]
    assert checks[0].passed


def test_date_sanity_flags_future_and_underage_dob():
    lines = [TextLine("Nikhil Naidu"), TextLine("DOB: 01/01/2015"), TextLine("MALE")]
    fields, warnings, kind = parse("Aadhaar Card", lines, "\n".join(line.text for line in lines))
    result = ExtractionResult("Aadhaar Card", kind, "test", "0", 1, fields, warnings)
    checks = apply_field_checks(result, today=date(2026, 11, 3))
    assert result.fields["date_of_birth"].status is FieldStatus.INVALID
    assert any(not c.passed and c.check == "date_sanity" for c in checks)


def test_chain_falls_back_then_routes_to_manual_review(monkeypatch):
    good = [TextLine("Payslip"), TextLine("Employee Name: Diya Rao"), TextLine("Net Salary: Rs. 43,000.00")]
    bad = [TextLine("Payslip"), TextLine("Employee Name: Diya Rao")]

    def fake_run(engine, document_type, content, filename):
        lines = bad if engine == "paddle" else good
        fields, warnings, kind = parse(document_type, lines, "\n".join(line.text for line in lines))
        return chain.Attempt(engine, ExtractionResult(document_type, kind, engine, "0", 1, fields, warnings), 0.0)

    monkeypatch.setattr(chain, "_run", fake_run)
    outcome = chain.extract_document_chain("Salary Slip", b"", "x.png", engines=("paddle", "tesseract"))
    assert outcome.route == "tesseract"
    zen = outcome.zen_inputs()
    assert zen["ocr_net_salary_status"] == "found" and zen["ocr_needs_manual_review"] is False

    outcome = chain.extract_document_chain("Salary Slip", b"", "x.png", engines=("paddle",))
    assert outcome.route == "manual_review"
    assert outcome.zen_inputs()["ocr_needs_manual_review"] is True
