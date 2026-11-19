# Synthetic Data Policy

**Safety version:** `continua-safety-v1`
**Dataset:** `continua-synth-v1` (generator `generator-v1`, frozen content hash)
**Reality:** real PHI is not permitted (`REAL_PHI_ALLOWED = false`).

## Policy

All demo data in this repository is synthetic. The dataset is generated, frozen, hashed, and validated. There is no ingestion path for real patient records, no public upload, and no public live-LLM extraction route.

Real PHI must not be introduced into:

- fixtures, tests, or benchmark data;
- cache artifacts or demo directories;
- logs, traces, or error messages;
- screenshots, documentation, or prompts.

## Enforcement layers

| Layer | Control | Failure behavior |
| --- | --- | --- |
| Dataset | Frozen provenance file with `synthetic: true`, dataset version, generator version, SHA-256 content hash | Validation fails |
| Source records | Each record carries `synthetic` and `dataset_version` | Record rejected |
| Panel and cache manifest | Panel `synthetic: true`; manifest dataset version must match the frozen dataset | Cache initialization fails |
| Runtime store | `DemoCacheStore.initialize()` verifies the synthetic boundary before serving | Every read throws; API returns 503 |
| Release | `scan:synthetic-data` and corpus `synthetic_provenance` cases | Gate fails |

## Identifier scan

`scan-synthetic-data` scans shipped JSON and source data for direct-identifier patterns (SSN, MRN, phone, email, street address) and for PHI-claim language. Findings block release. The scan is a backstop, not a de-identification tool.

## Logging

Logger fields are redacted through `lib/safety/redaction.ts`. Secret-named keys and direct identifiers in free text are replaced before serialization. Redaction failures are treated as defects, not acceptable noise.

## What synthetic data does not prove

- It does not represent real-world demographic or clinical diversity.
- It does not validate clinical accuracy or fairness.
- It does not make the system HIPAA compliant or "HIPAA-safe".

These limits are recorded as residual risks `RS-01` and `RS-02` in `lib/safety/risk-register.ts`.
