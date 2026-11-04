import pytest
from pydantic import ValidationError

from contracts.bureau_report import BureauReport


@pytest.mark.parametrize("name", ["bureau_report_prime", "bureau_report_writeoff", "bureau_report_new_to_credit"])
def test_fixtures_validate(fx, name):
    r = BureauReport.model_validate(fx(name))
    assert r.marker.synthetic is True and r.score.type == "SYNTHETIC"


def test_aggregates_values(fx):
    prime = BureauReport.model_validate(fx("bureau_report_prime"))
    assert prime.aggregates.active_emi_total == 14000 and prime.aggregates.enquiries_6m == 1
    wo = BureauReport.model_validate(fx("bureau_report_writeoff"))
    assert wo.aggregates.writeoff_or_settlement_24m and wo.aggregates.max_dpd_24m == 90
    assert BureauReport.model_validate(fx("bureau_report_new_to_credit")).new_to_credit


@pytest.mark.parametrize("key,value", [("active_emi_total", 9999), ("enquiries_6m", 2), ("max_dpd_12m", 30),
                                       ("writeoff_or_settlement_ever", True)])
def test_aggregates_must_agree(fx, key, value):
    d = fx("bureau_report_prime")
    d["aggregates"][key] = value
    with pytest.raises(ValidationError, match="aggregates disagree"):
        BureauReport.model_validate(d)


def test_old_writeoff_is_not_in_24m_window(fx):
    d = fx("bureau_report_writeoff")
    d["tradelines"][0]["status_changed_on"] = "2023-06-30"
    d["aggregates"]["writeoff_or_settlement_24m"] = False
    r = BureauReport.model_validate(d)
    assert r.aggregates.writeoff_or_settlement_ever and not r.aggregates.writeoff_or_settlement_24m


def test_unavailable_score_is_null_not_zero(fx):
    d = fx("bureau_report_new_to_credit")
    d["score"]["value"] = 0
    with pytest.raises(ValidationError):
        BureauReport.model_validate(d)


def test_dpd_uses_provider_buckets_and_24m_covers_12m(fx):
    d = fx("bureau_report_prime")
    d["tradelines"][0]["max_dpd_12m"] = 45
    with pytest.raises(ValidationError):
        BureauReport.model_validate(d)
    d = fx("bureau_report_writeoff")
    d["tradelines"][1]["max_dpd_12m"] = 60       # 24m is 30
    with pytest.raises(ValidationError):
        BureauReport.model_validate(d)


def test_writeoff_needs_date(fx):
    d = fx("bureau_report_writeoff")
    d["tradelines"][0]["status_changed_on"] = None
    with pytest.raises(ValidationError):
        BureauReport.model_validate(d)


def test_no_hit_has_no_tradelines(fx):
    d = fx("bureau_report_new_to_credit")
    d["tradelines"] = fx("bureau_report_prime")["tradelines"][2:]   # one closed line
    with pytest.raises(ValidationError, match="NO_HIT"):
        BureauReport.model_validate(d)
