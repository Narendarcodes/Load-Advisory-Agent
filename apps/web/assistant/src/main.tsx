import "./assistant.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

import { readAssistantContext } from "./context";
import { Island } from "./island";

const root = document.getElementById("assistant-root");
if (!root) throw new Error("missing #assistant-root");

const context = readAssistantContext(document);

createRoot(root).render(
  <StrictMode>
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      agentId="advisory"
      // The runtime exchanges this header (plus the Frappe cookie) for a 60-second assertion.
      // Locale and literacy are NOT sent from here: the assertion carries the profile values.
      headers={() => ({ "x-frappe-csrf-token": context.csrfToken })}
      enableInspector={false}
    >
      <Island context={context} />
    </CopilotKitProvider>
  </StrictMode>,
);
