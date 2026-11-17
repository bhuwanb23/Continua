# Phase 9 — Intelligence Benchmarking

> Depends on: Phase 3 (frozen labels), Phases 5–8 · Unblocks: Phase 10 (and the pitch)
> Gate: **actual metrics exist and are published honestly**

## Objective

This is the technical credibility centerpiece. Produce real numbers against `continua-eval-v1` and publish them — whatever they are. A measured 0.78 with a clear failure mode beats an invented 0.98 in front of a technical judge.

## Sub-phases

### 9.1 Runner

`scripts/eval.ts`:

1. Load `data/eval-set/v1/*` (read-only).
2. Run extraction → detectors → verifier → priority on the frozen panel (or read cached outputs).
3. Match reported gaps to ground truth.
4. Compute metrics; write `eval-report.json` and `EvalResult` rows.

### 9.2 Matching rule

A reported gap matches a ground-truth gap iff:

- same `patient_id`, AND
- same `type`, AND
- at least one overlapping `source_doc_id` / `trigger_doc_id`.

Greedy best-overlap, one-to-one. Everything else is FP or FN.

### 9.3 Metrics

**Per gap type:** precision, recall, F1, TP/FP/FN counts.
**Aggregate:** macro F1 (equal weight per type), micro F1 (pooled).
**Grounding:** citation validity %, unsupported-claim rate.
**Extraction:** event accuracy, date accuracy, normalization accuracy on the labeled subset.
**Latency:** panel p50/p95, single-patient.
**Negatives:** count of hard-negative cases correctly left unflagged (a first-class metric, not a footnote).

### 9.4 Targets vs results

Targets (goals only): precision ≥0.80/type, recall ≥0.70/type, macro F1 ≥0.75, grounding 100%, extraction ≥0.90, panel latency < 60 s.

If a target is missed: report the actual number, name the failure mode, and state the fix direction. Never tune the ground truth.

### 9.5 Report and honesty review

`eval-report.json` + a short `docs/BENCHMARK.md` containing:

- Version (`continua-eval-v1`), seed, checksum.
- The metric table with actual values.
- Per-type confusion counts.
- Known limitations (synthetic data, small labeled subset, rule windows are heuristics).
- A "what we do not claim" section (no clinical validation, no real-world efficacy).

### 9.6 Regression baseline

- Freeze the first honest run as the baseline.
- Any prompt/rule change re-runs the suite and diffs against baseline.
- A regression > 3 points on macro F1 requires an explicit justification in the changelog.

## Deliverables

| Artifact | Purpose |
|---|---|
| `scripts/eval.ts` | runner |
| `eval-report.json` | machine-readable results (generated) |
| `docs/BENCHMARK.md` | human-readable report + limitations |
| `lib/eval/metrics.ts` | precision/recall/F1/grounding computation |

## Gate — exit criteria

- [ ] `/api/eval`-equivalent output exists with `status: "measured"` (not `not_run`).
- [ ] Per-type P/R/F1 + macro + micro computed from real matching, no hardcoding.
- [ ] Grounding accuracy computed, not asserted.
- [ ] Hard-negative pass rate reported separately.
- [ ] Latency measured on the actual machine used for the demo.
- [ ] `docs/BENCHMARK.md` states limitations and non-claims.
- [ ] Numbers in the report match `/api/eval` exactly.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Reporting only the good-looking aggregate | Per-type table is mandatory |
| Tuning rules after seeing eval, then reporting the tuned number as if first-run | Changelog records every post-eval change and re-runs |
| Hiding false negatives caused by grounding drops | Grounding drops are counted as FN and reported |
| Claiming clinical validity from a synthetic benchmark | Explicit non-claims section |

## Handoff to Phase 10

With real numbers available, the demo can show an evidence-backed eval screen instead of a placeholder.
