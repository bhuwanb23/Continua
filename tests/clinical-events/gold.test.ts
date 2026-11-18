import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalizeClinicalEvents } from "@/lib/clinical-events";
import type { LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import type { ExtractionGoldEvent } from "@/lib/evaluation/types";

const root = process.cwd();
const records = (JSON.parse(
  readFileSync(join(root, "data", "synthetic", "continua-synth-v1", "records.json"), "utf8"),
) as { records: SourceRecord[] }).records;
const truthEvents = (JSON.parse(
  readFileSync(join(root, "data", "generator", "truth-events", "truth-events.json"), "utf8"),
) as { events: LegacyClinicalEvent[] }).events;
const gold = (JSON.parse(
  readFileSync(join(root, "data", "eval-set", "continua-eval-v1", "extraction_gold.json"), "utf8"),
) as { events: ExtractionGoldEvent[] }).events;

describe("Phase 3 extraction-gold compatibility", () => {
  it("represents every frozen gold event as ClinicalEvent v1", () => {
    const goldIds = new Set(gold.map((event) => event.event_id));
    const selected = truthEvents.filter((event) => goldIds.has(event.event_id));
    const byPatient = new Map<string, LegacyClinicalEvent[]>();
    for (const event of selected) {
      const list = byPatient.get(event.patient_id) ?? [];
      list.push(event);
      byPatient.set(event.patient_id, list);
    }

    const accepted = [];
    const rejected = [];
    for (const [patientId, events] of byPatient) {
      const result = canonicalizeClinicalEvents(events, {
        patient_id: patientId,
        records: records.filter((record) => record.patient_id === patientId),
      });
      accepted.push(...result.accepted);
      rejected.push(...result.rejected);
    }

    expect(selected).toHaveLength(130);
    expect(accepted).toHaveLength(130);
    expect(rejected).toEqual([]);
  });
});
