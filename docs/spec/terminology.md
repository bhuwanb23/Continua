# Terminology — Continua Spec v1.0

> Canonical vocabulary. If a word is not in the allowed column, it is not used in code, docs, UI copy, or API payloads. Resolves C-002, C-003, C-004, C-007 (in part), C-015.

## 1. Core product identity

| Use | Never use |
|---|---|
| Continua (descriptor: continuity intelligence for care coordinators) | "risk engine", "clinical decision support", "diagnosis" |
| Care Coordinator (primary user) | "physician-facing", "clinician tool" as primary |
| Nurse Navigator (secondary) | — |
| Synthetic demo data | "real patient data", "EHR data" |
| Intervention priority | Clinical risk score, risk score, patient risk |

## 2. Priority field names (frozen — Fix 3)

Two different numbers, two different names. They must never share a field. The bare name `priority_score` is **forbidden**.

| Concept | Field | Scope |
|---|---|---|
| A single gap's contribution | `gap_priority_score` | Inside a gap object, or under `top_gap` |
| The patient's queue rank | `patient_priority_score` | Patient object, queue item |

## 3. Priority bands

| Band | Display score range |
|---|---|
| CRITICAL | ≥ 70 |
| HIGH | 50 – 69 |
| MEDIUM | 30 – 49 |
| LOW | < 30 |

Bands are relative triage labels, never clinical acuity. UI must label them "Intervention priority".

## 4. Gap types (frozen enum)

`GapType = "missed_followup" | "duplicate_test" | "med_monitoring"`

Canonical strings (snake_case, singular concept). Display labels: "Missed follow-up", "Duplicate test", "Medication monitoring".

## 5. Event types (frozen enum)

`EventType = "surgery" | "imaging" | "consult" | "lab_result" | "medication_start" | "medication_stop" | "referral" | "followup"`

## 6. Severity (frozen enum)

`Severity = "high" | "med" | "low"` (not "high/medium/low" — `med`, to match the schema).

## 7. Provider types (frozen enum)

`ProviderType = "pcp" | "specialist" | "lab" | "imaging" | "pharmacy" | "other"`

## 8. Recommended action verbs (allowed — C-015)

**Allowed:** verify, contact, review, coordinate, schedule, confirm, reconcile.

**Forbidden:** order, diagnose, treat, prescribe, discontinue, recommend treatment, triage as clinical.

Every action string includes "for coordinator verification" implicitly via the safety contract; the UI appends the disclaimer.

## 9. Prohibited terms (must not appear anywhere)

- `risk_level`
- bare `priority_score`
- "clinical risk score", "patient risk", "risk of harm"
- "diagnosed", "prescribed", "ordered" (as system actions)
- "clinically validated", "FDA", "real-world efficacy"
- "12 minutes → 8 seconds" as an established result (must be labeled `baseline`/`measured`)
- "intentional_series" (use `series_status`)
- "today_or_latest_record_date" (use `evaluation_as_of_date`)
- "Epic", "FHIR" in MVP scope (roadmap only)

## 10. Claim classes (frozen)

| Class | Example | Rule |
|---|---|---|
| `baseline` | 12 min manual review | Always `baseline_type: "scenario_assumption"` |
| `measured` | 8.1 s synthesis latency | Produced by a real run, never hardcoded |
| `modeled` | ~15 h saved per panel | Always labeled modeled, formula shown |
| `sourced` | "40% of cancer patients…" | Citation required |

## 11. Confidence vocabulary

- `extraction_confidence` — top-level aggregate (0.0–1.0), and per-event `confidence`.
- `verification_score` — evidence span match (1.0 / 0.6 / dropped <0.85).
- `evidence_confidence` — product, used in priority.
- `confidence` (gap payload) — equals `evidence_confidence`. Never a fourth meaning.

No bare "confidence" may appear without one of these qualifiers in a schema or contract.

## 12. Date vocabulary

- `evaluation_as_of_date` — the single frozen "today" for the benchmark (`2026-06-05`).
- `date` — an event's date (ISO `YYYY-MM-DD`).
- `event_date` is **not** a field name; use `date`.

## 13. Change control

Any new term requires a register row and a version bump. Terminology is frozen at v1.0.