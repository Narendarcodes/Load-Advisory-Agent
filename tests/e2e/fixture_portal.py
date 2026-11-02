#!/usr/bin/env python3
"""TEST-ONLY visual fixture render of the borrower portal (no Frappe, no database).

Renders the real Jinja templates under ``www/`` with the real base layout and serves the real
built assets, but every ``/api/method/...`` read is answered from the fixed fixtures below and
``/api/copilotkit`` is proxied to a separately started CopilotKit runtime (apps/runtime), whose
upstream is the deterministic ``agui_stub.cjs``. It exists only to take screenshots, recordings
and axe audits of the redesign in a sandbox that cannot host a Frappe bench.

What it is NOT: sessions, permissions, ownership checks, CSRF, rate limits, writes, evidence
and the policy engine are all absent. Every borrower, application and decision here is
fictional fixture data. Do not read anything it shows as a real outcome.

    python tests/e2e/fixture_portal.py --app-root apps/loan_advisory_portal --port 8081 \
        --runtime http://127.0.0.1:4200

Scenario: add ``?fx=empty`` to any page to switch the borrower to "no applications" (sticky
for that browser via a cookie); ``?fx=full`` switches back.
"""

from __future__ import annotations

import argparse
import http.client
import json
import mimetypes
import sys
import types
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import jinja2

FIXTURE_NOTE = "Fixture data for screenshots - not a real borrower or decision."


class AttrDict(dict):
	"""Frappe's ``frappe._dict``: attribute and ``.get`` access to the same keys."""

	def __getattr__(self, key):
		try:
			return self[key]
		except KeyError:
			return None


BORROWER = {"user": "asha.reddy@example.invalid", "full_name": "Asha Reddy", "initials": "AR"}

APPLICATIONS = {
	"ACC-LOAP-2026-00024": dict(state="SUBMITTED", amount=150000, tenure=18, purpose="Home repairs",
	                            posted="2026-10-30", decision=None),
	"ACC-LOAP-2026-00021": dict(state="REJECTED", amount=500000, tenure=36, purpose="Business expansion",
	                            posted="2026-10-22", decision="REJECTED"),
	"ACC-LOAP-2026-00018": dict(state="INFO_REQUESTED", amount=250000, tenure=24, purpose="Education",
	                            posted="2026-10-12", decision="REVIEW"),
	"ACC-LOAP-2026-00012": dict(state="APPROVED", amount=200000, tenure=24, purpose="Vehicle purchase",
	                            posted="2026-09-28", decision="APPROVED"),
}

REASONS = {
	"REJECTED": [
		{"code": "FOIR_TOO_HIGH", "text": "Your existing monthly repayments are more than 45% of your monthly income."},
		{"code": "CREDIT_SCORE_LOW", "text": "Your credit score is below the minimum this product accepts (650)."},
	],
	"APPROVED": [],
	"REVIEW": [],
}


def _guidance(app_root: Path):
	sys.path.insert(0, str(app_root))
	from loan_advisory_portal.portal import guidance, lifecycle  # noqa: E402  (pure modules)

	try:
		from loan_advisory_portal.portal import legal  # noqa: E402
	except Exception:  # pragma: no cover - older trees
		legal = types.SimpleNamespace(TERMS_VERSION="fixture", PRIVACY_VERSION="fixture", UPDATED="fixture")
	return guidance, lifecycle, legal


class Fixtures:
	def __init__(self, app_root: Path):
		self.guidance, self.lifecycle, self.legal = _guidance(app_root)

	def boot(self, signed_in: bool) -> dict:
		if not signed_in:
			return {"user": "Guest", "csrf_token": "fixture-csrf", "full_name": "", "initials": "LA", "demo": False}
		return {
			"user": BORROWER["user"],
			"csrf_token": "fixture-csrf",
			"full_name": BORROWER["full_name"],
			"initials": BORROWER["initials"],
			"demo": False,
			"customer": "CUST-FIXTURE",
			"literacy": "low",
			"locale": "en",
			"profile": "BP-FIXTURE",
		}

	def evidence(self, name: str) -> dict | None:
		row = APPLICATIONS[name]
		if not row["decision"]:
			return None
		return {"decision": row["decision"], "policy_version": "synthetic-2026.1",
		        "evaluated_at": row["posted"] + " 14:30:00", "simulation": False}

	def serialise(self, name: str) -> dict:
		row = APPLICATIONS[name]
		return {
			"name": name, "status": "Open", "lifecycle": row["state"], "loan_product": "Personal Term Loan",
			"loan_amount": row["amount"], "tenure_months": row["tenure"], "posting_date": row["posted"],
			"submitted_at": row["posted"] + " 10:05:00", "purpose": row["purpose"],
			"policy_version": "synthetic-2026.1", "decision": self.evidence(name),
		}

	def applications(self, scenario: str) -> list[dict]:
		return [] if scenario == "empty" else [self.serialise(name) for name in APPLICATIONS]

	def application(self, name: str) -> dict:
		row = APPLICATIONS[name]
		payload = self.serialise(name)
		timeline = [{"at": row["posted"] + " 09:40:00", "event": "Started"},
		            {"at": row["posted"] + " 10:05:00", "event": "Submitted", "state": "SUBMITTED", "source": "portal"}]
		if row["decision"]:
			timeline.append({"at": row["posted"] + " 14:30:00", "event": f"Evaluated ({row['decision']})",
			                 "policy_version": "synthetic-2026.1"})
			timeline.append({"at": row["posted"] + " 14:30:01", "event": self.lifecycle_label(row["state"]),
			                 "state": row["state"], "source": "evidence"})
		payload.update({
			"docstatus": 0 if row["state"] == "DRAFT" else 1,
			"documents": [] if row["state"] == "DRAFT" else [
				{"row": "ROW-1", "document_type": "Salary slip", "file": "/private/files/fixture.pdf",
				 "file_name": "salary-slip-oct.pdf"}],
			"product": {"product_name": "Personal Term Loan", "rate_of_interest": 13.5, "maximum_loan_amount": 1000000},
			"inputs": {"monthly_income": 52000, "monthly_obligations": 26000,
			           "credit_score": 612 if row["state"] == "REJECTED" else 731, "employment_months": 30},
			"contact": {"name": BORROWER["full_name"], "email": BORROWER["user"], "phone": "+91 90000 00000"},
			"timeline": timeline,
			"guidance": self.guidance.for_state(row["state"]),
		})
		return payload

	def lifecycle_label(self, state: str) -> str:
		return self.guidance.for_state(state)["title"]

	def decision(self, name: str) -> dict:
		row = APPLICATIONS[name]
		if not row["decision"]:
			return {"available": False}
		return {
			"available": True, "decision": row["decision"], "lifecycle": row["state"],
			"policy_version": "synthetic-2026.1", "evaluated_at": row["posted"] + " 14:30:00", "simulation": False,
			"outcome": row["decision"], "reasons": REASONS[row["decision"]],
			"missing_fields": ["monthly_income", "credit_score"] if row["state"] == "INFO_REQUESTED" else [],
			"information_needed": row["state"] == "INFO_REQUESTED", "provider_error": False, "flags": [],
		}

	def profile(self) -> dict:
		return {
			"name": "BP-FIXTURE", "customer": "CUST-FIXTURE", "status": "Active", "onboarding_state": "PROFILE",
			"full_name": BORROWER["full_name"], "email": BORROWER["user"], "phone": "+919000000000",
			"employment_type": "Salaried", "employer": "Example Textiles Pvt Ltd", "employment_months": 30,
			"monthly_income": 52000, "monthly_obligations": 9000, "preferred_locale": "en", "literacy": "low",
			"consent_terms": 1, "consent_privacy": 1, "terms_version": "fixture", "privacy_version": "fixture",
			"profile_completion": 80,
		}

	def me(self) -> dict:
		return {
			"authenticated": True, "user": BORROWER["user"], "full_name": BORROWER["full_name"],
			"email": BORROWER["user"], "roles": ["Borrower"], "is_borrower": True,
			"borrower": {"customer": "CUST-FIXTURE", "profile": "BP-FIXTURE", "literacy": "low", "locale": "en",
			             "onboarding_state": "PROFILE", "profile_completion": 80},
			"selected_application": None,
		}

	def method(self, method: str, args: dict, scenario: str):
		short = method.rsplit(".", 1)[-1]
		app = args.get("application") or args.get("name")
		if short == "me":
			return self.me()
		if short == "list_applications":
			return self.applications(scenario)
		if short == "get_application" and app in APPLICATIONS:
			return self.application(app)
		if short == "get_decision" and app in APPLICATIONS:
			return self.decision(app)
		if short in ("get_profile", "update_profile"):
			return self.profile()
		if short == "list_documents":
			return []
		if short == "list_document_types":
			return [{"name": n} for n in ("Salary slip", "Bank statement", "PAN card", "Address proof")]
		if short == "mint_assertion":
			return {"assertion": "fixture-assertion-not-a-credential", "application": app or "ACC-LOAP-2026-00021",
			        "customer": "CUST-FIXTURE", "thread_id": args.get("thread_id") or "thread-fixture"}
		if short == "list_conversations":
			return [
				{"thread_id": "thread-fixture-1", "application": "ACC-LOAP-2026-00021",
				 "title": "Why was my loan not approved?", "turn_count": 4,
				 "last_activity": "2026-11-01 18:20:00", "status": "Open"},
				{"thread_id": "thread-fixture-2", "application": "ACC-LOAP-2026-00021",
				 "title": "What if my EMIs were lower?", "turn_count": 2,
				 "last_activity": "2026-10-28 11:05:00", "status": "Open"},
			]
		if short == "conversation_messages":
			return {"thread_id": args.get("thread_id"), "application": "ACC-LOAP-2026-00021", "title": "Fixture",
			        "turn_count": 0, "last_activity": None, "messages": []}
		if short == "record_turn":
			return {"thread_id": args.get("thread_id") or "thread-fixture", "turn_count": 1, "title": None}
		if short in ("list_feedback",):
			return []
		if short == "create_application":
			return {"name": "ACC-LOAP-2026-00025", "lifecycle": "DRAFT"}
		return None

	# -------- page contexts --------
	def page(self, path: str, query: dict) -> tuple[str, dict] | None:
		signed_in = path != "/login"
		ctx = {"boot": self.boot(signed_in), "blocked": None}
		get = lambda key: (query.get(key) or [""])[0]  # noqa: E731
		if path == "/login":
			ctx.update(active_page="login", title="Sign in", redirect_to="/borrower", demo=False)
			return "www/login.html", ctx
		if path in ("/borrower", "/borrower/"):
			ctx.update(active_page="applications", title="My applications")
			return "www/borrower/index.html", ctx
		if path == "/borrower/apply":
			ctx.update(active_page="apply", title="New application",
			           product={"name": "Personal Term Loan", "maximum": 1000000, "rate": 13.5})
			return "www/borrower/apply.html", ctx
		if path == "/borrower/application":
			name = get("name")
			ctx.update(active_page="application", title="Application")
			if name not in APPLICATIONS:
				ctx.update(not_found=True, title="Application not found")
			else:
				row = APPLICATIONS[name]
				ctx["application"] = AttrDict(name=name, custom_lifecycle_state=row["state"], loan_amount=row["amount"],
				                              repayment_periods=row["tenure"], custom_loan_purpose=row["purpose"])
			return "www/borrower/application.html", ctx
		if path == "/borrower/documents":
			ctx.update(active_page="documents", title="Documents", requested_application=get("name"),
			           created=get("created") == "1")
			return "www/borrower/documents.html", ctx
		if path == "/borrower/help":
			ctx.update(active_page="help", title="Help", terms_version=self.legal.TERMS_VERSION,
			           privacy_version=self.legal.PRIVACY_VERSION, updated=self.legal.UPDATED,
			           states=[self.guidance.for_state(s) for s in self.lifecycle.STATES])
			return "www/borrower/help.html", ctx
		if path == "/borrower/profile":
			# Same context as www/borrower/profile.py: the canonical preference vocabulary.
			try:
				from loan_advisory_portal.portal import preferences as vocabulary  # noqa: E402  (pure module)
			except Exception:  # pragma: no cover - older trees
				return None
			ctx.update(active_page="profile", title="Your profile",
			           locale_options=vocabulary.locale_options(), literacy_options=vocabulary.literacy_options(),
			           current_locale="en", current_literacy="low")
			return "www/borrower/profile.html", ctx
		if path == "/borrower/assistant":
			name = get("application")
			ctx.update(active_page="assistant", title="Assistant")
			if name not in APPLICATIONS:
				rows = self.applications(get("fx") or "full")
				for row in rows:
					row["lifecycle_label"] = self.lifecycle_label(row["lifecycle"])
				ctx.update(application=None, applications=rows)
				return "www/borrower/assistant.html", ctx
			row = APPLICATIONS[name]
			guide = self.guidance.for_state(row["state"])
			labels = {"APPROVED": "Approved", "REJECTED": "Not approved"}
			ctx.update(
				application=AttrDict(name=name, custom_lifecycle_state=row["state"], loan_amount=row["amount"],
				                     repayment_periods=row["tenure"], custom_loan_purpose=row["purpose"]),
				snapshot={"lifecycle": row["state"], "title": guide["title"], "summary": guide["summary"],
				          "decision_label": labels.get(row["decision"], "No assessment recorded")},
				assistant={"application": name, "user": BORROWER["user"], "csrf_token": "fixture-csrf",
				           "literacy": "low", "locale": "en",
				           "voice": {"enabled": False, "consent_version": "fixture"}},
			)
			return "www/borrower/assistant.html", ctx
		return None


def make_handler(app_root: Path, fixtures: Fixtures, env: jinja2.Environment, runtime: str):
	package = app_root / "loan_advisory_portal"
	public = package / "public"
	runtime_url = urlparse(runtime)

	class Handler(BaseHTTPRequestHandler):
		protocol_version = "HTTP/1.1"

		def log_message(self, fmt, *args):  # quiet
			pass

		def _scenario(self, query) -> tuple[str, str | None]:
			fx = (query.get("fx") or [""])[0]
			if fx in ("empty", "full"):
				return fx, fx
			jar = cookies.SimpleCookie(self.headers.get("Cookie") or "")
			return (jar["fx"].value if "fx" in jar else "full"), None

		def _send(self, status, body: bytes, ctype: str, extra=None):
			self.send_response(status)
			self.send_header("Content-Type", ctype)
			self.send_header("Content-Length", str(len(body)))
			self.send_header("Cache-Control", "no-store")
			for key, value in (extra or {}).items():
				self.send_header(key, value)
			self.end_headers()
			if self.command != "HEAD":
				self.wfile.write(body)

		def do_HEAD(self):
			self.do_GET()

		def do_GET(self):
			url = urlparse(self.path)
			query = parse_qs(url.query)
			if url.path.startswith("/api/copilotkit"):
				return self._proxy()
			if url.path.startswith("/api/method/"):
				return self._method(url, query, {})
			if url.path.startswith("/assets/loan_advisory_portal/"):
				rel = url.path[len("/assets/loan_advisory_portal/"):]
				target = (public / rel).resolve()
				if public.resolve() in target.parents and target.is_file():
					ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
					if target.suffix == ".js":
						ctype = "text/javascript"
					return self._send(200, target.read_bytes(), ctype)
				return self._send(404, b"not found", "text/plain")
			if url.path == "/":
				self.send_response(302)
				self.send_header("Location", "/borrower")
				self.send_header("Content-Length", "0")
				self.end_headers()
				return
			scenario, set_cookie = self._scenario(query)
			found = fixtures.page(url.path, {**query, "fx": [scenario]})
			if not found:
				return self._send(404, b"not found", "text/plain")
			template, ctx = found
			html = env.get_template(template).render(**ctx)
			# A visible-to-reviewers but screen-reader-hidden marker would alter the design; the
			# fixture nature is recorded in the HTML source instead.
			html = html.replace("<head>", f"<head>\n\t<!-- {FIXTURE_NOTE} -->", 1)
			extra = {"Set-Cookie": f"fx={set_cookie}; Path=/"} if set_cookie else None
			status = 404 if ctx.get("not_found") else 200
			self._send(status, html.encode(), "text/html; charset=utf-8", extra)

		def do_POST(self):
			url = urlparse(self.path)
			if url.path.startswith("/api/copilotkit"):
				return self._proxy()
			length = int(self.headers.get("Content-Length") or 0)
			raw = self.rfile.read(length) if length else b""
			args: dict = {}
			ctype = self.headers.get("Content-Type") or ""
			try:
				if "json" in ctype and raw:
					args = json.loads(raw)
				elif raw:
					args = {k: v[0] for k, v in parse_qs(raw.decode()).items()}
			except ValueError:
				args = {}
			if url.path.startswith("/api/method/"):
				return self._method(url, parse_qs(url.query), args)
			if url.path == "/api/method/logout":
				return self._send(200, b"{}", "application/json")
			self._send(404, b"{}", "application/json")

		def _method(self, url, query, args):
			method = url.path[len("/api/method/"):]
			merged = {k: v[0] for k, v in query.items()}
			merged.update(args or {})
			scenario, _ = self._scenario(query)
			result = fixtures.method(method, merged, scenario)
			if result is None and not method.endswith(("logout", "submit_feedback")):
				return self._send(404, json.dumps({"exc_type": "DoesNotExistError"}).encode(), "application/json")
			self._send(200, json.dumps({"message": result}).encode(), "application/json")

		def _proxy(self):
			length = int(self.headers.get("Content-Length") or 0)
			body = self.rfile.read(length) if length else None
			conn = http.client.HTTPConnection(runtime_url.hostname, runtime_url.port, timeout=60)
			headers = {k: v for k, v in self.headers.items() if k.lower() not in ("host", "connection", "accept-encoding")}
			headers["Host"] = f"{runtime_url.hostname}:{runtime_url.port}"
			try:
				conn.request(self.command, self.path, body=body, headers=headers)
				upstream = conn.getresponse()
			except OSError:
				return self._send(502, b'{"error":"runtime unavailable"}', "application/json")
			self.send_response(upstream.status)
			for key, value in upstream.getheaders():
				if key.lower() in ("transfer-encoding", "connection", "content-length"):
					continue
				self.send_header(key, value)
			self.send_header("Transfer-Encoding", "chunked")
			self.end_headers()
			while True:
				chunk = upstream.read1(65536) if hasattr(upstream, "read1") else upstream.read(65536)
				if not chunk:
					break
				self.wfile.write(f"{len(chunk):x}\r\n".encode() + chunk + b"\r\n")
				self.wfile.flush()
			self.wfile.write(b"0\r\n\r\n")
			conn.close()

	return Handler


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
	parser.add_argument("--app-root", required=True, help="apps/loan_advisory_portal of the tree to render")
	parser.add_argument("--port", type=int, default=8081)
	parser.add_argument("--runtime", default="http://127.0.0.1:4200")
	args = parser.parse_args()
	app_root = Path(args.app_root).resolve()
	fixtures = Fixtures(app_root)
	env = jinja2.Environment(loader=jinja2.FileSystemLoader(str(app_root / "loan_advisory_portal")),
	                         autoescape=False, extensions=["jinja2.ext.do"])
	server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(app_root, fixtures, env, args.runtime))
	print(f"fixture portal (TEST ONLY) {app_root} on http://127.0.0.1:{args.port}", file=sys.stderr)
	server.serve_forever()
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
