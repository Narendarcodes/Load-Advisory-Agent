"""Modest measured load against the disposable portal through the production-like proxy.

Starts the repo's nginx template (infra/proxy/nginx.conf.template) in front of
`bench --site loanportal.local serve --port 8001`, then drives anonymous public
pages, the login form, the portal stylesheet and the proxy's own /healthz.

This measures the disposable environment (Werkzeug dev server, one container,
this laptop), not production capacity; the numbers are evidence that the front
door works under concurrency and a baseline for the owner, not a sizing claim.

    python tests/e2e/load_check.py

Writes tests/e2e/out/phase-f/load.json.
"""

from __future__ import annotations

import json
import shutil
import statistics
import subprocess
import sys
import tempfile
import threading
import time
import warnings
from pathlib import Path

import requests
import urllib3

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "infra" / "proxy" / "nginx.conf.template"
OUT_DIR = ROOT / "tests" / "e2e" / "out" / "phase-f"
BACKEND = "loanrangers-backend-1"
NETWORK = "frappe_docker_default"
PROXY = "loanportal-load-proxy"
SITE = "loanportal.local"
HTTPS_PORT = 18443
HTTP_PORT = 18080
PAGES = [
    "/borrower/terms",
    "/borrower/privacy",
    "/borrower/help",
    "/borrower/products",
    "/login",
    "/assets/loan_advisory_portal/css/portal.css",
]

warnings.filterwarnings("ignore", category=urllib3.exceptions.InsecureRequestWarning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def docker(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", *args], capture_output=True, text=True, check=check, timeout=180
    )


def render() -> str:
    text = TEMPLATE.read_text(encoding="utf-8")
    for key, value in {
        "PORTAL_SITE": SITE,
        "FRAPPE_UPSTREAM": "backend:8001",
        "RUNTIME_UPSTREAM": "host.docker.internal:4200",
        "LIVEKIT_UPSTREAM": "host.docker.internal:7880",
    }.items():
        text = text.replace("${" + key + "}", value)
    return text


def session() -> requests.Session:
    client = requests.Session()
    client.trust_env = False
    client.headers["Host"] = SITE
    client.headers["User-Agent"] = "load-check/1.0"
    return client


def base(path: str) -> str:
    return f"https://127.0.0.1:{HTTPS_PORT}{path}"


def percentiles(samples: list[float]) -> dict:
    ordered = sorted(samples)
    if not ordered:
        return {}

    def pick(fraction: float) -> float:
        index = min(len(ordered) - 1, max(0, round(fraction * (len(ordered) - 1))))
        return round(ordered[index] * 1000, 1)

    return {
        "count": len(ordered),
        "min_ms": round(ordered[0] * 1000, 1),
        "p50_ms": pick(0.50),
        "p95_ms": pick(0.95),
        "p99_ms": pick(0.99),
        "max_ms": round(ordered[-1] * 1000, 1),
        "mean_ms": round(statistics.fmean(ordered) * 1000, 1),
    }


def parallel(
    workers: int, per_worker: int, request_for, expected: int = 200
) -> tuple[list[float], dict, float, int]:
    latencies: list[float] = []
    lock = threading.Lock()
    statuses: dict[str, int] = {}
    bytes_total = 0
    failures: list[str] = []

    def run(index: int) -> None:
        nonlocal bytes_total
        client = session()
        local_latency: list[float] = []
        local_status: dict[str, int] = {}
        local_bytes = 0
        for step in range(per_worker):
            path = request_for(index, step)
            start = time.perf_counter()
            try:
                response = client.get(base(path), verify=False, timeout=30)
                if response.status_code != expected:
                    failures.append(f"{path} -> {response.status_code}")
                local_bytes += len(response.content)
                local_status[str(response.status_code)] = (
                    local_status.get(str(response.status_code), 0) + 1
                )
            except requests.RequestException as exc:
                failures.append(f"{path} -> {type(exc).__name__}: {exc}")
                local_status["error"] = local_status.get("error", 0) + 1
            local_latency.append(time.perf_counter() - start)
        client.close()
        with lock:
            latencies.extend(local_latency)
            bytes_total += local_bytes
            for key, count in local_status.items():
                statuses[key] = statuses.get(key, 0) + count

    started = time.perf_counter()
    threads = [threading.Thread(target=run, args=(index,)) for index in range(workers)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    elapsed = time.perf_counter() - started
    statuses["failures"] = len(failures)
    return latencies, statuses, elapsed, bytes_total


def wait_ready(client: requests.Session, deadline: float = 30.0) -> None:
    end = time.monotonic() + deadline
    while time.monotonic() < end:
        try:
            if client.get(base("/healthz"), verify=False, timeout=2).status_code == 204:
                return
        except requests.RequestException:
            pass
        time.sleep(0.3)
    logs = docker("logs", PROXY, check=False)
    raise SystemExit(f"proxy not ready:\n{logs.stderr}")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    workdir = Path(tempfile.mkdtemp(prefix="load-check-"))
    proxy_started = False
    started = time.time()
    try:
        ping = docker(
            "exec", BACKEND, "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
            "http://127.0.0.1:8001/api/method/ping", check=False,
        ).stdout.strip()
        if ping != "200":
            raise SystemExit(
                "bench serve is not answering on 8001; start it with: docker exec -d "
                f"{BACKEND} bash -lc 'cd /home/frappe/frappe-bench && exec bench --site {SITE} serve --port 8001'"
            )

        conf = workdir / "default.conf"
        conf.write_text(render(), encoding="utf-8")
        tls = workdir / "tls"
        tls.mkdir()
        subprocess.run(
            [
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                "-subj", f"/CN={SITE}",
                "-keyout", str(tls / "tls.key"), "-out", str(tls / "tls.crt"),
            ],
            check=True,
            capture_output=True,
        )

        docker("rm", "-f", PROXY, check=False)
        docker(
            "run", "-d", "--name", PROXY,
            "--network", NETWORK,
            "--add-host", "host.docker.internal:host-gateway",
            "-p", f"127.0.0.1:{HTTP_PORT}:80",
            "-p", f"127.0.0.1:{HTTPS_PORT}:443",
            "-v", f"{conf.as_posix()}:/etc/nginx/conf.d/default.conf:ro",
            "-v", f"{tls.as_posix()}:/etc/nginx/tls:ro",
            "nginx:alpine",
        )
        proxy_started = True

        client = session()
        wait_ready(client)

        warmup = requests.Session()
        warmup.trust_env = False
        warmup.headers["Host"] = SITE
        for path in PAGES:
            warmup.get(base(path), verify=False, timeout=30)
        warmup.close()

        page_latency, page_status, page_elapsed, page_bytes = parallel(
            8, 30, lambda worker, step: PAGES[(worker + step) % len(PAGES)]
        )
        health_latency, health_status, health_elapsed, _ = parallel(
            16, 25, lambda worker, step: "/healthz", expected=204
        )

        gzip_client = session()
        gzip_response = gzip_client.get(
            base("/assets/loan_advisory_portal/css/portal.css"),
            headers={"Accept-Encoding": "gzip"},
            verify=False,
            timeout=30,
            stream=True,
        )
        compressed = gzip_response.raw.read(decode_content=False)
        gzip_encoding = gzip_response.headers.get("Content-Encoding")
        plain = requests.get(
            base("/assets/loan_advisory_portal/css/portal.css"),
            headers={"Host": SITE, "Accept-Encoding": "identity"},
            verify=False,
            timeout=30,
        )
        gzip_client.close()

        report = {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "environment": {
                "portal": SITE,
                "front_door": "infra/proxy/nginx.conf.template (nginx:alpine)",
                "upstream": "bench --site loanportal.local serve --port 8001 (Werkzeug, threaded)",
                "client": "requests, 8 keep-alive sessions (pages) / 16 (healthz)",
                "note": "disposable single-container environment; not production capacity",
                "wall_s": round(time.time() - started, 2),
            },
            "pages": {
                **percentiles(page_latency),
                "throughput_rps": round(len(page_latency) / page_elapsed, 1),
                "wall_s": round(page_elapsed, 2),
                "status": page_status,
                "bytes": page_bytes,
                "paths": PAGES,
            },
            "healthz": {
                **percentiles(health_latency),
                "throughput_rps": round(len(health_latency) / health_elapsed, 1),
                "wall_s": round(health_elapsed, 2),
                "status": health_status,
            },
            "compression": {
                "path": "/assets/loan_advisory_portal/css/portal.css",
                "identity_bytes": len(plain.content),
                "gzip_bytes": len(compressed),
                "content_encoding": gzip_encoding,
                "ratio": round(len(plain.content) / max(1, len(compressed)), 2),
            },
        }
        (OUT_DIR / "load.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

        print(f"pages   {json.dumps(report['pages'])}")
        print(f"healthz {json.dumps(report['healthz'])}")
        print(f"gzip    {json.dumps(report['compression'])}")
        ok = (
            report["pages"]["status"].get("failures", 1) == 0
            and report["pages"]["status"].get("200") == report["pages"]["count"]
            and report["healthz"]["status"].get("failures", 1) == 0
            and report["healthz"]["status"].get("204") == report["healthz"]["count"]
            and gzip_encoding == "gzip"
            and len(compressed) < len(plain.content)
        )
        print(f"\n{'PASS' if ok else 'FAIL'} in {report['environment']['wall_s']}s")
        return 0 if ok else 1
    finally:
        if proxy_started:
            docker("rm", "-f", PROXY, check=False)
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
