"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/ui/api";
import type { ImpactMetric, MetricsResponse } from "@/lib/api/dto";

const BUCKETS: Array<{ key: keyof MetricsResponse; label: string; description: string }> = [
  { key: "measured", label: "Measured", description: "Observed from the frozen snapshot or benchmark." },
  { key: "modeled", label: "Modeled", description: "Derived from stored values with stated assumptions." },
  { key: "scenario_assumptions", label: "Scenario assumptions", description: "Inputs we assumed, not measured." },
  { key: "external_research", label: "External research", description: "Cited background, not panel-specific." },
];

export default function InsightsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .metrics()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-slate-500">Loading impact metrics…</p>;
  if (error || !data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Impact</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every metric carries its evidence class so estimates cannot masquerade as measurements.
        </p>
      </div>

      {BUCKETS.map((bucket) => {
        const rows = (data[bucket.key] as ImpactMetric[] | undefined) ?? [];
        if (rows.length === 0) return null;
        return (
          <section key={bucket.key} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">{bucket.label}</h2>
            <p className="mt-1 text-xs text-slate-500">{bucket.description}</p>
            <ul className="mt-4 space-y-3">
              {rows.map((row) => (
                <li key={row.metric} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-ink">{row.metric.replace(/_/g, " ")}</p>
                    <p className="text-lg font-semibold text-teal-700">
                      {row.value}
                      <span className="ml-1 text-xs font-normal text-slate-500">{row.unit}</span>
                    </p>
                  </div>
                  {row.source ? <p className="mt-1 text-xs text-slate-500">{row.source}</p> : null}
                  {row.basis ? <p className="mt-1 text-xs text-slate-500">{row.basis}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
