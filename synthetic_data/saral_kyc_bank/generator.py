"""Deterministic linked applicant universe: identity, Aadhaar e-KYC, PAN, employment,
payslips, bank statement, bureau link, signatures, scenario labels. SYNTHETIC ONLY.

No wall-clock time and no unseeded randomness: every value derives from (seed, applicant
index, key) through SHA-256-seeded ``random.Random`` instances, exactly like the synthetic
bureau generator.
"""
from __future__ import annotations

import copy
import hashlib
import json
import random
from datetime import date, timedelta

from . import bank, bureau_link, catalogue, ids, product, signatures
from .scenarios import ALL_SCENARIOS, BY_ID, MATRIX_BUREAU, decision_path, hint, matrix_cell, plan

SCHEMA = "saral-synthetic-applicant/1"
GENERATION_VERSION = "saral-kyc-bank-v1"
DEFAULT_SEED = 20261103
AS_OF: date = bureau_link.BUREAU_AS_OF  # align with the bureau's DEFAULT_AS_OF (2026-10-24)
SPECIMEN = "SPECIMEN - SYNTHETIC - NOT A REAL PERSON OR DOCUMENT"
ASSESSMENT_RATE = 0.20  # ZEN proposal v2 A02 (assumption)
MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


def _rng(seed: int, key: str) -> random.Random:
    digest = hashlib.sha256(f"{seed}:{key}".encode()).digest()[:8]
    return random.Random(int.from_bytes(digest, "big"))


def _sid(prefix: str, seed: int, key: str, n: int = 10) -> str:
    """Stable id. The body starts with a letter, so no id can look like a 12-digit Aadhaar run."""
    h = hashlib.sha256(f"{seed}:{key}".encode()).hexdigest()[:n].upper()
    return prefix + chr(ord("A") + int(h[0], 16)) + h[1:]


def ids_for(index: int) -> tuple[str, str]:
    """Space-free ids accepted by BureauReportRequest (^[A-Za-z0-9][A-Za-z0-9_-]*$)."""
    return f"SYN-APP-{index + 1:04d}", f"SYN-SARAL-{index + 1:04d}"


def emi(principal: float, annual_rate: float, months: int) -> int:
    r = annual_rate / 12
    return round(principal * r * (1 + r) ** months / ((1 + r) ** months - 1))


def _months_between(start: date, end: date) -> int:
    m = (end.year - start.year) * 12 + (end.month - start.month)
    return max(0, m - (1 if end.day < start.day else 0))


def _years_before(d: date, years: int, extra_days: int) -> date:
    try:
        base = d.replace(year=d.year - years)
    except ValueError:  # 29 Feb
        base = d.replace(year=d.year - years, day=28)
    return base - timedelta(days=extra_days)


def _add_months(d: date, months: int) -> date:
    total = d.year * 12 + d.month - 1 + months
    return date(total // 12, total % 12 + 1, min(d.day, 28))


# --------------------------------------------------------------------------- pieces

def _name_variant(rng: random.Random, given: str, surname: str) -> tuple[str, str]:
    kind = rng.choice(["INITIAL", "SPELLING", "ORDER"])
    if kind == "INITIAL":
        return f"{given[0]} {surname}", kind
    if kind == "ORDER":
        return f"{surname} {given}", kind
    i = rng.randrange(1, len(given))
    return given[:i] + given[i - 1] + given[i:] + f" {surname}", kind  # doubled letter


def _identity(i: int, sc: str, seed: int, low_floor_city: bool = False) -> dict:
    rng = _rng(seed, f"{i}:identity")
    female = rng.random() < 0.5
    given = rng.choice(catalogue.GIVEN_FEMALE if female else catalogue.GIVEN_MALE)
    surname = rng.choice(catalogue.SURNAMES)
    if sc == "UNDER_21":
        dob = _years_before(AS_OF, 19, rng.randint(20, 300))
    elif sc == "OVER_AGE_AT_MATURITY":
        dob = _years_before(AS_OF, 74, rng.randint(20, 300))
    else:
        dob = _years_before(AS_OF, rng.randint(24, 52), rng.randint(0, 364))
    city, state, metro = rng.choice(catalogue.CITIES)
    if sc == "RESIDUAL_INCOME_LOW" or low_floor_city:  # keep the 25,001 floor so only the target fails
        city, state, metro = next(c for c in catalogue.CITIES if c[0] not in product.HIGH_FLOOR_CITIES)
    address = {
        "house": f"{rng.randint(1, 99)}-{rng.randint(1, 999)}",
        "street": rng.choice(catalogue.STREETS),
        "locality": f"Specimen Ward {rng.randint(1, 40)}",
        "city": city, "district": city, "state": state,
        "pincode": ids.synthetic_pincode(rng), "country": "IN",
    }
    return {
        "synthetic": True,
        "given_name": given, "surname": surname, "full_name": f"{given} {surname}",
        "father_name": f"{rng.choice(catalogue.FATHER_GIVEN)} {surname}",
        "gender": "F" if female else "M",
        "date_of_birth": dob.isoformat(),
        "address": address,
        "city": city, "state": state, "metro_city": metro,
        "months_at_address": 5 if sc == "SHORT_ADDRESS_TENURE" else rng.randint(14, 120),
        "income_floor": product.income_floor(city),
        "phone": ids.synthetic_phone(rng),
        "email": f"syn.app.{i + 1:04d}@example.invalid",
        "nationality": "IN",
        "residency_status": "NRI" if sc == "NON_RESIDENT" else "RESIDENT",
    }


def _aadhaar(i: int, sc: str, seed: int, ident: dict) -> tuple[dict, str]:
    rng = _rng(seed, f"{i}:aadhaar")
    uid = ids.synthetic_aadhaar(rng)
    dob = ident["date_of_birth"]
    yob_only = sc == "IDENTITY_INCOMPLETE"
    a = ident["address"]
    poa = {"care_of": f"S/O {ident['father_name']}" if ident["gender"] == "M" else f"D/O {ident['father_name']}",
           "house": None if yob_only else a["house"], "street": None if yob_only else a["street"],
           "locality": a["locality"], "vtc": a["city"], "district": a["district"], "state": a["state"],
           "pincode": a["pincode"], "country": "India"}
    issued = date(2014 + rng.randint(0, 9), rng.randint(1, 12), rng.randint(1, 28))
    # saral-kyc-aadhaar/1 (contracts/synthetic_sources.json SYNTHETIC_AADHAAR, reconciled one-to-one). The full number is
    # never in the record: it stays in the applicant's specimen_truth (for rendering SPECIMEN cards only).
    line = None if yob_only else f"{ids.mask_house(poa['house'])}, {poa['street']}"
    rec = {
        "schema": "saral-kyc-aadhaar/1",
        "synthetic": True,
        "specimen_marker": SPECIMEN + " (not a UIDAI record)",
        "provider": {"name": "saral-synthetic-kyc", "synthetic": True},
        "record_id": _sid("EKYC-", seed, f"{i}:ekyc"),
        "aadhaar_last4": uid[-4:],
        "verification_status": "VERIFIED_SYNTHETIC_EKYC" if not yob_only else "PARTIAL",
        "name": ident["full_name"], "dob": None if yob_only else dob, "year_of_birth": int(dob[:4]),
        "gender": ident["gender"], "care_of": poa["care_of"],
        "address": {"line_masked": line, "locality": poa["locality"], "city": poa["vtc"], "district": poa["district"],
                    "state": poa["state"], "pincode": poa["pincode"], "country": poa["country"]},
        "issue_date": issued.isoformat(),
        "verified_at": f"{AS_OF.isoformat()}T10:00:00+05:30",
    }
    return rec, uid


def _pan(i: int, sc: str, seed: int, ident: dict) -> tuple[dict, str, dict]:
    rng = _rng(seed, f"{i}:pan")
    number = ids.synthetic_pan(rng, ident["surname"])
    variant, kind = _name_variant(rng, ident["given_name"], ident["surname"])
    name = variant if sc == "NAME_MISMATCH_PAN" else ident["full_name"]
    dob = date.fromisoformat(ident["date_of_birth"])
    if sc == "DOB_MISMATCH_PAN":
        dob = dob + timedelta(days=rng.choice([-400, -35, 31, 366]))
    # saral-kyc-pan/1 (contracts/synthetic_sources.json SYNTHETIC_PAN, reconciled one-to-one). No full PAN in the record.
    rec = {
        "schema": "saral-kyc-pan/1",
        "synthetic": True,
        "specimen_marker": SPECIMEN + " (not an Income Tax Department record)",
        "provider": {"name": "saral-synthetic-kyc", "synthetic": True},
        "record_id": _sid("PANR-", seed, f"{i}:pan"),
        "pan_masked": ids.mask_pan(number),
        "pan_status": "VALID_SYNTHETIC",
        "holder_type": "P",
        "name_on_pan": name.upper(),
        "father_name_on_pan": ident["father_name"].upper(),
        "dob_on_pan": dob.isoformat(),
        "pan_aadhaar_linked": True,
        "issue_date": date(2012 + rng.randint(0, 10), rng.randint(1, 12), rng.randint(1, 28)).isoformat(),
        "verified_at": f"{AS_OF.isoformat()}T10:01:00+05:30",
    }
    variant_info = {"name": variant.upper(), "kind": kind, "used": sc == "NAME_MISMATCH_PAN"}
    return rec, number, variant_info


def _doc_id(seed: int, key: str) -> str:
    """Contract-style synthetic document id (contracts/common.py SYNTHETIC_ID_PATTERN)."""
    return _sid("SYN-DOC-", seed, f"doc:{key}", 12)


def _employer(sc: str, rng: random.Random) -> dict:
    if sc == "INELIGIBLE_EMPLOYER_CATEGORY":
        return dict(rng.choice(catalogue.INELIGIBLE_EMPLOYERS))
    if sc == "EMPLOYER_CAUTION_LIST":
        e = dict(rng.choice(catalogue.CAUTION_EMPLOYERS))
        e.pop("reason")
        return e
    return dict(rng.choice(catalogue.EMPLOYERS))


def _payslip_numbers(target_net: int) -> dict:
    gross = target_net
    for _ in range(30):
        basic = round(gross * 0.5)
        pf = round(min(basic, 15_000) * 0.12)
        tds = round(max(0, gross - 50_000) * 0.08)
        gross = target_net + pf + 200 + tds
    basic = round(gross * 0.5)
    hra = round(gross * 0.2)
    pf = round(min(basic, 15_000) * 0.12)
    tds = round(max(0, gross - 50_000) * 0.08)
    ded = {"provident_fund": pf, "professional_tax": 200, "tds": tds}
    return {"gross": gross, "earnings": {"basic": basic, "hra": hra, "special_allowance": gross - basic - hra},
            "deductions": ded, "total_deductions": sum(ded.values()), "net": gross - sum(ded.values())}


def _jitter(amount: int, rng: random.Random, floor: int) -> int:
    """Up to 12% below the band pick, in 5,000s, never below the band floor."""
    return max(floor, int(amount * rng.uniform(0.88, 1.0) // 5_000 * 5_000))


EXISTING_EMI_ESTIMATE = 11_000  # native pass history: PL 5,000 + auto 6,000


def _loan_design(i: int, sc: str, occ: int, rng: random.Random, city: str) -> dict:
    """Income, request and the expected label (product, band, path, counter-offer)."""
    purposes = product.PURPOSES
    purpose = purposes[(i + occ) % 4]
    counter = None
    path = decision_path(BY_ID[sc]) if not sc.startswith("MATRIX_") else None
    decline_reason = None
    existing = EXISTING_EMI_ESTIMATE

    def generic(p: str, foir_lo=0.25, foir_hi=0.42):
        bands = ["B1", "B2", "B3"]
        _lo, _hi, picks = product.BANDS[bands[(i // 4 + occ) % 3]]
        amount = min(_jitter(rng.choice(picks), rng, _lo), product.PRODUCTS[p]["max_amount"])
        cap_t = product.PRODUCTS[p]["max_tenure"]
        tenure = rng.choice([t for t in (24, 36, 48, 60, 72, 84) if t <= cap_t])
        income = product.approve_income(amount, tenure, existing, city, rng.uniform(foir_lo, foir_hi))
        return amount, tenure, income

    if sc.startswith("MATRIX_"):
        purpose, band = matrix_cell(occ)
        picks = product.BANDS[band][2]
        amount = _jitter(picks[(occ // 16 + occ) % len(picks)], rng, product.BANDS[band][0])
        cap = product.PRODUCTS[purpose]
        if band == "B4" and sc != "MATRIX_DECLINE":
            # Deliberate out-of-range request (> Rs. 25 lakh): outside what we offer. ADR-0007 #1/#2: offered the
            # largest passing amount within the cap (COUNTER_OFFER), never a referral; B4 is never offered.
            d = product.design_counter(amount, purpose, existing, city, "REDUCED_AMOUNT")
            tenure, income, counter = d["tenure"], d["income"], d
            path = "COUNTER_OFFER"
        elif sc == "MATRIX_APPROVE":
            if amount > cap["max_amount"]:
                d = product.design_counter(amount, purpose, existing, city, "REDUCED_AMOUNT")
                tenure, income, counter = d["tenure"], d["income"], d
                path = "COUNTER_OFFER"
            else:
                tenure = rng.choice([t for t in (24, 36, 48, 60, 72, 84) if t <= cap["max_tenure"]])
                income = product.approve_income(amount, tenure, existing, city, rng.uniform(0.25, 0.42))
                path = "APPROVE"
        elif sc == "MATRIX_COUNTER_OFFER":
            kind = "LONGER_TENURE" if ((occ % 4) + (occ // 4)) % 2 == 0 else "REDUCED_AMOUNT"
            d = product.design_counter(amount, purpose, existing, city, kind)
            tenure, income, counter = d["tenure"], d["income"], d
            path = "COUNTER_OFFER"
        else:
            tenure = rng.choice([t for t in (24, 36, 48, 60) if t <= cap["max_tenure"]])
            income = product.approve_income(min(amount, cap["max_amount"]), tenure, existing, city, 0.35)
            decline_reason = list(MATRIX_BUREAU)[(occ + occ // 4) % 4]
            path = "DECLINE:" + ("CREDIT_SCORE" if decline_reason == "LOW_SCORE" else "DELINQUENCY")
        loan = {"purpose": purpose, "amount": amount, "tenure_months": tenure}
    elif sc == "LOW_INCOME":
        loan, income = {"purpose": purpose, "amount": 60_000, "tenure_months": 36}, 23_500
    elif sc == "FOIR_BREACH":
        loan, income = {"purpose": "home_renovation", "amount": 600_000, "tenure_months": 48}, 40_000
        counter = {"kind": "REDUCED_AMOUNT", "counter_tenure": 48, "cap_limited": False,
                   "counter_amount": product.max_affordable_amount(48, 40_000, existing, "home_renovation")}
        if counter["counter_amount"] == 0:
            counter = None
            path = "DECLINE:AFFORDABILITY"
    elif sc == "RESIDUAL_INCOME_LOW":
        loan, income = {"purpose": "medical_emergency", "amount": 50_000, "tenure_months": 36}, 27_500
    elif sc == "PURPOSE_OVER_CAP":
        loan, income = {"purpose": "wedding", "amount": 2_800_000, "tenure_months": 60}, 250_000
    elif sc == "AMOUNT_BELOW_MIN":
        loan, income = {"purpose": purpose, "amount": 30_000, "tenure_months": 12}, rng.choice([52_000, 68_000])
    elif sc == "TENURE_OUT_OF_RANGE":
        loan, income = {"purpose": "home_renovation", "amount": 400_000, "tenure_months": 120}, 75_000
    elif sc == "OVER_AGE_AT_MATURITY":
        amount, _t, income = generic("higher_education")
        loan = {"purpose": "higher_education", "amount": amount, "tenure_months": 84}
    elif sc in ("HOME_QUOTE_BELOW_AMOUNT",):
        amount, tenure, income = generic("home_renovation")
        loan = {"purpose": "home_renovation", "amount": amount, "tenure_months": tenure}
    elif sc == "EDU_ADMISSION_MISSING":
        amount, tenure, income = generic("higher_education")
        loan = {"purpose": "higher_education", "amount": amount, "tenure_months": tenure}
    else:
        amount, tenure, income = generic(purpose)
        loan = {"purpose": purpose, "amount": amount, "tenure_months": tenure}

    declared_purpose = loan["purpose"]
    product_purpose = loan["purpose"]
    if sc == "PURPOSE_NOT_OFFERED":
        declared_purpose = rng.choice(product.NOT_OFFERED)
        product_purpose = None
    if sc == "PURPOSE_PRODUCT_MISMATCH":
        product_purpose, declared_purpose = "wedding", "medical_emergency"
        loan["amount"] = min(loan["amount"], 1_000_000)
        loan["tenure_months"] = min(loan["tenure_months"], 60)
    return {"income": income, "loan": loan, "declared_purpose": declared_purpose,
            "product_purpose": product_purpose, "path": path, "counter": counter,
            "decline_reason": decline_reason}


def _employment(i: int, sc: str, seed: int, nets: list[int], pay_months: list[date]) -> dict:
    """Salaried only (MVP decision 2026-11-03)."""
    rng = _rng(seed, f"{i}:employment")
    emp = _employer(sc, rng)
    etype = {"PROBATION_SHORT_TENURE": "PROBATION", "CONTRACT_EMPLOYMENT": "CONTRACT"}.get(sc, "PERMANENT")
    cur_months = {"PROBATION_SHORT_TENURE": 4, "EMPLOYMENT_GAP": 7, "UNDER_21": 10,
                  "EMPLOYER_CHURN": 8}.get(sc) or rng.randint(18, 110)
    start = _add_months(AS_OF, -cur_months)

    def job(name, cat, s, e, t):
        return {"synthetic": True, "employer_name": name, "category": cat, "start_date": s.isoformat(),
                "end_date": e.isoformat() if e else None, "employment_type": t}

    history = [job(emp["name"], emp["category"], start, None, etype)]
    others = [e for e in catalogue.EMPLOYERS if e["name"] != emp["name"]]
    if sc == "EMPLOYMENT_GAP":
        prev_end = _add_months(start, -9)
        history.append(job(others[i % len(others)]["name"], "PRIVATE", _add_months(prev_end, -4), prev_end,
                           "CONTRACT"))
    elif sc == "EMPLOYER_CHURN":
        end = start - timedelta(days=10)
        for k in range(3):
            s = _add_months(end, -5)
            history.append(job(others[(i + k) % len(others)]["name"], "PRIVATE", s, end, "PERMANENT"))
            end = s - timedelta(days=10)
        history.append(job(others[(i + 3) % len(others)]["name"], "PRIVATE", _add_months(end, -30), end,
                           "PERMANENT"))
    elif cur_months < 60 and sc not in ("UNDER_21", "PROBATION_SHORT_TENURE"):
        prev_end = start - timedelta(days=rng.randint(5, 40))
        history.append(job(others[(i + 5) % len(others)]["name"], "PRIVATE",
                           _add_months(prev_end, -rng.randint(12, 48)), prev_end, "PERMANENT"))
    total_exp = sum(_months_between(date.fromisoformat(h["start_date"]),
                                    date.fromisoformat(h["end_date"]) if h["end_date"] else AS_OF) for h in history)
    gaps = [_months_between(date.fromisoformat(o["end_date"]), date.fromisoformat(n["start_date"]))
            for n, o in zip(history, history[1:])]
    window = AS_OF - timedelta(days=730)
    changes_24m = sum(1 for h in history[1:] if h["end_date"] and date.fromisoformat(h["end_date"]) >= window)
    if len(nets) < 3:  # short statement (MISSING_DOCUMENTS): payslips still cover 3 months
        nets = [nets[0]] * (3 - len(nets)) + list(nets)
        pay_months = [_add_months(pay_months[-1], k) for k in (-2, -1, 0)]
    slip_months = pay_months[-3:]
    if sc == "DOCUMENT_STALE":
        slip_months = [_add_months(m, -3) for m in slip_months]
    designation = rng.choice(catalogue.DESIGNATIONS)
    payslips = []
    for pm, net in zip(slip_months, nets[-3:]):
        slip_net = round(net * 1.25) if sc == "PAYSLIP_BANK_MISMATCH" else net
        nums = _payslip_numbers(slip_net)
        period_end = _add_months(pm, 1) - timedelta(days=1)
        payslips.append({"synthetic": True, "specimen_marker": SPECIMEN,
                         "record_id": _sid("SLIP-", seed, f"{i}:slip:{pm.isoformat()}"),
                         "document_id": _doc_id(seed, f"{i}:slip:{pm.isoformat()}"),
                         "pay_period": pm.strftime("%Y-%m"), "document_date": period_end.isoformat(),
                         "employer_name": emp["name"], "designation": designation, **nums})
    return {
        "synthetic": True,
        "applicant_profile": "SALARIED",
        "employer_name": emp["name"],
        "employer_category": emp["category"],
        "employer_narration": emp.get("narration", ""),
        "employment_type": etype,
        "employment_start_date": start.isoformat(),
        "months_with_current_employer": cur_months,
        "total_experience_months": total_exp,
        "employment_gap_months": gaps,
        "employer_changes_24m": changes_24m,
        "history": history,
        "payslips": payslips,
    }


def _salary_credits(sc, emp, nets, months, salary_day) -> list[dict]:
    out = []
    narr_emp = emp["employer_narration"]
    if sc == "EMPLOYER_NAME_MISMATCH":
        narr_emp = next(e["narration"] for e in catalogue.EMPLOYERS if e["narration"] != narr_emp)
    for k, (ms, net) in enumerate(zip(months, nets)):
        if sc == "SALARY_MISSING_MONTH" and k == len(months) - 2:
            continue
        pm = _add_months(ms, -1)
        out.append({"date": date(ms.year, ms.month, salary_day), "paise": net * 100, "mode": "NEFT", "tag": "SALARY",
                    "narration": f"NEFT CR SAL {narr_emp} {MONTHS_SHORT[pm.month - 1]}{pm.year % 100}"})
    return out


def _cash_credits(nets, months, rng) -> list[dict]:
    out = []
    for ms, net in zip(months, nets):
        for _ in range(4):
            out.append({"date": date(ms.year, ms.month, rng.randint(6, 21)), "paise": int(net * 1.4 * 25),
                        "mode": "CASH", "tag": "CASH_DEPOSIT", "narration": "CASH DEP SELF SPECIMEN BRANCH"})
    return out


def _monthly_nets(sc: str, income: int, n: int, rng: random.Random) -> list[int]:
    if sc == "INCOME_DROP":
        return [income] * (n - 3) + [round(income * 0.65 / 100) * 100] * 3
    if sc == "SALARY_IRREGULAR":
        cycle = [0.55, 1.45, 0.8, 1.3, 0.6, 1.5]
        return [round(income * cycle[(k + rng.randint(0, 1)) % 6] / 100) * 100 for k in range(n)]
    return [income] * n


def _ocr(i: int, sc: str, seed: int, aadhaar: dict, pan: dict, pan_number: str, employment: dict, stmt: dict) -> list[dict]:
    """Simulated OCR extractions (what the OCR chain would read, with field confidence).
    SIMULATED: the real values come from running the OCR chain on rendered documents."""
    rng = _rng(seed, f"{i}:ocr")

    def conf():
        return rng.randint(84, 98)

    pan_read = pan_number
    if sc == "PAN_FORMAT_INVALID":
        pan_read = pan_read[:5] + pan_read[5:9].replace("0", "O", 1) if "0" in pan_read[5:9] else \
            pan_read[:5] + "O" + pan_read[6:]
    # Keys are the contract's OCR keys (contracts/document_extraction.py FIELD_KEYS + the Paddle chain block); identifiers are
    # read masked, so no extraction carries a full PAN or Aadhaar.
    a = aadhaar["address"]
    out = [
        ("pan_card", _doc_id(seed, f"{i}:pan"), aadhaar["verified_at"][:10], 1,
         {"pan_number": ("XXXXX" + pan_read[5:9] + "X", conf()), "name": (pan["name_on_pan"], conf()),
          "date_of_birth": (pan["dob_on_pan"], conf())}),
        ("aadhaar_card", _doc_id(seed, f"{i}:aadhaar"), aadhaar["issue_date"], 1,
         {"aadhaar_number": ("XXXX XXXX " + aadhaar["aadhaar_last4"], conf()), "name": (aadhaar["name"], conf()),
          "date_of_birth": (aadhaar["dob"], conf()), "gender": (aadhaar["gender"], conf()),
          "address": (f"{a['locality']}, {a['city']} {a['pincode']}", conf())}),
    ]
    for k, slip in enumerate(employment["payslips"]):
        c = 41 if (sc == "OCR_LOW_CONFIDENCE" and k == len(employment["payslips"]) - 1) else conf()
        basic = slip["earnings"]["basic"]
        out.append(("salary_slip", slip["document_id"], slip["document_date"], 1,
                    {"employee_name": (aadhaar["name"].upper(), conf()),
                     "employer_name": (slip["employer_name"], conf()), "pay_period": (slip["pay_period"], conf()),
                     "salary_date": (slip["document_date"], conf()), "basic_salary": (basic, conf()),
                     "gross_salary": (slip["gross"], conf()), "total_deductions": (slip["total_deductions"], conf()),
                     "net_salary": (slip["net"], c)}))
    sal = [t for t in stmt["transactions"] if t["category"] == "SALARY"]
    sm = stmt["summary"]
    out.append(("bank_statement", _doc_id(seed, f"{i}:stmt"), stmt["period"]["to"], max(1, len(stmt["transactions"]) // 40 + 1),
                {"account_holder": (stmt["account"]["holder_name"], conf()),
                 "statement_period": (f"{stmt['period']['from']}..{stmt['period']['to']}", conf()),
                 "salary_credits": ([t["amount"] for t in sal], conf()),
                 "salary_credit_months": (len({t["date"][:7] for t in sal}), conf()),
                 "total_credits": (sm["total_credits"], conf()), "total_debits": (sm["total_debits"], conf()),
                 "closing_balance": (sm["closing_balance"], conf()), "transaction_count": (sm["txn_count"], 99)}))
    res = []
    for kind, doc_id, doc_date, pages, fields in out:
        confs = {k: v[1] for k, v in fields.items()}
        res.append({"extraction_id": _sid("SYN-EXT-", seed, f"{i}:ext:{doc_id}", 12), "document_kind": kind,
                    "document_id": doc_id, "synthetic": True, "simulated": True,
                    "fields": {k: {"value": v[0], "confidence": v[1]} for k, v in fields.items()},
                    "chain": {"ocr_route": "SIMULATED", "ocr_needs_manual_review": min(confs.values()) < 60,
                              "field_confidence": confs},
                    "document": {"sha256": _b32_doc(seed, doc_id), "date": doc_date, "pages": pages}})
    return res


def _b32_doc(seed: int, doc_id: str) -> str:
    """Document hash in base32 (a hex digest could form a 12-digit run the contracts' Aadhaar regex rejects)."""
    import base64  # noqa: PLC0415
    return "b32:" + base64.b32encode(hashlib.sha256(f"{seed}:{doc_id}".encode()).digest()).decode().rstrip("=")[:32]


def _signature_screening(sig: dict, rng: random.Random) -> dict:
    """Simulated screening output in the bands the OCR bake-off reported (screening only)."""
    label = sig["label"]
    # Keys follow the contract's OCR signature.* block (present, similarity, anomaly_score, crop_sha256, method).
    if label == "MISSING":
        return {"synthetic": True, "simulated": True, "present": False, "similarity": None, "anomaly_score": None,
                "crop_sha256": None, "method": "SIMULATED"}
    sim = {"GENUINE_MATCH": (0.84, 0.95), "SKILLED_FORGERY": (0.55, 0.74), "RANDOM_FORGERY": (0.18, 0.40)}[label]
    s = round(rng.uniform(*sim), 3)
    import base64  # noqa: PLC0415
    crop = "b32:" + base64.b32encode(hashlib.sha256(json.dumps(sig["form_signature"]["strokes"]).encode()).digest()).decode()[:32]
    return {"synthetic": True, "simulated": True, "present": True, "similarity": s, "anomaly_score": round(1 - s, 3),
            "crop_sha256": crop, "method": "SIMULATED"}


# --------------------------------------------------------------------------- applicant

def build_applicant(i: int, sc_id: str, *, seed: int, registry: dict, occ: int = 0) -> tuple[dict, dict, dict]:
    """Return (applicant record, bank statement, bureau case)."""
    sc = BY_ID[sc_id]
    applicant_id, application_id = ids_for(i)
    rng = _rng(seed, f"{i}:core")
    original = registry.get(0)

    small_counter = sc_id == "MATRIX_COUNTER_OFFER" and matrix_cell(occ)[1] == "B1"
    ident = _identity(i, sc_id, seed, low_floor_city=small_counter)
    aadhaar, uid = _aadhaar(i, sc_id, seed, ident)
    pan, pan_number, pan_variant = _pan(i, sc_id, seed, ident)
    writer_key = f"{i}:writer"
    if sc_id == "DUPLICATE_APPLICANT" and original:
        ident = copy.deepcopy(original["identity"])
        aadhaar = copy.deepcopy(original["aadhaar_ekyc"])
        pan = copy.deepcopy(original["pan"])
        uid, pan_number = original["specimen_truth"]["aadhaar_uid"], original["specimen_truth"]["pan_number"]
        pan_variant = copy.deepcopy(original["specimen_truth"]["pan_name_variant"])
        writer_key = "0:writer"
    if sc_id == "SHARED_CONTACT" and original:
        ident["phone"] = original["identity"]["phone"]

    design = _loan_design(i, sc_id, occ, rng, ident["city"])
    income, loan = design["income"], design["loan"]
    months_n = 12 if sc_id in ("INCOME_DROP", "SALARY_IRREGULAR") else (2 if sc_id == "MISSING_DOCUMENTS" else 6)
    period_end = AS_OF - timedelta(days=3)
    months = bank.month_starts(period_end, months_n)
    nets = _monthly_nets(sc_id, income, months_n, rng)
    pay_months = [_add_months(m, -1) for m in months]
    employment = _employment(i, sc_id, seed, nets, pay_months)
    if sc_id == "DUPLICATE_DOCUMENT" and original:
        employment["payslips"] = copy.deepcopy(original["employment"]["payslips"])

    # ---- bureau
    spec = sc.bureau
    if sc_id == "LOW_INCOME":
        spec = "overlay:AGED+DROP_AUTO"
    if design["decline_reason"]:
        spec = MATRIX_BUREAU[design["decline_reason"]]
    linked = bureau_link.build_linked_report(
        application_id=application_id, applicant_id=applicant_id, bureau_spec=spec, seed=seed,
        target_score=rng.randint(735, 800), aged_months=rng.randint(30, 72))
    linked["request"] = bureau_link.request_for(application_id, applicant_id)
    report = linked["report"]
    on_file = {"synthetic": True, "name": ident["full_name"], "dob": ident["date_of_birth"],
               "address_city": ident["city"], "address_pincode": ident["address"]["pincode"],
               "pan_masked": pan["pan_masked"]}
    if sc_id == "NAME_MISMATCH_BUREAU":
        on_file["name"] = _name_variant(_rng(seed, f"{i}:bureau-name"), ident["given_name"], ident["surname"])[0]
    if sc_id == "DOB_MISMATCH_BUREAU":
        on_file["dob"] = (date.fromisoformat(ident["date_of_birth"]) + timedelta(days=366)).isoformat()
    if sc_id == "ADDRESS_MISMATCH_BUREAU":
        other = next(c for c in catalogue.CITIES if c[0] != ident["city"])
        on_file["address_city"], on_file["address_pincode"] = other[0], ids.synthetic_pincode(rng)
    if sc_id == "BUREAU_IDENTITY_MISMATCH":
        on_file["name"] = f"{rng.choice(catalogue.GIVEN_MALE)} {ident['surname']}"
    if report is None or not report["accounts"]:
        on_file = None
    # Synthetic history the bureau-report/1 contract cannot carry (score and exposure 6/12 months ago).
    history_sidecar = None
    if report and report["score"]["value"] is not None:
        drift = -60 if sc_id in ("DPD_60", "DPD_90", "WRITTEN_OFF", "CURRENT_DEFAULT") else rng.randint(-10, 15)
        exposure = sum(a["current_balance"] for a in report["accounts"])
        history_sidecar = {"synthetic": True, "scores": [
            {"as_of": _add_months(AS_OF, -12).isoformat(), "value": max(300, min(900, report["score"]["value"] - drift))},
            {"as_of": _add_months(AS_OF, -6).isoformat(), "value": max(300, min(900, report["score"]["value"] - drift // 2))}],
            "exposure_12m_ago": int(exposure * (0.55 if sc_id == "NEW_ACCOUNTS_STACKING" else rng.uniform(0.95, 1.25)))}

    # ---- obligations: bureau installment EMIs are what the bank must show
    inst = bureau_link.installment_obligations(report)
    emis = []
    for a in inst:
        lender = catalogue.BUREAU_LENDERS[a["account_type"]]
        ref = "LN-" + hashlib.sha256(f"{seed}:{applicant_id}:{a['account_id']}".encode()).hexdigest()[:8].upper()
        skip = ()
        if sc_id == "EMI_DEBIT_MISSING" and a["account_type"] == "AUTO_LOAN":
            skip = tuple((m.year, m.month) for m in months[-2:])
        emis.append({"lender": lender, "loan_ref": ref, "paise": a["monthly_obligation"] * 100,
                     "day": 5 if a["account_type"] == "PERSONAL_LOAN" else 10,
                     "start": _add_months(date.fromisoformat(a["opened_on"]), 1),
                     "tag": "EMI_BUREAU", "bureau_account_id": a["account_id"], "skip": skip})
    bureau_emi_total = sum(a["monthly_obligation"] for a in inst)
    undeclared = None
    if sc_id == "UNDECLARED_DEBT":
        undeclared = {"lender": rng.choice(catalogue.UNDECLARED_LENDERS), "monthly_obligation": 4_500}
        emis.append({"lender": undeclared["lender"], "loan_ref": "LN-" + _sid("", seed, f"{i}:undeclared", 8),
                     "paise": 450_000, "day": 7, "start": _add_months(AS_OF, -9), "tag": "EMI_UNDECLARED"})
    bounces = []
    if sc_id == "BOUNCE_HEAVY" and emis:
        e0 = emis[0]
        for k, mode in ((-3, "NACH"), (-2, "ECS"), (-1, "NACH")):
            bounces.append({"month_index": k, "kind": mode, "day": e0["day"], "paise": e0["paise"],
                            "lender": e0["lender"], "loan_ref": e0["loan_ref"], "represent_day": e0["day"] + 9,
                            "tag": "EMI_BUREAU"})
        e0["skip"] = tuple((m.year, m.month) for m in months[-3:])
        bounces.append({"month_index": -2, "kind": "CHEQUE", "day": 14, "paise": 1_250_000})

    card = next((a for a in (report or {}).get("accounts", []) if a["account_type"] == "CREDIT_CARD"), None)
    card_pay = max(100_000, card["current_balance"] * 5) if card else 0  # ~5% of balance, in paise
    salary_day = rng.randint(1, 4)
    credits = _salary_credits(sc_id, employment, nets, months, salary_day)
    if sc_id == "CASH_HEAVY":
        credits += _cash_credits(nets, months, rng)
    reversal = None
    if sc_id == "SALARY_REVERSAL":
        rev = [c for c in credits if c["tag"] == "SALARY"][-2]
        reversal = {"date": rev["date"] + timedelta(days=2), "paise": rev["paise"],
                    "employer": employment["employer_narration"]}
    fixed = sum(e["paise"] for e in emis) / 100 + card_pay / 100
    rent = 0 if rng.random() < 0.4 else round(income * rng.uniform(0.08, 0.14) / 100) * 10_000
    avg_income = sum(nets) / len(nets)
    spend = max(0.08 * avg_income, 0.78 * avg_income - fixed - rent / 100)
    holder = ident["full_name"].upper()
    if sc_id == "NAME_MISMATCH_BANK":
        holder = f"{ident['given_name'].upper()} {rng.choice([s for s in catalogue.SURNAMES if s != ident['surname']]).upper()}"
    brng = _rng(seed, f"{i}:bank")
    profile = {
        "applicant_id": applicant_id,
        "statement_id": _sid("STM-", seed, f"{applicant_id}:statement", 12),
        "consent_id": _sid("SYN-AACON-", seed, f"{applicant_id}:aa-consent", 10),
        "fetched_on": AS_OF.isoformat(),
        "account_ref": _sid("ACCT-", seed, f"{applicant_id}:account", 10),
        "account_number": ids.synthetic_account_number(brng),
        "ifsc": ids.synthetic_ifsc(brng),
        "bank_name": brng.choice(catalogue.BANKS),
        "holder_name": holder,
        "period_end": period_end,
        "months": months_n,
        "opening_paise": int(avg_income * brng.uniform(0.6, 1.2)) * 100,
        "od_limit": 30_000 if sc_id == "NEGATIVE_BALANCE" else 0,
        "credits": credits,
        "emis": emis,
        "rent": rent,
        "card_payment": card_pay,
        "spend_paise": int(spend * 100),
        "bounces": bounces,
        "reversal": reversal,
        "negative_month_end": int(avg_income * 100 * 0.55) if sc_id == "NEGATIVE_BALANCE" else 0,
        "tamper": sc_id == "STATEMENT_TAMPERED",
    }
    if sc_id == "NEGATIVE_BALANCE":
        profile["opening_paise"] = 200_000
        profile["spend_paise"] = int(avg_income * 0.45 * 100)
    if sc_id == "SPEND_EXCEEDS_INFLOW":
        profile["opening_paise"] = int(avg_income * 4) * 100
        profile["spend_paise"] = int(avg_income * 1.3 * 100)
    statement = bank.build_statement(profile, brng)

    # ---- declared data, product, documents, consents, signature, history
    declared_obligations = bureau_emi_total - (6_000 if sc_id == "OBLIGATION_UNDERDECLARED" else 0)
    declared_income = employment["payslips"][-1]["net"]
    if sc_id == "DUPLICATE_DOCUMENT" and original:
        declared_income = nets[-1]
    purpose_for_product = design["product_purpose"] or design["declared_purpose"]
    prod = product.product_details(
        purpose_for_product, loan["amount"], _rng(seed, f"{i}:product"), AS_OF,
        lambda kind: _doc_id(seed, f"{i}:product:{kind}"),
        quote_short=sc_id == "HOME_QUOTE_BELOW_AMOUNT", drop_required=sc_id == "EDU_ADMISSION_MISSING")
    required = ["AADHAAR_EKYC", "PAN", "BANK_STATEMENT_3M", "NACH_MANDATE", "LOAN_APPLICATION_FORM",
                "PAYSLIP_1", "PAYSLIP_2", "PAYSLIP_3"] + prod["required_kinds"]
    submitted = [d for d in required if d not in prod["required_kinds"]] + \
        sorted({d["kind"] if d["kind"] != "HOSPITAL_BILL" else "HOSPITAL_ESTIMATE" for d in prod["documents"]})
    if sc_id == "MISSING_DOCUMENTS":
        submitted = [d for d in submitted if d not in ("PAN", "PAYSLIP_2", "PAYSLIP_3", "BANK_STATEMENT_3M")]
        submitted.append("BANK_STATEMENT_2M")
    sig_label = sc.signature
    sig = signatures.specimen_set(_rng(seed, writer_key), _rng(seed, f"{i}:other-writer"),
                                  _rng(seed, f"{i}:signature"), sig_label)
    sig["record_id"] = _sid("SIG-", seed, f"{i}:signature")
    sig["document_ids"] = {"reference": _doc_id(seed, f"{i}:pan"), "form": _doc_id(seed, f"{i}:nach")}
    sig["screening"] = _signature_screening(sig, _rng(seed, f"{i}:sigscreen"))
    ocr = _ocr(i, sc_id, seed, aadhaar, pan, pan_number, employment, statement)
    last_decline = (AS_OF - timedelta(days=12)).isoformat() if sc_id == "COOLING_OFF_RECENT_DECLINE" else None

    product_id = product.PRODUCTS[design["product_purpose"]]["product_id"] if design["product_purpose"] else None
    proposed = emi(loan["amount"], ASSESSMENT_RATE, loan["tenure_months"])
    h = hint(sc)
    h["decision_path"] = design["path"]
    if sc_id.startswith("MATRIX_"):
        h["outcome"] = design["path"].split(":")[0]
        h["reason_category"] = design["path"].split(":")[1] if ":" in design["path"] else None
    if design["counter"]:
        h["expected_counter_offer"] = {k: design["counter"][k] for k in
                                       ("kind", "counter_amount", "counter_tenure", "cap_limited")}
        if design["counter"]["cap_limited"]:
            h["cap_rule"] = "ADR-0007 #2: above a product's cap -> COUNTER_OFFER at the largest passing amount (v2 P05 superseded)"
    if design["decline_reason"]:
        h["decline_driver"] = design["decline_reason"]
    label = {"synthetic": True, "scenario_id": sc.id, "product_id": product_id, "purpose": design["declared_purpose"],
             "amount_band": product.band_of(loan["amount"]), "requested_amount": loan["amount"],
             "tenure_months": loan["tenure_months"], "expected_path": design["path"],
             "request_outside_mvp_range": loan["amount"] > product.MVP_AMOUNT_CEILING,
             "outside_offer_label": product.OUTSIDE_OFFER_LABEL if loan["amount"] > product.MVP_AMOUNT_CEILING else None}

    record = {
        "schema": SCHEMA,
        "synthetic": True,
        "specimen_marker": SPECIMEN,
        "generation_version": GENERATION_VERSION,
        "seed": seed,
        "as_of": AS_OF.isoformat(),
        "record_id": applicant_id,
        "applicant_id": applicant_id,
        "application_id": application_id,
        "display_name": ident["full_name"],
        "label": label,
        "scenario": {"id": sc.id, "groups": list(sc.groups), "group_names": [], "description": sc.description,
                     "signature_label": sig_label},
        "expected_outcome_hint": h,
        "identity": ident,
        "aadhaar_ekyc": aadhaar,
        "pan": pan,
        # Raw specimen identifiers: only for rendering SPECIMEN documents and building the synthetic internal
        # lists. NEVER_STORE in the LMS; never inside the KYC records, zen_inputs or zen_data_points.
        "specimen_truth": {"synthetic": True, "never_store": True, "pan_number": pan_number, "aadhaar_uid": uid,
                           "aadhaar_rule": "first digit 0/1 (never issued by UIDAI) + Verhoeff check digit",
                           "pan_rule": "ZZ synthetic series; 4th char P (individual); 5th char = surname initial",
                           "pan_name_variant": pan_variant},
        "employment": employment,
        "declared": {
            "synthetic": True,
            "monthly_net_income": declared_income,
            "monthly_obligations": declared_obligations,
            "employer_name": employment["employer_name"],
            "employer_category": employment["employer_category"],
            "employment_type": employment["employment_type"],
            "applicant_profile": "SALARIED",
            "months_with_current_employer": employment["months_with_current_employer"],
            "total_experience_months": employment["total_experience_months"],
            "residence_city": ident["city"],
            "metro_city": ident["metro_city"],
            "months_at_address": ident["months_at_address"],
            "nationality": ident["nationality"],
            "residency_status": ident["residency_status"],
        },
        "loan_request": {"synthetic": True, **loan, "purpose": design["declared_purpose"],
                         "product_id": product_id, "product_purpose": design["product_purpose"],
                         "amount_band": label["amount_band"], "assessment_rate_pa": ASSESSMENT_RATE,
                         "proposed_emi_at_assessment_rate": proposed},
        "product": prod,
        "bank_ref": {"synthetic": True, **statement["lms_reference"],
                     "masked_number": statement["account"]["masked_number"],
                     "ifsc": statement["account"]["ifsc"]},
        "bureau_link": {
            "synthetic": True,
            "request": linked["request"],
            "report_id": report["report_id"] if report else None,
            "report_ref_contract": _sid("SYN-BUR-", 0, report["report_id"], 12) if report else None,
            "report_applicant_id": report["applicant_id"] if report else None,
            "origin": linked["origin"],
            "bureau_spec": spec,
            "native_scenario": linked["native_scenario"],
            "overlay_changes": linked["overlay_changes"],
            "http_error": linked["http_error"],
            "installment_obligation_total": bureau_emi_total,
            "identity_on_file": on_file,
            "history_sidecar": history_sidecar,
        },
        "undeclared_obligation": undeclared,
        "ocr_extractions": ocr,
        "documents": {"synthetic": True, "required": required, "submitted": submitted},
        "consents": {"synthetic": True, "bureau_pull": sc_id != "CONSENT_MISSING", "aa_data_fetch": True,
                     "terms": True, "privacy": True, "recorded_at": f"{AS_OF.isoformat()}T09:30:00+05:30"},
        "signature": sig,
        "application_history": {"synthetic": True, "last_decline_date": last_decline,
                                "previous_applications": 1 if last_decline else 0},
        "duplicate_of": original["applicant_id"] if sc_id == "DUPLICATE_APPLICANT" and original else None,
        "shares_contact_with": original["applicant_id"] if sc_id == "SHARED_CONTACT" and original else None,
        "payslips_copied_from": original["applicant_id"] if sc_id == "DUPLICATE_DOCUMENT" and original else None,
    }
    from .scenarios import GROUPS  # noqa: PLC0415
    record["scenario"]["group_names"] = [GROUPS[g] for g in sc.groups]
    case = bureau_link.bureau_case(record, linked, sc_id)
    return record, statement, case


def internal_lists(applicants: list[dict], seed: int) -> dict:
    rng = _rng(seed, "lists")
    neg = [{"synthetic": True, "pan": a["specimen_truth"]["pan_number"], "reason_code": "SYN_FRAUD_CONFIRMED",
            "listed_on": (AS_OF - timedelta(days=200)).isoformat(), "applicant_id_hint": a["applicant_id"]}
           for a in applicants if a["scenario"]["id"] == "NEGATIVE_LIST_HIT"]
    for k in range(3):  # decoys that match nobody in the universe
        neg.append({"synthetic": True, "pan": ids.synthetic_pan(rng, catalogue.SURNAMES[k]),
                    "reason_code": "SYN_DECOY", "listed_on": (AS_OF - timedelta(days=400)).isoformat(),
                    "applicant_id_hint": None})
    caution = [{"synthetic": True, "employer_name": e["name"], "category": e["category"], "reason": e["reason"]}
               for e in catalogue.CAUTION_EMPLOYERS + catalogue.CAUTION_ONLY_EMPLOYERS]
    return {"schema": "saral-synthetic-internal-lists/1", "synthetic": True, "specimen_marker": SPECIMEN,
            "negative_list": neg, "employer_caution_list": caution}


def build_universe(count: int = 200, *, seed: int = DEFAULT_SEED) -> dict:
    from .zen_inputs import attach_zen_inputs  # noqa: PLC0415

    if count < 1:
        raise ValueError("count must be >= 1")
    applicants, statements, cases = [], [], []
    registry: dict[int, dict] = {}
    for i, (sc_id, occ) in enumerate(plan(count)):
        rec, stmt, case = build_applicant(i, sc_id, seed=seed, registry=registry, occ=occ)
        if i == 0:
            registry[0] = rec
        applicants.append(rec)
        statements.append(stmt)
        cases.append(case)
    counts: dict[str, int] = {}
    for a in applicants:
        counts[a["scenario"]["id"]] = counts.get(a["scenario"]["id"], 0) + 1
    u = {
        "applicants": applicants,
        "statements": statements,
        "bureau_cases": {"schema": "bureau-cases/1", "synthetic": True,
                         "_warning": "SYNTHETIC. Saral linked cases for synthetic_bureau create_app(fixture_path=...).",
                         "cases": cases},
        "internal_lists": internal_lists(applicants, seed),
        "scenario_counts": {s.id: counts.get(s.id, 0) for s in ALL_SCENARIOS},
        "seed": seed,
        "count": count,
    }
    attach_zen_inputs(u)
    relabel_offers(u)
    relabel_review_under_score_floor(u)
    return u


def relabel_review_under_score_floor(u: dict) -> None:
    """ADR-0011: 60+ DPD in 12 months is manual review, not a decline. A DPD_60 applicant whose score is below the
    700 floor is still declined, by PL-029 (the only score decline), so the label names the score."""
    for a in u["applicants"]:
        h, lab = a["expected_outcome_hint"], a["label"]
        score = a["zen_inputs"]["bureau_score"]
        if a["scenario"]["id"] == "DPD_60" and score is not None and score < product.ZEN_SCORE_FLOOR:
            lab["expected_path"] = h["decision_path"] = "DECLINE:CREDIT_SCORE"
            h["outcome"], h["reason_category"] = "DECLINE", "CREDIT_SCORE"


OFFER_PATHS = {"APPROVE", "COUNTER_OFFER"}


def relabel_offers(u: dict) -> None:
    """Label every offer-driven applicant from catalogue PL-129 on its own resolved inputs (ADR-0007 #2, #3).

    The design functions aim each applicant at APPROVE or COUNTER_OFFER; the label is the PL-129 result itself
    (largest passing amount, flat rate), so the dataset and the catalogue cannot disagree on an amount.
    """
    for a in u["applicants"]:
        h, lab = a["expected_outcome_hint"], a["label"]
        offer = h.get("expected_offer")
        if lab["expected_path"] not in OFFER_PATHS or offer is None:
            continue
        path = {"APPROVED": "APPROVE", "COUNTER_OFFER": "COUNTER_OFFER"}.get(offer["offer_outcome"], "DECLINE:AFFORDABILITY")
        lab["expected_path"] = h["decision_path"] = path
        h["outcome"] = path.split(":")[0]
        h["reason_category"] = path.split(":")[1] if ":" in path else (
            "PRODUCT" if path == "COUNTER_OFFER" and offer["binding_cap"] in ("product_cap", "evidence_cap") else
            "AFFORDABILITY" if path == "COUNTER_OFFER" else None)
        if path == "COUNTER_OFFER":
            lr = a["loan_request"]
            h["expected_counter_offer"] = {
                "kind": "LONGER_TENURE" if offer["eligible_amount"] >= lr["amount"] else "REDUCED_AMOUNT",
                "counter_amount": offer["eligible_amount"], "counter_tenure": offer["offer_tenure_months"],
                "counter_emi": offer["offer_emi"], "binding_cap": offer["binding_cap"],
                "cap_limited": offer["binding_cap"] == "product_cap",
                "outside_what_we_offer": offer["request_outside_mvp_range"]}
        else:
            h.pop("expected_counter_offer", None)
