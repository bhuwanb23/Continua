export default function MethodologyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Methodology</h1>
      <p className="max-w-2xl text-slate-700">
        Continua uses a hybrid approach: an extraction layer turns records into
        structured events, and deterministic rules decide whether a care gap
        exists. The model extracts facts; it does not decide gaps.
      </p>
      <p className="max-w-2xl text-slate-700">
        Every surfaced gap must cite verifiable source spans. Ungrounded claims
        are suppressed. The coordinator remains the final decision-maker.
      </p>
    </div>
  );
}
