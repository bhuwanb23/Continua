# Demo Cache Contract — continua-demo-cache-v1

Location: `data/demo-cache/continua-demo-cache-v1/`

| Artifact | Contents | Consumers |
| --- | --- | --- |
| `manifest.json` | version matrix, patient count, artifact sha256 + bytes, `manifest_sha256` | store, validators |
| `panel.json` | panel id/name, patient & flagged counts, gap counts, top patient ids | dashboard |
| `patients.json` | UI summaries: ids, fixture key, display name, age, sex, condition, last contact, gap count, priority score/band | patient list |
| `records.json` | frozen synthetic source records incl. `source_doc_id`, `text`, `content_hash`, `synthetic` | evidence deep dive |
| `timelines.json` | canonical events grouped per patient + `event_store_hash` | timeline view |
| `verified-gaps.json` | `verified_gaps: VerifiedGap[]` only | gap view |
| `evidence.json` | `bundles[]` (one per verified gap) + `deep_dives[]` | evidence drawer |
| `priorities.json` | `gap_priorities[]` and `patient_priorities[]` | scoring/reasoning |
| `queue.json` | panel id, `k`, Top-5 items, `verified_gap_set_hash` | queue screen |
| `impact.json` | `measured`, `modeled`, `scenario_assumptions`, `external_research` | impact screen |
| `evaluation.json` | cache-safe projection of the frozen Phase-9 final report + `source_report_sha256` | evaluation screen |
| `maria.json` | navigation ids only: patient id, queue rank, flagship gap, timeline/gap/evidence ids | demo script |

## Field ownership

- Counting fields are generated from artifacts, never typed by hand.
- `patient_priority_score`, `priority_band`, `rank`, and the queue come from stored priority
  objects; `queue.json` is reproducible from `priorities.json` + `verified-gaps.json` +
  patient display names.
- `maria.json` is navigation metadata. It must never influence ranking, gap output,
  evidence, or scores; the validator rejects a `queue_rank` that disagrees with the stored
  priority rank.

## Provenance chain

```
gap in verified-gaps.json
  → evidence_bundle in evidence.json
  → event ids in timelines.json
  → source_doc_id in records.json
  → continua-synth-v1
```

Every event carries its `source.source_doc_id`; every evidence citation must resolve to a
record and an event owned by the same patient.

## Frozen-run traceability

The cache rebuilds the frozen pipeline deterministically offline (fixture replay, no model
call) across all 80 patients. Event identity is remapped to canonical ids at build time, so
cache gap ids differ from the ids in the frozen Phase-9 run. Clinical identity — patient,
gap type, and title — is compared against the qualified run's VerifiedGap set:

- all 41 final-partition verified gaps are present,
- no extra gaps appear for final-partition patients,
- evaluation numbers are the projection of the same frozen final report.

This check is `benchmark gap identity` in `npm run validate:demo-cache`. A mismatch is a
release blocker: it means the cache and the published benchmark describe different outputs.

## Version matrix

```
cache:      continua-demo-cache-v1
dataset:    continua-synth-v1      eval: continua-eval-v1
events:     clinical-event-v1.1    extractor: extractor-v1
normalize:  normalization-v1       detector: gaps-v1
policy:     gap-policy-v1          evidence: evidence-v1
priority:   priority-v1            benchmark: continua-benchmark-v1
as-of:      2026-06-05
```

## Guarantees

- 80 patients, 66 verified gaps, 42 ranked patients, Top-5 queue.
- 0 candidate gaps, 0 unverified gaps, 0 dangling references.
- 0 ground-truth label tokens (`truth_gap_id`, `scenario_id`, `expected_result`,
  `ground_truth`, `negative_manifest`, `difficulty`).
- 0 LLM, network, or database calls on the read path.
- Implemented by: `lib/cache/builder.ts`, validated by `lib/cache/validate.ts`, served by
  `lib/repositories/json-demo-repository.ts`.
