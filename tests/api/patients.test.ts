import { describe, expect, it } from "vitest";
import { GET as patientsRoute } from "@/app/api/v1/panels/[panelId]/patients/route";
import { GET as patientRoute } from "@/app/api/v1/patients/[patientId]/route";
import { asHandler, invokeGet, readCache } from "./support";

const list = asHandler(patientsRoute);
const detail = asHandler(patientRoute);

interface PatientSummary {
  patient_id: string;
  display_name: string;
  primary_condition: string;
  verified_gap_count: number;
  patient_priority_score: number;
  priority_band: string;
  priority_label: string;
  top_gap_type: string | null;
}

interface ListBody {
  panel_id: string;
  patients: PatientSummary[];
  total: number;
  limit: number;
  offset: number;
}

interface PriorityArtifact {
  patient_priorities: Array<{
    patient_id: string;
    patient_priority_score: number;
    priority_band: string;
    rank: number | null;
    breakdown: { top_gap_id: string | null };
  }>;
}

const priorities = readCache<PriorityArtifact>("priorities.json");
const priorityByPatient = new Map(priorities.patient_priorities.map((p) => [p.patient_id, p]));

describe("GET /api/v1/panels/{panelId}/patients", () => {
  it("paginates with the frozen defaults", async () => {
    const result = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients", { panelId: "demo" });
    expect(result.status).toBe(200);
    expect(result.body.limit).toBe(50);
    expect(result.body.offset).toBe(0);
    expect(result.body.total).toBe(80);
    expect(result.body.patients).toHaveLength(50);
  });

  it("clamps oversized and negative pagination input instead of accepting it", async () => {
    const big = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?limit=1000000", { panelId: "demo" });
    expect(big.body.limit).toBe(100);
    expect(big.body.patients).toHaveLength(80);

    const tiny = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?limit=-500", { panelId: "demo" });
    expect(tiny.body.limit).toBe(1);

    const negative = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?offset=-3", { panelId: "demo" });
    expect(negative.body.offset).toBe(0);
  });

  it("rejects non-numeric and unknown enum input", async () => {
    const badLimit = await invokeGet(list, "/api/v1/panels/demo/patients?limit=abc", { panelId: "demo" });
    expect(badLimit.status).toBe(400);

    const badType = await invokeGet(list, "/api/v1/panels/demo/patients?gap_type=cancer", { panelId: "demo" });
    expect(badType.status).toBe(400);

    const badBand = await invokeGet(list, "/api/v1/panels/demo/patients?priority_band=P9", { panelId: "demo" });
    expect(badBand.status).toBe(400);
  });

  it("filters by gap type and priority band using stored gaps", async () => {
    const filtered = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?gap_type=missed_followup", {
      panelId: "demo",
    });
    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBeGreaterThan(0);
    expect(filtered.body.total).toBeLessThan(80);

    const banded = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?priority_band=NONE", {
      panelId: "demo",
    });
    for (const patient of banded.body.patients) expect(patient.priority_band).toBe("NONE");
  });

  it("searches display names case-insensitively without fuzzy scoring", async () => {
    const result = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?query=MARIA", { panelId: "demo" });
    expect(result.status).toBe(200);
    expect(result.body.patients.length).toBeGreaterThan(0);
    for (const patient of result.body.patients) {
      expect(patient.display_name.toLowerCase()).toContain("maria");
    }
  });

  it("sorts by name ascending with a deterministic tie-break", async () => {
    const result = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?sort=name&limit=100", {
      panelId: "demo",
    });
    const names = result.body.patients.map((patient) => patient.display_name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("ships list items without timeline, evidence, or priority internals", async () => {
    const result = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?limit=1", { panelId: "demo" });
    const keys = Object.keys(result.body.patients[0] ?? {}).sort();
    expect(keys).toEqual(
      [
        "age",
        "display_name",
        "last_contact_date",
        "patient_id",
        "patient_priority_score",
        "primary_condition",
        "priority_band",
        "priority_label",
        "sex",
        "top_gap_type",
        "verified_gap_count",
      ].sort(),
    );
    expect(result.text).not.toMatch(/risk_level|risk_score|clinical_risk|timeline|evidence_bundle/);
  });

  it("does not expose candidate gaps or raw pipeline fields", async () => {
    const result = await invokeGet<ListBody>(list, "/api/v1/panels/demo/patients?limit=100", { panelId: "demo" });
    expect(result.text).not.toMatch(/candidate_id|trigger_event_ids|gap_policy_version/);
  });
});

describe("GET /api/v1/patients/{patientId}", () => {
  const target = priorities.patient_priorities.find((p) => p.rank === 1);
  if (!target) throw new Error("Cache has no ranked patient");

  it("returns the stored priority semantics for the patient", async () => {
    const result = await invokeGet<{ patient: Record<string, unknown> }>(
      detail,
      `/api/v1/patients/${target.patient_id}`,
      { patientId: target.patient_id },
    );
    expect(result.status).toBe(200);
    const patient = result.body.patient as unknown as PatientSummary & {
      priority_rank: number;
      priority_breakdown: Record<string, number | null>;
    };
    expect(patient.patient_id).toBe(target.patient_id);
    expect(patient.patient_priority_score).toBe(target.patient_priority_score);
    expect(patient.priority_band).toBe(target.priority_band);
    expect(patient.priority_rank).toBe(target.rank);
    expect(patient.priority_breakdown.top_gap_raw_score).toBeTypeOf("number");
    expect(result.text).not.toMatch(/risk_level|risk_score|clinical_risk|"priority_score"/);
  });

  it("returns 404 for an unknown patient and 400 for a malformed id", async () => {
    const missing = await invokeGet(detail, "/api/v1/patients/00000000-0000-4000-8000-000000000000", {
      patientId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { code: string } }).error.code).toBe("patient_not_found");

    const malformed = await invokeGet(detail, "/api/v1/patients/not-a-uuid", { patientId: "not-a-uuid" });
    expect(malformed.status).toBe(400);
  });

  it("reports a verified gap count that matches the stored gap set", async () => {
    const result = await invokeGet<{ patient: PatientSummary }>(
      detail,
      `/api/v1/patients/${target.patient_id}`,
      { patientId: target.patient_id },
    );
    const cached = readCache<{ verified_gaps: Array<{ patient_id: string }> }>("verified-gaps.json");
    const count = cached.verified_gaps.filter((gap) => gap.patient_id === target.patient_id).length;
    expect(result.body.patient.verified_gap_count).toBe(count);
    expect(priorityByPatient.get(target.patient_id)?.breakdown.top_gap_id === null).toBe(false);
  });
});
