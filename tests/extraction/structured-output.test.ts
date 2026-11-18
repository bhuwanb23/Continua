import { describe, expect, it } from "vitest";
import { gateCandidateResponse } from "@/lib/extraction/candidate-event";
import { createLogger } from "@/lib/logging/logger";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

function validEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_type: "referral",
    date: "2026-03-25",
    description: "Referral to medical oncology",
    source_doc_id: TEST_SOURCE_DOC_ID,
    source_span: "Referral to Medical Oncology.",
    specialty_raw: "Medical Oncology",
    expected_window_days: 45,
    status: "placed",
    ...overrides,
  };
}

function validResponse(events: unknown[] = [validEvent()]): Record<string, unknown> {
  return {
    patient_id: TEST_PATIENT_ID,
    events,
    extraction_metadata: {
      model: "test-model",
      prompt_version: "extraction-prompt-v1",
      request_id: "req-1",
    },
  };
}

function captureLogger() {
  const lines: Array<Record<string, unknown>> = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as Record<string, unknown>), "debug");
  return { logger, lines };
}

describe("gateCandidateResponse", () => {
  it("accepts a valid response and applies schema defaults", () => {
    const result = gateCandidateResponse(validResponse());
    expect(result.envelope_error).toBeNull();
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.confidence).toBe(0.5);
    expect(result.candidates[0]?.mention_context).toBe("unknown");
    expect(result.patient_id).toBe(TEST_PATIENT_ID);
    expect(result.extraction_metadata?.model).toBe("test-model");
  });

  it("strips and logs unsupported keys without rejecting the event", () => {
    const { logger, lines } = captureLogger();
    const response = validResponse([validEvent({ patient_risk: "high", gap_type: "missed_followup" })]);
    response["verdict"] = "gap detected";
    const result = gateCandidateResponse(response, logger);
    expect(result.envelope_error).toBeNull();
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).not.toHaveProperty("patient_risk");
    expect(result.candidates[0]).not.toHaveProperty("gap_type");
    expect(result.stripped_keys).toContain("response.verdict");
    expect(result.stripped_keys).toContain("response.events[0].patient_risk");
    const warnings = lines.filter((line) => line["message"] === "SCHEMA_UNSUPPORTED_KEY");
    expect(warnings.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects an unknown event type but keeps valid siblings", () => {
    const result = gateCandidateResponse(
      validResponse([validEvent({ event_type: "diagnosis" }), validEvent()]),
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.reason).toContain("Unknown event_type");
  });

  it("rejects malformed dates, invalid confidence, and missing spans per event", () => {
    const result = gateCandidateResponse(
      validResponse([
        validEvent({ date: "2026-02-30" }),
        validEvent({ confidence: 1.4 }),
        validEvent({ source_span: "" }),
        validEvent(),
      ]),
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.rejected).toHaveLength(3);
  });

  it("rejects a wrong payload for the declared event type", () => {
    const result = gateCandidateResponse(
      validResponse([validEvent({ event_type: "lab_result" })]),
    );
    expect(result.candidates).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
  });

  it("flags an unusable envelope as a format failure", () => {
    expect(gateCandidateResponse("not json").envelope_error).not.toBeNull();
    expect(gateCandidateResponse({ events: [] }).envelope_error).not.toBeNull();
    expect(gateCandidateResponse({ ...validResponse(), events: "nope" }).envelope_error).not.toBeNull();
    expect(
      gateCandidateResponse({
        ...validResponse(),
        extraction_metadata: { model: "m", prompt_version: "p" },
      }).envelope_error,
    ).not.toBeNull();
  });

  it("strips unsupported metadata keys", () => {
    const response = validResponse();
    (response["extraction_metadata"] as Record<string, unknown>)["cost_usd"] = 0.01;
    const result = gateCandidateResponse(response);
    expect(result.envelope_error).toBeNull();
    expect(result.stripped_keys).toContain("response.extraction_metadata.cost_usd");
  });

  it("accepts an explicit empty event list", () => {
    const result = gateCandidateResponse(validResponse([]));
    expect(result.envelope_error).toBeNull();
    expect(result.candidates).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
  });
});