import { describe, expect, it } from "vitest";

import { readAssistantContext } from "./context";

function withBootstrap(payload: Record<string, unknown> | string): Document {
  document.body.innerHTML = `<script id="assistant-context" type="application/json">${
    typeof payload === "string" ? payload : JSON.stringify(payload)
  }</script>`;
  return document;
}

const BASE = { application: "LA-2026-00001", user: "borrower@example.invalid", csrf_token: "csrf-abc" };

describe("readAssistantContext", () => {
  it("reads the account, application, CSRF token and profile preferences", () => {
    const doc = withBootstrap({ ...BASE, literacy: "low", locale: "te" });
    expect(readAssistantContext(doc)).toEqual({
      application: "LA-2026-00001",
      user: "borrower@example.invalid",
      csrfToken: "csrf-abc",
      literacy: "low",
      locale: "te",
      voice: { enabled: false, consentVersion: "voice-consent/1" },
    });
  });

  it("offers voice only when the page says the site is configured", () => {
    const doc = withBootstrap({ ...BASE, voice: { enabled: true, consent_version: "voice-consent/2" } });
    expect(readAssistantContext(doc).voice).toEqual({ enabled: true, consentVersion: "voice-consent/2" });
  });

  it("never infers voice from a malformed block", () => {
    const doc = withBootstrap({ ...BASE, voice: { enabled: "yes" } });
    expect(readAssistantContext(doc).voice).toEqual({ enabled: false, consentVersion: "voice-consent/1" });
  });

  it("falls back to the agent vocabulary for unknown preferences", () => {
    const doc = withBootstrap({ ...BASE, literacy: "verbose", locale: "fr" });
    expect(readAssistantContext(doc)).toMatchObject({ literacy: "medium", locale: "en" });
  });

  it("refuses a context without an account, application or CSRF token", () => {
    expect(() => readAssistantContext(withBootstrap({ csrf_token: "csrf", user: "u" }))).toThrow(/application/);
    expect(() => readAssistantContext(withBootstrap({ application: "LA-1", csrf_token: "csrf" }))).toThrow(/user/);
    expect(() => readAssistantContext(withBootstrap({ application: "LA-1", user: "u" }))).toThrow(/CSRF/);
    expect(() => readAssistantContext(withBootstrap("not json"))).toThrow(/JSON/);
  });

  it("refuses a page with no context element at all", () => {
    document.body.innerHTML = "";
    expect(() => readAssistantContext(document)).toThrow(/missing/);
  });
});
