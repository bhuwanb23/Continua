import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/lib/domain";
import { extractPatient } from "@/lib/extraction/batch";
import { LlmDocumentExtractor } from "@/lib/extraction/llm-extractor";
import { SYSTEM_PROMPT } from "@/lib/extraction/prompt";
import type { LlmProvider } from "@/lib/extraction/provider";
import { TEST_PATIENT_ID, TEST_SOURCE_DOC_ID } from "../support/clinical-events";

const NEGATION_DOC = TEST_SOURCE_DOC_ID;
const PLANNED_DOC = "00000000-0000-5000-8000-000000000011";
const FAMILY_DOC = "00000000-0000-5000-8000-000000000012";

function makeRecord(sourceDocId: string, docType: SourceRecord["doc_type"], text: string): SourceRecord {
  return {
    source_doc_id: sourceDocId,
    fixture_key: `DOC-${sourceDocId.slice(-2)}`,
    patient_id: TEST_PATIENT_ID,
    doc_type: docType,
    provider: "Dr. Test",
    provider_type: "pcp",
    date: "2026-04-18",
    text,
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

const attackRecords: SourceRecord[] = [
  makeRecord(NEGATION_DOC, "consult_note", "No referral was placed. Patient has not started metformin. No imaging was performed."),
  makeRecord(PLANNED_DOC, "consult_note", "MRI planned next week. Will schedule oncology referral at next visit."),
  makeRecord(FAMILY_DOC, "consult_note", "Mother has breast cancer. Father had colon cancer at age 60."),
];

function documentIdFromPrompt(user: string): string {
  const match = /document_id: (\S+)/.exec(user);
  if (!match?.[1]) throw new Error("Prompt is missing document_id");
  return match[1];
}

describe("negation, planned, and family-history mentions", () => {
  it("the prompt contract instructs omission of non-occurrences", () => {
    expect(SYSTEM_PROMPT).toContain("Planned or future events");
    expect(SYSTEM_PROMPT).toContain("Negated or absent events");
    expect(SYSTEM_PROMPT).toContain("Facts about other people");
    expect(SYSTEM_PROMPT).toContain("omit them");
    expect(SYSTEM_PROMPT).toContain("No referral was placed");
  });

  it("a contract-following model emits nothing for absence, plans, or family history", async () => {
    const provider: LlmProvider = {
      id: "stub",
      model: "stub-model",
      async complete() {
        return {
          text: JSON.stringify({ patient_id: TEST_PATIENT_ID, events: [] }),
          status: 200,
        };
      },
    };
    const result = await extractPatient(new LlmDocumentExtractor(provider), attackRecords);
    expect(result.status).toBe("COMPLETE");
    expect(result.store.accepted).toHaveLength(0);
    expect(result.store.rejected).toHaveLength(0);
  });

  it("fabricated occurrences citing absent spans are rejected whole (CE-006)", async () => {
    const provider: LlmProvider = {
      id: "stub",
      model: "stub-model",
      async complete(req) {
        const documentId = documentIdFromPrompt(req.user);
        return {
          text: JSON.stringify({
            patient_id: TEST_PATIENT_ID,
            events: [
              {
                event_type: "referral",
                date: "2026-04-18",
                description: "Referral to medical oncology",
                source_doc_id: documentId,
                source_span: "Referral to Medical Oncology placed today.",
                specialty_raw: "Medical Oncology",
                status: "placed",
              },
            ],
          }),
          status: 200,
        };
      },
    };
    const result = await extractPatient(new LlmDocumentExtractor(provider), attackRecords);
    expect(result.status).toBe("COMPLETE");
    expect(result.store.accepted).toHaveLength(0);
    expect(result.store.rejected).toHaveLength(3);
    expect(result.store.rejected.every((rejection) => rejection.code === "CE-006")).toBe(true);
  });
});