import { createHash } from "node:crypto";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { sortClinicalEvents } from "./sort";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export function serializeClinicalEvents(events: CanonicalClinicalEvent[]): string {
  return JSON.stringify(stableValue(sortClinicalEvents(events)));
}

export function hashClinicalEvents(events: CanonicalClinicalEvent[]): string {
  return createHash("sha256").update(serializeClinicalEvents(events)).digest("hex");
}
