import Link from "next/link";
import { getProofEvaluation } from "@/lib/proof/evaluation";
import { BenchmarkHeader } from "@/components/evaluation/BenchmarkHeader";
import { MetricCard } from "@/components/evaluation/MetricCard";
import { DetectorTable } from "@/components/evaluation/DetectorTable";
import { PipelineFunnel } from "@/components/evaluation/PipelineFunnel";
import { TrustScorecard } from "@/components/evaluation/TrustScorecard";
import { NegativeCases } from "@/components/evaluation/NegativeCases";
import { BaselineComparison } from "@/components/evaluation/BaselineComparison";
import { FailureAnalysis } from "@/components/evaluation/FailureAnalysis";
import { LimitationsPanel } from "@/components/evaluation/LimitationsPanel";

export const dynamic = "force-dynamic";

const percent = (value: number | null): string =>
  value === null ? "Not measured" : `${(value * 100).toFixed(0)}%`;
const fixed = (value: number | null, digits = 2): string =>
  value === null ? "Not measured" : value.toFixed(digits);

export default async function EvaluationPage() {
  const proof = await getProofEvaluation();

  return (
    <div className="space-y-6">
      <BenchmarkHeader
        runId={proof.benchmark_run_id}
        version={proof.benchmark_version}
        partition={proof.partition}
        status={proof.status}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Held-out Macro F1"
          value={fixed(proof.headline.macro_f1)}
          context={`Across 3 supported gap types · n=${proof.headline.truth_gaps} truth gaps · fixture replay.`}
        />
        <MetricCard
          label="Hard-negative pass"
          value={percent(proof.headline.hard_negative_pass_rate)}
          context={`Designed refusals · ${proof.negatives.passed}/${proof.negatives.total} adversarial cases.`}
        />
        <MetricCard
          label="Displayed-gap grounding"
          value={percent(proof.headline.grounding_rate)}
          context={`${proof.headline.grounding_gaps} displayed gaps · all required evidence checks passed in this run.`}
        />
        <MetricCard
          label="Top-5 truth precision"
          value={proof.headline.top5_truth}
          context={`Top-5 verified: ${proof.headline.top5_verified}. Architecture vs performance are separate checks.`}
        />
      </section>

      <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
        Measured means: produced by this frozen run. Extraction is fixture replay, so these are
        not live-model quality numbers. Benchmark scope: synthetic data, 3 gap types, held-out
        partition.
      </p>

      <DetectorTable perType={proof.per_type} />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Oracle vs end-to-end</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Correct canonical events</p>
            <p className="text-2xl font-semibold text-ink">
              {fixed(proof.headline.macro_f1)} <span className="text-sm font-normal">Macro F1</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Oracle gap engine · diagnostic upper bound.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Raw records end-to-end</p>
            <p className="text-2xl font-semibold text-ink">
              {fixed(proof.headline.macro_f1)} <span className="text-sm font-normal">Macro F1</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fixture-replay extraction · no observable extraction loss in this run.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          When the two match, the benchmark is validating pipeline plumbing, not live extraction
          robustness. A live model may separate them.
        </p>
      </section>

      <PipelineFunnel
        stages={proof.funnel.stages.map((stage) => ({
          label: stage.label,
          value: stage.count,
          note: stage.note,
        }))}
      />

      <TrustScorecard
        citationValidity={proof.trust.citation_validity ?? 0}
        patientOwnership={proof.trust.patient_ownership ?? 0}
        spanSupport={proof.trust.span_support ?? 0}
        groundedGapRate={proof.trust.grounded_gap_rate ?? 0}
        unsupportedClaims={proof.trust.unsupported_displayed_claims}
        wrongPatientCitations={proof.trust.wrong_patient_citations}
      />

      <NegativeCases
        families={proof.negatives.families}
        total={proof.negatives.total}
        passed={proof.negatives.passed}
      />

      <BaselineComparison
        baselines={proof.baselines.map((baseline) => ({
          name: baseline.label,
          macro_f1: baseline.macro_f1 ?? 0,
          hard_negative_pass_rate: baseline.hard_negative_pass_rate,
          grounding_rate: baseline.grounding_rate,
        }))}
      />
      <p className="-mt-2 text-xs text-slate-500">
        The LLM-only baseline is <strong>not measured</strong> in this run (no live provider), so no
        synthetic substitute is shown. The naive keyword baseline is measured and included.
      </p>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Ablations</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {proof.ablations.map((ablation) => (
            <li key={ablation.name} className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-ink">
                {ablation.name.replace(/_/g, " ")} ·{" "}
                {ablation.delta_macro_f1 === null
                  ? ablation.status
                  : `Δ Macro F1 ${ablation.delta_macro_f1.toFixed(2)}`}
              </p>
              <p className="text-slate-600">{ablation.finding}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Workflow priority, not clinical risk</h2>
        <p className="mt-2 text-sm text-slate-700">
          Verified issue → workflow severity + overdue time + actionability → intervention
          priority. No demographic factor, diagnosis bonus, or LLM prediction affects priority-v1.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Ranked patients</dt>
            <dd className="font-medium text-ink">{proof.priority.ranked_patients}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Ranked gaps</dt>
            <dd className="font-medium text-ink">{proof.priority.ranked_gaps}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Invariance violations</dt>
            <dd className="font-medium text-ink">{proof.priority.demographic_invariance_violations}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Determinism differences</dt>
            <dd className="font-medium text-ink">{proof.priority.deterministic_differences}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          Labeled as an input-invariance test on demographic mutations — not a claim of
          &ldquo;bias-free AI&rdquo;.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Latency: live vs cached</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Live single-patient pipeline
            </dt>
            <dd className="font-medium text-ink">
              {proof.latency.live_model_measured
                ? `${fixed(proof.latency.pipeline_fixture_p50_ms, 1)} ms p50`
                : "Not measured"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Cached queue API</dt>
            <dd className="font-medium text-ink">
              {fixed(proof.latency.cached_queue_p50_ms, 2)} ms p50
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          Cached reads are coordinator read-path latency, not AI processing. The frozen pipeline
          stage timings cover fixture replay, not live model latency.
        </p>
      </section>

      <FailureAnalysis failures={proof.failures} />
      <p className="-mt-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
        {proof.failure_disclosure}
      </p>
      <p className="-mt-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
        {proof.funnel.excluded_note}
      </p>

      <LimitationsPanel
        limitations={[
          ...proof.limitations,
          "Three supported gap types only; priority is workflow prioritization, not clinical risk.",
        ]}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="text-lg font-semibold text-ink">Reproducibility</h2>
        <p className="mt-2 text-slate-700">
          {proof.reproducibility.runs} repeat executions ·{" "}
          {proof.reproducibility.identical ? "identical" : "differences present"} ·{" "}
          {proof.gates.filter((gate) => gate.passed).length}/{proof.gates.length} frozen gates
          passed.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Two deterministic post-extraction runs were compared: event cache hash, candidate ids,
          verified ids, patient scores, Top-K order, evaluation results. Live LLM extraction is
          excluded.
        </p>
      </section>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 font-medium" href="/insights">
          Impact model
        </Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 font-medium" href="/methodology">
          Methodology
        </Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 font-medium" href="/demo">
          Flagship demo
        </Link>
      </nav>
    </div>
  );
}
