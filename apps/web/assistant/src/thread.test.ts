import { describe, expect, it } from "vitest";

import { clearThreadPending, newThread, pendingThread, storedThread, threadFor } from "./thread";

const USER = "borrower@example.invalid";

function memoryStore(seed: Record<string, string> = {}): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; values: Record<string, string> } {
  const values = { ...seed };
  return {
    values,
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value;
    },
  };
}

describe("assistant thread", () => {
  it("reuses the stored thread for the same user and application", () => {
    const store = memoryStore({ [`loan-advisory:thread:${USER}:LA-1`]: "thread-1" });
    expect(threadFor(USER, "LA-1", store)).toBe("thread-1");
  });

  it("keeps applications apart", () => {
    const store = memoryStore();
    const first = threadFor(USER, "LA-1", store);
    const second = threadFor(USER, "LA-2", store);
    expect(first).not.toBe(second);
    expect(threadFor(USER, "LA-1", store)).toBe(first);
    expect(threadFor(USER, "LA-2", store)).toBe(second);
  });

  it("does not hand a shared-device tab another borrower's thread", () => {
    const store = memoryStore({ [`loan-advisory:thread:${USER}:LA-1`]: "thread-1" });
    const other = threadFor("someone-else@example.invalid", "LA-1", store);
    expect(other).not.toBe("thread-1");
    expect(threadFor(USER, "LA-1", store)).toBe("thread-1");
  });

  it("replaces a stored value that is not a usable thread id", () => {
    const store = memoryStore({ [`loan-advisory:thread:${USER}:LA-1`]: "<script>" });
    const thread = threadFor(USER, "LA-1", store);
    expect(thread).not.toBe("<script>");
    expect(thread).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(store.values[`loan-advisory:thread:${USER}:LA-1`]).toBe(thread);
  });

  it("returns a fresh thread when storage is unavailable", () => {
    const thread = threadFor(USER, "LA-1", undefined);
    expect(thread).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(newThread(USER, "LA-1", undefined)).not.toBe(thread);
  });

  it("reports a stored thread without creating one", () => {
    const empty = memoryStore();
    expect(storedThread(USER, "LA-1", empty)).toBeNull();
    expect(empty.values).toEqual({});
    const key = `loan-advisory:thread:${USER}:LA-1`;
    expect(storedThread(USER, "LA-1", memoryStore({ [key]: "thread-1" }))).toBe("thread-1");
    expect(storedThread(USER, "LA-1", memoryStore({ [key]: "<script>" }))).toBeNull();
  });
});

describe("pending transcript marker", () => {
  const pendingKey = `loan-advisory:thread:${USER}:LA-1:pending`;

  it("names a thread the moment it is minted", () => {
    const store = memoryStore();
    const thread = threadFor(USER, "LA-1", store);
    expect(pendingThread(USER, "LA-1", store)).toBe(thread);
  });

  it("survives the reload that used to cause a needless 404", () => {
    const store = memoryStore();
    const minted = threadFor(USER, "LA-1", store);
    // A page load hands back the same store; nothing was ever sent to Frappe in between.
    const reloaded = threadFor(USER, "LA-1", store);
    expect(reloaded).toBe(minted);
    expect(pendingThread(USER, "LA-1", store)).toBe(minted);
  });

  it("is released once a turn has been recorded", () => {
    const store = memoryStore();
    const thread = newThread(USER, "LA-1", store);
    clearThreadPending(USER, "LA-1", thread, store);
    expect(pendingThread(USER, "LA-1", store)).toBeNull();
    expect(storedThread(USER, "LA-1", store)).toBe(thread);
  });

  it("keeps the marker of a newer thread when an older turn lands late", () => {
    const store = memoryStore();
    const first = newThread(USER, "LA-1", store);
    const second = newThread(USER, "LA-1", store);
    clearThreadPending(USER, "LA-1", first, store);
    expect(pendingThread(USER, "LA-1", store)).toBe(second);
  });

  it("holds one marker per application", () => {
    const store = memoryStore();
    const first = newThread(USER, "LA-1", store);
    const second = newThread(USER, "LA-2", store);
    expect(pendingThread(USER, "LA-1", store)).toBe(first);
    expect(pendingThread(USER, "LA-2", store)).toBe(second);
    clearThreadPending(USER, "LA-1", first, store);
    expect(pendingThread(USER, "LA-1", store)).toBeNull();
    expect(pendingThread(USER, "LA-2", store)).toBe(second);
  });

  it("works without a usable storage backend", () => {
    const unusable = {
      getItem: () => {
        throw new Error("storage is blocked");
      },
      setItem: () => {
        throw new Error("storage is blocked");
      },
    };
    const thread = newThread(USER, "LA-1", unusable);
    expect(thread).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(pendingThread(USER, "LA-1", unusable)).toBeNull();
    expect(() => clearThreadPending(USER, "LA-1", thread, unusable)).not.toThrow();
  });

  it("ignores a marker that storage no longer holds", () => {
    expect(pendingThread(USER, "LA-1", memoryStore({ [pendingKey]: "" }))).toBeNull();
    expect(pendingThread(USER, "LA-1", memoryStore({ "loan-advisory:thread:someone-else@example.invalid:LA-1:pending": "theirs" }))).toBeNull();
  });
});
