import type { CanonicalClinicalEvent, MentionContext } from "@/lib/domain";

export function mentionContextOf(event: CanonicalClinicalEvent): MentionContext {
  return event.mention_context ?? "unknown";
}

/**
 * Result-value identity for the copied-text rule. The fingerprint already
 * carries normalized keys and lab/imaging values; requiring the full typed
 * payload to match keeps `unknown` merges strictly conservative.
 */
export function typedIdentity(event: CanonicalClinicalEvent): string {
  return JSON.stringify(event.typed);
}