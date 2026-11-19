interface FunnelStage {
  label: string;
  value: number;
  note?: string;
}

export function PipelineFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Pipeline funnel</h2>
      <p className="mt-1 text-xs text-slate-500">
        Where recall is lost. Hover a stage for detail.
      </p>
      <div className="mt-4 space-y-2">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{stage.label}</span>
              <span className="font-medium text-ink">{stage.value}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${(stage.value / max) * 100}%` }}
              />
            </div>
            {stage.note ? <p className="mt-1 text-xs text-slate-500">{stage.note}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
