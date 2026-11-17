import { createHash } from "node:crypto";

/**
 * Derive a stable UUID (v5 layout) from ordered input parts.
 * Same parts → same identifier, on every machine, forever.
 */
export function deterministicId(...parts: string[]): string {
  if (parts.length === 0 || parts.some((part) => part.length === 0)) {
    throw new Error("deterministicId requires non-empty parts");
  }
  const hex = createHash("sha256").update(parts.join("|")).digest("hex");
  const chars = hex.slice(0, 32).split("");
  // Version 5
  chars[12] = "5";
  // Variant 10xx
  const variant = parseInt(chars[16] ?? "0", 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);
  const s = chars.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(
    16,
    20,
  )}-${s.slice(20, 32)}`;
}

export function patientId(fixtureKey: string): string {
  return deterministicId("patient", fixtureKey);
}

export function documentId(fixtureKey: string): string {
  return deterministicId("document", fixtureKey);
}

export function clinicalEventId(input: {
  patientId: string;
  sourceDocId: string;
  eventType: string;
  date: string;
}): string {
  return deterministicId(
    "event",
    input.patientId,
    input.sourceDocId,
    input.eventType,
    input.date,
  );
}
