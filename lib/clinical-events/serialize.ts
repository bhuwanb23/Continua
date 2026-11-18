import { createHash } from "node:crypto";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { sortClinicalEvents } from "./sort";

export function serializeClinicalEvents(events: CanonicalClinicalEvent[]): string {
  return JSON.stringify(sortClinicalEvents(events));
}

export function hashClinicalEvents(events: CanonicalClinicalEvent[]): string {
  return createHash("sha256").update(serializeClinicalEvents(events)).digest("hex");
}
