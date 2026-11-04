"""Canonical underwriting input schema (P0).

Raw Frappe JSON must NEVER go directly into ZEN. It is validated here first.
Invalid input raises; we never silently transform dangerous values.
"""
from pydantic import BaseModel, Field, field_validator

# Q-01: the one tenure bound (Bajaj 12..108 months, BFL-PL-ELIG-DOCS#008, catalogue PL-071/PL-072).
# Product maxima (60/84) come from the catalogue (PL-110) and are a counter-offer, not a validation error.
MIN_TENURE_MONTHS, MAX_TENURE_MONTHS = 12, 108


class UnderwritingInput(BaseModel):
    application_id: str = Field(min_length=1)
    applicant_id: str = Field(min_length=1)
    monthly_income: float
    monthly_obligations: float
    credit_score: int
    employment_months: int
    loan_amount: float
    loan_tenure_months: int

    @field_validator("monthly_income")
    @classmethod
    def _income(cls, v):
        if v is None or v <= 0:
            raise ValueError("monthly_income must be a positive number")
        if v > 100_000_000:
            raise ValueError("monthly_income implausibly large")
        return v

    @field_validator("monthly_obligations")
    @classmethod
    def _oblig(cls, v):
        if v is None or v < 0:
            raise ValueError("monthly_obligations must be >= 0")
        if v > 100_000_000:
            raise ValueError("monthly_obligations implausibly large")
        return v

    @field_validator("credit_score")
    @classmethod
    def _score(cls, v):
        if v is None or not 300 <= v <= 900:
            raise ValueError("credit_score must be within 300..900")
        return v

    @field_validator("employment_months")
    @classmethod
    def _emp(cls, v):
        if v is None or v < 0 or v > 600:
            raise ValueError("employment_months must be within 0..600")
        return v

    @field_validator("loan_amount")
    @classmethod
    def _amt(cls, v):
        if v is None or v <= 0:
            raise ValueError("loan_amount must be positive")
        return v

    @field_validator("loan_tenure_months")
    @classmethod
    def _tenure(cls, v):
        if v is None or not MIN_TENURE_MONTHS <= v <= MAX_TENURE_MONTHS:
            raise ValueError(f"loan_tenure_months must be within {MIN_TENURE_MONTHS}..{MAX_TENURE_MONTHS}")
        return v

    def zen_context(self) -> dict:
        """Minimal numeric context handed to the ZEN decision model."""
        return {
            "monthly_income": self.monthly_income,
            "monthly_obligations": self.monthly_obligations,
            "credit_score": self.credit_score,
            "employment_months": self.employment_months,
        }
