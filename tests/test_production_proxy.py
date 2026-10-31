"""The production-like proxy pins site identity, replaces client address claims and streams.

The config is a template rendered by envsubst at container start. These assertions read it
as text (no nginx needed) and cover the invariants the front door must never lose; the live
header-rewrite proof is `tests/e2e/production_proxy_check.py`.
"""
from pathlib import Path

TEMPLATE = (Path(__file__).resolve().parents[1] / "infra" / "proxy" / "nginx.conf.template").read_text(
    encoding="utf-8"
)


def _block(prefix: str) -> str:
    start = TEMPLATE.index(f"location {prefix} {{")
    depth = 0
    for index in range(start, len(TEMPLATE)):
        if TEMPLATE[index] == "{":
            depth += 1
        elif TEMPLATE[index] == "}":
            depth -= 1
            if depth == 0:
                return TEMPLATE[start : index + 1]
    raise AssertionError(f"location {prefix} is not closed")


def test_portal_block_pins_host_and_site_name():
    block = _block("/")
    assert "proxy_set_header Host ${PORTAL_SITE};" in block
    assert "proxy_set_header X-Frappe-Site-Name ${PORTAL_SITE};" in block
    assert "proxy_pass http://portal_backend;" in block


def test_no_client_header_selects_a_site_or_address():
    block = _block("/")
    for marker in ("$http_host", "$http_x_frappe_site_name", "$http_x_forwarded_for", "$proxy_add_x_forwarded_for"):
        assert marker not in block, marker
    assert "proxy_set_header X-Forwarded-For $remote_addr;" in block
    assert 'if ($host != "${PORTAL_SITE}") {' in block


def test_runtime_path_streams_and_pins_identity():
    block = _block("/api/copilotkit")
    # The runtime forwards inbound x-* headers to the agent, so the site name is pinned.
    assert "proxy_set_header X-Frappe-Site-Name ${PORTAL_SITE};" in block
    assert "$http_x_frappe_site_name" not in block
    assert "proxy_buffering off;" in block
    assert "gzip off;" in block
    assert "proxy_read_timeout 300;" in block
    assert "proxy_set_header Upgrade $http_upgrade;" in block


def test_livekit_path_is_websocket_ready():
    block = _block("/livekit/")
    assert "proxy_set_header X-Frappe-Site-Name ${PORTAL_SITE};" in block
    assert "proxy_set_header Upgrade $http_upgrade;" in block
    assert "proxy_set_header Connection $connection_upgrade;" in block
    assert "proxy_pass http://${LIVEKIT_UPSTREAM};" in block
    assert "proxy_read_timeout 3600;" in block


def test_tls_compression_and_upload_size():
    assert "listen 443 ssl default_server;" in TEMPLATE
    assert "ssl_certificate /etc/nginx/tls/tls.crt;" in TEMPLATE
    assert "ssl_protocols TLSv1.2 TLSv1.3;" in TEMPLATE
    assert "gzip on;" in TEMPLATE
    assert "application/javascript" in TEMPLATE
    assert "client_max_body_size 50m;" in TEMPLATE


def test_http_redirect_uses_a_literal_host():
    assert "return 308 https://${PORTAL_SITE}$request_uri;" in TEMPLATE
    assert "https://$host" not in TEMPLATE


def test_only_the_configured_site_and_no_shared_site_is_named():
    directives = [line.strip() for line in TEMPLATE.splitlines() if not line.lstrip().startswith("#")]
    assert not any("p1loan.local" in line for line in directives)
    assert not any("loanportal.local" in line for line in directives)
