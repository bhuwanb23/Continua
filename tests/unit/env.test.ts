import { describe, expect, it } from "vitest";
import { loadEnv, requireLlm, toPublicConfig } from "@/lib/config/env";
import { ConfigError } from "@/lib/errors";

describe("T1 demo mode", () => {
  it("boots with no LLM credentials", () => {
    const config = loadEnv({
      NODE_ENV: "test",
      CONTINUA_DEMO_MODE: "true",
    });
    expect(config.demoMode).toBe(true);
    expect(config.llmApiKey).toBeUndefined();
  });

  it("raises a clear ConfigError when a live path needs the LLM", () => {
    const config = loadEnv({ NODE_ENV: "test", CONTINUA_DEMO_MODE: "true" });
    expect(() => requireLlm(config)).toThrow(ConfigError);
    expect(() => requireLlm(config)).toThrow("LLM provider not configured.");
  });

  it("uses the frozen evaluation date by default", () => {
    const config = loadEnv({ NODE_ENV: "test" });
    expect(config.evaluationAsOfDate).toBe("2026-06-05");
  });
});

describe("T6 secret isolation", () => {
  it("never projects server secrets into public config", () => {
    const config = loadEnv({
      NODE_ENV: "test",
      LLM_API_KEY: "sk-super-secret",
      SUPABASE_ANON_KEY: "anon-secret",
    });
    const publicConfig = toPublicConfig(config);
    const serialized = JSON.stringify(publicConfig);
    expect(serialized).not.toContain("sk-super-secret");
    expect(serialized).not.toContain("anon-secret");
    expect(Object.keys(publicConfig)).not.toContain("llmApiKey");
  });
});
