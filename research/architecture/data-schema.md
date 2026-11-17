# Data Schema — Continua

Two storage modes: **Supabase Postgres** (primary, for credibility) and **in-memory/JSON** (fallback for offline demo). The schema is identical in shape; only persistence differs.

## Entities

### Patient

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `external_id` | text | demo id like "P-042" |
| `name` | text | synthetic (e.g., "Maria Chen") |
| `age` | int | |
| `sex` | enum (M/F/other) | |
| `primary_diagnosis` | text | e.g., "Breast cancer — post-surgical" |
| `risk_level` | enum (high/med/low) | clinical weight input |
| `last_contact_date` | date | |
| `panel_id` | uuid (FK Panel) | |
| `created_at` | timestamptz | |

### Panel

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | "Oncology demo panel" |
| `owner` | text | coordinator id (demo: "sarah") |
| `patient_count` | int | |
| `created_at` | timestamptz | |

### Record (source document)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | referenced as `source_doc_id` everywhere |
| `patient_id` | uuid (FK) | |
| `provider` | text | "Dr. Lee — Oncology" |
| `provider_type` | enum | pcp/specialist/lab/imaging/pharmacy |
| `date` | date | |
| `doc_type` | enum | note/referral/lab_result/imaging_report/med_list |
| `text` | text | free-text note (the source of truth) |
| `structured` | jsonb | optional {meds:[], labs:[], referrals:[]} |
| `created_at` | timestamptz | |

### TimelineEvent (derived, cached)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `patient_id` | uuid (FK) | |
| `date` | date | |
| `event_type` | enum | surgery/imaging/consult/lab/med_start/med_stop/referral/followup |
| `description` | text | |
| `provider` | text | |
| `source_doc_id` | uuid (FK Record) | required (grounding) |
| `phase` | text | grouping label for UI |
| `created_at` | timestamptz | |

### Gap (derived, cached)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `patient_id` | uuid (FK) | |
| `type` | enum | missed_followup / duplicate_test / med_monitoring |
| `severity` | enum | high/med/low |
| `title` | text | short label |
| `why` | text | one-line explanation |
| `evidence` | jsonb | `[{doc_id, quoted_span, confidence}]` |
| `recommended_action` | text | |
| `estimated_impact` | text | "recovered referral" / "$X avoided" / "order A1c" |
| `detector` | text | rule+llm identifier |
| `confidence` | float | |
| `created_at` | timestamptz | |

### PrioritizedQueue (derived, cached per panel)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `panel_id` | uuid (FK) | |
| `rank` | int | 1..K |
| `patient_id` | uuid (FK) | |
| `risk_score` | float | |
| `headline` | text | one-line "why this patient today" |
| `top_gap_id` | uuid (FK Gap) | |
| `generated_at` | timestamptz | |

### EvalResult (dev/demo only)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `run_at` | timestamptz | |
| `gap_type` | text | |
| `precision` | float | |
| `recall` | float | |
| `f1` | float | |
| `grounding_rate` | float | |
| `notes` | text | |

## JSON cache shape (demo)

`data/demo-cache/`:
- `panel.json` — Panel + Patient[] (without records text? include text — needed for evidence).
- `records.json` — Record[].
- `timelines.json` — `{patient_id: TimelineEvent[]}`.
- `gaps.json` — `{patient_id: Gap[]}`.
- `queue.json` — `PrioritizedQueue[]`.
- `impact.json` — impact summary numbers.

## Relationships

```
Panel 1—* Patient 1—* Record
Patient 1—* TimelineEvent (each → Record)
Patient 1—* Gap (each evidence → Record)
Panel 1—* PrioritizedQueue *—1 Patient
```

## Indexes (Supabase)

- `records(patient_id, date)`
- `gaps(patient_id, type)`
- `prioritized_queue(panel_id, rank)`

## Notes

- All IDs are UUIDs; synthetic data uses deterministic UUIDs (seeded) so caches are stable.
- No user/auth tables in MVP (single coordinator "Sarah"; auth out of scope).
- RLS not needed for MVP (single-tenant demo); document as a known limitation.