import { normalizeTestName } from "@/lib/normalization/aliases";
import { EVALUATION_AS_OF_DATE, DUPLICATE_WINDOW_DAYS, METFORMIN_WINDOW_DAYS, WARFARIN_WINDOW_DAYS, TAMOXIFEN_WINDOW_DAYS } from "./config";
import { addDays, daysBetween, isAfter, isBefore } from "./dates";
import type { GapType, TruthEvent } from "./types";

export interface DerivedGap {
  gap_type: GapType;
  trigger_event_id: string;
  source_doc_ids: string[];
  window_days: number;
}

function testKey(event: TruthEvent): string | null {
  if (event.event_type === "lab_result") {
    const raw = event.typed["test_name_raw"];
    if (typeof raw === "string") {
      const normalized = normalizeTestName(raw);
      if (normalized) return `lab:${normalized}`;
    }
    const normalizedField = event.typed["test_name_normalized"];
    return typeof normalizedField === "string" ? `lab:${normalizedField.toLowerCase()}` : null;
  }
  if (event.event_type === "imaging") {
    const modality = String(event.typed["modality"] ?? "").toLowerCase();
    const region = String(event.typed["body_region"] ?? "").toLowerCase();
    if (!modality || !region) return null;
    return `imaging:${modality}:${region}`;
  }
  return null;
}

function deriveMissedFollowups(events: TruthEvent[], asOf: string): DerivedGap[] {
  const gaps: DerivedGap[] = [];
  for (const referral of events.filter((event) => event.event_type === "referral")) {
    const status = referral.typed["status"];
    if (status === "completed") continue;
    const specialty = String(referral.typed["specialty"] ?? referral.specialty ?? "");
    const windowDays = Number(referral.window_days ?? referral.typed["expected_window_days"] ?? 30);
    const due = addDays(referral.date, windowDays);
    if (!isAfter(asOf, due)) continue;

    const satisfied = events.some((event) => {
      if (event.event_type !== "consult" && event.event_type !== "followup") return false;
      const eventSpecialty = String(event.typed["specialty"] ?? event.specialty ?? "");
      if (eventSpecialty !== specialty) return false;
      return !isBefore(event.date, referral.date) && !isAfter(event.date, due);
    });
    if (!satisfied) {
      gaps.push({
        gap_type: "missed_followup",
        trigger_event_id: referral.event_id,
        source_doc_ids: [referral.source_doc_id],
        window_days: windowDays,
      });
    }
  }
  return gaps;
}

function deriveDuplicates(events: TruthEvent[]): DerivedGap[] {
  const groups = new Map<string, TruthEvent[]>();
  for (const event of events) {
    const key = testKey(event);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  const gaps: DerivedGap[] = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    for (let i = 0; i < sorted.length; i += 1) {
      const a = sorted[i] as TruthEvent;
      if (a.series_status === "explicit_series") continue;
      for (let j = i + 1; j < sorted.length; j += 1) {
        const b = sorted[j] as TruthEvent;
        if (b.series_status === "explicit_series") continue;
        const delta = daysBetween(a.date, b.date);
        if (delta > DUPLICATE_WINDOW_DAYS) break;
        const sameDaySameProvider =
          delta === 0 && a.provider_id === b.provider_id && a.source_doc_id === b.source_doc_id;
        if (sameDaySameProvider) continue;
        gaps.push({
          gap_type: "duplicate_test",
          trigger_event_id: a.event_id,
          source_doc_ids: [a.source_doc_id, b.source_doc_id],
          window_days: DUPLICATE_WINDOW_DAYS,
        });
        break;
      }
      if (gaps.some((gap) => gap.trigger_event_id === a.event_id)) break;
    }
  }
  return gaps;
}

const DRUG_WINDOWS: Record<string, { labs: string[]; window: number }> = {
  metformin: { labs: ["a1c", "bmp"], window: METFORMIN_WINDOW_DAYS },
  warfarin: { labs: ["inr"], window: WARFARIN_WINDOW_DAYS },
  tamoxifen: { labs: ["oncology_consult"], window: TAMOXIFEN_WINDOW_DAYS },
  anastrozole: { labs: ["oncology_consult"], window: TAMOXIFEN_WINDOW_DAYS },
};

function deriveMonitoring(events: TruthEvent[], asOf: string): DerivedGap[] {
  const gaps: DerivedGap[] = [];
  const starts = events.filter((event) => event.event_type === "medication_start");

  for (const start of starts) {
    const drug = String(start.typed["drug_normalized"] ?? start.typed["drug_raw"] ?? "").toLowerCase();
    const policy = DRUG_WINDOWS[drug];
    if (!policy) continue;

    const due = addDays(start.date, policy.window);
    if (!isAfter(asOf, due)) continue;

    const stopped = events.some((event) => {
      if (event.event_type !== "medication_stop") return false;
      const stopDrug = String(event.typed["drug_normalized"] ?? event.typed["drug_raw"] ?? "").toLowerCase();
      return stopDrug === drug && !isAfter(event.date, due);
    });
    if (stopped) continue;

    if (drug === "tamoxifen" || drug === "anastrozole") {
      const consult = events.some(
        (event) =>
          (event.event_type === "consult" || event.event_type === "followup") &&
          String(event.typed["specialty"] ?? event.specialty ?? "") === "oncology" &&
          !isBefore(event.date, start.date) &&
          !isAfter(event.date, due),
      );
      if (!consult) {
        gaps.push({
          gap_type: "med_monitoring",
          trigger_event_id: start.event_id,
          source_doc_ids: [start.source_doc_id],
          window_days: policy.window,
        });
      }
      continue;
    }

    const satisfied = events.some((event) => {
      if (event.event_type !== "lab_result") return false;
      const raw = event.typed["test_name_raw"];
      const normalized =
        typeof raw === "string" ? normalizeTestName(raw) : (event.typed["test_name_normalized"] as string | undefined);
      if (!normalized || !policy.labs.includes(normalized)) return false;
      return !isBefore(event.date, start.date) && !isAfter(event.date, due);
    });

    if (!satisfied) {
      gaps.push({
        gap_type: "med_monitoring",
        trigger_event_id: start.event_id,
        source_doc_ids: [start.source_doc_id],
        window_days: policy.window,
      });
    }
  }
  return gaps;
}

export function deriveGaps(events: TruthEvent[], asOf: string = EVALUATION_AS_OF_DATE): DerivedGap[] {
  const byPatient = new Map<string, TruthEvent[]>();
  for (const event of events) {
    const list = byPatient.get(event.patient_id) ?? [];
    list.push(event);
    byPatient.set(event.patient_id, list);
  }

  const gaps: DerivedGap[] = [];
  for (const patientEvents of byPatient.values()) {
    gaps.push(
      ...deriveMissedFollowups(patientEvents, asOf),
      ...deriveDuplicates(patientEvents),
      ...deriveMonitoring(patientEvents, asOf),
    );
  }
  return gaps;
}

export function gapSignature(gap: { gap_type: GapType; trigger_event_id: string }): string {
  return `${gap.gap_type}:${gap.trigger_event_id}`;
}
