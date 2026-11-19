/**
 * Public priority-v1 contracts.
 *
 * Implementation and factor arithmetic live in `lib/priority`. This module is
 * the domain-facing re-export so repositories, API mappers, and UI types share
 * one definition instead of drifting aliases.
 */
export type {
  ActionabilityClass,
  EligibilityReason,
  GapInterventionPriority,
  GapPriorityBand,
  GapPriorityBreakdown,
  IneligibleGap,
  PatientInterventionPriority,
  PatientPriorityBreakdown,
  PriorityExplanation,
  PriorityFailureCode,
  PriorityPanel,
  PriorityTopGap,
  QueueApiResponse,
  QueueItem,
  TemporalBucket,
  VerifiedGapForPriority,
  WorkflowPriorityBand,
} from "@/lib/priority/types";

export {
  GAP_PRIORITY_BANDS,
  GAP_PRIORITY_SCHEMA_VERSION,
  PATIENT_PRIORITY_SCHEMA_VERSION,
  PRIORITY_FAILURE_CODES,
  PRIORITY_FAILURE_DESCRIPTIONS,
  PRIORITY_PANEL_SCHEMA_VERSION,
  PRIORITY_SCHEMA_VERSION,
  QUEUE_SCHEMA_VERSION,
  WORKFLOW_PRIORITY_BANDS,
} from "@/lib/priority/types";
