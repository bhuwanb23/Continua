import type { MetricsResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import type { DemoImpactMetric } from "@/lib/cache/validate";
import { demoRepository } from "./context";

export type ImpactMetricDto = MetricsResponse["measured"][number];

type ImpactBucket = MetricsResponse["measured"];

function toMetrics(bucket: Record<string, DemoImpactMetric>): ImpactBucket {
  return Object.entries(bucket)
    .map(([metric, value]) => ({
      metric,
      value: value.value,
      unit: value.unit,
      classification: value.classification,
      ...(value.source === undefined ? {} : { source: value.source }),
      ...(value.basis === undefined ? {} : { basis: value.basis }),
    }))
    .sort((left, right) => left.metric.localeCompare(right.metric));
}

/**
 * Impact metrics stay bucketed by claim class so a modeled or assumed number
 * can never be read as a measured one.
 */
export async function getMetrics(
  panelId: string,
  requestId: string,
): Promise<Omit<MetricsResponse, "meta" | "disclaimer">> {
  const repository = demoRepository();
  const panel = await repository.panels.getPanel();
  if (panel.panel_id !== panelId) throw notFound("panel_not_found", "Panel not found.", requestId);

  const impact = await repository.impact.get();
  return {
    panel_id: panel.panel_id,
    measured: toMetrics(impact.measured),
    modeled: toMetrics(impact.modeled),
    scenario_assumptions: toMetrics(impact.scenario_assumptions),
    external_research: toMetrics(impact.external_research),
  };
}
