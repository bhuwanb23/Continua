"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/ui/api";
import type {
  EvidenceResponse,
  GapSummary,
  PatientResponse,
  TimelineResponse,
} from "@/lib/api/dto";
import { PriorityBadge } from "@/components/queue/PriorityBadge";
import { SafetyNote } from "@/components/safety/SafetyNote";
import { createLatestRequestGuard } from "@/lib/ui/latest-request";

export default function PatientWorkspace() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [gaps, setGaps] = useState<GapSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const evidenceGuard = useRef(createLatestRequestGuard());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPatient(null);
    setTimeline(null);
    setGaps([]);
    setEvidence(null);
    setEvidenceError(null);
    Promise.all([api.patient(patientId), api.timeline(patientId), api.gaps(patientId)])
      .then(([p, t, g]) => {
        if (cancelled) return;
        setPatient(p);
        setTimeline(t);
        setGaps(g.gaps);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, reloadKey]);

  useEffect(() => {
    const guard = evidenceGuard.current;
    return () => guard.cancel();
  }, []);

  async function openEvidence(gapId: string) {
    const token = evidenceGuard.current.begin();
    setEvidenceLoading(true);
    setEvidenceError(null);
    setEvidence(null);
    try {
      const response = await fetch(`/api/v1/evidence/${gapId}`, { signal: token.signal });
      if (!token.isCurrent()) return;
      if (!response.ok) {
        setEvidenceError("Evidence couldn't be loaded. Try again.");
        return;
      }
      const body = (await response.json()) as EvidenceResponse;
      if (token.isCurrent()) setEvidence(body);
    } catch (err) {
      if (!token.isCurrent()) return;
      if (err instanceof Error && err.name === "AbortError") return;
      setEvidenceError("Evidence couldn't be loaded. Try again.");
    } finally {
      if (token.isCurrent()) setEvidenceLoading(false);
    }
  }

  async function recordAction(gapId: string, action: "acknowledged" | "contacted" | "reviewed") {
    setActionStatus(null);
    try {
      const response = await fetch(`/api/v1/gaps/${gapId}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      setActionStatus(
        response.ok
          ? `Recorded: ${body.action}`
          : `Couldn't save workflow status. ${body?.error?.code ?? response.status}`,
      );
    } catch {
      setActionStatus("Couldn't save workflow status. Existing verified issues are unchanged.");
    }
  }

  if (loading) return <p className="text-slate-500">Loading patient…</p>;
  if (error || !patient) {
    return (
      <div className="space-y-3">
        <Link href="/patients" className="text-sm text-brand hover:underline">
          ← Back to patients
        </Link>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p>Could not load patient. {error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-3 rounded-md border border-red-300 px-3 py-1.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const p = patient.patient;

  return (
    <div className="space-y-6">
      <Link href="/patients" className="text-sm text-brand hover:underline">
        ← Back to patients
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{p.display_name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {p.age} · {p.sex} · {p.primary_condition.replace("_", " ")}
            </p>
            <p className="mt-1 text-sm text-slate-600">Last available record: {p.last_contact_date}</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <PriorityBadge band={p.priority_band} label={p.priority_label} />
            <p className="text-sm text-slate-600">{p.verified_gap_count} verified coordination issue{p.verified_gap_count === 1 ? "" : "s"}</p>
          </div>
        </div>
        {p.priority_breakdown ? (
          <details className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-ink">Why this priority</summary>
            <div className="mt-2 grid gap-1 text-slate-700">
              <p>Top gap raw score: {p.priority_breakdown.top_gap_raw_score}</p>
              <p>Top gap overdue days: {p.priority_breakdown.top_gap_overdue_days ?? "—"}</p>
              <p>Secondary gaps: {p.priority_breakdown.secondary_gap_count}</p>
              <p>Secondary bonus: {p.priority_breakdown.secondary_bonus.toFixed(4)}</p>
              <p>Patient raw score: {p.priority_breakdown.patient_raw_score}</p>
            </div>
          </details>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Patient journey</h2>
          <p className="mt-1 text-sm text-slate-500">Canonical event order</p>
          <ol className="mt-4 space-y-3">
            {timeline?.events.map((event) => (
              <li key={event.event_id} className="border-l-2 border-slate-200 pl-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {event.date} · {event.event_type.replace("_", " ")}
                </p>
                <p className="mt-0.5 text-sm text-ink">{event.description}</p>
                {event.provider ? (
                  <p className="mt-0.5 text-xs text-slate-500">{event.provider}</p>
                ) : null}
              </li>
            ))}
            {timeline && timeline.events.length === 0 ? (
              <li className="text-sm text-slate-500">No events recorded.</li>
            ) : null}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">Verified issues</h2>
          {gaps.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              No verified continuity issues found.
            </div>
          ) : null}
          {gaps.map((gap) => (
            <article key={gap.gap_id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{gap.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{gap.summary}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {gap.workflow_severity}
                </span>
                <SafetyNote kind="gap_card" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <PriorityBadge band={gap.priority_band} label={gap.priority_label} />
                <span>Score {gap.gap_priority_score}</span>
                <span>· {gap.evidence_count} evidence sources</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{gap.recommended_coordinator_action}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEvidence(gap.gap_id)}
                  aria-haspopup="dialog"
                  aria-expanded={evidence !== null}
                  aria-controls="evidence-drawer"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  {evidenceLoading ? "Loading…" : "View evidence"}
                </button>
                {(["acknowledged", "contacted", "reviewed"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => recordAction(gap.gap_id, action)}
                    className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {actionStatus ? <p role="status" className="text-sm text-teal-700">{actionStatus}</p> : null}
          {evidenceError ? (
            <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {evidenceError}
            </div>
          ) : null}
        </section>
      </div>

      {evidenceLoading ? (
        <div
          id="evidence-drawer-loading"
          role="status"
          aria-live="polite"
          className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600"
        >
          Loading evidence…
        </div>
      ) : null}

      {evidence ? (
        <div
          id="evidence-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence drawer"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setEvidence(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEvidence(null);
          }}
        >
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-ink">Evidence</h2>
              <button
                type="button"
                onClick={() => setEvidence(null)}
                autoFocus
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                aria-label="Close evidence"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {evidence.verification_status}
            </p>
            <h3 className="mt-4 text-sm font-semibold text-ink">Claims</h3>
            <ul className="mt-2 space-y-2">
              {evidence.claims.map((claim, index) => (
                <li key={index} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="font-medium text-ink">{claim.claim}</p>
                  <p className="text-slate-600">
                    {String(claim.value ?? "—")} · {claim.status}
                  </p>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-ink">Sources</h3>
            <ul className="mt-2 space-y-3">
              {evidence.sources.map((source, index) => (
                <li key={index} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="font-medium text-ink">
                    {source.document_type} · {source.date}
                  </p>
                  <p className="text-slate-600">{source.provider ?? "Unknown provider"}</p>
                  <blockquote className="mt-2 border-l-2 border-teal-200 pl-3 text-slate-700">
                    {source.quoted_span}
                  </blockquote>
                  <p className="mt-2 text-xs text-slate-500">{source.source_excerpt}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3"><SafetyNote kind="evidence_drawer" /></div>
            <h3 className="mt-4 text-sm font-semibold text-ink">Absence checks</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {evidence.absence_checks.map((check, index) => (
                <li key={index} className="rounded-lg border border-slate-100 p-3">
                  {check.description} · {check.matching_event_count} matches · {check.status}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-ink">Policy checks</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {evidence.policy_checks.map((check, index) => (
                <li key={index} className="rounded-lg border border-slate-100 p-3">
                  {check.policy} · {check.status} · {check.detail ?? ""}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
