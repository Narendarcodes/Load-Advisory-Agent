"""Record one real decision for the browser harness (Phase 9).

The portal never invents evidence: it is produced by the conventional workflow
(`process_application` -> ZEN -> `FrappeEvidenceSink`) and stored in Frappe. This
script runs that workflow on the host, against the disposable site. Reads use the
`reader` credential; evidence ingestion uses the dedicated `evidence` service
credential from `seed.json`. It prints the outcome only.

    python tests/e2e/seed_evidence.py --seed <path to seed.json> --trace-dir <dir>
"""
import argparse
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True, help="seed.json copied out of the container")
    parser.add_argument("--trace-dir", required=True, help="where raw ZEN traces go (outside the repo is fine)")
    args = parser.parse_args()

    seed = json.load(open(args.seed, encoding="utf-8"))
    reader, evidence = seed["reader"], seed["evidence"]
    os.environ.setdefault("FRAPPE_URL", "http://127.0.0.1:8081")
    os.environ["FRAPPE_API_KEY"] = reader["api_key"]
    os.environ["FRAPPE_API_SECRET"] = reader["api_secret"]
    os.environ["EVIDENCE_FRAPPE_API_KEY"] = evidence["api_key"]
    os.environ["EVIDENCE_FRAPPE_API_SECRET"] = evidence["api_secret"]
    os.environ["EVIDENCE_TRACE_DIR"] = args.trace_dir

    sys.path.insert(0, REPO)
    sys.path.insert(0, os.path.join(REPO, "apps", "api", "src"))

    from loan_advisory.application.lifecycle import process_application
    from loan_advisory.infrastructure.evidence_store import FrappeEvidenceSink
    from loan_advisory.infrastructure.frappe_adapter import FrappeClient

    client = FrappeClient()
    outcome = process_application(seed["victim"]["application"], client, FrappeEvidenceSink())
    print(json.dumps({"application": outcome.application_ref, "state": outcome.to_state,
                      "decision": outcome.record["decision"], "record": outcome.record["record_id"]}))
    return 0 if outcome.to_state in ("APPROVED", "REJECTED") else 1


if __name__ == "__main__":
    raise SystemExit(main())
