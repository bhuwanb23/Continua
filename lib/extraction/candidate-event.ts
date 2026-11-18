import {
  CANDIDATE_KEYS_BY_TYPE,
  CANDIDATE_METADATA_KEYS,
  CANDIDATE_RESPONSE_KEYS,
  CandidateClinicalEventSchema,
  CandidateExtractionResponseSchema,
  type CandidateClinicalEvent,
  type CandidateExtractionResponse,
} from "@/lib/schemas/candidate-event.schema";
import type { Logger } from "@/lib/logging/logger";

export const CANDIDATE_SCHEMA_VERSION = "candidate-event-v1";

export type { CandidateClinicalEvent, CandidateExtractionResponse };

export interface CandidateRejection {
  candidate: unknown;
  reason: string;
}

export interface CandidateGateResult {
  patient_id: string | null;
  extraction_metadata: CandidateExtractionResponse["extraction_metadata"] | null;
  candidates: CandidateClinicalEvent[];
  rejected: CandidateRejection[];
  stripped_keys: string[];
  /** Non-null when the response envelope itself is unusable (retryable format failure). */
  envelope_error: string | null;
}

function stripUnsupportedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  stripped: string[],
  logger?: Logger,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (allowed.includes(key)) {
      output[key] = item;
    } else {
      const location = `${path}.${key}`;
      stripped.push(location);
      logger?.warn("SCHEMA_UNSUPPORTED_KEY", { key: location });
    }
  }
  return output;
}

/**
 * Runtime schema gate for model output. Unknown keys are stripped and logged;
 * each event is parsed independently so one bad candidate cannot sink a document.
 */
export function gateCandidateResponse(raw: unknown, logger?: Logger): CandidateGateResult {
  const empty: CandidateGateResult = {
    patient_id: null,
    extraction_metadata: null,
    candidates: [],
    rejected: [],
    stripped_keys: [],
    envelope_error: null,
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...empty, envelope_error: "Response must be a JSON object." };
  }

  const stripped: string[] = [];
  const envelope = stripUnsupportedKeys(
    raw as Record<string, unknown>,
    CANDIDATE_RESPONSE_KEYS,
    "response",
    stripped,
    logger,
  );

  const metadataRaw = envelope["extraction_metadata"];
  if (metadataRaw && typeof metadataRaw === "object" && !Array.isArray(metadataRaw)) {
    envelope["extraction_metadata"] = stripUnsupportedKeys(
      metadataRaw as Record<string, unknown>,
      CANDIDATE_METADATA_KEYS,
      "response.extraction_metadata",
      stripped,
      logger,
    );
  }

  const envelopeParse = CandidateExtractionResponseSchema.pick({
    patient_id: true,
    extraction_metadata: true,
  }).safeParse({
    patient_id: envelope["patient_id"],
    extraction_metadata: envelope["extraction_metadata"],
  });
  if (!envelopeParse.success) {
    return {
      ...empty,
      stripped_keys: stripped,
      envelope_error: envelopeParse.error.issues.map((issue) => issue.message).join("; "),
    };
  }
  if (!Array.isArray(envelope["events"])) {
    return { ...empty, stripped_keys: stripped, envelope_error: "Response events must be an array." };
  }

  const candidates: CandidateClinicalEvent[] = [];
  const rejected: CandidateRejection[] = [];
  (envelope["events"] as unknown[]).forEach((event, index) => {
    const path = `response.events[${index}]`;
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      rejected.push({ candidate: event, reason: "Candidate must be an object." });
      return;
    }
    const record = event as Record<string, unknown>;
    const eventType = typeof record["event_type"] === "string" ? record["event_type"] : "";
    const allowed = CANDIDATE_KEYS_BY_TYPE[eventType];
    if (!allowed) {
      rejected.push({ candidate: event, reason: `Unknown event_type "${eventType}".` });
      return;
    }
    const cleaned = stripUnsupportedKeys(record, allowed, path, stripped, logger);
    const parsed = CandidateClinicalEventSchema.safeParse(cleaned);
    if (!parsed.success) {
      rejected.push({
        candidate: event,
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      return;
    }
    candidates.push(parsed.data);
  });

  return {
    patient_id: envelopeParse.data.patient_id,
    extraction_metadata: envelopeParse.data.extraction_metadata,
    candidates,
    rejected,
    stripped_keys: stripped,
    envelope_error: null,
  };
}