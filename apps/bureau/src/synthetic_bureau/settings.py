"""Fixed, local-only defaults for the synthetic bureau service.

There are no environment overrides: the same inputs always produce the same
report, and the service can only be started on the loopback interface.
"""
from datetime import date

from decision_engine.paths import repo_root

DEFAULT_SEED = 20261024
DEFAULT_AS_OF = date(2026, 10, 24)
DEFAULT_FIXTURE_PATH = repo_root() / "data" / "synthetic" / "bureau" / "cases_120.json"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8001
TIMEOUT_DELAY_SECONDS = 0.2
