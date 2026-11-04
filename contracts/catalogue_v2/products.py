"""Product matrix for the four purpose-based personal loans, and the deterministic offer-sizing
reference implementation (DESIGN ONLY; the ZEN JDM is not built).

Every Bajaj-sourced fact carries a chunk id and a verbatim quote from the G1 corpus. Everything
else is an ASSUMPTION in the prototype_synthetic profile, pending the owner's approval.
"""
import math

BAJAJ_BASE = {
    "amount_range_inr": {"value": [40000, 7500000], "chunk": "BFL-PL-OVERVIEW#003",
                         "quote": "Borrow from Rs. 40,000 to Rs. 75 lakh to meet small or large expenses.",
                         "conflict": "C1: Rs. 55 lakh tops the BFL-PL-RATES-FEES#011 tables"},
    "tenure_range_months": {"value": [12, 108], "chunk": "BFL-PL-OVERVIEW#017",
                            "quote": "Flexible tenures ranging from 12 months to 108 months"},
    "base_documents": {"value": ["KYC_PROOF", "PAN_CARD", "EMPLOYEE_ID", "SALARY_SLIP x3", "BANK_STATEMENT x3 months"],
                       "chunk": "BFL-PL-ELIG-DOCS#009",
                       "quote": "PAN card Employee ID card Salary slips of the last 3 months Bank account statements of the previous 3 months"},
    "end_use": {"chunk": "BFL-PL-DETAILED-TNC#020",
                "quote": "The usage of the loan amount shall be for the purpose as mentioned in the Application Form/request only"},
    "disbursal": {"value": "single disbursement to the borrower's bank account", "chunk": "BFL-PL-OVERVIEW#015",
                  "quote": "Disbursal Single disbursement of the loan amount",
                  "also": {"chunk": "BFL-PL-OVERVIEW#003",
                           "quote": "Receive your approved loan amount in your bank account within 24 hours*, subject to document verification and approval"}},
    "rate_range": {"value": [0.10, 0.305], "chunk": "BFL-PL-RATES-FEES#003", "quote": "Interest rate 10% to 30.5% p.a."},
}

A = "ASSUMPTION"

# ---- Owner decisions, ADR-0007 (accepted 2026-11-03 23:18 IST, "remaining yes for all of your recommendations")
ADR_0007 = "ADR-0007 (owner, 2026-11-03 23:18 IST)"
# 1. Every product is capped at Rs. 25 lakh in the MVP. A request above it is offered the largest passing amount within the cap
#    (COUNTER_OFFER) and told it is outside what we offer.
# ADR-0011 (owner, 2026-11-04 00:29 IST): every product cap is Rs. 25 lakh (supersedes 15/20/25/10 lakh), the tenure caps
# 60/84/84/60, FOIR flat 0.50, residual income Rs. 15,000 and the sizing rate 20% are OWNER_APPROVED for prototype_synthetic only.
ADR_0011 = "ADR-0011 (owner, 2026-11-04 00:29 IST), prototype_synthetic only"
MVP_AMOUNT_CEILING = 2_500_000
# 3. One flat prototype rate per product; no risk-grade pricing in the MVP. The value is A-05.
FLAT_RATE_BASIS = "FLAT_PER_PRODUCT (ADR-0007 #3: no risk-grade pricing in the MVP); value OWNER_APPROVED by ADR-0011 (was A-05)"
RATE_USE = "sizing-only: sizes affordability (EMI, FOIR, residual income, offer amount); not an offered or quoted rate (ADR-0011)"
# Tenure: Bajaj's 108 months (BFL-PL-ELIG-DOCS#008) is the indicative outer bound and stays the PL-072 gate. The
# prototype max tenure per product is the product matrix value, kept <= 84 months (ASSUMPTION).
PROTOTYPE_TENURE_CEILING = 84

PRODUCTS = {
    "PL_WEDDING": {
        "purpose": "wedding",
        "bajaj_description": {"chunk": "BFL-PL-OVERVIEW#002",
                              "quote": "Personal loan for wedding A personal loan for a wedding can help you cover major expenses"},
        "amount_range_inr": {"value": [40000, 2500000], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-25",
                             "note": "Min is Bajaj (BFL-PL-OVERVIEW#003); the Rs. 25 lakh cap is ADR-0011 (was A-25, Rs. 15 lakh)."},
        "tenure_range_months": {"value": [12, 60], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-25", "note": "Min is Bajaj; the 60-month cap is ADR-0011 (was A-25; prototype max tenure, <= 84)."},
        "required_documents": {"value": [], "basis": A},
        "optional_documents": {"value": ["WEDDING_INVITE", "VENUE_OR_VENDOR_QUOTE"], "basis": A},
        "purpose_fields": [
            {"field": "wedding_date", "required": True, "basis": A},
            {"field": "wedding_of", "required": True, "values": ["SELF", "CHILD", "SIBLING", "OTHER_RELATIVE"], "basis": A},
            {"field": "estimated_wedding_cost", "required": False, "basis": A},
        ],
        "disbursal_mode": {"value": "BORROWER_ACCOUNT", "basis": "BAJAJ_DEFAULT", "chunk": "BFL-PL-OVERVIEW#015"},
        "fast_track": {"value": False, "basis": A},
        "rate_for_assessment": {"value": 0.20, "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-05", "pricing": FLAT_RATE_BASIS, "use": RATE_USE},
    },
    "PL_HIGHER_EDUCATION": {
        "purpose": "higher_education",
        "bajaj_description": {"chunk": "BFL-PL-OVERVIEW#002",
                              "quote": "You can use a personal loan for higher education to cover the costs of travel, tuition, extra courses, accommodation, and so on."},
        "amount_range_inr": {"value": [40000, 2500000], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-26", "note": "Was A-26, Rs. 20 lakh."},
        "tenure_range_months": {"value": [12, 84], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-26"},
        "required_documents": {"value": ["ADMISSION_LETTER|FEE_SCHEDULE"], "basis": A},
        "optional_documents": {"value": ["INSTITUTION_BANK_DETAILS"], "basis": A},
        "purpose_fields": [
            {"field": "institution_name", "required": True, "basis": A},
            {"field": "course_name", "required": True, "basis": A},
            {"field": "course_start_date", "required": True, "basis": A},
            {"field": "fee_amount", "required": True, "basis": A},
            {"field": "student_relationship", "required": True, "values": ["SELF", "CHILD", "SPOUSE", "SIBLING"], "basis": A},
        ],
        "disbursal_mode": {"value": "INSTITUTION when the fee schedule names a payee account, else BORROWER_ACCOUNT", "basis": A},
        "fast_track": {"value": False, "basis": A},
        "rate_for_assessment": {"value": 0.20, "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-05", "pricing": FLAT_RATE_BASIS, "use": RATE_USE},
    },
    "PL_HOME_RENOVATION": {
        "purpose": "home_renovation",
        "bajaj_description": {"chunk": "BFL-PL-OVERVIEW#003",
                              "quote": "A personal loan for home renovation can help cover expenses such as repairs, painting, flooring, kitchen upgrades, and bathroom improvements."},
        "amount_range_inr": {"value": [40000, 2500000], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-27"},
        "tenure_range_months": {"value": [12, 84], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-27"},
        "required_documents": {"value": ["CONTRACTOR_QUOTE|PROPERTY_PROOF"], "basis": A},
        "optional_documents": {"value": ["SITE_PHOTOS"], "basis": A},
        "purpose_fields": [
            {"field": "property_ownership", "required": True, "values": ["OWNED", "FAMILY_OWNED", "RENTED"], "basis": A},
            {"field": "property_pincode", "required": True, "basis": A},
            {"field": "renovation_scope", "required": False, "basis": A},
            {"field": "quote_amount", "required": False, "basis": A},
        ],
        "disbursal_mode": {"value": "BORROWER_ACCOUNT", "basis": "BAJAJ_DEFAULT", "chunk": "BFL-PL-OVERVIEW#015"},
        "fast_track": {"value": False, "basis": A},
        "rate_for_assessment": {"value": 0.20, "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-05", "pricing": FLAT_RATE_BASIS, "use": RATE_USE},
    },
    "PL_MEDICAL_EMERGENCY": {
        "purpose": "medical_emergency",
        "bajaj_description": {"chunk": "BFL-PL-OVERVIEW#002",
                              "quote": "Personal loan for medical emergencies With hassle-free application and quick disbursal, a personal loan for medical emergency can help you focus on the situation at hand"},
        "amount_range_inr": {"value": [40000, 2500000], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-28", "note": "Was A-28, Rs. 10 lakh."},
        "tenure_range_months": {"value": [12, 60], "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-28"},
        "required_documents": {"value": ["HOSPITAL_ESTIMATE|HOSPITAL_BILL"], "basis": A},
        "optional_documents": {"value": ["DOCTOR_PRESCRIPTION"], "basis": A},
        "purpose_fields": [
            {"field": "patient_relationship", "required": True, "values": ["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING"], "basis": A},
            {"field": "hospital_name", "required": True, "basis": A},
            {"field": "treatment_date", "required": True, "basis": A},
            {"field": "estimate_amount", "required": True, "basis": A},
        ],
        "disbursal_mode": {"value": "HOSPITAL when the estimate names a payee account, else BORROWER_ACCOUNT", "basis": A},
        "fast_track": {"value": True, "basis": A,
                       "note": "Bajaj describes 'quick disbursal' for this purpose (BFL-PL-OVERVIEW#002); a priority review queue is the Saral reading."},
        "rate_for_assessment": {"value": 0.20, "basis": A, "approval_status": "OWNER_APPROVED", "owner_decision": ADR_0011, "assumption_id": "A-05", "pricing": FLAT_RATE_BASIS, "use": RATE_USE},
    },
}

# Rules whose behaviour differs by product (all ASSUMPTION except PL-112 and PL-076).
PRODUCT_RULE_DIFFERENCES = {
    "PL-109": "amount cap per purpose",
    "PL-110": "tenure cap per purpose",
    "PL-111": "purpose document required (education, renovation, medical) or optional (wedding)",
    "PL-112": "declared purpose must equal the product purpose (Bajaj end-use clause)",
    "PL-126": "requested amount vs fee schedule / contractor quote / hospital estimate (not wedding)",
    "PL-127": "purpose window: wedding date, course start, property ownership, treatment date",
    "PL-128": "disbursal to institution (education) or hospital (medical) when a payee is named",
    "PL-123": "medical fast-track: review is prioritised, not skipped (ASSUMPTION)",
    "PL-130": "residency gate applies to home renovation only (owner decision 2026-11-04 10:15 IST); not evaluated for the other three",
}

BANDS = {"B1": (40000, 200000), "B2": (200001, 1000000), "B3": (1000001, 2500000), "B4": (2500001, 7500000)}
# B4 is above the MVP ceiling (ADR-0007 #1): a B4 request is sized down into B1..B3 and flagged outside what we offer.
MVP_BANDS = ("B1", "B2", "B3")
BAND_MVP_NOTE = {"B4": "outside the MVP: above the Rs. 25 lakh ceiling (ADR-0007 #1); never offered, so PL-123's always-review never fires"}

# ---- ZEN score floor (ADR-0009 #2, owner 2026-11-03 23:34 IST): stays 700; Bajaj's 650 is indicative only.
ZEN_SCORE_FLOOR = 700
BAJAJ_INDICATIVE_SCORE = 650
# Band rules (PL-120 / PL-122), prototype_synthetic. Band minimum scores are lifted to the 700 floor where they sat below it.
BAND_MIN_SCORE = {"B1": 700, "B2": 700, "B3": 700, "B4": 725}
BAND_MIN_EMPLOYMENT_MONTHS = {"B1": 6, "B2": 6, "B3": 12, "B4": 24}
BAND_EMPLOYER_CATEGORIES = {"B1": ["PUBLIC", "PRIVATE", "MNC"], "B2": ["PUBLIC", "PRIVATE", "MNC"],
                            "B3": ["PUBLIC", "PRIVATE", "MNC"], "B4": ["PUBLIC", "MNC"]}
# Flat MVP sizing parameters (each is the single value its own rule carries; a test pins the equality).
APPROVED_MAXIMUM_FOIR = 0.50      # PL-064, ADR-0011: flat for everyone (no PRIME/NTC variants), new EMI included
MIN_RESIDUAL_INCOME = 15000       # PL-065, ADR-0011
MAX_AMOUNT_INCOME_MULTIPLE = 24   # PL-108, ADR-0011: backstop only (FOIR 0.50 at 20% over <= 84 months binds near 22.5x)
NTC_INDICATIVE_CAP = 200000       # PL-118, ADR-0011
EVIDENCE_TOLERANCE = 1.10         # PL-126, prototype
B3_REVIEW_FOIR = 0.45             # PL-123, ADR-0011 keeps 0.45: a B3 amount above this FOIR goes to manual review, so sizing stays at or below it
B2_UPPER = 1000000
EVIDENCE_PRODUCTS = ("PL_HIGHER_EDUCATION", "PL_HOME_RENOVATION", "PL_MEDICAL_EMERGENCY")
BAJAJ_MAX_AMOUNT = 7500000        # PL-070 gate (Bajaj, indicative); above it the request is declined as outside what we offer
PURPOSE_TO_PRODUCT = {"wedding": "PL_WEDDING", "higher_education": "PL_HIGHER_EDUCATION",
                      "home_renovation": "PL_HOME_RENOVATION", "medical_emergency": "PL_MEDICAL_EMERGENCY"}
GRADE_MULTIPLIER = {"A": 24, "B": 20, "C": 15, "NTC": 8}
GRADE_FOIR = {"A": 0.55, "B": 0.50, "C": 0.45, "NTC": 0.40}
GRADE_BAND_CAP = {"A": None, "B": 2500000, "C": 1000000, "NTC": 200000}
BAJAJ_MIN_AMOUNT = 40000


def band_of(amount):
    for b, (lo, hi) in BANDS.items():
        if lo <= amount <= hi:
            return b
    return None


def emi(principal, annual_rate, months):
    r = annual_rate / 12
    return principal * r * (1 + r) ** months / ((1 + r) ** months - 1)


def principal_for(max_emi, annual_rate, months):
    if max_emi <= 0:
        return 0.0
    r = annual_rate / 12
    return max_emi * ((1 + r) ** months - 1) / (r * (1 + r) ** months)


def size_offer(requested_amount, tenure_months, product_id, risk_grade, monthly_net_income,
               existing_monthly_obligations=0, other_monthly_obligations=0):
    """DEFERRED reference (PL-125, risk-grade sizing). Not used in the MVP (ADR-0007 #3); see size_offer_flat (PL-129)."""
    p = PRODUCTS[product_id]
    rate = p["rate_for_assessment"]["value"]
    cap = p["amount_range_inr"]["value"][1]
    max_tenure = p["tenure_range_months"]["value"][1]
    tenure = min(tenure_months, max_tenure)
    obligations = existing_monthly_obligations + other_monthly_obligations
    max_emi = GRADE_FOIR[risk_grade] * monthly_net_income - obligations
    caps = {
        "requested": requested_amount,
        "product_cap": cap,
        "grade_band_cap": GRADE_BAND_CAP[risk_grade] or cap,
        "income_cap": GRADE_MULTIPLIER[risk_grade] * monthly_net_income,
        "foir_principal": principal_for(max_emi, rate, tenure),
    }
    binding = min(caps, key=caps.get)
    amount = math.floor(min(caps.values()) / 1000) * 1000
    offer_tenure = tenure
    if amount < requested_amount:
        # Try a longer tenure (up to the product max) before cutting the amount.
        caps_long = dict(caps, foir_principal=principal_for(max_emi, rate, max_tenure))
        amount_long = math.floor(min(caps_long.values()) / 1000) * 1000
        if amount_long > amount:
            amount, offer_tenure, binding, caps = amount_long, max_tenure, min(caps_long, key=caps_long.get), caps_long
    if amount >= requested_amount:
        outcome = "APPROVED" if offer_tenure == tenure_months else "COUNTER_OFFER"
        amount = requested_amount
    elif amount >= BAJAJ_MIN_AMOUNT:
        outcome = "COUNTER_OFFER"
    else:
        outcome, amount = "DECLINE", 0
    return {
        "offer_outcome": outcome,
        "eligible_amount": amount,
        "offer_tenure_months": offer_tenure if amount else None,
        "offer_emi": round(emi(amount, rate, offer_tenure)) if amount else None,
        "binding_cap": binding,
        "caps_at_offer_tenure": {k: round(v) for k, v in caps.items()},
        "internal_reason": f"grade {risk_grade}; binding cap {binding}; FOIR cap {GRADE_FOIR[risk_grade]}; "
                           f"max EMI {round(max_emi)} at {rate:.0%} over {offer_tenure} months",
    }


WORKED_EXAMPLES = [
    dict(name="Wedding, grade A, full approval", requested_amount=500000, tenure_months=60, product_id="PL_WEDDING",
         risk_grade="A", monthly_net_income=80000, existing_monthly_obligations=10000),
    dict(name="Higher education, grade C, amount reduced", requested_amount=1000000, tenure_months=36,
         product_id="PL_HIGHER_EDUCATION", risk_grade="C", monthly_net_income=45000, existing_monthly_obligations=6000),
    dict(name="Home renovation, grade B, same amount at a longer tenure", requested_amount=800000, tenure_months=36,
         product_id="PL_HOME_RENOVATION", risk_grade="B", monthly_net_income=60000, existing_monthly_obligations=8000),
    dict(name="Medical emergency, new to credit, capped at the NTC limit", requested_amount=400000, tenure_months=36,
         product_id="PL_MEDICAL_EMERGENCY", risk_grade="NTC", monthly_net_income=40000),
    dict(name="Wedding, grade C, obligations too high: decline", requested_amount=300000, tenure_months=36,
         product_id="PL_WEDDING", risk_grade="C", monthly_net_income=30000, existing_monthly_obligations=13000),
]


# ---------------------------------------------------------------- MVP flat sizing (PL-129)
def product_cap(product_id):
    return min(PRODUCTS[product_id]["amount_range_inr"]["value"][1], MVP_AMOUNT_CEILING)


def product_max_tenure(product_id):
    return PRODUCTS[product_id]["tenure_range_months"]["value"][1]


def flat_rate(product_id):
    return PRODUCTS[product_id]["rate_for_assessment"]["value"]


def band_cap(bureau_score, employment_months, employment_category):
    """Upper edge of the highest MVP band whose PL-120 / PL-122 requirements the applicant meets (None if none)."""
    best = None
    for b in MVP_BANDS:
        ok_score = bureau_score is not None and bureau_score >= BAND_MIN_SCORE[b]
        ok_emp = employment_months is None or employment_months >= BAND_MIN_EMPLOYMENT_MONTHS[b]
        ok_cat = employment_category is None or employment_category in BAND_EMPLOYER_CATEGORIES[b]
        if ok_score and ok_emp and ok_cat:
            best = BANDS[b][1]
    return best


def size_offer_flat(requested_amount, tenure_months, product_id, monthly_net_income,
                    existing_monthly_obligations=0, other_monthly_obligations=0, bureau_score=None,
                    bureau_match_status="HIT", employment_months=None, employment_category=None,
                    purpose_evidence_amount=None):
    """MVP offer sizing (PL-129): the largest passing amount at one flat rate per product, no risk grades.

    Every amount-dependent rule is evaluated at the candidate amount: PL-064 FOIR, PL-065 residual income,
    PL-108 income multiple, PL-109 product cap and MVP ceiling, PL-110 product max tenure, PL-118 new-to-credit
    cap, PL-120 / PL-122 band rules, PL-123 B3 FOIR review trigger, PL-126 purpose evidence. A request above any of them gets COUNTER_OFFER
    at the largest amount that passes them all (ADR-0007 #2), never a referral.
    """
    rate = flat_rate(product_id)
    max_tenure = product_max_tenure(product_id)
    tenure = min(tenure_months, max_tenure)
    obligations = existing_monthly_obligations + other_monthly_obligations
    max_emi = min(APPROVED_MAXIMUM_FOIR * monthly_net_income - obligations,
                  monthly_net_income - obligations - MIN_RESIDUAL_INCOME)
    ntc = bureau_match_status == "NO_HIT"
    caps = {
        "requested": requested_amount,
        "product_cap": product_cap(product_id),
        "income_cap": MAX_AMOUNT_INCOME_MULTIPLE * monthly_net_income,
        "foir_principal": principal_for(max_emi, rate, tenure),
    }
    if ntc:
        caps["ntc_cap"] = NTC_INDICATIVE_CAP
    else:
        bc = band_cap(bureau_score, employment_months, employment_category)
        caps["band_cap"] = bc if bc is not None else 0
    if product_id in EVIDENCE_PRODUCTS and purpose_evidence_amount:
        caps["evidence_cap"] = EVIDENCE_TOLERANCE * purpose_evidence_amount

    max_emi_b3 = min(B3_REVIEW_FOIR * monthly_net_income - obligations, max_emi)

    def best(c, months):
        amt, bind = math.floor(min(c.values()) / 1000) * 1000, min(c, key=c.get)
        if amt > B2_UPPER:  # PL-123: above Rs. 10 lakh, size at the B3 review FOIR so the offer needs no manual review
            c3 = dict(c, foir_principal=principal_for(max_emi_b3, rate, months))
            amt3 = math.floor(min(c3.values()) / 1000) * 1000
            if amt3 < amt:
                amt, bind = max(amt3, B2_UPPER), ("b3_review_foir" if amt3 > B2_UPPER else "b2_upper")
        return amt, bind

    amount, binding = best(caps, tenure)
    offer_tenure = tenure
    if amount < requested_amount and tenure < max_tenure:
        caps_long = dict(caps, foir_principal=principal_for(max_emi, rate, max_tenure))
        amount_long, binding_long = best(caps_long, max_tenure)
        if amount_long > amount:
            amount, offer_tenure, binding, caps = amount_long, max_tenure, binding_long, caps_long
    outside = requested_amount > MVP_AMOUNT_CEILING
    if requested_amount > BAJAJ_MAX_AMOUNT:
        outcome, amount = "DECLINE", 0
        binding = "outside_what_we_offer"
    elif amount >= requested_amount:
        amount = requested_amount
        outcome = "APPROVED" if offer_tenure == tenure_months else "COUNTER_OFFER"
    elif amount >= BAJAJ_MIN_AMOUNT:
        outcome = "COUNTER_OFFER"
    else:
        outcome, amount = "DECLINE", 0
    return {
        "offer_outcome": outcome,
        "eligible_amount": amount,
        "offer_tenure_months": offer_tenure if amount else None,
        "offer_emi": round(emi(amount, rate, offer_tenure)) if amount else None,
        "offer_rate": rate,
        "binding_cap": binding,
        "request_outside_mvp_range": outside,
        "caps_at_offer_tenure": {k: round(v) for k, v in caps.items()},
        "internal_reason": f"flat rate {rate:.0%}; binding cap {binding}; max EMI {round(max_emi)} over {offer_tenure} months"
                           + ("; request above the Rs. 25 lakh MVP ceiling" if outside else ""),
    }


def passes_all(amount, tenure_months, product_id, monthly_net_income, existing_monthly_obligations=0,
               other_monthly_obligations=0, bureau_score=None, bureau_match_status="HIT", employment_months=None,
               employment_category=None, purpose_evidence_amount=None):
    """True when ``amount`` at ``tenure_months`` passes every amount-dependent rule (test oracle for PL-129)."""
    if tenure_months > product_max_tenure(product_id) or amount > product_cap(product_id) or amount < BAJAJ_MIN_AMOUNT:
        return False
    obligations = existing_monthly_obligations + other_monthly_obligations
    new_emi = emi(amount, flat_rate(product_id), tenure_months)
    if (obligations + new_emi) / monthly_net_income > APPROVED_MAXIMUM_FOIR + 1e-9:
        return False
    if amount > B2_UPPER and (obligations + new_emi) / monthly_net_income > B3_REVIEW_FOIR + 1e-9:
        return False
    if monthly_net_income - obligations - new_emi < MIN_RESIDUAL_INCOME - 1e-6:
        return False
    if amount > MAX_AMOUNT_INCOME_MULTIPLE * monthly_net_income:
        return False
    if bureau_match_status == "NO_HIT":
        if amount > NTC_INDICATIVE_CAP:
            return False
    else:
        bc = band_cap(bureau_score, employment_months, employment_category)
        if bc is None or amount > bc:
            return False
    if product_id in EVIDENCE_PRODUCTS and purpose_evidence_amount and amount > EVIDENCE_TOLERANCE * purpose_evidence_amount:
        return False
    return True


FLAT_WORKED_EXAMPLES = [
    dict(name="Wedding, full approval", requested_amount=500000, tenure_months=60, product_id="PL_WEDDING",
         monthly_net_income=80000, existing_monthly_obligations=10000, bureau_score=760, employment_months=30,
         employment_category="PRIVATE"),
    dict(name="Higher education, Rs. 23 lakh inside the Rs. 25 lakh cap: full approval", requested_amount=2300000, tenure_months=84,
         product_id="PL_HIGHER_EDUCATION", monthly_net_income=150000, existing_monthly_obligations=5000, bureau_score=780,
         employment_months=60, employment_category="MNC", purpose_evidence_amount=2400000),
    dict(name="Home renovation, Rs. 40 lakh: outside what we offer, counter-offer within the Rs. 25 lakh ceiling",
         requested_amount=4000000, tenure_months=84, product_id="PL_HOME_RENOVATION", monthly_net_income=200000,
         existing_monthly_obligations=0, bureau_score=790, employment_months=72, employment_category="PUBLIC",
         purpose_evidence_amount=4200000),
    dict(name="Medical emergency, affordability: smaller amount", requested_amount=800000, tenure_months=36,
         product_id="PL_MEDICAL_EMERGENCY", monthly_net_income=45000, existing_monthly_obligations=6000, bureau_score=735,
         employment_months=20, employment_category="PRIVATE", purpose_evidence_amount=850000),
    dict(name="Wedding, obligations too high: decline", requested_amount=300000, tenure_months=36, product_id="PL_WEDDING",
         monthly_net_income=30000, existing_monthly_obligations=14500, bureau_score=720, employment_months=24,
         employment_category="PRIVATE"),
]
