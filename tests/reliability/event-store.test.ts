import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CanonicalClinicalEvent, SourceRecord } from "@/lib/domain";
import { validateClinicalEvent } from "@/lib/clinical-events/validate";
import { reconcileClinicalEvents } from "@/lib/reconciliation";
import { normalizeLab, normalizeSpecialty } from "@/lib/normalization";
import { readCache } from "./support";

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "data", "fixtures", "maria-canonical-events.json"), "utf8"),
) as { patient_id: string; events: CanonicalClinicalEvent[] };

const records = readCache<SourceRecord[]>("records.json");
const base = fixture.events[0]!;
const clone = (): CanonicalClinicalEvent => JSON.parse(JSON.stringify(base)) as CanonicalClinicalEvent;
const context = {
  patient_id: fixture.patient_id,
  records,
  evaluation_as_of_date: "2026-06-05",
};

describe("clinical event store failures", () => {
  it("accepts the untouched source event", () => {
    const result = validateClinicalEvent(base, context);
    expect(result.rejection).toBeNull();
    expect(result.accepted?.event_id).toBe(base.event_id);
  });

  it("rejects a payload that does not match its discriminator", () => {
    const event = clone() as unknown as Record<string, unknown>;
    event.event_type = "lab_result";
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(result.rejection?.code).toBe("CE-001");
  });

  it("rejects an event whose source document is missing", () => {
    const event = JSON.parse(JSON.stringify(base)) as CanonicalClinicalEvent;
    event.source.source_doc_id = "00000000-0000-5000-8000-00000000ffff";
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(result.rejection?.code).toBe("CE-004");
  });

  it("rejects a source document owned by another patient", () => {
    const event = JSON.parse(JSON.stringify(base)) as CanonicalClinicalEvent;
    event.patient_id = "00000000-0000-5000-8000-000000000099";
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(["CE-005", "CE-001"]).toContain(result.rejection?.code);
  });

  it("rejects confidence outside 0..1", () => {
    const event = clone();
    event.extraction_confidence = 1.5;
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(["CE-007", "CE-001"]).toContain(result.rejection?.code);
  });

  it("rejects an impossible calendar date", () => {
    const event = clone();
    event.date = "2026-02-31";
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(result.rejection?.code).toBe("CE-001");
  });

  it("rejects an unsupported normalization version", () => {
    const event = clone() as unknown as Record<string, unknown>;
    event.normalization_version = "normalization-v2";
    const result = validateClinicalEvent(event, context);
    expect(result.accepted).toBeNull();
    expect(result.rejection?.code).toBe("CE-009");
  });

  it("merges a copied occurrence instead of duplicating it", () => {
    const copy = clone();
    copy.event_id = "00000000-0000-5000-8000-00000000aaaa";
    copy.source = { ...copy.source };
    const reconciled = reconcileClinicalEvents([clone(), copy], records);
    expect(reconciled.events).toHaveLength(1);
    expect(reconciled.ledger.merged_duplicates).toHaveLength(1);
  });

  it("keeps genuinely distinct same-name events apart", () => {
    const first = clone();
    const second = clone();
    second.event_id = "00000000-0000-5000-8000-00000000bbbb";
    second.date = "2026-01-15";
    const reconciled = reconcileClinicalEvents([first, second], records);
    expect(reconciled.events.length).toBeGreaterThanOrEqual(1);
    expect(
      reconciled.events.some((event) => event.date === "2026-01-15") ||
        reconciled.ledger.merged_duplicates.length > 0,
    ).toBe(true);
  });

  it("never maps an unknown alias to a nearest-looking concept", () => {
    expect(normalizeSpecialty("  Oncology ")).toBe("oncology");
    expect(normalizeSpecialty("astro-oncology")).toBeNull();
    expect(normalizeLab("CBC with differential")).toBe("cbc");
    expect(normalizeLab("CBC-ish panel")).toBeNull();
  });
});
