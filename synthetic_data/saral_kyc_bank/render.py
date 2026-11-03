"""Optional OCR hook: render SPECIMEN document images (needs Pillow only).

Style follows scripts/saral_ocr/generate_synthetic_docs.py on feat/saral-ocr-paddle-signature
@ 0b5dede in its "banner" mode: a red frame plus a SPECIMEN - SYNTHETIC banner in the top-right
corner, and no diagonal watermark (the bake-off found the diagonal overlay hurts PaddleOCR
detection). Each image gets a ground-truth JSON with the signature crop box, so the OCR chain
can crop the PAN reference signature and the NACH-mandate signature and compare them.
"""
from __future__ import annotations

import json
from pathlib import Path

from .signatures import render_signature

BANNER = "SPECIMEN - SYNTHETIC"
FONT_DIRS = ["/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/dejavu", "/usr/share/fonts/TTF"]
PAN_SIG_BOX = (640, 440, 960, 580)  # x0, y0, x1, y1 on the 1012x638 PAN card
NACH_SIG_BOX = (760, 600, 1160, 780)  # on the 1240x900 NACH mandate / application form


def _font(size: int, bold: bool = False, mono: bool = False):
    from PIL import ImageFont  # noqa: PLC0415

    name = ("DejaVuSansMono" if mono else "DejaVuSans") + ("-Bold.ttf" if bold else ".ttf")
    for d in FONT_DIRS:
        p = Path(d) / name
        if p.is_file():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def _canvas(w: int, h: int, tint=(255, 255, 255)):
    from PIL import Image, ImageDraw  # noqa: PLC0415

    img = Image.new("RGB", (w, h), tint)
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, w - 5, h - 5], outline=(200, 30, 30), width=4)
    d.rectangle([w - 300, 10, w - 12, 46], fill=(200, 30, 30))
    d.text((w - 290, 16), BANNER, font=_font(20, bold=True), fill="white")
    return img, d


def _paste_sig(img, sample, box):
    w, h = box[2] - box[0], box[3] - box[1]
    img.paste(render_signature(sample, (w, h)), box[:2])


def pan_card(a: dict):
    img, d = _canvas(1012, 638, (232, 240, 248))
    d.rectangle([8, 56, 1003, 130], fill=(40, 70, 130))
    d.text((30, 75), "SYNTHETIC TAX ID SPECIMEN (NOT A PAN CARD)", font=_font(26, bold=True), fill="white")
    p = a["pan"]
    d.text((330, 150), a["specimen_truth"]["pan_number"], font=_font(40, bold=True, mono=True), fill=(10, 10, 10))
    d.rectangle([40, 150, 230, 390], outline=(90, 90, 90), width=2)
    d.text((80, 255), "PHOTO", font=_font(28), fill=(150, 150, 150))
    y = 220
    for label, value in (("Name", p["name_on_pan"]), ("Father's Name", p["father_name_on_pan"]),
                         ("Date of Birth", p["dob_on_pan"])):
        d.text((270, y), label, font=_font(18), fill=(60, 60, 60))
        d.text((270, y + 22), value, font=_font(26, bold=True), fill=(10, 10, 10))
        y += 70
    _paste_sig(img, a["signature"]["reference"], PAN_SIG_BOX)
    d.rectangle(PAN_SIG_BOX, outline=(120, 120, 120), width=1)
    d.text((PAN_SIG_BOX[0], PAN_SIG_BOX[3] + 6), "Signature", font=_font(18), fill=(80, 80, 80))
    truth = {"doc_type": "PAN", "synthetic": True, "pan_number": a["specimen_truth"]["pan_number"], "name": p["name_on_pan"],
             "father_name": p["father_name_on_pan"], "date_of_birth": p["dob_on_pan"],
             "signature_box": list(PAN_SIG_BOX), "signature_role": "reference"}
    return img, truth


def aadhaar_card(a: dict):
    img, d = _canvas(1012, 638)
    e = a["aadhaar_ekyc"]
    d.rectangle([8, 56, 1003, 120], fill=(255, 153, 51))
    d.text((30, 72), "SYNTHETIC ID SPECIMEN (NOT AN AADHAAR)", font=_font(28, bold=True), fill=(30, 30, 30))
    d.rectangle([40, 150, 230, 390], outline=(90, 90, 90), width=2)
    d.text((80, 255), "PHOTO", font=_font(28), fill=(150, 150, 150))
    d.text((270, 160), e["name"], font=_font(32, bold=True), fill=(10, 10, 10))
    dob = e["dob"] or f"Year of Birth: {e['year_of_birth']}"
    uid_masked = f"XXXX-XXXX-{e['aadhaar_last4']}"
    d.text((270, 215), f"DOB: {dob}", font=_font(26), fill=(10, 10, 10))
    d.text((270, 260), {"M": "MALE", "F": "FEMALE"}[e["gender"]], font=_font(26), fill=(10, 10, 10))
    d.text((300, 520), uid_masked, font=_font(44, bold=True, mono=True), fill=(10, 10, 10))
    truth = {"doc_type": "AADHAAR", "synthetic": True, "aadhaar_masked": uid_masked,
             "aadhaar_last4": e["aadhaar_last4"], "name": e["name"], "date_of_birth": e["dob"],
             "yob": e["year_of_birth"]}
    return img, truth


def bank_statement(stmt: dict, rows: int = 40):
    img, d = _canvas(1240, 1754)
    acc = stmt["account"]
    d.text((60, 70), acc["bank_name"].upper() + " - SYNTHETIC STATEMENT", font=_font(30, bold=True), fill=(20, 40, 90))
    for k, (label, value) in enumerate((("Account holder", acc["holder_name"]),
                                        ("Account", acc["masked_number"]),
                                        ("IFSC (synthetic)", acc["ifsc"]),
                                        ("Period", f"{stmt['period']['from']} to {stmt['period']['to']}"),
                                        ("Statement id", stmt["statement_id"]))):
        d.text((60, 130 + 32 * k), f"{label}: {value}", font=_font(20), fill=(20, 20, 20))
    y = 320
    heads = (("Date", 60), ("Narration", 200), ("Mode", 760), ("Debit", 860), ("Credit", 980), ("Balance", 1100))
    for h, x in heads:
        d.text((x, y), h, font=_font(18, bold=True), fill=(10, 10, 10))
    y += 34
    for t in stmt["transactions"][:rows]:
        dr = f"{t['amount']:.2f}" if t["type"] == "DEBIT" else ""
        cr = f"{t['amount']:.2f}" if t["type"] == "CREDIT" else ""
        for val, x in ((t["date"], 60), (t["narration"][:44], 200), (t["mode"], 760), (dr, 860),
                       (cr, 980), (f"{t['balance_after']:.2f}", 1100)):
            d.text((x, y), val, font=_font(15, mono=True), fill=(20, 20, 20))
        y += 30
    truth = {"doc_type": "BANK_STATEMENT", "synthetic": True, "statement_id": stmt["statement_id"],
             "content_sha256": stmt["integrity"]["content_sha256"], "rows_rendered": min(rows, len(stmt["transactions"]))}
    return img, truth


def nach_mandate(a: dict, stmt: dict):
    img, d = _canvas(1240, 900)
    d.text((60, 70), "SYNTHETIC NACH MANDATE / LOAN APPLICATION (SPECIMEN)", font=_font(28, bold=True), fill=(20, 40, 90))
    lr = a["loan_request"]
    fields = (("Applicant", a["identity"]["full_name"]), ("Application id", a["application_id"]),
              ("PAN", a["pan"]["pan_masked"]), ("Debit account", stmt["account"]["masked_number"]),
              ("IFSC (synthetic)", stmt["account"]["ifsc"]), ("Amount (max EMI)", f"{lr['proposed_emi_at_assessment_rate']}"),
              ("Loan amount", f"{lr['amount']}"), ("Purpose", lr["purpose"]))
    for k, (label, value) in enumerate(fields):
        d.text((60, 150 + 48 * k), f"{label}:", font=_font(22), fill=(60, 60, 60))
        d.text((360, 150 + 48 * k), str(value), font=_font(22, bold=True), fill=(10, 10, 10))
    form = a["signature"]["form_signature"]
    if form is not None:
        _paste_sig(img, form, NACH_SIG_BOX)
    d.rectangle(NACH_SIG_BOX, outline=(120, 120, 120), width=2)
    d.text((NACH_SIG_BOX[0], NACH_SIG_BOX[3] + 8), "Signature of account holder", font=_font(18), fill=(80, 80, 80))
    truth = {"doc_type": "NACH_MANDATE", "synthetic": True, "application_id": a["application_id"],
             "signature_box": list(NACH_SIG_BOX), "signature_present": form is not None,
             "signature_label": a["signature"]["label"]}
    return img, truth


def render_applicant(a: dict, stmt: dict, out: Path) -> list[dict]:
    folder = out / a["applicant_id"]
    folder.mkdir(parents=True, exist_ok=True)
    made = []
    for name, (img, truth) in (("pan_card", pan_card(a)), ("aadhaar_card", aadhaar_card(a)),
                               ("bank_statement_p1", bank_statement(stmt)), ("nach_mandate", nach_mandate(a, stmt))):
        img.save(folder / f"{name}.png")
        truth["applicant_id"] = a["applicant_id"]
        (folder / f"{name}.json").write_text(json.dumps(truth, indent=2), encoding="utf-8")
        made.append({"file": f"{a['applicant_id']}/{name}.png", **truth})
    return made
