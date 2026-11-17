export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Continua</h1>
        <p className="text-lg text-slate-600">
          Continuity intelligence for care coordinators
        </p>
      </div>

      <p className="max-w-2xl text-slate-700">
        Continua turns fragmented records into grounded events, detects care
        gaps deterministically, attaches verifiable evidence, and ranks
        intervention priority for coordinator review.
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Current status
        </h2>
        <p className="mt-2 text-slate-700">
          Phase 1 engineering foundation. Clinical intelligence is not
          implemented yet. This shell exists to prove the repository installs,
          validates, tests, builds, and boots.
        </p>
      </div>
    </div>
  );
}
