export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Methodology</h1>
        <p className="mt-1 text-sm text-slate-600">
          How Continua decides what to surface, and what it deliberately does not do.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm text-slate-700">
        <p>
          Continua uses a hybrid approach: an extraction layer turns records into
          structured events, and deterministic rules decide whether a care gap
          exists. The model extracts facts; it does not decide gaps.
        </p>
        <p>
          Every surfaced gap must cite verifiable source spans. Ungrounded claims
          are suppressed. The coordinator remains the final decision-maker.
        </p>
        <p>
          Priority is a coordination ranking derived from overdue verified gaps,
          not a clinical risk score. {/* safety-allow */} Scores are 0–100 workflow priorities, never
          probabilities or prognoses.
        </p>
        <p>
          All data on this site is synthetic. No real patient information is
          used, stored, or transmitted.
        </p>
      </section>
    </div>
  );
}
