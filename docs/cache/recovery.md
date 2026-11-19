# Failure Recovery — Demo Cache

## States

| State | Meaning | Reads |
| --- | --- | --- |
| `UNINITIALIZED` | store constructed, validation not run | throw `DEMO_CACHE_UNINITIALIZED` |
| `VALIDATING` | startup checks in progress | throw until finished |
| `READY` | validated and indexed | served from memory |
| `INVALID` | any check failed | throw `DEMO_CACHE_INVALID` |

`DemoCacheStore.initialize()` never throws; it returns a startup report with
`state`, `validation_duration_ms`, `index_build_duration_ms`, `failure`, and `status`.
Reads call `requireCache()` / `requireIndexes()` and fail closed.

## Failure causes and response

| Symptom | Detected by | Response |
| --- | --- | --- |
| Missing artifact | manifest/hash check | rebuild the cache |
| Changed file without hash update | artifact hash mismatch | restore from Git or rebuild |
| Wrong pipeline version | compatibility matrix | rebuild after the upstream change |
| Shifted evaluation date | compatibility matrix | rebuild with the correct as-of date |
| Dangling gap/evidence/event reference | cross-reference check | rebuild; investigate upstream |
| Hand-edited queue | queue reproducibility | rebuild; never patch queue.json |
| Benchmark mismatch | evaluation/gap-identity check | rebuild from the frozen final run |
| Unclassified impact metric | impact check | fix `impact.json` generation |
| Label token present | leakage audit | treat as a release blocker |

## Rebuild procedure

```
npm run build:demo-cache       # fails if its own output does not validate
npm run validate:demo-cache    # publishes PASS/FAIL per check
npm run freeze:demo-cache      # gates A–L, tamper probes, performance, freeze artifact
```

`build:demo-cache` writes artifacts and `manifest.json` atomically enough for local use:
all 11 artifacts are written before the manifest, so a manifest always describes files that
exist. In CI (`.github`-style pipeline), run `validate:demo-cache` before `next build`; a
committed cache that changes unexpectedly should require review.

## Rollback

The cache is committed. Restore the previous directory from Git and rerun
`npm run validate:demo-cache`:

```
git checkout -- data/demo-cache/continua-demo-cache-v1
npm run validate:demo-cache
```

Because the manifest carries the version matrix and hashes, a restored older cache that no
longer matches the running pipeline is rejected rather than silently served.

## Tamper coverage

`npm run freeze:demo-cache` reruns probes on disposable copies:

- one byte changed without a hash update,
- stale priority version,
- hand-edited queue score,
- missing artifact,

plus the test suite (`tests/cache/tampering.test.ts`) covers a candidate gap inserted into
the cache, evidence swapped to another patient, a stale detector version, a shifted
evaluation date, and reads while `INVALID`.

## User-facing copy

- Invalid at startup: "Demo data couldn't be validated. Reload the application or use the
  packaged demo snapshot."
- Never expose stack traces, file paths, or label data to the user.
- Developer logs include `cache_version`, patient/artifact counts, validation and index
  durations, and the failure cause. Raw record text is never logged.
