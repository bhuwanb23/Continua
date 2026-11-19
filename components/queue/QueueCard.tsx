"use client";

import Link from "next/link";
import type { QueueItem } from "@/components/queue/PriorityBadge";
import { PriorityBadge } from "@/components/queue/PriorityBadge";
import { SafetyNote } from "@/components/safety/SafetyNote";

export function QueueCard({ item }: { item: QueueItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            #{item.rank} priority
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{item.display_name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {item.verified_gap_count} verified coordination issue{item.verified_gap_count === 1 ? "" : "s"}
          </p>
        </div>
        <PriorityBadge band={item.priority_band} label={item.priority_label} />
        <SafetyNote kind="priority" className="mt-2" />
      </div>
      <div className="mt-3">
        <p className="font-medium text-ink">{item.headline}</p>
        <p className="mt-1 text-sm text-slate-600">{item.recommended_coordinator_action}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-teal-700">
          <span aria-hidden>✓</span> Verified evidence
        </span>
        <Link
          href={`/patients/${item.patient_id}`}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Review patient
        </Link>
      </div>
    </article>
  );
}
