# Extraction Design — Phase 5

## Pipeline (frozen ordering)

```
RecordRepository.listByPatient
 → prepareExtractionEnvelope (whitelisted; no fixture/scenario/truth keys)
 → chunkDocument (1 doc = 1 request unless over MAX_DOC_CHARS; offsets preserved)
 → ClinicalEventDocumentExtractor.extractDocument (fixture | LLM)
     retry ≤3 attempts total, transient/format failures only
     document-level candidate cache
 → gateCandidateResponse (strip+log SCHEMA_UNSUPPORTED_KEY, strict parse)
 → provenance verification (doc exists → patient owns → span ≥0.85 → server offsets)
 → canonicalizeClinicalEvents (normalize → identify → validate; CE-001..010)
 → reconcile (cross-document, fingerprint + mention_context)
 → sortClinicalEvents → ClinicalEventStore + canonical cache
```

Architectural rule: nothing above the canonical-event repository imports gap
detectors, the priority engine, `ground_truth.json`, or `negative_manifest.json`
(enforced by `scripts/check-leakage.ts`).

## Two extractors, one contract

- `FixtureDocumentExtractor` — deterministic, offline, no network. Used by
  unit tests, CI, later detector development, and offline demos.
- `LLMClinicalEventExtractor` — provider-backed, used for benchmark runs.
Both emit the same `CandidateClinicalEvent` contract. The patient-level
Phase 1 interface (`ClinicalEventExtractor`) is unchanged; `batch.ts` bridges
document extractors into it.

## Provenance

Single implementation in `lib/provenance/`, delegated to by
`lib/clinical-events/validate.ts`. Exact containment after formatting
normalization → score 1.0; fuzzy ≥0.85 → accepted with measured score;
below → whole candidate rejected (never keep the fact and drop the citation).
Offsets are computed server-side, never trusted from the model.

## Reconciliation rules (conservative, frozen)

Identity = `eventFingerprint` (patient + type + date + normalized keys + lab
value / imaging key).

1. Same fingerprint, all `contemporaneous`, identical result value → one
   occurrence. Representative = earliest source document date, tie-break
   `source_doc_id`. Supporting documents recorded in the reconciliation ledger.
2. `historical_reference` matching an existing occurrence fingerprint →
   attach as additional provenance in the ledger; never a new occurrence.
3. `historical_reference` with no match → retained conservatively with
   `mention_context: "historical_reference"`.
4. `unknown` → retained separately unless fingerprint AND result value are
   identical (copied-text case). Similarity alone never merges events.

The ledger (`merged_duplicates`, `attached_provenance`, `retained_historical`)
lives beside the store; the canonical schema is not extended for it.

## Retry policy

Max 3 attempts total, exponential backoff. Retryable: 429, provider 5xx,
timeout, malformed structured response. Never retried: unsupported span,
normalization failure, schema-incompatible factual content, missing document.

## Patient status

`COMPLETE | PARTIAL | FAILED`. A failed document never produces fallback
events and never lets a patient be reported as fully analyzed. Maria must be
COMPLETE in the official demo.

## Cache keys

- Candidate cache: sha256(content_hash | model | prompt_version |
  candidate_schema_version). Document-level.
- Canonical cache: candidate key + normalization_version +
  clinical_event_schema version + reconciliation version. Normalization
  changes invalidate canonical outputs even when extraction is unchanged.

Cached runs are flagged `live_or_cached: "cached"` and excluded from latency
claims. Benchmark evaluation always runs live extraction.

## Observability

Per request: request_id, patient_id, document_id, provider, model,
prompt_version, candidate_schema_version, latency_ms, attempt_count, status,
candidate/accepted/rejected counts, tokens when the provider reports them.
Full record text is never logged.