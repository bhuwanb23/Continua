import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ClinicalEventSchema } from "@/lib/schemas";
import { canonicalizeClinicalEvents, legacyEventToCanonical, canonicalEventToLegacy } from "@/lib/clinical-events";
import { CLINICAL_EVENT_SCHEMA_VERSION } from "@/lib/domain/versions";
import type { CanonicalClinicalEvent, LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { canonicalEvent } from "../support/clinical-events";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

describe("clinical-event v1.1 amendment", () => {
  it("still accepts v1.0 envelopes without mention_context", () => {
    const v1 = { ...canonicalEvent(), schema_version: "clinical-event-v1" };
    delete (v1 as Record<string, unknown>)["mention_context"];
    expect(ClinicalEventSchema.safeParse(v1).success).toBe(true);
  });

  it("accepts every valid mention_context on v1.1 envelopes", () => {
    for (const mention of ["contemporaneous", "historical_reference", "unknown"] as const) {
      const result = ClinicalEventSchema.safeParse(
        canonicalEvent({ schema_version: CLINICAL_EVENT_SCHEMA_VERSION, mention_context: mention }),
      );
      expect(result.success, mention).toBe(true);
    }
  });

  it("rejects an invalid mention_context value", () => {
    const result = ClinicalEventSchema.safeParse(
      canonicalEvent({ mention_context: "probably_old" } as never),
    );
    expect(result.success).toBe(false);
  });

  it("legacy adapter stamps v1.1 and defaults mention_context to unknown", () => {
    const legacy = canonicalEventToLegacy(canonicalEvent());
    delete (legacy.typed as Record<string, unknown>)["mention_context"];
    const adapted = legacyEventToCanonical(legacy);
    expect(adapted.schema_version).toBe(CLINICAL_EVENT_SCHEMA_VERSION);
    expect(adapted.mention_context).toBe("unknown");
  });

  it("legacy adapter honors an explicit mention_context and round-trips it", () => {
    const legacy = canonicalEventToLegacy(canonicalEvent());
    (legacy.typed as Record<string, unknown>)["mention_context"] = "historical_reference";
    const adapted = legacyEventToCanonical(legacy);
    expect(adapted.mention_context).toBe("historical_reference");
    const back = canonicalEventToLegacy(adapted);
    expect(back.typed?.["mention_context"]).toBe("historical_reference");
  });

  it("keeps Maria event identities stable through the amended pipeline", () => {
    const root = process.cwd();
    const fixture = readJson<{ patient_id: string; events: CanonicalClinicalEvent[] }>(
      join(root, "data", "fixtures", "maria-canonical-events.json"),
    );
    const records = readJson<{ records: SourceRecord[] }>(
      join(root, "data", "synthetic", "continua-synth-v1", "records.json"),
    ).records.filter((record) => record.patient_id === fixture.patient_id);
    const truth = readJson<{ events: LegacyClinicalEvent[] }>(
      join(root, "data", "generator", "truth-events", "truth-events.json"),
    ).events.filter((event) => event.patient_id === fixture.patient_id);

    const result = canonicalizeClinicalEvents(truth, {
      patient_id: fixture.patient_id,
      records,
      extractor_version: "truth-events-v1",
    });
    expect(result.rejected).toHaveLength(0);
    expect(result.accepted.map((event) => event.event_id).sort()).toEqual(
      fixture.events.map((event) => event.event_id).sort(),
    );
    expect(result.accepted.every((event) => event.schema_version === CLINICAL_EVENT_SCHEMA_VERSION)).toBe(true);
    expect(result.accepted.every((event) => event.mention_context === "unknown")).toBe(true);
  });
});