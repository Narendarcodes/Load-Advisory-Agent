"""Masking must be lossless in the safe direction: the full identifier never escapes."""

from loan_advisory_portal.ocr.masking import (
    mask_aadhaar,
    mask_account,
    mask_pan,
    redact_for_log,
    mask_sensitive_text,
)


class TestAadhaarMask:
    def test_keeps_only_the_last_four(self):
        assert mask_aadhaar("2345 6789 0123") == "XXXX XXXX 0123"
        assert mask_aadhaar("234567890123") == "XXXX XXXX 0123"

    def test_masking_is_idempotent(self):
        assert mask_aadhaar("XXXX XXXX 0123") == "XXXX XXXX 0123"

    def test_short_or_junk_input_is_fully_masked(self):
        assert mask_aadhaar("1234") == "XXXX XXXX XXXX"
        assert mask_aadhaar("") == "XXXX XXXX XXXX"
        assert mask_aadhaar("not a number") == "XXXX XXXX XXXX"


class TestPanMask:
    def test_keeps_digits_only(self):
        assert mask_pan("ABCDE1234F") == "XXXXX1234X"
        assert mask_pan("abcde1234f") == "XXXXX1234X"

    def test_masking_is_idempotent(self):
        assert mask_pan("XXXXX1234X") == "XXXXX1234X"

    def test_malformed_is_fully_masked(self):
        assert mask_pan("12345") == "XXXXXXXXXX"
        assert mask_pan("ABCD12345F") == "XXXXXXXXXX"

    def test_ocr_spacing_and_case_are_supported(self):
        assert mask_pan("abcde 1234 f") == "XXXXX1234X"


class TestAccountMask:
    def test_keeps_last_four(self):
        assert mask_account("123456789012") == "XXXXXXXX9012"

    def test_length_bounds(self):
        assert mask_account("12345678") == ""
        assert mask_account("1234567890123456789") == ""


class TestRedactForLog:
    def test_removes_both_identifiers_from_a_line(self):
        line = "PAN ABCDE1234F and Aadhaar 2345 6789 0123"
        redacted = redact_for_log(line)
        assert "ABCDE1234F" not in redacted
        assert "234567890123" not in redacted
        assert "1234X" in redacted
        assert "0123" in redacted

    def test_empty_input(self):
        assert redact_for_log("") == ""

    def test_identifiers_are_masked_inside_extracted_text_fields(self):
        result = mask_sensitive_text("Asha Rao abcde 1234 f 2345 6789 0124 9876543210")
        assert result == "Asha Rao XXXXX1234X XXXX XXXX 0124 XXXXXX3210"
        assert "abcde 1234 f" not in result
        assert "234567890124" not in result
