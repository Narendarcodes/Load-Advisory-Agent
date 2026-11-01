"""Two-worker evidence against a real Redis, with every worker in its own process.

Starts a throwaway redis:7-alpine on 127.0.0.1:6380, mints real assertion tokens,
then runs tests/e2e/two_worker_scenario.py as separate processes to prove that a
credential, a budget and a conversation all survive a worker change. Also proves
the production fail-closed rule for process-local memory.

    python tests/e2e/two_worker_check.py

Writes tests/e2e/out/phase-f/two_worker.json. Local only; no external service is
contacted and no shared site is touched.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import redis

ROOT = Path(__file__).resolve().parents[2]
WORKER = ROOT / "tests" / "e2e" / "two_worker_scenario.py"
OUT_DIR = ROOT / "tests" / "e2e" / "out" / "phase-f"
CONTAINER = "loanportal-redis-check"
REDIS_PORT = 6380
REDIS_URL = f"redis://127.0.0.1:{REDIS_PORT}/0"
SECRET = "phase-f-two-worker-shared-secret-0123456789abcdef"
ISSUER = "frappe:loan_advisory_portal"
AUDIENCE = "loan-advisory-agent"


def b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def mint(jti: str, sub: str = "borrower-f", lifetime: int = 120) -> str:
    now = int(time.time())
    payload = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": sub,
        "customer": "CUST-0001",
        "jti": jti,
        "iat": now,
        "exp": now + lifetime,
    }
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    signature = hmac.new(SECRET.encode(), body, hashlib.sha256).digest()
    return f"{b64(body)}.{b64(signature)}"


def docker(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", *args], capture_output=True, text=True, check=check, timeout=120
    )


def worker(args: list[str], extra_env: dict[str, str] | None = None) -> dict:
    env = os.environ.copy()
    env.update(
        {
            "PYTHONPATH": str(ROOT / "apps" / "api" / "src"),
            "PYTHONIOENCODING": "utf-8",
            "APP_ENV": "development",
            "ASSERTION_REPLAY_REDIS_URL": REDIS_URL,
            "ASSERTION_REPLAY_BACKEND": "auto",
            "AGENT_ASSERTION_SECRET": SECRET,
            "AGENT_CHECKPOINT_REDIS_URL": REDIS_URL,
            "AGENT_CHECKPOINT_BACKEND": "auto",
            "AGENT_CHECKPOINT_TTL_S": "0",
        }
    )
    env.update(extra_env or {})
    completed = subprocess.run(
        [sys.executable, str(WORKER), *args],
        capture_output=True,
        text=True,
        env=env,
        timeout=120,
    )
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise SystemExit(
            f"worker {args} produced no output\nstdout={completed.stdout}\nstderr={completed.stderr}"
        )
    return json.loads(lines[-1])


def wait_for_redis(client: redis.Redis, deadline: float = 30.0) -> None:
    end = time.monotonic() + deadline
    while time.monotonic() < end:
        try:
            if client.ping():
                return
        except redis.RedisError:
            pass
        time.sleep(0.3)
    logs = docker("logs", CONTAINER, check=False)
    raise SystemExit(f"redis did not become ready:\n{logs.stderr}")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    started = time.time()
    checks: list[dict] = []

    def record(name: str, ok: bool, detail: str) -> None:
        checks.append({"check": name, "ok": bool(ok), "detail": detail})

    docker("rm", "-f", CONTAINER, check=False)
    try:
        docker(
            "run", "-d", "--name", CONTAINER,
            "-p", f"127.0.0.1:{REDIS_PORT}:6379",
            "redis:7-alpine", "redis-server", "--save", "", "--appendonly", "no",
        )
        client = redis.Redis.from_url(REDIS_URL, socket_connect_timeout=1.0, socket_timeout=2.0)
        wait_for_redis(client)

        # 1. Single use across processes: worker A spends the token, worker B cannot reuse it.
        token_one = mint("phase-f-jti-1")
        first = worker(["replay", token_one])
        second = worker(["replay", token_one])
        third = worker(["replay", mint("phase-f-jti-2")])
        record("replay_first_claim_allowed", first.get("ok") is True, json.dumps(first))
        record(
            "replay_reuse_refused_by_other_worker",
            second.get("ok") is False
            and second.get("kind") == "rejected"
            and "already been used" in second.get("error", ""),
            json.dumps(second),
        )
        record(
            "replay_store_not_stuck",
            third.get("ok") is True,
            json.dumps(third),
        )

        # 2. One budget, two processes: ten turns pass, the eleventh is refused.
        allowed = 0
        refused = None
        for index in range(11):
            outcome = worker(["budget", "phase-f-load", "borrower-f", "10", "60"])
            if outcome.get("ok"):
                allowed += 1
            else:
                refused = outcome
                break
        record("budget_ten_turns_across_two_workers", allowed == 10, f"allowed={allowed}")
        record(
            "budget_eleventh_turn_refused",
            refused is not None
            and refused.get("kind") == "exceeded"
            and 1 <= int(refused.get("retry_after", 0)) <= 60,
            json.dumps(refused),
        )

        # 3. A conversation continues across workers in both directions.
        thread = "phase-f-thread-1"
        turn_one = worker(["graph", thread, "a"])
        turn_two = worker(["graph", thread, "b"])
        turn_three = worker(["graph", thread, "c"])
        record(
            "graph_turn_one_worker_a",
            turn_one.get("n") == 1 and turn_one.get("messages") == ["a"],
            json.dumps(turn_one),
        )
        record(
            "graph_turn_two_worker_b",
            turn_two.get("n") == 2
            and turn_two.get("messages") == ["a", "b"]
            and turn_two.get("checkpoint_id"),
            json.dumps(turn_two),
        )
        record(
            "graph_turn_three_worker_a",
            turn_three.get("n") == 3 and turn_three.get("messages") == ["a", "b", "c"],
            json.dumps(turn_three),
        )

        # 4. The state really is in Redis, keyed per feature.
        replay_keys = list(client.scan_iter(match="loan-advisory:assertion-replay:*"))
        budget_keys = list(client.scan_iter(match="loan-advisory:budget:*"))
        checkpoint_keys = list(client.scan_iter(match="advisory:graph:v1:*"))
        replay_ttl = client.ttl(replay_keys[0]) if replay_keys else -2
        record(
            "state_lives_in_redis",
            bool(replay_keys and budget_keys and checkpoint_keys)
            and 0 < replay_ttl <= 120 + 90,  # token lifetime plus the replay window
            f"replay_keys={len(replay_keys)} ttl={replay_ttl}s expected<={120 + 90} budget_keys={len(budget_keys)} checkpoint_keys={len(checkpoint_keys)}",
        )

        # 5. Process-local memory is refused when the environment says production.
        fail_env = {"APP_ENV": "production", "ASSERTION_REPLAY_BACKEND": "memory"}
        memory_replay = worker(["memory-replay"], fail_env)
        memory_checkpoint = worker(
            ["memory-checkpoint"], {"APP_ENV": "production", "AGENT_CHECKPOINT_BACKEND": "memory"}
        )
        record(
            "production_refuses_memory_replay",
            memory_replay.get("kind") == "unavailable"
            and "production" in memory_replay.get("error", ""),
            json.dumps(memory_replay),
        )
        record(
            "production_refuses_memory_checkpoint",
            memory_checkpoint.get("kind") == "unavailable"
            and "production" in memory_checkpoint.get("error", ""),
            json.dumps(memory_checkpoint),
        )

        redis_version = docker(
            "exec", CONTAINER, "redis-server", "--version", check=False
        ).stdout.strip()
        report = {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "environment": {
                "redis_image": "redis:7-alpine",
                "redis": redis_version,
                "python": sys.version.split()[0],
                "workers": "separate OS processes, one scenario per invocation",
                "duration_s": round(time.time() - started, 2),
            },
            "checks": checks,
            "passed": sum(1 for item in checks if item["ok"]),
            "failed": sum(1 for item in checks if not item["ok"]),
        }
        (OUT_DIR / "two_worker.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8"
        )
        for item in checks:
            print(f"[{'PASS' if item['ok'] else 'FAIL'}] {item['check']}: {item['detail']}")
        print(f"\n{report['passed']}/{len(checks)} checks passed in {report['environment']['duration_s']}s")
        print(redis_version)
        return 0 if report["failed"] == 0 else 1
    finally:
        docker("rm", "-f", CONTAINER, check=False)


if __name__ == "__main__":
    sys.exit(main())
