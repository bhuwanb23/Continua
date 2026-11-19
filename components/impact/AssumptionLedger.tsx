import { DEFAULT_ASSUMPTIONS } from "@/lib/impact/assumptions";

export function AssumptionLedger() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Assumption ledger</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">Assumption</th>
            <th className="py-2">Value</th>
            <th className="py-2">Why</th>
          </tr>
        </thead>
        <tbody>
          {DEFAULT_ASSUMPTIONS.map((a) => (
            <tr key={a.id} className="border-t border-slate-100">
              <td className="py-2 font-medium text-ink">{a.label}</td>
              <td className="py-2">
                {a.value} {a.unit}
              </td>
              <td className="py-2 text-slate-600">{a.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        All rows are SCENARIO ASSUMPTIONS unless a measured usability study exists. We have not run
        one, so no row is labeled measured.
      </p>
    </section>
  );
}
