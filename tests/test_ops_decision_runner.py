"""ops/decision_runner.py drives the unchanged pipeline over SUBMITTED applications."""
from types import SimpleNamespace

from ops import decision_runner


def test_run_pass_processes_each_submitted_and_survives_one_failure(monkeypatch):
    seen, logs = [], []
    monkeypatch.setattr(decision_runner, "submitted", lambda store: ["A1", "A2"])

    def fake(name, store, sink, bureau):
        seen.append(name)
        if name == "A1":
            raise RuntimeError("boom")
        return SimpleNamespace(to_state="APPROVED", record={"outcome": "APPROVED"}, flags=[])

    monkeypatch.setattr(decision_runner, "process_bureau_application", fake)
    assert decision_runner.run_pass(object(), object(), object(), log=logs.append) == 2
    assert seen == ["A1", "A2"]
    assert '"error"' in logs[0] and '"APPROVED"' in logs[1]
