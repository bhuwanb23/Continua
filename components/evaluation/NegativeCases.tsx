interface Family {
  family: string;
  cases: number;
  passed: number;
  pass_rate: number;
}

export function NegativeCases({ families, total, passed }: { families: Family[]; total: number; passed: number }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Designed to say &ldquo;no&rdquo;</h2>
      <p className="mt-1 text-sm text-slate-600">
        Hard-negative pass: {passed}/{total} ({Math.round((passed / Math.max(total, 1)) * 100)}%).
      </p>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {families.map((family) => (
          <li key={family.family} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-700">{family.family.replace(/_/g, " ")}</span>
            <span className="font-medium text-ink">
              {family.passed}/{family.cases}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
