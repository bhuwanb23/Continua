# Continua

Continuity intelligence for care coordinators.

> **Synthetic demonstration only.** No real patient information. For coordinator verification only. Not medical advice.

## Problem

Care coordinators work across fragmented records from multiple providers. Referrals, labs, and medication monitoring fall through the cracks not because the facts are missing, but because they are scattered and untriaged.

## What Continua does

```
fragmented records → grounded events → deterministic gap detection → evidence → intervention priority
```

The extraction layer turns records into structured events. Deterministic rules decide whether a care gap exists. The model extracts facts; it does not decide gaps. Every surfaced gap must cite verifiable source spans, and the coordinator remains the final decision-maker.

## Safety

- Synthetic data only (`continua-synth-v1`). No real PHI, no EHR integration, no autonomous clinical action.
- Continua ranks **intervention priority** for coordinator triage — it does not predict clinical risk.
- No clinical validation and no patient-outcome claim. This is a synthetic-data prototype.
- Not HIPAA compliant, not HIPAA certified, and not "HIPAA-safe". The synthetic boundary is enforced at cache startup.

Safety controls are frozen as `continua-safety-v1`: intended and prohibited use contracts, an AI authority
matrix, output-language and absence-scoping guards, synthetic provenance verification, benchmark-truth
isolation, a 40-case adversarial corpus across 20 families, and release gates A–K. See
[`docs/safety/`](docs/safety/) and [`artifacts/safety/`](artifacts/safety/).

## Proof & impact

Measured on the frozen synthetic benchmark `continua-benchmark-v1` (run
`benchmark-20261119-1400-14edc3e-final`, held-out `final` partition, 41 truth gaps):

| Claim | Class | Value |
| --- | --- | --- |
| Held-out Macro F1 | MEASURED | 1.00 |
| Hard-negative pass rate | MEASURED | 1.00 (29/29) |
| Displayed-gap grounding | MEASURED | 1.00 (41 gaps) |
| Top-5 truth precision | MEASURED | 5/5 |

Extraction is fixture replay, so these numbers validate pipeline plumbing and
determinism, not live-model quality. Every value is registered in
`lib/claims/registry.ts`; `npm run validate:claims` checks it against the frozen
artifact, and `npm run export:claims` writes the submission export.

Operational impact is **modeled, not measured**: 20 patients/day × 2 minutes
redirected × 20 days = 13.33 hours/month under stated assumptions. No dollar,
clinical-outcome, or time-saved claim is made.

Surfaces: `/demo` (flagship story), `/evaluation` (proof), `/insights` (impact model).

## Architecture

```
app/          Next.js App Router shell
components/   UI foundations (banner, layout)
lib/          domain contracts, config, determinism, errors, repositories, cache, safety
data/spec/    frozen Phase 0 artifacts
docs/spec/    frozen Phase 0 specification (v1.0)
scripts/      spec/data/env/safety/determinism validators
tests/        unit, contract, integration, e2e
```

Module direction: extraction → normalization → detectors → evidence → priority → services/API → UI. Clinical domain code never imports React.

## Setup

```bash
git clone <repo>
cd continua            # this repository root
npm ci
cp .env.example .env.local
npm run validate
npm run dev
```

Open http://localhost:3000.

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | |
| `NEXT_PUBLIC_APP_NAME` | no | `Continua` | Public. |
| `CONTINUA_DEMO_MODE` | no | `true` | Demo mode needs no external credentials. |
| `CONTINUA_EVALUATION_AS_OF_DATE` | no | `2026-06-05` | Frozen benchmark clock. |
| `LLM_PROVIDER` | no | — | Only for live extraction in later phases. |
| `LLM_API_KEY` | no | — | Server-only. Never `NEXT_PUBLIC_`. |
| `SUPABASE_URL` | no | — | Not required for the shell. |
| `SUPABASE_ANON_KEY` | no | — | Not required for the shell. |

Secrets must never use the `NEXT_PUBLIC_` prefix. All environment access goes through `lib/config/env.ts`.

## Testing

```bash
npm run validate      # lint + typecheck + tests + spec/data/env/safety checks
npm run test          # unit + contract + integration
npm run test:safety   # static audits + 40-case adversarial corpus + safety tests
npm run generate:safety-report   # rebuild artifacts/safety release artifacts
npm run test:e2e      # Playwright (later phases)
npm run build         # production build
```

## Specification

The frozen contract lives in [`docs/spec/SPEC-v1.0.md`](docs/spec/SPEC-v1.0.md) (**CONTINUA SPECIFICATION v1.0: FROZEN**).

## Current status

Phases 0–15 are complete: synthetic dataset and frozen spec, extraction contracts,
deterministic detectors, evidence verification, intervention priority, frozen demo
cache and API v1, coordinator UX, flagship demo, the proof & impact layer, and the
frozen safety, privacy & responsible-AI layer (`continua-safety-v1`).

Not built: FHIR integration, real PHI handling, hospital deployment, clinical trial,
EHR write-back, autonomous care decisions. See `docs/impact/limitations.md`.
