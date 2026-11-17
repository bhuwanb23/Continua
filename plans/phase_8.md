# Phase 8 — Intervention Priority Engine

> Depends on: Phase 7 (verified gaps) · Unblocks: Phase 9, 11, 12
> Gate: **identical inputs always produce identical ordering**

## Objective

Rank the panel without pretending to predict clinical risk. We have no validated training data, so we compute an **explainable intervention priority** with a visible formula.

## Sub-phases

### 8.1 Config

`lib/priority/config.ts` — every constant in one place, with comments:

```
severity:      high 1.00 | med 0.60 | low 0.30
overdue:       1.0 + min(overdue_days / 60, 1.0)   // caps at 2.0
actionability: missed_followup 1.00 | med_monitoring 0.95 | duplicate_test 0.75
type weight:   missed_followup 1.00 | med_monitoring 0.97 | duplicate_test 0.90
bands:         CRITICAL >= 70 | HIGH 50-69 | MEDIUM 30-49 | LOW < 30
```

### 8.2 Gap score

```
gap_raw   = severity × overdue_factor × evidence_confidence × actionability × type_weight
gap_score = round(100 × gap_raw / 2.0)
```

- Pure function; no LLM, no randomness, no timestamps except the passed `today`.
- For duplicate tests, `days_between` substitutes for `overdue_days`.

### 8.3 Patient score

```
patient_raw   = max(gap_score_raw) + 0.10 × min(sum(remaining gap_score_raw), 0.5)
patient_score = round(100 × patient_raw / 2.0)
```

- The top gap drives the rank; extra gaps add a bounded bonus.
- `headline` comes from the primary gap, not a new generation step.

### 8.4 Guards

- If `evidence_confidence < 0.60` → band capped at MEDIUM regardless of score.
- Missing `overdue_days` → fall back to `days_between`, else 0.
- Never emit a score without a `priority_breakdown` available.

### 8.5 Determinism and tie-breaking

- Sort by `patient_score` desc, then `gap_score` desc, then `patient_id` asc (stable, total order).
- Test: same fixture set shuffled into a different input order → identical output order.

### 8.6 Field naming (frozen)

- `patient_priority_score` and `gap_priority_score` only.
- Bare `priority_score` and `risk_level` do not exist. A type-level test asserts the field names.

### 8.7 No rigging

- Maria's rank must emerge from the frozen data. If she is not #1, **do not adjust the formula** — fix the data or accept the result and change the story.
- Document her computed position in the phase report.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/priority/config.ts` | all constants |
| `lib/priority/compute.ts` | gap + patient scoring |
| `lib/priority/queue.ts` | ranking, K selection, headline attachment |
| `tests/priority/*.test.ts` | scoring, guards, determinism |

## Gate — exit criteria

- [ ] Maria fixture reproduces `gap_priority_score = 70`, `patient_priority_score = 74`.
- [ ] Low-confidence gap is capped at MEDIUM (test).
- [ ] Determinism: shuffled input → identical ranking (test).
- [ ] Breakdown exposes all five factors + raw score.
- [ ] No `risk_level` / bare `priority_score` anywhere (type test).
- [ ] Maria's rank documented as computed, not forced.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Calling it a risk model in comments or UI | Terminology gate + AT-7.5 |
| Tuning constants until Maria is #1 | Constants frozen before the full-panel run |
| Non-total ordering causing flaky demos | Explicit tie-break chain ending in `patient_id` |

## Handoff to Phase 9

Phase 9 scores the whole pipeline, including this engine's output, against frozen ground truth.
