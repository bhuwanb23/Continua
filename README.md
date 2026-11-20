# Continua

Continua is a synthetic-data continuity-intelligence prototype for care
coordinators. It reconstructs fragmented care records into a source-linked
patient journey, verifies continuity gaps, ranks verified intervention
priorities, and provides an evidence drawer for every displayed gap.

> **Scope notice.** This repository is a prototype. It is **not** HIPAA
> compliant, **not** clinically validated, and **not** a medical device. All
> patient data is synthetic. It must not be used for real patient care.

## What it does

- Reconstructs a patient journey from fragmented, multi-source records.
- Detects and verifies continuity gaps with source-linked evidence.
- Ranks verified intervention priorities.
- Exposes every displayed gap through an evidence drawer.
- Serves frozen, precomputed artifacts through read-only API routes; the
  judge/demo path performs no live LLM or database calls.

## Requirements

- Node.js `>=20.0.0`
- npm `>=10.0.0`
- No external credentials are required for the demo or validation paths.

## Quick start

```bash
npm ci
cp .env.example .env.local   # optional; demo boots with defaults
npm run validate
npm run dev
```

Then open <http://localhost:3000> and follow `/demo`.

## Configuration

Configuration is documented in `.env.example`. The demo runs with no external
services. Optional providers (LLM, Supabase) are only needed for upstream
data generation, never for serving the frozen demo.

## Validation

Run the full local gate:

```bash
npm run validate
```

Common focused commands:

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Unit and integration tests (Vitest) |
| `npm run test:safety` | Safety-focused tests |
| `npm run test:reliability` | Reliability checks |
| `npm run build` | Production build |
| `npm run demo:check` | Demo readiness check |
| `npm run demo:warm` | Warm the demo cache |
| `npm run validate:submission` | Submission artifact validation |
| `npm run validate:release` | Release artifact validation |

## Project structure

```
app/            Next.js App Router pages and API routes
components/     Shared UI components
data/           Frozen synthetic datasets and artifacts
lib/            Domain logic, schemas, services
scripts/        Validation, generation, and audit tooling
tests/          Test suites
docs/           Architecture, safety, evaluation, and operational docs
artifacts/      Submission, judging, and release artifacts
```

## Architecture

Continua is a Next.js App Router application that serves frozen synthetic
cache artifacts through read-only API routes. Clinical intelligence is
computed upstream and frozen; the serving path does not call live LLMs or
databases. See `docs/architecture/system-overview.md` for details.

## Safety and synthetic data

- All data is synthetic; no real patient information is included.
- Leakage, safety, secrets, and synthetic-data audits are part of `npm run validate`.
- Prohibited claims (production uptime, HIPAA compliance, hosted deployment)
  are checked by `npm run check:safety`.

## Documentation

- `docs/getting-started/evaluator-quickstart.md`
- `docs/architecture/system-overview.md`
- `docs/evaluation/benchmark-card.md`
- `docs/safety/system-card.md`
- `docs/demo/quick-demo.md`
- `docs/troubleshooting/README.md`

## Troubleshooting

If cache validation fails, do not serve partial data. Run
`npm run validate:demo-cache` and consult `docs/demo/fallback.md`.

## Contributing

This is a private prototype repository. Changes should keep `npm run validate`
green and must not weaken safety, leakage, or synthetic-data checks.

## License

All rights reserved. No license is granted for redistribution or clinical use.
