const THREAD_ID = /^[A-Za-z0-9._:-]{1,128}$/;

type Store = Pick<Storage, "getItem" | "setItem">;

function sessionStore(): Store | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function key(user: string, application: string): string {
  return `loan-advisory:thread:${user}:${application}`;
}

/** The stored thread for this account and application, or null when there is none yet. */
export function storedThread(user: string, application: string, store: Store | undefined = sessionStore()): string | null {
  try {
    const existing = store?.getItem(key(user, application));
    if (existing && THREAD_ID.test(existing)) return existing;
  } catch {
    // storage is best effort; a fresh thread keeps the island working
  }
  return null;
}

/**
 * One thread per account per application per tab: a reload resumes the conversation, a different
 * sign-in on a shared device never sees the previous borrower's thread, and switching application
 * always starts a different conversation.
 */
export function threadFor(user: string, application: string, store: Store | undefined = sessionStore()): string {
  return storedThread(user, application, store) ?? newThread(user, application, store);
}

export function newThread(user: string, application: string, store: Store | undefined = sessionStore()): string {
  const id = crypto.randomUUID();
  try {
    store?.setItem(key(user, application), id);
  } catch {
    // ignore: the thread still works for this page load
  }
  return id;
}
