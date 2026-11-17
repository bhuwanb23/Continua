# Phase 4 — Canonical Clinical Event Model

> Depends on: Phase 1 (types, scaffold), Phase 3 (event labels) · Unblocks: Phase 5, 6
> Gate: **schema and normalization tests pass**

## Objective

Define the vocabulary the rest of Continua speaks. If two stages disagree about what a "referral" is, every downstream number is noise.

## Sub-phases

### 4.1 Event types and base shape

Implement `ClinicalEvent` exactly as frozen in `clinical-event-schema.md`:

```ts
type EventType =
  | "surgery" | "imaging" | "consult" | "lab_result"
  | "medication_start" | "medication_stop" | "referral" | "followup";

interface ClinicalEvent {
  event_id: string;      // deterministic from (patient, doc, type, date)
  patient_id: string;
  date: string;          // YYYY-MM-DD
  date_precision?: "day" | "month";
  event_type: EventType;
  description: string;   // <= 200 chars
  provider: string;
  provider_type: "pcp" | "specialist" | "lab" | "imaging" | "pharmacy" | "other";
  source_doc_id: string; // required
  source_span: string;   // required, verbatim
  confidence: number;    // 0..1
  phase: string;
  typed: SurgeryFields | ImagingFields | ConsultFields | LabFields
       | MedicationFields | ReferralFields | FollowupFields;
}
```

### 4.2 Typed fields per event type

- `surgery` → procedure, site, outcome
- `imaging` → modality, body_region, result_summary, `series_status`
- `consult` → specialty (normalized), clinician, summary, completed
- `lab_result` → test_name_raw, test_name_normalized, value, unit, abnormal, `series_status`
- `medication_start` / `_stop` → drug_raw, drug_normalized, dose, route, reason
- `referral` → specialty (normalized), reason, expected_window_days, status
- `followup` → topic, status

`series_status` is `explicit_series | explicit_one_off | unknown` and is set only from explicit document text. Default `unknown`.

### 4.3 Normalization maps (code, not LLM)

- `lib/normalization/test-aliases.ts` — "CBC" / "CBC w/ diff" / "Complete Blood Count" → `cbc`; "A1c" / "HbA1c" / "Hemoglobin A1c" → `a1c`; BMP, CMP, INR, TSH, etc.
- `lib/normalization/drugs.ts` — lowercase, strip dose/strength, brand→generic where known.
- `lib/normalization/specialties.ts` — "Medical Oncology" / "Heme-Onc" → `oncology`; "Cardiology" → `cardiology`.
- `lib/normalization/dates.ts` — parse the messy inbound formats to ISO; reject implausible dates.
- Each map has a unit test with the aliases that appear in the dataset.

### 4.4 Validation layer

`lib/normalization/validateEvent.ts` enforces:

- Enum membership for `event_type`, `provider_type`, `series_status`.
- `source_doc_id` exists in the patient's records.
- `source_span` is a substring (fuzzy ≥ 0.85) of the source text.
- `date` valid and within 1900 → today+1.
- `confidence` in [0,1]; `description` non-empty.

Invalid events are **dropped**, never repaired silently, and logged to a structured drop log.

### 4.5 Event store

- `lib/events/store.ts` — in-memory store keyed by patient, sorted by date, deduped by `event_id`.
- `getEvents(patientId)`, `getEventsByType(patientId, type)`, `getEventsInWindow(patientId, type, start, end)`.
- Detectors read **only** from this store. No detector may touch raw text.

### 4.6 Fixture corpus

- `tests/fixtures/events/` — hand-built events for each detector scenario (completed referral, wrong specialty, explicit series, not-yet-elapsed window, etc.).
- These fixtures let Phase 6 tests run before extraction exists.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/types.ts` (event portion) | canonical shape |
| `lib/normalization/*.ts` | alias/drug/specialty/date maps |
| `lib/normalization/validateEvent.ts` | validation + drop logging |
| `lib/events/store.ts` | deduped, sorted access layer |
| `tests/fixtures/events/*.json` | detector test fixtures |

## Gate — exit criteria

- [ ] `npm run test` covers every normalization map with real dataset aliases.
- [ ] An event with a missing/invalid `source_doc_id` is rejected by validation (test).
- [ ] An event with a fabricated span is rejected (test).
- [ ] Store returns events in ascending date order, deduped (test).
- [ ] No module outside `lib/normalization` and `lib/extraction` references raw `records[].text` for clinical logic.
- [ ] Schema naming matches `clinical-event-schema.md` exactly.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Normalization creeping into the LLM | Maps are pure functions with tests; prompt never asked to normalize |
| Silent repair of bad events | Validation drops + logs; never guesses |
| Detector reaching into raw text | Store is the only interface; enforced by review + a grep check |

## Handoff to Phase 5

Phase 5's extractor must emit exactly this shape. If extraction needs a new field, the schema changes here first (and re-freezes), not in the prompt.
