"""Provision one bureau-backed Decision Evidence record on a disposable site (Phase 1.6 §B).

The record is produced by the unchanged pipeline — `run_bureau_evaluation` -> data-quality gate ->
ZEN -> the portal's trusted `evidence.ingest` — reading the application on the `reader` credential and
writing the evidence with the dedicated `evidence` service credential from `seed.json`. No bureau
service runs and no socket is opened: the report comes from `synthetic_bureau.generator.build_report`,
which is the deterministic on-demand path the service itself takes for an application that has no
golden case, and it is handed to the real `BureauClient` through an in-memory httpx transport. Every
client-side guard therefore stays on the path — the loopback URL policy, the response schema, the
refusal of a payload that is not marked synthetic, and the application-id match.

Nothing is invented: the score the decision used is the report's score, and the decision is ZEN's. The
application itself is prepared by `loan_advisory_portal.tests.bureau_fixture.prepare`, on the site.

`--score-mode match` (default) asks the generator for the score the application already records, which
is the one case in which a live application can have its score *confirmed* by a bureau report: the
DocType column is `int NOT NULL default 0`, so a Frappe-backed application can never present "no local
score", and a *different* score would be held by the gate as `DQ_CREDIT_SCORE_CONFLICT` rather than
decided. The mode is printed, and so is the local score, because which of those happened matters.

    python tests/e2e/seed_bureau_evidence.py --seed <path to seed.json> \
        --application ACC-LOAP-2026-00020 --trace-dir <dir>
"""
import argparse
import json
import os
import sys

import httpx

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXTURE_ID = "phase16-bureau-evidence"
SCENARIO = "SUCCESS"
GENERATOR_DEFAULT_SCORE = 760


def _main_repo_paths() -> None:
    sys.path.insert(0, REPO)
    sys.path.insert(0, os.path.join(REPO, "apps", "api", "src"))
    sys.path.insert(0, os.path.join(REPO, "apps", "bureau", "src"))


def _request_would_be_admissible(application_id: str, applicant_id: str) -> dict:
    """Would the real service accept the identifiers this borrower has? Schema answer, no network."""
    from decision_engine.schemas.bureau import BureauReportRequest
    from pydantic import ValidationError

    try:
        BureauReportRequest(application_id=application_id, applicant_id=applicant_id)
    except ValidationError as e:
        return {"admissible": False, "errors": json.loads(e.json())}
    return {"admissible": True, "errors": []}


def _score_kwargs(args, doc) -> dict:
    """Which score the on-demand report carries, and why. Never silent."""
    local = doc.get("custom_credit_score")
    if args.score_mode == "generator_default":
        return {"target_score": GENERATOR_DEFAULT_SCORE}
    if not (isinstance(local, int) and 300 <= local <= 900):
        raise SystemExit(f"{doc.get('name')} records no usable local score (got {local!r}); "
                         "use --score-mode generator_default and expect the gate to hold the run for review")
    return {"target_score": local}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True, help="seed.json copied out of the container")
    parser.add_argument("--application", required=True, help="the synthetic application to underwrite")
    parser.add_argument("--trace-dir", required=True, help="where raw ZEN traces go (outside the repo is fine)")
    parser.add_argument("--frappe-url", default="http://127.0.0.1:8081")
    parser.add_argument("--score-mode", choices=("match", "generator-default"), default="match",
                        help="match: the report confirms the score the application already records")
    args = parser.parse_args()

    seed = json.load(open(args.seed, encoding="utf-8"))
    reader, evidence = seed["reader"], seed["evidence"]
    os.environ["FRAPPE_URL"] = args.frappe_url
    os.environ["FRAPPE_API_KEY"] = reader["api_key"]
    os.environ["FRAPPE_API_SECRET"] = reader["api_secret"]
    os.environ["EVIDENCE_FRAPPE_API_KEY"] = evidence["api_key"]
    os.environ["EVIDENCE_FRAPPE_API_SECRET"] = evidence["api_secret"]
    os.environ["EVIDENCE_TRACE_DIR"] = args.trace_dir

    _main_repo_paths()
    from loan_advisory.application.bureau_intake import run_bureau_evaluation
    from loan_advisory.infrastructure.bureau_client import BureauClient
    from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink
    from loan_advisory.infrastructure.frappe_adapter import FrappeClient
    from synthetic_bureau.generator import build_report
    from synthetic_bureau.settings import DEFAULT_AS_OF, DEFAULT_SEED

    store = FrappeClient()
    doc = store.get(args.application)
    applicant = doc.get("applicant") or doc.get("applicant_id")
    if not applicant:
        print(json.dumps({"error": "the application names no applicant; nothing to underwrite"}))
        return 2

    score_kwargs = _score_kwargs(args, doc)
    report = build_report(args.application, applicant, SCENARIO, seed=DEFAULT_SEED, as_of=DEFAULT_AS_OF,
                          correlation_id=f"BUREAU-{args.application}-FIXTURE", **score_kwargs)
    payload = json.loads(report.model_dump_json())
    client = BureauClient(transport=httpx.MockTransport(
        lambda request: httpx.Response(200, json=payload)))

    result = run_bureau_evaluation(args.application, store=store, sink=FrappeEvidenceSink(),
                                   bureau_client=client)
    print(json.dumps({
        "fixture": FIXTURE_ID,
        "synthetic": True,
        "application": result.application_ref,
        "outcome": result.outcome,
        "decision": result.decision,
        "lifecycle_state": result.lifecycle_state,
        "record_id": result.record_id,
        "flags": result.flags,
        "score_source": result.score_source,
        "data_quality_category": result.data_quality_category,
        "bureau_report": {"report_id": report.report_id, "report_date": report.report_date.isoformat(),
                          "score": report.score.value, "applicant_id": report.applicant_id,
                          "provider": report.provider.name, "synthetic": report.provider.synthetic},
        "report_origin": {"generator": "synthetic_bureau.generator.build_report", "scenario": SCENARIO,
                         "seed": DEFAULT_SEED, "as_of": DEFAULT_AS_OF.isoformat(),
                         "record_origin": "generated_on_demand", "score_mode": args.score_mode,
                         "target_score": score_kwargs.get("target_score"),
                         "service_started": False, "network_used": False},
        "real_service_request": _request_would_be_admissible(args.application, applicant),
        "local_credit_score": doc.get("custom_credit_score"),
    }, indent=1))
    return 0 if result.record_id else 1


if __name__ == "__main__":
    raise SystemExit(main())
