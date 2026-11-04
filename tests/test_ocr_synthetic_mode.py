"""OCR synthetic mode: SPECIMEN identifiers pass only when the document is flagged synthetic.

Synthetic identifiers follow docs/saral/SYNTHETIC_DATASETS.md (feat/saral-synthetic-kyc-bank):
Aadhaar 0/1-prefixed + Verhoeff, PAN ``ZZ?P?9999?``, bank code ``XSYNS`` + 6 digits.
The modes are a strict partition: normal mode rejects synthetic-looking values and synthetic
mode never accepts a real-format value. Aadhaar is kept as its last four digits only.
"""

import io
import json
import random
import re
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "loan_advisory_portal"))

from loan_advisory_portal.ocr import chain  # noqa: E402
from loan_advisory_portal.ocr.document_parser import parse  # noqa: E402
from loan_advisory_portal.ocr.field_checks import aadhaar_ok, check_raw_identifiers, pan_ok  # noqa: E402
from loan_advisory_portal.ocr.schemas import FieldStatus, TextLine  # noqa: E402
from loan_advisory_portal.ocr.synthetic import (  # noqa: E402
    SETTING,
    ifsc_valid,
    looks_synthetic_aadhaar,
    looks_synthetic_pan,
    synthetic_mode,
)
from loan_advisory_portal.ocr.validator import (  # noqa: E402
    pan_format_valid,
    verhoeff_checksum_ok,
    verhoeff_valid,
)

# Verhoeff tables, as in synthetic_data/saral_kyc_bank/ids.py, to build check digits here.
_D = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]
_P = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]]
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def with_check_digit(body: str) -> str:
    c = 0
    for i, ch in enumerate(reversed(body)):
        c = _D[c][_P[(i + 1) % 8][int(ch)]]
    return body + str(_INV[c])


def synthetic_aadhaar(rng: random.Random) -> str:
    """Same rule as the synthetic generator: first digit 0/1, Verhoeff check digit."""
    return with_check_digit(rng.choice("01") + "".join(str(rng.randint(0, 9)) for _ in range(10)))


SYN_0 = with_check_digit("01234567890")
SYN_1 = with_check_digit("18765432109")
REAL = with_check_digit("23456789012")
SYN_PAN = "ZZZPS9430U"  # SYN-APP-0001 in the synthetic sample
REAL_PAN = "ABCPE1234F"


@pytest.fixture(autouse=True)
def _setting_off(monkeypatch):
    monkeypatch.delenv(SETTING, raising=False)


def _fields(doc_type, rows, **kwargs):
    lines = [TextLine(row, 95.0) for row in rows]
    fields, warnings, kind = parse(doc_type, lines, "\n".join(rows), **kwargs)
    return fields, warnings, kind


# --------------------------------------------------------------------------- validators

def test_fixture_numbers_are_checksum_valid():
    assert all(verhoeff_checksum_ok(n) for n in (SYN_0, SYN_1, REAL))
    assert SYN_0[0] == "0" and SYN_1[0] == "1" and REAL[0] == "2"


def test_normal_mode_rejects_synthetic_aadhaar_and_accepts_real_format():
    assert not verhoeff_valid(SYN_0)
    assert not verhoeff_valid(SYN_1, synthetic=False)
    assert verhoeff_valid(REAL)
    assert aadhaar_ok(REAL) and not aadhaar_ok(SYN_0)


def test_synthetic_mode_accepts_0_1_prefixed_verhoeff_valid_aadhaar():
    rng = random.Random(7)
    for number in [SYN_0, SYN_1] + [synthetic_aadhaar(rng) for _ in range(25)]:
        assert verhoeff_valid(number, synthetic=True), number
        assert aadhaar_ok(f"{number[:4]} {number[4:8]} {number[8:]}", synthetic=True)


def test_synthetic_mode_never_accepts_real_format_aadhaar():
    assert not verhoeff_valid(REAL, synthetic=True)
    assert not aadhaar_ok(REAL, synthetic=True)


def test_synthetic_mode_still_enforces_the_checksum():
    broken = SYN_1[:-1] + str((int(SYN_1[-1]) + 1) % 10)
    assert not verhoeff_valid(broken, synthetic=True)
    assert not verhoeff_valid(SYN_1[:-1], synthetic=True)  # 11 digits


def test_pan_partition():
    assert pan_format_valid(REAL_PAN) and not pan_format_valid(SYN_PAN)
    assert pan_format_valid(SYN_PAN, synthetic=True) and not pan_format_valid(REAL_PAN, synthetic=True)
    assert pan_ok(SYN_PAN, synthetic=True) and not pan_ok(SYN_PAN)
    # Synthetic mode wants the generator's exact shape: ZZ + letter + P + letter + 4 digits + letter.
    assert not pan_format_valid("ZZZCS9430U", synthetic=True)
    assert looks_synthetic_pan(SYN_PAN) and not looks_synthetic_pan(REAL_PAN)


def test_ifsc_partition():
    assert ifsc_valid("XSYNS123456", synthetic=True)
    assert not ifsc_valid("XSYNS123456")
    assert ifsc_valid("HDFC0001234")
    assert not ifsc_valid("HDFC0001234", synthetic=True)


def test_setting_turns_synthetic_mode_on(monkeypatch):
    assert synthetic_mode() is False and synthetic_mode(True) is True
    monkeypatch.setenv(SETTING, "true")
    assert synthetic_mode() is True
    assert verhoeff_valid(SYN_0) and not verhoeff_valid(REAL)
    monkeypatch.setenv(SETTING, "0")
    assert synthetic_mode() is False


def test_looks_synthetic_aadhaar():
    assert looks_synthetic_aadhaar(SYN_0) and not looks_synthetic_aadhaar(REAL)


# --------------------------------------------------------------------------- raw checks

def test_raw_checks_follow_the_mode():
    text = f"PAN {SYN_PAN}\n{SYN_1[:4]} {SYN_1[4:8]} {SYN_1[8:]}\nIFSC XSYNS004521"
    normal = {c.check: c for c in check_raw_identifiers(text)}
    synthetic = {c.check: c for c in check_raw_identifiers(text, synthetic=True)}
    assert not normal["pan_regex"].passed and "synthetic" in normal["pan_regex"].note
    assert not normal["aadhaar_verhoeff"].passed and "0 or 1" in normal["aadhaar_verhoeff"].note
    assert not normal["ifsc_format"].passed
    assert all(c.passed for c in synthetic.values())


def test_raw_checks_reject_real_values_on_a_synthetic_document():
    text = f"PAN {REAL_PAN}\n{REAL}\nIFSC HDFC0001234"
    checks = check_raw_identifiers(text, synthetic=True)
    assert {c.check for c in checks} == {"pan_regex", "aadhaar_verhoeff", "ifsc_format"}
    assert not any(c.passed for c in checks)


# --------------------------------------------------------------------------- parser

def test_aadhaar_card_synthetic_flag_accepts_and_keeps_last4_only():
    spaced = f"{SYN_1[:4]} {SYN_1[4:8]} {SYN_1[8:]}"
    rows = ["SYNTHETIC ID SPECIMEN (NOT AN AADHAAR)", "Name: Imran Sharma", "DOB: 21/09/1990", "MALE", spaced]
    fields, _, _ = _fields("Aadhaar Card", rows, synthetic=True)
    item = fields["aadhaar_number"]
    assert item.status is FieldStatus.FOUND
    assert item.value == f"XXXX XXXX {SYN_1[-4:]}"
    assert len(re.sub(r"\D", "", item.value)) == 4
    payload = json.dumps({k: v.as_dict() for k, v in fields.items()})
    assert SYN_1 not in payload and SYN_1[:8] not in payload and spaced not in payload


def test_aadhaar_card_unflagged_rejects_synthetic_number():
    fields, _, _ = _fields("Aadhaar Card", ["Government of India", SYN_0])
    item = fields["aadhaar_number"]
    assert item.status is FieldStatus.INVALID and item.value is None
    assert "synthetic" in item.note


def test_aadhaar_card_flagged_rejects_real_format_number():
    fields, _, _ = _fields("Aadhaar Card", ["Government of India", REAL], synthetic=True)
    item = fields["aadhaar_number"]
    assert item.status is FieldStatus.INVALID and item.value is None
    assert "real-format" in item.note


def test_bad_checksum_note_wins_in_both_modes():
    broken = SYN_0[:-1] + str((int(SYN_0[-1]) + 1) % 10)
    for flag in (False, True):
        fields, _, _ = _fields("Aadhaar Card", ["Government of India", broken], synthetic=flag)
        assert "checksum" in fields["aadhaar_number"].note


def test_masked_aadhaar_card_keeps_the_last4():
    fields, warnings, _ = _fields("Aadhaar Card", ["SYNTHETIC ID SPECIMEN (NOT AN AADHAAR)", "XXXX-XXXX-0106"])
    assert fields["aadhaar_number"].value == "XXXX XXXX 0106"
    assert fields["aadhaar_number"].status is FieldStatus.FOUND
    assert "cannot be verified" in fields["aadhaar_number"].note
    assert not any("No Aadhaar number" in w for w in warnings)


def test_pan_card_partition_in_parser():
    rows = ["SYNTHETIC TAX ID SPECIMEN (NOT A PAN CARD)", "Name: IMRAN SHARMA", SYN_PAN]
    flagged, _, _ = _fields("PAN Card", rows, synthetic=True)
    assert flagged["pan_number"].status is FieldStatus.FOUND
    assert flagged["pan_number"].value == "XXXXX9430X"
    normal, _, _ = _fields("PAN Card", rows)
    assert normal["pan_number"].status is FieldStatus.INVALID and normal["pan_number"].value is None
    real_on_synthetic, _, _ = _fields("PAN Card", ["INCOME TAX DEPARTMENT", REAL_PAN], synthetic=True)
    assert real_on_synthetic["pan_number"].status is FieldStatus.INVALID


def test_real_documents_unchanged_in_normal_mode():
    fields, _, _ = _fields("PAN Card", ["INCOME TAX DEPARTMENT", "Name: ASHA RAO", REAL_PAN])
    assert fields["pan_number"].status is FieldStatus.FOUND
    fields, _, _ = _fields("Aadhaar Card", ["Government of India", REAL])
    assert fields["aadhaar_number"].value == f"XXXX XXXX {REAL[-4:]}"


def test_chain_passes_the_flag_through(monkeypatch):
    rows = ["SYNTHETIC TAX ID SPECIMEN", "Name: IMRAN SHARMA", "Date of Birth: 21/09/1990", SYN_PAN]
    lines = [TextLine(r, 96.0) for r in rows]
    monkeypatch.setattr(chain, "extract_lines", lambda content, filename: (lines, 1, False))
    monkeypatch.setattr(chain, "tesseract_version", lambda: "test")
    flagged = chain.extract_document_chain("PAN Card", b"", "pan.png", engines=("tesseract",), synthetic=True)
    assert flagged.route == "tesseract"
    assert flagged.result.fields["pan_number"].status is FieldStatus.FOUND
    normal = chain.extract_document_chain("PAN Card", b"", "pan.png", engines=("tesseract",))
    assert normal.route == "manual_review"
    assert normal.result.fields["pan_number"].status is FieldStatus.INVALID


# --------------------------------------------------------------------------- rendered specimens

_needs_tesseract = pytest.mark.skipif(shutil.which("tesseract") is None, reason="tesseract not installed")


def _render(rows: list[str]) -> bytes:
    """A plain SPECIMEN card in the generator's banner style (red frame + corner banner)."""
    pytest.importorskip("PIL")
    from PIL import Image, ImageDraw, ImageFont  # noqa: PLC0415

    def font(size, mono=False):
        name = "DejaVuSansMono-Bold.ttf" if mono else "DejaVuSans.ttf"
        for folder in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/dejavu", "/usr/share/fonts/TTF"):
            path = Path(folder) / name
            if path.is_file():
                return ImageFont.truetype(str(path), size)
        return ImageFont.load_default()

    img = Image.new("RGB", (1012, 120 + 70 * len(rows)), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, 1007, img.height - 5], outline=(200, 30, 30), width=4)
    d.rectangle([712, 10, 1000, 46], fill=(200, 30, 30))
    d.text((722, 16), "SPECIMEN - SYNTHETIC", font=font(20), fill="white")
    for i, row in enumerate(rows):
        mono = bool(re.search(r"\d{4} \d{4} \d{4}|[A-Z]{5}\d{4}[A-Z]", row))
        d.text((40, 80 + 70 * i), row, font=font(40 if mono else 30, mono), fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@_needs_tesseract
@pytest.mark.parametrize("seed", [1, 2, 3])
def test_rendered_synthetic_aadhaar_specimens(seed):
    from loan_advisory_portal.ocr.pipeline import extract_document  # noqa: PLC0415

    number = synthetic_aadhaar(random.Random(seed))
    content = _render(["Government of India", "Name: Imran Sharma", "DOB: 21/09/1990", "MALE",
                       f"{number[:4]} {number[4:8]} {number[8:]}"])
    flagged = extract_document("Aadhaar Card", content, "aadhaar.png", synthetic=True)
    normal = extract_document("Aadhaar Card", content, "aadhaar.png")
    item = flagged.fields["aadhaar_number"]
    assert item.status in (FieldStatus.FOUND, FieldStatus.LOW_CONFIDENCE), item.note
    assert item.value == f"XXXX XXXX {number[-4:]}"
    assert normal.fields["aadhaar_number"].status is FieldStatus.INVALID
    for result in (flagged, normal):
        assert number not in json.dumps(result.as_dict())


@_needs_tesseract
def test_rendered_synthetic_pan_specimen():
    from loan_advisory_portal.ocr.pipeline import extract_document  # noqa: PLC0415

    content = _render(["INCOME TAX DEPARTMENT", "Name: IMRAN SHARMA", SYN_PAN])
    flagged = extract_document("PAN Card", content, "pan.png", synthetic=True)
    normal = extract_document("PAN Card", content, "pan.png")
    assert flagged.fields["pan_number"].value == "XXXXX9430X"
    assert normal.fields["pan_number"].status is FieldStatus.INVALID
    assert SYN_PAN not in json.dumps(flagged.as_dict())


SAMPLES = Path("/workspace/work/loan-qa/work/synth/docs_sample")


@_needs_tesseract
@pytest.mark.skipif(not SAMPLES.is_dir(), reason="synthetic sample images not present")
@pytest.mark.parametrize("applicant", ["SYN-APP-0001", "SYN-APP-0002", "SYN-APP-0004"])
def test_synthetic_generator_sample_pan_cards(applicant):
    """Images rendered by synthetic_data/saral_kyc_bank/render.py (feat/saral-synthetic-kyc-bank)."""
    from loan_advisory_portal.ocr.pipeline import extract_document  # noqa: PLC0415

    truth = json.loads((SAMPLES / applicant / "pan_card.json").read_text())
    content = (SAMPLES / applicant / "pan_card.png").read_bytes()
    flagged = extract_document("PAN Card", content, "pan_card.png", synthetic=truth["synthetic"])
    normal = extract_document("PAN Card", content, "pan_card.png")
    expected = "XXXXX" + truth["pan_number"][5:9] + "X"
    assert flagged.fields["pan_number"].value == expected
    assert normal.fields["pan_number"].status is FieldStatus.INVALID
    assert truth["pan_number"] not in json.dumps(flagged.as_dict())


@_needs_tesseract
@pytest.mark.skipif(not SAMPLES.is_dir(), reason="synthetic sample images not present")
def test_synthetic_generator_sample_masked_aadhaar():
    from loan_advisory_portal.ocr.pipeline import extract_document  # noqa: PLC0415

    truth = json.loads((SAMPLES / "SYN-APP-0001" / "aadhaar_card.json").read_text())
    content = (SAMPLES / "SYN-APP-0001" / "aadhaar_card.png").read_bytes()
    result = extract_document("Aadhaar Card", content, "aadhaar_card.png", synthetic=True)
    assert result.fields["aadhaar_number"].value == f"XXXX XXXX {truth['aadhaar_last4']}"
