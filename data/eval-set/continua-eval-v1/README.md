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

## Phase 3 verification

The frozen benchmark currently passes validation, leakage auditing, hash verification, and the full automated test suite. The deterministic evaluator has been exercised with an empty, non-frozen prediction fixture; this is a runner check, not detector performance.

Verified benchmark hashes:

- `ground_truth_sha256`: `3a0deb04396a9c6a51208d56c04a59c878fb7199d58cbe7e8cc4b338a5f1a5f2`
- `negative_manifest_sha256`: `9b72b523728fced7bb901c6a99523b76d3301d0dfba8e07dbde051095f5990a9`
- `extraction_gold_sha256`: `d74e758c32f5499235aa47145ff06f858ca0dcc411a1385ca833ac1624bec284`
- `partitions_sha256`: `f605254c355c09373b8c7eb83ee65475a6af7210f84303633b46cfa34565428c`
- `benchmark_contracts_sha256`: `e77b81a9f3745b593be38a3256a85942cfb1f34d8ee72905b8055aa368dd1f55`
- `evaluation_config_sha256`: `d822c52cb0c823678e1c87c270560c23b524508265515dfc816fb12d565b871a`
