import type { ReactNode } from "react";
import { CLASSIFICATION_LABEL } from "@/lib/claims/classifications";

export function MetricCard({
  label,
  value,
  context,
  classification = "MEASURED",
}: {
  label: string;
  value: ReactNode;
  context: string;
  classification?: "MEASURED" | "MODELED" | "SCENARIO_ASSUMPTION" | "EXTERNAL_RESEARCH" | "FUTURE_TARGET";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {CLASSIFICATION_LABEL[classification]}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{context}</p>
    </div>
  );
}
