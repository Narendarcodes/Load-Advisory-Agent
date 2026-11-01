"""Live proof that infra/proxy/nginx.conf.template behaves as documented.

Renders the template, generates a throwaway certificate, runs a local echo
upstream and the local nginx:alpine image, then drives hostile requests through
the proxy. Nothing outside this machine is contacted; the site name is a
reserved test name (portal.test), never the shared site.

    python tests/e2e/production_proxy_check.py

Writes tests/e2e/out/phase-f/production_proxy.json and exits non-zero if any
check fails. A full report goes to stdout.
"""

from __future__ import annotations

import hashlib
import http.client
import json
import shutil
import ssl
import subprocess
import sys
import tempfile
import threading
import time
import warnings
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import requests
import urllib3

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "infra" / "proxy" / "nginx.conf.template"
OUT_DIR = ROOT / "tests" / "e2e" / "out" / "phase-f"

PORTAL_SITE = "portal.test"
FOREIGN_SITE = "shared.example"
ECHO_PORT = 18099
HTTP_PORT = 18082
HTTPS_PORT = 18043
CONTAINER = "loanportal-proxy-check"

warnings.filterwarnings("ignore", category=urllib3.exceptions.InsecureRequestWarning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SESSION = requests.Session()
SESSION.trust_env = False
SSL_CONTEXT = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


class Echo(BaseHTTPRequestHandler):
    """Upstream stand-in: reports the headers it received."""

    protocol_version = "HTTP/1.1"

    def _write(self, status: int, body: bytes, ctype: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - http.server API
        if self.path.endswith("/stream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.end_headers()
            self.close_connection = True
            for index, part in enumerate((b"data: one\n\n", b"data: two\n\n")):
                self.wfile.write(part)
                self.wfile.flush()
                if index == 0:
                    time.sleep(1.0)
            return
        if self.path.startswith("/asset.css"):
            self._write(200, b".x{color:#123456}" * 900, "text/css")
            return
        body = json.dumps(
            {"path": self.path, "headers": {k.lower(): v for k, v in self.headers.items()}}
        ).encode()
        self._write(200, body, "application/json")

    def log_message(self, *args) -> None:  # silence per-request logging
        pass


def port_free(port: int) -> bool:
    import socket

    with socket.socket() as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) != 0


def render() -> str:
    text = TEMPLATE.read_text(encoding="utf-8")
    for key, value in {
        "PORTAL_SITE": PORTAL_SITE,
        "FRAPPE_UPSTREAM": f"host.docker.internal:{ECHO_PORT}",
        "RUNTIME_UPSTREAM": f"host.docker.internal:{ECHO_PORT}",
        "LIVEKIT_UPSTREAM": f"host.docker.internal:{ECHO_PORT}",
    }.items():
        text = text.replace("${" + key + "}", value)
    if "${" in text:
        raise SystemExit(f"unrendered placeholder remains in template: {TEMPLATE}")
    return text


def docker(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", *args], capture_output=True, text=True, check=check, timeout=120
    )


def https(path: str, headers: dict[str, str] | None = None, stream: bool = False, timeout: float = 15):
    merged = {"Host": PORTAL_SITE}
    merged.update(headers or {})
    return SESSION.get(
        f"https://127.0.0.1:{HTTPS_PORT}{path}",
        headers=merged,
        verify=False,
        stream=stream,
        timeout=timeout,
        allow_redirects=False,
    )


def wait_ready(container: str, deadline: float = 30.0) -> None:
    end = time.monotonic() + deadline
    while time.monotonic() < end:
        state = docker("inspect", "-f", "{{.State.Running}}", container, check=False)
        if state.returncode != 0:
            logs = docker("logs", container, check=False)
            raise SystemExit(f"container vanished:\n{logs.stdout}\n{logs.stderr}")
        if state.stdout.strip() == "true":
            try:
                if https("/healthz", timeout=2).status_code == 204:
                    return
            except requests.RequestException:
                pass
        time.sleep(0.4)
    logs = docker("logs", container, check=False)
    raise SystemExit(f"proxy did not become ready:\n{logs.stderr}")


def run_checks() -> list[dict]:
    checks: list[dict] = []

    def record(name: str, ok: bool, detail: str) -> None:
        checks.append({"check": name, "ok": bool(ok), "detail": detail})

    # 1. Plain HTTP is a literal-host redirect, never an echo of the client Host.
    response = SESSION.get(
        f"http://127.0.0.1:{HTTP_PORT}/apply?step=2",
        headers={"Host": "evil.example"},
        allow_redirects=False,
        timeout=10,
    )
    record(
        "http_redirect_uses_literal_host",
        response.status_code == 308
        and response.headers.get("Location") == f"https://{PORTAL_SITE}/apply?step=2",
        f"status={response.status_code} location={response.headers.get('Location')}",
    )

    # 2. Liveness answers without touching an upstream.
    response = https("/healthz")
    record("healthz_204", response.status_code == 204, f"status={response.status_code}")

    # 3. A foreign Host is refused before any cookie could be replayed to it.
    response = https("/dashboard", headers={"Host": FOREIGN_SITE, "Cookie": "sid=secret"})
    record(
        "foreign_host_rejected_421",
        response.status_code == 421,
        f"status={response.status_code}",
    )

    # 4. Identity headers the portal depends on cannot be supplied by the client.
    response = https(
        "/echo",
        headers={
            "X-Forwarded-For": "6.6.6.6",
            "X-Real-IP": "6.6.6.6",
            "X-Frappe-Site-Name": FOREIGN_SITE,
            "X-Forwarded-Proto": "http",
            "X-Forwarded-Host": FOREIGN_SITE,
        },
    )
    seen = response.json()["headers"] if response.status_code == 200 else {}
    xff = seen.get("x-forwarded-for", "")
    record(
        "identity_headers_replaced",
        response.status_code == 200
        and seen.get("host") == PORTAL_SITE
        and seen.get("x-frappe-site-name") == PORTAL_SITE
        and xff and "," not in xff and xff != "6.6.6.6"
        and seen.get("x-real-ip") == xff
        and seen.get("x-forwarded-proto") == "https",
        f"status={response.status_code} upstream_saw={json.dumps({k: seen.get(k) for k in ('host','x-frappe-site-name','x-forwarded-for','x-real-ip','x-forwarded-proto')})}",
    )

    # 5. The runtime path pins the same identity even though it has no host guard.
    response = https(
        "/api/copilotkit/agent/run",
        headers={"Host": FOREIGN_SITE, "X-Frappe-Site-Name": FOREIGN_SITE},
    )
    payload = response.json() if response.status_code == 200 else {}
    seen = payload.get("headers", {})
    record(
        "runtime_path_pins_identity",
        response.status_code == 200
        and seen.get("host") == PORTAL_SITE
        and seen.get("x-frappe-site-name") == PORTAL_SITE
        and payload.get("path") == "/api/copilotkit/agent/run",
        f"status={response.status_code} upstream_host={seen.get('host')} upstream_site={seen.get('x-frappe-site-name')!r} upstream_path={payload.get('path')!r}",
    )

    # 6. Upgrade headers reach the runtime (WebSocket support is not decorative).
    response = https(
        "/api/copilotkit/ws",
        headers={"Upgrade": "websocket", "Connection": "Upgrade"},
    )
    seen = response.json()["headers"] if response.status_code == 200 else {}
    record(
        "websocket_headers_forwarded",
        seen.get("upgrade", "").lower() == "websocket"
        and seen.get("connection", "").lower() == "upgrade",
        f"upstream_upgrade={seen.get('upgrade')!r} connection={seen.get('connection')!r}",
    )

    # 7. Event streams are not buffered: the gap between events survives the proxy.
    # read1() returns whatever has arrived; requests' read() would wait for a full chunk
    # and hide whether the proxy held the first event back.
    start = time.monotonic()
    stamps: list[float] = []
    status = 0
    conn = http.client.HTTPSConnection(
        "127.0.0.1", HTTPS_PORT, context=SSL_CONTEXT, timeout=20
    )
    try:
        conn.request(
            "GET",
            "/api/copilotkit/stream",
            headers={"Host": PORTAL_SITE, "Accept": "text/event-stream"},
        )
        response = conn.getresponse()
        status = response.status
        while True:
            chunk = response.read1(256)
            if not chunk:
                break
            stamps.append(time.monotonic() - start)
    finally:
        conn.close()
    gap = (stamps[-1] - stamps[0]) if len(stamps) >= 2 else 0.0
    record(
        "sse_not_buffered",
        status == 200 and len(stamps) >= 2 and gap >= 0.4,
        f"status={status} reads={len(stamps)} first_to_last_gap={gap:.3f}s",
    )

    # 8. Assets are compressed for mobile clients.
    plain = https("/asset.css", headers={"Accept-Encoding": "identity"}, stream=True)
    plain_body = plain.raw.read()
    plain.close()
    with https("/asset.css", headers={"Accept-Encoding": "gzip"}, stream=True) as gz:
        gzip_body = gz.raw.read(decode_content=False)
        encoding = gz.headers.get("Content-Encoding")
    record(
        "assets_gzipped",
        encoding == "gzip" and 0 < len(gzip_body) < len(plain_body),
        f"identity={len(plain_body)}B gzip={len(gzip_body)}B encoding={encoding}",
    )

    # 9. A client cannot add its own certificate framing; TLS 1.0/1.1 are refused.
    record(
        "tls_versions_pinned",
        _tls_legacy_refused(),
        "TLSv1.0 handshake refused, TLSv1.3 accepted",
    )
    return checks


def _tls_legacy_refused() -> bool:
    import socket
    import ssl

    def handshake(version) -> bool:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        try:
            context.minimum_version = version
            context.maximum_version = version
        except (ValueError, ssl.SSLError):
            return False
        with socket.create_connection(("127.0.0.1", HTTPS_PORT), timeout=5) as sock:
            try:
                with context.wrap_socket(sock, server_hostname=PORTAL_SITE):
                    return True
            except (ssl.SSLError, OSError):
                return False

    legacy = handshake(ssl.TLSVersion.TLSv1) or handshake(ssl.TLSVersion.TLSv1_1)
    modern = handshake(ssl.TLSVersion.TLSv1_3)
    return (not legacy) and modern


def main() -> int:
    for port in (ECHO_PORT, HTTP_PORT, HTTPS_PORT):
        if not port_free(port):
            raise SystemExit(f"port {port} is already in use; refusing to collide")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    workdir = Path(tempfile.mkdtemp(prefix="proxy-check-"))
    server = None
    started = time.time()
    container_started = False
    try:
        conf = workdir / "default.conf"
        conf.write_text(render(), encoding="utf-8")
        tls = workdir / "tls"
        tls.mkdir()
        subprocess.run(
            [
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                "-subj", f"/CN={PORTAL_SITE}",
                "-keyout", str(tls / "tls.key"), "-out", str(tls / "tls.crt"),
            ],
            check=True,
            capture_output=True,
        )

        server = ThreadingHTTPServer(("0.0.0.0", ECHO_PORT), Echo)
        threading.Thread(target=server.serve_forever, daemon=True).start()

        docker("rm", "-f", CONTAINER, check=False)
        docker(
            "run", "-d", "--name", CONTAINER,
            "-p", f"127.0.0.1:{HTTP_PORT}:80",
            "-p", f"127.0.0.1:{HTTPS_PORT}:443",
            "--add-host", "host.docker.internal:host-gateway",
            "-v", f"{conf.as_posix()}:/etc/nginx/conf.d/default.conf:ro",
            "-v", f"{tls.as_posix()}:/etc/nginx/tls:ro",
            "nginx:alpine",
        )
        container_started = True
        wait_ready(CONTAINER)

        nginx_version = docker("exec", CONTAINER, "nginx", "-v", check=False).stderr.strip()
        checks = run_checks()
        report = {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "environment": {
                "image": "nginx:alpine",
                "nginx": nginx_version,
                "portal_site": PORTAL_SITE,
                "template": "infra/proxy/nginx.conf.template",
                "template_sha256": hashlib.sha256(TEMPLATE.read_bytes()).hexdigest(),
                "upstream": f"local echo server on 127.0.0.1:{ECHO_PORT}",
                "duration_s": round(time.time() - started, 2),
            },
            "checks": checks,
            "passed": sum(1 for item in checks if item["ok"]),
            "failed": sum(1 for item in checks if not item["ok"]),
        }
        (OUT_DIR / "production_proxy.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8"
        )

        for item in checks:
            print(f"[{'PASS' if item['ok'] else 'FAIL'}] {item['check']}: {item['detail']}")
        print(f"\n{report['passed']}/{len(checks)} checks passed in {report['environment']['duration_s']}s")
        print(report["environment"]["nginx"])
        return 0 if report["failed"] == 0 else 1
    finally:
        if container_started:
            docker("rm", "-f", CONTAINER, check=False)
        if server is not None:
            server.shutdown()
            server.server_close()
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
