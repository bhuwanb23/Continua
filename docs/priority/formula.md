# priority-v1 Formula

## Gap score

```
raw_gap_priority =
    severity_weight
  × temporal_factor
  × actionability_weight

gap_priority_score = round(100 × raw_gap_priority / 1.50)
```

`1.50` is the theoretical maximum: `1.00 × 1.50 × 1.00`. It is not the observed
panel maximum.

| factor | values |
|---|---|
| severity | high `1.00`, medium `0.70`, low `0.45` |
| temporal | not overdue `0.75`; 1–7 `1.00`; 8–30 `1.15`; 31–60 `1.30`; 61–90 `1.40`; >90 `1.50` |
| duplicate temporal | `1.00` (no overdue concept) |
| actionability | missed follow-up `1.00`, monitoring `0.95`, duplicate test `0.85` |

Evidence confidence and gap-type weights are deliberately excluded.

## Patient score

```
patient_raw_priority =
    top_gap_raw
  + min(0.10 × sum(other_gap_raw), 0.30)

patient_priority_score = round(100 × patient_raw_priority / 1.80)
```

`1.80` is the theoretical maximum: `1.50 + 0.30`.

## Bands

| band | score |
|---|---|
| P1 | 80–100 |
| P2 | 60–79 |
| P3 | 35–59 |
| P4 | 1–34 |
| NONE | 0 |

## Worked Maria example

Maria's verified gaps after Phase 7:

- missed oncology follow-up: high, 27 days overdue, direct action
  `1.00 × 1.15 × 1.00 = 1.15` → `round(100 × 1.15 / 1.50) = 77` → P2
- metformin monitoring: low, 25 days overdue
  `0.45 × 1.15 × 0.95 = 0.491625` → `33` → P4
- duplicate CBC: low, 8 days apart
  `0.45 × 1.00 × 0.85 = 0.3825` → `26` → P4

Patient:

```
1.15 + min(0.10 × (0.491625 + 0.3825), 0.30)
= 1.15 + 0.087413
= 1.237413
```

`round(100 × 1.237413 / 1.80) = 69` → P2.

Maria's full-panel rank is 27/80. That is an empirical result, not a test
failure. No weight was adjusted to move her.

## Arithmetic surfaces

The queue prints:

```
gap raw = 1 × 1.15 × 1 = 1.15; display = round(100 × 1.15 / 1.5) = 77.
patient raw = 1.15 + min(0.1 × 0.874125, 0.3) = 1.237413;
display = round(100 × 1.237413 / 1.8) = 69.
```
