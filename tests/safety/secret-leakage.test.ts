import { describe, expect, it } from "vitest";
import { createLogger, type LogSink } from "@/lib/logging/logger";
import { redactFields, redactText, isSensitiveKey } from "@/lib/safety/redaction";
import { scanSecrets } from "../../scripts/lib/safety-audits";

describe("secret leakage controls", () => {
  it("redacts secret-named fields at any depth", () => {
    const redacted = redactFields({
      request_id: "req_1",
      api_key: "sk-live-abc", // safety-allow
      nested: { authorization: "Bearer abcdefghijklmnopqrstuvwxyz", patient_id: "p1" }, // safety-allow
    });
    expect(redacted.api_key).toBe("[REDACTED]");
    expect(JSON.stringify(redacted.nested)).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(isSensitiveKey("client_secret")).toBe(true);
    expect(isSensitiveKey("patient_id")).toBe(false);
  });

  it("redacts direct identifiers in free text", () => {
    const text = redactText("SSN 123-45-6789, MRN 448291, call 555-123-4567 or a@example.com, DOB 03/14/1972");
    expect(text).not.toContain("123-45-6789");
    expect(text).not.toContain("448291");
    expect(text).not.toContain("555-123-4567");
    expect(text).not.toContain("a@example.com");
    expect(text).not.toContain("03/14/1972");
    expect(text).toContain("[REDACTED-SSN]");
  });

  it("keeps identifiers out of logger output", () => {
    let captured = "";
    const sink: LogSink = (line) => {
      captured += line;
    };
    const logger = createLogger(sink, "debug");
    logger.info("evidence loaded", {
      request_id: "req_2",
      api_key: "sk-live-secret", // safety-allow
      note: "patient email a@example.com",
      nested: { token: "tok_12345678901234567890" }, // safety-allow
    });
    expect(captured).not.toContain("sk-live-secret");
    expect(captured).not.toContain("a@example.com");
    expect(captured).not.toContain("tok_12345678901234567890");
    expect(captured).toContain("req_2");
  });

  it("finds no committed secrets or tracked env files", () => {
    const scan = scanSecrets();
    expect(scan.findings).toEqual([]);
  });
});
