"""Langfuse configuration: valid local self-hosted setup, safe refusals, no secrets in diagnostics.

All cases pass an explicit env mapping, so the developer's shell environment cannot influence the result.
"""
import pytest

from loan_advisory.agent import langfuse_config as L

KEYS = {"LANGFUSE_PUBLIC_KEY": "pk-lf-synthetic", "LANGFUSE_SECRET_KEY": "sk-lf-synthetic"}


def cfg(**env):
    return L.load(env)


def test_disabled_by_default_and_silent():
    c = cfg()
    assert c.enabled is False and c.active is False and c.problems == ()
    assert c.base_url == "http://127.0.0.1:3000" and c.environment == "local"
    assert c.capture_content is False


def test_valid_local_stack_is_active():
    c = cfg(LANGFUSE_ENABLED="1", **KEYS)
    assert c.active is True and c.enabled is True and c.problems == ()


@pytest.mark.parametrize("flag", ["1", "true", "YES", "on"])
def test_truthy_spellings_enable(flag):
    assert cfg(LANGFUSE_ENABLED=flag, **KEYS).active is True


def test_sdk_style_hard_off_wins():
    c = cfg(LANGFUSE_ENABLED="1", LANGFUSE_TRACING_ENABLED="false", **KEYS)
    assert c.enabled is False and c.active is False


@pytest.mark.parametrize("missing", [{"LANGFUSE_SECRET_KEY": "sk-lf-synthetic"},
                                     {"LANGFUSE_PUBLIC_KEY": "pk-lf-synthetic"},
                                     {"LANGFUSE_PUBLIC_KEY": "", "LANGFUSE_SECRET_KEY": ""}])
def test_incomplete_credentials_disable_without_raising(missing):
    c = cfg(LANGFUSE_ENABLED="1", **missing)
    assert c.enabled is True and c.active is False
    assert "missing_credentials" in c.problems


@pytest.mark.parametrize("url", ["https://cloud.langfuse.com", "https://us.cloud.langfuse.com",
                                 "https://eu.cloud.langfuse.com"])
def test_langfuse_cloud_is_always_refused(url):
    c = cfg(LANGFUSE_ENABLED="1", LANGFUSE_BASE_URL=url, LANGFUSE_ALLOW_REMOTE="1", **KEYS)
    assert c.active is False and "cloud_endpoint_refused" in c.problems


def test_non_loopback_needs_an_explicit_opt_in():
    off = cfg(LANGFUSE_ENABLED="1", LANGFUSE_BASE_URL="http://10.0.0.5:3000", **KEYS)
    assert off.active is False and "non_loopback_endpoint" in off.problems
    on = cfg(LANGFUSE_ENABLED="1", LANGFUSE_BASE_URL="http://10.0.0.5:3000", LANGFUSE_ALLOW_REMOTE="1", **KEYS)
    assert on.active is True


@pytest.mark.parametrize("url", ["http://user:pass@127.0.0.1:3000", "ftp://127.0.0.1:3000",
                                 "not a url", "http://"])
def test_malformed_endpoints_disable_without_raising(url):
    c = cfg(LANGFUSE_ENABLED="1", LANGFUSE_BASE_URL=url, **KEYS)
    assert c.active is False and c.problems


def test_environment_precedence_and_host_fallback():
    c = cfg(LANGFUSE_BASE_URL="", LANGFUSE_HOST="http://localhost:3999",
            LANGFUSE_ENVIRONMENT="dev", LANGFUSE_TRACING_ENVIRONMENT="staging", LANGFUSE_RELEASE="r42", **KEYS)
    assert c.base_url == "http://localhost:3999"
    assert c.environment == "staging" and c.release == "r42"


@pytest.mark.parametrize("bad,problem", [({"LANGFUSE_SAMPLE_RATE": "abc"}, "invalid_sample_rate"),
                                         ({"LANGFUSE_SAMPLE_RATE": "1.5"}, "invalid_sample_rate"),
                                         ({"LANGFUSE_TIMEOUT": "soon"}, "invalid_timeout"),
                                         ({"LANGFUSE_TIMEOUT": "0"}, "invalid_timeout")])
def test_invalid_limits_are_reported_and_fall_back(bad, problem):
    c = cfg(LANGFUSE_ENABLED="1", **bad, **KEYS)
    assert problem in c.problems and c.active is False
    assert 0.0 <= c.sample_rate <= 1.0 and c.timeout_s > 0


def test_summary_never_contains_key_material():
    c = cfg(LANGFUSE_ENABLED="1", **KEYS)
    s = c.summary()
    assert s["has_public_key"] is True and s["has_secret_key"] is True
    assert "pk-lf-synthetic" not in repr(s) and "sk-lf-synthetic" not in repr(s)


def test_config_loading_never_raises_on_garbage():
    c = cfg(LANGFUSE_ENABLED="1", LANGFUSE_PUBLIC_KEY="pk-lf-synthetic", LANGFUSE_SECRET_KEY="sk-lf-synthetic",
            LANGFUSE_BASE_URL="\ud800")
    assert isinstance(c.problems, tuple) and c.active is False
    assert "invalid_base_url" in c.problems
