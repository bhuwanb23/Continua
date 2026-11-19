import type { CandidateSeverity, GapType } from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import { maxGapRaw, maxPatientRaw } from "./normalize-score";
import type {
  GapInterventionPriority,
  PatientInterventionPriority,
  PriorityExplanation,
  VerifiedGapForPriority,
  WorkflowPriorityBand,
} from "./types";

export const PRIORITY_DISCLAIMER =
  "Synthetic demo data. Intervention priority orders coordinator workflow only. Not medical advice.";

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "cbc") return "CBC";
      if (lower === "a1c") return "A1C";
      if (lower === "bmp") return "BMP";
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
}

function metadataRecord(gap: VerifiedGapForPriority): Record<string, unknown> {
  return gap.candidate.metadata as unknown as Record<string, unknown>;
}

function metadataString(gap: VerifiedGapForPriority, key: string): string | null {
  const value = metadataRecord(gap)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function metadataNumber(gap: VerifiedGapForPriority, key: string): number | null {
  const value = metadataRecord(gap)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function diagnosticLabel(gap: VerifiedGapForPriority): string {
  const raw = metadataString(gap, "normalized_identity") ?? gap.title;
  const withoutPrefix = raw.replace(/^(lab|imaging):/, "");
  return titleCase(withoutPrefix.replaceAll(":", " "));
}

export function queueHeadline(gap: VerifiedGapForPriority, priority: GapInterventionPriority): string {
  if (gap.gap_type === "duplicate_test") {
    const days = metadataNumber(gap, "days_between");
    return `Possible repeat ${diagnosticLabel(gap)} · ${days ?? "unknown"} days apart`;
  }
  const overdue = priority.breakdown.overdue_days ?? metadataNumber(gap, "overdue_days") ?? 0;
  if (gap.gap_type === "med_monitoring") {
    const medication = titleCase(metadataString(gap, "medication") ?? "medication");
    return `${medication} monitoring appears unresolved · ${overdue} days overdue`;
  }
  const specialty = titleCase(metadataString(gap, "specialty") ?? "specialist");
  return `${specialty} follow-up appears unresolved · ${overdue} days overdue`;
}

function bandRange(band: WorkflowPriorityBand, config: PriorityConfig): string {
  if (band === "P1") return `${config.bands.P1_min}–100`;
  if (band === "P2") return `${config.bands.P2_min}–${config.bands.P1_min - 1}`;
  if (band === "P3") return `${config.bands.P3_min}–${config.bands.P2_min - 1}`;
  if (band === "P4") return `${config.bands.P4_min}–${config.bands.P3_min - 1}`;
  return "0";
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function arithmetic(
  gap: GapInterventionPriority,
  patient: PatientInterventionPriority,
  config: PriorityConfig,
): string {
  const factors = gap.breakdown;
  const gapLine =
    `gap raw = ${formatNumber(factors.severity_weight)} × ${formatNumber(factors.temporal_factor)} × ` +
    `${formatNumber(factors.actionability_weight)} = ${formatNumber(gap.raw_score)}; ` +
    `display = round(100 × ${formatNumber(gap.raw_score)} / ${formatNumber(maxGapRaw(config))}) = ${gap.gap_priority_score}`;
  const aggregation = patient.breakdown;
  const patientLine =
    `patient raw = ${formatNumber(aggregation.top_gap_raw)} + min(` +
    `${formatNumber(aggregation.secondary_factor)} × ${formatNumber(aggregation.secondary_raw_sum)}, ` +
    `${formatNumber(config.secondary_bonus_cap)}) = ${formatNumber(aggregation.patient_raw_score)}; ` +
    `display = round(100 × ${formatNumber(aggregation.patient_raw_score)} / ${formatNumber(maxPatientRaw(config))}) = ` +
    `${patient.patient_priority_score}`;
  return `${gapLine}. ${patientLine}.`;
}

export function explainPatientPriority(
  gap: VerifiedGapForPriority,
  gapPriority: GapInterventionPriority,
  patientPriority: PatientInterventionPriority,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): PriorityExplanation {
  const band = gapPriority.priority_band;
  const daysBetween = gap.gap_type === "duplicate_test" ? metadataNumber(gap, "days_between") : null;
  return {
    why_band: `${band} — this gap scores ${gapPriority.gap_priority_score} in the ${bandRange(band, config)} workflow band.`,
    top_verified_issue: gap.title,
    workflow_severity: gap.severity as CandidateSeverity,
    overdue_days: gapPriority.breakdown.overdue_days,
    days_between: daysBetween,
    action: gap.recommended_coordinator_action,
    other_verified_issues: Math.max(0, patientPriority.breakdown.verified_gap_count - 1),
    factors: gapPriority.breakdown,
    patient_aggregation: patientPriority.breakdown,
    arithmetic: arithmetic(gapPriority, patientPriority, config),
    disclaimer: PRIORITY_DISCLAIMER,
  };
}

export function gapTypeLabel(gapType: GapType): string {
  if (gapType === "missed_followup") return "Missed follow-up";
  if (gapType === "duplicate_test") return "Duplicate test";
  return "Medication monitoring";
}
