import { describe, expect, it } from "vitest";
import {
  InMemoryGapRepository,
  InMemoryPatientRepository,
  InMemoryRecordRepository,
} from "@/lib/repositories/in-memory";
import type { Gap, Patient, SourceRecord } from "@/lib/domain";
import { deterministicId } from "@/lib/ids";

const patient: Patient = {
  patient_id: deterministicId("patient", "P-001-maria"),
  fixture_key: "P-001-maria",
  name: "Maria Chen",
  age: 54,
  sex: "F",
  primary_diagnosis: "Breast cancer — post-surgical",
  last_contact_date: "2026-04-28",
};

const record: SourceRecord = {
  source_doc_id: deterministicId("document", "R4"),
  fixture_key: "R4",
  patient_id: patient.patient_id,
  doc_type: "referral",
  provider: "Dr. A. Patel",
  provider_type: "pcp",
  date: "2026-03-25",
  text: "Referral to Medical Oncology.",
  dataset_version: "continua-synth-v1",
  generator_version: "generator-v1",
  synthetic: true,
};

const gap: Gap = {
  gap_id: deterministicId("gap", "maria-missed-followup"),
  patient_id: patient.patient_id,
  gap_type: "missed_followup",
  severity: "high",
  title: "Missed oncology follow-up",
  trigger_event_ids: [deterministicId("event", "r4")],
  window_days: 45,
  overdue_days: 27,
  evidence: [
    {
      doc_id: record.source_doc_id,
      quoted_span: "Referral to Medical Oncology.",
      event_id: deterministicId("event", "r4"),
    },
  ],
  recommended_coordinator_action: "Verify: contact patient.",
  estimated_impact: "Recovered referral (1)",
  priority_band: "CRITICAL",
  gap_priority_score: 70,
  confidence: 0.96,
  detector_version: "referral_engine_v1",
  grounded: true,
};

describe("repository abstractions", () => {
  it("finds a patient by id", async () => {
    const repo = new InMemoryPatientRepository([patient]);
    await expect(repo.getById(patient.patient_id)).resolves.toEqual(patient);
  });

  it("returns null for an unknown patient", async () => {
    const repo = new InMemoryPatientRepository([patient]);
    await expect(repo.getById("missing")).resolves.toBeNull();
  });

  it("filters records by patient", async () => {
    const repo = new InMemoryRecordRepository([record]);
    await expect(repo.listByPatient(patient.patient_id)).resolves.toHaveLength(1);
    await expect(repo.listByPatient("other")).resolves.toHaveLength(0);
  });

  it("filters gaps by patient", async () => {
    const repo = new InMemoryGapRepository([gap]);
    await expect(repo.listByPatient(patient.patient_id)).resolves.toHaveLength(1);
  });
});
