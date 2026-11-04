"""PaddleOCR mobile is the default engine; Tesseract is the automatic fallback.

Also covers the prerequisites the bake-off flagged before the switch: deskew, space-tolerant
parser rules, stacked/unlabelled PAN and Aadhaar names, and the PAN date of birth.
No PaddleOCR or Tesseract is needed: OCR is replaced by fixed synthetic lines.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal"))

from loan_advisory_portal.ocr import chain, paddle_engine, pipeline, preprocess  # noqa: E402
from loan_advisory_portal.ocr.document_parser import parse  # noqa: E402
from loan_advisory_portal.ocr.extractor import ExtractionFailed, OcrUnavailable  # noqa: E402
from loan_advisory_portal.ocr.schemas import FieldStatus, TextLine  # noqa: E402

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64


def _parse(kind, texts, confidence=96.0):
    lines = [TextLine(t, confidence) for t in texts]
    return parse(kind, lines, "\n".join(texts))


# --------------------------------------------------------------------------- defaults


def test_mobile_models_are_the_default():
    assert paddle_engine.DEFAULT_DET == "PP-OCRv5_mobile_det"
    assert paddle_engine.DEFAULT_REC == "PP-OCRv5_mobile_rec"


def test_engine_order_defaults_to_paddle_then_tesseract(monkeypatch):
    monkeypatch.delenv("SARAL_OCR_ENGINES", raising=False)
    assert pipeline.engine_order() == ("paddle", "tesseract")
    monkeypatch.setenv("SARAL_OCR_ENGINES", "tesseract")
    assert pipeline.engine_order() == ("tesseract",)
    monkeypatch.setenv("SARAL_OCR_ENGINES", "paddle, bogus ,tesseract")
    assert pipeline.engine_order() == ("paddle", "tesseract")
    monkeypatch.setenv("SARAL_OCR_ENGINES", "bogus")
    assert pipeline.engine_order() == ("paddle", "tesseract")


PAN_LINES = ["INCOME TAX DEPARTMENT", "Name", "MEERA RAO", "Date of Birth", "14/01/1975",
             "Permanent Account Number", "ABCPR1234K"]


def _fake_engines(monkeypatch, paddle=None, tesseract=None):
    """paddle/tesseract: list of lines, or an exception instance to raise."""

    def make(spec):
        def run(content, filename):
            if isinstance(spec, Exception):
                raise spec
            return [TextLine(t, c) for t, c in spec], 1, False
        return run

    monkeypatch.setattr(paddle_engine, "extract_lines_paddle", make(paddle))
    monkeypatch.setattr(paddle_engine, "engine_version", lambda: "paddleocr test")
    monkeypatch.setattr(chain, "extract_lines", make(tesseract))
    monkeypatch.setattr(chain, "tesseract_version", lambda: "5.test")
    monkeypatch.delenv("SARAL_OCR_ENGINES", raising=False)


def test_paddle_is_used_when_it_reads_the_critical_fields(monkeypatch):
    _fake_engines(monkeypatch, paddle=[(t, 97.0) for t in PAN_LINES],
                  tesseract=ExtractionFailed("must not be called"))
    result = pipeline.extract_document("PAN Card", PNG, "pan.png")
    assert result.engine == "paddle"
    assert result.fields["pan_number"].value == "XXXXX1234X"
    assert result.fields["name"].value == "MEERA RAO"
    assert result.fields["date_of_birth"].value == "1975-01-14"


def test_falls_back_to_tesseract_when_paddle_is_missing(monkeypatch):
    _fake_engines(monkeypatch, paddle=OcrUnavailable("no paddle"),
                  tesseract=[(t, 91.0) for t in PAN_LINES])
    result = pipeline.extract_document("PAN Card", PNG, "pan.png")
    assert result.engine == "tesseract"
    assert result.fields["pan_number"].status is FieldStatus.FOUND


def test_falls_back_to_tesseract_when_paddle_errors(monkeypatch):
    _fake_engines(monkeypatch, paddle=ExtractionFailed("paddle crashed"),
                  tesseract=[(t, 91.0) for t in PAN_LINES])
    assert pipeline.extract_document("PAN Card", PNG, "pan.png").engine == "tesseract"


def test_falls_back_to_tesseract_when_paddle_confidence_is_low(monkeypatch):
    _fake_engines(monkeypatch, paddle=[(t, 52.0) for t in PAN_LINES],
                  tesseract=[(t, 90.0) for t in PAN_LINES])
    assert pipeline.extract_document("PAN Card", PNG, "pan.png").engine == "tesseract"


def test_confidence_gate_is_configurable(monkeypatch):
    _fake_engines(monkeypatch, paddle=[(t, 75.0) for t in PAN_LINES],
                  tesseract=[(t, 90.0) for t in PAN_LINES])
    monkeypatch.setenv("SARAL_OCR_MIN_CONFIDENCE", "80")
    assert pipeline.extract_document("PAN Card", PNG, "pan.png").engine == "tesseract"
    monkeypatch.setenv("SARAL_OCR_MIN_CONFIDENCE", "70")
    assert pipeline.extract_document("PAN Card", PNG, "pan.png").engine == "paddle"


def test_both_engines_unreadable_routes_to_review_with_plain_warning(monkeypatch):
    _fake_engines(monkeypatch, paddle=[("INCOME TAX DEPARTMENT", 90.0)],
                  tesseract=[("INCOME TAX DEPARTMENT", 90.0)])
    result = pipeline.extract_document("PAN Card", PNG, "pan.png")
    assert result.requires_review
    joined = " ".join(result.warnings).lower()
    assert "checked by a person" in joined
    assert "ocr" not in joined and "paddle" not in joined and "tesseract" not in joined


def test_missing_both_engines_raises_unavailable(monkeypatch):
    _fake_engines(monkeypatch, paddle=OcrUnavailable("x"), tesseract=OcrUnavailable("y"))
    with pytest.raises(OcrUnavailable):
        pipeline.extract_document("PAN Card", PNG, "pan.png")


def test_unreadable_by_both_raises_extraction_failed(monkeypatch):
    _fake_engines(monkeypatch, paddle=ExtractionFailed("x"), tesseract=ExtractionFailed("y"))
    with pytest.raises(ExtractionFailed):
        pipeline.extract_document("PAN Card", PNG, "pan.png")


def test_unsupported_file_is_refused_before_any_engine(monkeypatch):
    from loan_advisory_portal.ocr.extractor import UnsupportedDocument

    _fake_engines(monkeypatch, paddle=AssertionError("no"), tesseract=AssertionError("no"))
    with pytest.raises(UnsupportedDocument):
        pipeline.extract_document("PAN Card", b"MZ\x90\x00", "pan.png")


def test_default_result_never_carries_raw_text_or_full_pan(monkeypatch):
    _fake_engines(monkeypatch, paddle=[(t, 97.0) for t in PAN_LINES], tesseract=OcrUnavailable("x"))
    shape = str(pipeline.extract_document("PAN Card", PNG, "pan.png").as_dict())
    assert "ABCPR1234K" not in shape
    assert "Permanent Account Number" not in shape


def test_unknown_document_does_not_run_the_fallback(monkeypatch):
    _fake_engines(monkeypatch, paddle=[("Some unrelated notice", 95.0)],
                  tesseract=AssertionError("fallback must not run"))
    result = pipeline.extract_document("Other", PNG, "x.png")
    assert result.engine == "paddle"
    assert result.fields == {}


# --------------------------------------------------------------------------- deskew


def _tilted_page(angle):
    from PIL import Image, ImageDraw

    page = Image.new("L", (800, 600), 255)
    draw = ImageDraw.Draw(page)
    for row in range(60, 560, 40):
        draw.rectangle((60, row, 740, row + 12), fill=0)
    return page.rotate(angle, expand=True, fillcolor=255)


@pytest.mark.parametrize("angle", [-5.0, -2.5, 3.0, 6.0])
def test_deskew_estimates_the_tilt(angle):
    pytest.importorskip("numpy")
    estimate = preprocess.estimate_skew(_tilted_page(angle))
    assert estimate == pytest.approx(-angle, abs=0.6)


def test_level_page_is_returned_unchanged():
    pytest.importorskip("numpy")
    page = _tilted_page(0.0)
    assert preprocess.deskew(page) is page


def test_deskew_can_be_switched_off(monkeypatch):
    page = _tilted_page(5.0)
    monkeypatch.setenv("SARAL_OCR_DESKEW", "0")
    assert preprocess.deskew(page) is page


# --------------------------------------------------------------------------- parser prerequisites


def test_pan_stacked_labels_name_and_dob_on_next_line():
    fields, _, _ = _parse("PAN Card", PAN_LINES)
    assert fields["name"].value == "MEERA RAO"
    assert fields["date_of_birth"].value == "1975-01-14"


def test_pan_bilingual_labels():
    fields, _, _ = _parse("PAN Card", ["आयकर विभाग INCOME TAX DEPARTMENT", "नाम / Name", "KIRAN VARMA",
                                       "पिता का नाम / Father's Name", "SURESH VARMA",
                                       "जन्म की तारीख / Date of Birth", "03/11/1990", "ABCPV1234K"])
    assert fields["name"].value == "KIRAN VARMA"
    assert fields["date_of_birth"].value == "1990-11-03"


def test_pan_unlabelled_old_design_name_and_dob():
    fields, _, _ = _parse("PAN Card", ["INCOME TAX DEPARTMENT GOVT. OF INDIA", "SNEHA IYER", "MOHAN IYER",
                                       "21/06/1988", "Permanent Account Number", "ABCPI1234K", "Signature"])
    assert fields["name"].value == "SNEHA IYER"
    assert fields["date_of_birth"].value == "1988-06-21"


def test_pan_fathers_name_is_never_taken_as_the_name():
    fields, _, _ = _parse("PAN Card", ["INCOME TAX DEPARTMENT", "Father's Name", "SURESH RAO",
                                       "Date of Birth", "14/01/1975", "ABCPR1234K"])
    assert fields["name"].value != "SURESH RAO"


def test_pan_dob_with_spaces_inside_the_date():
    fields, _, _ = _parse("PAN Card", ["INCOME TAX DEPARTMENT", "Name: MEERA RAO",
                                       "Date of Birth: 14 / 01 / 1975", "ABCPR1234K"])
    assert fields["date_of_birth"].value == "1975-01-14"


def test_aadhaar_bilingual_label_with_value_on_next_line():
    fields, _, _ = _parse("Aadhaar Card", ["GOVERNMENT OF INDIA", "नाम / Name:", "Rekha Rathod",
                                           "जन्म तारीख / DOB: 09-05-2005", "Female", "2345 6789 0124"])
    assert fields["name"].value == "Rekha Rathod"
    assert fields["date_of_birth"].value == "2005-05-09"
    assert fields["gender"].value == "Female"


def test_aadhaar_unlabelled_name_above_dob():
    fields, _, _ = _parse("Aadhaar Card", ["Government of India", "Nikhil Naidu", "DOB: 01/01/1990",
                                           "MALE", "XXXX XXXX 4058"])
    assert fields["name"].value == "Nikhil Naidu"
    assert fields["aadhaar_number"].value == "XXXX XXXX 4058"


def test_aadhaar_number_with_wide_spacing_is_read_and_masked():
    from loan_advisory_portal.ocr.validator import verhoeff_checksum_ok

    body = "23456789012"
    number = next(body + d for d in "0123456789" if verhoeff_checksum_ok(body + d))
    spaced = f"{number[:4]}   {number[4:8]}   {number[8:]}"
    fields, _, _ = _parse("Aadhaar Card", ["Government of India", "Name: Arjun", "DOB: 22-07-1992", spaced])
    assert fields["aadhaar_number"].value == f"XXXX XXXX {number[-4:]}"
    assert number not in str(fields)


def test_space_tolerant_labels_on_merged_words():
    fields, _, _ = _parse("Salary Slip", ["Deccan Pixel Labs Pvt Ltd", "EmployeeName: Diya Rao",
                                          "NetPay: 48,200.00", "GrossSalary 55,000.00"])
    assert fields["employee_name"].value == "Diya Rao"
    assert fields["net_salary"].value == 48200.0
    assert fields["gross_salary"].value == 55000.0


def test_bank_salary_credit_on_merged_narration():
    fields, _, _ = _parse("Bank Statement", ["Account Holder: Diya Rao",
                                             "01/07/2026 CRSALARYDECCAN 43,000.00 71,415.00",
                                             "01/08/2026 NEFT CR-SALARY AUG 43,000.00 98,100.00"])
    assert fields["salary_credits"].value == 86000.0
    assert fields["salary_credit_months"].value == 2


@pytest.mark.parametrize("label", ["Account Holders Name", "Account Holder's Name", "Account Holder", "AccountHolder:"])
def test_bank_account_holder_label_variants(label):
    fields, _, _ = _parse("Bank Statement", [f"{label} HEALTHPLUS PHARMA LTD", "Closing Balance Rs. 94,495.02"])
    assert fields["account_holder"].value == "HEALTHPLUS PHARMA LTD"
    assert fields["closing_balance"].value == 94495.02
