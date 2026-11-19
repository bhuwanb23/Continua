"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/ui/api";
import type { PanelResponse, QueueResponse } from "@/lib/api/dto";
import { QueueCard } from "@/components/queue/QueueCard";

export default function TodayPage() {
  const [panel, setPanel] = useState<PanelResponse | null>(null);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.panel(), api.queue("demo", 5)])
      .then(([p, q]) => {
        if (cancelled) return;
        setPanel(p);
        setQueue(q);
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

  if (loading) {
    return <p className="text-slate-500">Loading panel…</p>;
  }
  if (error || !panel || !queue) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Could not load the panel. {error}
      </div>
    );
  }

  const withGaps = panel.panel.patients_with_verified_gaps;
  const total = panel.panel.patient_count;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Today</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Good morning, Sarah</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          {total} patients in your panel. {withGaps} have verified continuity issues.
          {" "}{queue.items.length} prioritized for review.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-ink">{total} patients</span>
          {" → "}
          <span className="font-semibold text-ink">{withGaps} with verified gaps</span>
          {" → "}
          <span className="font-semibold text-teal-700">{queue.items.length} prioritized for review</span>
        </p>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold text-ink">Review first</h2>
          <p className="text-sm text-slate-500">Authoritative Phase-8 ordering</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {queue.items.map((item) => (
            <QueueCard key={item.patient_id} item={item} />
          ))}
        </div>
        {queue.items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No prioritized interventions.</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Continua ranks coordination priority from verified gaps only. It does not
        diagnose patients or replace clinical judgment.
      </section>
    </div>
  );
}
