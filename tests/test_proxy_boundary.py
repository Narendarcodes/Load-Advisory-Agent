"""The in-repo front door pins site identity; a client header never selects a site.

Frappe resolves the site from `X-Frappe-Site-Name` or `Host` before the app runs, so the
only safe arrangement is an ingress that overwrites both. This test reads the harness
config as text and asserts the pinning, the absence of client-header passthrough, and
that only the disposable site can be reached through it.
"""
from pathlib import Path

CONF = (Path(__file__).resolve().parent / "e2e" / "nginx.loanportal.conf").read_text(
    encoding="utf-8"
)


def _block(prefix: str) -> str:
    start = CONF.index(f"location {prefix} {{")
    depth = 0
    for index in range(start, len(CONF)):
        if CONF[index] == "{":
            depth += 1
        elif CONF[index] == "}":
            depth -= 1
            if depth == 0:
                return CONF[start : index + 1]
    raise AssertionError(f"location {prefix} is not closed")


def test_site_identity_is_pinned_for_frappe():
    block = _block("/")
    assert "proxy_set_header Host loanportal.local;" in block
    assert "proxy_set_header X-Frappe-Site-Name loanportal.local;" in block
    assert "proxy_pass http://frappe_backend;" in block


def test_no_client_header_selects_the_site_or_identity():
    block = _block("/")
    # A client-supplied Host is never forwarded, and no site selector is copied from $http_*.
    for marker in ("$host", "$http_host", "$http_x_frappe_site_name", "$http_x_forwarded_host"):
        assert marker not in block, marker
    # The forwarded chain is replaced, not appended, so a client cannot claim an address.
    assert "proxy_set_header X-Forwarded-For $remote_addr;" in block
    assert "$proxy_add_x_forwarded_for" not in block


def test_the_runtime_upstream_is_not_a_site_selector():
    block = _block("/api/copilotkit")
    assert "proxy_set_header X-Frappe-Site-Name" not in block
    assert "proxy_buffering off;" in block


def test_only_the_disposable_site_is_configured():
    directives = [line.strip() for line in CONF.splitlines() if not line.lstrip().startswith("#")]
    assert not any("p1loan.local" in line for line in directives)
    assert [line for line in directives if line.startswith("server_name")] == ["server_name _;"]
