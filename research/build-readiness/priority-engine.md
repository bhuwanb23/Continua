# Priority Engine — Continua (Explainable Intervention Priority)

**This is NOT a clinical risk score.** We have no validated training data and do not claim one. What we compute is an **intervention priority** for coordinator triage: given a set of detected, evidence-verified gaps, which patient should the coordinator look at first?

The formula is deterministic and displayed in the UI. Every ranked patient can answer "why is this #1?" with numbers the coordinator (and judge) can see.

## Formula (v1, locked)

```
gap_priority_score (raw) =
    severity_weight(gap.severity)          // 0.30 – 1.00
  × overdue_factor(gap.overdue_days)       // 1.00 – 2.00
  × gap.evidence_confidence                // 0.00 – 1.00
  × actionability_weight(gap.type)         // 0.75 – 1.00
  × gap_type_weight(gap.type)              // tie-breaker, 0.90 – 1.00
```

All factors multiply. Result is in [0, ~2.0]. Normalize to 0–100 for display:
`display = round(100 × raw / 2.0)` — labeled "Intervention priority (relative)", never "risk score".

### Factor definitions

**severity_weight**

| severity | weight |
|---|---|
| high | 1.00 |
| med | 0.60 |
| low | 0.30 |

**overdue_factor** — urgency grows with how long the gap has been open.

```
overdue_factor = 1.0 + min(overdue_days / 60, 1.0)     // caps at 2.0 at 60+ days
```
`overdue_days <= 0` → 1.0 (not yet overdue / early warning).

**evidence_confidence**

- `evidence_confidence = extraction_confidence × verification_score`
- extraction_confidence: mean confidence of the events the rule used.
- verification_score: 1.0 if all citations verified in Stage E; 0.6 if span fuzzy-matched (0.85–0.99); gap dropped if <0.85.

**actionability_weight** — how directly the coordinator can act today.

| gap type | weight | rationale |
|---|---|---|
| missed_followup | 1.00 | One call schedules the visit; closes the loop. |
| med_monitoring | 0.95 | One lab order request resolves; high clinical relevance. |
| duplicate_test | 0.75 | Prevents waste, but often needs provider conversation; less urgent. |

**gap_type_weight** (tie-breaker only)

| gap type | weight |
|---|---|
| missed_followup | 1.00 |
| med_monitoring | 0.97 |
| duplicate_test | 0.90 |

### Patient-level score

A patient may have multiple gaps.

```
patient_priority_score (raw) = max(gap_priority_score of patient's gaps)
                             + 0.10 × (sum of remaining gap_priority_scores, capped at 0.5)
```

- Primary gap drives the rank (so a single CRITICAL gap outranks several minor ones).
- Additional gaps add a bounded bonus (max +0.5), so multi-gap patients surface but don't get inflated.
- `headline` = the primary gap's one-line "why" (LLM explanation, grounded).

### Priority bands (for UI badges)

| band | score range (display 0–100) |
|---|---|
| CRITICAL | ≥ 70 |
| HIGH | 50 – 69 |
| MEDIUM | 30 – 49 |
| LOW | < 30 |

Bands are relative triage labels, not clinical acuity. UI must label them "Intervention priority" and include the "for coordinator verification" note.

## Terminology (frozen — Fix 3)

Two different numbers, two different names. They must never share a field.

| Concept | Field | Scope |
|---|---|---|
| A single gap's contribution | `gap_priority_score` | Inside a gap object, or under `top_gap` |
| The patient's queue rank | `patient_priority_score` | Patient object, queue item |

The bare name `priority_score` is **forbidden** — it previously meant both, which is why the API said 84 and the seed case said 89.

## Worked example (Maria, after Fix 1)

Maria's primary gap is a missed oncology follow-up. Referral 2026-03-25, window 45 days (elapsed 2026-05-09), demo date 2026-06-05 → **27 days overdue**.

**Gap 1 — missed oncology follow-up**
```
1.00 (high) × 1.45 (1 + min(27/60, 1)) × 0.96 × 1.00 × 1.00 = 1.392
gap_priority_score = round(100 × 1.392 / 2.0) = 70  →  CRITICAL
```

**Gap 2 — duplicate CBC** (8 days apart, two providers)
```
0.30 (low) × 1.13 (1 + 8/60) × 0.94 × 0.75 × 0.90 = 0.216  →  11  →  LOW
```

**Gap 3 — metformin monitoring** (A1c/BMP due 2026-05-11, 25 days overdue)
```
0.60 (med) × 1.42 (1 + 25/60) × 0.95 × 0.95 × 0.97 = 0.744  →  37  →  MEDIUM
```

**Patient**
```
patient_raw = 1.392 + 0.10 × (0.744 + 0.216) = 1.488
patient_priority_score = round(100 × 1.488 / 2.0) = 74  →  CRITICAL
```

UI shows:

```
Maria Chen · Intervention priority: CRITICAL (74)
WHY  Missed oncology follow-up — 27 days past the 45-day window
     Evidence confidence: 0.96 · Source: 2026-03-25 referral (Dr. A. Patel)
ACT  Verify: contact patient and confirm oncology follow-up.
```

> The earlier 84/89 figures came from the removed tamoxifen gap. If you see 84/89 in any other document, that document is stale.

## Determinism & testability

- Pure function `computePriority(gap, now)` — no LLM, no randomness.
- Unit-testable: given a gap fixture, expected score is exact.
- Tuning constants live in `lib/priority/config.ts` with the table above as the default.

## What this is NOT

- Not a validated clinical risk model; no training data, no calibration claim.
- Not a prediction of patient harm.
- Not a substitute for coordinator judgment. It orders the queue; the coordinator decides.

## Guardrails

- If `evidence_confidence < 0.6`, cap the band at MEDIUM even if the raw score is higher (weak evidence shouldn't top the queue).
- If `overdue_days` is undefined (duplicate tests), use `days_between` as the urgency proxy.
- Never display a score without its factor breakdown available (tooltip or detail view).