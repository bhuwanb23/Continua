# Build Readiness Package — Continua

> Stage status: Research ✅ · Define ✅ · Refine ✅ · Ideation ✅ · Architecture & Product Planning ✅ (locked, 4 review corrections) · **Build Readiness ✅ (this folder, frozen after 6 review corrections)** · Implementation ⏭️ next
>
> **First implementation milestone: intelligence engine without UI** — dataset → schema validation → 3 deterministic detectors → evidence grounding → intervention priority → frozen eval run → inspect actual P/R/F1 → only then the dashboard.

These are **implementation assets only** — no new features, no redesign. They freeze interfaces so implementation can proceed directly. Architecture corrections applied:

1. No fake Epic/EHR integration — MVP is synthetic-only; production path is FHIR/HL7 (roadmap).
2. Eval harness is P0 (Must Have).
3. Hybrid pipeline: LLM extracts structured events; deterministic rules detect gaps; LLM explains.
4. "Intervention priority" (explainable formula), not a validated clinical risk score. Human in the loop. Actions are verify/contact/review/coordinate.

## Files

| File | Asset |
|---|---|
| `synthetic-data-spec.md` | Exact 80-patient dataset design (demographics, encounters, providers, documents, oncology demo patient, planted ground-truth gaps). |
| `clinical-event-schema.md` | Exact structured JSON schema emitted by extraction (event types, dates, provider, meds, labs, referrals, evidence/source ids, confidence). |
| `gap-rules.md` | Exact deterministic detection logic for the 3 gap types, with edge cases and false-positive protections. |
| `priority-engine.md` | Explainable intervention priority formula (not a clinical risk score). |
| `evaluation-spec.md` | Frozen ground truth + metrics (precision/recall/F1, macro F1, grounding, extraction accuracy, latency). No fabricated results. |
| `api-contracts.md` | Exact request/response contracts for patients, timeline, gaps, queue, evidence, metrics. |
| `demo-seed-case.md` | Complete Maria oncology demo story: 5–8 synthetic records, hidden gaps, expected timeline/detection/evidence/action. |
| `acceptance-tests.md` | Given/When/Then acceptance tests for every P0 feature. |

## Review pass 2 — six corrections applied (frozen after these)

| # | Correction | Where |
|---|---|---|
| 1 | Maria's tamoxifen monitoring gap was logically impossible (365-day window, 44 days elapsed). Replaced with an overdue metformin→A1c window (25 days past due); tamoxifen is context only. Rule 3 now has a hard "not-yet-elapsed = not a gap" clause. | `demo-seed-case.md` (v2), `gap-rules.md` Rule 3 |
| 2 | `risk_level` removed from the model and API. No clinical-risk terminology anywhere. | `api-contracts.md` §3, `architecture/data-schema.md`, AT-7.5 |
| 3 | `priority_score` overloaded. Frozen as `patient_priority_score` (queue rank) vs `gap_priority_score` (single gap, incl. under `top_gap`). | `priority-engine.md`, `api-contracts.md` §3, AT-7.6 |
| 4 | Ground truth was over-concentrated (~80 gaps on ~20 patients). Now 80 patients: 40 positive / 40 negative, 70 gaps, with deliberate hard negatives. | `evaluation-spec.md`, `synthetic-data-spec.md`, AT-12.5 |
| 5 | Duplicate rule referenced an undefined `intentional_series` flag. Replaced with `series_status: explicit_series \| explicit_one_off \| unknown`, extraction-only, never inferred. | `clinical-event-schema.md`, `gap-rules.md` Rule 2, AT-5.5 |
| 6 | "12 min → 8 sec" presented as established savings. Split into `baseline` (assumption), `measured` (latency), `modeled` (labeled arithmetic). | `api-contracts.md` §8, `architecture/ux-flow.md`, `architecture/evaluation-metrics.md`, AT-11.x |

## Corrections applied to the architecture docs

| Correction | Where applied |
|---|---|
| No fake Epic integration; synthetic-only MVP; FHIR/HL7 as roadmap | `architecture/prd.md` §5, `architecture/ai-pipeline.md` "Data & integration stance", `architecture/out-of-scope.md` #13 |
| Eval harness promoted to Must Have (P0) | `architecture/mvp-features.md` #12, `architecture/prd.md` FR-10, `evaluation-spec.md` |
| Hybrid: LLM extracts, deterministic rules detect, LLM explains | `architecture/ai-pipeline.md` (rewritten), `gap-rules.md`, `clinical-event-schema.md` |
| Intervention priority (explainable), not clinical risk score | `architecture/prd.md` FR-4, `architecture/ux-flow.md` badges, `priority-engine.md` |
| Human in the loop; verify/contact/review/coordinate actions | `gap-rules.md`, `acceptance-tests.md` AT-10.x, `demo-seed-case.md` |

## Frozen pipeline (do not deviate)

```
Synthetic messy records
  → LLM extraction
  → schema validation
  → clinical-event normalization
  → evidence-grounded event store
  → ┌ deterministic rule engines ┐
    │ referral follow-up          │
    │ duplicate testing           │
    │ medication monitoring       │
    └─────────────────────────────┘
  → evidence verification
  → explainable intervention priority
  → coordinator queue (80 patients → 5 actions)
  → LLM/plain-language explanation
  → UI
```

LLM must NOT independently decide clinical gaps when deterministic evidence can establish them. All records synthetic/de-identified. No real PHI. No fake Epic integration. No autonomous diagnosis/treatment. Human coordinator is final decision-maker. Recommended actions: verify / contact / review / coordinate (never order/diagnose/treat).