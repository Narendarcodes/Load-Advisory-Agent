"""Offline checks for the Saral corpus v3 manifest (Gate G1). No corpus texts, network or models needed."""
import csv
import importlib.util
import json
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
V3 = ROOT / "data" / "corpus_v3"
spec = importlib.util.spec_from_file_location("build_corpus_v3", ROOT / "scripts" / "policy" / "build_corpus_v3.py")
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


def manifest():
    return json.loads((V3 / "manifest.json").read_text(encoding="utf-8"))


def test_every_register_document_has_a_decision():
    reg = {d["document_id"] for d in yaml.safe_load((ROOT / "data/sources/policy_register.yaml").read_text(encoding="utf-8"))["documents"]}
    decided = set(yaml.safe_load((V3 / "collections.yaml").read_text(encoding="utf-8"))["documents"])
    assert reg == decided


def test_collections_hold_only_their_own_source():
    for r in manifest()["documents"]:
        if r["include"]:
            prefix = {"saral_nbfc_policy": "BFL-", "rbi_regulatory": "RBI-"}[r["collection"]]
            assert r["document_id"].startswith(prefix), r["document_id"]
            assert r["clean_text_sha256"] and r["chunks_after"] > 0


def test_required_exclusions():
    rows = {r["document_id"]: r for r in manifest()["documents"]}
    for did in ("HDFC-PL-ELIG", "ICICI-PL-ELIG", "SYN-POLICY-V1", "SYN-INJECT-001", "SYN-INJECT-002",
                "RBI-MC-CS-2015", "RBI-RBC-CB-2025", "BFL-KYC-PMLA-POLICY"):
        assert rows[did]["include"] is False and rows[did]["reason"], did


def test_chunk_index_matches_manifest_and_has_no_duplicates():
    with (V3 / "chunk_index.csv").open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    m = manifest()
    for col, info in m["collections"].items():
        mine = [r for r in rows if r["collection"] == col]
        assert len(mine) == info["chunks"]
        assert max(Counter(r["chunk_sha256"] for r in mine).values()) == 1
        assert len({r["chunk_id"] for r in mine}) == len(mine)
    per_doc = Counter(r["document_id"] for r in rows)
    for r in m["documents"]:
        assert per_doc.get(r["document_id"], 0) == r["chunks_after"]


def test_ai_overview_removal():
    body = "Intro\nAI Overview\nListen\nmachine text\nAI-powered responses may not always be accurate.\n" \
           "Assess the information carefully before relying on it. Product offerings apply.\nKeep me\n" \
           "Customers say\nsummary of reviews\nGenerated from the text of customer reviews.\nA review"
    out = b.fix_drop_ai_overview("X", body, {}, None, [])
    assert out.split("\n") == ["Intro", "Keep me", "Customers say", "A review"]


def test_partner_table_numbering_is_not_a_section_break():
    body = "Partner A\n1. Customer acquisition\n2. Servicing\n1. Bajaj Finance Limited (“BFL”) is a Non-Banking Finance Company x"
    out = b.fix_unnumber_partner_table("X", body, {"table_end_prefix": "1. Bajaj Finance Limited (“BFL”) is a Non-Banking"}, None, [])
    assert out.split("\n")[1:3] == ["1) Customer acquisition", "2) Servicing"]
    assert out.split("\n")[3].startswith("1. Bajaj")


def test_decisions_have_only_known_keys():
    """A comma in an unquoted flow-style reason silently becomes an extra YAML key; catch that."""
    known = {"collection", "include", "reason", "fixes", "flags", "start_marker", "end_marker", "banner_prefix",
             "table_end_prefix"}
    docs = yaml.safe_load((V3 / "collections.yaml").read_text(encoding="utf-8"))["documents"]
    for did, d in docs.items():
        assert set(d) <= known, (did, set(d) - known)
        assert isinstance(d["reason"], str) and d["reason"].strip(), did
