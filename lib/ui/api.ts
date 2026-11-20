import type {
  EvaluationResponse,
  EvidenceResponse,
  GapSummary,
  GapsResponse,
  ImpactMetric,
  MetricsResponse,
  PanelResponse,
  PatientListResponse,
  PatientResponse,
  QueueResponse,
  TimelineResponse,
} from "@/lib/api/dto";

const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"
    : "";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${body.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

export const api = {
  panel: (panelId = "demo") => get<PanelResponse>(`/api/v1/panels/${panelId}`),
  patients: (panelId = "demo", params?: { query?: string | undefined; gap_type?: string | undefined; priority_band?: string | undefined; sort?: string | undefined; limit?: number | undefined; offset?: number | undefined }) => {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.gap_type) search.set("gap_type", params.gap_type);
    if (params?.priority_band) search.set("priority_band", params.priority_band);
    if (params?.sort) search.set("sort", params.sort);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));
    const qs = search.toString();
    return get<PatientListResponse>(`/api/v1/panels/${panelId}/patients${qs ? `?${qs}` : ""}`);
  },
  queue: (panelId = "demo", k = 5) => get<QueueResponse>(`/api/v1/panels/${panelId}/queue?k=${k}`),
  patient: (patientId: string) => get<PatientResponse>(`/api/v1/patients/${patientId}`),
  timeline: (patientId: string) => get<TimelineResponse>(`/api/v1/patients/${patientId}/timeline`),
  gaps: (patientId: string) => get<GapsResponse>(`/api/v1/patients/${patientId}/gaps`),
  evidence: (gapId: string) => get<EvidenceResponse>(`/api/v1/evidence/${gapId}`),
  metrics: (panelId = "demo") => get<MetricsResponse>(`/api/v1/metrics?panelId=${panelId}`),
  evaluation: () => get<EvaluationResponse>("/api/v1/evaluation"),
};

export type { GapSummary, ImpactMetric };
