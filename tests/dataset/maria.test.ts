import { describe, expect, it } from "vitest";
import { generateDataset } from "@/lib/generator";
import { addDays, daysBetween } from "@/lib/generator/dates";
import { EVALUATION_AS_OF_DATE } from "@/lib/generator/config";

const dataset = generateDataset();
const maria = dataset.patients.find((patient) => patient.fixture_key === "P-001-maria");
if (!maria) throw new Error("Maria missing");
const mariaEvents = dataset.truthEvents.filter((event) => event.patient_id === maria.patient_id);
const mariaGaps = dataset.groundTruth.filter((gap) => gap.patient_id === maria.patient_id);
const eventById = new Map(dataset.truthEvents.map((event) => [event.event_id, event]));

describe("Maria golden case", () => {
  it("is the reserved first patient", () => {
    expect(dataset.patients[0]?.fixture_key).toBe("P-001-maria");
    expect(maria.demo_age).toBe(54);
  });

  it("has exactly three planted gaps, one per type", () => {
    expect(mariaGaps).toHaveLength(3);
    expect(new Set(mariaGaps.map((gap) => gap.gap_type))).toEqual(
      new Set(["missed_followup", "duplicate_test", "med_monitoring"]),
    );
  });

  it("computes the missed oncology follow-up as 27 days overdue", () => {
    const gap = mariaGaps.find((candidate) => candidate.gap_type === "missed_followup");
    const trigger = gap ? eventById.get(gap.trigger_event_id) : undefined;
    expect(trigger?.date).toBe("2026-03-25");
    expect(addDays("2026-03-25", 45)).toBe("2026-05-09");
    expect(daysBetween("2026-05-09", EVALUATION_AS_OF_DATE)).toBe(27);
  });

  it("computes the duplicate CBC as 8 days apart", () => {
    const gap = mariaGaps.find((candidate) => candidate.gap_type === "duplicate_test");
    const dates = (gap?.source_doc_ids ?? [])
      .map((docId) => mariaEvents.find((event) => event.source_doc_id === docId)?.date)
      .filter((date): date is string => Boolean(date))
      .sort();
    expect(dates).toEqual(["2026-04-20", "2026-04-28"]);
    expect(daysBetween(dates[0] as string, dates[1] as string)).toBe(8);
  });

  it("computes metformin monitoring as 25 days overdue", () => {
    const gap = mariaGaps.find((candidate) => candidate.gap_type === "med_monitoring");
    const trigger = gap ? eventById.get(gap.trigger_event_id) : undefined;
    expect(trigger?.typed["drug_normalized"]).toBe("metformin");
    expect(trigger?.date).toBe("2026-02-10");
    expect(daysBetween("2026-05-11", EVALUATION_AS_OF_DATE)).toBe(25);
  });

  it("keeps tamoxifen as context, never a gap", () => {
    const tamoxifen = mariaEvents.find((event) => event.typed["drug_normalized"] === "tamoxifen");
    expect(tamoxifen).toBeDefined();
    expect(mariaGaps.some((gap) => gap.trigger_event_id === tamoxifen?.event_id)).toBe(false);
  });

  it("has no A1c or BMP result that would satisfy metformin monitoring", () => {
    const labs = mariaEvents.filter((event) => event.event_type === "lab_result");
    const normalized = labs.map((event) => String(event.typed["test_name_normalized"]));
    expect(normalized).not.toContain("a1c");
    expect(normalized).not.toContain("bmp");
  });

  it("is included in the extraction-gold subset", () => {
    expect(dataset.extractionGold.some((event) => event.patient_id === maria.patient_id)).toBe(true);
  });
});
