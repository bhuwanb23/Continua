# Leakage Policy — continua-eval-v1

Runtime code must never be able to read hidden labels, inspect patient-specific fixture keys, or special-case benchmark scenarios. The benchmark is only meaningful if the world can be understood without seeing the answer key.

## Threat model

| Threat | Example | Rule |
|---|---|---|
| A. Label import | Runtime imports `data/eval-set` or the generator | Forbidden; automated audit fails. |
| B. Patient exception | `if (patient.fixture_key === "P-001-maria")` | Forbidden in runtime. |
| C. Prompt leak | A prompt contains a planted answer or truth id | Forbidden. |
| D. Held-out tuning | Rules edited per final-partition patient | Forbidden; final partition is not a development set. |
| E. Hardcoded queue | Queue order is a literal benchmark ordering | Forbidden; priority must be computed. |

## Runtime boundary

Scanned runtime roots: `app/`, `components/`, `lib/`.

Allowed exceptions:

- `lib/generator/**` is the synthetic-world generator, not runtime; it is excluded from runtime scans but may not be imported by runtime.
- `lib/evaluation/**` is evaluator tooling. It may define truth-field types and scenario-independent validation, but it may not import frozen label files or be imported by clinical runtime code.

`scripts/**` and `tests/**` may read frozen labels for evaluation and verification.

## Automated audit

`npm run audit:benchmark-leakage` scans runtime code for:

- imports/references to `data/eval-set`, `lib/generator`, and frozen label filenames;
- fixture keys such as `P-###-...`;
- patient/fixture-key equality branches;
- scenario literals (`HN-###`, `T##`);
- runtime exposure of truth label fields;
- relative imports of frozen benchmark data from evaluator code.

The pre-existing `npm run check:leakage` remains in force. Both audits must pass.

## Blind final procedure

1. Freeze extractor, detector, and priority versions.
2. Record the Git commit.
3. Load the held-out partition.
4. Run the pipeline and write raw predictions.
5. Evaluate, hash the report, and do not edit the result.
6. If code changes afterwards, start a new run id; never overwrite history.

## Reporting isolation

- Maria is a development/demo patient and remains in `dev`.
- Demo performance may be shown in the product, but it is not generalization evidence.
- Technical quality claims use the `final` partition.
- No metric is reported without its eval version, detector version, and partition.

## Fail behaviour

If any audit violation is found, the benchmark release fails. Do not add an allowlist entry for production runtime code. If a legitimate exception is required, document it in the freeze policy and add a new eval version only if the exception changes benchmark semantics.
