"""Write a generated universe to disk."""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

from .generator import AS_OF, GENERATION_VERSION, SPECIMEN, build_universe
from .ids import SYNTHETIC_IFSC_PREFIX, SYNTHETIC_PAN_PREFIX

SAFETY = {
    "aadhaar": "12 digits starting 0 or 1 (UIDAI never issues these) with a valid Verhoeff check digit",
    "pan": f"series {SYNTHETIC_PAN_PREFIX}; 4th char P; 5th char surname initial; synthetic flag is authoritative",
    "ifsc": f"{SYNTHETIC_IFSC_PREFIX}+6 digits; 5th char is never 0 so it never matches a real IFSC",
    "pincode": "starts with 0 (Indian PIN codes start 1-9)",
    "phone": "+910000xxxxxx (Indian mobiles start 6-9)",
    "email": "@example.invalid (reserved TLD)",
}


def _dump(path: Path, obj) -> str:
    text = json.dumps(obj, indent=1, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def _jsonl(path: Path, rows) -> str:
    text = "".join(json.dumps(r, ensure_ascii=False, sort_keys=False) + "\n" for r in rows)
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def mapping_rows(universe: dict) -> list[dict]:
    rows = []
    for a in universe["applicants"]:
        bl = a["bureau_link"]
        rows.append({
            "synthetic": "true",
            "applicant_id": a["applicant_id"],
            "application_id": a["application_id"],
            "display_name": a["display_name"],
            "scenario_id": a["scenario"]["id"],
            "bureau_request_application_id": bl["request"]["application_id"],
            "bureau_request_applicant_id": bl["request"]["applicant_id"],
            "bureau_report_id": bl["report_id"] or "",
            "bureau_report_applicant_id": bl["report_applicant_id"] or "",
            "bureau_origin": bl["origin"],
            "bureau_spec": bl["bureau_spec"],
            "statement_id": a["bank_ref"]["statement_id"],
            "statement_content_sha256": a["bank_ref"]["content_sha256"],
            "aadhaar_masked": a["aadhaar_ekyc"]["uid_masked"],
            "pan_masked": a["pan"]["pan_masked"],
        })
    return rows


def write_universe(out: Path, *, count: int, seed: int, render_dir: Path | None = None) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    u = build_universe(count, seed=seed)
    files = {
        "applicants.jsonl": _jsonl(out / "applicants.jsonl", u["applicants"]),
        "bank_statements.jsonl": _jsonl(out / "bank_statements.jsonl", u["statements"]),
        "bureau_cases.json": _dump(out / "bureau_cases.json", u["bureau_cases"]),
        "internal_lists.json": _dump(out / "internal_lists.json", u["internal_lists"]),
    }
    rows = mapping_rows(u)
    with (out / "bureau_mapping.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    files["bureau_mapping.csv"] = hashlib.sha256((out / "bureau_mapping.csv").read_bytes()).hexdigest()
    manifest = {
        "schema": "saral-synthetic-manifest/1",
        "synthetic": True,
        "specimen_marker": SPECIMEN,
        "generation_version": GENERATION_VERSION,
        "seed": seed,
        "count": count,
        "as_of": AS_OF.isoformat(),
        "scenario_counts": u["scenario_counts"],
        "safety": SAFETY,
        "files_sha256": files,
        "regenerate": f"python -m synthetic_data.saral_kyc_bank --count {count} --seed {seed} --out <dir>",
    }
    if render_dir is not None:
        from .render import render_applicant  # noqa: PLC0415

        docs = []
        for a, s in zip(u["applicants"], u["statements"]):
            docs += render_applicant(a, s, render_dir)
        _dump(render_dir / "documents_manifest.json", {"synthetic": True, "banner": "corner", "documents": docs})
        manifest["rendered_documents"] = len(docs)
    _dump(out / "manifest.json", manifest)
    return manifest
