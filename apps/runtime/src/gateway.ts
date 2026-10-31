import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

/**
 * Thin CopilotKit Runtime gateway.
 *
 * Frappe owns the browser session. For every incoming Runtime request this gateway exchanges the
 * borrower's Frappe cookie (plus the page's CSRF header) for a 60-second, single-use assertion via
 * Frappe's `mint_assertion`, then builds one AG-UI HTTP agent that talks to FastAPI `/api/agui`
 * with that assertion as its ONLY credential. No lending rules, no persistence, no token
 * validation — the Python service still owns every auth decision, guard and citation.
 *
 * Failures are failures. Without a cookie or CSRF header the agent is built with no
 * Authorization header and FastAPI answers 401 — a genuine signed-out session. A Frappe refusal
 * (foreign thread, rebound conversation, disabled account, unconfigured secret) is thrown as
 * {@link MintRefused} while the run is in flight, so the browser receives a `RUN_ERROR` with the
 * real status and can start a new conversation instead of being told to sign in again. Nothing is
 * cached across requests, so a signed-out borrower cannot reuse a previous run's assertion.
 */

export interface GatewayOptions {
  /** Absolute URL of the FastAPI AG-UI endpoint, e.g. http://127.0.0.1:8000/api/agui */
  aguiUrl: string;
  /** Absolute origin of the Frappe site that mints assertions, e.g. http://localhost:8080 */
  frappeBaseUrl: string;
  /** Whitelisted Frappe method that mints the assertion. */
  mintPath?: string;
  /** Upper bound for one mint round trip; a slow Frappe must not pin a run. */
  mintTimeoutMs?: number;
  /** Path prefix the browser calls on this gateway. */
  basePath?: string;
  /** Agent id the CopilotKit client asks for. */
  agentId?: string;
  /** Exact browser origins allowed to call the gateway directly. Never a wildcard. */
  allowedOrigins?: string[];
}

export interface MintedCredential {
  authorization: string;
  application?: string;
}

/**
 * Frappe refused the exchange for a reason the borrower can act on — a conversation that belongs
 * to another account or application, or a service that is not configured. It is NOT a signed-out
 * session, so the browser must not be sent to the login page. The status is part of the message so
 * the AG-UI `RUN_ERROR` the client sees carries the real reason.
 */
export class MintRefused extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`HTTP ${status}: ${detail}`);
    this.name = "MintRefused";
  }
}

const MINT_PATH = "/api/method/loan_advisory_portal.api.agent.mint_assertion";
const THREAD_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const APPLICATION_REF = /^[A-Za-z0-9._:-]{1,140}$/;

// Local relay only: keep SDK telemetry off unless the operator explicitly opts in.
if (process.env.COPILOTKIT_TELEMETRY_DISABLED === undefined) process.env.COPILOTKIT_TELEMETRY_DISABLED = "true";

interface RunContext {
  threadId?: string;
  /** The application whose page hosts the island. Frappe re-checks ownership before minting. */
  application?: string;
}

async function runContextOf(request: Request): Promise<RunContext> {
  try {
    const body = (await request.clone().json()) as
      | { threadId?: unknown; forwardedProps?: { application?: unknown } }
      | null;
    if (!body || typeof body !== "object") return {};
    const context: RunContext = {};
    if (typeof body.threadId === "string" && THREAD_ID.test(body.threadId)) context.threadId = body.threadId;
    const application = body.forwardedProps?.application;
    if (typeof application === "string" && APPLICATION_REF.test(application)) context.application = application;
    return context;
  } catch {
    return {};
  }
}

/**
 * The CopilotKit thread id, so Frappe can bind the conversation to its owner. Untrusted: Frappe
 * validates the shape again and refuses a thread that belongs to somebody else.
 */
export async function threadIdOf(request: Request): Promise<string | undefined> {
  return (await runContextOf(request)).threadId;
}

/** The application the island was opened for. Untrusted: Frappe answers 404 for a foreign one. */
export async function applicationOf(request: Request): Promise<string | undefined> {
  return (await runContextOf(request)).application;
}

/**
 * Exchange the Frappe cookie for an assertion. Returns undefined when there is nothing to
 * exchange (no session cookie or no CSRF header), which FastAPI answers as a 401. A Frappe
 * refusal is thrown as {@link MintRefused} so the browser sees the real reason, never a
 * misleading sign-out.
 */
export async function mintCredential(
  options: Pick<GatewayOptions, "frappeBaseUrl" | "mintPath" | "mintTimeoutMs">,
  request: Request,
): Promise<MintedCredential | undefined> {
  // Only runs need a credential; runtime-info/stop probes must not spend an assertion.
  if (request.method !== "POST") return undefined;
  const cookie = request.headers.get("cookie");
  const csrf = request.headers.get("x-frappe-csrf-token");
  if (!cookie || !csrf) return undefined;

  const threadId = await threadIdOf(request);
  const application = await applicationOf(request);
  const url = `${options.frappeBaseUrl.replace(/\/+$/, "")}${options.mintPath ?? MINT_PATH}`;
  const timeout = options.mintTimeoutMs ?? 5000;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie,
        "x-frappe-csrf-token": csrf,
      },
      body: JSON.stringify({
        ...(threadId ? { thread_id: threadId } : {}),
        ...(application ? { application } : {}),
      }),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    // Network failure or timeout. No cookie or CSRF value is ever logged.
    console.error(`[gateway] assertion mint failed: ${(error as Error).name}`);
    throw new MintRefused(503, "assertion mint unavailable");
  }

  if (!response.ok) {
    // The body carries the server's own message when it has one; the cookie and CSRF never appear.
    let detail = "";
    try {
      const payload = (await response.json()) as { _error_message?: unknown; exc_type?: unknown };
      detail =
        typeof payload._error_message === "string"
          ? payload._error_message
          : typeof payload.exc_type === "string"
            ? payload.exc_type
            : "";
    } catch {
      detail = "";
    }
    console.error(`[gateway] assertion mint refused: HTTP ${response.status}`);
    throw new MintRefused(response.status, detail || "assertion mint refused");
  }

  let payload: { message?: { assertion?: unknown; application?: unknown } };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    console.error("[gateway] assertion mint returned a non-JSON body");
    throw new MintRefused(503, "assertion mint returned an unreadable response");
  }

  const message = payload?.message;
  const assertion = message?.assertion;
  if (typeof assertion !== "string" || !assertion) {
    console.error("[gateway] assertion mint returned no assertion");
    throw new MintRefused(503, "assertion mint returned no assertion");
  }
  return {
    authorization: `Bearer ${assertion}`,
    application: typeof message?.application === "string" ? message.application : undefined,
  };
}

/** One exchange per incoming Runtime request, even if the agent fetches more than once. */
function memoizedCredential(
  options: Pick<GatewayOptions, "frappeBaseUrl" | "mintPath" | "mintTimeoutMs">,
  request: Request,
): () => Promise<MintedCredential | undefined> {
  let pending: Promise<MintedCredential | undefined> | undefined;
  return () => (pending ??= mintCredential(options, request));
}

export function createGateway(options: GatewayOptions) {
  const basePath = options.basePath ?? "/api/copilotkit";
  const agentId = options.agentId ?? "advisory";
  const allowedOrigins = options.allowedOrigins ?? [new URL(options.frappeBaseUrl).origin];

  const runtime = new CopilotRuntime({
    agents: async ({ request }) => {
      // Exchange inside the run, not in this factory: a throw here becomes a gateway 500, while a
      // throw from `fetch` reaches the browser as an AG-UI `RUN_ERROR` that carries the real status.
      const credential = request ? memoizedCredential(options, request) : undefined;
      return {
        [agentId]: new HttpAgent({
          url: options.aguiUrl,
          fetch: credential
            ? async (url, init) => {
                const minted = await credential();
                const headers = new Headers(init.headers);
                if (minted) headers.set("authorization", minted.authorization);
                return fetch(url, { ...init, headers });
              }
            : undefined,
        }),
      };
    },
    // CopilotKit forwards every inbound `x-*` header (and `authorization`) to the agent by
    // default, which would hand the browser's CSRF token to FastAPI and can comma-join a
    // duplicate `content-type`. Allowlisting a name no client ever sends switches the policy to
    // allowlist mode and forwards nothing: the assertion minted here is the only credential the
    // agent URL ever sees.
    forwardHeaders: { allow: ["x-loan-advisory-forward-nothing"] },
  });

  const listener = createCopilotNodeListener({
    runtime,
    basePath,
    cors: {
      origin: allowedOrigins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["content-type", "x-frappe-csrf-token"],
      // The browser must attach the Frappe session cookie to Runtime calls. That is only safe
      // because `origin` is an explicit list: a wildcard with credentials is rejected by browsers.
      credentials: true,
      maxAge: 600,
    },
    activateChannels: false,
  });

  return { runtime, listener, basePath, agentId };
}
