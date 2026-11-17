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

- Synthetic data only. No real PHI, no EHR integration, no autonomous clinical action.
- Continua ranks **intervention priority** for coordinator triage — it does not predict clinical risk.
- Clinical intelligence is **not implemented yet** (Phase 1 is the engineering foundation).

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
npm run test:e2e      # Playwright (later phases)
npm run build         # production build
```

## Specification

The frozen contract lives in [`docs/spec/SPEC-v1.0.md`](docs/spec/SPEC-v1.0.md) (**CONTINUA SPECIFICATION v1.0: FROZEN**).

## Current status

Phase 1 engineering foundation. Clinical intelligence is **not** implemented yet. The shell exists to prove the repository installs, validates, tests, builds, and boots.
