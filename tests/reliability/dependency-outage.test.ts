import { describe, expect, it } from "vitest";
import { expectedStatuses, runCriticalPath } from "./support";

const ENV_KEYS = [
  "LLM_API_KEY",
  "LLM_PROVIDER",
  "LLM_MODEL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

describe("P0 path with every external dependency unavailable", () => {
  it("serves the full judge path with LLM, Supabase, and network disabled", async () => {
    const savedEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));
    const originalFetch = globalThis.fetch;
    for (const key of ENV_KEYS) delete process.env[key];
    globalThis.fetch = (async () => {
      throw new Error("Network is disabled for the P0 outage test.");
    }) as typeof fetch;

    try {
      const result = await runCriticalPath();
      expect(expectedStatuses(result)).toBe(true);
      expect(result.stages).toHaveLength(8);
      expect(result.maria_rank).toBe(27);
    } finally {
      globalThis.fetch = originalFetch;
      for (const [key, value] of savedEnv) {
        if (value !== undefined) process.env[key] = value;
        else delete process.env[key];
      }
    }
  });

  it("keeps DEMO_MODE independent of credentials", async () => {
    const saved = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "true";
    try {
      const result = await runCriticalPath();
      expect(expectedStatuses(result)).toBe(true);
    } finally {
      if (saved === undefined) delete process.env.DEMO_MODE;
      else process.env.DEMO_MODE = saved;
    }
  });
});
