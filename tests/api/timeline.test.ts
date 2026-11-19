import { describe, expect, it } from "vitest";
import { GET as timelineRoute } from "@/app/api/v1/patients/[patientId]/timeline/route";
import { sortClinicalEvents } from "@/lib/clinical-events/sort";
import type { CanonicalClinicalEvent } from "@/lib/domain";
import { asHandler, invokeGet, readCache } from "./support";

const timeline = asHandler(timelineRoute);

interface TimelineBody {
  patient_id: string;
  events: Array<{
    event_id: string;
    date: string;
    date_precision: string;
    event_type: string;
    description: string;
    provider: string | null;
    provider_type: string | null;
    source_doc_id: string;
    display: Record<string, unknown>;
  }>;
}

const cached = readCache<Array<{ patient_id: string; events: CanonicalClinicalEvent[] }>>("timelines.json");
const busiest = [...cached].sort((left, right) => right.events.length - left.events.length)[0];
if (!busiest) throw new Error("Cache has no timelines");

describe("GET /api/v1/patients/{patientId}/timeline", () => {
  it("returns canonical events in ascending frozen order", async () => {
    const result = await invokeGet<TimelineBody>(
      timeline,
      `/api/v1/patients/${busiest.patient_id}/timeline`,
      { patientId: busiest.patient_id },
    );
    expect(result.status).toBe(200);
    expect(result.body.patient_id).toBe(busiest.patient_id);
    expect(result.body.events).toHaveLength(busiest.events.length);

    const expected = sortClinicalEvents(busiest.events).map((event) => event.event_id);
    expect(result.body.events.map((event) => event.event_id)).toEqual(expected);

    const dates = result.body.events.map((event) => event.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("exposes only display-safe event fields", async () => {
    const result = await invokeGet<TimelineBody>(
      timeline,
      `/api/v1/patients/${busiest.patient_id}/timeline`,
      { patientId: busiest.patient_id },
    );
    expect(result.text).not.toMatch(/extraction_confidence|mention_context|source_span|normalization_version/);
    for (const event of result.body.events) {
      expect(event.source_doc_id).toBeTruthy();
      for (const value of Object.values(event.display)) {
        expect(["string", "number", "boolean", "object"]).toContain(typeof value);
      }
    }
  });

  it("keeps source document ids inside the patient's own record set", async () => {
    const result = await invokeGet<TimelineBody>(
      timeline,
      `/api/v1/patients/${busiest.patient_id}/timeline`,
      { patientId: busiest.patient_id },
    );
    const records = readCache<Array<{ source_doc_id: string; patient_id: string }>>("records.json");
    const owned = new Set(records.filter((record) => record.patient_id === busiest.patient_id).map((r) => r.source_doc_id));
    for (const event of result.body.events) expect(owned.has(event.source_doc_id)).toBe(true);
  });

  it("returns 404 for an unknown patient", async () => {
    const result = await invokeGet(timeline, "/api/v1/patients/00000000-0000-4000-8000-000000000000/timeline", {
      patientId: "00000000-0000-4000-8000-000000000000",
    });
    expect(result.status).toBe(404);
  });
});
