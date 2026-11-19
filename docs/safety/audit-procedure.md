# Safety Audit and Release Procedure

**Safety version:** `continua-safety-v1`
**Goal:** make the safety claim reproducible from artifacts, not opinion.

## One-command audit

```bash
npm run test:safety
```

This runs the static audits, the 40-case adversarial corpus, the dynamic cache/evidence/API checks, and the 12 safety test files. Any `BLOCKER` failure exits non-zero and fails the build.

## Individual commands

| Command | Purpose |
| --- | --- |
| `npm run scan:synthetic-data` | Direct-identifier and PHI-claim scan of shipped data |
| `npm run scan:secrets` | Tracked-file secret and env scan |
| `npm run audit:runtime-imports` | Blocks benchmark truth, generators, and fixtures from runtime |
| `npm run audit:output-language` | Guards all user-facing copy |
| `npm run test:safety` | Full safety suite |
| `npm run generate:safety-report` | Rebuilds the five release artifacts |

## Release gate

The generator evaluates gates A–K:

| Gate | Requirement |
| --- | --- |
| A | Intended use frozen and displayed |
| B | Prohibited uses frozen with controls |
| C | AI authority matrix enforced |
| D | Synthetic-only boundary verified |
| E | Evidence coverage complete and claims supported |
| F | Output language guard clean |
| G | Privacy and secret controls clean |
| H | Benchmark truth isolated |
| I | Cache fails closed |
| J | Human oversight and accessibility present |
| K | Safety documentation and artifacts complete |

All gates must pass. Quantitative blockers must be zero, except human-verification coverage, which must be 100%.

## Artifacts

Generated into `artifacts/safety/`:

- `safety-report.json` — suite results, gates, metrics, claims, audit object.
- `safety-report.md` — human-readable summary.
- `risk-register.json` — risks, invariants, residual risks.
- `release-gate.json` — gate status and blockers.
- `phase-15-exit-report.md` — exit criteria populated from the run.

Never hand-edit these files. Regenerate them from source.

## Review checklist

1. `git status` — only intended files changed; frozen Phase 9/10 artifacts untouched.
2. `npm run test:safety` — all static checks, all 40 cases, all tests pass.
3. `git diff` on `lib/safety`, `scripts/lib/safety-*`, `data/safety-cases` — no weakened assertions, skipped cases, or suppressed failures.
4. `npm run generate:safety-report` — gate `PASS`, zero blockers.
5. Verify the safety version and dataset/cache versions in the report.
6. Confirm no HIPAA compliance or "HIPAA-safe" claim appears in docs, UI, or artifacts.

## Adding a case

1. Add a JSON case under the correct `data/safety-cases/<family>/` directory with `case_id`, `family`, `severity`, `check`, and `expect`.
2. Implement or reuse a check in `scripts/lib/safety-corpus.ts`; the case must exercise the real pipeline or a real audit, not a mock of the conclusion.
3. Run `npm run test:safety`; the case must pass and remain in the corpus.
4. If the case reveals a defect, fix the control first. Do not tailor the case to pass.

## Freeze

`npm run freeze:safety` regenerates the artifacts for the current commit. Freezing requires a clean gate and human sign-off. Any later change to a control requires a new audit run.
