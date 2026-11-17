# Clinical Event Schema — Continua

This is the **exact JSON contract** emitted by the LLM extraction stage (Stage B) and consumed by all downstream deterministic stages. Extraction outputs only this schema; no free text.

## Top-level extraction output

```json
{
  "patient_id": "uuid",
  "events": [ /* ClinicalEvent[] */ ],
  "extraction_confidence": 0.0,
  "notes": "optional short extractor note (no clinical judgment)"
}
```

## ClinicalEvent (base)

```json
{
  "event_id": "uuid (deterministic, seeded)",
  "patient_id": "uuid",
  "date": "YYYY-MM-DD",
  "event_type": "surgery | imaging | consult | lab_result | medication_start | medication_stop | referral | followup",
  "description": "short factual description, <= 200 chars",
  "provider": "Dr. L. Chen — Oncology",
  "provider_type": "pcp | specialist | lab | imaging | pharmacy | other",
  "source_doc_id": "uuid (required, must exist in records)",
  "source_span": "verbatim quoted span from source doc, <= 300 chars",
  "confidence": 0.0,
  "phase": "Surgery | Radiology | Oncology | Labs | Medications | Follow-up",
  "typed": { /* event-type-specific fields, see below */ }
}
```

### Field rules

- `event_id`: deterministic UUID derived from (patient_id, source_doc_id, event_type, date) so re-runs match.
- `date`: ISO `YYYY-MM-DD`. If only month/year known, use first of month and set `date_precision: "month"`.
- `source_doc_id`: **required**. Extraction must omit any event it cannot tie to a source doc.
- `source_span`: verbatim substring of the source doc text (used for grounding verification).
- `confidence`: 0.0–1.0 extraction confidence. Used in priority engine.
- `phase`: UI grouping label; derived deterministically from event_type if LLM omits.

## Typed fields by event_type

### surgery
```json
{ "procedure": "string", "site": "string?", "outcome": "string?" }
```

### imaging
```json
{ "modality": "CT | MRI | X-ray | PET | mammogram | ultrasound | other",
  "body_region": "string",
  "result_summary": "string (factual, from doc)",
  "series_status": "explicit_series | explicit_one_off | unknown" }
```

### consult
```json
{ "specialty": "string (normalized)",
  "clinician": "string?",
  "summary": "string (factual, from doc)",
  "completed": true }
```

### lab_result
```json
{ "test_name_raw": "string",
  "test_name_normalized": "string (from alias map)",
  "value": "number | string | null",
  "unit": "string | null",
  "abnormal": "boolean | null",
  "series_status": "explicit_series | explicit_one_off | unknown" }
```

#### `series_status` (Fix 5 — explicit, never inferred)

The duplicate-test rule needs to know whether a repeated test was *intended* as a series. The model must **not** infer clinical intent. It may only report what the document says.

| Value | Set only when | Example source text |
|---|---|---|
| `explicit_series` | The document explicitly states an ongoing/repeating schedule. | "Weekly CBC for 6 weeks" · "Serial A1c every 3 months" |
| `explicit_one_off` | The document explicitly states a single occurrence. | "One-time CBC today" · "Single A1c check" |
| `unknown` | **Default.** Nothing in the text addresses repetition. | "CBC with differential: WBC 5.8…" |

Rules:
- Absence of a statement → `unknown`. Never guess.
- `unknown` is treated as *not* an intentional series by the duplicate rule (so a genuine duplicate still flags), which is the conservative direction for a safety tool.
- The field may also be set as a document-level flag (`record.series_status`) that events inherit; event-level always wins.
- Extraction prompt: "If the document does not explicitly describe a repeated schedule, set series_status to unknown. Do not infer intent."

### medication_start / medication_stop
```json
{ "drug_raw": "string",
  "drug_normalized": "string (lowercase, no dose)",
  "dose": "string | null",
  "route": "string | null",
  "reason": "string | null" }
```

### referral
```json
{ "specialty": "string (normalized)",
  "reason": "string",
  "expected_window_days": "integer (default 30; 45 for oncology)",
  "status": "placed | completed | unknown" }
```

### followup
```json
{ "topic": "string",
  "status": "scheduled | completed | missed | unknown" }
```

## Normalization maps (deterministic, applied after extraction)

- **Test name alias map** (code, not LLM): "Complete Blood Count" / "CBC" / "CBC w/ diff" → `cbc`; "Hemoglobin A1c" / "A1c" / "HbA1c" → `a1c`; etc. Stored in `lib/normalization/test-aliases.ts`.
- **Drug name normalization**: lowercase, strip dose/strength, map brand→generic where known (tamoxifen stays tamoxifen).
- **Specialty normalization**: "Oncology" / "Medical Oncology" / "Heme-Onc" → `oncology`; "Cardiology" → `cardiology`.

## Drug → monitoring lab map (deterministic)

Stored in `lib/monitoring/drug-lab-map.ts`:
- metformin → [a1c, bmp] (window 90 days)
- warfarin → [inr] (window 7 days)
- tamoxifen/anastrozole → [annual oncology follow-up] (window 365 days; a gap is reportable **only after** the 365 days elapse — before that it is a `pending_monitoring` note, never a gap)
- (extend as needed; keep small and defensible)

## Validation rules (Stage E pre-check)

- Every event has `source_doc_id` that exists in `records` for that patient.
- `source_span` is a substring (fuzzy ≥0.85) of the source doc text.
- `date` is valid and within plausible range (1900–today+1).
- `confidence` in [0,1].
- `event_type` is in the enum.
- `series_status`, if present, is in the enum; anything else → coerced to `unknown`.
- Events failing validation are dropped and logged; never partially accepted.

## What the LLM must NOT do

- Decide whether a gap exists.
- Assign clinical diagnoses or treatment plans.
- Estimate patient risk scores.
- Produce any field not in this schema. Unknown → omit event.