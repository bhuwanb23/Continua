# Hash Policy — continua-demo-cache-v1

## Algorithms

- SHA-256 everywhere (`lib/cache/hashes.ts`).
- UTF-8 encoding; artifact hashes cover the exact bytes written to disk.
- Canonical JSON (`lib/cache/canonical-json.ts`): recursively sorted keys, no extra
  whitespace, arrays in their frozen order.

## Manifest hash convention

A manifest cannot hash itself naively. The frozen convention (Phase 10.23):

1. Build the manifest object **without** `manifest_sha256`.
2. Serialize it as canonical JSON.
3. SHA-256 that string → `manifest_sha256`.
4. Append the field and write the file.

`verifyManifestSha256` repeats the same steps after removing `manifest_sha256`, so a
tampered version field, patient count, or artifact entry fails even if file hashes are
recomputed by an attacker (they would still need the matching `manifest_sha256`).

## Artifact hashes

`manifest.artifacts[name] = { sha256, bytes }` for all 11 non-manifest artifacts.
`bytes` is the exact UTF-8 length. `validate:demo-cache` recomputes both from disk and
fails on any mismatch — including a single changed byte.

## Volatile timestamps and semantic reproducibility

`generated_at` is the only intentionally volatile field (build time). Two hashes are
therefore defined:

| Hash | Covers | Use |
| --- | --- | --- |
| artifact `sha256` | exact bytes, including `generated_at` | corruption detection |
| semantic hash (`lib/cache/semantic.ts`) | canonical JSON with `generated_at` / `built_at` / `finalized_at` removed | reproducibility and diffing |

For `manifest.json`, the semantic hash replaces the byte-level `artifacts` map with the
semantic hashes of each artifact and drops `manifest_sha256`. This is why two builds with
different `--generated-at` values produce identical semantic hashes and are reported as
reproducible (Gate L), while byte hashes legitimately differ.

Rebuild with a fixed timestamp when byte-identical release output is required:

```
npx tsx scripts/build-demo-cache.ts --generated-at 2026-11-19T00:00:00.000Z
```

## Evaluation provenance

`evaluation.json` includes `source_report_sha256` = SHA-256 of the untouched
`final-report.json`. Validation re-reads that frozen file, recomputes the projection and
the source hash, and requires an exact match. A hand-edited F1 in the cache cannot match
both.

## Hash validation strategy

- Build/CI: all hashes verified (`npm run validate:demo-cache`).
- App startup: manifest/version plus all artifact hashes verified once
  (`DemoCacheStore.initialize()`; disable with `verifyHashes: false` only if profiling
  demands it).
- Request: no re-hashing; reads use already validated in-memory maps.

## What is not hashed

`data/generator/truth-events/truth-events.json` and the benchmark label files are build
inputs for the frozen fixture replay, not cache content. They never appear in the cache or
its manifest, and the leakage audit fails the build if a label token does.
