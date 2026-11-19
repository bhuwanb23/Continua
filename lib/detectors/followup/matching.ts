import type { CanonicalClinicalEvent, ConsultEvent, FollowupEvent, ReferralEvent } from "@/lib/domain";
import { completionSatisfied, consultEvents, followupEvents, normalizedSpecialty, qualifyingMode } from "../common/events";
import { FOLLOWUP_POLICY } from "./policy";

export function qualifyingCompletions(
  referral: ReferralEvent,
  dueDate: string,
  events: CanonicalClinicalEvent[],
): Array<ConsultEvent | FollowupEvent> {
  const specialty = normalizedSpecialty(referral);
  if (!specialty) return [];
  const candidates = [...consultEvents(events), ...followupEvents(events)];
  return candidates.filter((event) => {
    if (normalizedSpecialty(event) !== specialty) return false;
    if (event.date < referral.date || event.date > dueDate) return false;
    if (!(FOLLOWUP_POLICY.completion_statuses as readonly string[]).includes(
      event.event_type === "consult" ? event.typed.completion_status : event.typed.status,
    )) return false;
    if (!completionSatisfied(event)) return false;
    return qualifyingMode(event) || event.typed.mode === "unknown";
  });
}
