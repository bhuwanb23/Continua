# continua-eval-v1

**Frozen benchmark:** `CONTINUA PHASE 3: continua-eval-v1 FROZEN`

Ground-truth labels and extraction gold for `continua-synth-v1`.

- `ground_truth.json` — frozen Phase 2 planted continuity gaps (66).
- `negative_manifest.json` — frozen Phase 2 declared no-gap cases (35 across 13 hard-negative families).
- `extraction_gold.json` — frozen Phase 2 event labels for 12 patients (130 events).
- `benchmark-contracts.json` — Phase 3 derived contract: gap identity, temporal arithmetic, evidence, difficulty, and rationale. Labels are not changed.
- `partitions.json` — deterministic patient split: dev 20, final 60, overlap 0. Maria remains in dev/demo.
- `benchmark-manifest.json` — frozen counts, matching rule, integrity hashes, and freeze stamp.

The Phase 2 files are byte-identical to their original freeze and are hash-pinned by the synthetic dataset manifest. Phase 3's derived contracts are regenerated with `npm run build:benchmark` and verified with `npm run validate:benchmark`, `npm run audit:benchmark-leakage`, and `npm run hash:benchmark`.

**Runtime must not import any file in this directory.** The evaluator and scripts read labels; product runtime does not. This is enforced by `scripts/check-leakage.ts` and `scripts/audit-benchmark-leakage.ts`.
