"""Evidence sinks: where Decision Evidence records and ZEN traces are persisted.

- InMemoryEvidenceSink: tests / dry runs.
- FrappeEvidenceSink: creates a `Loan Decision Evidence` document (custom DocType made
  by infra/frappe/bootstrap/seed_site.py) and updates the Loan Application's lifecycle
  fields. Raw ZEN traces are NOT written to Frappe; they go to a content-addressed
  companion directory (EVIDENCE_TRACE_DIR, or AGENT_STATE_DIR/traces, default
  /root/hx/loan/agent/traces) and the record stores only their sha256.
Idempotent: a record_id that already exists is not written twice.
"""
import json

import requests

from decision_engine.evidence.evidence_record import stable_trace

from loan_advisory.infrastructure.frappe_adapter import FrappeClient, FrappeUnavailable
from loan_advisory.state_paths import LIVE_TRACE_DIR, TRACE_DIR, resolve, write_private


class InMemoryEvidenceSink:
    def __init__(self, store=None):
        self.records, self.status, self.traces = {}, {}, {}
        self.latest_ids = {}  # application_ref -> record_id of the newest non-simulation run (Frappe: custom_latest_evidence)
        self.store = store   # optional: write the lifecycle state back, like the Frappe sink's PUT

    def persist(self, record, native_status, trace):
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
        self.c = client or FrappeClient()
        self.trace_dir = resolve(trace_dir, "EVIDENCE_TRACE_DIR", TRACE_DIR, LIVE_TRACE_DIR)

    def _req(self, method, path, **kw):
        try:
            r = requests.request(method, f"{self.c.base_url}{path}", headers=self.c._headers(), timeout=20, **kw)
        except requests.RequestException as e:
            raise FrappeUnavailable(str(e))
        return r

    def persist(self, record, native_status, trace):
        if record["trace_ref"]["sha256"]:
            write_private(self.trace_dir / f"{record['trace_ref']['sha256']}.json",
                          json.dumps(stable_trace(trace), sort_keys=True, ensure_ascii=False))
        rid = record["record_id"]
        if self._req("GET", f"/api/resource/{self.DOCTYPE}/{rid}").status_code == 404:
            body = {
                "record_id": rid, "loan_application": record["application_ref"], "decision": record["decision"],
                "lifecycle_state": record["lifecycle_state"], "policy_id": record["policy"]["id"],
                "policy_version": record["policy"]["version"], "policy_sha256": record["policy"]["policy_sha256"],
                "jdm_sha256": record["policy"]["jdm_sha256"], "input_sha256": record["inputs"]["input_sha256"],
                "engine": f"{record['engine']['name']} {record['engine']['version']}",
                "evaluated_at": record["evaluated_at"][:19].replace("T", " "),
                "trace_sha256": record["trace_ref"]["sha256"], "trace_store": str(self.trace_dir),
                "is_simulation": int(record["is_simulation"]),
                "record_json": json.dumps(record, sort_keys=True, ensure_ascii=False),
            }
            r = self._req("POST", f"/api/resource/{self.DOCTYPE}", json=body)
            if not r.ok:
                raise FrappeUnavailable(f"evidence insert HTTP {r.status_code}: {r.text[:200]}")
        r = self._req("PUT", f"/api/resource/Loan Application/{record['application_ref']}", json={
            "custom_lifecycle_state": record["lifecycle_state"], "status": native_status,
            "custom_policy_version": record["policy"]["version"], "custom_latest_evidence": rid})
        if not r.ok:
            raise FrappeUnavailable(f"application update HTTP {r.status_code}: {r.text[:200]}")

    def get_record(self, record_id):
        r = self._req("GET", f"/api/resource/{self.DOCTYPE}/{record_id}")
        return json.loads(r.json()["data"]["record_json"]) if r.ok else None
