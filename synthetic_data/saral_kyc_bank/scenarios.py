"""Scenario catalogue: one clean prime case plus targeted failures per PL rule group.

``expected_outcome_hint`` is what the scenario was *designed* to provoke under the DRAFT
ZEN proposal v2 thresholds. It is a generation label, never a ZEN result: no threshold
here is approved policy, and secondary rules may also fire (listed in ``also_triggers``).

Outcome vocabulary (ZEN proposal v2): APPROVE, REFER, DECLINE, INFO (ask the applicant),
STOP (halt the process), RE_PULL (fetch a fresh bureau report), COUNTER_OFFER.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# PL rule-catalogue groups (USER_RULE_CATALOGUE_PL.yaml).
GROUPS = {
    "A": "A_APPLICANT_ELIGIBILITY",
    "B": "B_INCOME_AND_EMPLOYMENT",
    "C": "C_BUREAU_IDENTITY_AND_DATA_QUALITY",
    "D": "D_CREDIT_SCORE_AND_HISTORY",
    "E": "E_REPAYMENT_AND_DELINQUENCY",
    "F": "F_CREDIT_ENQUIRIES_AND_RECENT_BORROWING",
    "G": "G_REPAYMENT_CAPACITY_AND_FOIR",
    "H": "H_LOAN_REQUEST_AND_PRODUCT_PARAMETERS",
    "I": "I_BANK_STATEMENT_AND_CASH_FLOW",
    "J": "J_DOCUMENT_AND_FRAUD_CONTROLS",
}

SIGNATURE_LABELS = ("GENUINE_MATCH", "SKILLED_FORGERY", "RANDOM_FORGERY", "MISSING")


@dataclass(frozen=True)
class Scenario:
    id: str
    groups: tuple[str, ...]
    pl_rules: tuple[str, ...]
    zen_refs: tuple[str, ...]
    outcome: str
    description: str
    # Bureau source: "native:<generator scenario>" (synthetic_bureau.generator.build_report
    # output used unchanged) or "overlay:<kind>" (native output, then a documented
    # change applied here and re-scored with synthetic_bureau.scoring).
    bureau: str = "overlay:AGED"
    also_triggers: tuple[str, ...] = field(default_factory=tuple)
    signature: str = "GENUINE_MATCH"


S = Scenario
SCENARIOS: tuple[Scenario, ...] = (
    S("CLEAN_PRIME", tuple("ABCDEFGHIJ"), (), (), "APPROVE",
      "Consistent identity, salaried at an eligible employer, aged clean bureau, FOIR well under 0.50."),
    # ---- A applicant eligibility
    S("UNDER_21", ("A",), ("PL-001",), ("E01",), "DECLINE", "Applicant is 19 on the assessment date.", also_triggers=("E10",)),
    S("OVER_AGE_AT_MATURITY", ("A", "H"), ("PL-002", "PL-073"), ("E02",), "DECLINE",
      "Applicant is 74; at the end of an 84-month tenure they would be 81."),
    S("NON_RESIDENT", ("A",), ("PL-003",), ("E03",), "DECLINE", "Residency status NRI."),
    S("SALARY_IRREGULAR", ("B", "I"), ("PL-010", "PL-011", "PL-084"), (), "REFER",
      "Salaried with heavy variable incentive pay: monthly salary swings widely over a 12-month statement.",
      also_triggers=("A01", "PL-018", "E08", "A03")),
    S("INELIGIBLE_EMPLOYER_CATEGORY", ("A",), ("PL-005",), ("E07",), "REFER",
      "Employer is a proprietorship / unregistered firm (outside public, private or MNC)."),
    S("IDENTITY_INCOMPLETE", ("A", "J"), ("PL-006", "PL-096"), ("G06", "K03"), "INFO",
      "Aadhaar e-KYC carries year of birth only and no house/street; DOB cannot be matched exactly."),
    S("DUPLICATE_APPLICANT", ("A", "J"), ("PL-007",), ("X03",), "STOP",
      "Same Aadhaar, PAN, name and DOB as the first CLEAN_PRIME applicant under a new applicant id.", also_triggers=("X04",)),
    S("SHARED_CONTACT", ("J",), ("PL-007", "PL-098"), ("X04",), "REFER",
      "Phone number shared with a different applicant (different PAN)."),
    # ---- B income and employment
    S("LOW_INCOME", ("B",), ("PL-008",), ("E08",), "DECLINE", "Net monthly income 23,500 (below 25,001)."),
    S("PAYSLIP_BANK_MISMATCH", ("B", "J"), ("PL-009", "PL-012", "PL-017", "PL-092"), ("I01",), "REFER",
      "Payslip net is ~25% above the salary actually credited."),
    S("INCOME_DROP", ("B", "I"), ("PL-010", "PL-011", "PL-018", "PL-084"), (), "REFER",
      "12-month statement; salary falls ~35% in the last three months (payslips agree).", also_triggers=("A01", "A03", "E08")),
    S("SALARY_MISSING_MONTH", ("B", "I"), ("PL-012", "PL-078"), ("I02",), "REFER",
      "One of the last three months has no salary credit.",
      also_triggers=("PL-018", "PL-084", "I04")),
    S("EMPLOYER_NAME_MISMATCH", ("B", "I"), ("PL-012", "PL-017"), ("I03",), "REFER",
      "Salary credits name a different employer from the declared one."),
    S("PROBATION_SHORT_TENURE", ("B",), ("PL-014", "PL-016"), ("E09",), "REFER",
      "On probation, 4 months with the current employer.",
      also_triggers=("E10", "PL-016")),
    S("CONTRACT_EMPLOYMENT", ("B",), ("PL-016", "PL-013"), (), "REFER", "Fixed-term contract employee."),
    S("EMPLOYMENT_GAP", ("B",), ("PL-013", "PL-015"), ("E10",), "REFER",
      "9-month gap between the previous and current employer; total experience under 12 months."),
    # ---- C bureau identity and data quality
    S("BUREAU_NO_HIT", ("C",), ("PL-019", "PL-027"), ("C02",), "REFER", "Bureau has no record.",
      bureau="native:NO_HIT"),
    S("BUREAU_THIN_FILE", ("C", "D"), ("PL-026", "PL-031"), ("C02", "C03"), "REFER",
      "One card, 3 months of history; score unavailable.", bureau="native:THIN_HISTORY"),
    S("BUREAU_STALE_REPORT", ("C",), ("PL-024",), ("G03",), "RE_PULL", "Report is 145 days old.",
      bureau="native:STALE_REPORT", also_triggers=("C03", "C14")),
    S("BUREAU_IDENTITY_MISMATCH", ("C",), ("PL-020",), ("G04",), "REFER",
      "Bureau identity check failed (report applicant id differs).", bureau="native:IDENTITY_MISMATCH",
      also_triggers=("C03", "C14", "PL-021")),
    S("BUREAU_INCOMPLETE", ("C",), ("PL-028",), ("G05",), "REFER", "BLOCK data-quality issue on the report.",
      bureau="native:INCOMPLETE", also_triggers=("C03", "C14")),
    S("BUREAU_UNAVAILABLE", ("C",), ("PL-019",), ("G02",), "REFER",
      "Provider failure (HTTP 503); no report.", bureau="native:UNAVAILABLE"),
    S("NAME_MISMATCH_PAN", ("C", "J"), ("PL-021", "PL-094"), ("K02",), "REFER",
      "PAN name is an abbreviated/misspelt variant of the Aadhaar name."),
    S("NAME_MISMATCH_BUREAU", ("C",), ("PL-021", "PL-020"), ("K02",), "REFER",
      "Name on the bureau's file differs from Aadhaar/PAN."),
    S("NAME_MISMATCH_BANK", ("J", "I"), ("PL-094", "PL-097"), ("K02",), "REFER",
      "Bank account holder name differs from Aadhaar/PAN."),
    S("DOB_MISMATCH_PAN", ("C", "J"), ("PL-022", "PL-094"), ("K03",), "REFER", "PAN DOB differs from Aadhaar DOB."),
    S("DOB_MISMATCH_BUREAU", ("C",), ("PL-022",), ("K03",), "REFER", "DOB on the bureau's file differs."),
    S("ADDRESS_MISMATCH_BUREAU", ("C",), ("PL-023",), (), "REFER",
      "Address on the bureau's file is a different city from Aadhaar/declared."),
    S("DUPLICATE_TRADELINE", ("C",), ("PL-025",), ("G05",), "REFER",
      "The personal-loan tradeline appears twice.", bureau="overlay:DUPLICATE_TRADELINE"),
    # ---- D credit score and history
    S("LOW_SCORE", ("D",), ("PL-029",), ("C01",), "DECLINE", "Synthetic score 630.",
      bureau="native:SUCCESS@630", also_triggers=("C04", "C03")),
    S("HIGH_UTILISATION", ("D",), ("PL-036", "PL-037"), ("C16",), "REFER", "Card utilisation ~98%.",
      bureau="native:SUCCESS@700", also_triggers=("C03", "C14")),
    S("NEW_ACCOUNTS_STACKING", ("D", "F"), ("PL-035", "PL-055", "PL-056"), ("C14", "C15"), "REFER",
      "Three new personal loans opened in the last 4 months (EMIs visible in bank and declared).",
      bureau="overlay:STACKING", also_triggers=("A01",)),
    # ---- E repayment and delinquency
    S("DPD_30", ("E",), ("PL-040", "PL-041", "PL-051"), ("C04",), "REFER", "One 30-DPD on the card.",
      bureau="native:SUCCESS@660", also_triggers=("C03",)),
    S("DPD_60", ("E",), ("PL-042", "PL-044", "PL-045"), ("C05",), "DECLINE", "60-DPD on the PL within 12 months.",
      bureau="overlay:DPD_60", also_triggers=("C01",)),
    S("DPD_90", ("E",), ("PL-043",), ("C06",), "DECLINE", "90+ DPD on the auto loan within 24 months.",
      bureau="overlay:DPD_90", also_triggers=("C01",)),
    S("WRITTEN_OFF", ("E",), ("PL-048",), ("C09",), "DECLINE", "Closed PL written off 10 months ago.",
      bureau="overlay:WRITTEN_OFF", also_triggers=("C01", "C04", "C05")),
    S("SETTLED", ("E",), ("PL-047",), ("C09",), "DECLINE", "Closed PL settled 8 months ago.",
      bureau="overlay:SETTLED", also_triggers=("C01", "C04", "C05")),
    # ---- F enquiries
    S("ENQUIRY_BURST", ("F",), ("PL-052", "PL-053", "PL-054", "PL-057"), ("C11", "C12", "C13"), "REFER",
      "7 enquiries in 90 days, 4 personal-loan enquiries in 30 days.", bureau="overlay:ENQUIRY_BURST"),
    # ---- G repayment capacity
    S("FOIR_BREACH", ("G",), ("PL-061", "PL-062", "PL-063", "PL-064"), ("A01",), "COUNTER_OFFER",
      "Requested EMI pushes FOIR to ~0.73.", also_triggers=("A03",)),
    S("RESIDUAL_INCOME_LOW", ("G",), ("PL-065",), ("A03",), "REFER",
      "FOIR under 0.50 but residual income under 15,000."),
    S("OBLIGATION_UNDERDECLARED", ("G", "B"), ("PL-058", "PL-060", "PL-017"), ("I08",), "REFER",
      "Declared monthly obligations are 6,000 less than the bureau EMIs."),
    # ---- H loan request
    S("PURPOSE_NOT_OFFERED", ("H",), ("PL-076",), ("P06",), "DECLINE", "Purpose is speculative trading."),
    S("PURPOSE_OVER_CAP", ("H",), ("PL-070",), ("P01", "P05"), "REFER", "Wedding loan of 18L (cap 15L)."),
    S("AMOUNT_BELOW_MIN", ("H",), ("PL-069",), ("E04",), "DECLINE", "Requested 30,000 (minimum 40,000)."),
    S("TENURE_OUT_OF_RANGE", ("H",), ("PL-071", "PL-072"), ("E06",), "DECLINE",
      "Tenure 120 months (range 12-108).", also_triggers=("P05",)),
    # ---- I bank statement
    S("BOUNCE_HEAVY", ("I",), ("PL-081", "PL-046"), ("I05",), "DECLINE",
      "3 NACH/ECS returns and 1 cheque return in 3 months, each with charges."),
    S("CASH_HEAVY", ("I",), ("PL-083", "PL-085"), ("I07",), "REFER",
      "Salaried, but cash deposits are over 50% of all credits."),
    S("NEGATIVE_BALANCE", ("I",), ("PL-080", "PL-079"), ("I06",), "REFER",
      "Overdraft-linked account below zero on several days around month end.",
      also_triggers=("I04",)),
    S("UNDECLARED_DEBT", ("I", "G"), ("PL-086", "PL-082"), ("I08",), "REFER",
      "Recurring NACH EMI to a lender absent from the bureau and the declaration."),
    S("SALARY_REVERSAL", ("I",), ("PL-087",), ("I02",), "REFER",
      "A salary credit is reversed two days later.",
      also_triggers=("PL-018", "PL-084")),
    S("EMI_DEBIT_MISSING", ("I",), ("PL-082",), (), "REFER",
      "Bureau auto-loan EMI absent from the bank for the last two months."),
    # ---- J documents and fraud
    S("MISSING_DOCUMENTS", ("J",), ("PL-088", "PL-096"), ("K05",), "INFO",
      "PAN card not uploaded, 1 of 3 payslips, statement covers 2 months.",
      also_triggers=("I02",)),
    S("CONSENT_MISSING", ("J",), ("PL-095",), ("G01",), "STOP", "Bureau-pull consent not recorded."),
    S("STATEMENT_TAMPERED", ("J",), ("PL-093", "PL-090"), ("K09",), "REFER",
      "One running balance edited after the fact: arithmetic breaks and the content hash no longer matches."),
    S("DUPLICATE_DOCUMENT", ("J",), ("PL-091", "PL-092"), ("K09",), "REFER",
      "Payslips are byte-identical copies of another applicant's payslips.",
      also_triggers=("I01", "K02")),
    S("NEGATIVE_LIST_HIT", ("J",), ("PL-098",), ("X01",), "DECLINE", "PAN on the synthetic internal negative list."),
    S("EMPLOYER_CAUTION_LIST", ("B", "J"), ("PL-013", "PL-098"), ("X05",), "REFER",
      "Employer is on the synthetic employer caution list."),
    S("OCR_LOW_CONFIDENCE", ("J",), ("PL-089",), ("K07",), "REFER",
      "Payslip net-pay field read by OCR at confidence 41 (below 60)."),
    S("PAN_FORMAT_INVALID", ("J",), ("PL-102", "PL-094"), ("K01",), "REFER",
      "OCR read the PAN with a letter O for a zero, so the read value fails the PAN pattern.",
      also_triggers=("K04",)),
    S("DOCUMENT_STALE", ("J",), ("PL-103",), ("K06",), "REFER", "Latest payslip is over 60 days old."),
    S("COOLING_OFF_RECENT_DECLINE", ("J",), ("PL-114",), ("X02",), "REFER",
      "Same PAN was declined 12 days ago (30-day cool-down)."),
    S("SHORT_ADDRESS_TENURE", ("A",), ("PL-101",), ("E11",), "REFER", "5 months at the current address."),
    S("EMPLOYER_CHURN", ("B",), ("PL-013",), (), "REFER", "Three employer changes in the last 24 months."),
    S("CURRENT_DEFAULT", ("E",), ("PL-039", "PL-040"), ("C08",), "DECLINE",
      "An active credit account is currently in DEFAULT with an overdue amount.", bureau="overlay:DEFAULT",
      also_triggers=("C01", "C04", "C05")),
    S("SPEND_EXCEEDS_INFLOW", ("I",), ("PL-106",), ("I04",), "REFER", "Debits exceed credits over the statement."),
    S("PURPOSE_PRODUCT_MISMATCH", ("H",), ("PL-112",), (), "REFER",
      "Declared purpose (medical) differs from the product chosen (wedding)."),
    S("HOME_QUOTE_BELOW_AMOUNT", ("H", "J"), ("PL-111",), ("P03",), "REFER",
      "Home renovation: contractor quote is 60-80% of the requested amount."),
    S("EDU_ADMISSION_MISSING", ("H", "J"), ("PL-111", "PL-088"), ("P02",), "INFO",
      "Higher education: admission letter and fee schedule not uploaded.",
      also_triggers=("K05",)),
    S("SIG_SKILLED_FORGERY", ("J",), ("PL-090", "PL-098"), ("K08",), "REFER",
      "Form signature is a simulated skilled forgery of the PAN reference.", signature="SKILLED_FORGERY"),
    S("SIG_RANDOM_FORGERY", ("J",), ("PL-090", "PL-098"), ("K08",), "REFER",
      "Form signature is a different writer's signature.", signature="RANDOM_FORGERY"),
    S("SIG_MISSING", ("J",), ("PL-088", "PL-096"), ("K05", "K08"), "INFO",
      "NACH mandate / application form signature box is blank.", signature="MISSING"),
)

# Product x amount-band matrix: 4 purposes x 4 bands x {approve, counter-offer, decline}.
# The per-applicant expected path is computed by the generator (cap-limited cells cannot approve).
MATRIX_SCENARIOS: tuple[Scenario, ...] = (
    S("MATRIX_APPROVE", ("G", "H"), ("PL-063", "PL-064", "PL-069", "PL-070"), ("A01", "P05"), "APPROVE",
      "Product x band matrix: affordable, within cap; approve unless the band is above the product cap.",
      also_triggers=("A01", "A03", "A04", "P05", "PL-123", "C01", "C04", "C05", "C06", "C09")),
    S("MATRIX_COUNTER_OFFER", ("G", "H"), ("PL-066", "PL-067", "PL-068"), ("A01", "A05", "P05"), "COUNTER_OFFER",
      "Product x band matrix: request fails affordability or cap only; a longer tenure or reduced amount passes.",
      also_triggers=("A01", "A03", "A04", "P05", "PL-123", "C01", "C04", "C05", "C06", "C09")),
    S("MATRIX_DECLINE", ("D", "E", "H"), ("PL-029", "PL-043", "PL-048"), ("C01", "C06", "C09"), "DECLINE",
      "Product x band matrix: declines on credit history whatever the amount.",
      also_triggers=("A01", "A03", "A04", "P05", "PL-123", "C01", "C04", "C05", "C06", "C09")),
)
MATRIX_BUREAU = {"LOW_SCORE": "native:SUCCESS@630", "DPD_90": "overlay:DPD_90",
                 "WRITTEN_OFF": "overlay:WRITTEN_OFF", "SETTLED": "overlay:SETTLED"}
ALL_SCENARIOS = SCENARIOS + MATRIX_SCENARIOS
BY_ID = {s.id: s for s in ALL_SCENARIOS}
assert len(BY_ID) == len(ALL_SCENARIOS), "duplicate scenario id"
for _s in ALL_SCENARIOS:
    assert _s.signature in SIGNATURE_LABELS


def plan(count: int) -> list[tuple[str, int]]:
    """Deterministic (scenario id, occurrence) order: every non-matrix scenario once
    (CLEAN_PRIME first), then the 48-cell product x band matrix, then a second pass of the
    failure scenarios, then CLEAN_PRIME to fill."""
    ids = [s.id for s in SCENARIOS]
    order = list(ids)
    for path in ("MATRIX_APPROVE", "MATRIX_COUNTER_OFFER", "MATRIX_DECLINE"):
        order += [path] * 16
    order += ids[1:]
    while len(order) < count:
        order.append("CLEAN_PRIME")
    seen: dict[str, int] = {}
    out = []
    for sid in order[:count]:
        out.append((sid, seen.get(sid, 0)))
        seen[sid] = seen.get(sid, 0) + 1
    return out


def matrix_cell(occurrence: int) -> tuple[str, str]:
    """(purpose, band) for the n-th applicant of a MATRIX scenario."""
    from .product import BANDS, PURPOSES  # noqa: PLC0415

    bands = list(BANDS)
    return PURPOSES[occurrence % 4], bands[(occurrence // 4) % 4]


def hint(s: Scenario) -> dict:
    return {
        "outcome": s.outcome,
        "primary_pl_rules": list(s.pl_rules),
        "zen_proposal_v2_refs": list(s.zen_refs),
        "also_triggers": list(s.also_triggers),
        "decision_path": decision_path(s),
        "reason_category": CATEGORY[s.id],
        "note": "Designed generation target under DRAFT thresholds; not a ZEN result.",
    }


# Reason category per scenario, used to name the decision path the scenario exercises.
CATEGORY = {
    "CLEAN_PRIME": None,
    "UNDER_21": "ELIGIBILITY", "OVER_AGE_AT_MATURITY": "ELIGIBILITY", "NON_RESIDENT": "ELIGIBILITY",
    "INELIGIBLE_EMPLOYER_CATEGORY": "EMPLOYMENT", "SHORT_ADDRESS_TENURE": "ELIGIBILITY",
    "IDENTITY_INCOMPLETE": "KYC", "DUPLICATE_APPLICANT": "FRAUD", "SHARED_CONTACT": "FRAUD",
    "LOW_INCOME": "INCOME", "PAYSLIP_BANK_MISMATCH": "INCOME", "INCOME_DROP": "INCOME",
    "SALARY_IRREGULAR": "INCOME", "SALARY_MISSING_MONTH": "INCOME", "EMPLOYER_NAME_MISMATCH": "INCOME",
    "PROBATION_SHORT_TENURE": "EMPLOYMENT", "CONTRACT_EMPLOYMENT": "EMPLOYMENT", "EMPLOYMENT_GAP": "EMPLOYMENT",
    "EMPLOYER_CHURN": "EMPLOYMENT",
    "BUREAU_NO_HIT": "NO_HIT", "BUREAU_THIN_FILE": "THIN_FILE", "BUREAU_STALE_REPORT": "STALE_REPORT",
    "BUREAU_IDENTITY_MISMATCH": "BUREAU_DATA", "BUREAU_INCOMPLETE": "BUREAU_DATA",
    "BUREAU_UNAVAILABLE": "BUREAU_DATA", "DUPLICATE_TRADELINE": "BUREAU_DATA",
    "NAME_MISMATCH_PAN": "KYC", "NAME_MISMATCH_BUREAU": "KYC", "NAME_MISMATCH_BANK": "KYC",
    "DOB_MISMATCH_PAN": "KYC", "DOB_MISMATCH_BUREAU": "KYC", "ADDRESS_MISMATCH_BUREAU": "KYC",
    "LOW_SCORE": "CREDIT_SCORE", "HIGH_UTILISATION": "CREDIT_BEHAVIOUR", "NEW_ACCOUNTS_STACKING": "CREDIT_BEHAVIOUR",
    "ENQUIRY_BURST": "CREDIT_BEHAVIOUR",
    "DPD_30": "DELINQUENCY", "DPD_60": "DELINQUENCY", "DPD_90": "DELINQUENCY", "WRITTEN_OFF": "DELINQUENCY",
    "SETTLED": "DELINQUENCY", "CURRENT_DEFAULT": "DELINQUENCY",
    "FOIR_BREACH": "AFFORDABILITY", "RESIDUAL_INCOME_LOW": "AFFORDABILITY", "OBLIGATION_UNDERDECLARED": "AFFORDABILITY",
    "PURPOSE_NOT_OFFERED": "PRODUCT", "PURPOSE_OVER_CAP": "PRODUCT", "AMOUNT_BELOW_MIN": "PRODUCT",
    "TENURE_OUT_OF_RANGE": "PRODUCT", "PURPOSE_PRODUCT_MISMATCH": "PRODUCT",
    "BOUNCE_HEAVY": "BANK_CONDUCT", "CASH_HEAVY": "BANK_CONDUCT", "NEGATIVE_BALANCE": "BANK_CONDUCT",
    "UNDECLARED_DEBT": "BANK_CONDUCT", "SALARY_REVERSAL": "BANK_CONDUCT", "EMI_DEBIT_MISSING": "BANK_CONDUCT",
    "SPEND_EXCEEDS_INFLOW": "BANK_CONDUCT",
    "MISSING_DOCUMENTS": "DOCUMENT", "CONSENT_MISSING": "CONSENT", "STATEMENT_TAMPERED": "DOCUMENT",
    "DUPLICATE_DOCUMENT": "FRAUD", "NEGATIVE_LIST_HIT": "FRAUD", "EMPLOYER_CAUTION_LIST": "FRAUD",
    "COOLING_OFF_RECENT_DECLINE": "FRAUD", "OCR_LOW_CONFIDENCE": "DOCUMENT", "PAN_FORMAT_INVALID": "KYC",
    "DOCUMENT_STALE": "DOCUMENT",
    "SIG_SKILLED_FORGERY": "SIGNATURE", "SIG_RANDOM_FORGERY": "SIGNATURE", "SIG_MISSING": "SIGNATURE",
}
CATEGORY.update({"MATRIX_APPROVE": None, "MATRIX_COUNTER_OFFER": "AFFORDABILITY", "MATRIX_DECLINE": "CREDIT"})
CATEGORY.update({"HOME_QUOTE_BELOW_AMOUNT": "PRODUCT", "EDU_ADMISSION_MISSING": "PRODUCT"})
assert set(CATEGORY) == set(BY_ID), set(BY_ID) ^ set(CATEGORY)

# Decision paths the universe must exercise (USER DECISION 2026-11-03 22:50).
REQUIRED_DECISION_PATHS = {
    "APPROVE", "COUNTER_OFFER", "MORE_INFORMATION_REQUIRED", "STOP:CONSENT", "STOP:FRAUD",
    "REFER:THIN_FILE", "REFER:NO_HIT", "RE_PULL:STALE_REPORT",
    "DECLINE:ELIGIBILITY", "DECLINE:INCOME", "DECLINE:PRODUCT", "DECLINE:CREDIT_SCORE",
    "DECLINE:DELINQUENCY", "DECLINE:BANK_CONDUCT", "DECLINE:FRAUD",
    "REFER:KYC", "REFER:INCOME", "REFER:EMPLOYMENT", "REFER:BUREAU_DATA", "REFER:CREDIT_BEHAVIOUR",
    "REFER:DELINQUENCY", "REFER:AFFORDABILITY", "REFER:PRODUCT", "REFER:BANK_CONDUCT", "REFER:DOCUMENT",
    "REFER:FRAUD", "REFER:SIGNATURE", "REFER:ELIGIBILITY",
}


def decision_path(s: Scenario) -> str:
    """APPROVE / COUNTER_OFFER / MORE_INFORMATION_REQUIRED, or <OUTCOME>:<reason category>.
    REFER is the manual-review path."""
    if s.outcome in ("APPROVE", "COUNTER_OFFER"):
        return s.outcome
    if s.outcome == "INFO":
        return "MORE_INFORMATION_REQUIRED"
    return f"{s.outcome}:{CATEGORY[s.id]}"
