import { CLAIMS } from "@/lib/claims/registry";

export function ExternalEvidence() {
  const external = CLAIMS.filter((c) => c.classification === "EXTERNAL_RESEARCH" && c.external_source);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">External evidence registry</h2>
      {external.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          None retained. The proof layer does not rest on third-party statistics, so none are cited.
        </p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {external.map((claim) => (
            <li key={claim.claim_id}>
              <p className="font-medium text-ink">{claim.label}</p>
              <p className="text-slate-600">{claim.external_source?.publisher} · {claim.external_source?.publication_date}</p>
              <a href={claim.external_source?.url} className="text-teal-700 underline">
                {claim.external_source?.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
