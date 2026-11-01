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

/** Key of the marker naming the thread this tab minted but has never used; empty means none. */
function pendingKey(user: string, application: string): string {
  return `${key(user, application)}:pending`;
}

function read(store: Store | undefined, k: string): string | null {
  try {
    const value = store?.getItem(k);
    return value ? value : null;
  } catch {
    return null;
  }
}

function write(store: Store | undefined, k: string, value: string): void {
  try {
    store?.setItem(k, value);
  } catch {
    // storage is best effort
  }
}

/** The stored thread for this account and application, or null when there is none yet. */
export function storedThread(user: string, application: string, store: Store | undefined = sessionStore()): string | null {
  const existing = read(store, key(user, application));
  return existing && THREAD_ID.test(existing) ? existing : null;
}

/**
 * A thread id this tab minted that no completed turn has confirmed. Frappe only stores transcript
 * rows when a turn is recorded, so a pending thread has nothing to restore — asking for its
 * messages is a guaranteed 404. The marker outlives the page load, which is what makes a reload of
 * a not-yet-used thread safe.
 */
export function pendingThread(user: string, application: string, store: Store | undefined = sessionStore()): string | null {
  return read(store, pendingKey(user, application));
}

/** Clears the marker only when it still names this thread; a newer thread must stay pending. */
export function clearThreadPending(user: string, application: string, threadId: string, store: Store | undefined = sessionStore()): void {
  if (pendingThread(user, application, store) === threadId) write(store, pendingKey(user, application), "");
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
  write(store, key(user, application), id);
  write(store, pendingKey(user, application), id);
  return id;
}
