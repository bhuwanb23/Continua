import type { CanonicalClinicalEvent } from "@/lib/domain";
import { eventFingerprint } from "@/lib/clinical-events/fingerprint";

export { eventFingerprint };

export interface FingerprintGroup {
  fingerprint: string;
  events: CanonicalClinicalEvent[];
}

/** Group by the frozen occurrence fingerprint; never by text similarity. */
export function groupByFingerprint(events: CanonicalClinicalEvent[]): FingerprintGroup[] {
  const groups = new Map<string, CanonicalClinicalEvent[]>();
  for (const event of events) {
    const fingerprint = eventFingerprint(event);
    const bucket = groups.get(fingerprint);
    if (bucket) bucket.push(event);
    else groups.set(fingerprint, [event]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fingerprint, grouped]) => ({ fingerprint, events: grouped }));
}