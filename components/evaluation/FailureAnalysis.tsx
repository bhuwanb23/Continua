export function FailureAnalysis({ failures }: { failures: string[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Where Continua still fails</h2>
      {failures.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No material failure families recorded in this benchmark run.
        </p>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {failures.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Synthetic data only. No clinical validation claimed.
      </p>
    </section>
  );
}
