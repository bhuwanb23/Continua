import type { EvidenceFailure, SourceRecord } from "./internal-types";
import type { EvidenceVerificationContext } from "./version";
import { documentContentHash } from "./version";

export type DocumentVerification =
  | { ok: true; record: SourceRecord }
  | { ok: false; failure: EvidenceFailure };

export function verifyDocument(
  sourceDocId: string,
  patientId: string,
  context: EvidenceVerificationContext,
): DocumentVerification {
  const record = context.records_by_id.get(sourceDocId);
  if (!record) {
    return {
      ok: false,
      failure: {
        code: "EV-001",
        stage: "document",
        message: "Source document does not exist in the supplied record set.",
        source_doc_id: sourceDocId,
      },
    };
  }
  if (record.patient_id !== patientId) {
    return {
      ok: false,
      failure: {
        code: "EV-002",
        stage: "ownership",
        message: "Source document belongs to a different patient.",
        source_doc_id: sourceDocId,
      },
    };
  }
  if (record.content_hash && documentContentHash(record.text) !== record.content_hash) {
    return {
      ok: false,
      failure: {
        code: "EV-003",
        stage: "document",
        message: "Source document content does not match its frozen content hash.",
        source_doc_id: sourceDocId,
      },
    };
  }
  return { ok: true, record };
}
