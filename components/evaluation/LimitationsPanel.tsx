export function LimitationsPanel({ limitations }: { limitations: string[] }) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
      <h2 className="text-lg font-semibold">What this benchmark does not prove</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {limitations.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs">
        Synthetic data only. Not clinical validation. No patient outcomes measured.
      </p>
    </section>
  );
}
