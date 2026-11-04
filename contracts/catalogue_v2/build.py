"""Build the Saral rule catalogue v2, data dictionary and companion docs (DESIGN ONLY).

    python -m contracts.catalogue_v2.build            # write every output
    python -m contracts.catalogue_v2.build --check    # fail if any output is stale
    python -m contracts.catalogue_v2.build --corpus /workspace/work/loan-qa/work/g1/out   # also verify excerpts

Nothing here is wired into ZEN. No JDM file is produced.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import yaml

from contracts.catalogue_v2 import fields as F
from contracts.catalogue_v2 import frontend as FE
from contracts.catalogue_v2 import products as PR
from contracts.catalogue_v2 import sources as S
from contracts.catalogue_v2.messages import CATEGORIES, MESSAGES
from contracts.catalogue_v2.rules import BAJ, DEFERRED, EXCERPTS, OWN, PEN, PRO, REG, RULES, V2_IDS

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "saral"
SOURCE_YAML = DOCS / "source" / "USER_RULE_CATALOGUE_PL.yaml"
CATALOGUE_VERSION = "saral-pl-catalogue-2.0.0-draft"
CATALOGUE_DATE = "2026-11-03"
CORPUS_REF = "G1 corpus work/g1/out (= feat/saral-corpus-collections @ 3de95b0): saral_nbfc_policy, rbi_regulatory"
APPROVED = {BAJ, REG, OWN}
RANK = {BAJ: 0, REG: 0, OWN: 0, PEN: 1, PRO: 2}
EFFECT_SEVERITY = {"DECLINE": "HARD_DECLINE", "MANUAL_REVIEW": "REVIEW", "MORE_INFORMATION_REQUIRED": "INFO_REQUEST",
                   "NONE": "COMPUTATION"}
FRONTEND_IDS = {f["field_id"] for f in FE.FIELDS}


def chunk_of(key):
    a, b = key.split("#")[:2]
    return f"{a}#{b}"


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


# ---------------------------------------------------------------- coverage
def dictionary():
    return {r["name"]: r for r in F.rows()}


def supplied(ref, dd, seen=None):
    """(ok, reason) for a dictionary field name or a FRONTEND:/<SOURCE>: reference, in the MVP."""
    seen = seen or set()
    if ref.startswith("FRONTEND:"):
        fid = ref.split(":", 1)[1]
        return (fid in FRONTEND_IDS, f"frontend field {fid} not in the MVP spec")
    if ":" in ref and ref.split(":", 1)[0] in S.SOURCES:
        src, path = ref.split(":", 1)
        if src not in S.MVP_SOURCES:
            return False, f"needs {S.SOURCES[src]['schema']} ({path})"
        return (S.has_path(src, path), f"{src} has no path {path}")
    if ref in seen:
        return True, ""
    seen = seen | {ref}
    row = dd.get(ref)
    if row is None:
        return False, f"{ref} not in the data dictionary"
    sup = row["mvp_supply"]
    if sup == "NONE":
        return False, f"{ref}: no MVP source ({row['formula_or_note']})"
    if sup in ("POLICY", "SYSTEM"):
        return True, ""
    if sup in ("DERIVED", "FRAPPE_HISTORY"):
        for d in row["derived_from"]:
            ok, why = supplied(d, dd, seen)
            if not ok:
                return False, why
        return True, ""
    return supplied(sup, dd, seen)


# ---------------------------------------------------------------- catalogue
def load_yaml():
    return yaml.safe_load(SOURCE_YAML.read_text(encoding="utf-8"))


def build_catalogue():
    y = load_yaml()
    canon = {r["id"]: (g, r) for g, rs in y["rule_groups"].items() for r in rs}
    dd = dictionary()
    rules = []
    for spec in RULES:
        rid = spec["rule_id"]
        if rid in canon:
            group, c = canon[rid]
            name, impl, inputs, check = c["name"], c["implementation"], list(c["inputs"]), c["check"]
            origin = "USER_CATALOGUE"
        else:
            n = spec["new"]
            group, name, impl, inputs, check = n["group"], n["name"], n["impl"], list(n["inputs"]), n["check"]
            origin = "HARK_V2_OR_DRAFT" if (spec["v2"] or spec["draft"]) else "OWNER_DIRECTIVE"
        all_inputs = inputs + [e for e in spec["extra"] if e not in inputs]
        status = spec["status"] or (max((p["approval_status"] for p in spec["params"]), key=RANK.get) if spec["params"] else PRO)
        effect = spec["effect"]
        if spec["sensitive"]:
            assert effect == "MANUAL_REVIEW" and spec["msg"] == "DETAILS_NOT_VERIFIED.generic", rid
        cat, message = MESSAGES[spec["msg"]]
        mcat, mmsg = MESSAGES[spec["missing_msg"] or spec["msg"]]
        if spec["kind"] == "COMPUTE":
            mcat, mmsg = MESSAGES[spec["missing_msg"] or "OTHER.processing"]
        unsupplied = []
        for i in all_inputs:
            ok, why = supplied(i, dd)
            if not ok:
                unsupplied.append(why)
        deferred_reason = DEFERRED.get(rid) or ("; ".join(sorted(set(unsupplied))) if unsupplied else None)
        chunks = sorted({p["source_chunk"] for p in spec["params"] if p["source_chunk"]})
        context = sorted({c for p in spec["params"] for c in p["context_chunks"]} | set(spec["ctx"]))
        aids = sorted({p["assumption_id"] for p in spec["params"] if p["assumption_id"]})
        tests = []
        for i, t in enumerate(spec["tests"], 1):
            tests.append({"case_id": f"{rid}-T{i}", **t})
        tests.append({"case_id": f"{rid}-T{len(tests) + 1}", "inputs": {}, "expected_outcome": "INSUFFICIENT_DATA",
                      "description": "all inputs missing: never a FAIL", "expected_value": None})
        hard_pending = effect == "DECLINE" and status not in APPROVED
        rules.append({
            "rule_id": rid, "rule_name": name, "rule_group": group, "implementation_type": impl, "check": check,
            "rule_origin": origin, "kind": spec["kind"], "enabled": spec["enabled"],
            "input_schema": [{"name": i, "type": dd[i]["type"], "unit": dd[i]["unit"], "source": dd[i]["source"],
                              "declared_in_user_catalogue": i in inputs} for i in all_inputs],
            "condition": spec["condition"], "applies_when": spec["applies"],
            "parameters": spec["params"],
            "outcome": {"when_condition_true": "PASS" if spec["kind"] != "COMPUTE" else "PASS (value computed)",
                        "when_condition_false": spec["fail"], "when_input_missing": "INSUFFICIENT_DATA"},
            "decision_effect": {"on_fail": effect,
                                "on_missing": "MORE_INFORMATION_REQUIRED" if spec["essential"] or spec["kind"] == "INFO_REQUEST" else "NO_EFFECT",
                                "low_confidence_downgrades_decline_to_review": spec["lowconf"] or effect == "DECLINE",
                                "decline_active_only_in": "prototype_synthetic (not_for_live_use)" if hard_pending else None},
            "severity": EFFECT_SEVERITY[effect],
            "risk_signal": spec["sensitive"],
            "policy_source": {"source_chunks": chunks, "context_chunks": context, "assumption_ids": aids,
                              "conflict": spec["conflict"], "open_interpretations": spec["interpretations"],
                              "corpus": CORPUS_REF if chunks or context else None},
            "policy_version": CATALOGUE_VERSION,
            "approval_status": status,
            "zen_authority": "authoritative (prototype_synthetic, pending approval)",
            "public_guidance": "Bajaj value is indicative public guidance; ZEN decides" if status == BAJ else None,
            "effective_from": CATALOGUE_DATE if status in APPROVED else None,
            "effective_to": None,
            "profiles": (["bajaj_published", "prototype_synthetic"] if status in APPROVED else ["prototype_synthetic"]) if spec["enabled"] else [],
            "mvp_status": "DEFERRED" if deferred_reason else "ACTIVE",
            "mvp_deferred_reason": deferred_reason,
            "borrower_reason_category": cat,
            "borrower_message": message,
            "borrower_message_when_missing": mmsg,
            "borrower_message_when_missing_category": mcat,
            "internal_reason": spec["internal"],
            "v2_ids": spec["v2"], "draft_ids": spec["draft"],
            "test_cases": tests, "note": spec["note"],
        })
    return y, rules


def aggregation(y):
    return {
        "precedence": ["DECLINE", "MANUAL_REVIEW", "MORE_INFORMATION_REQUIRED", "ELIGIBILITY_CONDITIONS_MET"],
        "source": "USER_RULE_CATALOGUE_PL.yaml decision_aggregation",
        "rule_outcome_to_effect": {
            "PASS": "none",
            "FAIL": "decision_effect.on_fail (DECLINE only on approved hard-decline rules in production; pending ones only in prototype_synthetic)",
            "REVIEW": "MANUAL_REVIEW",
            "INSUFFICIENT_DATA": "decision_effect.on_missing (MORE_INFORMATION_REQUIRED or NO_EFFECT); never DECLINE",
        },
        "constraints": y["decision_aggregation"]["constraints"] + [
            "A DECLINE resting on a low-confidence (OCR-derived) value becomes MANUAL_REVIEW.",
            "A risk-signal rule (risk_signal=true) can only produce MANUAL_REVIEW and the generic borrower category DETAILS_NOT_VERIFIED.",
            "A rule whose mvp_status is DEFERRED is not evaluated in the MVP; it is kept in the catalogue.",
            "The offer step (PL-125) runs after the gates. DECLINE from a gate wins; under MANUAL_REVIEW the offer is indicative for the underwriter.",
            "ELIGIBILITY_CONDITIONS_MET with eligible_amount < requested_amount is reported as COUNTER_OFFER; it is not a sanction.",
        ],
        "offer_outcomes": ["APPROVED", "COUNTER_OFFER", "DECLINE"],
    }


def profiles(rules):
    return {
        "bajaj_published": {
            "description": "Only rules whose every parameter is APPROVED_BAJAJ_SOURCE, APPROVED_REGULATORY or APPROVED_OWNER_DECISION.",
            "rule_ids": [r["rule_id"] for r in rules if "bajaj_published" in r["profiles"]],
            "not_for_live_use": True,
            "self_sufficient": False,
            "note": "Some approved gates read values computed by pending rules (e.g. PL-008 reads monthly_net_income from PL-009). "
                    "See RULE_CATALOGUE_V2.md 'Profile dependencies'.",
        },
        "prototype_synthetic": {
            "description": "Every enabled rule, including PROTOTYPE_SYNTHETIC and PENDING_BUSINESS_APPROVAL values. Separate test profile.",
            "rule_ids": [r["rule_id"] for r in rules if "prototype_synthetic" in r["profiles"]],
            "not_for_live_use": True,
        },
    }


def profile_dependencies(rules):
    deriver = {}
    for spec in RULES:
        for d in spec["derives"]:
            deriver.setdefault(d, spec["rule_id"])
    by_id = {r["rule_id"]: r for r in rules}
    out = []
    for r in rules:
        if "bajaj_published" not in r["profiles"]:
            continue
        for i in r["input_schema"]:
            src = deriver.get(i["name"])
            if src and src != r["rule_id"] and "bajaj_published" not in by_id[src]["profiles"]:
                out.append({"rule_id": r["rule_id"], "input": i["name"], "computed_by": src,
                            "computed_by_status": by_id[src]["approval_status"]})
    return out


def catalogue_json():
    y, rules = build_catalogue()
    v2_map = {v: [r["rule_id"] for r in rules if v in r["v2_ids"]] for v in V2_IDS}
    draft_map = {}
    for r in rules:
        for d in r["draft_ids"]:
            draft_map.setdefault(d, []).append(r["rule_id"])
    return {
        "status": "DRAFT - design only; not wired into ZEN; not for live use",
        "catalogue_version": CATALOGUE_VERSION,
        "single_source_of_truth": "This JSON is the only source of ZEN rules and thresholds. RAG must never index it; "
                                  "the agent reads decision reasons from the stored decision, and underwriter lookups are exact by rule_id.",
        "canonical_source": "docs/saral/source/USER_RULE_CATALOGUE_PL.yaml (user's PL-001..PL-099)",
        "lender": "Bajaj Finance Ltd", "lender_relationship": "public reference lender, not a partner",
        "corpus": CORPUS_REF,
        "products": ["PL_WEDDING", "PL_HIGHER_EDUCATION", "PL_HOME_RENOVATION", "PL_MEDICAL_EMERGENCY"],
        "products_status": "APPROVED_OWNER_DECISION (2026-11-03 23:03 IST); per-product thresholds are ASSUMPTION",
        "mvp_scope": "Salaried applicants only (user decision 2026-11-03 22:50 IST)",
        "outcomes": y["outcomes"],
        "implementation_types": y["implementation_types"],
        "approval_status_values": y["policy_governance"]["approval_status_values"] + [OWN],
        "approval_status_extension": f"{OWN} added for the owner-approved product list; the user should accept or rename it.",
        "required_rule_metadata": y["policy_governance"]["required_rule_metadata"],
        "borrower_reason_categories": CATEGORIES,
        "decision_aggregation": aggregation(y),
        "profiles": profiles(rules),
        "profile_dependencies": profile_dependencies(rules),
        "amount_bands": PR.BANDS,
        "offer_sizing": {"grade_income_multiplier": PR.GRADE_MULTIPLIER, "grade_foir_cap": PR.GRADE_FOIR,
                         "grade_band_cap": PR.GRADE_BAND_CAP, "minimum_amount": PR.BAJAJ_MIN_AMOUNT,
                         "basis": "ASSUMPTION (prototype_synthetic) except the minimum amount (BFL-PL-OVERVIEW#003)",
                         "worked_examples": worked_examples()},
        "conflicts": {
            "C1": "Maximum amount: Rs. 75 lakh (BFL-PL-OVERVIEW#003, #017) vs Rs. 55 lakh (BFL-PL-RATES-FEES#011 tables; bajaj_v1 anchors). Catalogue uses 75 lakh (PL-070); no effect on the four products (caps <= 25 lakh).",
            "C2": "Credit score: 650 (BFL-PL-ELIG-DOCS#007, BFL-PL-RATES-FEES#023) vs 685 minimum / 750 ideal (BFL-INSIGHT-REJECTION#001, an education article). Catalogue uses 650 (PL-029); 750 only as the grade-A / PRIME edge.",
        },
        "v2_to_pl": v2_map, "draft_to_pl": draft_map,
        "excerpts": EXCERPTS,
        "rules": rules,
    }


def worked_examples():
    out = []
    for e in PR.WORKED_EXAMPLES:
        e = dict(e)
        name = e.pop("name")
        out.append({"name": name, "input": e, "result": PR.size_offer(**e)})
    return out


# ---------------------------------------------------------------- dictionary JSON
def dictionary_json(rules):
    dd = dictionary()
    users = {}
    for r in rules:
        for i in r["input_schema"]:
            users.setdefault(i["name"], []).append(r["rule_id"])
    fe_by_zen = {}
    for f in FE.FIELDS:
        if f["zen_input"]:
            fe_by_zen.setdefault(f["zen_input"], []).append(f["field_id"])
    fmap = frappe_field_map()["fields"]
    out = []
    for name in sorted(dd):
        row = dict(dd[name])
        loc = fmap.get(name)
        row["frappe_location"] = loc["location"] if loc else None
        row["frappe_location_kind"] = loc["kind"] if loc else None
        ok, why = supplied(name, dd)
        row["used_by_rules"] = sorted(users.get(name, []))
        row["frontend_fields"] = fe_by_zen.get(name, [])
        row["mvp_available"] = ok
        row["mvp_gap"] = None if ok else why
        out.append(row)
    return {
        "status": "DRAFT - design only",
        "catalogue_version": CATALOGUE_VERSION,
        "rag_boundary": "ZEN rules, thresholds and this dictionary are never indexed by RAG. The versioned catalogue JSON "
                        "(docs/saral/rule_catalogue.v2.json) is the single source of truth; RAG indexes only the Bajaj and RBI corpus.",
        "storage_tiers": F.RETENTION,
        "pii_classes": F.PII,
        "fields": out,
        "never_store": [{"name": n, "description": d, "pii_class": p, "note": note} for n, d, p, note in F.NEVER_STORE_EXTRA],
    }


# ---------------------------------------------------------------- Frappe field map
FRAPPE_FIELD_MAP = "contracts/frappe_field_map.json"


def frappe_field_map():
    """Where each dictionary field lives in the Frappe app (feat/saral-lms-doctypes)."""
    return json.loads((ROOT / FRAPPE_FIELD_MAP).read_text(encoding="utf-8"))


# ---------------------------------------------------------------- markdown helpers
def md_table(headers, rows):
    def cell(v):
        if v is None:
            return ""
        if isinstance(v, (list, dict)):
            v = json.dumps(v, ensure_ascii=False)
        return str(v).replace("|", "\\|").replace("\n", " ")
    lines = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for r in rows:
        lines.append("| " + " | ".join(cell(c) for c in r) + " |")
    return "\n".join(lines)


def fmt_value(p):
    v = p["value"]
    if isinstance(v, (list, dict)):
        return json.dumps(v, ensure_ascii=False)
    return str(v) + (f" {p['unit']}" if p["unit"] else "")


def write(path, text, check, stale):
    path = Path(path)
    if check:
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            stale.append(str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path))
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def dump(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def verify_corpus(corpus):
    chunks = {}
    for f in ("saral_nbfc_policy", "rbi_regulatory"):
        for line in (Path(corpus) / f"{f}.chunks.jsonl").read_text(encoding="utf-8").splitlines():
            d = json.loads(line)
            chunks[d["chunk_id"]] = norm(d["text"])
    bad = []
    quotes = [(k, v) for k, v in EXCERPTS.items()]
    for k, v in PR.BAJAJ_BASE.items():
        quotes.append((v["chunk"], v["quote"]))
        if "also" in v:
            quotes.append((v["also"]["chunk"], v["also"]["quote"]))
    for p in PR.PRODUCTS.values():
        quotes.append((p["bajaj_description"]["chunk"], p["bajaj_description"]["quote"]))
    from contracts.catalogue_v2.render import OVERLAPS
    quotes += [(o[1], o[2]) for o in OVERLAPS]
    for k, v in quotes:
        c = chunk_of(k)
        if c not in chunks or norm(v) not in chunks[c]:
            bad.append(k)
    return bad, len(quotes)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--corpus", default=None)
    args = ap.parse_args(argv)
    if args.corpus:
        bad, n = verify_corpus(args.corpus)
        if bad:
            print("excerpts not found verbatim:", bad)
            return 1
        print(f"verified {n} quotes against {args.corpus}")
    from contracts.catalogue_v2 import render
    cat = catalogue_json()
    ddj = dictionary_json(cat["rules"])
    outputs = render.all_outputs(cat, ddj)
    stale = []
    for path, text in outputs.items():
        write(ROOT / path, text, args.check, stale)
    if args.check and stale:
        print("stale:", stale)
        return 1
    print(f"{'checked' if args.check else 'wrote'} {len(outputs)} files; {len(cat['rules'])} rules; {len(ddj['fields'])} fields")
    return 0


if __name__ == "__main__":
    sys.exit(main())
