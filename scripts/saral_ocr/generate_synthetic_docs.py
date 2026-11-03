"""Synthetic loan documents for the Saral OCR bake-off. SYNTHETIC ONLY.

Every person, number, employer and bank here is invented and every image carries a
"SPECIMEN - SYNTHETIC" watermark. Nothing is copied from a real document.

* PAN numbers use the reserved-looking prefix "ZZ" so they read as obviously fake; the
  format (AAAPA9999A) is real so the PR #41 regex and checks are exercised.
* Aadhaar numbers start with "1000" (a 0/1 first digit is never issued by UIDAI, the same rule as
  feat/saral-synthetic-kyc-bank) and end in a valid Verhoeff check digit, so they pass only in
  OCR synthetic mode (``ocr.synthetic``). Results in docs/saral/OCR_BAKEOFF.md were produced
  with the earlier real-format "9999" prefix. Half the applicants get a card that shows only
  the last four digits, as masked e-Aadhaar does.
* ``--watermark overlay`` (default) also prints a diagonal SPECIMEN overlay across the
  page; ``--watermark banner`` keeps only the banner and a red frame.
* Each document has a ground-truth JSON next to it; each clean page has one degraded
  twin (rotation, blur, JPEG noise or a phone-photo perspective warp, cycled).
* Each applicant also gets synthetic signatures: a reference, a genuine variant and a
  simulated skilled forgery. Signatures are random pen strokes, not anyone's handwriting.

    python scripts/saral_ocr/generate_synthetic_docs.py --out /data/ocr/synth --applicants 8

Needs Pillow, numpy and opencv-python-headless (only for the degradations).
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

WATERMARK = "SPECIMEN - SYNTHETIC"

# Invented names. Common given names and surnames are combined at random, so a
# combination can coincide with a real person by chance; nothing else about them is real.
GIVEN = ["Aarav", "Diya", "Kiran", "Meera", "Rohan", "Sneha", "Vikas", "Lavanya", "Arjun",
         "Pooja", "Tarun", "Anjali", "Sai", "Harika", "Nikhil", "Keerthi"]
SURNAME = ["Reddy", "Sharma", "Naidu", "Iyer", "Varma", "Kulkarni", "Rao", "Menon",
           "Patel", "Chowdary", "Joshi", "Pillai"]
FATHER = ["Suresh", "Ramesh", "Mahesh", "Prakash", "Venkat", "Srinivas", "Mohan", "Gopal"]
# Fictional employers and banks (checked only for not being obvious real brands).
EMPLOYERS = ["Vardhan Ledger Technologies Pvt Ltd", "Godavari Textile Mills Ltd",
             "Kaveri Cloud Solutions Pvt Ltd", "Nallamala Logistics Services LLP",
             "Deccan Pixel Labs Pvt Ltd", "Sahyadri Agro Industries Ltd",
             "Krishna Valley Hospitals Ltd", "Charminar Retail Systems Pvt Ltd"]
DESIGNATIONS = ["Software Engineer", "Accounts Executive", "Senior Analyst", "Staff Nurse",
                "Operations Manager", "Sales Officer", "Quality Inspector", "HR Associate"]
BANKS = ["Specimen Cooperative Bank", "Demo Rural Bank of Telangana", "Sample Urban Bank"]
CITIES = ["Hyderabad", "Warangal", "Vijayawada", "Nizamabad", "Karimnagar", "Guntur"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

FONT_DIRS = ["/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/dejavu",
             "/usr/share/fonts/TTF", "C:/Windows/Fonts"]


def font(size: int, bold: bool = False, mono: bool = False, serif: bool = False):
    name = "DejaVuSans"
    if mono:
        name = "DejaVuSansMono"
    elif serif:
        name = "DejaVuSerif"
    name += "-Bold.ttf" if bold else ".ttf"
    for directory in FONT_DIRS:
        path = Path(directory) / name
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size=size)


# --------------------------------------------------------------------------- identifiers

_D = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]
_P = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]]
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def verhoeff_check_digit(number: str) -> str:
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _D[c][_P[(i + 1) % 8][int(ch)]]
    return str(_INV[c])


def verhoeff_ok(number: str) -> bool:
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _D[c][_P[i % 8][int(ch)]]
    return c == 0


def fake_aadhaar(rng: random.Random) -> str:
    """0/1-prefixed (never issued, so never a real person's number) + Verhoeff check digit.

    The fixed "1000" prefix replaces the old "9999" and draws the same 7 random digits, so
    every other generated value (names, PANs, salaries) is unchanged for a given seed.
    """
    body = "1000" + "".join(str(rng.randint(0, 9)) for _ in range(7))
    full = body + verhoeff_check_digit(body)
    assert verhoeff_ok(full)
    return full


def fake_pan(rng: random.Random, surname: str) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return "ZZ" + rng.choice(letters) + "P" + surname[0].upper() + f"{rng.randint(0, 9999):04d}" + rng.choice(letters)


def money(value: float) -> str:
    """Indian digit grouping: 1,23,456.00"""
    whole, frac = f"{value:.2f}".split(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join(groups + [tail])
    return f"{whole}.{frac}"


def dmy(value: date) -> str:
    return value.strftime("%d/%m/%Y")


# --------------------------------------------------------------------------- applicant

def make_applicant(index: int, rng: random.Random) -> dict:
    given, surname = rng.choice(GIVEN), rng.choice(SURNAME)
    dob = date(1975, 1, 1) + timedelta(days=rng.randint(0, 365 * 27))
    gross = rng.choice([32000, 38500, 45000, 52000, 61000, 74000, 88000, 96500])
    basic = round(gross * 0.5)
    hra = round(gross * 0.2)
    special = gross - basic - hra
    pf = round(min(basic, 15000) * 0.12)
    ptax = 200
    tds = round(max(0, gross - 50000) * 0.08)
    deductions = pf + ptax + tds
    joined = date(2026, 10, 1) - timedelta(days=rng.randint(200, 2600))
    employer = EMPLOYERS[index % len(EMPLOYERS)]
    return {
        "applicant_id": f"SYN-{index + 1:03d}",
        "name": f"{given} {surname}",
        "father_name": f"{rng.choice(FATHER)} {surname}",
        "gender": "Female" if given in {"Diya", "Meera", "Sneha", "Lavanya", "Pooja", "Anjali",
                                         "Harika", "Keerthi"} else "Male",
        "dob": dob.isoformat(),
        "pan": fake_pan(rng, surname),
        "aadhaar": fake_aadhaar(rng),
        "aadhaar_masked_card": index % 2 == 1,
        "employer": employer,
        "designation": rng.choice(DESIGNATIONS),
        "employee_id": f"EMP{rng.randint(10000, 99999)}",
        "joined": joined.isoformat(),
        "city": rng.choice(CITIES),
        "salary": {"basic": basic, "hra": hra, "special": special, "gross": gross,
                   "pf": pf, "ptax": ptax, "tds": tds, "deductions": deductions,
                   "net": gross - deductions},
        "bank": BANKS[index % len(BANKS)],
        "account_last4": f"{rng.randint(0, 9999):04d}",
    }


# --------------------------------------------------------------------------- drawing helpers

REFERENCE: list[tuple[float, float, str]] = []  # (y, x, text) of every string printed on the current page


class RecordingDraw(ImageDraw.ImageDraw):
    """ImageDraw that records each printed string, so CER/WER have an exact reference text."""

    def text(self, xy, text, *args, **kwargs):  # noqa: D102
        REFERENCE.append((float(xy[1]), float(xy[0]), str(text)))
        return super().text(xy, text, *args, **kwargs)


def canvas(w: int, h: int, tint=(255, 255, 255)) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (w, h), tint)
    REFERENCE.clear()
    return img, RecordingDraw(img)


def reference_lines(tolerance: float = 12.0) -> list[str]:
    """Printed strings grouped into reading-order lines (same baseline within `tolerance` px)."""
    rows: list[list[tuple[float, float, str]]] = []
    for item in sorted(REFERENCE):
        if rows and abs(rows[-1][0][0] - item[0]) <= tolerance:
            rows[-1].append(item)
        else:
            rows.append([item])
    return [" ".join(t for _, _, t in sorted(row, key=lambda r: r[1]) if t.strip()) for row in rows]


WATERMARK_MODE = {"mode": "overlay"}


def watermark(img: Image.Image, size: int = 48) -> None:
    """Diagonal SPECIMEN overlay ("overlay" mode) or a red specimen frame ("banner" mode).

    Both modes keep the bold SPECIMEN - SYNTHETIC banner printed on every page. The overlay
    crosses the printed text, which the bake-off showed PaddleOCR's detector is sensitive
    to, so the banner mode exists to measure the engines without that confound.
    """
    if WATERMARK_MODE["mode"] == "banner":
        d = ImageDraw.Draw(img)
        d.rectangle([4, 4, img.width - 5, img.height - 5], outline=(200, 30, 30), width=4)
        return
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = font(size, bold=True)
    step = size * 7
    for y in range(-img.height, img.height * 2, step):
        for x in range(-img.width, img.width * 2, step * 2):
            d.text((x, y), WATERMARK, font=f, fill=(200, 40, 40, 22))
    layer = layer.rotate(25, center=(img.width / 2, img.height / 2))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"))


def specimen_banner(d: ImageDraw.ImageDraw, w: int, y: int) -> None:
    d.text((w - 330, y), WATERMARK, font=font(20, bold=True), fill=(190, 30, 30))


# --------------------------------------------------------------------------- documents

def pan_card(a: dict) -> tuple[Image.Image, dict]:
    img, d = canvas(1012, 638, (232, 240, 248))
    d.rectangle([0, 0, 1011, 90], fill=(40, 70, 130))
    d.text((30, 18), "INCOME TAX DEPARTMENT", font=font(30, bold=True), fill="white")
    d.text((620, 24), "GOVT. OF INDIA", font=font(26, bold=True), fill="white")
    d.text((300, 105), "Permanent Account Number Card", font=font(24), fill=(20, 20, 20))
    d.text((350, 145), a["pan"], font=font(40, bold=True, mono=True), fill=(10, 10, 10))
    d.rectangle([40, 120, 230, 360], outline=(90, 90, 90), width=2)
    d.text((80, 225), "PHOTO", font=font(28), fill=(150, 150, 150))
    y = 230
    for label, value in (("Name", a["name"].upper()), ("Father's Name", a["father_name"].upper()),
                         ("Date of Birth", dmy(date.fromisoformat(a["dob"])))):
        d.text((270, y), label, font=font(20), fill=(60, 60, 60))
        d.text((270, y + 26), value, font=font(30, bold=True), fill=(10, 10, 10))
        y += 85
    d.text((700, 520), "Signature", font=font(18), fill=(80, 80, 80))
    specimen_banner(d, 1012, 590)
    watermark(img, 40)
    truth = {"doc_type": "PAN", "pan_number": a["pan"], "name": a["name"].upper(),
             "father_name": a["father_name"].upper(), "date_of_birth": a["dob"]}
    return img, truth


def aadhaar_card(a: dict) -> tuple[Image.Image, dict]:
    img, d = canvas(1012, 638, (255, 255, 255))
    d.rectangle([0, 0, 1011, 80], fill=(255, 153, 51))
    d.rectangle([0, 80, 1011, 100], fill=(19, 136, 8))
    d.text((300, 20), "Government of India", font=font(34, bold=True), fill=(30, 30, 30))
    d.rectangle([40, 130, 230, 370], outline=(90, 90, 90), width=2)
    d.text((80, 235), "PHOTO", font=font(28), fill=(150, 150, 150))
    d.text((270, 140), a["name"], font=font(32, bold=True), fill=(10, 10, 10))
    d.text((270, 195), f"DOB: {dmy(date.fromisoformat(a['dob']))}", font=font(28), fill=(10, 10, 10))
    d.text((270, 245), a["gender"].upper(), font=font(28), fill=(10, 10, 10))
    number = a["aadhaar"]
    shown = (f"XXXX XXXX {number[-4:]}" if a["aadhaar_masked_card"]
             else f"{number[:4]} {number[4:8]} {number[8:]}")
    d.text((300, 450), shown, font=font(46, bold=True, mono=True), fill=(10, 10, 10))
    d.line([40, 530, 970, 530], fill=(200, 30, 30), width=3)
    d.text((330, 545), "Aadhaar - Aam Aadmi ka Adhikar", font=font(22), fill=(200, 30, 30))
    specimen_banner(d, 1012, 590)
    watermark(img, 40)
    truth = {"doc_type": "AADHAAR", "name": a["name"], "date_of_birth": a["dob"], "gender": a["gender"],
             "aadhaar_number": None if a["aadhaar_masked_card"] else number,
             "aadhaar_last4": number[-4:], "aadhaar_masked_on_card": a["aadhaar_masked_card"],
             "aadhaar_verhoeff_valid": verhoeff_ok(number)}
    return img, truth


def payslip(a: dict, month: int = 9, year: int = 2026) -> tuple[Image.Image, dict]:
    s = a["salary"]
    img, d = canvas(1240, 1754)
    d.text((80, 70), a["employer"], font=font(40, bold=True), fill=(20, 40, 90))
    d.text((80, 125), f"Plot 12, Industrial Area, {a['city']}, Telangana", font=font(22), fill=(70, 70, 70))
    d.line([80, 170, 1160, 170], fill=(20, 40, 90), width=3)
    d.text((80, 195), f"Payslip for the month of {MONTHS[month - 1]} {year}", font=font(30, bold=True), fill="black")
    pay_date = date(year, month, 28)
    rows = [("Employee Name", a["name"]), ("Employee ID", a["employee_id"]),
            ("Designation", a["designation"]), ("Pay Date", dmy(pay_date)),
            ("Bank A/c", f"XXXXXX{a['account_last4']}")]
    y = 270
    for label, value in rows:
        d.text((80, y), f"{label}: {value}", font=font(26), fill="black")
        y += 48
    y += 30
    d.rectangle([80, y, 1160, y + 50], fill=(225, 232, 245))
    d.text((100, y + 10), "Earnings", font=font(26, bold=True), fill="black")
    d.text((420, y + 10), "Amount (Rs.)", font=font(26, bold=True), fill="black")
    d.text((640, y + 10), "Deductions", font=font(26, bold=True), fill="black")
    d.text((960, y + 10), "Amount (Rs.)", font=font(26, bold=True), fill="black")
    y += 70
    earn = [("Basic Salary", s["basic"]), ("House Rent Allowance", s["hra"]), ("Special Allowance", s["special"])]
    ded = [("Provident Fund", s["pf"]), ("Professional Tax", s["ptax"]), ("Income Tax (TDS)", s["tds"])]
    for (el, ev), (dl, dv) in zip(earn, ded):
        d.text((100, y), el, font=font(24), fill="black")
        d.text((420, y), money(ev), font=font(24), fill="black")
        d.text((640, y), dl, font=font(24), fill="black")
        d.text((960, y), money(dv), font=font(24), fill="black")
        y += 46
    d.line([80, y + 5, 1160, y + 5], fill=(120, 120, 120), width=2)
    y += 20
    d.text((100, y), f"Gross Salary: Rs. {money(s['gross'])}", font=font(26, bold=True), fill="black")
    d.text((640, y), f"Total Deductions: Rs. {money(s['deductions'])}", font=font(26, bold=True), fill="black")
    y += 80
    d.rectangle([80, y, 1160, y + 70], outline=(20, 40, 90), width=3)
    d.text((100, y + 18), f"Net Salary: Rs. {money(s['net'])}", font=font(32, bold=True), fill=(20, 40, 90))
    y += 130
    d.text((80, y), "This is a computer generated payslip and does not need a signature.",
           font=font(20), fill=(90, 90, 90))
    specimen_banner(d, 1240, 1690)
    watermark(img, 60)
    truth = {"doc_type": "PAYSLIP", "employee_name": a["name"], "employer_name": a["employer"],
             "pay_period": f"{MONTHS[month - 1]} {year}", "salary_date": pay_date.isoformat(),
             "basic_salary": float(s["basic"]), "gross_salary": float(s["gross"]),
             "total_deductions": float(s["deductions"]), "net_salary": float(s["net"])}
    return img, truth


NARRATIONS = ["UPI/{n}/GROCERY", "ATM WDL {city}", "UPI/{n}/MOBILE RECHARGE", "POS ELECTRICITY BILL",
              "UPI/{n}/RENT", "NEFT DR INSURANCE PREMIUM", "UPI/{n}/PHARMACY", "IMPS CR FROM FRIEND",
              "INTEREST CREDIT", "UPI/{n}/FUEL"]


def bank_statement(a: dict, rng: random.Random) -> tuple[Image.Image, dict]:
    s = a["salary"]
    start = date(2026, 7, 1)
    end = date(2026, 9, 30)
    balance = float(rng.randint(8000, 60000)) + rng.choice([0.0, 0.5, 0.25])
    opening = balance
    short = " ".join(a["employer"].split()[:2]).upper()
    txns = []
    for month in (7, 8, 9):
        days = sorted(rng.sample(range(2, 28), 3))
        events = [(date(2026, month, 1), f"NEFT CR SALARY {short}", None, float(s["net"]))]
        for day in days:
            narration = rng.choice(NARRATIONS).format(n=rng.randint(100000, 999999), city=a["city"].upper())
            amount = round(rng.uniform(150, 9000), 2)
            if " CR " in f" {narration} " or narration.startswith("INTEREST"):
                events.append((date(2026, month, day), narration, None, amount))
            else:
                events.append((date(2026, month, day), narration, amount, None))
        for when, narration, wd, dep in events:
            balance = round(balance - (wd or 0) + (dep or 0), 2)
            txns.append({"date": when.isoformat(), "narration": narration, "withdrawal": wd,
                         "deposit": dep, "balance": balance})
    img, d = canvas(1240, 1754)
    d.text((70, 60), a["bank"], font=font(38, bold=True), fill=(10, 70, 60))
    d.text((70, 112), f"{a['city']} Main Branch  |  IFSC: SPEC0000{rng.randint(100, 999)}", font=font(20), fill=(60, 60, 60))
    d.text((70, 160), "STATEMENT OF ACCOUNT", font=font(30, bold=True), fill="black")
    info = [("Account Holder", a["name"]), ("Account No", f"XXXXXXXX{a['account_last4']}"),
            ("Statement Period", f"{dmy(start)} to {dmy(end)}"), ("Opening Balance", money(opening))]
    y = 215
    for label, value in info:
        d.text((70, y), f"{label}: {value}", font=font(24), fill="black")
        y += 40
    y += 20
    cols = [70, 230, 680, 850, 1020]
    heads = ["Date", "Narration", "Withdrawal", "Deposit", "Balance"]
    d.rectangle([60, y, 1180, y + 46], fill=(215, 235, 228))
    for x, h in zip(cols, heads):
        d.text((x, y + 10), h, font=font(22, bold=True), fill="black")
    y += 56
    for t in txns:
        row = [dmy(date.fromisoformat(t["date"])), t["narration"],
               money(t["withdrawal"]) if t["withdrawal"] else "", money(t["deposit"]) if t["deposit"] else "",
               money(t["balance"])]
        for x, value in zip(cols, row):
            d.text((x, y), value, font=font(20), fill="black")
        y += 38
        d.line([60, y - 6, 1180, y - 6], fill=(225, 225, 225), width=1)
    total_cr = round(sum(t["deposit"] or 0 for t in txns), 2)
    total_dr = round(sum(t["withdrawal"] or 0 for t in txns), 2)
    y += 20
    d.text((70, y), f"Total Credits: {money(total_cr)}", font=font(24, bold=True), fill="black")
    d.text((520, y), f"Total Debits: {money(total_dr)}", font=font(24, bold=True), fill="black")
    d.text((70, y + 45), f"Closing Balance: {money(balance)}", font=font(24, bold=True), fill="black")
    specimen_banner(d, 1240, 1690)
    watermark(img, 60)
    salary_rows = [t for t in txns if "SALARY" in t["narration"]]
    truth = {"doc_type": "BANK_STATEMENT", "account_holder": a["name"],
             "statement_period": f"{start.isoformat()} to {end.isoformat()}",
             "salary_credits": round(sum(t["deposit"] for t in salary_rows), 2),
             "salary_credit_count": len(salary_rows), "salary_credit_months": 3,
             "total_credits": total_cr, "total_debits": total_dr, "closing_balance": balance,
             "opening_balance": opening, "transactions": txns}
    return img, truth


def employment_letter(a: dict) -> tuple[Image.Image, dict]:
    img, d = canvas(1240, 1754)
    joined = date.fromisoformat(a["joined"])
    d.text((80, 70), a["employer"], font=font(40, bold=True, serif=True), fill=(60, 30, 90))
    d.text((80, 125), f"Corporate Office: Survey No. 45, {a['city']}, Telangana", font=font(20), fill=(80, 80, 80))
    d.line([80, 165, 1160, 165], fill=(60, 30, 90), width=3)
    d.text((80, 200), "Date: 15/10/2026", font=font(24), fill="black")
    d.text((80, 260), "TO WHOMSOEVER IT MAY CONCERN", font=font(30, bold=True), fill="black")
    title = "Mr." if a["gender"] == "Male" else "Ms."
    body = [f"This is to certify that {title} {a['name']} is employed with",
            f"{a['employer']} on a permanent, full-time basis.", "",
            f"Employee Name: {a['name']}", f"Employee ID: {a['employee_id']}",
            f"Designation: {a['designation']}", f"Date of Joining: {dmy(joined)}",
            f"Monthly Gross Salary: Rs. {money(a['salary']['gross'])}", "",
            "This letter is issued on the employee's request for a loan application.",
            "It does not constitute a guarantee of any kind by the company."]
    y = 340
    for line in body:
        d.text((80, y), line, font=font(26, serif=True), fill="black")
        y += 50
    d.text((80, y + 80), "For " + a["employer"], font=font(24, serif=True), fill="black")
    d.text((80, y + 200), "Authorised Signatory, Human Resources", font=font(24, serif=True), fill="black")
    specimen_banner(d, 1240, 1690)
    watermark(img, 60)
    truth = {"doc_type": "EMPLOYMENT_LETTER", "employee_name": a["name"], "employer_name": a["employer"],
             "designation": a["designation"], "employment_start_date": joined.isoformat(),
             "monthly_gross": float(a["salary"]["gross"])}
    return img, truth


# --------------------------------------------------------------------------- degradations

DEGRADATIONS = ("rotation", "blur", "jpeg_noise", "phone_perspective")


def degrade(img: Image.Image, kind: str, rng: random.Random) -> tuple[Image.Image, dict]:
    import cv2  # noqa: PLC0415

    if kind == "low_resolution":
        # A ~100 dpi scan or a far-away phone shot: downscale to 40-50 %, then JPEG.
        factor = rng.uniform(0.40, 0.50)
        small = img.resize((int(img.width * factor), int(img.height * factor)), Image.BILINEAR)
        ok, enc = cv2.imencode(".jpg", cv2.cvtColor(np.asarray(small), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 80])
        dec = cv2.cvtColor(cv2.imdecode(enc, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
        return Image.fromarray(dec), {"scale": round(factor, 3), "jpeg_quality": 80}
    if kind == "rotation":
        angle = rng.choice([-1, 1]) * rng.uniform(2.0, 7.0)
        out = img.rotate(angle, resample=Image.BICUBIC, expand=True, fillcolor=(245, 245, 245))
        return out, {"angle_deg": round(angle, 2)}
    if kind == "blur":
        radius = rng.uniform(1.4, 2.2)
        return img.filter(ImageFilter.GaussianBlur(radius)), {"gaussian_radius": round(radius, 2)}
    if kind == "jpeg_noise":
        arr = np.asarray(img).astype(np.float32)
        sigma = rng.uniform(10, 18)
        arr = np.clip(arr + np.random.default_rng(rng.randint(0, 10**6)).normal(0, sigma, arr.shape), 0, 255)
        quality = rng.randint(15, 25)
        ok, enc = cv2.imencode(".jpg", cv2.cvtColor(arr.astype(np.uint8), cv2.COLOR_RGB2BGR),
                               [cv2.IMWRITE_JPEG_QUALITY, quality])
        dec = cv2.cvtColor(cv2.imdecode(enc, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
        return Image.fromarray(dec), {"noise_sigma": round(sigma, 1), "jpeg_quality": quality}
    if kind == "phone_perspective":
        w, h = img.size
        pad = int(0.12 * max(w, h))
        bg = np.full((h + 2 * pad, w + 2 * pad, 3), (rng.randint(70, 120), rng.randint(60, 100), rng.randint(40, 80)), np.uint8)
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        j = lambda s: rng.uniform(-s, s)  # noqa: E731
        k = 0.06
        dst = np.float32([[pad + j(k * w), pad + j(k * h)], [pad + w + j(k * w), pad + j(k * h)],
                          [pad + w + j(k * w), pad + h + j(k * h)], [pad + j(k * w), pad + h + j(k * h)]])
        m = cv2.getPerspectiveTransform(src, dst)
        warped = cv2.warpPerspective(np.asarray(img), m, (bg.shape[1], bg.shape[0]), borderMode=cv2.BORDER_TRANSPARENT,
                                     dst=bg.copy())
        # uneven lighting: a soft diagonal shadow
        yy, xx = np.mgrid[0:warped.shape[0], 0:warped.shape[1]]
        shade = 0.75 + 0.25 * (xx / warped.shape[1] * 0.6 + yy / warped.shape[0] * 0.4)
        warped = np.clip(warped.astype(np.float32) * shade[..., None], 0, 255).astype(np.uint8)
        warped = cv2.GaussianBlur(warped, (3, 3), 0.8)
        ok, enc = cv2.imencode(".jpg", cv2.cvtColor(warped, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 70])
        dec = cv2.cvtColor(cv2.imdecode(enc, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
        return Image.fromarray(dec), {"corner_jitter_frac": k, "background_pad_px": pad}
    raise ValueError(kind)


# --------------------------------------------------------------------------- signatures

def _signature_strokes(rng: random.Random) -> list[np.ndarray]:
    """A random 'signature': 2-4 connected smooth strokes plus an underline flourish."""
    strokes = []
    x = rng.uniform(30, 70)
    for _ in range(rng.randint(2, 4)):
        n = rng.randint(5, 9)
        pts = []
        for i in range(n):
            pts.append((x + i * rng.uniform(18, 34), 110 + rng.uniform(-45, 45) * (1 if i % 2 else -1)))
        x = pts[-1][0] + rng.uniform(10, 30)
        strokes.append(np.array(pts, dtype=np.float64))
    flourish = np.array([(rng.uniform(30, 80), 165), (x * 0.5, 175 + rng.uniform(-8, 8)), (x, 160)])
    strokes.append(flourish)
    # Fit the whole signature inside the 520x230 canvas with a margin.
    allpts = np.vstack(strokes)
    lo, hi = allpts.min(axis=0), allpts.max(axis=0)
    scale = min(420 / max(hi[0] - lo[0], 1), 150 / max(hi[1] - lo[1], 1))
    return [(s - lo) * scale + [50, 40] for s in strokes]


def _catmull(points: np.ndarray, samples: int = 18) -> np.ndarray:
    if len(points) < 3:
        return points
    p = np.vstack([points[0], points, points[-1]])
    out = []
    for i in range(1, len(p) - 2):
        for t in np.linspace(0, 1, samples, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p[i]) + (-p[i - 1] + p[i + 1]) * t
                              + (2 * p[i - 1] - 5 * p[i] + 4 * p[i + 1] - p[i + 2]) * t2
                              + (-p[i - 1] + 3 * p[i] - 3 * p[i + 1] + p[i + 2]) * t3))
    out.append(p[-2])
    return np.array(out)


def render_signature(strokes: list[np.ndarray], rng: random.Random, jitter: float, width: float,
                     angle: float = 0.0, scale: float = 1.0, ink=(20, 30, 110)) -> Image.Image:
    img = Image.new("RGB", (520, 230), (252, 252, 248))
    d = ImageDraw.Draw(img)
    for stroke in strokes:
        pts = stroke + np.array([[rng.gauss(0, jitter), rng.gauss(0, jitter)] for _ in stroke])
        pts = (pts - [260, 115]) * scale + [260, 115]
        curve = _catmull(pts)
        d.line([tuple(p) for p in curve], fill=ink, width=max(1, int(round(width))), joint="curve")
    img = img.rotate(angle, resample=Image.BICUBIC, fillcolor=(252, 252, 248))
    # light paper texture
    arr = np.asarray(img).astype(np.float32)
    arr += np.random.default_rng(rng.randint(0, 10**6)).normal(0, 3, arr.shape)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def signatures_for(applicant_id: str, rng: random.Random, out: Path) -> dict:
    base = _signature_strokes(rng)
    folder = out / "signatures" / applicant_id
    folder.mkdir(parents=True, exist_ok=True)
    genuine_ref = render_signature(base, rng, jitter=1.0, width=3)
    genuine_var = render_signature(base, rng, jitter=3.5, width=rng.uniform(2.2, 4.0),
                                   angle=rng.uniform(-4, 4), scale=rng.uniform(0.92, 1.08))
    # Simulated skilled forgery: same overall shape traced with larger wobble, a different
    # pen and one stroke re-drawn freehand (forgers rarely get every stroke right).
    forged_strokes = [s.copy() for s in base]
    victim = rng.randrange(len(forged_strokes) - 1)
    original = forged_strokes[victim]
    redraw = original + np.array([[rng.gauss(0, 14), rng.gauss(0, 18)] for _ in original])
    forged_strokes[victim] = redraw
    forged = render_signature(forged_strokes, rng, jitter=7.0, width=rng.uniform(1.8, 4.5),
                              angle=rng.uniform(-6, 6), scale=rng.uniform(0.88, 1.12), ink=(15, 15, 15))
    paths = {}
    for name, image in (("genuine_ref", genuine_ref), ("genuine_variant", genuine_var), ("forged_skilled", forged)):
        path = folder / f"{name}.png"
        image.save(path)
        paths[name] = str(path.relative_to(out))
    meta = {"applicant_id": applicant_id, "files": paths,
            "labels": {"genuine_ref": "reference", "genuine_variant": "genuine", "forged_skilled": "forged"},
            "note": "random synthetic pen strokes; not a real person's signature"}
    (folder / "truth.json").write_text(json.dumps(meta, indent=2))
    return meta


# --------------------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--applicants", type=int, default=8, help="5 documents each")
    parser.add_argument("--signature-only", type=int, default=22,
                        help="extra applicants with signatures only (for screening statistics)")
    parser.add_argument("--seed", type=int, default=20261103)
    parser.add_argument("--watermark", choices=("overlay", "banner"), default="overlay",
                        help="overlay: diagonal SPECIMEN text across the page; banner: red frame + banner only")
    parser.add_argument("--extra-low-res", action="store_true",
                        help="also write a low-resolution twin of every page (separate RNG, so the "
                             "other pages stay byte-identical to a run without this flag)")
    args = parser.parse_args()
    WATERMARK_MODE["mode"] = args.watermark
    low_rng = random.Random(args.seed + 1)

    rng = random.Random(args.seed)
    out: Path = args.out
    (out / "pages").mkdir(parents=True, exist_ok=True)
    (out / "truth").mkdir(parents=True, exist_ok=True)
    manifest = {"synthetic": True, "watermark": WATERMARK, "watermark_mode": args.watermark, "seed": args.seed, "documents": [], "signatures": []}
    degrade_i = 0
    for i in range(args.applicants):
        a = make_applicant(i, rng)
        builders = [("pan", lambda: pan_card(a)), ("aadhaar", lambda: aadhaar_card(a)),
                    ("payslip", lambda: payslip(a)), ("bank_statement", lambda: bank_statement(a, rng)),
                    ("employment_letter", lambda: employment_letter(a))]
        for doc_kind, build in builders:
            img, truth = build()
            truth["reference_lines"] = reference_lines()
            doc_id = f"{a['applicant_id']}_{doc_kind}"
            truth.update({"document_id": doc_id, "applicant_id": a["applicant_id"], "synthetic": True})
            clean = out / "pages" / f"{doc_id}__clean.png"
            img.save(clean)
            kind = DEGRADATIONS[degrade_i % len(DEGRADATIONS)]
            degrade_i += 1
            bad, params = degrade(img, kind, rng)
            bad_path = out / "pages" / f"{doc_id}__{kind}.jpg"
            bad.convert("RGB").save(bad_path, quality=92)
            truth["pages"] = {"clean": clean.name, kind: bad_path.name}
            if args.extra_low_res:
                low, low_params = degrade(img, "low_resolution", low_rng)
                low_path = out / "pages" / f"{doc_id}__low_resolution.jpg"
                low.save(low_path, quality=92)
                truth["pages"]["low_resolution"] = low_path.name
                truth["low_resolution"] = low_params
            truth["degradation"] = {"kind": kind, **params}
            (out / "truth" / f"{doc_id}.json").write_text(json.dumps(truth, indent=2))
            manifest["documents"].append({"document_id": doc_id, "doc_kind": doc_kind,
                                          "pages": truth["pages"], "truth": f"truth/{doc_id}.json"})
        manifest["signatures"].append(signatures_for(a["applicant_id"], rng, out))
    for j in range(args.signature_only):
        manifest["signatures"].append(signatures_for(f"SIG-{j + 1:03d}", rng, out))
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"documents={len(manifest['documents'])} "
          f"pages={sum(len(d['pages']) for d in manifest['documents'])} "
          f"signature_sets={len(manifest['signatures'])} -> {out}")


if __name__ == "__main__":
    main()
