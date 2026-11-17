import { describe, expect, it } from "vitest";
import {
  clinicalEventId,
  deterministicId,
  documentId,
  patientId,
} from "@/lib/ids";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("T3 deterministic ids", () => {
  it("produces the same id for the same inputs", () => {
    const a = patientId("P-001-maria");
    const b = patientId("P-001-maria");
    expect(a).toBe(b);
  });

  it("produces different ids for different inputs", () => {
    expect(patientId("P-001-maria")).not.toBe(patientId("P-002-james"));
  });

  it("is UUID v5 shaped", () => {
    expect(patientId("P-001-maria")).toMatch(UUID_RE);
    expect(documentId("R4")).toMatch(UUID_RE);
  });

  it("keeps fixture keys separate from machine ids", () => {
    const id = patientId("P-001-maria");
    expect(id).not.toBe("P-001-maria");
  });

  it("is stable for event identities", () => {
    const input = {
      patientId: patientId("P-001-maria"),
      sourceDocId: documentId("R4"),
      eventType: "referral",
      date: "2026-03-25",
    };
    expect(clinicalEventId(input)).toBe(clinicalEventId(input));
  });

  it("rejects empty parts", () => {
    expect(() => deterministicId("patient", "")).toThrow();
  });
});
