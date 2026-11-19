export function TrustScorecard({
  citationValidity,
  patientOwnership,
  spanSupport,
  groundedGapRate,
  unsupportedClaims,
  wrongPatientCitations,
}: {
  citationValidity: number;
  patientOwnership: number;
  spanSupport: number;
  groundedGapRate: number;
  unsupportedClaims: number;
  wrongPatientCitations: number;
}) {
  const rows = [
    { label: "Displayed gaps with verified sources", value: `${(groundedGapRate * 100).toFixed(0)}%` },
    { label: "Wrong-patient citations", value: wrongPatientCitations },
    { label: "Unsupported displayed claims", value: unsupportedClaims },
    { label: "Citation validity", value: `${(citationValidity * 100).toFixed(0)}%` },
    { label: "Patient ownership", value: `${(patientOwnership * 100).toFixed(0)}%` },
    { label: "Span support", value: `${(spanSupport * 100).toFixed(0)}%` },
  ];
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">What reaches the coordinator</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between">
            <span className="text-slate-700">{row.label}</span>
            <span className="font-medium text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Continua chooses to suppress unsupported issues rather than present them as trusted
        coordination alerts.
      </p>
    </section>
  );
}
