"""P0b: bounded admission, controlled overload, and one-release-per-request slots.

The server admits at most `max_inflight` requests; the next one gets an immediate 503 + Retry-After instead of
another thread. A slot is taken in the accept loop and released in the worker thread's finally, and release is
idempotent because the thread-start failure path and socketserver's own shutdown both run on the same request.
"""
import json
import socket
import threading
import time
import urllib.error
import urllib.request
from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler

import pytest

from loan_advisory.agent import server as srv


class _Quiet(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


def _server(limit, handler=_Quiet):
    server = srv.BoundedServer(("127.0.0.1", 0), handler, max_inflight=limit)
    server.handle_error = lambda request, client_address: None  # keep expected failures out of the test log
    return server


def _get(base):
    try:
        with urllib.request.urlopen(base, timeout=10) as response:
            return response.status
    except urllib.error.HTTPError as e:
        return e.code


def _wait_idle(server, timeout=5):
    """The worker releases its slot just after the client sees the response, so poll instead of asserting instantly."""
    deadline = time.time() + timeout
    while server.admission.in_flight and time.time() < deadline:
        time.sleep(0.01)
    return server.admission.in_flight


def test_capacity_limit_refuses_extra_requests_with_503_and_recovers():
    gate = threading.Event()
    in_handler = threading.Event()

    class Blocking(_Quiet):
        def do_GET(self):
            in_handler.set()
            gate.wait(10)
            super().do_GET()

    server = _server(2, Blocking)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    results = []
    workers = [threading.Thread(target=lambda: results.append(_get(base))) for _ in range(2)]
    try:
        for worker in workers:
            worker.start()
        assert in_handler.wait(5)
        deadline = time.time() + 5
        while server.admission.in_flight < 2 and time.time() < deadline:
            time.sleep(0.01)
        assert server.admission.in_flight == 2

        with pytest.raises(urllib.error.HTTPError) as refused:
            urllib.request.urlopen(base, timeout=10)
        assert refused.value.code == 503 and refused.value.headers["Retry-After"] == "1"
        assert json.loads(refused.value.read()) == {"error": "server busy; retry shortly"}
        assert server.admission.in_flight == 2  # a refused request never takes a slot

        gate.set()
        for worker in workers:
            worker.join(10)
        assert sorted(results) == [200, 200]
        assert _wait_idle(server) == 0  # released after success
        assert _get(base) == 200  # capacity is back for the next request
        assert _wait_idle(server) == 0
    finally:
        gate.set()
        server.shutdown()
        server.server_close()


def test_slot_release_is_idempotent():
    admission = srv.Admission(1)
    slot = admission.acquire()
    assert admission.in_flight == 1
    assert admission.acquire() is None
    assert slot.release() is True
    assert slot.release() is False
    assert admission.in_flight == 0


def test_thread_start_failure_releases_once_even_after_shutdown_request():
    server = _server(1)

    def cannot_start(request, client_address, slot):
        raise RuntimeError("can't start new thread")

    server._start_worker = cannot_start
    left, right = socket.socketpair()
    try:
        with pytest.raises(RuntimeError, match="can't start new thread"):
            server.process_request(left, ("127.0.0.1", 0))
        assert server.admission.in_flight == 0
        server.shutdown_request(left)  # what _handle_request_noblock does when process_request raises
        assert server.admission.in_flight == 0  # no second release, no negative count
        slot = server.admission.acquire()
        assert slot is not None and slot.release() is True
        assert server.admission.in_flight == 0
    finally:
        left.close()
        right.close()
        server.server_close()


def test_oversized_request_body_still_gets_the_503():
    gate = threading.Event()
    in_handler = threading.Event()

    class Blocking(_Quiet):
        def do_GET(self):
            in_handler.set()
            gate.wait(10)
            super().do_GET()

    server = _server(1, Blocking)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    busy = threading.Thread(target=_get, args=(f"http://127.0.0.1:{port}",))
    try:
        busy.start()
        assert in_handler.wait(5)  # the only slot is taken, so the next connection is refused
        conn = HTTPConnection("127.0.0.1", port, timeout=10)
        try:
            conn.request("POST", "/api/chat", body=b"x" * (256 * 1024))  # four times the old single 64 KiB read
            response = conn.getresponse()
            assert response.status == 503
            assert response.getheader("Retry-After") == "1"
            assert json.loads(response.read()) == {"error": "server busy; retry shortly"}
        finally:
            conn.close()
    finally:
        gate.set()
        busy.join(10)
        server.shutdown()
        server.server_close()


def test_drain_stops_at_the_byte_cap_and_still_responds():
    class Endless:
        def __init__(self):
            self.reads = 0
            self.sent = b""

        def settimeout(self, timeout):
            pass

        def recv(self, size):
            self.reads += 1
            return b"x" * size  # a peer that never stops sending

        def sendall(self, data):
            self.sent = data

        def shutdown(self, how):
            pass

        def close(self):
            pass

    server = _server(1)
    fake = Endless()
    try:
        assert server._refusals.acquire(blocking=False)  # process_request normally takes the lane first
        server._refuse_overloaded(fake)
        assert fake.reads == 16  # 1 MiB cap: stop draining instead of following an unbounded body
        assert fake.sent.startswith(b"HTTP/1.1 503 Service Unavailable")
        assert json.loads(fake.sent.split(b"\r\n\r\n", 1)[1]) == {"error": "server busy; retry shortly"}
    finally:
        server.server_close()


def test_release_survives_a_failing_handler_and_a_failing_error_handler():
    server = _server(1)

    def bad_handler(request, client_address):
        raise RuntimeError("handler failed")

    def bad_error_handler(request, client_address):
        raise RuntimeError("error handler failed")

    server.finish_request = bad_handler
    server.handle_error = bad_error_handler
    left, right = socket.socketpair()
    slot = server.admission.acquire()
    try:
        with pytest.raises(RuntimeError, match="error handler failed"):
            server._serve(left, ("127.0.0.1", 0), slot)
        assert server.admission.in_flight == 0
    finally:
        left.close()
        right.close()
        server.server_close()
