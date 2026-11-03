"""Upload validation and, when Tesseract is installed, end-to-end image OCR."""

import os
import tempfile

import pytest
from PIL import Image, ImageDraw, ImageFont

from loan_advisory_portal.ocr.extractor import (
    ALLOWED_EXTENSIONS,
    MAX_BYTES,
    ExtractionFailed,
    OcrUnavailable,
    UnsupportedDocument,
    extension_of,
    is_available,
    tesseract_version,
    validate_document,
)

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"0" * 64
PDF = b"%PDF-1.7\n" + b"0" * 64

if os.environ.get("TESSERACT_CMD") and not is_available():
    raise RuntimeError("TESSERACT_CMD is set, but the configured Tesseract executable is unavailable.")

requires_ocr = pytest.mark.skipif(not is_available(), reason="Tesseract is not installed on this machine")


class TestValidateDocument:
    def test_accepts_the_three_allowed_formats(self):
        assert validate_document(PNG, "slip.png") == ".png"
        assert validate_document(JPEG, "slip.JPG") == ".jpg"
        assert validate_document(JPEG, "slip.jpeg") == ".jpeg"
        assert validate_document(PDF, "slip.pdf") == ".pdf"
        assert ALLOWED_EXTENSIONS == {".pdf", ".jpg", ".jpeg", ".png"}

    def test_rejects_unknown_extension(self):
        with pytest.raises(UnsupportedDocument):
            validate_document(b"hello", "notes.txt")

    def test_rejects_a_renamed_executable(self):
        with pytest.raises(UnsupportedDocument):
            validate_document(b"MZ\x90\x00", "statement.pdf")

    def test_rejects_empty_file(self):
        with pytest.raises(ExtractionFailed):
            validate_document(b"", "slip.png")

    def test_rejects_oversize_file(self):
        oversized = PNG + b"0" * (MAX_BYTES + 1)
        with pytest.raises(UnsupportedDocument):
            validate_document(oversized, "slip.png")

    def test_a_traversal_looking_name_is_only_used_for_its_extension(self):
        assert extension_of("..\\..\\windows\\system32\\x.png") == ".png"
        assert validate_document(PNG, "..\\..\\x.png") == ".png"


def _slip_png() -> bytes:
    lines = [
        "ACME TECHNOLOGIES PVT LTD",
        "Employee Name: Asha Rao",
        "Pay Period: March 2026",
        "Basic Salary: 60000.00",
        "Gross Salary: 100000.00",
        "Total Deductions: 18500.00",
        "Net Salary: 81500.00",
        "Pay Date: 31/03/2026",
    ]
    try:
        font = ImageFont.load_default(size=40)
    except TypeError:  # Pillow < 10.1
        font = ImageFont.load_default()

    image = Image.new("RGB", (1500, 700), "white")
    draw = ImageDraw.Draw(image)
    for index, line in enumerate(lines):
        draw.text((40, 30 + index * 78), line, fill="black", font=font)

    from io import BytesIO

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@requires_ocr
class TestEndToEndImage:
    def test_reads_a_synthetic_salary_slip(self):
        from loan_advisory_portal.ocr import extract_document

        content = _slip_png()
        result = extract_document("Salary Slip", content, "slip.png")

        assert result.engine == "tesseract"
        assert result.engine_version == tesseract_version()
        assert result.pages == 1
        assert result.used_text_layer is False
        assert result.fields["gross_salary"].value == 100000.0
        assert result.fields["net_salary"].value == 81500.0
        assert result.fields["total_deductions"].value == 18500.0
        assert result.fields["basic_salary"].value == 60000.0
        assert result.fields["employee_name"].value == "Asha Rao"
        assert result.fields["salary_date"].value == "2026-03-31"
        assert not result.requires_review

    def test_a_blank_image_is_an_error_not_an_empty_result(self):
        Image = pytest.importorskip("PIL.Image")
        from io import BytesIO

        from loan_advisory_portal.ocr import extract_document, ExtractionFailed

        buffer = BytesIO()
        Image.new("RGB", (900, 500), "white").save(buffer, format="PNG")
        with pytest.raises(ExtractionFailed):
            extract_document("Salary Slip", buffer.getvalue(), "blank.png")

    def test_extraction_leaves_no_files_in_the_temp_directory(self, tmp_path, monkeypatch):
        scratch = tmp_path / "scratch"
        scratch.mkdir()
        monkeypatch.setenv("TMP", str(scratch))
        monkeypatch.setenv("TEMP", str(scratch))
        monkeypatch.setattr(tempfile, "tempdir", str(scratch))

        from loan_advisory_portal.ocr import extract_document

        extract_document("Salary Slip", _slip_png(), "slip.png")

        assert os.listdir(scratch) == []

    def test_tesseract_can_be_probed(self):
        assert is_available() is True


class TestMissingBinary:
    def test_missing_binary_reports_unavailable(self, monkeypatch):
        import loan_advisory_portal.ocr.extractor as extractor

        monkeypatch.setenv("TESSERACT_CMD", r"C:\does\not\exist\tesseract.exe")
        extractor.tesseract_command.cache_clear()
        try:
            with pytest.raises(OcrUnavailable):
                extractor.tesseract_command()
        finally:
            extractor.tesseract_command.cache_clear()

    def test_extraction_reports_missing_binary(self, monkeypatch):
        import loan_advisory_portal.ocr.extractor as extractor
        from loan_advisory_portal.ocr import extract_document

        monkeypatch.setenv("TESSERACT_CMD", r"C:\does\not\exist\tesseract.exe")
        extractor.tesseract_command.cache_clear()
        try:
            with pytest.raises(OcrUnavailable, match="TESSERACT_CMD"):
                extract_document("Salary Slip", _slip_png(), "slip.png")
        finally:
            extractor.tesseract_command.cache_clear()


def test_oversized_image_is_rejected_before_decode(monkeypatch):
    import loan_advisory_portal.ocr.extractor as extractor

    class OversizedImage:
        size = (10_000, 10_000)
        mode = "RGB"
        loaded = False
        closed = False

        def load(self):
            self.loaded = True

        def close(self):
            self.closed = True

    image = OversizedImage()

    class FakeImageModule:
        DecompressionBombError = Image.DecompressionBombError

        @staticmethod
        def open(_):
            return image

    monkeypatch.setattr(
        extractor,
        "_pillow",
        lambda: (FakeImageModule, Image.UnidentifiedImageError),
    )
    with pytest.raises(UnsupportedDocument, match="too large"):
        extractor._load_image(b"not decoded")
    assert image.loaded is False
    assert image.closed is True
