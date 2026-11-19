import { describe, expect, it } from "vitest";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { asHandler, invokeGet, readCache } from "./support";

const metrics = asHandler(metricsRoute);

interface MetricBody {
  panel_id: string;
  measured: Array<{ metric: string; value: number; unit: string; classification: string }>;
  modeled: Array<{ metric: string; value: number; unit: string; classification: string }>;
  scenario_assumptions: Array<{ metric: string; value: number; unit: string; classification: string }>;
  external_research: Array<{ metric: string; value: number; unit: string; classification: string }>;
}

const impact = readCache<Record<string, Record<string, { value: number; classification: string }>>>("impact.json");

describe("GET /api/v1/metrics", () => {
  it("preserves claim classification buckets", async () => {
    const result = await invokeGet<MetricBody>(metrics, "/api/v1/metrics?panelId=demo");
    expect(result.status).toBe(200);
    expect(result.body.panel_id).toBe("demo");

    const buckets: Array<[keyof MetricBody, string]> = [
      ["measured", "MEASURED"],
      ["modeled", "MODELED"],
      ["scenario_assumptions", "SCENARIO_ASSUMPTION"],
      ["external_research", "EXTERNAL_RESEARCH"],
    ];
    for (const [bucket, classification] of buckets) {
      const items = result.body[bucket] as MetricBody["measured"];
      expect(items.length).toBe(Object.keys(impact[bucket] ?? {}).length);
      for (const item of items) expect(item.classification).toBe(classification);
    }
  });

  it("never flattens a modeled hour figure into a measured claim", async () => {
    const result = await invokeGet<MetricBody>(metrics, "/api/v1/metrics?panelId=demo");
    const measuredNames = result.body.measured.map((item) => item.metric);
    expect(measuredNames).toContain("cache_queue_read_p50_ms");
    expect(measuredNames).not.toContain("potential_coordinator_hours_redirected");

    const modeled = result.body.modeled.find((item) => item.metric === "potential_coordinator_hours_redirected");
    expect(modeled).toBeDefined();
    expect(modeled?.value).toBe(impact.modeled?.potential_coordinator_hours_redirected?.value);
  });

  it("classifies every metric and reports no unclassified values", async () => {
    const result = await invokeGet<MetricBody>(metrics, "/api/v1/metrics?panelId=demo");
    const all = [
      ...result.body.measured,
      ...result.body.modeled,
      ...result.body.scenario_assumptions,
      ...result.body.external_research,
    ];
    expect(all.length).toBeGreaterThan(0);
    const unclassified = all.filter(
      (item) => !["MEASURED", "MODELED", "SCENARIO_ASSUMPTION", "EXTERNAL_RESEARCH"].includes(item.classification),
    );
    expect(unclassified).toHaveLength(0);
    for (const item of all) {
      expect(item.value).toBeTypeOf("number");
      expect(item.unit.length).toBeGreaterThan(0);
    }
  });

  it("defaults the panel and rejects an unknown panel", async () => {
    const defaulted = await invokeGet<MetricBody>(metrics, "/api/v1/metrics");
    expect(defaulted.status).toBe(200);
    expect(defaulted.body.panel_id).toBe("demo");

    const missing = await invokeGet(metrics, "/api/v1/metrics?panelId=other");
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { code: string } }).error.code).toBe("panel_not_found");
  });
});
