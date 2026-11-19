"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/ui/api";
import type { EvaluationResponse } from "@/lib/api/dto";

export default function EvaluationPage() {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .evaluation()
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

  if (loading) return <p className="text-slate-500">Loading evaluation…</p>;
  if (error || !data) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  }

  const evaluation = data.evaluation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Evaluation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Frozen Phase-9 benchmark aggregates. Fixture replay, not live model quality.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Run</dt>
            <dd className="font-medium text-ink">{evaluation.benchmark_run_id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Version</dt>
            <dd className="font-medium text-ink">{evaluation.benchmark_version}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
            <dd className="font-medium text-ink">{evaluation.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Partition</dt>
            <dd className="font-medium text-ink">{evaluation.partition ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {evaluation.gap_detection ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Gap detection</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(evaluation.gap_detection, null, 2)}
          </pre>
        </section>
      ) : null}

      {evaluation.priority ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Priority</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(evaluation.priority, null, 2)}
          </pre>
        </section>
      ) : null}

      {evaluation.latency ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Latency</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(evaluation.latency, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Limitations</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {evaluation.limitations.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
