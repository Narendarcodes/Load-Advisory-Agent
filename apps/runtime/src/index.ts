import { createServer } from "node:http";

import { createGateway } from "./gateway.js";

const host = process.env.AGENT_RUNTIME_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_RUNTIME_PORT ?? "4000");
const aguiUrl = process.env.AGENT_AGUI_URL ?? "http://127.0.0.1:8000/api/agui";
const frappeBaseUrl = process.env.FRAPPE_BASE_URL ?? "http://localhost:8080";
const mintPath = process.env.FRAPPE_MINT_PATH ?? "/api/method/loan_advisory_portal.api.agent.mint_assertion";
const mintTimeoutMs = Number(process.env.FRAPPE_MINT_TIMEOUT_MS ?? "5000");
const basePath = process.env.AGENT_RUNTIME_BASE_PATH ?? "/api/copilotkit";
const agentId = process.env.AGENT_RUNTIME_AGENT_ID ?? "advisory";
const allowedOrigins = (process.env.AGENT_WEB_ORIGINS ?? new URL(frappeBaseUrl).origin)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`AGENT_RUNTIME_PORT must be a TCP port, got ${process.env.AGENT_RUNTIME_PORT}`);
  process.exit(2);
}

if (!Number.isInteger(mintTimeoutMs) || mintTimeoutMs < 100) {
  console.error(`FRAPPE_MINT_TIMEOUT_MS must be an integer >= 100, got ${process.env.FRAPPE_MINT_TIMEOUT_MS}`);
  process.exit(2);
}

try {
  new URL(frappeBaseUrl);
} catch {
  console.error(`FRAPPE_BASE_URL must be an absolute URL, got ${frappeBaseUrl}`);
  process.exit(2);
}

const { listener } = createGateway({ aguiUrl, frappeBaseUrl, mintPath, mintTimeoutMs, basePath, agentId, allowedOrigins });
const server = createServer(listener);

server.listen(port, host, () => {
  console.error(
    `advisory copilot runtime on http://${host}:${port}${basePath} ` +
      `(agent ${agentId} -> ${aguiUrl}; assertions from ${frappeBaseUrl}${mintPath})`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  });
}
