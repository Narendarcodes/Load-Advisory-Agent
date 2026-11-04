"""Invented reference data: names, places, employers, lenders, banks, internal lists.

Given names and surnames are common Indian names combined at random, so a pairing can
coincide with a real person by chance; nothing else about any record is real. Every
employer, lender, bank and platform name below is invented and was checked only for not
being an obvious real brand.
"""
from __future__ import annotations

GIVEN_MALE = ["Aarav", "Kiran", "Rohan", "Vikas", "Arjun", "Tarun", "Sai", "Nikhil",
              "Rahul", "Manoj", "Suresh", "Pranav", "Harsha", "Varun", "Dinesh", "Imran"]
GIVEN_FEMALE = ["Diya", "Meera", "Sneha", "Lavanya", "Pooja", "Anjali", "Harika", "Keerthi",
                "Divya", "Swathi", "Bhavana", "Ritu", "Sana", "Nandini", "Asha", "Priya"]
SURNAMES = ["Reddy", "Sharma", "Naidu", "Iyer", "Varma", "Kulkarni", "Rao", "Menon",
            "Patel", "Chowdary", "Joshi", "Pillai", "Gupta", "Das", "Khan", "Bhat"]
FATHER_GIVEN = ["Suresh", "Ramesh", "Mahesh", "Prakash", "Venkat", "Srinivas", "Mohan", "Gopal"]

# (city, state, metro). City names are real places; nothing at the address is.
CITIES = [
    ("Hyderabad", "Telangana", True), ("Bengaluru", "Karnataka", True),
    ("Chennai", "Tamil Nadu", True), ("Mumbai", "Maharashtra", True),
    ("Pune", "Maharashtra", True), ("Delhi", "Delhi", True), ("Warangal", "Telangana", False),
    ("Vijayawada", "Andhra Pradesh", False), ("Mysuru", "Karnataka", False),
    ("Nashik", "Maharashtra", False), ("Coimbatore", "Tamil Nadu", False),
]
STREETS = ["Specimen Street", "Synthetic Nagar Main Road", "Test Colony 3rd Cross",
           "Sample Layout", "Demo Enclave", "Placeholder Avenue"]

# Employer categories. ELIGIBLE matches ZEN proposal v2 E07 (public, private or MNC).
ELIGIBLE_EMPLOYER_CATEGORIES = ["PUBLIC", "PRIVATE", "MNC"]
INELIGIBLE_EMPLOYER_CATEGORIES = ["PROPRIETORSHIP", "UNREGISTERED_FIRM"]

EMPLOYERS = [
    {"name": "Vardhan Ledger Technologies Pvt Ltd", "category": "PRIVATE", "narration": "VARDHAN LEDGER TECH"},
    {"name": "Godavari Textile Mills Ltd", "category": "PRIVATE", "narration": "GODAVARI TEXTILE"},
    {"name": "Kaveri Cloud Solutions Pvt Ltd", "category": "PRIVATE", "narration": "KAVERI CLOUD SOL"},
    {"name": "Deccan Pixel Labs Pvt Ltd", "category": "PRIVATE", "narration": "DECCAN PIXEL LABS"},
    {"name": "Krishna Valley Hospitals Ltd", "category": "PRIVATE", "narration": "KRISHNA VALLEY HOSP"},
    {"name": "Synthetic State Power Distribution Corp", "category": "PUBLIC", "narration": "SYN STATE POWER CORP"},
    {"name": "Specimen Public Transport Undertaking", "category": "PUBLIC", "narration": "SPECIMEN PUB TRANSPORT"},
    {"name": "Nimbus Orbit Global Services India Pvt Ltd", "category": "MNC", "narration": "NIMBUS ORBIT GLOBAL"},
    {"name": "Quillfield Analytics India Pvt Ltd", "category": "MNC", "narration": "QUILLFIELD ANALYTICS"},
]
INELIGIBLE_EMPLOYERS = [
    {"name": "Sri Lakshmi Kirana and General Stores", "category": "PROPRIETORSHIP", "narration": "SRI LAKSHMI KIRANA"},
    {"name": "Balaji Event Helpers (unregistered)", "category": "UNREGISTERED_FIRM", "narration": "BALAJI EVENT HELPERS"},
]
CAUTION_EMPLOYERS = [
    {"name": "Phantom Staffing Solutions Pvt Ltd", "category": "PRIVATE", "narration": "PHANTOM STAFFING",
     "reason": "SYNTHETIC: salary-credit fraud ring flagged in prototype data"},
    {"name": "Mirage Infra Projects Pvt Ltd", "category": "PRIVATE", "narration": "MIRAGE INFRA PROJ",
     "reason": "SYNTHETIC: employer under liquidation (prototype data)"},
]
# Caution-list entries no applicant uses, so a lookup must not match on substring alone.
CAUTION_ONLY_EMPLOYERS = [
    {"name": "Hollow Crest Consultancy LLP", "category": "PRIVATE",
     "reason": "SYNTHETIC: unverifiable employer address (prototype data)"},
]

DESIGNATIONS = ["Software Engineer", "Accounts Executive", "Senior Analyst", "Staff Nurse",
                "Operations Manager", "Sales Officer", "Quality Inspector", "HR Associate"]

GIG_PLATFORMS = ["ZIPRIDE PARTNER PAYOUT", "TIFFINLY DELIVERY PAYOUT", "TASKHIVE FREELANCE"]
BUSINESS_NARRATIONS = ["UPI CR CUSTOMER PAYMENT", "UPI CR SHOP QR", "NEFT CR TRADE RECEIPT"]

# Invented lenders, one per bureau account type; used only in bank narrations.
BUREAU_LENDERS = {
    "PERSONAL_LOAN": "SYNFIN CONSUMER NBFC",
    "AUTO_LOAN": "SPECIMEN MOTOR FINANCE",
    "HOME_LOAN": "DEMO HOUSING FINANCE",
    "CREDIT_CARD": "SAMPLE BANK CARDS",
}
UNDECLARED_LENDERS = ["SAHUKAR CREDIT PVT LTD", "QUICKPAISA DIGITAL LENDING"]

BANKS = ["Specimen Cooperative Bank", "Demo Rural Bank of Telangana", "Sample Urban Bank"]

# Purposes, caps and product documents live in product.py.
