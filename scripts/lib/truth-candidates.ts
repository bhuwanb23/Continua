import type { LegacyClinicalEvent } from "@/lib/domain";
import {
  CandidateClinicalEventSchema,
  type CandidateClinicalEvent,
} from "@/lib/schemas/candidate-event.schema";

export interface TruthCandidateConversion {
  fixtures: Record<string, CandidateClinicalEvent[]>;
  skipped: Array<{ event_id: string; reason: string }>;
}

function stringField(...values: unknown[]): string | undefined {
  const value = values.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof value === "string" ? value : undefined;
}

function typedPayload(event: LegacyClinicalEvent): Record<string, unknown> | null {
  const typed = event.typed ?? {};
  switch (event.event_type) {
    case "referral": {
      const specialty = stringField(typed["specialty"], event.specialty);
      if (!specialty) return null;
      const window = typed["expected_window_days"] ?? event.window_days;
      return {
        event_type: "referral",
        specialty_raw: specialty,
        reason: stringField(typed["reason"]),
        ...(typeof window === "number" ? { expected_window_days: window } : {}),
        status: stringField(typed["status"]) ?? "unknown",
      };
    }
    case "consult": {
      const specialty = stringField(typed["specialty"], event.specialty);
      if (!specialty) return null;
      return {
        event_type: "consult",
        specialty_raw: specialty,
        clinician: stringField(typed["clinician"]),
        mode: stringField(typed["mode"]) ?? "unknown",
        completion_status:
          typed["completed"] === true ? "completed" : (stringField(typed["completion_status"]) ?? "unknown"),
      };
    }
    case "followup":
      return {
        event_type: "followup",
        topic: stringField(typed["topic"]),
        // Mirrors the legacy adapter: followup specialty comes only from typed.
        specialty_raw: stringField(typed["specialty"]),
        mode: stringField(typed["mode"]) ?? "unknown",
        status: stringField(typed["status"]) ?? "unknown",
      };
    case "lab_result": {
      const testName = stringField(typed["test_name_raw"], typed["test_name_normalized"]);
      if (!testName) return null;
      return {
        event_type: "lab_result",
        test_name_raw: testName,
        value: typed["value"] as number | string | null | undefined,
        unit: typed["unit"] as string | null | undefined,
        abnormal: typed["abnormal"] as boolean | null | undefined,
        series_status: event.series_status,
      };
    }
    case "imaging": {
      const modality = stringField(typed["modality"], typed["modality_normalized"]);
      const bodyRegion = stringField(typed["body_region"], typed["body_region_normalized"]);
      if (!modality || !bodyRegion) return null;
      return {
        event_type: "imaging",
        modality_raw: modality,
        body_region_raw: bodyRegion,
        result_summary: stringField(typed["result_summary"]),
        series_status: event.series_status,
      };
    }
    case "medication_start": {
      const drug = stringField(typed["drug_raw"], typed["drug_normalized"]);
      if (!drug) return null;
      return {
        event_type: "medication_start",
        drug_raw: drug,
        dose: typed["dose"] as string | null | undefined,
        route: typed["route"] as string | null | undefined,
        reason: typed["reason"] as string | null | undefined,
      };
    }
    case "medication_stop": {
      const drug = stringField(typed["drug_raw"], typed["drug_normalized"]);
      if (!drug) return null;
      return {
        event_type: "medication_stop",
        drug_raw: drug,
        stop_reason: typed["stop_reason"] as string | null | undefined,
      };
    }
    case "surgery": {
      const procedure = stringField(typed["procedure"], typed["procedure_normalized"]);
      if (!procedure) return null;
      return {
        event_type: "surgery",
        procedure_raw: procedure,
        site: stringField(typed["site"]),
        outcome_summary: stringField(typed["outcome"], typed["outcome_summary"]),
      };
    }
    default:
      return null;
  }
}

/**
 * Script-layer conversion of truth events into fixture candidates. Lives in
 * scripts/ (never lib/extraction) so the extractor stays truth-blind (Gate I).
 */
export function truthEventsToCandidates(events: LegacyClinicalEvent[]): TruthCandidateConversion {
  const fixtures: Record<string, CandidateClinicalEvent[]> = {};
  const skipped: Array<{ event_id: string; reason: string }> = [];
  for (const event of events) {
    const payload = typedPayload(event);
    if (!payload) {
      skipped.push({ event_id: event.event_id, reason: "Missing required raw fields for candidate conversion." });
      continue;
    }
    const parsed = CandidateClinicalEventSchema.safeParse({
      ...payload,
      date: event.date,
      ...(event.date_precision ? { date_precision: event.date_precision } : {}),
      description: event.description,
      provider_display: event.provider,
      provider_type: event.provider_type,
      source_doc_id: event.source_doc_id,
      source_span: event.source_span,
      confidence: Math.min(1, Math.max(0, event.confidence)),
      mention_context: "contemporaneous",
    });
    if (!parsed.success) {
      skipped.push({
        event_id: event.event_id,
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      continue;
    }
    const bucket = fixtures[event.source_doc_id] ?? [];
    bucket.push(parsed.data);
    fixtures[event.source_doc_id] = bucket;
  }
  return { fixtures, skipped };
}