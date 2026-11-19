import { describeImpact } from "@/lib/impact/format";
import type { ImpactResult } from "@/lib/impact/types";

export function ImpactSummary({ result }: { result: ImpactResult }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Modeled operational impact</h2>
      <p className="mt-2 text-2xl font-semibold text-ink">
        {result.perMonthHours.toFixed(1)} hours / month
      </p>
      <p className="mt-1 text-sm text-slate-600">{describeImpact(result)}</p>
      <p className="mt-2 text-xs text-slate-500">
        MODELED · formula: {result.formula}. Not measured. No patient-outcome or financial claims.
      </p>
    </section>
  );
}
