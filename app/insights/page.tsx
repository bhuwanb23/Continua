import Link from "next/link";
import { ImpactCalculator } from "@/components/impact/ImpactCalculator";
import { AssumptionLedger } from "@/components/impact/AssumptionLedger";
import { ExternalEvidence } from "@/components/impact/ExternalEvidence";

export const metadata = {
  title: "Impact model · Continua",
};

export default function ImpactPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Modeled operational impact</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          This page separates what Continua measured from what we assume about coordinator
          workflow. Every number below is either a frozen benchmark result shown elsewhere or a
          scenario assumption you can edit. Nothing here is a patient-outcome or financial savings
          claim.
        </p>
      </header>

      <ImpactCalculator />

      <AssumptionLedger />

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-lg font-semibold">What this model does not claim</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>No clinical outcome, avoided hospitalization, or lives-saved model.</li>
          <li>No dollar savings: no wage or cost assumption is applied.</li>
          <li>
            No measured human review time: we have not run a usability study, so assisted review
            time stays a scenario assumption.
          </li>
          <li>
            System latency is never substituted for coordinator review time. Cached API reads are
            not analysis time.
          </li>
        </ul>
      </section>

      <ExternalEvidence />

      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="text-lg font-semibold text-ink">Superseded legacy figure</h2>
        <p className="mt-2 text-slate-700">
          The Phase-10 cache contains an older modeled figure
          (<code>impact.json</code>: 13.2 hours from 12 minutes × 66 verified gaps). That model
          multiplied a per-gap assumption by the verified-gap count and subtracted no assisted
          review time, so Phase 14 does not surface it as a claim. This page computes its model
          from the single pure function in <code>lib/impact/model.ts</code>.
        </p>
      </section>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 font-medium" href="/evaluation">
          Benchmark proof
        </Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 font-medium" href="/methodology">
          Methodology
        </Link>
      </nav>
    </div>
  );
}
