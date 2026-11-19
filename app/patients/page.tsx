"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/ui/api";
import type { PatientListResponse } from "@/lib/api/dto";
import { PriorityBadge } from "@/components/queue/PriorityBadge";

const GAP_TYPES = ["", "missed_followup", "duplicate_test", "med_monitoring"] as const;
const BANDS = ["", "P1", "P2", "P3", "P4", "NONE"] as const;

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [gapType, setGapType] = useState("");
  const [band, setBand] = useState("");
  const [data, setData] = useState<PatientListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .patients("demo", {
        query: query || undefined,
        gap_type: gapType || undefined,
        priority_band: band || undefined,
        sort: "priority",
        limit: 100,
      })
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [query, gapType, band]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">All patients</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data ? `${data.total} patients` : "Loading panel…"}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search patients</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patient"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <select
          value={gapType}
          onChange={(event) => setGapType(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          aria-label="Filter by gap type"
        >
          {GAP_TYPES.map((value) => (
            <option key={value || "all"} value={value}>
              {value ? value.replace("_", " ") : "All gap types"}
            </option>
          ))}
        </select>
        <select
          value={band}
          onChange={(event) => setBand(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          aria-label="Filter by priority band"
        >
          {BANDS.map((value) => (
            <option key={value || "all"} value={value}>
              {value ? value : "All priorities"}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Primary condition</th>
              <th className="px-4 py-3">Last contact</th>
              <th className="px-4 py-3">Verified issues</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Top issue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && data?.patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No patients match these filters.
                </td>
              </tr>
            ) : null}
            {data?.patients.map((patient) => (
              <tr key={patient.patient_id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/patients/${patient.patient_id}`} className="font-medium text-brand hover:underline">
                    {patient.display_name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {patient.age} · {patient.sex}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{patient.primary_condition}</td>
                <td className="px-4 py-3 text-slate-700">{patient.last_contact_date}</td>
                <td className="px-4 py-3 text-slate-700">{patient.verified_gap_count}</td>
                <td className="px-4 py-3">
                  <PriorityBadge band={patient.priority_band} label={patient.priority_label} />
                </td>
                <td className="px-4 py-3 text-slate-700">{patient.top_gap_type ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
