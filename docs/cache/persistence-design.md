# Persistence Design — continua-demo-cache-v1

Phase 10 separates computation from presentation. The intelligence core (extraction →
detectors → evidence → priority → benchmark) runs offline; the judge path only reads a
versioned, immutable snapshot.

```
OFFLINE BUILD                          JUDGE PATH
synthetic records                      continua-demo-cache-v1
  → extractor-v1                         → DemoCacheStore (validate once)
  → clinical-event-v1.1                  → repository interfaces
  → gaps-v1                              → API (Phase 11)
  → evidence-v1                          → coordinator UI
  → priority-v1
  → continua-benchmark-v1
  → demo cache builder
  → validate + hash + freeze
```

## Two storage classes

| Class | Artifacts | Mutability |
| --- | --- | --- |
| Source | `patients.json`, `records.json` | Immutable snapshot of `continua-synth-v1` |
| Derived | `timelines.json`, `verified-gaps.json`, `evidence.json`, `priorities.json`, `queue.json` | Immutable pipeline output |
| Reporting | `evaluation.json`, `impact.json` | Immutable projections of frozen Phase-9 output |
| Navigation | `maria.json`, `panel.json` | Immutable demo metadata |

Coordinator workflow state (acknowledged / contacted / reviewed) is deliberately **not**
stored here. It is mutable, keyed by `gap_id`, and lives outside the cache so a click can
never rewrite `verified-gaps.json`.

## What the cache may and may not contain

Allowed: synthetic records, extracted canonical events, `VerifiedGap` objects,
`EvidenceBundle`s, priority objects, the queue snapshot, the measured benchmark report,
classified impact metrics.

Forbidden: `ground_truth.json`, planted scenario answers, negative-manifest labels, truth
events used as shortcuts, candidate/suppressed gaps, secrets, prompts, stack traces.

The build reads the frozen fixture-replay extractor inputs; the cache itself stores only
pipeline outputs. `verified-gaps.json` never contains a candidate gap, so the UI cannot
render a suppressed candidate by accident.

## Repository layout

```
lib/cache/
  manifest.ts        manifest type + hash convention
  schemas.ts         zod schemas for cached shapes
  canonical-json.ts  deterministic serialization
  hashes.ts          sha256 helpers
  compatibility.ts   version matrix enforcement
  builder.ts         frozen inputs → 12 artifacts + manifest
  source-run.ts      deterministic offline pipeline execution (no LLM, no network)
  benchmark-report.ts frozen Phase-9 report + verified-gap loader
  evaluation.ts      cache-safe projection + leakage tokens
  validate.ts        hashes, references, queue, evaluation, impact, leakage
  semantic.ts        timestamp-insensitive content hashes
  indexes.ts         startup maps
  errors.ts          typed integrity errors
  version.ts         cache version + artifact inventory

lib/repositories/
  demo-cache-store.ts     startup validation + readiness state
  panel-repository.ts     patient-repository.ts   record-repository.ts
  timeline-repository.ts  verified-gap-repository.ts evidence-repository.ts
  priority-repository.ts  evaluation-repository.ts impact-repository.ts
  json-demo-repository.ts facade wiring every reader over one store
```

## Readiness state

`UNINITIALIZED → VALIDATING → READY | INVALID`

Validation happens once at startup: manifest, artifact hashes, cross references, queue
reproducibility, benchmark match, impact classification, leakage audit. On failure the
store is `INVALID`, every read throws `DemoCacheUnavailableError` with
`DEMO_CACHE_INVALID`, and no partial data is served.

## Why JSON

80 patients and ~500 records fit comfortably in memory (~3 MB of JSON). A validated
JSON-backed immutable cache is deterministic, dependency-free, diffable in Git, and fast
enough that the demo shows results immediately. Redis, Kafka, or a database are not
required for P0 and would only add failure modes.

## Performance (measured on this build)

See `artifacts/cache/continua-demo-cache-v1-freeze.json` for cold initialization, queue,
patient, and evidence read timings. Reads are map lookups; no pipeline code runs.
