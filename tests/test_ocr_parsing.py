"""Parsing rules against synthetic recognised text (no OCR, no fixture files)."""

from loan_advisory_portal.ocr.document_parser import kind_for, parse
from loan_advisory_portal.ocr.schemas import DocumentKind, FieldStatus, TextLine

SALARY_SLIP = [
    "ACME TECHNOLOGIES PVT LTD",
    "Employee Name: Asha Rao",
    "Employee ID: ACME-0091",
    "Designation: Senior Engineer",
    "Pay Period: March 2026",
    "Basic Salary: 60,000.00",
    "Gross Salary: 1,00,000.00",
    "Total Deductions: 18,500.00",
    "Net Salary: 81,500.00",
    "Pay Date: 31/03/2026",
]


def _parse(document_type, lines, confidence=100.0):
    entries = [TextLine(text, confidence) if isinstance(text, str) else text for text in lines]
    text = "\n".join(entry.text for entry in entries)
    return parse(document_type, entries, text)


def _values(fields):
    return {key: item.value for key, item in fields.items()}


class TestSalarySlip:
    def test_reads_every_advertised_field(self):
        fields, warnings, kind = _parse("Salary Slip", SALARY_SLIP)
        assert kind is DocumentKind.SALARY_SLIP
        assert _values(fields) == {
            "employee_name": "Asha Rao",
            "employer_name": "ACME TECHNOLOGIES PVT LTD",
            "pay_period": "Mar 2026",
            "salary_date": "2026-03-31",
            "basic_salary": 60000.0,
            "gross_salary": 100000.0,
            "total_deductions": 18500.0,
            "net_salary": 81500.0,
        }
        assert warnings == []

    def test_identifiers_in_other_fields_are_still_masked(self):
        fields, _, _ = _parse(
            "Salary Slip",
            ["Employee Name: Asha Rao ABCDE1234F", "Employer: ACME 2345 6789 0124"],
        )
        assert fields["employee_name"].value == "Asha Rao XXXXX1234X"
        assert fields["employer_name"].value == "ACME XXXX XXXX 0124"

    def test_missing_salary_fields_are_null_not_invented(self):
        fields, warnings, _ = _parse(
            "Salary Slip",
            ["ACME TECHNOLOGIES PVT LTD", "Employee Name: Asha Rao", "Pay Period: March 2026"],
        )
        assert fields["net_salary"].value is None
        assert fields["net_salary"].status is FieldStatus.MISSING
        assert fields["gross_salary"].value is None
        assert fields["basic_salary"].value is None
        assert fields["total_deductions"].value is None
        assert warnings == []  # nothing contradictory was read, so nothing to warn about

    def test_an_unlabelled_number_is_not_guessed_as_a_salary(self):
        fields, _, _ = _parse("Salary Slip", ["Employee Name: Asha Rao", "60000 100000 81500"])
        assert fields["basic_salary"].value is None
        assert fields["gross_salary"].value is None
        assert fields["net_salary"].value is None

    def test_wrong_numbers_are_flagged(self):
        lines = [
            "Gross Salary: 80,000.00",
            "Total Deductions: 5,000.00",
            "Net Salary: 95,000.00",
        ]
        fields, warnings, _ = _parse("Salary Slip", lines)
        assert fields["net_salary"].status is FieldStatus.INVALID
        assert any("higher than gross" in warning for warning in warnings)

    def test_low_confidence_is_reported(self):
        lines = [
            TextLine("Gross Salary: 1,00,000.00", 91.0),
            TextLine("Net Salary: 81,500.00", 42.0),
        ]
        fields, _, _ = _parse("Salary Slip", lines)
        assert fields["gross_salary"].status is FieldStatus.FOUND
        assert fields["net_salary"].status is FieldStatus.LOW_CONFIDENCE
        assert fields["net_salary"].confidence == 42.0

    def test_invalid_date_is_reported_as_unread(self):
        fields, _, _ = _parse("Salary Slip", ["Pay Date: 31/13/2026"])
        assert fields["salary_date"].value is None
        assert fields["salary_date"].note == "could not read the date"

    def test_employer_header_fallback_requires_a_company_word(self):
        fields, _, _ = _parse("Salary Slip", ["MONTHLY STATEMENT", "Net Salary: 81,500.00"])
        assert fields["employer_name"].value is None


class TestBankStatement:
    LINES = [
        "ACME BANK - STATEMENT OF ACCOUNT",
        "Account Holder: Asha Rao",
        "Account Number: 123456789012",
        "Statement Period: 01/02/2026 to 31/03/2026",
        "01/03/2026 SALARY CREDIT ACME 81,500.00 CR",
        "05/03/2026 RENT PAYMENT 22,000.00 DR",
        "01/02/2026 SALARY CREDIT ACME 80,000.00 CR",
        "Closing Balance: 1,45,000.00",
    ]

    def test_reads_balance_and_salary_credits(self):
        fields, warnings, kind = _parse("Bank Statement", self.LINES)
        assert kind is DocumentKind.BANK_STATEMENT
        assert fields["account_holder"].value == "Asha Rao"
        assert fields["statement_period"].value == "2026-02-01 to 2026-03-31"
        assert fields["closing_balance"].value == 145000.0
        assert fields["salary_credits"].value == 161500.0
        assert fields["salary_credit_months"].value == 2
        assert fields["transaction_count"].value == 3
        assert warnings == []

    def test_fewer_than_two_salary_credits_warns(self):
        fields, warnings, _ = _parse(
            "Bank Statement",
            ["Statement of Account", "01/03/2026 SALARY CREDIT ACME 81,500.00 CR"],
        )
        assert fields["salary_credits"].value == 81500.0
        assert any("Fewer than two" in warning for warning in warnings)

    def test_no_salary_line_means_missing_not_zero(self):
        fields, _, _ = _parse("Bank Statement", ["Statement of Account", "Closing Balance: 500.00"])
        assert fields["salary_credits"].value is None
        assert "no salary credit line" in (fields["salary_credits"].note or "")

    def test_derives_period_from_transaction_dates(self):
        fields, _, _ = _parse(
            "Bank Statement",
            [
                "Statement of Account",
                "01/03/2026 RENT 22,000.00 DR",
                "31/03/2026 SALARY 81,500.00 CR",
            ],
        )
        assert fields["statement_period"].value == "2026-03-01 to 2026-03-31"


class TestEmploymentLetter:
    def test_reads_tenure_and_monthly_gross(self):
        fields, warnings, kind = _parse(
            "Employment Letter",
            [
                "ACME TECHNOLOGIES PVT LTD",
                "Employee Name: Asha Rao",
                "Designation: Senior Engineer",
                "Date of Joining: 15/01/2020",
                "Gross Salary: 1,00,000.00",
            ],
        )
        assert kind is DocumentKind.EMPLOYMENT_LETTER
        assert fields["designation"].value == "Senior Engineer"
        assert fields["employment_start_date"].value == "2020-01-15"
        assert fields["employment_months"].value is not None
        assert fields["monthly_gross"].value == 100000.0
        assert warnings == []

    def test_annual_ctc_is_converted_and_labelled(self):
        fields, _, _ = _parse(
            "Employment Letter", ["Employee Name: Asha Rao", "Annual CTC: 12,00,000.00"]
        )
        assert fields["monthly_gross"].value == 100000.0
        assert fields["monthly_gross"].note == "annual figure divided by 12"

    def test_missing_start_date_warns_instead_of_guessing_tenure(self):
        fields, warnings, _ = _parse("Employment Letter", ["Employee Name: Asha Rao"])
        assert fields["employment_months"].value is None
        assert any("tenure cannot be derived" in warning for warning in warnings)


class TestIdentityDocuments:
    def test_pan_is_masked(self):
        fields, warnings, kind = _parse(
            "PAN Card", ["INCOME TAX DEPARTMENT", "Name: ASHA RAO", "ABCDE1234F"]
        )
        assert kind is DocumentKind.PAN_CARD
        assert fields["pan_number"].value == "XXXXX1234X"
        assert "masked" in (fields["pan_number"].note or "")
        assert warnings == []

    def test_malformed_pan_is_invalid(self):
        fields, _, _ = _parse("PAN Card", ["Name: ASHA RAO", "ABCD12345F"])
        assert fields["pan_number"].value is None
        assert fields["pan_number"].status is FieldStatus.INVALID

    def test_aadhaar_is_masked_and_checksummed(self):
        fields, warnings, kind = _parse(
            "Aadhaar Card",
            ["Government of India", "Name: Asha Rao", "2345 6789 0124", "DOB: 01/01/1990"],
        )
        assert kind is DocumentKind.AADHAAR_CARD
        assert fields["aadhaar_number"].value == "XXXX XXXX 0124"
        assert fields["date_of_birth"].value == "1990-01-01"
        assert warnings == []

    def test_aadhaar_with_bad_checksum_is_flagged_not_accepted(self):
        fields, _, _ = _parse("Aadhaar Card", ["Government of India", "2345 6789 0123"])
        assert fields["aadhaar_number"].value is None
        assert fields["aadhaar_number"].status is FieldStatus.INVALID
        assert "checksum" in (fields["aadhaar_number"].note or "")

    def test_no_pan_found_warns(self):
        fields, warnings, _ = _parse("PAN Card", ["INCOME TAX DEPARTMENT"])
        assert fields["pan_number"].value is None
        assert any("No PAN number" in warning for warning in warnings)


class TestClassification:
    def test_label_wins(self):
        assert kind_for("Salary Slip", "") is DocumentKind.SALARY_SLIP
        assert kind_for("Identity Proof", "Statement of Account") is DocumentKind.BANK_STATEMENT

    def test_content_is_the_fallback(self):
        assert kind_for("Identity Proof", "Government of India Aadhaar") is DocumentKind.AADHAAR_CARD
        assert kind_for("Upload", "Gross Salary 1,00,000") is DocumentKind.SALARY_SLIP

    def test_unknown_stays_unknown(self):
        assert kind_for("Other", "just a letter") is DocumentKind.UNKNOWN

    def test_unsupported_document_returns_no_fields(self):
        fields, warnings, kind = _parse("Other", ["just a letter"])
        assert kind is DocumentKind.UNKNOWN
        assert fields == {}
        assert any("not supported" in warning for warning in warnings)
