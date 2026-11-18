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
