import type { CanonicalClinicalEvent } from "@/lib/domain";
import type { EvidenceFailure } from "./internal-types";
import type { EvidenceVerificationContext } from "./version";

export type OwnershipCheck =
  | { ok: true; event: CanonicalClinicalEvent }
  | { ok: false; failure: EvidenceFailure };

export function verifyEventOwnership(
  eventId: string,
  patientId: string,
  context: EvidenceVerificationContext,
): OwnershipCheck {
  const event = context.events_by_id.get(eventId);
  if (!event) {
    return {
      ok: false,
      failure: {
        code: "EV-003",
        stage: "ownership",
        message: "Cited canonical event does not exist in the supplied event store.",
        event_id: eventId,
      },
    };
  }
  if (event.patient_id !== patientId) {
    return {
      ok: false,
      failure: {
        code: "EV-002",
        stage: "ownership",
        message: "Cited canonical event belongs to a different patient.",
        event_id: eventId,
      },
    };
  }
  return { ok: true, event };
}
