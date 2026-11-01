import { FALLBACK_VOICE_CONSENT_VERSION, type Literacy, type Locale } from "./types";

/** Whether this site can offer voice, and the notice version its sessions record. */
export interface VoiceAvailability {
  enabled: boolean;
  consentVersion: string;
}

/**
 * Everything the island needs from the page. Rendered server-side by Frappe from the authenticated
 * session: the application is one the borrower owns, and the CSRF token is the one in the page
 * bootstrap too. Nothing here is a credential the island can widen.
 */
export interface AssistantContext {
  application: string;
  /** The signed-in account. Scopes the thread remembered by this tab; never sent as an identity claim. */
  user: string;
  csrfToken: string;
  /** Profile preferences, for display only: the assertion carries the authoritative values. */
  literacy: Literacy;
  locale: Locale;
  voice: VoiceAvailability;
}

const LITERACY: readonly Literacy[] = ["low", "medium", "high"];
const LOCALE: readonly Locale[] = ["en", "hi", "te"];

function readVoice(raw: unknown): VoiceAvailability {
  const value = (raw ?? {}) as { enabled?: unknown; consent_version?: unknown };
  return {
    // Only an explicit `true` enables the panel: a missing block is "not offered", never a guess.
    enabled: value.enabled === true,
    consentVersion:
      typeof value.consent_version === "string" && value.consent_version
        ? value.consent_version
        : FALLBACK_VOICE_CONSENT_VERSION,
  };
}

export function readAssistantContext(doc: Document): AssistantContext {
  const element = doc.getElementById("assistant-context");
  if (!element?.textContent) throw new Error("assistant context missing");

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(element.textContent) as Record<string, unknown>;
  } catch {
    throw new Error("assistant context is not JSON");
  }

  const application = raw.application;
  const user = raw.user;
  const csrfToken = raw.csrf_token;
  if (typeof application !== "string" || !application) throw new Error("assistant context has no application");
  if (typeof user !== "string" || !user) throw new Error("assistant context has no user");
  if (typeof csrfToken !== "string" || !csrfToken) throw new Error("assistant context has no CSRF token");

  const literacy = typeof raw.literacy === "string" && LITERACY.includes(raw.literacy as Literacy) ? (raw.literacy as Literacy) : "medium";
  const locale = typeof raw.locale === "string" && LOCALE.includes(raw.locale as Locale) ? (raw.locale as Locale) : "en";
  return { application, user, csrfToken, literacy, locale, voice: readVoice(raw.voice) };
}
