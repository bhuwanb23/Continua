# continua-eval-v1

Ground-truth labels and extraction gold for `continua-synth-v1`.

- `ground_truth.json` — planted continuity gaps.
- `negative_manifest.json` — declared no-gap cases.
- `extraction_gold.json` — labelled events for 12 patients.

**Runtime must not import any file in this directory.** Enforced by `scripts/check-leakage.ts`.
