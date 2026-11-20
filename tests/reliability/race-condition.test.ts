import { describe, expect, it } from "vitest";
import { createLatestRequestGuard } from "@/lib/ui/latest-request";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("UI race safety", () => {
  it("never applies a late response from the previous patient", async () => {
    const guard = createLatestRequestGuard();
    const first = guard.begin();
    const firstLoad = deferred<string>();
    firstLoad.promise.then((value) => {
      if (first.isCurrent()) throw new Error(`stale value applied: ${value}`);
    });

    const second = guard.begin();
    if (first.isCurrent()) throw new Error("previous token still current");
    firstLoad.resolve("previous patient");
    await firstLoad.promise;

    const secondLoad = deferred<string>();
    secondLoad.resolve("current patient");
    await expect(secondLoad.promise).resolves.toBe("current patient");
    expect(second.isCurrent()).toBe(true);
  });

  it("aborts the previous request when a new one begins", () => {
    const guard = createLatestRequestGuard();
    const first = guard.begin();
    expect(first.signal.aborted).toBe(false);
    guard.begin();
    expect(first.signal.aborted).toBe(true);
  });

  it("cancels on navigation away", () => {
    const guard = createLatestRequestGuard();
    const token = guard.begin();
    guard.cancel();
    expect(token.signal.aborted).toBe(true);
    expect(token.isCurrent()).toBe(false);
  });

  it("only treats the newest of ten rapid requests as current", () => {
    const guard = createLatestRequestGuard();
    const tokens = Array.from({ length: 10 }, () => guard.begin());
    expect(tokens.slice(0, -1).every((token) => !token.isCurrent())).toBe(true);
    expect(tokens.at(-1)!.isCurrent()).toBe(true);
    expect(tokens.at(-1)!.signal.aborted).toBe(false);
  });
});
