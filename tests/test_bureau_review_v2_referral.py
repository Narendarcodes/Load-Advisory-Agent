"""E2E 2026-11-04 (REDECIDE_V2_20261104-0233): with catalogue v2 live, bureau no-hit, thin-file and data-quality
cases ended as decision ERROR / BUREAU_REVIEW. They are referrals: MANUAL_REVIEW with a plain reason category,
and the internal DQ codes stay in the review block for the officer."""
from tests.test_bureau_lifecycle import _case, _run, client, http  # noqa: F401  (fixtures)


def _v2(monkeypatch):
    monkeypatch.setenv("SARAL_POLICY_VERSION", "synthetic-v2")


def test_no_hit_is_a_manual_review_referral_under_v2(client, monkeypatch):  # noqa: F811
    _v2(monkeypatch)
    out, sink = _run(_case("NO_HIT"), client)
    rec = out.record
    assert out.to_state == "MANUAL_REVIEW"
    assert rec["decision"] == rec["outcome"] == "MANUAL_REVIEW"
    assert rec["reason_categories"] == ["DETAILS_NOT_VERIFIED"]
    assert not rec.get("error")
    assert rec["review"]["reason_codes"] == ["DQ_BUREAU_NO_HIT"]  # officer still sees the cause
    assert "BUREAU_REVIEW" in out.flags
    assert sink.status[out.application_ref] == ("MANUAL_REVIEW", "Open")


def test_v2_info_request_from_the_bureau_gate_is_unchanged(client, monkeypatch):  # noqa: F811
    _v2(monkeypatch)
    out, _ = _run(_case("MISSING_REQUIRED_FIELDS"), client)
    assert out.to_state == "INFO_REQUESTED"
    assert out.record["decision"] == "MORE_INFORMATION_REQUIRED"


def test_v1_keeps_the_legacy_error_decision(client, monkeypatch):  # noqa: F811
    monkeypatch.delenv("SARAL_POLICY_VERSION", raising=False)
    out, _ = _run(_case("NO_HIT"), client)
    assert out.record["decision"] == "ERROR"
