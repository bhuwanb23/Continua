# Clinical Event Schema — Continua Spec v1.0

> The exact JSON contract emitted by the LLM extraction stage (Stage B) and consumed by all downstream deterministic stages. Extraction outputs only this schema; no free text. Resolves C-018, C-019, C-022, C-023.

## 0. Naming rules (frozen)

- Event date field is `date`. `event_date` is **not** a field name.
- Per-event extraction confidence is `confidence`. Top-level aggregate is `extraction_confidence`. `extraction_confidence` is never a per-event field.
- Verification confidence is `verification_score` (evidence layer) and `evidence_confidence` (priority factor). The bare word "confidence" alone is forbidden in schemas/contracts unless qualified.
- `patient_id` is the canonical UUID. `display_id` is an optional human label only.
- Gap-level fields are `gap_type`, `recommended_coordinator_action`, `detector_version`. Never `type`, `recommended_action`, or `detector`.

## 1. Top-level extraction output

```json
{
  "patient_id": "uuid",
  "events": [ /* ClinicalEvent[] */ ],
  "extraction_confidence": 0.0,
  "notes": "optional short extractor note (no clinical judgment)"
}
```

- `extraction_confidence`: 0.0–1.0 aggregate extraction confidence (mean of per-event `confidence`).
- `notes`: optional, short, no clinical judgment.

## 2. ClinicalEvent (base)

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
- `source_span`: verbatim substring of the source doc text (used for grounding verification). Event layer name; gap layer uses `quoted_span`; API layer uses `source_text_excerpt` for parent-doc context.
- `confidence`: 0.0–1.0 per-event extraction confidence. Used in priority engine as the extraction component.
- `phase`: UI grouping label; derived deterministically from event_type if LLM omits.

## 3. Typed fields by event_type

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

### `series_status` (Fix 5 — explicit, never inferred)

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

## 4. Normalization maps (deterministic, applied after extraction)

- **Test name alias map** (code, not LLM): "Complete Blood Count" / "CBC" / "CBC w/ diff" → `cbc`; "Hemoglobin A1c" / "A1c" / "HbA1c" → `a1c`; etc. Stored in `lib/normalization/test-aliases.ts`.
- **Drug name normalization**: lowercase, strip dose/strength, map brand→generic where known (tamoxifen stays tamoxifen).
- **Specialty normalization**: "Oncology" / "Medical Oncology" / "Heme-Onc" → `oncology`; "Cardiology" → `cardiology`.

## 5. Drug → monitoring lab map (deterministic)

Stored in `lib/monitoring/drug-lab-map.ts`:
- metformin → [a1c, bmp] (window 90 days)
- warfarin → [inr] (window 7 days)
- tamoxifen/anastrozole → [annual oncology follow-up] (window 365 days; a gap is reportable **only after** the 365 days elapse — before that it is a `pending_monitoring` note, never a gap)
- (extend as needed; keep small and defensible)

## 6. Validation rules (Stage E pre-check)

- Every event has `source_doc_id` that exists in `records` for that patient.
- `source_span` is a substring (fuzzy ≥0.85) of the source doc text.
- `date` is valid and within plausible range (1900–today+1, where today = `evaluation_as_of_date`).
- `confidence` in [0,1].
- `event_type` is in the enum.
- `series_status`, if present, is in the enum; anything else → coerced to `unknown`.
- Events failing validation are dropped and logged; never partially accepted.

## 7. What the LLM must NOT do

- Decide whether a gap exists.
- Assign clinical diagnoses or treatment plans.
- Estimate patient risk scores.
- Produce any field not in this schema. Unknown → omit event.

## 8. Field-name drift resolved (C-019, C-023)

| Old / ambiguous | Frozen name | Layer |
|---|---|---|
| `event_date` | `date` | event |
| `extraction_confidence` (per-event) | `confidence` | event |
| `confidence` (gap payload) | `evidence_confidence` (semantically); exposed as `confidence` in API | gap/API |
| `quoted_span` vs `span` | `source_span` (event), `quoted_span` (gap evidence), `source_text_excerpt` (API parent doc) | per layer |
| `type` (gap) | `gap_type` | gap/API |
| `recommended_action` | `recommended_coordinator_action` | gap/API |
| `detector` | `detector_version` | gap/API |
| `display_id` vs `patient_id` | `patient_id` (UUID) canonical; `display_id` optional label | patient |
## 9. v1.1 amendment — mention_context (2026-11-18, Phase 5 prerequisite)

Versioned amendment required by `plans/phase_5.md` §5.34–5.36. The v1.0 frozen
body above is unchanged; this section extends it. Schema version identifier:
`clinical-event-v1.1`. Both `clinical-event-v1` and `clinical-event-v1.1`
envelopes remain valid inputs; canonicalization always emits the current
version (`clinical-event-v1.1`).

### Field

Optional base-envelope field on every canonical event:

```
mention_context: "contemporaneous" | "historical_reference" | "unknown"
```

- Default when absent: `unknown`. Legacy events without the field adapt to `unknown`.
- Semantics: **document temporal context**, not a clinical judgment.
  - `contemporaneous` — the document reports the event as occurring in its own context (a lab report reporting its own result, a referral note placing the referral).
  - `historical_reference` — the document mentions an earlier event ("Reviewed CBC from 04/20", copy-forward prose).
  - `unknown` — the text does not make the temporal context explicit. Never inferred from repeated dates alone.
- The extractor may set this field from explicit textual evidence only; it must cite the supporting span like any other fact.

### Reconciliation rules (Phase 5)

- A `historical_reference` event whose fingerprint matches an existing canonical occurrence attaches as additional provenance; it never creates a new occurrence.
- A `historical_reference` with no matching occurrence is retained conservatively with `mention_context: "historical_reference"`.
- `unknown` events are retained separately unless fingerprint and result value are identical; similarity alone never merges events.

### Identity stability

Event identity (`identifyClinicalEvent`) keeps the `clinical-event-v1`
namespace and does not hash `schema_version` or `mention_context`. All
existing `event_id` values, gold matching, and benchmark hashes are unchanged
by this amendment. Serialized event hashes change only because the envelope
gains fields; no frozen artifact pins the pre-amendment event hash.
