"""Configuration for the optional self-hosted Langfuse exporter (fail-open, secrets never logged).

    LANGFUSE_ENABLED=1                 master switch (default off; tracing stays a no-op)
    LANGFUSE_PUBLIC_KEY / _SECRET_KEY  project API keys created by the local stack
    LANGFUSE_BASE_URL                  default http://127.0.0.1:3000 (LANGFUSE_HOST is accepted as a fallback)
    LANGFUSE_ENVIRONMENT               trace environment label (LANGFUSE_TRACING_ENVIRONMENT wins if both are set)
    LANGFUSE_RELEASE                   optional app version/release label
    LANGFUSE_CAPTURE_CONTENT=1         opt-in: include prompt/answer text (default off)
    LANGFUSE_ALLOW_REMOTE=1            opt-in: allow a non-loopback self-hosted endpoint (never Langfuse Cloud)
    LANGFUSE_SAMPLE_RATE               default 1.0
    LANGFUSE_TIMEOUT                   HTTP timeout seconds, default 5

Invalid or incomplete configuration disables the exporter and records a reason; it never raises and never
prints credentials. Langfuse Cloud hosts are always refused: this project only talks to its local stack.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from urllib.parse import urlparse

LOOPBACK_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})
CLOUD_HOSTS = frozenset({"cloud.langfuse.com", "us.cloud.langfuse.com", "eu.cloud.langfuse.com"})


def _truthy(raw: str | None) -> bool:
    return (raw or "").strip().lower() in ("1", "true", "yes", "on")


@dataclass(frozen=True)
class LangfuseConfig:
    enabled: bool = False
    public_key: str = ""
    secret_key: str = ""
    base_url: str = "http://127.0.0.1:3000"
    environment: str = "local"
    release: str | None = None
    sample_rate: float = 1.0
    timeout_s: int = 5
    capture_content: bool = False
    problems: tuple[str, ...] = field(default_factory=tuple)

    @property
    def active(self) -> bool:
        return self.enabled and not self.problems

    def summary(self) -> dict:
        """Diagnostics without the key material."""
        return {
            "enabled": self.enabled,
            "active": self.active,
            "base_url": self.base_url,
            "environment": self.environment,
            "release": self.release,
            "capture_content": self.capture_content,
            "has_public_key": bool(self.public_key),
            "has_secret_key": bool(self.secret_key),
            "sample_rate": self.sample_rate,
            "timeout_s": self.timeout_s,
            "problems": list(self.problems),
        }


def _parse_endpoint(raw: str) -> tuple[str, str | None]:
    """Return (normalised base URL, problem)."""
    try:
        u = urlparse(raw)
    except ValueError:
        return raw, "invalid_base_url"
    if u.scheme not in ("http", "https") or not u.hostname:
        return raw, "invalid_base_url"
    if u.username or u.password:
        return raw, "credentials_in_base_url"
    return raw.rstrip("/"), None


def load(env=None) -> LangfuseConfig:
    env = os.environ if env is None else env
    enabled = _truthy(env.get("LANGFUSE_ENABLED"))
    if (env.get("LANGFUSE_TRACING_ENABLED") or "").strip().lower() == "false":
        enabled = False  # SDK-style hard off
    public_key = (env.get("LANGFUSE_PUBLIC_KEY") or "").strip()
    secret_key = (env.get("LANGFUSE_SECRET_KEY") or "").strip()
    base_url, endpoint_problem = _parse_endpoint(
        (env.get("LANGFUSE_BASE_URL") or env.get("LANGFUSE_HOST") or "http://127.0.0.1:3000").strip()
    )
    environment = (env.get("LANGFUSE_TRACING_ENVIRONMENT") or env.get("LANGFUSE_ENVIRONMENT") or "local").strip()
    release = (env.get("LANGFUSE_RELEASE") or "").strip() or None
    capture_content = _truthy(env.get("LANGFUSE_CAPTURE_CONTENT"))
    allow_remote = _truthy(env.get("LANGFUSE_ALLOW_REMOTE"))

    problems: list[str] = []
    if enabled:
        if not public_key or not secret_key:
            problems.append("missing_credentials")
        if endpoint_problem:
            problems.append(endpoint_problem)
        else:
            host = (urlparse(base_url).hostname or "").lower()
            if host in CLOUD_HOSTS or host.endswith(".langfuse.com"):
                problems.append("cloud_endpoint_refused")
            elif host not in LOOPBACK_HOSTS and not allow_remote:
                problems.append("non_loopback_endpoint")

    try:
        sample_rate = float(env.get("LANGFUSE_SAMPLE_RATE") or 1.0)
    except ValueError:
        sample_rate = 1.0
        if enabled:
            problems.append("invalid_sample_rate")
    if not 0.0 <= sample_rate <= 1.0:
        sample_rate = 1.0
        if enabled:
            problems.append("invalid_sample_rate")
    try:
        timeout_s = int(float(env.get("LANGFUSE_TIMEOUT") or 5))
    except ValueError:
        timeout_s = 5
        if enabled:
            problems.append("invalid_timeout")
    if timeout_s <= 0:
        timeout_s = 5
        if enabled:
            problems.append("invalid_timeout")

    return LangfuseConfig(
        enabled=enabled,
        public_key=public_key,
        secret_key=secret_key,
        base_url=base_url,
        environment=environment or "local",
        release=release,
        sample_rate=sample_rate,
        timeout_s=timeout_s,
        capture_content=capture_content,
        problems=tuple(dict.fromkeys(problems)),
    )
