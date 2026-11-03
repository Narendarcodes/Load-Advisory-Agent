"""Customer segmentation picks HOW to explain, never WHAT (Saral, ADR-0006 plain language).

Builds on PR #43 (BharathkumarGoud179): a rule-based classifier over the applicant's
credit report picks one of four explanation tones. Saral rules on top of it:

* input is the synthetic bureau record passed in (provider contract ``bureau-report/1``,
  paths from contracts/synthetic_sources.json, PR #49), never a demo-file lookup;
* output is only ``segment`` plus ``how_to_explain``;
* the tone strings are plain language: no internal terms, thresholds, targets, gaps,
  rule ids or numbers;
* the segment never changes the decision fields or which facts the model sees, and it is
  never shown to the borrower;
* gender, marital status and family details are never inputs.
"""
from __future__ import annotations

import copy
import json
import re
from pathlib import Path

import pytest

from decision_engine.schemas.bureau import BureauReport
from decision_engine.segmentation import GUIDANCE, SEGMENT_NAMES, classify_bureau_report, derive_features
from decision_engine.segmentation.customer_segmentation import load_reports
from loan_advisory.agent import segmentation as AS
from loan_advisory.agent.contracts import AgentResponse

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "segmentation"
CASES = json.loads((FIXTURES / "saral_v1_bureau_reports.json").read_text(encoding="utf-8"))["cases"]
CONTRACT = json.loads((FIXTURES / "bureau_report_v1_paths.json").read_text(encoding="utf-8"))
REPO = Path(__file__).resolve().parent.parent

TONES = ("Guided", "Simple", "Standard", "Detailed")

# Leak probes for the tone strings. A tone string is an instruction the model reads while
# writing to the borrower, so it must not carry anything the borrower must never see.
LEAK_PROBE_TERMS = (
    r"FOIR", r"DTI", r"debt[- ]to[- ]income", r"threshold", r"cut[- ]?offs?", r"score bands?", r"\bbands?\b",
    r"targets?", r"\bgaps?\b", r"\brules?\b", r"rule[ _-]?ids?", r"\bPL-", r"reason codes?", r"utili[sz]ation",
    r"\bDPD\b", r"bureau", r"\bZEN\b", r"segment", r"persona", r"technical", r"metrics?", r"measurable",
    r"percent", r"%", r"ratio", r"CIBIL", r"\bscore\b", r"first[- ]time", r"limit", r"\d",
)
LEAK_PROBES = [re.compile(t, re.I) for t in LEAK_PROBE_TERMS]
DEMOGRAPHIC_KEYS = ("gender", "sex", "marital_status", "married", "spouse", "children", "dependents",
                    "family", "family_size", "father_name", "mother_name")


def _report(case_id: str) -> dict:
    return copy.deepcopy(next(c["report"] for c in CASES if c["case_id"] == case_id))


def _acct(i: int, kind: str, status: str = "CLOSED", months: int = 24, emi: int = 0) -> dict:
    revolving = kind in ("CREDIT_CARD", "OVERDRAFT")
    return {"account_id": f"ACC-{i:02d}", "account_type": kind, "status": status, "opened_on": "2020-01-10",
            "closed_on": None if status != "CLOSED" else "2024-01-10",
            "credit_limit": 50000 if revolving else None, "original_amount": None if revolving else 100000,
            "current_balance": 0, "monthly_obligation": emi if status == "ACTIVE" else 0,
            "months_reviewed": months, "worst_delinquency_days": 0, "payment_history": ["ON_TIME"] * 6,
            "last_payment_date": None, "synthetic": True}


def _with_accounts(accounts: list[dict]) -> dict:
    r = _report("SARAL-SYN-APP-0001")
    r["accounts"] = accounts
    return r


# ------------------------------------------------------------------ contract mapping
def test_fixtures_are_valid_bureau_report_v1_records():
    assert CONTRACT["schema"] == "bureau-report/1"
    assert len(CASES) == 20
    for c in CASES:
        assert c["report"]["schema_version"] == "bureau-report/1"
        BureauReport.model_validate(c["report"])


class _Recorder(dict):
    """A dict that records which contract paths the classifier reads."""

    def __init__(self, data, prefix, seen):
        super().__init__()
        self._prefix, self._seen = prefix, seen
        for k, v in data.items():
            if isinstance(v, dict):
                v = _Recorder(v, f"{prefix}{k}.", seen)
            elif isinstance(v, list):
                v = [_Recorder(x, f"{prefix}{k}[].", seen) if isinstance(x, dict) else x for x in v]
            dict.__setitem__(self, k, v)

    def _mark(self, k):
        self._seen.add(f"{self._prefix}{k}")

    def __getitem__(self, k):
        self._mark(k)
        return dict.__getitem__(self, k)

    def get(self, k, default=None):
        self._mark(k)
        return dict.get(self, k, default)

    def __contains__(self, k):
        self._mark(k)
        return dict.__contains__(self, k)


@pytest.mark.parametrize("case_id", [c["case_id"] for c in CASES])
def test_derive_features_reads_only_bureau_report_v1_contract_paths(case_id):
    seen: set[str] = set()
    report = _report(case_id)
    for k in DEMOGRAPHIC_KEYS:
        report[k] = "probe"
    derive_features(_Recorder(report, "", seen))
    assert seen, "the classifier must read the bureau record"
    paths = set(CONTRACT["paths"])
    containers = {p.split("[]")[0] for p in paths if "[]" in p} | {p.rsplit(".", 1)[0] for p in paths if "." in p}
    assert seen <= paths | containers, sorted(seen - paths - containers)
    assert not any(k in p for p in seen for k in DEMOGRAPHIC_KEYS)


def test_no_demo_applicants_lookup_and_no_data_dir_fixture():
    src = (REPO / "apps/api/src/loan_advisory/agent/segmentation.py").read_text(encoding="utf-8")
    src += (REPO / "decision_engine/segmentation/classifier.py").read_text(encoding="utf-8")
    src += (REPO / "decision_engine/segmentation/customer_segmentation.py").read_text(encoding="utf-8")
    assert "demo_applicants" not in src
    assert not (REPO / "data/synthetic/demo_applicants.json").exists()


def test_features_from_the_synthetic_records():
    prime = derive_features(_report("SARAL-SYN-APP-0001"))
    assert prime["loan_count"] == 2 and prime["distinct_loan_types"] == 2 and prime["revolving_accounts"] == 1
    assert prime["credit_history_months"] == 36 and prime["has_credit_history"] is True
    no_hit = derive_features(_report("SARAL-SYN-APP-0018"))
    assert no_hit["loan_count"] == 0 and no_hit["has_credit_history"] is False
    thin = derive_features(_report("SARAL-SYN-APP-0019"))
    assert thin["loan_count"] == 0 and thin["revolving_accounts"] == 1


# ------------------------------------------------------------------ the four tones
def test_four_tone_levels_only():
    assert tuple(SEGMENT_NAMES) == TONES
    assert set(GUIDANCE) == set(TONES)
    for t in TONES:
        assert len(GUIDANCE[t]) >= 3


def test_guided_uses_numbered_steps():
    assert any("numbered steps" in s for s in GUIDANCE["Guided"])


def test_technical_wording_is_gone():
    text = " ".join(" ".join(v) for v in GUIDANCE.values())
    assert "FOIR" not in text and "DTI" not in text and "measurable" not in text.lower()
    assert "Technical" not in SEGMENT_NAMES


@pytest.mark.parametrize("tone", TONES)
def test_tone_strings_pass_the_leak_probes(tone):
    for line in GUIDANCE[tone]:
        hits = [p.pattern for p in LEAK_PROBES if p.search(line)]
        assert not hits, (tone, line, hits)


@pytest.mark.parametrize("tone", TONES)
def test_rendered_tone_instruction_passes_the_leak_probes(tone):
    seg = {"segment": tone, "how_to_explain": list(GUIDANCE[tone])}
    text = AS.tone_instruction(seg)
    assert text
    hits = [p.pattern for p in LEAK_PROBES if p.search(text)]
    assert not hits, (tone, hits)
    assert tone not in text  # the label itself never reaches the prompt


# ------------------------------------------------------------------ classification
EXPECTED = {c["case_id"]: "Simple" for c in CASES}
EXPECTED["SARAL-SYN-APP-0018"] = "Guided"  # no-hit: no credit record at all
EXPECTED["SARAL-SYN-APP-0019"] = "Guided"  # thin file: one card, no loans yet


@pytest.mark.parametrize("case_id", [c["case_id"] for c in CASES])
def test_classification_on_the_synthetic_applicants(case_id):
    assert classify_bureau_report(_report(case_id))["segment"] == EXPECTED[case_id]


def test_classification_is_deterministic_on_the_synthetic_applicants():
    first = [classify_bureau_report(_report(c["case_id"])) for c in CASES]
    for _ in range(3):
        again = [classify_bureau_report(_report(c["case_id"])) for c in reversed(CASES)][::-1]
        assert again == first
    # shuffling account order does not change the answer
    for c in CASES:
        r = _report(c["case_id"])
        r["accounts"] = list(reversed(r["accounts"]))
        assert classify_bureau_report(r) == classify_bureau_report(_report(c["case_id"]))


def test_standard_and_detailed_from_contract_shaped_records():
    standard = _with_accounts([_acct(i, k) for i, k in enumerate(
        ["PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN", "PERSONAL_LOAN"])])
    for a in standard["accounts"]:
        a["months_reviewed"] = 24
    assert classify_bureau_report(standard)["segment"] == "Standard"
    detailed = _with_accounts([_acct(i, k, months=48) for i, k in enumerate(
        ["PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN", "PERSONAL_LOAN", "CREDIT_CARD"])])
    assert classify_bureau_report(detailed)["segment"] == "Detailed"
    many = _with_accounts([_acct(i, "PERSONAL_LOAN", months=12) for i in range(11)])
    assert classify_bureau_report(many)["segment"] == "Detailed"


def test_demographics_are_never_inputs():
    for c in CASES:
        base = classify_bureau_report(_report(c["case_id"]))
        r = _report(c["case_id"])
        for k in DEMOGRAPHIC_KEYS:
            r[k] = "probe"
        for a in r["accounts"]:
            a.update({"gender": "F", "marital_status": "MARRIED", "dependents": 4})
        assert classify_bureau_report(r) == base


def test_score_does_not_pick_the_tone():
    a, b = _report("SARAL-SYN-APP-0001"), _report("SARAL-SYN-APP-0001")
    a["score"]["value"], b["score"]["value"] = 310, 890
    assert classify_bureau_report(a) == classify_bureau_report(b)


# ------------------------------------------------------------------ output shape and privacy
@pytest.mark.parametrize("case_id", [c["case_id"] for c in CASES])
def test_output_is_only_segment_and_how_to_explain(case_id):
    out = classify_bureau_report(_report(case_id))
    assert set(out) == {"segment", "how_to_explain"}
    assert out["segment"] in TONES and out["how_to_explain"] == list(GUIDANCE[out["segment"]])
    dumped = json.dumps(out)
    r = _report(case_id)
    for secret in (r["applicant_id"], r["application_id"], r["report_id"], str(r["score"]["value"])):
        if secret and secret != "None":
            assert secret not in dumped


def test_agent_adapter_takes_the_bureau_record_passed_in():
    out = AS.get_customer_segmentation(_report("SARAL-SYN-APP-0018"))
    assert out == {"segment": "Guided", "how_to_explain": list(GUIDANCE["Guided"])}
    assert AS.get_customer_segmentation(None) is None
    assert AS.get_customer_segmentation({"applicant_id": "SYN-APP-0001"}) is None  # no lookups by id
    assert AS.get_customer_segmentation({"schema_version": "bureau-report/2", "accounts": []}) is None


def test_agent_adapter_reads_the_record_from_the_evidence():
    rec = {"record_id": "r1", "decision": "REJECTED", "bureau_report": _report("SARAL-SYN-APP-0019")}
    assert AS.bureau_report_from_record(rec)["schema_version"] == "bureau-report/1"
    assert AS.bureau_report_from_record({"record_id": "r1"}) is None
    assert AS.bureau_report_from_record(None) is None


def test_with_tone_keeps_base_style_and_only_adds_how():
    base = "BASE STYLE."
    assert AS.with_tone(base, None) == base
    seg = AS.get_customer_segmentation(_report("SARAL-SYN-APP-0001"))
    styled = AS.with_tone(base, seg)
    assert styled.endswith(base) and styled != base
    assert "Simple" not in styled


def test_cli_loader_reads_bureau_reports(tmp_path):
    p = tmp_path / "reports.json"
    p.write_text(json.dumps({"cases": CASES[:2]}), encoding="utf-8")
    reports = load_reports(p)
    assert [r["schema_version"] for r in reports] == ["bureau-report/1"] * 2


def test_agent_response_has_no_segmentation_field():
    assert "customer_segmentation" not in AgentResponse.model_fields


# ------------------------------------------------------------------ the graph: HOW, never WHAT
def _run_with(bureau_report):
    from loan_advisory.agent.contracts import AgentRequest, Session
    from tests.test_agent_graph import ScriptedLLM, agent_for

    llm = ScriptedLLM(intent="explain")
    ag, _, _ = agent_for(llm)
    real = ag.tools.get_decision_evidence

    def with_report(ref, sess):
        rec = real(ref, sess)
        if rec is not None and bureau_report is not None:
            rec = {**rec, "bureau_report": copy.deepcopy(bureau_report)}
        return rec

    ag.tools.get_decision_evidence = with_report
    req = AgentRequest(request_id="r1", conversation_id="c1", message="Why was my loan rejected?",
                       application_ref="APP-TEST-005")
    resp = ag.run(req, Session(applicant_ref="CUS-TEST-005"))
    compose = [p for p in llm.prompts if p[0] != "classify"]
    return resp, compose


DECISION_FIELDS = ("action", "intent", "decision_card", "improvement_plan", "what_if", "evidence_refs", "citations")


_CLOCK = ("evaluated_at", "generated_at", "timestamp")


def _stable(v):
    """Drop wall-clock fields so two runs of the same decision compare equal."""
    if isinstance(v, dict):
        return {k: _stable(x) for k, x in v.items() if k not in _CLOCK}
    if isinstance(v, list):
        return [_stable(x) for x in v]
    return v


def _facts_of(system: str) -> dict:
    return json.loads(system[system.index("FACTS (JSON):") + 13: system.rindex("}") + 1])


def test_segment_never_alters_decision_fields_or_facts():
    base, base_prompts = _run_with(None)
    guided, guided_prompts = _run_with(_report("SARAL-SYN-APP-0018"))
    detailed, detailed_prompts = _run_with(_with_accounts([_acct(i, k, months=48) for i, k in enumerate(
        ["PERSONAL_LOAN", "AUTO_LOAN", "HOME_LOAN", "PERSONAL_LOAN"])]))
    assert base.decision_card is not None
    for f in DECISION_FIELDS:
        b = _stable(base.model_dump().get(f))
        assert _stable(guided.model_dump().get(f)) == b, f
        assert _stable(detailed.model_dump().get(f)) == b, f
    # the same facts reach the model; only the style line differs
    assert base_prompts and guided_prompts and detailed_prompts
    assert _stable(_facts_of(guided_prompts[0][1])) == _stable(_facts_of(base_prompts[0][1])) \
        == _stable(_facts_of(detailed_prompts[0][1]))
    assert guided_prompts[0][1] != base_prompts[0][1] != detailed_prompts[0][1]
    assert GUIDANCE["Guided"][0] in guided_prompts[0][1]
    assert GUIDANCE["Detailed"][0] in detailed_prompts[0][1]


def test_segment_is_never_visible_to_the_borrower():
    resp, prompts = _run_with(_report("SARAL-SYN-APP-0018"))
    dumped = json.dumps(resp.model_dump(), default=str)
    assert "customer_segmentation" not in dumped and "how_to_explain" not in dumped
    for line in GUIDANCE["Guided"]:
        assert line not in dumped
    assert not re.search(r"\bGuided\b", dumped)
    for _, system, _ in prompts:
        assert not re.search(r"\b(Guided|Detailed)\b", system)
