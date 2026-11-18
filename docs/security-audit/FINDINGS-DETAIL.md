# Findings Detail

## F-001 — Benchmark labels are committed in the same repository (needs validation)
The repository contains `ground_truth.json`, `negative_manifest.json`, `extraction_gold.json`, `benchmark-contracts.json`, and `partitions.json`. Runtime code does not import them, but the files themselves are tracked. If the repository is shared or published, the benchmark is not blind.

## F-002 — Evaluator and benchmark-bundle code is importable from the runtime source tree (low)
`lib/evaluation/index.ts` re-exports `benchmark-bundle.ts`, whose `loadBenchmarkBundle` reads benchmark files. This is not imported by the app today, but there is no structural boundary preventing a future import.

## F-003 — Name-based secret redaction (low)
`lib/logging/logger.ts` redacts values only when the field name matches a secret-like pattern. Values logged under ordinary names are not redacted.

## F-004 — Missing CSP and HSTS (low)
`next.config.ts` sets several useful headers but no Content-Security-Policy or Strict-Transport-Security.

## F-005 — `artifacts/` not ignored (low)
Generated evaluation outputs can be accidentally committed.

## F-006 — Phase 3 benchmark gates omitted from CI (low)
`.github/workflows/ci.yml` runs `check:leakage` but not `validate:benchmark`, `audit:benchmark-leakage`, or `hash:benchmark`.

## F-007 — Comment exception in leakage audit (informational)
The leakage scanner skips comment lines, so a fixture key can appear in a comment without failing the audit.

## F-008 — Dependency audit not completed (needs validation)
The local npm audit command failed due to a registry TLS requirement.

## F-009 — Arbitrary path handling (needs validation)
`readJsonFile` and the eval CLI read caller-supplied paths without containment. This is only a risk if exposed to untrusted callers.