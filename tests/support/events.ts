import type { TruthEvent } from "@/lib/generator/types";

let counter = 0;

export function event(partial: Partial<TruthEvent> & Pick<TruthEvent, "event_type" | "date" | "typed">): TruthEvent {
  counter += 1;
  return {
    event_id: `event-${counter}`,
    patient_id: "patient-1",
    date: partial.date,
    event_type: partial.event_type,
    description: partial.description ?? partial.event_type,
    provider_id: partial.provider_id ?? "provider-1",
    provider: partial.provider ?? "Dr. Test",
    provider_type: partial.provider_type ?? "pcp",
    specialty: partial.specialty ?? null,
    window_days: partial.window_days ?? null,
    typed: partial.typed,
    source_doc_id: partial.source_doc_id ?? `doc-${counter}`,
    source_span: partial.source_span ?? "span",
    confidence: partial.confidence ?? 0.95,
    series_status: partial.series_status ?? "unknown",
    scenario_id: partial.scenario_id ?? "T01",
    date_precision: partial.date_precision ?? "day",
  };
}

export function referral(date: string, windowDays = 45, specialty = "oncology"): TruthEvent {
  return event({
    event_type: "referral",
    date,
    specialty,
    window_days: windowDays,
    typed: { specialty, expected_window_days: windowDays, status: "placed" },
  });
}

export function consult(date: string, specialty = "oncology"): TruthEvent {
  return event({
    event_type: "consult",
    date,
    specialty,
    typed: { specialty, completed: true },
  });
}

export function lab(date: string, test: string, series: "unknown" | "explicit_series" = "unknown"): TruthEvent {
  return event({
    event_type: "lab_result",
    date,
    typed: { test_name_raw: test, test_name_normalized: test.toLowerCase(), series_status: series },
    series_status: series,
  });
}

export function imaging(date: string, modality: string, region: string): TruthEvent {
  return event({
    event_type: "imaging",
    date,
    typed: { modality, body_region: region, series_status: "unknown" },
  });
}

export function medStart(date: string, drug: string): TruthEvent {
  return event({
    event_type: "medication_start",
    date,
    typed: { drug_raw: drug, drug_normalized: drug },
  });
}

export function medStop(date: string, drug: string): TruthEvent {
  return event({
    event_type: "medication_stop",
    date,
    typed: { drug_raw: drug, drug_normalized: drug },
  });
}
