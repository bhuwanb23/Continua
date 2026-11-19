# Phase 7 Trust Contract

Phase 7 converts deterministic `CandidateGap` records into `VerifiedGap` records only when every required claim is supported by frozen records. The trust boundary is type-level: Phase 8 receives `VerifiedGap[]`, never raw candidates.

## Frozen principles

1. Every positive factual assertion has a canonical event, source document, and exact or bounded-fuzzy source span.
2. Absence is never a fake quotation. It is a machine-readable search over the canonical event store with an explicit identity, event types, and date window.
3. A valid citation does not prove the whole gap. Missing completion evidence is a separate claim.
4. Evidence verification proves that the displayed gap follows from available synthetic records and frozen rules. It is not a claim of clinical correctness or medical necessity.
5. A candidate produced against a different event-store hash is stale and is suppressed.
6. Synthetic benchmark policy is labeled `benchmark_policy`; document-derived policy is labeled `document_extracted`.
7. Any critical failure suppresses the candidate. There is no "lower confidence" path to the coordinator queue.
8. No LLM, no network, no ground-truth label, and no system clock is used at verification runtime.

## Runtime flow

```text
CandidateGap
  → collect positive / absence / policy evidence
  → verify document exists and is owned by the patient
  → verify quoted span with exact or bounded fuzzy support
  → verify critical fields against canonical events
  → re-execute absence queries
  → verify policy identity, version, rule, and provenance class
  → verify required claim coverage
  → VERIFIED (VerifiedGap) or SUPPRESSED (audit record)
```

## Safety language

User-facing claims say "not found in the available records", not "did not happen". Duplicate testing says "possible repeat" and asks whether the repeat was intended. Monitoring says no qualifying result was found by the benchmark due date. Verified gaps never expose a generic model confidence as clinical certainty.

## Version identity

Every verified gap records:

- `evidence-v1`
- clinical event schema
- extractor version
- detector version
- gap policy version
- dataset version
- event-store hash
- evaluation as-of date
- deterministic verification timestamp (`asOfT00:00:00.000Z`)
