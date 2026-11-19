interface Baseline {
  name: string;
  macro_f1: number;
  hard_negative_pass_rate?: number | null;
  grounding_rate?: number | null;
}

export function BaselineComparison({ baselines }: { baselines: Baseline[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Baseline comparison</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">System</th>
            <th className="py-2">Macro F1</th>
            <th className="py-2">Hard neg.</th>
            <th className="py-2">Grounding</th>
          </tr>
        </thead>
        <tbody>
          {baselines.map((b) => (
            <tr key={b.name} className="border-t border-slate-100">
              <td className="py-2 font-medium text-ink">{b.name}</td>
              <td className="py-2">{b.macro_f1.toFixed(2)}</td>
              <td className="py-2">
                {b.hard_negative_pass_rate == null ? "—" : b.hard_negative_pass_rate.toFixed(2)}
              </td>
              <td className="py-2">
                {b.grounding_rate == null ? "—" : b.grounding_rate.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
