import type { GapType, VerifiedGap } from "@/lib/domain";
import {
  computePanelPriorities,
  computeGapPriority,
  createPriorityContext,
  DEFAULT_PRIORITY_CONFIG,
  type GapInterventionPriority,
  type PriorityPanel,
} from "@/lib/priority";
import { mariaEvidenceSetup } from "./evidence";

export interface MariaPrioritySetup {
  patientId: string;
  gaps: VerifiedGap[];
  panel: PriorityPanel;
  gapPriorities: GapInterventionPriority[];
  eventStoreHash: string;
  evaluationAsOfDate: string;
}

export function mariaPrioritySetup(): MariaPrioritySetup {
  const evidence = mariaEvidenceSetup();
  const patientId = evidence.events[0]?.patient_id;
  if (!patientId) throw new Error("Maria priority fixture has no patient id");
  const gaps = evidence.results
    .map((result) => result.verified_gap)
    .filter((gap): gap is VerifiedGap => gap !== null);
  const eventStoreHash = evidence.context.event_store_hash;
  const evaluationAsOfDate = evidence.context.evaluation_as_of_date;
  const panel = computePanelPriorities({
    patient_ids: [patientId],
    gaps,
    evaluation_as_of_date: evaluationAsOfDate,
    event_store_hash: eventStoreHash,
  });
  return {
    patientId,
    gaps,
    panel,
    gapPriorities: panel.gap_priorities,
    eventStoreHash,
    evaluationAsOfDate,
  };
}

export function verifiedGapOfType(gaps: readonly VerifiedGap[], gapType: GapType): VerifiedGap {
  const gap = gaps.find((item) => item.gap_type === gapType);
  if (!gap) throw new Error(`Missing verified gap type ${gapType}`);
  return gap;
}

export function priorityOfType(
  priorities: readonly GapInterventionPriority[],
  gapType: GapType,
): GapInterventionPriority {
  const priority = priorities.find((item) => item.gap_type === gapType);
  if (!priority) throw new Error(`Missing priority gap type ${gapType}`);
  return priority;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function scoreWith(gaps: VerifiedGap[], patientId: string, eventStoreHash: string, asOf: string) {
  return computePanelPriorities({
    patient_ids: [patientId],
    gaps,
    evaluation_as_of_date: asOf,
    event_store_hash: eventStoreHash,
  });
}

export function gapScore(gap: VerifiedGap, gaps: VerifiedGap[], eventStoreHash: string, asOf: string) {
  const context = createPriorityContext(gaps, {
    evaluation_as_of_date: asOf,
    event_store_hash: eventStoreHash,
    config: DEFAULT_PRIORITY_CONFIG,
  });
  return computeGapPriority(gap, context);
}
