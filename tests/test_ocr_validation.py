"""Validation rules: reading a value, rejecting an implausible one, and cross-checking."""

from datetime import date

import pytest

from loan_advisory_portal.ocr.schemas import ExtractedField, FieldStatus, TextLine
from loan_advisory_portal.ocr.validator import (
    LOW_CONFIDENCE,
    MAX_AMOUNT,
    confidence_of,
    field,
    money_field,
    months_between,
    pan_format_valid,
    parse_amount,
    parse_date,
    review_amounts,
    verhoeff_valid,
)


class TestParseAmount:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Rs. 1,20,000.00", 120000.0),
            ("INR 81500", 81500.0),
            ("₹ 60,000", 60000.0),
            ("1.2 lakh", 120000.0),
            ("2 crore", 20000000.0),
            ("45k", 45000.0),
            ("81,500.00", 81500.0),
        ],
    )
    def test_reads_common_indian_formats(self, raw, expected):
        assert parse_amount(raw) == expected

    @pytest.mark.parametrize("raw", ["", "nil", "abc", "not applicable"])
    def test_unreadable_returns_none(self, raw):
        assert parse_amount(raw) is None


class TestParseDate:
    @pytest.mark.parametrize(
        "raw",
        ["31/03/2026", "31-03-2026", "31.03.2026", "2026-03-31", "31 March 2026", "31-Mar-2026"],
    )
    def test_normalises_to_iso(self, raw):
        assert parse_date(raw) == "2026-03-31"

    @pytest.mark.parametrize("raw", ["", "march", "31/13/2026", "not a date"])
    def test_rejects_impossible(self, raw):
        assert parse_date(raw) is None

    def test_february_30_is_not_a_date(self):
        assert parse_date("30/02/2026") is None


class TestMonthsBetween:
    def test_whole_months(self):
        assert months_between("2020-01-15", date(2026, 3, 14)) == 73
        assert months_between("2020-01-15", date(2026, 3, 15)) == 74

    def test_future_or_invalid_is_none(self):
        assert months_between("2030-01-01", date(2026, 3, 15)) is None
        assert months_between("not-a-date") is None


class TestChecksums:
    def test_valid_aadhaar(self):
        assert verhoeff_valid("234567890124")

    def test_bad_check_digit(self):
        assert not verhoeff_valid("234567890123")

    def test_leading_zero_or_wrong_length(self):
        assert not verhoeff_valid("034567890123")
        assert not verhoeff_valid("23456789012")

    def test_pan_format(self):
        assert pan_format_valid("ABCDE1234F")
        assert not pan_format_valid("ABCD1234F")
        # The check uppercases first, so OCR's lower-case output still validates.
        assert pan_format_valid("abcde1234f")


class TestFieldStatus:
    def test_missing_value_is_missing_not_zero(self):
        item = field("net_salary", "Net monthly salary", None)
        assert item.value is None
        assert item.status is FieldStatus.MISSING
        assert item.needs_review

    def test_low_confidence_is_flagged(self):
        item = field("net_salary", "Net", 50000, confidence=LOW_CONFIDENCE - 1)
        assert item.status is FieldStatus.LOW_CONFIDENCE
        assert item.needs_review

    def test_confident_value_is_found(self):
        item = field("net_salary", "Net", 50000, confidence=95)
        assert item.status is FieldStatus.FOUND
        assert not item.needs_review

    def test_confidence_of_line(self):
        assert confidence_of(TextLine("x", 72.44)) == 72.4
        assert confidence_of(None) is None


class TestMoneyField:
    def test_unreadable_amount_is_invalid(self):
        item = money_field("net_salary", "Net", "nil")
        assert item.value is None
        assert item.status is FieldStatus.INVALID

    def test_zero_is_below_the_minimum(self):
        item = money_field("net_salary", "Net", "0", minimum=1.0)
        assert item.status is FieldStatus.INVALID

    def test_ceiling_matches_underwriting(self):
        item = money_field("net_salary", "Net", str(MAX_AMOUNT + 1))
        assert item.status is FieldStatus.INVALID
        assert "plausible range" in (item.note or "")


class TestReviewAmounts:
    def _fields(self, **values):
        return {
            key: field(key, key, value) for key, value in values.items()
        }

    def test_consistent_slip_has_no_warnings(self):
        assert review_amounts(
            self._fields(basic_salary=60000, gross_salary=100000,
                         total_deductions=18500, net_salary=81500)
        ) == []

    def test_net_above_gross_is_invalidated(self):
        fields = self._fields(gross_salary=80000, net_salary=90000)
        warnings = review_amounts(fields)
        assert fields["net_salary"].status is FieldStatus.INVALID
        assert any("Net salary is higher" in warning for warning in warnings)

    def test_basic_above_gross_is_invalidated(self):
        fields = self._fields(basic_salary=90000, gross_salary=80000)
        review_amounts(fields)
        assert fields["basic_salary"].status is FieldStatus.INVALID

    def test_deductions_above_gross_is_invalidated(self):
        fields = self._fields(gross_salary=50000, total_deductions=60000, net_salary=10000)
        review_amounts(fields)
        assert fields["total_deductions"].status is FieldStatus.INVALID

    def test_arithmetic_mismatch_warns_but_does_not_rewrite(self):
        fields = self._fields(gross_salary=100000, total_deductions=10000, net_salary=50000)
        warnings = review_amounts(fields)
        assert any("do not add up" in warning for warning in warnings)
        assert fields["net_salary"].value == 50000

    def test_invalidated_fields_are_ignored_by_later_checks(self):
        fields = {
            "net_salary": ExtractedField("net_salary", "Net", 1, FieldStatus.INVALID, None, "bad"),
        }
        assert review_amounts(fields) == []
