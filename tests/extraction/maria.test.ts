import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { extractPatient } from "@/lib/extraction/batch";
import { FixtureDocumentExtractor } from "@/lib/extraction/fixture-extractor";
import { flattenCanonicalEvents } from "@/lib/extraction/flatten";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import type { ExtractionGoldEvent } from "@/lib/evaluation/types";
import { truthEventsToCandidates } from "@/scripts/lib/truth-candidates";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const patients = readJson<{ patients: Array<{ patient_id: string; fixture_key: string }> }>(
  join(root, "data", "synthetic", "continua-synth-v1", "patients.json"),
).patients;
const maria = patients.find((patient) => patient.fixture_key === "P-001-maria");
if (!maria) throw new Error("Maria missing from synthetic panel");

const records = readJson<{ records: SourceRecord[] }>(
  join(root, "data", "synthetic", "continua-synth-v1", "records.json"),
).records.filter((record) => record.patient_id === maria.patient_id);

const truthEvents = readJson<{ events: LegacyClinicalEvent[] }>(
  join(root, "data", "generator", "truth-events", "truth-events.json"),
).events.filter((event) => event.patient_id === maria.patient_id);

const gold = readJson<{ extraction_gold: ExtractionGoldEvent[] }>(
  join(root, "data", "eval-set", "continua-eval-v1", "benchmark-contracts.json"),
).extraction_gold.filter((event) => event.patient_id === maria.patient_id);

const fixture = readJson<{ events: CanonicalClinicalEvent[] }>(
  join(root, "data", "fixtures", "maria-canonical-events.json"),
);

function forbiddenKeys(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => forbiddenKeys(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return [];
  const found: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const full = `${path}.${key}`;
    if (/gap|risk|treatment|priority|diagnos/i.test(key)) found.push(full);
    found.push(...forbiddenKeys(nested, full));
  }
  return found;
}

describe("Maria offline extraction (fixture)", () => {
  it("reconstructs the canonical fixture within matcher tolerance", async () => {
    const conversion = truthEventsToCandidates(truthEvents);
    expect(conversion.skipped).toEqual([]);
    const extractor = new FixtureDocumentExtractor(conversion.fixtures);
    const result = await extractPatient(extractor, records);

    expect(result.status).toBe("COMPLETE");
    expect(result.store.rejected).toEqual([]);
    expect(result.store.accepted).toHaveLength(12);
    expect(result.store.accepted).toHaveLength(fixture.events.length);

    const predictions = flattenCanonicalEvents(result.store.accepted);
    const metrics = matchExtractionEvents(gold, predictions, { records });
    expect(metrics.matched_events).toBe(gold.length);
    expect(metrics.event_precision).toBe(1);
    expect(metrics.event_recall).toBe(1);
    expect(metrics.event_f1).toBe(1);
    expect(metrics.date_accuracy).toBe(1);
    expect(metrics.source_attribution_accuracy).toBe(1);
    expect(metrics.span_support_rate).toBe(1);
    expect(metrics.normalization_accuracy).toBe(1);
    expect(metrics.false_positive_prediction_ids).toEqual([]);
    expect(metrics.false_negative_gold_ids).toEqual([]);
  });

  it("matches the frozen fixture on type, date, document, and normalized fields", async () => {
    const conversion = truthEventsToCandidates(truthEvents);
    const result = await extractPatient(new FixtureDocumentExtractor(conversion.fixtures), records);

    const projection = (events: CanonicalClinicalEvent[]) =>
      flattenCanonicalEvents(events)
        .map((event) =>
          JSON.stringify({
            event_type: event.event_type,
            date: event.date,
            source_doc_id: event.source_doc_id,
            normalized_entity: event.normalized_entity,
            normalized: event.normalized,
          }),
        )
        .sort();
    expect(projection(result.store.accepted)).toEqual(projection(fixture.events));
  });

  it("keeps the documented 45-day oncology referral window", async () => {
    const conversion = truthEventsToCandidates(truthEvents);
    const result = await extractPatient(new FixtureDocumentExtractor(conversion.fixtures), records);
    const referrals = result.store.accepted.filter((event) => event.event_type === "referral");
    expect(referrals).toHaveLength(1);
    const referral = referrals[0];
    expect(referral?.typed).toMatchObject({
      specialty_normalized: "oncology",
      expected_window_days: 45,
      window_source: "document",
    });
  });

  it("does not inflate or collapse lab occurrences", async () => {
    const conversion = truthEventsToCandidates(truthEvents);
    const result = await extractPatient(new FixtureDocumentExtractor(conversion.fixtures), records);
    const cbcDates = result.store.accepted
      .filter((event) => event.event_type === "lab_result" && event.typed.test_code_normalized === "cbc")
      .map((event) => event.date)
      .sort();
    expect(cbcDates).toEqual(["2026-04-20", "2026-04-28"]);
    expect(result.ledger.merged_duplicates).toEqual([]);
  });

  it("emits zero gap, risk, or treatment keys (Gate C)", async () => {
    const conversion = truthEventsToCandidates(truthEvents);
    const result = await extractPatient(new FixtureDocumentExtractor(conversion.fixtures), records);
    expect(forbiddenKeys(result.store.accepted)).toEqual([]);
    expect(forbiddenKeys(result.documents.flatMap((outcome) => outcome.candidates))).toEqual([]);
  });
});