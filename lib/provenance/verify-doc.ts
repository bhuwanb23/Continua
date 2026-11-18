import type { SourceRecord } from "@/lib/domain";
import type { ProvenanceContext } from "./types";

export type DocumentCheck =
  | { ok: true; record: SourceRecord }
  | { ok: false; code: "CE-004" | "CE-005"; reason: string };

export function verifySourceDocument(
  input: { source_doc_id: string; patient_id: string },
  context: ProvenanceContext,
): DocumentCheck {
  const record = context.records.find((item) => item.source_doc_id === input.source_doc_id);
  if (!record) {
    return { ok: false, code: "CE-004", reason: "Source document does not exist." };
  }
  if (record.patient_id !== input.patient_id || input.patient_id !== context.patient_id) {
    return {
      ok: false,
      code: "CE-005",
      reason: "Source document or event belongs to another patient.",
    };
  }
  return { ok: true, record };
}