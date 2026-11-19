export function BenchmarkHeader({
  runId,
  version,
  partition,
  status,
}: {
  runId: string;
  version: string;
  partition: string | null;
  status: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-semibold text-ink">How Continua performs</h1>
      <p className="mt-1 text-sm text-slate-600">
        Evaluated on a frozen synthetic benchmark with held-out patients and adversarial
        negative cases. Fixture replay, not live model quality.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Run</dt>
          <dd className="font-medium text-ink break-all">{runId}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Version</dt>
          <dd className="font-medium text-ink">{version}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Partition</dt>
          <dd className="font-medium text-ink">{partition ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="font-medium text-ink">{status}</dd>
        </div>
      </dl>
    </section>
  );
}
