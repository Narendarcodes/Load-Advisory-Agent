"""Load the explicitly approved data-quality policy.

The default file has approved=false, so the staleness and variance gates are
disabled. There are deliberately no environment-variable overrides for these
thresholds: enabling them requires a reviewed config change.
"""
import json
from pathlib import Path

from decision_engine.bureau.gates import GateConfig
from decision_engine.paths import repo_root

POLICY_PATH = repo_root() / "config" / "bureau_dq_policy.json"


def load_gate_config(path: Path | None = None) -> GateConfig:
    p = path or POLICY_PATH
    if not p.exists():
        return GateConfig()
    data = json.loads(p.read_text())
    if data.get("approved") is not True:
        return GateConfig()

    active = data.get("active", {})
    stale = active.get("staleness", {})
    variance = active.get("obligation_variance", {})

    stale_days = None
    if stale.get("enabled"):
        stale_days = stale.get("max_age_days")
        if not isinstance(stale_days, int) or stale_days <= 0:
            raise ValueError("approved staleness gate requires max_age_days > 0")

    variance_pct = None
    variance_abs = None
    if variance.get("enabled"):
        variance_pct = variance.get("pct")
        variance_abs = variance.get("abs_inr")
        if not isinstance(variance_pct, (int, float)) or variance_pct <= 0:
            raise ValueError("approved variance gate requires pct > 0")
        if not isinstance(variance_abs, int) or variance_abs < 0:
            raise ValueError("approved variance gate requires abs_inr >= 0")

    return GateConfig(
        approved=True,
        stale_after_days=stale_days,
        obligation_variance_pct=variance_pct,
        obligation_variance_abs_inr=variance_abs,
    )
