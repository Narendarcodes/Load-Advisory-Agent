import pytest
from pydantic import ValidationError

from contracts.zen import DataPointName, ZenInput, ZenOutput


def test_zen_input_fixture(fx):
    z = ZenInput.model_validate(fx("zen_input_wedding_prime"))
    ctx = z.zen_context()
    assert set(DataPointName) <= {DataPointName(k) for k in ctx if k in DataPointName._value2member_map_}
    assert ctx["product_id"] == "PL_WEDDING" and ctx["segments"] == ["SALARIED_METRO", "PRIME"]
    assert z.missing_fields == []
    # FOIR includes the proposed EMI: (existing + proposed) / income
    dp = z.data_points
    expected = (dp[DataPointName.EXISTING_EMI_TOTAL].value + dp[DataPointName.PROPOSED_EMI].value) \
        / dp[DataPointName.NET_MONTHLY_INCOME].value
    assert dp[DataPointName.FOIR].value == pytest.approx(expected, abs=1e-4)


def test_every_data_point_must_be_present(fx):
    d = fx("zen_input_wedding_prime")
    del d["data_points"]["foir"]
    with pytest.raises(ValidationError, match="every catalogued data point"):
        ZenInput.model_validate(d)


def test_missing_value_is_null_with_source_none(fx):
    d = fx("zen_input_wedding_prime")
    d["data_points"]["signature_similarity"] = {"value": None, "source": "NONE"}
    assert ZenInput.model_validate(d).missing_fields == ["signature_similarity"]
    d["data_points"]["signature_similarity"] = {"value": None, "source": "SIGNATURE_CHECK"}
    with pytest.raises(ValidationError, match="NONE"):
        ZenInput.model_validate(d)


def test_ocr_value_names_its_documents_and_bureau_is_never_low_confidence(fx):
    d = fx("zen_input_wedding_prime")
    d["data_points"]["payslip_net_avg"]["source_document_ids"] = []
    with pytest.raises(ValidationError, match="documents"):
        ZenInput.model_validate(d)
    d = fx("zen_input_wedding_prime")
    d["data_points"]["credit_score"]["low_confidence"] = True
    with pytest.raises(ValidationError):
        ZenInput.model_validate(d)


def test_purpose_must_match_product(fx):
    d = fx("zen_input_wedding_prime")
    d["data_points"]["purpose"]["value"] = "medical_emergency"
    with pytest.raises(ValidationError, match="does not match"):
        ZenInput.model_validate(d)


def test_unknown_data_point_rejected(fx):
    d = fx("zen_input_wedding_prime")
    d["data_points"]["pan_number"] = {"value": "XXXXX4821X", "source": "OCR_PAN",
                                      "source_document_ids": ["SYN-DOC-PAN0101"]}
    with pytest.raises(ValidationError):
        ZenInput.model_validate(d)


def test_raw_identifier_cannot_reach_zen(fx):
    d = fx("zen_input_wedding_prime")
    d["segments"]["basis"]["PRIME"] = "score 772 for ABCPE4821F"
    with pytest.raises(ValidationError, match="full PAN or Aadhaar"):
        ZenInput.model_validate(d)


@pytest.mark.parametrize("name,decision", [("zen_output_approve_draft", "APPROVE"),
                                           ("zen_output_refer_low_confidence", "REFER"),
                                           ("zen_output_decline_writeoff", "DECLINE")])
def test_zen_output_fixtures(fx, name, decision):
    o = ZenOutput.model_validate(fx(name))
    assert o.decision.value == decision and o.not_for_live_use is True


def test_output_decision_must_match_trace(fx):
    d = fx("zen_output_decline_writeoff")
    d["decision"] = "REFER"
    with pytest.raises(ValidationError, match="disagrees"):
        ZenOutput.model_validate(d)


def test_reason_codes_must_match_trace(fx):
    d = fx("zen_output_decline_writeoff")
    d["decline_reason_codes"] = ["ERR_CREDIT_SCORE_BELOW_MINIMUM"]
    with pytest.raises(ValidationError, match="decline_reason_codes"):
        ZenOutput.model_validate(d)


def test_draft_policy_output_is_never_live(fx):
    d = fx("zen_output_approve_draft")
    d["not_for_live_use"] = False
    with pytest.raises(ValidationError, match="not_for_live_use"):
        ZenOutput.model_validate(d)
