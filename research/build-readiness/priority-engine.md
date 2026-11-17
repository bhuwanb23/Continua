# Priority Engine — Continua (Explainable Intervention Priority)

**This is NOT a clinical risk score.** We have no validated training data and do not claim one. What we compute is an **intervention priority** for coordinator triage: given a set of detected, evidence-verified gaps, which patient should the coordinator look at first?

The formula is deterministic and displayed in the UI. Every ranked patient can answer "why is this #1?" with numbers the coordinator (and judge) can see.

## Formula (v1, locked)

```
priority_score =
    severity_weight(gap.severity)          // 0.10 – 1.00
  × overdue_factor(gap.overdue_days)       // 1.00 – 2.00
  × gap.evidence_confidence                // 0.00 – 1.00
  × actionability_weight(gap.type)         // 0.75 – 1.00
  × gap_type_weight(gap.type)              // tie-breaker, 0.90 – 1.00
```

All factors multiply. Result is in [0, ~2.0]. Normalize to 0–100 for display:
`display_score = round(100 × priority_score / 2.0)` — labeled "Priority score (relative)", never "risk score".

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
patient_priority = max(gap priority_score)
                 + 0.10 × (sum of remaining gap priority_scores, capped at 0.5)
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

## Worked example (Maria)

- Missed oncology follow-up, high severity: severity_weight 1.00
- 45 days overdue: overdue_factor = 1 + min(45/60, 1) = 1.75
- evidence_confidence 0.96
- actionability 1.00
- gap_type 1.00

```
priority = 1.00 × 1.75 × 0.96 × 1.00 × 1.00 = 1.68
display  = round(100 × 1.68 / 2.0) = 84  → CRITICAL
```

UI shows:

```
Maria Chen · Priority: CRITICAL (84)
WHY  Missed oncology follow-up — 45 days overdue
     Evidence confidence: 0.96 · Source: 2026-04-18 referral (Dr. A. Patel)
ACT  Verify: contact patient and confirm oncology follow-up.
```

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