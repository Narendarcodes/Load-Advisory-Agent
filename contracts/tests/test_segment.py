import pytest
from pydantic import ValidationError

from contracts.segment import Segment, SegmentAssignment, SegmentId


def test_catalogue_validates_and_is_complete(fx):
    segs = [Segment.model_validate(s) for s in fx("segments_catalogue")]
    assert {s.segment_id for s in segs} == set(SegmentId)
    by = {s.segment_id: s for s in segs}
    # the only segment with no assumption is the Bajaj-sourced non-metro floor
    assert not by[SegmentId.SALARIED_NON_METRO].uses_assumptions
    metro = by[SegmentId.SALARIED_METRO].effects[0]
    assert metro.value == 40000 and metro.source_chunk == "BFL-PL-SALARIED#012"


def test_effect_must_be_tagged(fx):
    s = fx("segments_catalogue")[4]          # PRIME
    del s["effects"][0]["assumption_id"]
    with pytest.raises(ValidationError, match="assumption_id"):
        Segment.model_validate(s)
    s = fx("segments_catalogue")[0]          # SALARIED_METRO
    s["effects"][0]["source_chunk"] = None
    with pytest.raises(ValidationError, match="source_chunk"):
        Segment.model_validate(s)


def test_wrong_dimension_rejected(fx):
    s = fx("segments_catalogue")[4]
    s["dimension"] = "RELATIONSHIP"
    with pytest.raises(ValidationError):
        Segment.model_validate(s)


def test_assignment_one_per_dimension():
    ok = SegmentAssignment(applicant_id="SYN-APP-000101", segments=["SALARIED_METRO", "PRIME", "EXISTING_CUSTOMER"],
                           basis={"SALARIED_METRO": "Pune", "PRIME": "772", "EXISTING_CUSTOMER": "record flag"})
    assert len(ok.segments) == 3
    with pytest.raises(ValidationError, match="more than one CREDIT"):
        SegmentAssignment(applicant_id="SYN-APP-000101", segments=["SALARIED_METRO", "PRIME", "NEW_TO_CREDIT"],
                          basis={"SALARIED_METRO": "x", "PRIME": "x", "NEW_TO_CREDIT": "x"})
    with pytest.raises(ValidationError, match="EMPLOYMENT_GEO"):
        SegmentAssignment(applicant_id="SYN-APP-000101", segments=["PRIME"], basis={"PRIME": "x"})
    with pytest.raises(ValidationError, match="basis"):
        SegmentAssignment(applicant_id="SYN-APP-000101", segments=["SELF_EMPLOYED"], basis={})
