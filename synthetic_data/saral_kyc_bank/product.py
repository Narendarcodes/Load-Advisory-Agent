"""Product (purpose) and amount-band design: caps, product documents, affordability.

The four personal-loan products and their caps follow the ZEN design draft
(feat/saral-contracts-zen-design: docs/saral/rule_catalogue.draft.json product_rules and
contracts/zen.py ProductId): wedding <= 15L / 60m, higher education <= 20L / 84m,
home renovation <= 25L / 84m, medical emergency <= 10L / 60m. All are DRAFT assumptions
(A-25..A-28), not approved policy. A cap breach REFERs per proposal v2 P05 / A-29, while the
v2 aggregation rule says a cap-only failure becomes a counter-offer at the largest passing
amount; this dataset labels cap-only cases COUNTER_OFFER and records the conflict.
"""
from __future__ import annotations

import math
import random
from datetime import date, timedelta

ASSESSMENT_RATE = 0.20  # proposal v2 A02 / draft A-05
MAX_FOIR = 0.50
MIN_RESIDUAL = 15_000
MAX_INCOME_MULTIPLE = 24
MIN_AMOUNT, MAX_AMOUNT = 40_000, 7_500_000
MIN_TENURE, MAX_TENURE = 12, 108
HIGH_FLOOR_CITIES = {"Pune", "Bengaluru", "Mumbai", "Delhi"}  # BFL-PL-SALARIED#012: Rs 40,000
INCOME_FLOOR_HIGH, INCOME_FLOOR = 40_000, 25_001              # BFL-PL-SALARIED#004: from Rs 25,001

PRODUCTS = {
    "wedding": {"product_id": "PL_WEDDING", "max_amount": 1_500_000, "max_tenure": 60,
                "docs": [("WEDDING_QUOTE", False)]},
    "higher_education": {"product_id": "PL_HIGHER_EDUCATION", "max_amount": 2_000_000, "max_tenure": 84,
                         "docs": [("ADMISSION_LETTER", True), ("FEE_SCHEDULE", True)]},
    "home_renovation": {"product_id": "PL_HOME_RENOVATION", "max_amount": 2_500_000, "max_tenure": 84,
                        "docs": [("CONTRACTOR_QUOTE", True)]},
    "medical_emergency": {"product_id": "PL_MEDICAL_EMERGENCY", "max_amount": 1_000_000, "max_tenure": 60,
                          "docs": [("HOSPITAL_ESTIMATE", True)]},
}
PURPOSES = list(PRODUCTS)
NOT_OFFERED = ["speculative_trading", "crypto_investment"]

# Band codes follow catalogue v2 PL-119 (B1..B4); the readable labels are the user's (22:53).
BAND_LABEL = {"B1": "<=2L", "B2": "2L-10L", "B3": "10L-25L", "B4": ">25L"}
BANDS = {
    "B1": (40_000, 200_000, [75_000, 120_000, 150_000, 180_000, 200_000]),
    "B2": (200_001, 1_000_000, [300_000, 450_000, 600_000, 800_000, 1_000_000]),
    "B3": (1_000_001, 2_500_000, [1_200_000, 1_500_000, 1_800_000, 2_000_000, 2_500_000]),
    "B4": (2_500_001, MAX_AMOUNT, [3_000_000, 3_500_000, 4_000_000]),
}


def band_of(amount: int) -> str:
    if amount <= 200_000:
        return "B1"
    if amount <= 1_000_000:
        return "B2"
    if amount <= 2_500_000:
        return "B3"
    return "B4"


def emi(principal: float, months: int, rate: float = ASSESSMENT_RATE) -> int:
    r = rate / 12
    return round(principal * r * (1 + r) ** months / ((1 + r) ** months - 1))


def income_floor(city: str) -> int:
    return INCOME_FLOOR_HIGH if city in HIGH_FLOOR_CITIES else INCOME_FLOOR


def failures(amount: int, tenure: int, income: int, existing: int, purpose: str) -> list[str]:
    """Which affordability / product checks fail (A01, A03, A04, E04-E06, P05)."""
    out = []
    total = existing + emi(amount, tenure)
    if total / income > MAX_FOIR:
        out.append("A01")
    if income - total < MIN_RESIDUAL:
        out.append("A03")
    if amount > MAX_INCOME_MULTIPLE * income:
        out.append("A04")
    if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
        out.append("E04/E05")
    if not MIN_TENURE <= tenure <= MAX_TENURE:
        out.append("E06")
    p = PRODUCTS.get(purpose)
    if p and (amount > p["max_amount"] or tenure > p["max_tenure"]):
        out.append("P05")
    return out


B3_REVIEW_FOIR = 0.45  # catalogue v2 PL-123: B3 with FOIR above 0.45 goes to manual review


def max_affordable_amount(tenure: int, income: int, existing: int, purpose: str) -> int:
    """A05: the largest amount (in 10,000s) that passes A01/A03/A04 and the product cap, kept
    out of the PL-123 B3 review zone (an amount above 10L is sized at FOIR 0.45)."""
    amount = _max_at(tenure, income, existing, purpose, MAX_FOIR)
    if amount > 1_000_000:
        amount = max(_max_at(tenure, income, existing, purpose, B3_REVIEW_FOIR), 1_000_000)
    while amount >= MIN_AMOUNT and failures(amount, tenure, income, existing, purpose):
        amount -= 10_000
    return amount if amount >= MIN_AMOUNT else 0


def _max_at(tenure: int, income: int, existing: int, purpose: str, foir_cap: float) -> int:
    room = min(foir_cap * income, income - MIN_RESIDUAL) - existing
    if room <= 0:
        return 0
    factor = emi(100_000, tenure) / 100_000
    amount = min(room / factor, MAX_INCOME_MULTIPLE * income, PRODUCTS[purpose]["max_amount"])
    return int(amount // 10_000 * 10_000)


def approve_income(amount: int, tenure: int, existing: int, city: str, foir_target: float) -> int:
    total = existing + emi(amount, tenure)
    need = max(total / foir_target, total + MIN_RESIDUAL + 5_000, amount / (MAX_INCOME_MULTIPLE - 4),
               income_floor(city) + 5_000)
    return int(math.ceil(need / 1_000) * 1_000)


def design_counter(amount: int, purpose: str, existing: int, city: str, kind: str) -> dict:
    """Try the requested kind of counter-offer first, then the other one."""
    other = "REDUCED_AMOUNT" if kind == "LONGER_TENURE" else "LONGER_TENURE"
    for k in (kind, other):
        try:
            return _design_counter(amount, purpose, existing, city, k)
        except ValueError:
            continue
    raise ValueError(f"no counter-offer design for {amount} {purpose}")


def _design_counter(amount: int, purpose: str, existing: int, city: str, kind: str) -> dict:
    """Request + income such that the request fails only on affordability (or cap) and a
    counter-offer passes. kind: LONGER_TENURE or REDUCED_AMOUNT."""
    cap = PRODUCTS[purpose]
    floor = income_floor(city) + 5_000
    if amount > cap["max_amount"]:
        # Cap-only failure: plenty of income, counter at the cap.
        tenure = cap["max_tenure"]
        income = approve_income(cap["max_amount"], tenure, existing, city, 0.35)
        return {"tenure": tenure, "income": income, "kind": "REDUCED_AMOUNT",
                "counter_amount": cap["max_amount"], "counter_tenure": tenure, "cap_limited": True}
    if kind == "LONGER_TENURE":
        long_t = cap["max_tenure"]
        for req_t in (12, 24, 36):
            income = max(floor, int(math.ceil((existing + emi(amount, long_t)) / 0.43 / 1_000) * 1_000))
            income = max(income, int(math.ceil(amount / 22 / 1_000) * 1_000))
            if "A01" in failures(amount, req_t, income, existing, purpose) and \
                    not failures(amount, long_t, income, existing, purpose):
                # shortest passing tenure
                t = next(t for t in range(req_t + 12, long_t + 1, 12) if not failures(amount, t, income, existing, purpose))
                return {"tenure": req_t, "income": income, "kind": "LONGER_TENURE",
                        "counter_amount": amount, "counter_tenure": t, "cap_limited": False}
        raise ValueError("longer tenure does not fix this request")
    # Reduced amount: the request must fail even at the longest tenure (a longer tenure is tried first).
    tenure = cap["max_tenure"]
    income = max(floor, int(math.ceil((existing + emi(amount, tenure)) / 0.68 / 1_000) * 1_000))
    if not failures(amount, tenure, income, existing, purpose):
        raise ValueError("request already passes at the longest tenure")
    counter = max_affordable_amount(tenure, income, existing, purpose)
    if counter < MIN_AMOUNT or counter >= amount:
        raise ValueError(f"cannot design a reduced-amount counter for {amount} {purpose}")
    return {"tenure": tenure, "income": income, "kind": "REDUCED_AMOUNT", "counter_amount": counter,
            "counter_tenure": tenure, "cap_limited": False}


# ---------------------------------------------------------------- product documents

INSTITUTIONS = ["Specimen Institute of Technology", "Demo University of Sciences", "Sample School of Management"]
COURSES = ["M.Tech Data Science", "MBA", "M.Sc Nursing", "B.Tech Civil (lateral)"]
HOSPITALS = ["Specimen Multispeciality Hospital", "Demo Heart Institute", "Sample Care Hospitals"]
CONTRACTORS = ["Specimen Interiors & Civil Works", "Demo Home Builders", "Sample Renovation Co"]
VENDORS = ["Specimen Banquets & Catering", "Demo Wedding Planners"]


def product_details(purpose: str, amount: int, rng: random.Random, as_of: date, doc_id, *,
                    quote_short: bool = False, drop_required: bool = False) -> dict:
    """Product-specific fields and documents. ``doc_id(kind)`` returns a SYN-DOC id."""
    docs = []
    fields: dict = {}
    if purpose == "wedding":
        wd = as_of + timedelta(days=rng.randint(30, 300))
        fields = {"wedding_date": wd.isoformat(), "relationship_to_applicant": rng.choice(["SELF", "SIBLING", "CHILD"]),
                  "days_to_wedding": (wd - as_of).days}
        if rng.random() < 0.6:  # optional
            docs.append({"kind": "WEDDING_QUOTE", "required": False, "document_id": doc_id("WEDDING_QUOTE"),
                         "vendor": rng.choice(VENDORS), "quote_amount": int(amount * rng.uniform(1.05, 1.4)),
                         "issue_date": (as_of - timedelta(days=rng.randint(5, 40))).isoformat()})
    elif purpose == "higher_education":
        start = as_of + timedelta(days=rng.randint(20, 150))
        fee = int(amount * rng.uniform(1.0, 1.3))
        fields = {"institution": rng.choice(INSTITUTIONS), "course": rng.choice(COURSES),
                  "course_start_date": start.isoformat(), "student_relationship": rng.choice(["SELF", "CHILD"])}
        docs.append({"kind": "ADMISSION_LETTER", "required": True, "document_id": doc_id("ADMISSION_LETTER"),
                     "institution": fields["institution"], "course": fields["course"],
                     "issue_date": (as_of - timedelta(days=rng.randint(10, 60))).isoformat()})
        docs.append({"kind": "FEE_SCHEDULE", "required": True, "document_id": doc_id("FEE_SCHEDULE"),
                     "fee_total": fee, "payee_account_present": rng.random() < 0.7, "academic_year": f"{start.year}-{(start.year + 1) % 100:02d}",
                     "issue_date": (as_of - timedelta(days=rng.randint(10, 60))).isoformat()})
    elif purpose == "home_renovation":
        quote = int(amount * (rng.uniform(0.6, 0.8) if quote_short else rng.uniform(1.0, 1.25)))
        fields = {"property_ownership": rng.choice(["OWNED", "FAMILY_OWNED"]), "property_city_same_as_address": True}
        docs.append({"kind": "CONTRACTOR_QUOTE", "required": True, "document_id": doc_id("CONTRACTOR_QUOTE"),
                     "contractor": rng.choice(CONTRACTORS), "quote_amount": quote,
                     "issue_date": (as_of - timedelta(days=rng.randint(5, 45))).isoformat()})
    elif purpose == "medical_emergency":
        fields = {"patient_relationship": rng.choice(["SELF", "SPOUSE", "PARENT", "CHILD"]),
                  "treatment_type": rng.choice(["SURGERY", "CARDIAC", "ONCOLOGY", "ORTHOPAEDIC"]),
                  "treatment_date": (as_of + timedelta(days=rng.randint(-10, 30))).isoformat(), "fast_track": True}
        docs.append({"kind": rng.choice(["HOSPITAL_ESTIMATE", "HOSPITAL_BILL"]), "required": True,
                     "document_id": doc_id("HOSPITAL_ESTIMATE"), "hospital": rng.choice(HOSPITALS),
                     "estimate_amount": int(amount * rng.uniform(1.0, 1.3)), "payee_account_present": rng.random() < 0.6,
                     "issue_date": (as_of - timedelta(days=rng.randint(1, 20))).isoformat()})
    if drop_required:
        docs = [d for d in docs if not d["required"]]
    for d in docs:
        d["synthetic"] = True
    required_kinds = sorted({k for k, req in PRODUCTS[purpose]["docs"] if req}) if purpose in PRODUCTS else []
    present = {d["kind"] if d["kind"] != "HOSPITAL_BILL" else "HOSPITAL_ESTIMATE" for d in docs}
    if not required_kinds:
        status = "NOT_REQUIRED"
    elif not set(required_kinds) <= present:
        status = "MISSING"
    elif quote_short:
        status = "INSUFFICIENT"
    else:
        status = "PROVIDED"
    amounts = [d.get("quote_amount") or d.get("fee_total") or d.get("estimate_amount") for d in docs
               if d["required"] or d["kind"] == "WEDDING_QUOTE"]
    amounts = [a for a in amounts if a]
    return {"synthetic": True, "fields": fields, "documents": docs, "required_kinds": required_kinds,
            "purpose_evidence_status": status,
            "purpose_evidence_amount": max(amounts) if amounts else None,
            "payee_account_present": any(d.get("payee_account_present") for d in docs)}
