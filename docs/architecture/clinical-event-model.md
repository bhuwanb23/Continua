# ClinicalEvent v1

`clinical-event-v1` is Continua's typed intermediate representation between
document extraction and deterministic gap reasoning.

Every accepted event has:

- a stable patient/document/event identity;
- an explicit calendar date and precision;
- typed, event-specific payload fields;
- source provenance with exact or fuzzy span verification;
- extraction and normalization versions.

The model contains facts only. It does not contain gap decisions, risk scores,
diagnoses, treatment recommendations, or intervention priority.

Legacy flat events are converted through `lib/clinical-events/legacy-adapter.ts`.
The adapter is the only compatibility boundary; downstream code consumes the
canonical shape.

The runtime schema requires UUID identities for the patient, source document,
event, and resolved provider fields, and accepts only the frozen
`normalization-v1` mapping version. Events with explicit offsets must provide
both offsets, remain inside the source document, and match the quoted span.
Generated event IDs use stable source identity (offset where available,
otherwise the normalized source span), so candidate ordering cannot change
identity.

Phase 4 gate artifacts are written to `artifacts/clinical-events/`:

- `validation-report.json` records the full truth-event and extraction-gold
  migration counts.
- `phase-4-exit-report.json` records the schema hash, provenance counts, and
  detector-sufficiency checks.
