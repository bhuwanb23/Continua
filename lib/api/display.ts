import type { AbsenceDeepDive, GapType, VerifiedGap } from "@/lib/domain";
import { PRIORITY_LABELS } from "./dto";

const MAX_SUMMARY = 400;
const MAX_EXCERPT = 400;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncate(value: string, max: number): string {
  const normalized = normalizeWhitespace(value);
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

/** Short, non-sensational display titles derived from the stored gap title. */
export function gapDisplayTitle(gapType: GapType, title: string): string {
  if (gapType === "missed_followup") {
    const specialty = /missed\s+(.+?)\s+follow-up/i.exec(title)?.[1];
    return specialty ? `${titleCase(specialty)} follow-up unresolved` : "Follow-up unresolved";
  }
  if (gapType === "duplicate_test") {
    const testName = /^possible repeat\s+(.+?)(?:\s+within|$)/i.exec(title)?.[1];
    return testName ? `Possible repeat ${testName.toUpperCase()}` : "Possible repeat test";
  }
  const subject = /check for\s+(.+?)\s+overdue/i.exec(title)?.[1];
  return subject ? `${titleCase(subject)} monitoring unresolved` : "Monitoring unresolved";
}

export function gapSummary(gap: VerifiedGap): string {
  return truncate(gap.explanation, MAX_SUMMARY);
}

export function absenceDescription(check: AbsenceDeepDive): string {
  const types = check.event_types.map((type) => type.replaceAll("_", " ")).join(" or ");
  const identity = check.normalized_identity.replace(/^[a-z_]+:/i, "").replaceAll("|", " or ");
  return `No matching ${types} for ${identity} within the verification window`;
}

export function sourceExcerpt(excerpt: string): string {
  return truncate(excerpt, MAX_EXCERPT);
}

export type PriorityLabel = (typeof PRIORITY_LABELS)[keyof typeof PRIORITY_LABELS];

export function priorityLabel(band: keyof typeof PRIORITY_LABELS): PriorityLabel {
  return PRIORITY_LABELS[band];
}

function titleCase(value: string): string {
  const trimmed = value.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
