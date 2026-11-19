# Priority Engine — Continua Spec v1.0 · SPEC-1.2 amendment (priority-v1)

> **Controlled amendment, 2026-11-19.** Phase 8 replaces the earlier priority
> formula and clinical-sounding bands. Field names remain frozen. This document
> is the canonical priority contract for `priority-v1`.

**This is a workflow intervention priority, not a clinical risk score.** There is
no validated training data and no prediction of harm, deterioration, or outcome.
The engine answers one narrow question: given Phase 7 verified coordination
gaps, which patient should the coordinator inspect first, and why?

The formula is deterministic, local, and printed in the queue. It makes no LLM
calls, reads no documents, and uses no ground-truth labels at runtime.

## 1. Input boundary

Only `VerifiedGap v1` objects participate. A candidate gap, suppressed gap,
failed evidence bundle, stale gap set, or manually constructed "gap-like" object
is rejected before scoring.

Eligibility requires `grounded: true`, `evidence-v1` verified with zero failures,
100% required-claim coverage, frozen `gaps-v1`/`gap-policy-v1` versions, a
current event-store hash, and a matching frozen evaluation date.

Ineligible items are reported as `NOT RANKED`. They never receive a low score.

## 2. Formula (v1, locked)

```
raw_gap_priority =
    severity_weight(gap.severity)
  × temporal_factor(gap.gap_type, gap.overdue_days)
  × actionability_weight(gap.gap_type)
```

Evidence is **not** a multiplier. Phase 7 already decided whether evidence was
acceptable; letting extraction confidence move patient order would reintroduce
poorly calibrated ranking. Gap-type weight is also excluded: v1 does not assert
that one verified workflow item is inherently more important than another.

### Severity weights

| severity | weight |
|---|---:|
| high | 1.00 |
| medium | 0.70 |
| low | 0.45 |

These are workflow significance constants, not medical coefficients.

### Temporal factor

For `missed_followup` and `med_monitoring`:

| overdue days | factor |
|---|---:|
| not overdue (`< 1`) | 0.75 |
| 1–7 | 1.00 |
| 8–30 | 1.15 |
| 31–60 | 1.30 |
| 61–90 | 1.40 |
| > 90 | 1.50 |

For `duplicate_test`, the temporal factor is `1.00`. A repeat-test interval is
not an overdue duration, and the detector has already applied the series window.

### Actionability weights

| gap type | class | weight |
|---|---|---:|
| `missed_followup` | direct coordinator action | 1.00 |
| `med_monitoring` | direct coordinator action | 0.95 |
| `duplicate_test` | review with provider | 0.85 |

Actionability is a frozen workflow-policy mapping, never assigned dynamically
from text.

## 3. Gap normalization

The theoretical maximum is derived from the frozen factor bounds, not the
observed panel:

```
MAX_RAW_GAP = max(severity) × max(temporal) × max(actionability)
            = 1.00 × 1.50 × 1.00
            = 1.50

gap_priority_score = round(100 × raw_gap_priority / 1.50)
```

The result is an integer from 0 to 100. A gap cannot receive `NONE`.

## 4. Patient aggregation

One urgent verified issue must dominate; many weak issues must not buy the top
of the queue.

```
ordered = patient's gaps sorted by raw score, then overdue days, then gap_id
patient_raw_priority =
    ordered[0].raw
  + min(
      SECONDARY_FACTOR × sum(ordered[1..].raw),
      SECONDARY_BONUS_CAP
    )

SECONDARY_FACTOR   = 0.10
SECONDARY_BONUS_CAP = 0.30
```

Theoretical patient maximum:

```
MAX_RAW_PATIENT = 1.50 + 0.30 = 1.80
patient_priority_score = round(100 × patient_raw_priority / 1.80)
```

A patient with zero verified gaps receives `patient_priority_score = 0` and
`priority_band = NONE`. The UI says "No verified continuity issues found." It
must not label that patient low risk.

## 5. Workflow bands

Bands are absolute, not panel-relative. Scores do not change when unrelated
patients enter or leave the panel.

| band | display score | queue meaning |
|---|---|---|
| P1 | 80–100 | Act first |
| P2 | 60–79 | High priority |
| P3 | 35–59 | Review |
| P4 | 1–34 | Low priority |
| NONE | 0 | No verified coordination issue |

`CRITICAL` is retired for priority output because it can be read as clinical
acuity. A score/band mismatch is `PR-012`.

## 6. Deterministic order

1. `patient_priority_score` descending
2. top verified gap `raw_score` descending
3. top gap overdue days descending (0 where not applicable)
4. verified gap count descending
5. `patient_id` ascending, byte order

No locale comparison, name order, random tie, or insertion order is allowed.

## 7. Explanation contract

Every queue item exposes:

- the top verified gap and its workflow severity
- `severity_weight`, `temporal_factor`, `actionability_weight`
- overdue days or repeat-test interval
- the top gap raw and display arithmetic
- the patient aggregation raw and display arithmetic
- the bounded secondary bonus
- the recommended coordinator action
- the number of other verified issues

A coordinator can reproduce the score with arithmetic. "The model thinks this
patient is important" is not an acceptable explanation.

## 8. Version and staleness

Every priority object carries:

```
priority_version       = priority-v1
evidence_version       = evidence-v1
detector_version       = gaps-v1
verified_gap_set_hash  = sha256(stable eligible gap set)
evaluation_as_of_date  = 2026-06-05
```

If the verified gap set changes, the hash changes and the prior ranking is stale
(`PR-011`). Recompute; never silently reuse a queue from another gap set.

## 9. Non-goals

- Not mortality, readmission, deterioration, treatment response, or prognosis.
- Not a probability that a patient will "fall through the cracks".
- Not a substitute for coordinator judgment.
- Not panel-relative: the same gap receives the same score in any panel.
- Not demographic: name, age, sex, race, ethnicity, ZIP, insurance, income,
  provider identity, hospital identity, and diagnosis are prohibited inputs.

## 10. Why this differs from the v1.0 draft

The v1.0 draft used five multiplied factors, including evidence confidence and
a gap-type weight, with `CRITICAL/HIGH/MEDIUM/LOW` bands. Phase 7 changed the
evidence boundary: ranked items are already verified, so another confidence
multiplier adds noise rather than safety. The five-factor draft also normalized
against `2.0`, while its true bound was higher. `priority-v1` uses the exact
three-factor formula above and theoretical normalization.
