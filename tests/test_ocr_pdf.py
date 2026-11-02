"""PDF handling: the text layer path needs no Tesseract, so it always runs in CI."""

import io
import json
import os

import pytest
from PIL import Image, ImageDraw, ImageFont

from loan_advisory_portal.ocr import (  # noqa: E402 - after the importorskip
    DocumentKind,
    ExtractionFailed,
    UnsupportedDocument,
    extract_document,
    suggested_application_values,
)
from loan_advisory_portal.ocr.extractor import extract_lines, is_available, validate_document  # noqa: E402

if os.environ.get("TESSERACT_CMD") and not is_available():
    raise RuntimeError("TESSERACT_CMD is set, but the configured Tesseract executable is unavailable.")

requires_ocr = pytest.mark.skipif(not is_available(), reason="Tesseract is not installed on this machine")


def make_text_pdf(lines: list[str], page_size: tuple[int, int] = (612, 792)) -> bytes:
    """Build a minimal one-page PDF with a real text layer (no OCR needed to read it)."""
    stream_lines = ["BT", "/F1 12 Tf", "16 TL", "72 720 Td"]
    for line in lines:
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        stream_lines.append(f"({escaped}) Tj T*")
    stream_lines.append("ET")
    stream = "\n".join(stream_lines).encode("cp1252", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_size[0]} {page_size[1]}] ".encode()
            +
            b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode()
    return bytes(out)


SALARY_PDF = make_text_pdf(
    [
        "ACME TECHNOLOGIES PVT LTD",
        "Employee Name: Asha Rao",
        "Employee ID: ACME-0091",
        "Pay Period: March 2026",
        "Basic Salary: 60000.00",
        "Gross Salary: 100000.00",
        "Total Deductions: 18500.00",
        "Net Salary: 81500.00",
        "Pay Date: 31/03/2026",
    ]
)


def make_scanned_pdf(lines: list[str]) -> bytes:
    """Build an image-only PDF page with synthetic text, without writing a fixture file."""
    image = Image.new("RGB", (1500, 700), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.load_default(size=40)
    except TypeError:  # Pillow < 10.1
        font = ImageFont.load_default()
    for index, line in enumerate(lines):
        draw.text((40, 30 + index * 78), line, fill="black", font=font)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95)
    image.close()
    jpeg = buffer.getvalue()
    content = b"q\n540 0 0 252 36 270 cm\n/Im0 Do\nQ\n"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"
        ),
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"endstream",
        (
            b"<< /Type /XObject /Subtype /Image /Width 1500 /Height 700 "
            b"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "
            + str(len(jpeg)).encode()
            + b" >>\nstream\n"
            + jpeg
            + b"\nendstream"
        ),
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode()
    return bytes(out)


class TestTextLayer:
    def test_validation_accepts_it(self):
        assert validate_document(SALARY_PDF, "slip.pdf") == ".pdf"

    def test_reads_lines_without_ocr(self):
        lines, pages, used_text_layer = extract_lines(SALARY_PDF, "slip.pdf")
        assert pages == 1
        assert used_text_layer is True
        assert any("Gross Salary" in line.text for line in lines)
        assert all(line.confidence == 100.0 for line in lines)

    def test_pipeline_parses_the_text_layer(self):
        result = extract_document("Salary Slip", SALARY_PDF, "slip.pdf")
        assert result.kind is DocumentKind.SALARY_SLIP
        assert result.used_text_layer is True
        assert result.fields["net_salary"].value == 81500.0
        assert result.fields["gross_salary"].value == 100000.0
        assert result.fields["employee_name"].value == "Asha Rao"
        assert not result.requires_review
        assert result.engine_version  # a version, or "text layer only" without Tesseract

    def test_suggests_the_existing_underwriting_field_without_writing_it(self):
        result = extract_document("Salary Slip", SALARY_PDF, "slip.pdf")
        suggestions = suggested_application_values(result)
        assert suggestions["custom_monthly_income"]["value"] == 81500.0
        assert suggestions["custom_monthly_income"]["source"] == "net_salary"
        # Nothing else is offered, and the result itself carries no application writes.
        assert set(suggestions) == {"custom_monthly_income"}

    def test_result_json_carries_no_raw_text(self):
        payload = json.dumps(extract_document("Salary Slip", SALARY_PDF, "slip.pdf").as_dict())
        assert "Gross Salary: 100000.00" not in payload
        assert "ACME-0091" not in payload  # an unparsed line stays inside the extractor

    def test_pan_is_masked_end_to_end(self):
        # The label says PAN, and the text layer carries the number.
        content = make_text_pdf(["INCOME TAX DEPARTMENT", "Name: ASHA RAO", "ABCDE1234F"])
        result = extract_document("PAN Card", content, "pan.pdf")
        assert result.fields["pan_number"].value == "XXXXX1234X"
        assert "ABCDE1234F" not in json.dumps(result.as_dict())

    def test_unknown_document_returns_no_fields(self):
        content = make_text_pdf(["A plain letter with nothing financial in it", "Sincerely, A Person"])
        result = extract_document("Other", content, "letter.pdf")
        assert result.kind is DocumentKind.UNKNOWN
        assert result.fields == {}
        assert result.requires_review
        assert any("could not be matched" in warning for warning in result.warnings)

    def test_truncated_pdf_is_a_document_error(self):
        with pytest.raises(ExtractionFailed):
            extract_document("Salary Slip", b"%PDF-1.7\nnot really a pdf", "broken.pdf")

    def test_oversized_pdf_page_is_rejected_before_rendering(self):
        with pytest.raises(UnsupportedDocument, match="too large"):
            extract_document(
                "Salary Slip",
                make_text_pdf([], page_size=(10_000, 10_000)),
                "oversized.pdf",
            )

    @requires_ocr
    def test_scanned_pdf_uses_tesseract_and_masks_pan(self):
        salary = extract_document(
            "Salary Slip",
            make_scanned_pdf(
                [
                    "ACME TECHNOLOGIES PVT LTD",
                    "Employee Name: Asha Rao",
                    "Pay Period: March 2026",
                    "Basic Salary: 60000.00",
                    "Gross Salary: 100000.00",
                    "Total Deductions: 18500.00",
                    "Net Salary: 81500.00",
                    "Pay Date: 31/03/2026",
                ]
            ),
            "synthetic-salary.pdf",
        )
        assert salary.kind is DocumentKind.SALARY_SLIP
        assert salary.used_text_layer is False
        assert salary.fields["gross_salary"].value == 100000.0
        assert salary.fields["net_salary"].value == 81500.0
        assert salary.fields["net_salary"].confidence is not None
        assert not salary.requires_review

        pan = extract_document(
            "PAN Card",
            make_scanned_pdf(["INCOME TAX DEPARTMENT", "Name: ASHA RAO", "ABCDE1234F"]),
            "synthetic-pan.pdf",
        )
        payload = json.dumps(pan.as_dict())
        assert pan.kind is DocumentKind.PAN_CARD
        assert pan.fields["pan_number"].value == "XXXXX1234X"
        assert "ABCDE1234F" not in payload
        assert pan.engine_version.startswith("5.")

    @requires_ocr
    def test_pdf_without_a_text_layer_is_not_reported_as_empty(self):
        """A blank page has no text layer, so it falls through to OCR/empty handling."""
        content = make_text_pdf([])
        with pytest.raises(ExtractionFailed):
            extract_document("Salary Slip", content, "blank.pdf")
