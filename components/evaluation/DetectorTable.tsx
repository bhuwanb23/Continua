interface PerType {
  precision: number | null;
  recall: number | null;
  f1: number | null;
  tp?: number;
  fp?: number;
  fn?: number;
}

const show = (value: number | null): string => (value === null ? "Not measured" : value.toFixed(2));

export function DetectorTable({
  perType,
  truthInstances,
}: {
  perType: Record<string, PerType>;
  truthInstances?: Record<string, number>;
}) {
  const rows = Object.entries(perType);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Per-detector performance</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">Detector</th>
            <th className="py-2">Precision</th>
            <th className="py-2">Recall</th>
            <th className="py-2">F1</th>
            <th className="py-2">n (truth)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, m]) => (
            <tr key={name} className="border-t border-slate-100">
              <td className="py-2 font-medium text-ink">{name.replace(/_/g, " ")}</td>
              <td className="py-2">{show(m.precision)}</td>
              <td className="py-2">{show(m.recall)}</td>
              <td className="py-2">{show(m.f1)}</td>
              <td className="py-2">{truthInstances?.[name] ?? m.tp ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
