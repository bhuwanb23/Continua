# Acceptance Tests — Continua Spec v1.0 (P0, reconciled)

Given/When/Then for every P0 feature. Reconciled against the frozen contracts in this folder. Resolves C-013, C-014, C-016, C-024.

Legend: **API** = exercised via route handler; **UI** = exercised in the browser; **EVAL** = via `scripts/eval.ts`.

The full AT text is inherited from `research/build-readiness/acceptance-tests.md`; the deltas below are the reconciliation. Any AT whose wording conflicts with a frozen contract is overridden by the contract.

## 1. Reconciliation table

| AT | Requirement / contract | Decision |
|---|---|---|
| AT-1.1 | deterministic generator, 80 patients | KEEP |
| AT-1.2 | no real PHI, synthetic banner | KEEP |
| AT-2.1, AT-2.2 | cross-provider records, Maria's 8 records | KEEP |
| AT-3.1 – AT-3.4 | extraction schema (this folder §schema) | KEEP; field names now `date`, `confidence`, `source_span` |
| AT-4.1, AT-4.2 | timeline + source chip | KEEP |
| AT-5.1 | missed follow-up, 27 d overdue, R4 | KEEP; `overdue_days = 27` |
| AT-5.2 | no false positive inside window | KEEP |
| AT-5.3 | wrong specialty still a gap | KEEP |
| AT-5.4 | duplicate CBC, 8 days, N=14 | KEEP; key = normalized test name |
| AT-5.5 | `series_status` explicit_series vs unknown | KEEP |
| AT-5.6 | metformin monitoring, 25 d overdue | KEEP |
| AT-5.6b | not-yet-elapsed window (tamoxifen) → no gap | KEEP; hard rule |
| AT-5.7 | monitoring present → no gap | KEEP (id retained from research) |
| AT-5.8 | determinism | KEEP |
| AT-5.9 | multi-lab single gap | KEEP |
| AT-6.1 – AT-6.4 | evidence grounding, Level A/B, suppression | KEEP; `quoted_span`, `span_verified`, `verification_score` |
| AT-7.1 | Maria 70 (gap) / 74 (patient) | KEEP; field names `gap_priority_score` / `patient_priority_score` |
| AT-7.2 | confidence <0.6 → band capped MEDIUM | KEEP |
| AT-7.3 | priority_breakdown with five factors | KEEP |
| AT-7.4 | "Intervention priority" label | KEEP |
| AT-7.5 | no `risk_level` / `risk_score` / "clinical risk score" | KEEP |
| AT-7.6 | no bare `priority_score` | KEEP |
| AT-8.1 – AT-8.3 | queue, Maria rank 1, score 74 | KEEP |
| AT-9.x (eval) | measured or `not_run`; no invented numbers | KEEP; matching rule v2 |
| AT-10.x | safety / action language | KEEP; action verbs include schedule |
| AT-11.1 – AT-11.3 | claim classes baseline/measured/modeled | KEEP |
| AT-12.5, AT-12.6 | 40/40/70 distribution, 10 hard-negative families | KEEP |

## 2. New / corrected acceptance tests

**AT-5.7 (duplicate/imaging key)** *Given* two imaging events with the same modality but different body regions within 14 days, *When* the duplicate engine runs, *Then* no gap is produced. *And given* the same modality and same body region, *Then* a gap **is** produced.

**AT-9.1 (matching rule v2)** *Given* a patient with two planted gaps of the same type, *When* one reported gap matches both by doc overlap, *Then* it counts for at most one ground-truth gap (greedy best overlap), and the other remains a false negative.

**AT-9.2 (no invented numbers)** *Given* the pipeline has not run, *When* `/api/eval` is called, *Then* `status: "not_run"` and all metric fields are `null`.

**AT-10.1 (action verbs)** *Given* any returned gap or UI string, *When* scanned for forbidden verbs (order, diagnose, treat, prescribe, discontinue), *Then* zero matches exist; allowed verbs are verify, contact, review, coordinate, schedule, confirm, reconcile.

**AT-11.4 (claim class on metrics)** *Given* `/api/metrics`, *When* inspected, *Then* `baseline`, `measured`, and `modeled` are separate objects; `modeled` is `null` with `status: "not_measured"` when `measured` is null.

**AT-12.7 (hard-negative families)** *Given* the benchmark manifest, *When* inspected, *Then* all 10 hard-negative families (HN-01 … HN-10) have manifest ids and at least one case each.

## 3. Field-name contract for all ATs

Every AT that references an API payload must use:
- `gap_type` (not `type`) at the API/gap layer. Ground truth uses `type` (its own schema).
- `recommended_coordinator_action` (not `recommended_action`).
- `detector_version` (not `detector`).
- `quoted_span` for gap evidence; `source_span` for events; `source_text_excerpt` for parent-doc context.
- `patient_priority_score` / `gap_priority_score` (never bare `priority_score`).
- `confidence` in a gap = `evidence_confidence`.

## 4. Safety MUST NOT → tests

Every safety MUST NOT in `safety-contract.md` Part B has a corresponding AT (AT-7.5, AT-7.6, AT-10.1, and the prohibited-term grep in 0.16). No MUST NOT ships without a test.