"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  EvaluationResponse,
  EvidenceResponse,
  GapsResponse,
  PanelResponse,
  PatientResponse,
  QueueResponse,
  TimelineResponse,
} from "@/lib/api/dto";
import { api } from "@/lib/ui/api";
import { FLAGSHIP_GAP_ID, FLAGSHIP_PATIENT_ID, SCENE_COUNT, SCENES } from "@/lib/demo/flagship";
import { clampScene, focusTargetForScene, routeForScene } from "@/lib/demo/steps";
import { preloadDemo } from "@/lib/demo/preload";
import { persistScene, readPersistedScene, resetDemoState } from "@/lib/demo/reset";
import { validateDemo, type DemoCheck } from "@/lib/demo/validate";
import { DemoController } from "@/components/demo/DemoController";
import { DemoFocus } from "@/components/demo/DemoFocus";
import { DemoFallback } from "@/components/demo/DemoFallback";
import { PriorityBadge } from "@/components/queue/PriorityBadge";

interface DemoData {
  panel: PanelResponse;
  queue: QueueResponse;
  patient: PatientResponse;
  timeline: TimelineResponse;
  gaps: GapsResponse;
  evaluation: EvaluationResponse;
}

export function DemoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scene, setScene] = useState(1);
  const [data, setData] = useState<DemoData | null>(null);
  const [failure, setFailure] = useState<{ reason: string; checks?: DemoCheck[] } | null>(null);
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailure(null);
    try {
      const [panel, queue, patient, timeline, gaps, evaluation] = await Promise.all([
        api.panel(),
        api.queue("demo", 5),
        api.patient(FLAGSHIP_PATIENT_ID),
        api.timeline(FLAGSHIP_PATIENT_ID),
        api.gaps(FLAGSHIP_PATIENT_ID),
        api.evaluation(),
      ]);
      setData({ panel, queue, patient, timeline, gaps, evaluation });
    } catch (error) {
      const validation = await validateDemo().catch(() => null);
      setFailure({
        reason: error instanceof Error ? error.message : "Flagshship data could not be loaded.",
        ...(validation ? { checks: validation.checks } : {}),
      });
    }
  }, []);

  useEffect(() => {
    setScene(readPersistedScene());
    void preloadDemo();
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      resetDemoState();
      setEvidence(null);
      setEvidenceError(null);
      setScene(1);
      router.replace("/demo");
    }
  }, [searchParams, router]);

  useEffect(() => {
    persistScene(scene);
  }, [scene]);

  const goNext = useCallback(() => setScene((value) => clampScene(value + 1)), []);
  const goPrev = useCallback(() => setScene((value) => clampScene(value - 1)), []);
  const reset = useCallback(() => {
    resetDemoState();
    setEvidence(null);
    setEvidenceError(null);
    setScene(1);
  }, []);

  const flagshipGap = useMemo(
    () => data?.gaps.gaps.find((gap) => gap.gap_id === FLAGSHIP_GAP_ID) ?? null,
    [data],
  );

  async function openEvidence() {
    if (evidence) return;
    setEvidenceError(null);
    try {
      setEvidence(await api.evidence(FLAGSHIP_GAP_ID));
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : "Evidence could not be loaded.");
    }
  }

  const current = SCENES[scene - 1]!;

  return (
    <div className="space-y-5 pb-28">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Demo mode</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Continua flagship experience</h1>
        <p className="mt-1 text-sm text-slate-600">
          Six scenes over the real product. ← → to move, R to reset, N to read the next line.
          Nothing here changes data, rank, or gap status.
        </p>
      </header>

      <section aria-live="polite" className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Scene {current.id} · {current.kicker}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{current.title}</h2>
        <p className="mt-2 max-w-3xl text-slate-800">&ldquo;{current.spoken}&rdquo;</p>
        {current.caption ? (
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{current.caption}</p>
        ) : null}
      </section>

      {failure ? (
        <DemoFallback
          reason={failure.reason}
          {...(failure.checks ? { checks: failure.checks } : {})}
          onRetry={load}
        />
      ) : null}

      {!data && !failure ? <p className="text-slate-500">Loading flagship data…</p> : null}

      {data && scene === 1 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Sarah&apos;s panel today</p>
          <p className="mt-1 text-3xl font-semibold text-ink">
            {data.panel.panel.patient_count} patients
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {data.panel.panel.patients_with_verified_gaps} have at least one verified continuity
            issue. All data is synthetic and frozen for this demo.
          </p>
        </section>
      ) : null}

      {data && scene === 2 ? (
        <DemoFocus anchor="queue" active={focusTargetForScene(scene) === "queue"}>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-semibold text-ink">
                {data.queue.items.length}
              </span>
              <span className="text-slate-600">review first, out of {data.panel.panel.patient_count}</span>
            </div>
            <ol className="mt-4 space-y-2">
              {data.queue.items.map((item) => (
                <li key={item.patient_id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">
                      <span className="text-slate-400">{item.rank}.</span> {item.display_name}
                    </span>
                    <PriorityBadge band={item.priority_band} label={item.priority_label} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.headline}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.verified_gap_count} verified gap
                    {item.verified_gap_count === 1 ? "" : "s"} · score {item.patient_priority_score}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </DemoFocus>
      ) : null}

      {data && scene === 3 ? (
        <DemoFocus anchor="timeline" active>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">
              {data.patient.patient.display_name} · {data.patient.patient.age} ·{" "}
              {data.patient.patient.sex} · {data.patient.patient.primary_condition.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.timeline.events.length} reconstructed events ·{" "}
              {data.patient.patient.verified_gap_count} verified gaps · panel rank{" "}
              {data.patient.patient.priority_rank ?? "—"}
            </p>
            <ol className="mt-4 space-y-2">
              {data.timeline.events.slice(0, 10).map((event) => (
                <li key={event.event_id} className="border-l-2 border-slate-200 pl-3 text-sm">
                  <span className="font-medium text-ink">{event.date}</span>{" "}
                  <span className="text-slate-600">{event.event_type.replace(/_/g, " ")}</span>
                  {event.provider ? <span className="text-slate-500"> · {event.provider}</span> : null}
                  <p className="text-slate-600">{event.description}</p>
                </li>
              ))}
            </ol>
            {data.timeline.events.length > 10 ? (
              <p className="mt-3 text-xs text-slate-500">
                Showing 10 of {data.timeline.events.length} events. The full timeline is unchanged in
                the patient workspace.
              </p>
            ) : null}
          </section>
        </DemoFocus>
      ) : null}

      {data && scene === 4 && flagshipGap ? (
        <DemoFocus anchor="flagship-gap" active>
          <section className="rounded-xl border-2 border-teal-300 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-ink">{flagshipGap.title}</h3>
              <PriorityBadge band={flagshipGap.priority_band} label={flagshipGap.priority_label} />
            </div>
            <p className="mt-2 text-slate-700">{flagshipGap.summary}</p>
            <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
              Coordinator action: {flagshipGap.recommended_coordinator_action}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Maria is at panel rank {data.patient.patient.priority_rank ?? "—"}. She is not #1 and
              the demo never claims she is; she is one real verified gap in the frozen panel.
            </p>
            <button
              type="button"
              onClick={openEvidence}
              className="mt-3 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white"
            >
              View evidence
            </button>
          </section>
        </DemoFocus>
      ) : null}

      {data && scene === 5 && flagshipGap ? (
        <DemoFocus anchor="evidence" active>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            {!evidence ? (
              <>
                <p className="text-slate-700">
                  One click turns the assertion into something inspectable: source, window, and the
                  absence check behind it.
                </p>
                <button
                  type="button"
                  onClick={openEvidence}
                  className="mt-3 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white"
                >
                  View evidence for {flagshipGap.title}
                </button>
                {evidenceError ? (
                  <p className="mt-2 text-sm text-rose-700">{evidenceError}</p>
                ) : null}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink">Evidence · {flagshipGap.title}</h3>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                    {evidence.verification_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source
                  </p>
                  {evidence.sources.map((source) => (
                    <blockquote
                      key={source.document_id}
                      className="mt-1 border-l-2 border-slate-300 pl-3 text-sm text-slate-700"
                    >
                      &ldquo;{source.quoted_span}&rdquo;
                      <footer className="mt-1 text-xs text-slate-500">
                        {source.provider ?? "Unknown provider"} · {source.document_type.replace(/_/g, " ")}{" "}
                        · {source.date} · {source.verification_method}
                      </footer>
                    </blockquote>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Window and absence check
                  </p>
                  {evidence.absence_checks.map((check) => (
                    <div key={check.description} className="mt-1 text-sm text-slate-700">
                      <p>{check.description}</p>
                      <p className="text-xs text-slate-500">
                        {check.window_start ?? "—"} → {check.window_end ?? "—"} · matching events:{" "}
                        {check.matching_event_count} · {check.status}
                      </p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Policy
                  </p>
                  {evidence.policy_checks.map((check) => (
                    <p key={check.policy} className="mt-1 text-sm text-slate-700">
                      {check.policy} · {check.status}
                      {check.detail ? ` · ${check.detail}` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>
        </DemoFocus>
      ) : null}

      {data && scene === 6 ? (
        <DemoFocus anchor="evaluation" active>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-ink">Hybrid architecture</h3>
            <ol className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="rounded-lg bg-slate-50 p-3">Records → ClinicalEvent v1 (LLM extracts facts)</li>
              <li className="rounded-lg bg-slate-50 p-3">Typed events → deterministic gap rules</li>
              <li className="rounded-lg bg-slate-50 p-3">Evidence verification → only verified gaps shown</li>
              <li className="rounded-lg bg-slate-50 p-3">Intervention priority → ranked review queue</li>
            </ol>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Held-out Macro F1</p>
                <p className="text-xl font-semibold text-ink">
                  {(data.evaluation.evaluation.end_to_end?.macro_f1 as number | null)?.toFixed(2) ??
                    "Not measured"}
                </p>
                <p className="text-xs text-slate-500">41 truth gaps · fixture replay</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Hard-negative pass</p>
                <p className="text-xl font-semibold text-ink">
                  {(() => {
                    const rate = data.evaluation.evaluation.hard_negatives?.verified_pass_rate as
                      | number
                      | null
                      | undefined;
                    return rate === null || rate === undefined
                      ? "Not measured"
                      : `${(rate * 100).toFixed(0)}%`;
                  })()}
                </p>
                <p className="text-xs text-slate-500">29 adversarial cases</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Frozen synthetic benchmark · {data.evaluation.evaluation.benchmark_version} ·{" "}
              {data.evaluation.evaluation.benchmark_run_id} · status{" "}
              {data.evaluation.evaluation.status}. Measured numbers, not live-model quality.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {data.evaluation.evaluation.limitations.slice(0, 3).map((limitation) => (
                <li key={limitation}>· {limitation}</li>
              ))}
            </ul>
            <a
              href="/evaluation"
              className="mt-4 inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Open the full evaluation
            </a>
          </section>
        </DemoFocus>
      ) : null}

      {data && scene > 1 && scene < 6 ? (
        <p className="text-xs text-slate-500">
          Real screen for this scene:{" "}
          <a className="underline" href={routeForScene(scene)}>
            {routeForScene(scene)}
          </a>
        </p>
      ) : null}

      <DemoController
        scene={scene}
        total={SCENE_COUNT}
        onPrev={goPrev}
        onNext={goNext}
        onReset={reset}
      />
    </div>
  );
}
