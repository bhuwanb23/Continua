# Phase 1 — Repository & Engineering Foundation

> Depends on: Phase 0 (frozen contracts) · Unblocks: Phase 2 (synthetic dataset)
> Gate: **clean clone installs, validates, lints, typechecks, tests, builds, and boots**

Phase 0 freezes what Continua means. Phase 1 builds the engineering substrate that makes every later phase reproducible: a clean clone must install, validate configuration, generate/use seeded fixtures, run tests, and start the application without tribal knowledge.

## Phase mission

Build a deterministic, typed, testable, reproducible engineering foundation on which the intelligence engine can be implemented without changing product contracts.

**Phase 1 does not implement care-gap intelligence.** It establishes repository architecture, application skeleton, package/version policy, TypeScript contracts, environment configuration, testing infrastructure, deterministic IDs/time/randomness, logging/error conventions, demo-cache interfaces, CI gates, deployment skeleton, documentation, and clean-clone reproducibility.

## Definition of Done

A developer with only the repository and README can: clone → install → create `.env.local` from template → run validation → run lint/typecheck/tests → start the application → open the local Continua shell, without asking the original developer anything.

The phase passes only when all of the following hold:

- Clean install succeeds.
- Next.js application starts.
- Strict TypeScript passes with zero errors.
- ESLint passes.
- Unit-test runner passes.
- Environment variables are schema-validated.
- No secret exists in Git.
- Frozen Phase 0 types have code representations.
- All clocks are injectable.
- Randomness is seedable.
- Stable IDs are reproducible.
- API error contract exists centrally.
- Clinical disclaimer exists centrally.
- Fixture/demo-cache interfaces exist.
- No real clinical intelligence has accidentally been implemented.
- CI executes mandatory checks.
- Production build succeeds.
- Fresh-clone reproduction passes.

## Non-goals (explicitly NOT Phase 1)

Synthetic 80-patient dataset · LLM extraction · clinical extraction prompts · gap detectors · medication-monitoring rules · evidence verifier · priority formula · benchmark execution · Supabase production schema · polished dashboard · Maria's visual timeline · EHR/FHIR integration · authentication · patient portal · real PHI · OpenAI calls · clinical interpretation.

**Stub interfaces are allowed. Business logic is not.**

## Repository layout (this repo)

The app lives at the repository root (alongside the frozen `docs/spec/` and `data/spec/`). The conceptual `continua/` root in the source brief maps here.

```
app/                 api/, patients/, evaluation/, methodology/, layout.tsx, page.tsx, globals.css
components/          ui/, layout/, queue/, patient/, evidence/, shared/
lib/
  domain/            patient, record, clinical-event, gap, evidence, priority, evaluation, api, versions, claim
  schemas/           Zod schemas for P0 boundaries
  extraction/        ClinicalEventExtractor interface + fixture impl
  normalization/     (placeholder)
  detectors/         (placeholder)
  evidence/          (placeholder)
  priority/          (placeholder)
  evaluation/        (placeholder)
  repositories/      interfaces + in-memory/json
  cache/             demo-cache contract
  config/            env.ts
  logging/           logger.ts
  errors/            AppError hierarchy
  time/              clock.ts
  ids/               deterministic ids + fixture keys
  random/            RandomSource + seeded mulberry32
  safety/            disclaimer + forbidden-term checks
data/
  spec/              Phase-0 artifacts (frozen)
  synthetic/         placeholder
  eval-set/          placeholder
  fixtures/          minimal non-clinical fixtures
  demo-cache/        placeholder
scripts/             validate-spec.ts, validate-data.ts, validate-env.ts, check-safety.ts, verify-determinism.ts
tests/               unit/, contract/, integration/, fixtures/, e2e/
docs/                spec/, architecture/, development/, decisions/, build/
.github/workflows/   ci.yml
.env.example · .gitignore · package.json · tsconfig.json · README.md
```

## Sub-phases

| Subphase | Workstream | Result |
|---|---|---|
| 1.0 | Preconditions | Phase 0 freeze verified |
| 1.1 | Toolchain | Runtime/package baseline + lockfile |
| 1.2 | Repository | Canonical tree |
| 1.3 | Next.js shell | Runnable application |
| 1.4 | TypeScript | Strict type boundary |
| 1.5 | Domain contracts | Phase-0 specs represented in code |
| 1.6 | Runtime schemas | Zod validation at P0 boundaries |
| 1.7 | Environment | Validated configuration |
| 1.8 | Determinism | Clock, IDs, randomness |
| 1.9 | Logging/errors | Shared operational semantics |
| 1.10 | Data abstraction | Repository/cache contracts |
| 1.11 | AI boundary | Provider-independent extractor interface |
| 1.12 | Testing | Test pyramid foundation |
| 1.13 | Fixtures | Synthetic-only fixture conventions |
| 1.14 | Quality gates | lint/typecheck/build/test |
| 1.15 | Safety checks | Prohibited-term + spec validators |
| 1.16 | CI | Automated validation |
| 1.17 | Security baseline | Secret/PHI/dependency safeguards |
| 1.18 | Deployment | Production build + Vercel-ready skeleton |
| 1.19 | Documentation | Clean-clone developer experience + ADRs |
| 1.20 | Acceptance gate | Foundation frozen |

### 1.0 Preconditions

Verify `docs/spec/` + `data/spec/` exist, contradiction register has 0 OPEN / 0 PROPOSED, and the version constants are present. If not, stop.

### 1.1 Runtime & toolchain

- Node.js LTS (24.x), npm (lockfile authoritative: `package-lock.json`).
- Next.js + React + TypeScript + Tailwind CSS + Zod + Vitest + ESLint.
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, `validate`.
- `npm run validate` = lint + typecheck + unit/contract tests + spec/data/safety checks.
- `docs/build/toolchain.md` records exact versions.

### 1.2 Repository architecture

Create the tree above; empty future directories carry `.gitkeep`.

### 1.3 Application shell

Pages `/`, `/patients`, `/evaluation`, `/methodology` with controlled placeholders. Global banner: **"Synthetic demo data. No real patient information. For coordinator verification only."** No final queue. Gate: pages load, navigation works, no console errors, banner visible.

### 1.4 Strict TypeScript

`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`. No `any` for domain models; use `unknown` at boundaries + validation.

### 1.5 Domain contracts

`lib/domain/` — `Patient`, `Record`, `ClinicalEvent`, `Gap`, `Evidence`, `GapPriority`, `PatientInterventionPriority`, `EvalResult`, `ApiError`, `VersionMetadata`, `ClaimClass`. Exactly three `GapType`s, four `PriorityBand`s, frozen `EventType`s. No component-local enums. No `RiskScore`. No ambiguous `priorityScore`.

### 1.6 Runtime schema validation

Zod schemas: `ClinicalEventSchema`, `GapSchema`, `EvidenceSchema`, `EvalResultSchema`, `ApiErrorSchema`, `VersionMetadataSchema`. Validation only, no clinical logic.

### 1.7 Environment configuration

`.env.example` + `lib/config/env.ts` (Zod). All access through the validator; no scattered `process.env.X`. Secrets (`KEY`/`SECRET`/`TOKEN`/`PASSWORD`) never use `NEXT_PUBLIC_`. Demo/cached mode boots without an LLM key; a missing key on a live path throws `ConfigError: LLM provider not configured.`

### 1.8 Determinism

- `Clock` interface, `SystemClock`, `FixedClock` (benchmark date `2026-06-05`).
- `RandomSource` interface + `SeededRandomSource` (mulberry32).
- Deterministic IDs derived from stable inputs (UUID v5-style / SHA-256); human fixture keys (`P-001-maria`, `R4`) separate from machine UUIDs.
- Gate: same fixture/ID operation twice → identical identifiers.

### 1.9 Logging & errors

Structured logger (`timestamp`, `level`, `request_id`, `stage`, optional `patient_id`/`duration_ms`/`version`, `message`); never logs secrets/PHI. `AppError` hierarchy (`ConfigError`, `ValidationError`, `NotFoundError`, `PipelineError`, `DataIntegrityError`, `GroundingError`) mapping to `{ error: { code, message } }` without stack traces/prompts/secrets.

### 1.10 Persistence & repository interfaces

`PatientRepository`, `RecordRepository`, `TimelineRepository`, `GapRepository`, `EvaluationRepository`, `DemoCacheRepository`; Phase 1 implementations: in-memory and JSON-file.

### 1.11 Demo cache contract

Cached artifact types for panel, patients, records, timelines, gaps, queue, impact, evaluation, carrying `cache_version`, `dataset_version`, `detector_version`, `priority_version`, `generated_at`. Stale cache on version mismatch is detectable and rejected.

### 1.12 AI provider boundary

`ClinicalEventExtractor` interface (input: synthetic record(s); output: validated extraction result). `FixtureClinicalEventExtractor` for deterministic tests. No LLM implementation in Phase 1.

### 1.13 Test foundation

Vitest: `tests/unit`, `tests/contract`, `tests/integration`. Playwright config stub for later E2E. Test matrix T1–T10:

| ID | Test |
|---|---|
| T1 | demo mode + no LLM key → app config boots |
| T2 | FixedClock → `2026-06-05` |
| T3 | same inputs twice → same UUID |
| T4 | invalid `GapType` → schema validation fails |
| T5 | unknown resource → structured 404 via error contract |
| T6 | server secret never exposed through public config |
| T7 | synthetic-data disclaimer present globally |
| T8 | version manifest validates |
| T9 | cache artifact with incompatible version is rejected |
| T10 | forbidden terminology check catches `risk_level` / "clinical risk score" |

### 1.14 Quality gates

`lint` (ESLint), `typecheck` (`tsc --noEmit`), `test` (Vitest), `build` (Next production). `validate` chains lint + typecheck + tests + spec/data/safety checks.

### 1.15 Safety static checks

`scripts/check-safety.ts` flags prohibited claims (diagnoses, recommends treatment, clinically validated, connects to Epic, patient risk score, orders medication) with a small documentation allowlist.

### 1.16 CI

`.github/workflows/ci.yml`: install exact deps → lint → typecheck → tests → spec/data/safety checks → production build. No deploy on failed validation.

### 1.17 Security baseline

`.env*` ignored except `.env.example`; secret-pattern scan (`api_key`, `Bearer`, `sk-`, `password`, `MRN`, `SSN`); dependency audit; no hardcoded credentials; no external healthcare connections; no telemetry containing record text; server-only LLM secrets.

### 1.18 Deployment skeleton

Production build succeeds; `/` loads; demo mode configurable; no required external data service for the shell. Vercel-ready (`next build` output).

### 1.19 Documentation + ADRs

README (problem, what Continua does, safety, architecture, setup, env table, testing, spec link, current status). ADR-001 … ADR-006 (hybrid AI+deterministic reasoning, synthetic-only data, fixed benchmark clock, deterministic demo cache, separate gap/patient priority, no EHR in MVP).

### 1.20 Acceptance gate

Gates A–G (spec inheritance, determinism, testability, repository health, build, clean clone, safety) all PASS. Stamp `CONTINUA PHASE 1: ENGINEERING FOUNDATION FROZEN`.

## Phase 1 benchmarks (engineering quality)

| Metric | Required |
|---|---|
| TypeScript errors | 0 |
| Lint errors | 0 |
| Failing Phase-1 tests | 0 |
| Production build failures | 0 |
| Required external services for tests | 0 |
| Required LLM calls for tests | 0 |
| Exposed secrets | 0 |
| Real PHI records | 0 |
| Undefined P0 enum duplication | 0 |
| Reproducible deterministic-ID tests | 100% |
| Clean-clone setup success | 100% |
| Safety/disclaimer checks | 100% |
| CI required checks green | 100% |

No invented coverage target.

## Failure modes to avoid

1. Building the UI because it feels productive.
2. Implementing LLM calls early.
3. Tight coupling to Supabase.
4. Using the system clock in clinical paths.
5. Duplicate domain models.
6. Fake production architecture (Kafka/K8s/microservices/Redis).
7. Premature HIPAA claims.

## Phase 1 final release checklist

### Foundation
- [x] Runtime frozen (`docs/build/toolchain.md`)
- [x] Package manager frozen (npm + `package-lock.json`)
- [x] Lockfile committed
- [x] Repository structure complete
- [x] App shell boots

### Contracts
- [x] P0 domain types implemented (`lib/domain/`)
- [x] Runtime schemas exist (`lib/schemas/`, Zod)
- [x] Version manifest centralized (`lib/domain/versions.ts`)
- [x] Gap/patient priorities separated (`GapPriority` / `PatientInterventionPriority`)
- [x] Claim classifications defined (`MEASURED` / `MODELED` / `SCENARIO_ASSUMPTION` / `EXTERNAL_RESEARCH`)
- [x] Provenance metadata defined (`SourceProvenance`, `DerivedProvenance`)

### Determinism
- [x] Fixed clock (`FixedClock`, 2026-06-05)
- [x] Seedable randomness interface (`SeededRandomSource`, mulberry32)
- [x] Stable IDs (SHA-256 → UUID v5 shape)
- [x] Fixture aliases separated from UUIDs (`fixture_key`)
- [x] Cache version semantics defined (`assertCacheCompatible`)

### Engineering
- [x] Error hierarchy (`lib/errors/`)
- [x] Structured logging with redaction (`lib/logging/`)
- [x] Repository interfaces + in-memory/JSON implementations
- [x] Extraction interface + fixture implementation
- [x] Demo cache abstraction + named artifact types (panel, patients, records, timelines, gaps, queue, impact, evaluation)
- [x] Minimal synthetic fixture (`data/fixtures/maria-minimal.json`) + fixture-extraction test

### Quality
- [x] lint passes (0 errors, 0 warnings)
- [x] typecheck passes (strict, 0 errors)
- [x] tests pass (37 tests, 9 files)
- [x] safety check passes
- [x] spec check passes
- [x] data + env checks pass
- [x] build passes (`next build`)
- [x] secret scan passes (`check:secrets`)
- [x] CI workflow committed (steps verified locally with `npm run validate`)

### Safety
- [x] synthetic-data banner (global in `app/layout.tsx`)
- [x] no PHI (synthetic-only, fixtures are non-clinical)
- [x] no secrets (`.env*` ignored, redaction, public projection test, `check:secrets` scan)
- [x] no EHR integration claims
- [x] no clinical-risk terminology (safety scan)
- [x] no autonomous clinical actions

### Reproducibility
- [x] README setup exact
- [x] `.env.example` complete
- [x] clean clone tested (`npm ci` + `validate` + `build` in a fresh copy)
- [x] ADRs committed (ADR-001 … ADR-006)
- [x] Phase-1 handoff recorded

## Gate results

| Gate | Result |
|---|---|
| A — Specification inheritance | PASS |
| B — Determinism | PASS |
| C — Testability | PASS |
| D — Repository health (`npm run validate`) | PASS |
| E — Build (`npm run build`) | PASS |
| F — Clean clone | PASS |
| G — Safety baseline | PASS |

## Exit condition

Do not evaluate Phase 1 on how much Continua visually does. The product may still appear almost empty, and that is correct. The real test: **can we implement the entire intelligence stack on top of this repository without changing fundamental types, clocks, IDs, configuration, test infrastructure, error semantics, or module boundaries?**

If yes, stamp: `CONTINUA PHASE 1: ENGINEERING FOUNDATION FROZEN`.

## Handoff to Phase 2

Phase 2 receives: stable IDs, fixed clock, seedable randomness, runtime schemas, repository/storage interfaces, tests, CI — and builds the 80-patient synthetic dataset, 400–600 messy cross-provider documents, planted positives, adversarial negatives, deterministic manifests, and data-quality gates. Phase 2 should not need to solve project tooling.

---

## Status

**CONTINUA PHASE 1: ENGINEERING FOUNDATION FROZEN**

Frozen 2026-11-17. All seven gates (A–G) pass. Clean-clone reproduction was verified with `npm ci` + `npm run validate` + `npm run build` in a fresh copy of the repository.

Known limitation: `npm audit` could not run in the local environment because the npm registry is configured over plaintext HTTP (the audit endpoint returned 426). The CI workflow runs it against HTTPS. No advisory result was observed locally; this is an environment limitation, not a clean audit.
