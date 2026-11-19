"use client";

import { useMemo, useState } from "react";
import { calculateRedirectedTime } from "@/lib/impact/model";
import { validateImpactInputs } from "@/lib/impact/validate";
import { IMPACT_BOUNDS } from "@/lib/impact/types";
import { ASSUMPTION_VALUES } from "@/lib/impact/assumptions";
import { ImpactSummary } from "@/components/impact/ImpactSummary";

export function ImpactCalculator() {
  const [patients, setPatients] = useState<number>(ASSUMPTION_VALUES.patients);
  const [baseline, setBaseline] = useState<number>(ASSUMPTION_VALUES.baselineMinutesPerPatient);
  const [assisted, setAssisted] = useState<number>(ASSUMPTION_VALUES.assistedMinutesPerPatient);
  const [days, setDays] = useState<number>(ASSUMPTION_VALUES.workingDaysPerMonth);

  const inputs = {
    patients,
    baselineMinutesPerPatient: baseline,
    assistedMinutesPerPatient: assisted,
    workingDaysPerMonth: days,
  };
  const issues = validateImpactInputs(inputs);
  const result = useMemo(
    () => calculateRedirectedTime({ patients, baselineMinutesPerPatient: baseline, assistedMinutesPerPatient: assisted, workingDaysPerMonth: days }),
    [patients, baseline, assisted, days],
  );

  return (
    <div className="space-y-4">
      <ImpactSummary result={result} />
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Impact calculator</h2>
        <p className="mt-1 text-xs text-slate-500">
          Every input is an editable scenario assumption. Nothing here is a measured result.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Patients reviewed / day" min={IMPACT_BOUNDS.patients.min} max={IMPACT_BOUNDS.patients.max} value={patients} onChange={setPatients} />
          <Field label="Baseline min/patient" min={IMPACT_BOUNDS.baselineMinutesPerPatient.min} max={IMPACT_BOUNDS.baselineMinutesPerPatient.max} value={baseline} onChange={setBaseline} />
          <Field label="Assisted min/patient" min={IMPACT_BOUNDS.assistedMinutesPerPatient.min} max={IMPACT_BOUNDS.assistedMinutesPerPatient.max} value={assisted} onChange={setAssisted} />
          <Field label="Working days/month" min={IMPACT_BOUNDS.workingDaysPerMonth.min} max={IMPACT_BOUNDS.workingDaysPerMonth.max} value={days} onChange={setDays} />
        </div>
        {issues.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-rose-700">
            {issues.map((issue) => (
              <li key={issue.field}>{issue.message}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-xs text-slate-500">
          Formula: {result.formula}
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-ink"
      />
      <span className="text-xs text-slate-400">
        {min}–{max}
      </span>
    </label>
  );
}
