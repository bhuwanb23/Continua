import { describe, expect, it } from "vitest";
import { generateDataset, deriveGaps } from "@/lib/generator";
import { addDays, daysBetween } from "@/lib/generator/dates";
import { EVALUATION_AS_OF_DATE } from "@/lib/generator/config";

const dataset = generateDataset();
const eventsByPatient = new Map<string, typeof dataset.truthEvents>();
for (const event of dataset.truthEvents) {
  const list = eventsByPatient.get(event.patient_id) ?? [];
  list.push(event);
  eventsByPatient.set(event.patient_id, list);
}

function patientForScenario(scenario: string): string {
  const entry = dataset.negativeManifest.find((candidate) => candidate.scenario_id === scenario);
  if (!entry) throw new Error(`Missing negative scenario ${scenario}`);
  return entry.patient_id;
}

describe("adversarial negatives", () => {
  it("declares every negative as no_gap", () => {
    expect(dataset.negativeManifest.length).toBeGreaterThanOrEqual(10);
    for (const entry of dataset.negativeManifest) expect(entry.expected).toBe("no_gap");
  });

  it("derives zero gaps for every declared negative patient", () => {
    for (const entry of dataset.negativeManifest) {
      const events = eventsByPatient.get(entry.patient_id) ?? [];
      expect(deriveGaps(events), `${entry.scenario_id}`).toHaveLength(0);
    }
  });

  it("HN-01 completes the referral inside the window", () => {
    const patientId = patientForScenario("HN-01");
    const events = eventsByPatient.get(patientId) ?? [];
    const referral = events.find((event) => event.event_type === "referral");
    const consult = events.find((event) => event.event_type === "consult");
    expect(referral && consult).toBeTruthy();
    if (referral && consult) {
      expect(daysBetween(referral.date, consult.date)).toBeLessThanOrEqual(Number(referral.window_days));
    }
  });

  it("HN-03 has a referral whose window has not elapsed", () => {
    const patientId = patientForScenario("HN-03");
    const referral = (eventsByPatient.get(patientId) ?? []).find((event) => event.event_type === "referral");
    expect(referral).toBeDefined();
    if (referral) {
      const due = addDays(referral.date, Number(referral.window_days));
      expect(due > EVALUATION_AS_OF_DATE).toBe(true);
    }
  });

  it("HN-04 completes through a telehealth consult", () => {
    const patientId = patientForScenario("HN-04");
    const consult = (eventsByPatient.get(patientId) ?? []).find(
      (event) => event.event_type === "consult" && event.provider_type === "specialist",
    );
    expect(consult?.series_status).toBe("unknown");
    expect(dataset.records.find((record) => record.source_doc_id === consult?.source_doc_id)?.text).toContain(
      "telehealth",
    );
  });

  it("HN-05 marks an explicit serial CBC plan", () => {
    const patientId = patientForScenario("HN-05");
    const events = eventsByPatient.get(patientId) ?? [];
    const labs = events.filter(
      (event) => event.event_type === "lab_result" && event.typed["test_name_normalized"] === "cbc",
    );
    expect(labs.length).toBeGreaterThanOrEqual(3);
    for (const lab of labs) expect(lab.series_status).toBe("explicit_series");
  });

  it("HN-06 keeps the repeat outside the duplicate window", () => {
    const patientId = patientForScenario("HN-06");
    const labs = (eventsByPatient.get(patientId) ?? []).filter(
      (event) => event.event_type === "lab_result" && event.typed["test_name_normalized"] === "cbc",
    );
    expect(labs).toHaveLength(2);
    const dates = labs.map((lab) => lab.date).sort();
    if (dates[0] && dates[1]) expect(daysBetween(dates[0], dates[1])).toBeGreaterThan(14);
  });

  it("HN-07 uses different imaging regions", () => {
    const patientId = patientForScenario("HN-07");
    const regions = (eventsByPatient.get(patientId) ?? [])
      .filter((event) => event.event_type === "imaging")
      .map((event) => event.typed["body_region"]);
    expect(new Set(regions).size).toBe(2);
  });

  it("HN-08 stops the medication before the window closes", () => {
    const patientId = patientForScenario("HN-08");
    const events = eventsByPatient.get(patientId) ?? [];
    expect(events.some((event) => event.event_type === "medication_stop")).toBe(true);
  });

  it("HN-09 completes monitoring through an alias", () => {
    const patientId = patientForScenario("HN-09");
    const labs = (eventsByPatient.get(patientId) ?? []).filter((event) => event.event_type === "lab_result");
    expect(labs.some((event) => event.typed["test_name_normalized"] === "a1c")).toBe(true);
  });

  it("HN-10 completes monitoring one day before the deadline", () => {
    const patientId = patientForScenario("HN-10");
    const events = eventsByPatient.get(patientId) ?? [];
    const start = events.find((event) => event.event_type === "medication_start");
    const lab = events.find(
      (event) => event.event_type === "lab_result" && event.typed["test_name_normalized"] === "a1c",
    );
    expect(start && lab).toBeTruthy();
    if (start && lab) expect(daysBetween(start.date, lab.date)).toBe(89);
  });

  it("HN-12 duplicates the document, not the event", () => {
    const patientId = patientForScenario("HN-12");
    const docs = dataset.records.filter((record) => record.patient_id === patientId);
    const copy = docs.find((record) => record.duplicate_of);
    expect(copy).toBeDefined();
    const original = docs.find((record) => record.source_doc_id === copy?.duplicate_of);
    expect(original?.content_hash).toBe(copy?.content_hash);
    expect(
      (eventsByPatient.get(patientId) ?? []).filter(
        (event) => event.event_type === "lab_result" && event.typed["test_name_normalized"] === "cbc",
      ),
    ).toHaveLength(1);
  });

  it("HN-13 records a partial date", () => {
    const patientId = patientForScenario("HN-13");
    expect((eventsByPatient.get(patientId) ?? []).some((event) => event.date_precision === "month")).toBe(true);
  });

  it("HN-14 leaves the provider unknown without crashing", () => {
    const patientId = patientForScenario("HN-14");
    expect((eventsByPatient.get(patientId) ?? []).some((event) => event.provider_type === "other")).toBe(true);
  });

  it("HN-15 marks the referral explicitly completed", () => {
    const patientId = patientForScenario("HN-15");
    const referral = (eventsByPatient.get(patientId) ?? []).find((event) => event.event_type === "referral");
    expect(referral?.typed["status"]).toBe("completed");
  });

  it("HN-02 and HN-11 are adversarial positives in ground truth", () => {
    const scenarios = new Set(dataset.groundTruth.map((gap) => gap.scenario_id));
    expect(scenarios.has("HN-02")).toBe(true);
    expect(scenarios.has("HN-11")).toBe(true);
  });
});
