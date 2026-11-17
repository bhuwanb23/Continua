# Evaluation Spec — Continua Spec v1.0

**No results are reported here.** This spec defines the frozen benchmark and metrics. Actual numbers come from running the finished pipeline; the table below is intentionally empty until then. Resolves C-016, C-018, C-024.

## 1. Frozen benchmark

| Property | Value |
|---|---|
| Panel | 80 synthetic patients (same panel used in the demo) |
| Documents | ~400–600 cross-provider records |
| Patients with ≥1 gap | **40** (target range 35–45) |
| Patients with no gaps | **40** (target range 35–45 true negatives) |
| Ground-truth gaps | **70** total (target range 60–80) |
| — missed follow-ups | 28 |
| — duplicate tests | 22 |
| — medication monitoring gaps | 20 |
| Ground truth file | `data/eval-set/ground_truth.json` (frozen, versioned) |
| Benchmark manifest | `data/spec/benchmark-manifest.json` |
| Evaluation as-of date | `2026-06-05` |

**Why the distribution (Fix 4).** The earlier draft had ~80 gaps across only ~20 positive patients — about four planted gaps per positive patient. That makes the benchmark artificially concentrated. A 40/40 positive/negative split with 70 gaps (~1.75 gaps per positive) is closer to a real panel and forces the rules to survive realistic negative pressure.

**Frozen** means: once the ground truth is written and the pipeline first run, the data and labels do not change. Prompt changes are re-run against the same frozen set. No editing ground truth to match outputs.

## 2. Deliberate composition

**Positive patients (40):**

| Category | Count | Purpose |
|---|---|---|
| Isolated single-gap patients | 22 | Clean positives; a miss here is a real recall failure. |
| Multi-gap patients (2–3 gaps) | 18 | Tests patient-level aggregation and the priority bonus. |
| Includes: specialty-mismatch positives | 6 | Cardiology referral with only a PCP visit → **is** a gap. |
| Includes: noisy test aliases | ≥10 events | "CBC w/ diff" vs "Complete Blood Count"; tests normalization. |

**Negative patients (40) — hard negatives:** see `benchmark-manifest.json` §hard_negative_families (10 families, HN-01 … HN-10).

## 3. Ground-truth record shape

```json
{
  "patient_id": "uuid",
  "type": "missed_followup | duplicate_test | med_monitoring",
  "source_doc_ids": ["uuid", "..."],
  "expected_window_days": 45,
  "notes": "optional rationale"
}
```

Note: ground truth uses `type` (its own schema, frozen in eval). The API/gap layer uses `gap_type`. These are different layers; do not rename ground truth.

## 4. Matching rule v2 (how a detection counts as correct)

A reported gap matches a ground-truth gap if:

1. `patient_id` equal, AND
2. `type` (reported `gap_type` normalized to the eval enum) equal, AND
3. Evidence overlap: at least one cited `source_doc_id` / `doc_id` appears in the ground truth's `source_doc_ids`.

- One reported gap can match at most one ground-truth gap (greedy, best evidence overlap first).
- Extra reported gaps on a patient with no ground-truth gap = false positives.
- Ground-truth gaps with no matching report = false negatives.

This is stricter than v1 (which only checked doc overlap) and prevents a single report from satisfying multiple planted gaps.

## 5. Metrics

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
| Grounding / citation accuracy | % of reported gaps where every cited doc id exists AND every quoted span is a verbatim/fuzzy (≥0.85) match |
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

## 6. Pass criteria (targets, not results)

| Metric | Target |
|---|---|
| Precision per type | ≥ 0.80 |
| Recall per type | ≥ 0.70 |
| Macro F1 | ≥ 0.75 |
| Grounding accuracy | 1.00 (hard requirement) |
| Extraction accuracy | ≥ 0.90 |
| Panel latency | < 60 s |

If a target is missed, we report the actual number and explain the failure mode. We do not tune ground truth to pass.

## 7. Protocol

0. Confirm the panel composition matches `benchmark-manifest.json` before freezing.
1. Generate synthetic panel with planted gaps (seeded; deterministic).
2. Write ground truth before running the pipeline (prevents label leakage).
3. Run pipeline → collect reported gaps.
4. Match reported ↔ ground truth via the matching rule v2.
5. Compute metrics; write `EvalResult` rows; render on Screen 8.
6. Re-run after any prompt/rule change; keep a log of run → metric.

## 8. Held-out discipline

- Ground truth is authored from the data generator's planted-gap manifest, not from pipeline output.
- Prompt/rule tuning may use a small dev subset; final numbers are reported on the full frozen set.
- At minimum, do not hand-edit prompts to fit specific eval patients.

## 9. What we will and won't claim

**Will claim:** "On our frozen synthetic benchmark of 80 patients (40 with planted gaps, 40 true negatives) and 70 planted gaps, detectors achieved [measured precision/recall/F1] with [measured]% grounding."

**Will not claim** a savings figure from this benchmark: latency is measured, the 12-minute manual baseline is an assumption (see `api-contract-v1.md` §8).

**Will not claim:** clinical validation, FDA clearance, real-world efficacy, or generalization to real EHR data. The benchmark is synthetic by design.

## 10. Artifacts

- `data/eval-set/ground_truth.json` — frozen labels.
- `scripts/eval.ts` — runner (or dev route `/api/eval`).
- `eval-report.json` — latest measured output (generated, committed for the demo).
- Screen 8 — renders the report.