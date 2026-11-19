import { describe, expect, it } from "vitest";
import { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { CACHE_DIR } from "./support";

const ENV_KEYS = ["LLM_API_KEY", "LLM_PROVIDER", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

describe("offline demo read path", () => {
  it("initializes and serves every P0 read without LLM or Supabase configuration", async () => {
    const saved = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));
    for (const key of ENV_KEYS) delete process.env[key];
    try {
      const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
      const startup = repository.initialize();
      expect(startup.state).toBe("READY");
      expect(startup.status).toBe("PASS");
      expect(startup.patient_count).toBe(80);
      expect(startup.validation_duration_ms).toBeLessThan(500);

      const panel = await repository.panels.getPanel();
      expect(panel.patient_count).toBe(80);
      const queue = await repository.priorities.getQueue();
      expect(queue.items.length).toBe(5);
      const maria = await repository.maria.get();
      const patient = await repository.patients.getById(maria.patient_id);
      expect(patient?.name).toBeTruthy();
      const timeline = await repository.timelines.listByPatient(maria.patient_id);
      expect(timeline.length).toBeGreaterThan(0);
      expect((await repository.evaluation.getReport()).status).toBe("COMPLETED");
      expect(Object.keys(await repository.impact.get()).sort()).toEqual([
        "external_research",
        "measured",
        "modeled",
        "scenario_assumptions",
      ]);
      if (maria.flagship_gap_id) {
        const evidence = await repository.evidence.getByGapId(maria.flagship_gap_id);
        expect(evidence?.verification_status).toBe("verified");
        expect(evidence?.positive.length).toBeGreaterThan(0);
        const deepDive = await repository.evidence.getDeepDive(maria.flagship_gap_id);
        expect(deepDive?.gap_id).toBe(maria.flagship_gap_id);
      }
    } finally {
      for (const [key, value] of saved) {
        if (value !== undefined) process.env[key] = value;
      }
    }
  });

  it("validates once and serves warm reads from memory", () => {
    const repository = new JsonDemoRepository({ cacheDir: CACHE_DIR });
    const cold = repository.initialize();
    const warm = repository.initialize();
    expect(warm).toBe(cold);
    expect(repository.getState()).toBe("READY");
    expect(repository.store.requireIndexes().patientById.size).toBe(80);
  });
});
