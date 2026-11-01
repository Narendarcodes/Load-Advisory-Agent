// End-to-end spike: @ag-ui/client -> CopilotKit Runtime gateway -> FastAPI /api/agui -> agent.
//
// The Python fixture runs the real adapter, assertion verification, guards and decision pipeline over
// the in-memory MockStore with a scripted LLM. This file proves the gateway exchanges the Frappe
// cookie for a single-use assertion per request, forwards only that assertion (never the cookie or
// the CSRF header), fails closed, and keeps applicants apart.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID, createHmac } from "node:crypto";
import { once } from "node:events";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { delimiter, dirname, join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

import { HttpAgent, type BaseEvent } from "@ag-ui/client";

import { createGateway } from "../src/gateway.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const SECRET = "runtime-e2e-assertion-secret-0123456789"; // >= 32 chars, as Frappe requires

const MINT_PATH = "/api/method/loan_advisory_portal.api.agent.mint_assertion";

// Cookie -> the synthetic applicant/application that the stub mint claims for it.
const SESSIONS: Record<string, { user: string; customer: string; application: string }> = {
  "sid=alpha": { user: "alpha@example.com", customer: "CUS-TEST-005", application: "APP-TEST-005" },
  "sid=beta": { user: "beta@example.com", customer: "CUS-TEST-001", application: "APP-TEST-001" },
};

interface Fixture {
  child: ChildProcess;
  base: string;
  stderr: string[];
}

interface MintCall {
  cookie: string;
  csrf: string;
  body: Record<string, unknown>;
}

interface MintStub {
  server: Server;
  base: string;
  calls: MintCall[];
  mode: "ok" | "refuse" | "empty" | "fixed" | "conflict";
  fixedAssertion?: string;
  close: () => Promise<void>;
}

interface EventLog {
  events: BaseEvent[];
  agent: HttpAgent;
}

function startAgent(): Promise<Fixture> {
  const child = spawn(process.env.PYTHON ?? "python", [join(here, "support", "serve_agent.py")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      AGENT_ASSERTION_SECRET: SECRET,
      PYTHONPATH: [".", "apps/api/src", "apps/bureau/src"].join(delimiter),
      PYTHONIOENCODING: "utf-8",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stderr: string[] = [];
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => stderr.push(chunk));

  return new Promise((ok, fail) => {
    const timer = setTimeout(() => {
      child.kill();
      fail(new Error(`python fixture did not start in 90s\n${stderr.join("")}`));
    }, 90_000);
    const lines = createInterface({ input: child.stdout });
    lines.on("line", (line) => {
      const match = /^READY (\d+)$/.exec(line.trim());
      if (match) {
        clearTimeout(timer);
        ok({ child, base: `http://127.0.0.1:${match[1]}`, stderr });
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      fail(new Error(`python fixture exited early (${code})\n${stderr.join("")}`));
    });
  });
}

/** Compact sorted JSON, exactly like `services/assertion.py` in the portal. */
function signAssertion(payload: Record<string, unknown>, secret: string): string {
  const sorted = Object.fromEntries(Object.keys(payload).sort().map((key) => [key, payload[key]]));
  const body = Buffer.from(JSON.stringify(sorted), "utf8");
  const signature = createHmac("sha256", secret).update(body).digest();
  return `${body.toString("base64url")}.${signature.toString("base64url")}`;
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

/** Stands in for the Frappe whitelisted method; signs with the same secret as the Python verifier. */
async function startMintStub(): Promise<MintStub> {
  const calls: MintCall[] = [];
  const stub: MintStub = { server: null as unknown as Server, base: "", calls, mode: "ok", close: async () => {} };

  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || !request.url?.startsWith(MINT_PATH)) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ exc: "not found" }));
      return;
    }
    const cookie = String(request.headers.cookie ?? "");
    const csrf = String(request.headers["x-frappe-csrf-token"] ?? "");
    const body = await readJson(request);
    calls.push({ cookie, csrf, body });

    if (stub.mode === "refuse" || !csrf) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ exc: "Forbidden" }));
      return;
    }
    if (stub.mode === "empty") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: {} }));
      return;
    }
    if (stub.mode === "conflict") {
      response.writeHead(409, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          exc_type: "Conflict",
          _error_message: "This conversation is linked to another application. Start a new conversation.",
        }),
      );
      return;
    }

    const session = Object.entries(SESSIONS).find(([key]) => cookie.includes(key))?.[1];
    if (!session) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ exc: "Forbidden" }));
      return;
    }
    // Frappe resolves the named application through `owned_application`; a foreign one is a 404.
    if (typeof body.application === "string" && body.application !== session.application) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ exc: "NotFound" }));
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const requested = typeof body.application === "string" ? body.application : session.application;
    const assertion =
      stub.mode === "fixed" && stub.fixedAssertion
        ? stub.fixedAssertion
        : signAssertion(
            {
              iss: "frappe:loan_advisory_portal",
              aud: "loan-advisory-agent",
              sub: session.user,
              customer: session.customer,
              application: requested,
              thread: typeof body.thread_id === "string" ? body.thread_id : null,
              literacy: "medium",
              locale: "en",
              iat: now,
              exp: now + 60,
              jti: randomUUID().replace(/-/g, ""),
            },
            SECRET,
          );

    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        message: { assertion, application: requested, customer: session.customer, expires_in: 60 },
      }),
    );
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  stub.server = server;
  stub.base = `http://127.0.0.1:${address.port}`;
  stub.close = () =>
    new Promise<void>((ok) => {
      server.close(() => ok());
      server.closeAllConnections();
    });
  return stub;
}

async function serveRuntime(aguiUrl: string, frappeBaseUrl: string): Promise<{ server: Server; base: string }> {
  const { listener } = createGateway({ aguiUrl, frappeBaseUrl, allowedOrigins: ["http://localhost:8080"] });
  const server = createServer(listener);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return { server, base: `http://127.0.0.1:${address.port}` };
}

function runUrl(base: string): string {
  return `${base}/api/copilotkit/agent/advisory/run`;
}

interface Caller {
  cookie?: string;
  csrf?: string;
  extraHeaders?: Record<string, string>;
}

async function runThrough(
  url: string,
  caller: Caller,
  text: string,
  threadId: string,
  runId: string,
  forwardedProps?: Record<string, unknown>,
): Promise<EventLog> {
  const headers: Record<string, string> = { ...(caller.extraHeaders ?? {}) };
  if (caller.cookie) headers.cookie = caller.cookie;
  if (caller.csrf) headers["x-frappe-csrf-token"] = caller.csrf;
  const agent = new HttpAgent({ url, headers });
  agent.threadId = threadId;
  agent.addMessage({ id: `u-${runId}`, role: "user", content: text });
  const events: BaseEvent[] = [];
  await agent.runAgent({ runId, forwardedProps }, { onEvent: ({ event }) => void events.push(event) });
  return { events, agent };
}

function types(events: BaseEvent[]): string[] {
  return events.map((event) => event.type);
}

function textOf(events: BaseEvent[]): string {
  return events
    .filter((event) => event.type === "TEXT_MESSAGE_CONTENT")
    .map((event) => String((event as { delta?: string }).delta ?? ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function errorMessage(events: BaseEvent[]): string {
  const failure = events.find((event) => event.type === "RUN_ERROR") as unknown as { message?: string } | undefined;
  return String(failure?.message ?? "");
}

let fixture: Fixture;
let mint: MintStub;
let runtime: { server: Server; base: string };

before(async () => {
  fixture = await startAgent();
  mint = await startMintStub();
  runtime = await serveRuntime(`${fixture.base}/api/agui`, mint.base);
});

after(async () => {
  runtime?.server.close();
  fixture?.child.kill();
  await mint?.close();
});

test("a signed-in turn mints one assertion and completes through Runtime -> FastAPI -> agent", async () => {
  const before = mint.calls.length;
  const { events, agent } = await runThrough(
    runUrl(runtime.base),
    { cookie: "sid=alpha; frappe_user=alpha", csrf: "csrf-alpha" },
    "Why was my loan rejected?",
    "thread-spike",
    "run-spike",
  );

  const kinds = types(events);
  assert.equal(kinds[0], "RUN_STARTED");
  assert.ok(kinds.includes("TEXT_MESSAGE_START"));
  assert.ok(kinds.includes("STATE_SNAPSHOT"));
  assert.equal(kinds.at(-1), "RUN_FINISHED");
  assert.equal((events[0] as unknown as { threadId?: string }).threadId, "thread-spike");

  assert.match(textOf(events), /synthetic prototype policy/i);
  assert.match(textOf(events), /credit score/i);
  const state = agent.state as Record<string, unknown>;
  const card = state.decision_card as Record<string, unknown>;
  assert.equal(card.application_ref, "APP-TEST-005");
  assert.equal(card.decision, "REJECTED");
  assert.ok(state.trace_id, "structured state must carry a trace id");
  assert.equal(state.intent, "explain");

  assert.equal(mint.calls.length, before + 1, "each run must mint exactly once");
  const call = mint.calls.at(-1)!;
  assert.match(call.cookie, /sid=alpha/);
  assert.equal(call.csrf, "csrf-alpha");
  assert.equal(call.body.thread_id, "thread-spike", "Frappe binds the conversation to the thread");
});

test("the island's application is minted; a malformed reference is dropped", async () => {
  const before = mint.calls.length;

  const scoped = await runThrough(
    runUrl(runtime.base),
    { cookie: "sid=alpha", csrf: "csrf-alpha" },
    "Why was my loan rejected?",
    "thread-app",
    "run-app",
    { application: "APP-TEST-005" },
  );
  assert.equal(types(scoped.events).at(-1), "RUN_FINISHED");
  assert.equal(mint.calls.at(-1)!.body.application, "APP-TEST-005");

  for (const application of ["<script>alert(1)</script>", "A".repeat(200), 42, null]) {
    await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-app-bad",
      `run-app-bad-${mint.calls.length}`,
      { application },
    );
    assert.equal("application" in mint.calls.at(-1)!.body, false, `dropped: ${String(application)}`);
  }

  assert.equal(mint.calls.length, before + 5);
});

test("an application the borrower does not own is refused before the agent runs", async () => {
  const log = await runThrough(
    runUrl(runtime.base),
    { cookie: "sid=alpha", csrf: "csrf-alpha" },
    "why?",
    "thread-foreign-app",
    "run-foreign-app",
    { application: "APP-TEST-001" },
  );
  assert.deepEqual(types(log.events), ["RUN_ERROR"]);
  assert.match(errorMessage(log.events), /404/);
  assert.equal((log.agent.state as Record<string, unknown>).decision_card, undefined);
});

test("FastAPI receives the assertion only: no cookie, no CSRF header", async () => {
  // Own run first: this probe reads the most recent request recorded by the fixture.
  await runThrough(
    runUrl(runtime.base),
    { cookie: "sid=alpha", csrf: "csrf-alpha" },
    "why?",
    "thread-seen",
    "run-seen",
  );
  const seen = (await (await fetch(`${fixture.base}/__seen`)).json()) as { seen: Record<string, Record<string, boolean>> };
  const agui = seen.seen["/api/agui"];
  assert.ok(agui, "the AG-UI route must have been reached");
  assert.equal(agui.cookie, false, "the browser cookie must never reach FastAPI");
  assert.equal(agui.csrf, false, "the CSRF header must never reach FastAPI");
  assert.equal(agui.authorization, true, "only the assertion is forwarded, as a bearer token");
  assert.equal(agui.content_type, "application/json", "exactly one content-type, never a comma-joined pair");
});

test("a run without a Frappe session is refused, never answered", async () => {
  const before = mint.calls.length;
  const log = await runThrough(runUrl(runtime.base), {}, "why?", "thread-anon", "run-anon");
  assert.deepEqual(types(log.events), ["RUN_ERROR"]);
  assert.match(errorMessage(log.events), /401/);
  assert.match(errorMessage(log.events), /sign in first/);
  assert.equal(mint.calls.length, before, "no cookie means no mint attempt");
  assert.equal((log.agent.state as Record<string, unknown>).decision_card, undefined);
});

test("a missing CSRF header is not minted and the run is refused", async () => {
  const before = mint.calls.length;
  const log = await runThrough(runUrl(runtime.base), { cookie: "sid=alpha" }, "why?", "thread-csrf", "run-csrf");
  assert.deepEqual(types(log.events), ["RUN_ERROR"]);
  assert.match(errorMessage(log.events), /401/);
  assert.equal(mint.calls.length, before, "the gateway must not call Frappe without a CSRF header");
});

test("Frappe refusing to mint keeps its own status instead of a false sign-out", async () => {
  mint.mode = "refuse";
  try {
    const log = await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-refused",
      "run-refused",
    );
    assert.deepEqual(types(log.events), ["RUN_ERROR"]);
    assert.match(errorMessage(log.events), /403/);
    assert.doesNotMatch(errorMessage(log.events), /sign in first/);
  } finally {
    mint.mode = "ok";
  }
});

test("a mint response without an assertion is a service failure, not a sign-out", async () => {
  mint.mode = "empty";
  try {
    const log = await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-empty",
      "run-empty",
    );
    assert.deepEqual(types(log.events), ["RUN_ERROR"]);
    assert.match(errorMessage(log.events), /503/);
  } finally {
    mint.mode = "ok";
  }
});

test("a rebound conversation is refused with its own status, never a sign-out", async () => {
  mint.mode = "conflict";
  try {
    const log = await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-rebound",
      "run-rebound",
    );
    assert.deepEqual(types(log.events), ["RUN_ERROR"]);
    assert.match(errorMessage(log.events), /409/);
    assert.doesNotMatch(errorMessage(log.events), /sign in first/);
  } finally {
    mint.mode = "ok";
  }
});

test("a browser identity header cannot override the asserted customer", async () => {
  const { agent } = await runThrough(
    runUrl(runtime.base),
    {
      cookie: "sid=alpha",
      csrf: "csrf-alpha",
      extraHeaders: {
        "x-applicant-ref": "CUS-TEST-001",
        "x-application-ref": "APP-TEST-001",
        "x-user-id": "CUS-TEST-001",
      },
    },
    "why?",
    "thread-spoof",
    "run-spoof",
  );
  const card = (agent.state as Record<string, unknown>).decision_card as Record<string, unknown>;
  assert.equal(card.application_ref, "APP-TEST-005");
});

test("an assertion cannot be replayed", async () => {
  const now = Math.floor(Date.now() / 1000);
  mint.fixedAssertion = signAssertion(
    {
      iss: "frappe:loan_advisory_portal",
      aud: "loan-advisory-agent",
      sub: "alpha@example.com",
      customer: "CUS-TEST-005",
      application: "APP-TEST-005",
      thread: "thread-replay-a",
      literacy: "medium",
      locale: "en",
      iat: now,
      exp: now + 60,
      jti: "replay-fixed-jti",
    },
    SECRET,
  );
  mint.mode = "fixed";
  try {
    const first = await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-replay-a",
      "run-replay-a",
    );
    assert.equal(types(first.events).at(-1), "RUN_FINISHED");
    const second = await runThrough(
      runUrl(runtime.base),
      { cookie: "sid=alpha", csrf: "csrf-alpha" },
      "why?",
      "thread-replay-b",
      "run-replay-b",
    );
    assert.deepEqual(types(second.events), ["RUN_ERROR"]);
    assert.match(errorMessage(second.events), /401/);
  } finally {
    mint.mode = "ok";
    mint.fixedAssertion = undefined;
  }
});

test("CORS preflight admits the configured origin with credentials only", async () => {
  const preflight = async (origin: string) => {
    const response = await fetch(runUrl(runtime.base), {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-frappe-csrf-token",
      },
    });
    return response.headers;
  };

  const allowed = await preflight("http://localhost:8080");
  assert.equal(allowed.get("access-control-allow-origin"), "http://localhost:8080");
  assert.equal(allowed.get("access-control-allow-credentials"), "true");

  const foreign = await preflight("http://evil.example");
  assert.equal(foreign.get("access-control-allow-origin"), null);
});

test("two concurrent applicants keep their own assertion and conversation", async () => {
  const [first, second] = await Promise.all([
    runThrough(runUrl(runtime.base), { cookie: "sid=alpha", csrf: "csrf-alpha" }, "why?", "thread-a-005", "run-a"),
    runThrough(runUrl(runtime.base), { cookie: "sid=beta", csrf: "csrf-beta" }, "why?", "thread-b-001", "run-b"),
  ]);
  const cardA = (first.agent.state as Record<string, unknown>).decision_card as Record<string, unknown>;
  const cardB = (second.agent.state as Record<string, unknown>).decision_card as Record<string, unknown>;
  assert.equal(cardA.application_ref, "APP-TEST-005");
  assert.equal(cardB.application_ref, "APP-TEST-001");
  assert.equal(cardA.decision, "REJECTED");
  assert.equal(cardB.decision, "APPROVED");
});
