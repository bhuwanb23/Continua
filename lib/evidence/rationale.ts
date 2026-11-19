import type {
  CandidateGap,
  EvidenceBundle,
  EvidenceDeepDive,
  EvidenceSourceDeepDive,
  StructuredRationale,
} from "@/lib/domain";
import { normalizeSpan } from "@/lib/evidence/span-match";
import { locateSpanOffsets } from "@/lib/provenance";
import type { EvidenceVerificationContext } from "./version";
import { EXCERPT_CONTEXT_CHARS } from "./version";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEvidenceDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1] ?? match[2];
  return `${month} ${Number(match[3])}, ${match[1]}`;
}

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => (part.toLowerCase() === "cbc" ? "CBC" : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");
}

function targetLabel(target: string): string {
  if (target === "a1c_or_bmp") return "A1C or BMP";
  if (target === "annual_oncology_followup") return "annual oncology follow-up";
  return titleCase(target);
}

export function verifiedGapTitle(candidate: CandidateGap): string {
  if (candidate.gap_type === "missed_followup") {
    return `Missed ${titleCase(candidate.metadata.specialty)} follow-up`;
  }
  if (candidate.gap_type === "duplicate_test") {
    const label = candidate.metadata.diagnostic_kind === "lab"
      ? titleCase(candidate.identity.test ?? candidate.metadata.normalized_identity.replace(/^lab:/, ""))
      : `${titleCase(candidate.identity.modality ?? "")} ${titleCase(candidate.identity.body_region ?? "")}`.trim();
    return `Possible repeat ${label} within ${candidate.metadata.days_between} days`;
  }
  return `Medication monitoring check for ${titleCase(candidate.metadata.medication)} overdue`;
}

function followupText(candidate: Extract<CandidateGap, { gap_type: "missed_followup" }>, bundle: EvidenceBundle): string {
  const policy = bundle.policy.find((item) => item.policy_id === "referral-window");
  const windowSource = policy?.source === "document_extracted"
    ? "source-defined"
    : "benchmark demo policy";
  return [
    `Referral to ${titleCase(candidate.metadata.specialty)} recorded ${formatEvidenceDate(candidate.metadata.referral_date)}.`,
    `Expected follow-up window: ${candidate.window_days} days (${windowSource}).`,
    `No completed ${candidate.metadata.specialty} consultation was found in the available records by ${formatEvidenceDate(candidate.metadata.due_date)}.`,
  ].join("\n");
}

function duplicateText(candidate: Extract<CandidateGap, { gap_type: "duplicate_test" }>): string {
  const label = candidate.metadata.diagnostic_kind === "lab"
    ? titleCase(candidate.identity.test ?? candidate.metadata.normalized_identity.replace(/^lab:/, ""))
    : `${titleCase(candidate.identity.modality ?? "")} ${titleCase(candidate.identity.body_region ?? "")}`.trim();
  return `Possible repeat ${label} identified ${candidate.metadata.days_between} days apart. Review whether the repeat was intended.`;
}

function monitoringText(candidate: Extract<CandidateGap, { gap_type: "med_monitoring" }>): string {
  return [
    `${titleCase(candidate.metadata.medication)} start recorded ${formatEvidenceDate(candidate.metadata.medication_start_date)}.`,
    `Benchmark demo policy: ${targetLabel(candidate.metadata.monitoring_target)} within ${candidate.metadata.monitoring_window_days} days.`,
    `No qualifying monitoring result was found in the available records by ${formatEvidenceDate(candidate.metadata.due_date)}.`,
  ].join("\n");
}

export function buildStructuredRationale(candidate: CandidateGap, bundle: EvidenceBundle): StructuredRationale {
  const text = candidate.gap_type === "missed_followup"
    ? followupText(candidate, bundle)
    : candidate.gap_type === "duplicate_test"
      ? duplicateText(candidate)
      : monitoringText(candidate);

  return {
    rule: candidate.rationale.rule,
    claims: bundle.claims.map((claim) => ({
      claim: claim.claim,
      ...(claim.value !== undefined ? { value: claim.value } : {}),
      evidence_id: claim.evidence_ids[0] ?? "",
    })),
    text,
  };
}

function excerpt(text: string, quotedSpan: string): string {
  const offsets = locateSpanOffsets(quotedSpan, text);
  if (!offsets) return normalizeSpan(quotedSpan);
  const start = Math.max(0, offsets.span_start - EXCERPT_CONTEXT_CHARS);
  const end = Math.min(text.length, offsets.span_end + EXCERPT_CONTEXT_CHARS);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function normalizationExplanation(candidate: CandidateGap, context: EvidenceVerificationContext, eventId: string): string {
  const event = context.events_by_id.get(eventId);
  if (!event) return "Canonical event unavailable.";
  if (candidate.gap_type === "missed_followup") {
    const raw = event.event_type === "referral"
      ? event.typed.specialty_raw
      : event.event_type === "consult"
        ? event.typed.specialty_raw
        : "specialty";
    return `"${raw}" → ${candidate.metadata.specialty}`;
  }
  if (candidate.gap_type === "duplicate_test") {
    if (event.event_type === "lab_result") {
      return `"${event.typed.test_name_raw}" → ${event.typed.test_code_normalized}`;
    }
    if (event.event_type === "imaging") {
      return `"${event.typed.modality_raw}" + "${event.typed.body_region_raw}" → ${event.typed.modality_normalized}:${event.typed.body_region_normalized ?? event.typed.body_region_raw}`;
    }
    return "Diagnostic identity normalized by the canonical pipeline.";
  }
  if (event.event_type === "medication_start") {
    return `"${event.typed.drug_raw}" → ${event.typed.drug_normalized}`;
  }
  return "Canonical field normalization.";
}

export function buildEvidenceDeepDive(
  candidate: CandidateGap,
  bundle: EvidenceBundle,
  context: EvidenceVerificationContext,
): EvidenceDeepDive {
  const sources: EvidenceSourceDeepDive[] = bundle.positive.map((positive) => {
    const record = context.records_by_id.get(positive.source_doc_id);
    return {
      evidence_id: positive.evidence_id,
      event_id: positive.event_id,
      event_type: positive.event_type,
      source_doc_id: positive.source_doc_id,
      document_type: record?.doc_type ?? "other",
      provider: record?.provider ?? "Unknown",
      document_date: record?.date ?? "",
      quoted_span: positive.quoted_span,
      ...(positive.span_start !== undefined ? { span_start: positive.span_start } : {}),
      ...(positive.span_end !== undefined ? { span_end: positive.span_end } : {}),
      source_text_excerpt: record ? excerpt(record.text, positive.quoted_span) : positive.quoted_span,
      normalization: normalizationExplanation(candidate, context, positive.event_id),
    };
  });

  return {
    sources,
    absence_checks: bundle.absence.map((item) => ({
      evidence_id: item.evidence_id,
      event_types: item.search_definition.event_types,
      normalized_identity: item.search_definition.normalized_identity,
      window_start: item.search_definition.start_date,
      window_end: item.search_definition.end_date,
      matching_event_count: item.matching_event_count,
    })),
    policy_checks: bundle.policy.map((item) => ({
      evidence_id: item.evidence_id,
      policy_id: item.policy_id,
      policy_version: item.policy_version,
      rule: item.rule,
      source: item.source,
      display: item.source === "benchmark_policy"
        ? `Benchmark demo policy: ${item.rule.replace(/_/g, " ")}`
        : `Source-defined policy: ${item.rule.replace(/_/g, " ")}`,
    })),
  };
}
