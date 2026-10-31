"""Evidence sinks: where Decision Evidence records and ZEN traces are persisted.

- InMemoryEvidenceSink: tests / dry runs.
- FrappeEvidenceSink: calls the portal's trusted `evidence.ingest` method with a
  dedicated `Evidence Service` identity. The method owns the application/evidence linkage,
  the immutable record id, the writable-field allowlist and the audit row. Raw ZEN traces
  are NOT written to Frappe; they go to a content-addressed companion directory
  (EVIDENCE_TRACE_DIR, or AGENT_STATE_DIR/traces, default /root/hx/loan/agent/traces)
  and the record stores only their sha256.
Idempotent: a record_id that already exists with the same content is not written twice.
"""
import json

from decision_engine.evidence.evidence_record import stable_trace

from loan_advisory.infrastructure.frappe_adapter import FrappeClient
from loan_advisory.state_paths import LIVE_TRACE_DIR, TRACE_DIR, resolve, write_private

EVIDENCE_METHOD = "loan_advisory_portal.api.evidence.ingest"
EVIDENCE_GET_METHOD = "loan_advisory_portal.api.evidence.get_record"


class EvidenceRejected(Exception):
    """The sink refused to write because the record does not match the authorized application."""


class InMemoryEvidenceSink:
    def __init__(self, store=None):
        self.records, self.status, self.traces = {}, {}, {}
        self.latest_ids = {}  # application_ref -> record_id of the newest non-simulation run (Frappe: custom_latest_evidence)
        self.store = store   # optional: write the lifecycle state back, like the Frappe sink's method call

    def persist(self, record, native_status, trace, *, expected_application=None):
        if expected_application and expected_application != record["application_ref"]:
            raise EvidenceRejected("evidence does not belong to the authorized application")
        self.records.setdefault(record["record_id"], record)
        if not record.get("is_simulation"):
            # Ids are deterministic, so a re-run can reproduce an older record; the pointer must still move to it.
            self.latest_ids[record["application_ref"]] = record["record_id"]
        self.status[record["application_ref"]] = (record["lifecycle_state"], native_status)
        if self.store is not None and hasattr(self.store, "set_status"):
            self.store.set_status(record["application_ref"], record["lifecycle_state"], native_status)
        if record["trace_ref"]["sha256"]:
            self.traces[record["trace_ref"]["sha256"]] = stable_trace(trace)


class FrappeEvidenceSink:
    DOCTYPE = "Loan Decision Evidence"

    def __init__(self, client: FrappeClient | None = None, trace_dir: str | None = None):
        self.c = client or FrappeClient.for_evidence()
        self.trace_dir = resolve(trace_dir, "EVIDENCE_TRACE_DIR", TRACE_DIR, LIVE_TRACE_DIR)

    def persist(self, record, native_status, trace, *, expected_application=None):
        expected = (expected_application or "").strip()
        if not expected:
            raise EvidenceRejected("the authorized application is required for evidence ingestion")
        if expected != record["application_ref"]:
            raise EvidenceRejected("evidence does not belong to the authorized application")
        if record["trace_ref"]["sha256"]:
            write_private(self.trace_dir / f"{record['trace_ref']['sha256']}.json",
                          json.dumps(stable_trace(trace), sort_keys=True, ensure_ascii=False))
        return self.c.call_method(
            EVIDENCE_METHOD,
            {
                "record": record,
                "native_status": native_status,
                "expected_application": expected,
                "trace_store": str(self.trace_dir),
            },
        )

    def get_record(self, record_id):
        return self.c.call_method(EVIDENCE_GET_METHOD, {"record_id": record_id})
