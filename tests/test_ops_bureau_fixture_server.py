"""ops/bureau_fixture_server.py: a fresh application from a known synthetic applicant gets that applicant's report."""
import json

from fastapi.testclient import TestClient

from ops.bureau_fixture_server import build_app


def _fixture(tmp_path):
    case = {"case_id": "SARAL-SYN-APP-0001", "scenario": "CLEAN_PRIME",
            "application": {"application_id": "ACC-LOAP-2026-00001", "applicant_id": "SYN-APP-0001"},
            "request": {"application_id": "ACC-LOAP-2026-00001", "applicant_id": "SYN-APP-0001"},
            "report": None}
    p = tmp_path / "f.json"
    p.write_text(json.dumps({"schema": "bureau-cases/1", "synthetic": True, "cases": [case]}))
    return p


def test_known_applicant_new_application_gets_its_report_stamped_with_the_new_id(tmp_path):
    case = {"case_id": "C", "scenario": "CLEAN_PRIME",
            "application": {"application_id": "ACC-LOAP-2026-00001", "applicant_id": "SYN-APP-0001"},
            "report": {"application_id": "ACC-LOAP-2026-00001", "applicant_id": "SYN-APP-0001", "synthetic": True}}
    p = tmp_path / "g.json"
    p.write_text(json.dumps({"cases": [case]}))
    r = TestClient(build_app(str(p))).post("/v1/bureau/reports",
                                           json={"application_id": "ACC-LOAP-2026-00191", "applicant_id": "SYN-APP-0001"})
    assert r.json()["application_id"] == "ACC-LOAP-2026-00191" and r.json()["applicant_id"] == "SYN-APP-0001"


def test_known_applicant_new_application_reuses_the_applicants_case(tmp_path, monkeypatch):
    from ops import bureau_fixture_server as m

    seen = {}

    def fake_inner(fixture_path):
        from fastapi import FastAPI

        inner = FastAPI()

        @inner.post("/v1/bureau/reports")
        def r(body: dict):
            seen["body"] = body
            return {"ok": True}

        return inner

    monkeypatch.setattr(m, "create_app", lambda fixture_path=None: fake_inner(fixture_path))
    c = TestClient(build_app(str(_fixture(tmp_path))))
    c.post("/v1/bureau/reports", json={"application_id": "ACC-LOAP-2026-00191", "applicant_id": "SYN-APP-0001"})
    assert seen["body"]["application_id"] == "ACC-LOAP-2026-00001"  # served from the applicant's case


def test_unknown_applicant_passes_through_unchanged(tmp_path, monkeypatch):
    from ops import bureau_fixture_server as m

    seen = {}

    def fake_inner(fixture_path):
        from fastapi import FastAPI

        inner = FastAPI()

        @inner.post("/v1/bureau/reports")
        def r(body: dict):
            seen["body"] = body
            return {"ok": True}

        return inner

    monkeypatch.setattr(m, "create_app", lambda fixture_path=None: fake_inner(fixture_path))
    c = TestClient(build_app(str(_fixture(tmp_path))))
    c.post("/v1/bureau/reports", json={"application_id": "ACC-X", "applicant_id": "SYN-APP-0999", "scenario": None})
    assert seen["body"]["application_id"] == "ACC-X"
