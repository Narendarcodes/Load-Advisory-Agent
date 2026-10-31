import { describe, expect, it } from "vitest";

import { newThread, storedThread, threadFor } from "./thread";

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
