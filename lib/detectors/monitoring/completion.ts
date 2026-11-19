import type { CanonicalClinicalEvent, MedicationStartEvent } from "@/lib/domain";
import { normalizeMedication } from "@/lib/normalization";
import { completionSatisfied, consultEvents, followupEvents, labEvents, normalizedDrug, normalizedLabCode, normalizedSpecialty } from "../common/events";
import type { MonitoringRegistryEntry } from "./registry";

export function monitoringCompleted(
  start: MedicationStartEvent,
  dueDate: string,
  events: CanonicalClinicalEvent[],
  entry: MonitoringRegistryEntry,
): boolean {
  if (entry.completion === "lab") {
    return labEvents(events).some((event) => {
      const code = normalizedLabCode(event);
      return Boolean(code && entry.lab_codes.includes(code) && event.date >= start.date && event.date <= dueDate);
    });
  }

  return [...consultEvents(events), ...followupEvents(events)].some((event) => {
    if (normalizedSpecialty(event) !== "oncology") return false;
    if (!completionSatisfied(event)) return false;
    return event.date >= start.date && event.date <= dueDate;
  });
}

export function medicationStoppedBeforeDue(
  start: MedicationStartEvent,
  dueDate: string,
  events: CanonicalClinicalEvent[],
): boolean {
  const drug = normalizedDrug(start);
  if (!drug) return false;
  return events.some((event) => {
    if (event.event_type !== "medication_stop") return false;
    const stopDrug = normalizeMedication(event.typed.drug_raw) ?? event.typed.drug_normalized.trim().toLowerCase();
    return stopDrug === drug && event.date >= start.date && event.date <= dueDate;
  });
}
