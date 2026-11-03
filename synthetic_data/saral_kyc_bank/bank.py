"""Account-aggregator-style synthetic bank statements (FI type DEPOSIT). SYNTHETIC ONLY.

Amounts are handled in integer paise so running balances are exact; they are written out
in rupees with two decimals. Each statement gets a stable ``statement_id`` and each
transaction a stable ``txn_id`` derived from the seed and applicant, plus a SHA-256 content
hash over a canonical JSON form, so the LMS can store ``{statement_id, content_sha256}``
instead of raw transactions.

``synthetic_truth_tag`` on each transaction is generation ground truth for tests; real AA
data has no such field and rules must not read it.
"""
from __future__ import annotations

import hashlib
import json
import random
from datetime import date, timedelta

from .ids import mask_account

SCHEMA = "saral-synthetic-aa-fi/1"
SPECIMEN = "SPECIMEN - SYNTHETIC - NOT A REAL BANK RECORD"
MODES = ("UPI", "NEFT", "IMPS", "NACH", "ECS", "CASH", "ATM", "CARD", "CHEQUE", "OTHERS")
RETURN_CHARGE = 59_000  # paise; Rs 500 + 18% GST, a typical-looking synthetic charge
CHEQUE_RETURN_CHARGE = 35_400
MERCHANTS = ["SPECIMEN MART", "DEMO FRESH GROCERS", "SAMPLE PHARMACY", "TEST FUEL STATION",
             "PLACEHOLDER CAFE", "SYNTH ELECTRONICS", "MOCK TEXTILES", "DUMMY BOOKSTORE"]
HASH_SCOPE = "sha256 of canonical JSON (sort_keys, no whitespace) of {account, summary, transactions}"


def month_starts(period_end: date, months: int) -> list[date]:
    out = []
    y, m = period_end.year, period_end.month
    for _ in range(months):
        out.append(date(y, m, 1))
        y, m = (y, m - 1) if m > 1 else (y - 1, 12)
    return out[::-1]


def _rs(paise: int) -> float:
    return round(paise / 100, 2)


def canonical_hash(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def statement_content_hash(statement: dict) -> str:
    return canonical_hash({k: statement[k] for k in ("account", "summary", "transactions")})


class _Ledger:
    def __init__(self):
        self.events: list[tuple] = []
        self._n = 0

    def add(self, d: date, kind: str, paise: int, narration: str, mode: str, tag: str,
            *, prio: int = 5, optional: bool = False):
        self._n += 1
        self.events.append((d, prio, self._n, kind, int(paise), narration, mode, tag, optional))


def build_statement(p: dict, rng: random.Random) -> dict:
    """``p`` is the bank profile assembled by the generator (see generator._bank_profile)."""
    end: date = p["period_end"]
    months = month_starts(end, p["months"])
    start = months[0]
    led = _Ledger()
    floor = -p["od_limit"] * 100 if p["od_limit"] else 100_000  # keep Rs 1,000 unless OD-linked

    for idx, ms in enumerate(months):
        y, m = ms.year, ms.month
        last = 28
        # ---- income
        for c in p["credits"]:
            if (c["date"].year, c["date"].month) == (y, m):
                led.add(c["date"], "CREDIT", c["paise"], c["narration"], c["mode"], c["tag"], prio=1)
        # ---- fixed debits
        for e in p["emis"]:
            d = date(y, m, e["day"])
            if d < e["start"] or (y, m) in e.get("skip", ()):
                continue
            led.add(d, "DEBIT", e["paise"], f"NACH DR {e['lender']} {e['loan_ref']}", e.get("mode", "NACH"),
                    e["tag"], prio=3)
        if p["rent"]:
            led.add(date(y, m, 6), "DEBIT", p["rent"], "IMPS RENT SPECIMEN LANDLORD", "IMPS", "RENT", prio=4)
        if p["card_payment"]:
            led.add(date(y, m, 18), "DEBIT", p["card_payment"], "NEFT BILLPAY CC SAMPLE BANK CARDS", "NEFT",
                    "CARD_BILL", prio=4)
        led.add(date(y, m, 12), "DEBIT", rng.randint(80_000, 260_000), "UPI DR SPECIMEN POWER UTILITY BILL",
                "UPI", "UTILITY", prio=4, optional=True)
        # ---- discretionary spending, heavier late in the month (month-end lows)
        budget = p["spend_paise"] * rng.uniform(0.85, 1.1)
        spent = 0
        while spent < budget:
            day = min(last, max(2, int(rng.triangular(2, last, last - 3))))
            kind = rng.choices(["UPI", "CARD", "ATM"], weights=[6, 3, 1])[0]
            amt = rng.randint(15_000, 450_000) if kind != "ATM" else rng.choice([200_000, 500_000, 1_000_000])
            nar = (f"ATM WDL SPECIMEN ATM {rng.randint(100, 999)}" if kind == "ATM" else
                   f"{'UPI DR' if kind == 'UPI' else 'POS'} {rng.choice(MERCHANTS)}")
            led.add(date(y, m, day), "DEBIT", amt, nar, kind, "SPEND", prio=6, optional=True)
            spent += amt
        # ---- scenario behaviour
        for b in p["bounces"]:
            if b["month_index"] == idx - len(months):
                d = date(y, m, b["day"])
                if b["kind"] == "CHEQUE":
                    led.add(d, "DEBIT", b["paise"], f"CHQ {rng.randint(100000, 999999)} CLG SPECIMEN PAYEE",
                            "CHEQUE", "CHEQUE_PRESENTED", prio=7)
                    led.add(d, "CREDIT", b["paise"], "CHQ RTN INWARD FUNDS INSUFFICIENT", "CHEQUE",
                            "CHEQUE_RETURN", prio=8)
                    led.add(d, "DEBIT", CHEQUE_RETURN_CHARGE, "CHQ RTN CHGS INCL GST", "OTHERS",
                            "RETURN_CHARGE", prio=9)
                else:
                    mode = b["kind"]
                    led.add(d, "DEBIT", b["paise"], f"{mode} DR {b['lender']} {b['loan_ref']}", mode,
                            "EMI_PRESENTED", prio=7)
                    led.add(d, "CREDIT", b["paise"], f"{mode} RTN {b['lender']} INSUFFICIENT FUNDS", mode,
                            "EMI_RETURN", prio=8)
                    led.add(d, "DEBIT", RETURN_CHARGE, f"{mode} RTN CHGS INCL GST", "OTHERS",
                            "RETURN_CHARGE", prio=9)
                    if b.get("represent_day"):
                        led.add(date(y, m, b["represent_day"]), "DEBIT", b["paise"],
                                f"{mode} DR {b['lender']} {b['loan_ref']} REPRESENT", mode, b["tag"], prio=3)
        if p.get("negative_month_end"):
            led.add(date(y, m, 25), "DEBIT", p["negative_month_end"], "IMPS P2P TRANSFER SELF OTHER BANK",
                    "IMPS", "LARGE_TRANSFER", prio=6)

    if p.get("reversal"):
        r = p["reversal"]
        led.add(r["date"], "DEBIT", r["paise"], f"NEFT RETURN SALARY REVERSAL {r['employer']}", "NEFT",
                "SALARY_REVERSAL", prio=2)

    # ---- simulate
    led.events.sort(key=lambda e: (e[0], e[1], e[2]))
    balance = p["opening_paise"]
    opening = balance
    rows = []
    for d, _prio, _n, kind, paise, nar, mode, tag, optional in led.events:
        if d < start or d > end:
            continue
        if kind == "DEBIT" and optional and balance - paise < floor:
            continue
        balance += paise if kind == "CREDIT" else -paise
        rows.append((d, kind, paise, nar, mode, tag, balance))

    sid = p["statement_id"]
    txns = []
    for n, (d, kind, paise, nar, mode, tag, bal) in enumerate(rows, start=1):
        assert mode in MODES, mode
        txns.append({
            "txn_id": f"{sid}-T{n:04d}",
            "txn_date": d.isoformat(),
            "value_date": d.isoformat(),
            "narration": nar,
            "mode": mode,
            "type": kind,
            "amount": _rs(paise),
            "balance": _rs(bal),
            "reference": "SYNREF" + hashlib.sha256(f"{sid}:{n}".encode()).hexdigest()[:10].upper(),
            "synthetic_truth_tag": tag,
        })
    account = {
        "masked_account_number": mask_account(p["account_number"]),
        "account_ref": p["account_ref"],
        "account_type": "SAVINGS",
        "od_limit": float(p["od_limit"]),
        "ifsc": p["ifsc"],
        "bank_name": p["bank_name"],
        "branch": "SPECIMEN BRANCH",
        "holder_name": p["holder_name"],
        "currency": "INR",
    }
    summary = {
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "months": p["months"],
        "opening_balance": _rs(opening),
        "closing_balance": _rs(balance),
        "txn_count": len(txns),
        "total_credits": _rs(sum(r[2] for r in rows if r[1] == "CREDIT")),
        "total_debits": _rs(sum(r[2] for r in rows if r[1] == "DEBIT")),
    }
    stmt = {
        "schema": SCHEMA,
        "synthetic": True,
        "specimen_marker": SPECIMEN,
        "statement_id": sid,
        "applicant_id": p["applicant_id"],
        "fi_type": "DEPOSIT",
        "account": account,
        "summary": summary,
        "transactions": txns,
    }
    content = statement_content_hash(stmt)
    if p.get("tamper"):
        # Edit one running balance after issue: the stored hash is the issued one, so a
        # recomputed hash no longer matches and balance arithmetic breaks at that row.
        victim = txns[len(txns) // 2]
        victim["balance"] = round(victim["balance"] + 25_000.0, 2)
    stmt["integrity"] = {"content_sha256": content, "hash_scope": HASH_SCOPE,
                         "issued_by": "saral-synthetic-kyc-bank"}
    stmt["lms_reference"] = {"statement_id": sid, "content_sha256": content,
                             "period_start": summary["period_start"], "period_end": summary["period_end"],
                             "txn_count": len(txns), "synthetic": True}
    return stmt


def days_in(month_start: date) -> int:
    nxt = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return (nxt - month_start).days
