import pytest
from pydantic import ValidationError

from contracts.applicant import Applicant


def test_fixtures_validate(fx):
    a = Applicant.model_validate(fx("applicant_salaried_metro"))
    assert a.pan_masked == "XXXXX4821X" and a.aadhaar_last4 == "7316"
    assert a.marker.synthetic is True
    assert a.age_on(a.created_at.date()) == 31
    Applicant.model_validate(fx("applicant_self_employed"))


@pytest.mark.parametrize("pan", ["ABCPE1234F", "abcpe1234f", "XXXXX12345", "XXXX1234X"])
def test_unmasked_or_malformed_pan_rejected(fx, pan):
    d = fx("applicant_salaried_metro")
    d["pan_masked"] = pan
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)


@pytest.mark.parametrize("aadhaar", ["123456789012", "1234 5678 9012", "73161", "XXXX XXXX 7316"])
def test_aadhaar_is_last4_only(fx, aadhaar):
    d = fx("applicant_salaried_metro")
    d["aadhaar_last4"] = aadhaar
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)


@pytest.mark.parametrize("smuggled", ["Ananya ABCPE1234F Rao", "Ananya 1234 5678 9012"])
def test_raw_identifier_anywhere_is_rejected(fx, smuggled):
    d = fx("applicant_salaried_metro")
    d["full_name"] = smuggled
    with pytest.raises(ValidationError, match="full PAN or Aadhaar"):
        Applicant.model_validate(d)


def test_extra_keys_rejected(fx):
    d = fx("applicant_salaried_metro")
    d["aadhaar_number"] = "XXXX XXXX 7316"
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)


def test_ids_must_be_synthetic(fx):
    d = fx("applicant_salaried_metro")
    d["applicant_id"] = "APP-000101"
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)


def test_bureau_snapshot_needs_consent(fx):
    d = fx("applicant_salaried_metro")
    d["consents"]["bureau_pull_at"] = None
    with pytest.raises(ValidationError, match="consent"):
        Applicant.model_validate(d)
    d = fx("applicant_salaried_metro")
    d["consents"]["bureau_pull_at"] = "2026-11-03T16:30:00Z"   # after the fetch
    with pytest.raises(ValidationError, match="before consent"):
        Applicant.model_validate(d)


def test_employment_type_and_category_agree(fx):
    d = fx("applicant_self_employed")
    d["employer_category"] = "PRIVATE"
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)
    d = fx("applicant_salaried_metro")
    d["employer_category"] = "NOT_APPLICABLE"
    with pytest.raises(ValidationError):
        Applicant.model_validate(d)
