import { describe, expect, it } from "vitest";
import { locateSpanOffsets, verifyProvenance } from "@/lib/provenance";
import { normalizeSpan } from "@/lib/evidence/span-match";
import type { SourceRecord } from "@/lib/domain";

const PATIENT = "patient-1";
const DOC = "doc-1";

function record(text: string, patientId = PATIENT): SourceRecord {
  return {
    source_doc_id: DOC,
    fixture_key: "DOC-1",
    patient_id: patientId,
    doc_type: "referral",
    provider: "Dr. Test",
    provider_type: "specialist",
    date: "2026-04-18",
    text,
    dataset_version: "continua-synth-v1",
    generator_version: "generator-v1",
    synthetic: true,
  };
}

function context(text: string, patientId = PATIENT) {
  return { patient_id: PATIENT, records: [record(text, patientId)] };
}

function candidate(sourceSpan: string, extra: Record<string, unknown> = {}) {
  return { source_doc_id: DOC, patient_id: PATIENT, source_span: sourceSpan, ...extra };
}

describe("provenance verification", () => {
  it("accepts exact spans with score 1 and server-computed raw offsets", () => {
    const text = "Assessment: stable. Referral to Medical Oncology. Follow up in 45 days.";
    const result = verifyProvenance(candidate("Referral to Medical Oncology."), context(text));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.verification_method).toBe("exact");
    expect(result.source.verification_score).toBe(1);
    const start = text.indexOf("Referral to Medical Oncology.");
    expect(result.source.span_start).toBe(start);
    expect(result.source.span_end).toBe(start + "Referral to Medical Oncology.".length);
    expect(text.slice(result.source.span_start, result.source.span_end)).toBe("Referral to Medical Oncology.");
  });

  it("rejects missing documents and cross-patient ownership", () => {
    const missing = verifyProvenance(candidate("Anything."), { patient_id: PATIENT, records: [] });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("CE-004");

    const crossPatient = verifyProvenance(candidate("Referral."), context("Referral.", "patient-2"));
    expect(crossPatient.ok).toBe(false);
    if (!crossPatient.ok) expect(crossPatient.code).toBe("CE-005");
  });

  it("rejects semantic paraphrase and unsupported spans entirely", () => {
    const text = "Referral to Medical Oncology.";
    const result = verifyProvenance(candidate("The patient was sent to a cancer specialist."), context(text));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CE-006");
  });

  it("accepts small fuzzy differences with a measured score and no offsets", () => {
    const text = "Referral to Medical Oncology.";
    const result = verifyProvenance(candidate("Referral to Medical Onclogy."), context(text));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.verification_method).toBe("fuzzy");
    expect(result.source.verification_score).toBeGreaterThanOrEqual(0.85);
    expect(result.source.verification_score).toBeLessThan(1);
    expect(result.source.span_start).toBeUndefined();
    expect(result.source.span_end).toBeUndefined();
  });

  it("rejects model offsets that do not contain the span", () => {
    const text = "CBC normal. Later: CBC normal.";
    const wrong = verifyProvenance(
      candidate("CBC normal.", { span_start: 0, span_end: 5 }),
      context(text),
    );
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.code).toBe("CE-006");

    const outOfRange = verifyProvenance(
      candidate("CBC normal.", { span_start: 0, span_end: 999 }),
      context(text),
    );
    expect(outOfRange.ok).toBe(false);
    if (!outOfRange.ok) expect(outOfRange.code).toBe("CE-006");
  });

  it("recomputes offsets server-side even when model offsets are plausible", () => {
    const text = "CBC normal. Later: CBC normal.";
    const second = text.lastIndexOf("CBC normal.");
    const result = verifyProvenance(
      candidate("CBC normal.", { span_start: second, span_end: second + "CBC normal.".length }),
      context(text),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.span_start).toBe(0);
    expect(result.source.span_end).toBe("CBC normal.".length);
  });
});

describe("span offset localization", () => {
  it("maps CRLF-normalized spans back to raw offsets", () => {
    const text = "Line one.\r\nReferral to oncology.";
    const offsets = locateSpanOffsets("one.\nReferral", text);
    expect(offsets).toBeDefined();
    expect(text.slice(offsets?.span_start, offsets?.span_end)).toBe("one.\r\nReferral");
  });

  it("maps curly quotes back to raw offsets", () => {
    const text = "Provider said \u2018start chemo\u2019 today.";
    const offsets = locateSpanOffsets("'start chemo'", text);
    expect(offsets).toBeDefined();
    expect(text.slice(offsets?.span_start, offsets?.span_end)).toBe("\u2018start chemo\u2019");
  });

  it("maps collapsed whitespace back to raw offsets", () => {
    const text = "Referral  to\tMedical Oncology.";
    const offsets = locateSpanOffsets("Referral to Medical Oncology.", text);
    expect(offsets).toBeDefined();
    const slice = text.slice(offsets?.span_start, offsets?.span_end);
    expect(normalizeSpan(slice)).toBe(normalizeSpan("Referral to Medical Oncology."));
    expect(slice).toBe(text);
  });

  it("handles unicode case folding without corrupting offsets", () => {
    const text = "PLAN: CAFÉ review with Dr. Nuñez.";
    const offsets = locateSpanOffsets("café review", text);
    expect(offsets).toBeDefined();
    expect(text.slice(offsets?.span_start, offsets?.span_end)).toBe("CAFÉ review");
  });

  it("returns undefined for unlocatable and fuzzy spans", () => {
    expect(locateSpanOffsets("Referral to Medical Onclogy.", "Referral to Medical Oncology.")).toBeUndefined();
    expect(locateSpanOffsets("", "Some text.")).toBeUndefined();
    expect(locateSpanOffsets("Absent fact.", "Some text.")).toBeUndefined();
  });
});