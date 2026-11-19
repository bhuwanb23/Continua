import { api } from "@/lib/ui/api";
import { FLAGSHIP_GAP_ID, FLAGSHIP_PATIENT_ID } from "@/lib/demo/flagship";

/**
 * Warm every route the demo touches. Uses the same read-only endpoints the
 * product uses; nothing here mutates cache, ranking, or gap state.
 */
export async function preloadDemo(): Promise<void> {
  await Promise.allSettled([
    api.panel(),
    api.queue("demo", 5),
    api.patient(FLAGSHIP_PATIENT_ID),
    api.timeline(FLAGSHIP_PATIENT_ID),
    api.gaps(FLAGSHIP_PATIENT_ID),
    api.evidence(FLAGSHIP_GAP_ID),
    api.evaluation(),
  ]);
}
