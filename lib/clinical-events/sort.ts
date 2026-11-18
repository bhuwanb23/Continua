import type { CanonicalClinicalEvent } from "@/lib/domain";

const EVENT_ORDER: Record<CanonicalClinicalEvent["event_type"], number> = {
  surgery: 1,
  referral: 2,
  consult: 3,
  followup: 4,
  lab_result: 5,
  imaging: 6,
  medication_start: 7,
  medication_stop: 8,
};

export function compareClinicalEvents(left: CanonicalClinicalEvent, right: CanonicalClinicalEvent): number {
  const dateOrder = left.date.localeCompare(right.date);
  if (dateOrder !== 0) return dateOrder;
  const precisionOrder = left.date_precision.localeCompare(right.date_precision);
  if (precisionOrder !== 0) return precisionOrder;
  const typeOrder = EVENT_ORDER[left.event_type] - EVENT_ORDER[right.event_type];
  if (typeOrder !== 0) return typeOrder;
  return left.event_id.localeCompare(right.event_id);
}

export function sortClinicalEvents(events: CanonicalClinicalEvent[]): CanonicalClinicalEvent[] {
  return [...events].sort(compareClinicalEvents);
}
