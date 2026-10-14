"""Versioned policy registry: resolve (policy_id, version) -> pinned policy + ZEN JDM.

Fail-closed: if a file's content hash differs from the registered hash the policy is
NOT loaded (PolicyIntegrityError). Changing rules therefore requires registering a new
version, which is what makes historical decisions reproducible.
"""
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from decision_engine.paths import repo_root

POLICY_DIR = repo_root() / "decision_engine" / "policies"


class PolicyIntegrityError(Exception):
    pass


class UnknownPolicyVersion(Exception):
    pass


def content_sha256(path: Path) -> str:
    """sha256 over LF-normalised bytes (stable across Windows/Linux checkouts)."""
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


@dataclass(frozen=True)
class PolicyVersion:
    policy_id: str
    version: str
    policy_path: Path
    jdm_path: Path
    policy_sha256: str
    jdm_sha256: str
    status: str
    synthetic: bool
    threshold_source: str
    effective_from: str
    effective_to: str | None

    @property
    def policy(self) -> dict:
        return json.loads(self.policy_path.read_text())

    def meta(self) -> dict:
        return {"id": self.policy_id, "version": self.version, "policy_sha256": self.policy_sha256,
                "jdm_sha256": self.jdm_sha256, "status": self.status, "synthetic": self.synthetic,
                "threshold_source": self.threshold_source, "effective_from": self.effective_from,
                "effective_to": self.effective_to}


def _registry(path: Path | None = None) -> dict:
    return json.loads((path or POLICY_DIR / "registry.json").read_text())


def load_policy(policy_id: str = "PERSONAL_LOAN", version: str | None = None, registry_path: Path | None = None) -> PolicyVersion:
    reg = _registry(registry_path)
    try:
        entry = reg[policy_id]
        version = version or entry["active_version"]
        v = entry["versions"][version]
    except KeyError:
        raise UnknownPolicyVersion(f"{policy_id}@{version} is not registered")
    base = (registry_path.parent if registry_path else POLICY_DIR)
    pp, jp = (base / v["policy_file"]).resolve(), (base / v["jdm_file"]).resolve()
    for p, want in ((pp, v["policy_sha256"]), (jp, v["jdm_sha256"])):
        got = content_sha256(p)
        if got != want:
            raise PolicyIntegrityError(f"{p.name}: sha256 {got} != registered {want} for {policy_id}@{version}")
    pol = json.loads(pp.read_text())
    if pol.get("policy_version") != version:
        raise PolicyIntegrityError(f"{pp.name} declares version {pol.get('policy_version')!r}, registry says {version!r}")
    return PolicyVersion(policy_id, version, pp, jp, v["policy_sha256"], v["jdm_sha256"], v["status"],
                         bool(v["synthetic"]), v["threshold_source"], v["effective_from"], v.get("effective_to"))
