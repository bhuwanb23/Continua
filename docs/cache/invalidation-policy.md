# Invalidation Policy — continua-demo-cache-v1

## Material inputs

The cache is stale when any of these changes:

| Input | Manifest field |
| --- | --- |
| dataset version | `dataset_version` |
| evaluation version | `eval_version` |
| clinical event schema | `clinical_event_schema` |
| extractor / fixture extractor | `extractor_version` |
| normalization | `normalization_version` |
| detector | `detector_version` |
| gap policy | `gap_policy_version` |
| evidence layer | `evidence_version` |
| priority layer | `priority_version` |
| benchmark contract | `benchmark_version` |
| evaluation date | `evaluation_as_of_date` |

`lib/cache/compatibility.ts` compares every field against `EXPECTED_CACHE_VERSIONS`.
Any mismatch throws `CacheVersionMismatchError` (`CACHE_VERSION_MISMATCH`) instead of
quietly loading old output. The same check runs in the store before validation, so a stale
cache never becomes `READY`.

## Behaviour

```
load cache manifest
  → wrong cache_version?             reject
  → any pipeline version differs?    reject
  → hashes/references/queue fail?    reject
  → otherwise READY
```

No migration path is defined for v1. Change the cache version when a breaking shape or
semantics change lands, rebuild, validate, and freeze again.

## Rebuild triggers

Rebuild and re-freeze when:

- any version above changes,
- the frozen Phase-9 benchmark run (`artifacts/benchmark/latest.json`) changes,
- the fixture-replay extraction output changes,
- a validator or schema changes the cached shape.

Commands:

```
npm run build:demo-cache      # rebuild + self-validate + write manifest
npm run validate:demo-cache   # artifact, reference, queue, benchmark, impact, leakage
npm run diff:demo-cache -- <previous-dir> <latest-dir>
npm run freeze:demo-cache     # gates A–L + freeze artifact
```

`build:demo-cache` refuses to print success unless the freshly written cache passes
`validate:demo-cache`; there is no "build now, validate later" path.

## Upstream benchmark mismatch

If the cache's verified-gap set stops matching the frozen final run by clinical identity,
validation fails with `benchmark gap identity`. That means the cache was built from
different pipeline output than the published benchmark — treat it as a rebuild blocker,
not a warning.

## Timestamps

`generated_at` changes on every build. It is excluded from semantic hashes, so a rebuild
from unchanged frozen inputs is still reported as reproducible. Do not use `generated_at`
as a staleness signal; use the version matrix.
