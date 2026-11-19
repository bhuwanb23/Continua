import type { AbsenceSearchDefinition } from "@/lib/domain";
import { deterministicId } from "@/lib/ids";

export function positiveEvidenceId(gapId: string, eventId: string, sourceDocId: string): string {
  return deterministicId("evidence-source", gapId, eventId, sourceDocId);
}

export function absenceEvidenceId(gapId: string, definition: AbsenceSearchDefinition): string {
  return deterministicId(
    "evidence-absence",
    gapId,
    definition.event_types.join(","),
    definition.normalized_identity,
    definition.start_date,
    definition.end_date,
  );
}

export function policyEvidenceId(gapId: string, policyId: string): string {
  return deterministicId("evidence-policy", gapId, policyId);
}

export function absenceDefinitionKey(definition: AbsenceSearchDefinition): string {
  return JSON.stringify([
    [...definition.event_types].sort(),
    definition.normalized_identity,
    definition.start_date,
    definition.end_date,
  ]);
}
