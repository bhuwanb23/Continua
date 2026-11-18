# Freeze Policy — continua-eval-v1

**Freeze stamp:** `CONTINUA PHASE 3: continua-eval-v1 FROZEN`
**Frozen at:** `2026-11-18`
**Evaluation as-of date:** `2026-06-05`

## What is frozen

- Phase 2 labels: `ground_truth.json`, `negative_manifest.json`, `extraction_gold.json` are byte-identical to the Phase 2 freeze and hash-pinned.
- Phase 3 derived contracts: `benchmark-contracts.json` (identity, temporal, evidence, difficulty, rationale).
- Partitions: `partitions.json` (dev 20, final 60, zero patient overlap).
- Benchmark summary and hashes: `benchmark-manifest.json`.
- Evaluator config: `lib/evaluation/config.ts`.
- Matching rule: v2 with identity and evidence extensions.
- Metric definitions and failure taxonomy.

## Allowed without a new eval version

- Formatting, comments, and README wording that do not change labels, identities, partitions, expected outcomes, matching semantics, or metric definitions.
- Documentation clarifications.
- Evaluator bug fixes that restore documented semantics and are covered by tests.

## Requires continua-eval-v2

- Any label change: gap type, patient, trigger, evidence set, negative outcome, extraction gold event.
- Any gap identity change.
- Any matching logic semantic change.
- Any partition membership change.
- Any evaluation date change.
- Any hard-negative expected outcome change.
- Any metric definition change.
- Any change to the frozen hashes or the files they cover.

## Hash verification

`npm run hash:benchmark` verifies:

- `ground_truth_sha256`
- `negative_manifest_sha256`
- `extraction_gold_sha256`
- `partitions_sha256`
- `benchmark_contracts_sha256`
- `evaluation_config_sha256`

`npm run validate:benchmark` additionally checks schema/reference integrity, temporal arithmetic, unique identities, partition isolation, manifest counts, and hash agreement. `npm run audit:benchmark-leakage` checks runtime isolation.

## Changing the benchmark

1. Open a new eval version.
2. Copy the current benchmark into a new directory; never overwrite `continua-eval-v1` in place.
3. Re-label from Phase 2 truth, not from pipeline output.
4. Recompute hashes and write a new manifest with a new freeze stamp.
5. Update the evaluator config version and documentation.
6. Run all Phase 3 gates and red-team tests again.

## Phase 3 acceptance gates

| Gate | Requirement | Status |
|---|---|---|
| A — Truth | Every gap has deterministic identity, rationale, and evidence. | PASS |
| B — Negatives | Hard negatives are explicit and machine-testable (13 families, 35 cases). | PASS |
| C — Extraction gold | 12 patients, 130 events, 100% source evidence. | PASS |
| D — Isolation | Dev/final patient overlap 0. | PASS |
| E — Evaluator correctness | Perfect/terrible/duplicate/wrong-occurrence predictors behave correctly. | PASS |
| F — Grounding | Citation, ownership, and span support independently scored. | PASS |
| G — Leakage | Runtime has zero access to hidden truth. | PASS |
| H — Reproducibility | Same predictions + benchmark produce deterministic metrics. | PASS |
| I — Integrity | All benchmark hashes validate. | PASS |

No detector F1 is claimed in Phase 3. Detector performance is measured in later phases against this frozen benchmark.
