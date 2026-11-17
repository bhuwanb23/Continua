# Evaluation Spec — Continua

**No results are reported here.** This spec defines the frozen benchmark and metrics. Actual numbers come from running the finished pipeline; the table below is intentionally empty until then.

## Why this exists

The most damaging judge question is: *"How do you know the AI actually found the right care gaps?"* Without an eval harness, the answer is "we prompted it carefully." With one, the answer is a measured number against a frozen ground truth. This is why eval is **P0**, not optional.

## Frozen benchmark

| Property | Value |
|---|---|
| Panel | 80 synthetic patients (same panel used in the demo) |
| Documents | ~400–600 cross-provider records |
| Ground-truth gaps | ~80 total |
| — missed follow-ups | ~30 |
| — duplicate tests | ~25 |
| — medication monitoring gaps | ~25 |
| Patients with no gaps | ~60 (true negatives, for precision) |
| Ground truth file | `data/eval-set/ground_truth.json` (frozen, versioned, held out from prompt tuning where feasible) |

**Frozen** means: once the ground truth is written and the pipeline first run, the data and labels do not change. Prompt changes are re-run against the same frozen set. No editing ground truth to match outputs.

## Ground-truth record shape

```json
{
  "patient_id": "uuid",
  "type": "missed_followup | duplicate_test | med_monitoring",
  "source_doc_ids": ["uuid", "..."],
  "expected_window_days": 45,
  "notes": "optional rationale"
}
```

## Matching rule (how a detection counts as correct)

A reported gap matches a ground-truth gap if:

1. `patient_id` equal, AND
2. `type` equal, AND
3. Evidence overlap: at least one cited `source_doc_id` appears in the ground truth's `source_doc_ids`.

- One reported gap can match at most one ground-truth gap (greedy, best evidence overlap first).
- Extra reported gaps on a patient with no ground-truth gap = false positives.
- Ground-truth gaps with no matching report = false negatives.

## Metrics

### Per gap type

| Metric | Definition |
|---|---|
| Precision | TP / (TP + FP) |
| Recall | TP / (TP + FN) |
| F1 | 2PR / (P + R) |

### Aggregate

| Metric | Definition |
|---|---|
| Macro F1 | Mean of per-type F1 (equal weight across the 3 types) |
| Micro F1 | Computed over all gap instances pooled |
| **Grounding / citation accuracy** | % of reported gaps where every cited doc id exists AND every quoted span is a verbatim/fuzzy (≥0.85) match of the source |
| Unsupported claim rate | 1 − grounding accuracy |
| Extraction accuracy | % of ground-truth events (dates, types, normalized test/drug names) correctly extracted — measured on a hand-labeled subset of ~10 patients |
| Latency | Panel synthesis wall-clock (80 patients), p50/p95; single-patient synthesis |

### Reporting format (fill after running)

```
Gap Detection         Precision   Recall    F1
Missed follow-up         —          —        —
Duplicate test           —          —        —
Medication monitoring    —          —        —
Macro F1                 —          —        —

Evidence grounding:      — %     (target 100%)
Unsupported claims:      — %
Extraction accuracy:     — %
Panel latency (80 pts):  — s (p50) / — s (p95)
```

**These numbers must be the actual measured output.** Do not pre-fill, estimate, or "target" them into the report.

## Pass criteria (targets, not results)

| Metric | Target |
|---|---|
| Precision per type | ≥ 0.80 |
| Recall per type | ≥ 0.70 |
| Macro F1 | ≥ 0.75 |
| Grounding accuracy | 1.00 (hard requirement) |
| Extraction accuracy | ≥ 0.90 |
| Panel latency | < 60 s |

If a target is missed, we report the actual number and explain the failure mode. We do not tune ground truth to pass.

## Protocol

1. Generate synthetic panel with planted gaps (seeded; deterministic).
2. Write ground truth before running the pipeline (prevents label leakage).
3. Run pipeline → collect reported gaps.
4. Match reported ↔ ground truth via the matching rule.
5. Compute metrics; write `EvalResult` rows; render on Screen 8.
6. Re-run after any prompt/rule change; keep a log of run → metric.

## Held-out discipline

- Ground truth is authored from the data generator's planted-gap manifest, not from pipeline output.
- Prompt/rule tuning may use a small dev subset; final numbers are reported on the full frozen set.
- At minimum, do not hand-edit prompts to fit specific eval patients.

## What we will and won't claim

**Will claim:** "On our frozen synthetic benchmark of 80 patients and ~80 planted gaps, detectors achieved [measured precision/recall/F1] with [measured]% grounding."

**Will not claim:** clinical validation, FDA clearance, real-world efficacy, or generalization to real EHR data. The benchmark is synthetic by design.

## Artifacts

- `data/eval-set/ground_truth.json` — frozen labels.
- `scripts/eval.ts` — runner (or dev route `/api/eval`).
- `eval-report.json` — latest measured output (generated, committed for the demo).
- Screen 8 — renders the report.