import pytest
from pydantic import ValidationError

from contracts.document_extraction import DocumentExtraction, SignatureCheck

KINDS = ["salary_slip", "bank_statement", "pan_card", "aadhaar_card"]


@pytest.mark.parametrize("kind", KINDS)
def test_fixtures_validate(fx, kind):
    e = DocumentExtraction.model_validate(fx(f"extraction_{kind}"))
    for key, f in e.fields.items():
        assert f.source.document_id == e.document.document_id
        assert f.key == key


def test_review_flags(fx):
    bank = DocumentExtraction.model_validate(fx("extraction_bank_statement"))
    assert bank.requires_review                       # closing_balance is low confidence
    assert bank.min_confidence == 57.5
    pan = DocumentExtraction.model_validate(fx("extraction_pan_card"))
    assert not pan.requires_review


def test_full_pan_value_rejected(fx):
    d = fx("extraction_pan_card")
    d["fields"]["pan_number"]["value"] = "ABCPE4821F"
    with pytest.raises(ValidationError):
        DocumentExtraction.model_validate(d)


def test_full_aadhaar_value_rejected(fx):
    d = fx("extraction_aadhaar_card")
    d["fields"]["aadhaar_number"]["value"] = "2345 6789 7316"
    with pytest.raises(ValidationError):
        DocumentExtraction.model_validate(d)


def test_raw_number_in_a_warning_rejected(fx):
    d = fx("extraction_aadhaar_card")
    d["warnings"] = ["read 234567897316 from line 6"]
    with pytest.raises(ValidationError, match="full PAN or Aadhaar"):
        DocumentExtraction.model_validate(d)


def test_status_must_follow_confidence(fx):
    d = fx("extraction_salary_slip")
    d["fields"]["net_salary"]["ocr_confidence"] = 41.0      # still "found"
    with pytest.raises(ValidationError, match="LOW_CONFIDENCE"):
        DocumentExtraction.model_validate(d)
    d = fx("extraction_bank_statement")
    d["fields"]["closing_balance"]["ocr_confidence"] = 80.0  # "low_confidence" but high
    with pytest.raises(ValidationError):
        DocumentExtraction.model_validate(d)


def test_missing_field_carries_no_value(fx):
    d = fx("extraction_salary_slip")
    d["fields"]["total_deductions"]["value"] = 1000.0
    with pytest.raises(ValidationError, match="MISSING"):
        DocumentExtraction.model_validate(d)


def test_field_must_belong_to_document_kind(fx):
    d = fx("extraction_salary_slip")
    d["fields"]["pan_number"] = {**d["fields"]["employee_name"], "key": "pan_number", "value": "XXXXX4821X"}
    with pytest.raises(ValidationError, match="not a field"):
        DocumentExtraction.model_validate(d)


def test_source_must_be_this_document(fx):
    d = fx("extraction_salary_slip")
    d["fields"]["net_salary"]["source"]["document_id"] = "SYN-DOC-OTHER01"
    with pytest.raises(ValidationError, match="source"):
        DocumentExtraction.model_validate(d)


def test_page_within_document(fx):
    d = fx("extraction_bank_statement")
    d["fields"]["total_debits"]["source"]["page"] = 9
    with pytest.raises(ValidationError, match="page"):
        DocumentExtraction.model_validate(d)


def test_signature_check(fx):
    s = SignatureCheck.model_validate(fx("signature_check"))
    assert s.experimental is True
    bad = fx("signature_check")
    bad["similarity"] = 1.2
    with pytest.raises(ValidationError):
        SignatureCheck.model_validate(bad)
    bad = fx("signature_check")
    bad["candidate_document_id"] = bad["reference_document_id"]
    with pytest.raises(ValidationError):
        SignatureCheck.model_validate(bad)
