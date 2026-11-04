"""The design docs, the draft rule catalogue, the fixtures and the schemas agree."""
import json
import re
from pathlib import Path

from contracts import export_schemas
from contracts.zen import DataPointName

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "saral"
CATALOGUE = json.loads((DOCS / "rule_catalogue.draft.json").read_text(encoding="utf-8"))


def _all_rules():
    rules = list(CATALOGUE["base_rules"])
    for prs in CATALOGUE["product_rules"].values():
        rules.extend(prs)
    return rules


def test_json_schemas_are_current():
    assert export_schemas.main(["--check"]) == 0


def test_catalogue_is_draft_and_labelled():
    assert CATALOGUE["status"].startswith("DRAFT")
    assert CATALOGUE["lender_relationship"] == "public reference lender, not a partner"


def test_every_rule_reads_a_catalogued_data_point():
    names = {n.value for n in DataPointName}
    for r in _all_rules():
        assert r["field"] in names, r["rule_id"]


def test_every_rule_has_exactly_one_basis():
    for r in _all_rules():
        if r["threshold_basis"] == "BAJAJ-SOURCED":
            assert r["source_chunk"] and not r["assumption_id"], r["rule_id"]
            assert r["source_chunk"] in CATALOGUE["excerpts"], r["rule_id"]
        else:
            assert r["threshold_basis"] == "ASSUMPTION" and r["assumption_id"] and not r["source_chunk"]


def test_every_assumption_is_in_the_approvals_table_and_design():
    approvals = (DOCS / "THRESHOLD_APPROVALS.md").read_text(encoding="utf-8")
    design = (DOCS / "ZEN_DESIGN.md").read_text(encoding="utf-8")
    used = {r["assumption_id"] for r in _all_rules() if r["assumption_id"]}
    used |= {e["assumption_id"] for s in CATALOGUE["segments"] for e in s["effects"] if e.get("assumption_id")}
    used.add(CATALOGUE["assessment_rate_for_new_emi"]["assumption_id"])
    table_ids = set(re.findall(r"^\| (A-\d{2}) \|", approvals, re.M))
    assert used <= table_ids, sorted(used - table_ids)
    for aid in table_ids:
        assert aid in design, f"{aid} is in the approvals table but not explained in ZEN_DESIGN.md"


def test_every_rule_is_in_the_design_doc():
    design = (DOCS / "ZEN_DESIGN.md").read_text(encoding="utf-8")
    for r in _all_rules():
        assert r["rule_id"] in design, r["rule_id"]


def test_fixture_rows_match_the_catalogue(fx):
    by_id = {}
    for r in CATALOGUE["base_rules"]:
        by_id[r["rule_id"]] = r
    for name in ["zen_output_approve_draft", "zen_output_refer_low_confidence", "zen_output_decline_writeoff"]:
        out = fx(name)
        product = {r["rule_id"]: r for r in CATALOGUE["product_rules"][out["product_id"]]}
        for row in out["trace"]["rows"]:
            spec = by_id.get(row["rule_id"]) or product[row["rule_id"]]
            for k in ("operator", "on_fail", "threshold_basis", "reason_code", "field", "category"):
                assert row[k] == spec[k], (name, row["rule_id"], k)
            if not row["segment_override"]:
                assert row["threshold_value"] == spec["threshold_value"], (name, row["rule_id"])


ID_KEYS = ("applicant_id", "application_id", "report_id", "trace_id", "extraction_id", "document_id",
           "tradeline_id", "enquiry_id", "bureau_report_id", "reference_document_id", "candidate_document_id")


def test_fixtures_use_synthetic_ids_only():
    pattern = re.compile(r'"(' + "|".join(ID_KEYS) + r')": "([^"]+)"')
    seen = 0
    for path in (ROOT / "contracts" / "fixtures").glob("*.json"):
        text = path.read_text(encoding="utf-8")
        for key, value in pattern.findall(text):
            seen += 1
            assert value.startswith("SYN-"), (path.name, key, value)
        for ids in re.findall(r'"(?:source_document_ids|extraction_ids)": \[([^\]]*)\]', text):
            for value in re.findall(r'"([^"]+)"', ids):
                assert value.startswith("SYN-"), (path.name, value)
    assert seen > 50
