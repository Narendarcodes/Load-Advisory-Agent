"""ZEN gap fixes (user OK 2026-11-04 09:36 IST): D-12 PL-013/PL-016 active, D-13 PL-130 residency gate, D-15 PL-088 note.
Parameters are unchanged; PL-130 is a new prototype rule (never in the Bajaj profile)."""


def _cat():
    import json
    from pathlib import Path

    return json.loads((Path(__file__).resolve().parents[2] / "docs/saral/rule_catalogue.v2.json").read_text(encoding="utf-8"))


def _rule(cat, rid):
    return next(r for r in cat["rules"] if r["rule_id"] == rid)


def test_employment_rules_are_active_with_unchanged_parameters():
    cat = _cat()
    r13, r16 = _rule(cat, "PL-013"), _rule(cat, "PL-016")
    assert r13["mvp_status"] == r16["mvp_status"] == "ACTIVE"
    assert {p["name"]: p["value"] for p in r13["parameters"]} == {"max_employer_changes_24m": 2}
    assert {p["name"]: p["value"] for p in r16["parameters"]} == {"accepted_employment_statuses": ["PERMANENT"]}
    assert r13["decision_effect"]["on_fail"] == r16["decision_effect"]["on_fail"] == "MANUAL_REVIEW"
    assert r13["decision_effect"]["on_missing"] == r16["decision_effect"]["on_missing"] == "NO_EFFECT"


def test_residency_gate_declines_non_residents_and_asks_when_missing():
    r = _rule(_cat(), "PL-130")
    assert r["mvp_status"] == "ACTIVE" and r["kind"] == "GATE"
    assert r["condition"] == "residency_status in eligible_residency_statuses"
    assert {p["name"]: p["value"] for p in r["parameters"]} == {"eligible_residency_statuses": ["RESIDENT"]}
    assert r["decision_effect"]["on_fail"] == "DECLINE" and r["decision_effect"]["on_missing"] == "MORE_INFORMATION_REQUIRED"
    assert "bajaj_published" not in r["profiles"] and r["approval_status"] == "PROTOTYPE_SYNTHETIC"
    assert [t["expected_outcome"] for t in r["test_cases"][:2]] == ["PASS", "FAIL"]


def test_residency_gate_is_scoped_to_home_renovation_only():
    """Owner decision 2026-11-04 10:15 IST: PL-130 applies to home renovation; the other three products never evaluate it."""
    r = _rule(_cat(), "PL-130")
    assert r["applies_when"] == "loan_purpose == home_renovation"
    assert all(t["inputs"].get("loan_purpose") == "home_renovation" for t in r["test_cases"][:2])
    from contracts.catalogue_v2 import products as PR
    assert "home renovation only" in PR.PRODUCT_RULE_DIFFERENCES["PL-130"]


def test_blank_signature_is_a_missing_document_not_a_signature_finding():
    cat = _cat()
    assert "signature_present false" in _rule(cat, "PL-088")["note"]
    assert _rule(cat, "PL-104")["decision_effect"]["on_missing"] == "NO_EFFECT"  # unchanged design
