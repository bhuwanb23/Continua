# Limitations

## What this benchmark does not prove

1. Synthetic data only — `continua-synth-v1`, controlled templates, artificial gap
   prevalence.
2. Three supported gap types: missed follow-up, repeat diagnostic, medication
   monitoring.
3. No real-EHR deployment; no PHI handling.
4. No clinical validation and no patient-outcome measurement.
5. Live extraction is not measured: extraction is fixture replay, and normalization
   accuracy on the annotated sample is 29.5% (18/61).
6. Priority is workflow prioritization, not clinical risk.
7. The LLM-only baseline is not run (no live provider).
8. Benchmark monitoring rules are benchmark policies, not institutional protocols.
9. Worktree cleanliness is reported separately from artifact integrity.

## Measurement defects disclosed rather than hidden

- `failure-funnel.json` stage `support_events_extracted` reports 0 support events for
  a run with 41/41 candidate matches. The stage uses a different event-id namespace
  than the frozen canonical event store. Phase 14 omits the stage and its derived
  per-gap `EXTRACTION` attribution; it does not modify the frozen run.
- The evidence-gate ablation shows no F1 change in this run, because no candidate was
  suppressed. The gate's demonstrated value is the 6/6 corrupted-evidence rejection
  and the grounding scorecard, not an F1 gain.

## Scope

Built: structured extraction (fixture replay), deterministic gap detection, evidence
verification, intervention priority, coordinator UX, frozen benchmark, claim registry.

Not built: FHIR integration, real PHI, hospital deployment, clinical trial, EHR
write-back, autonomous care decisions.

## What would make these claims stronger

- A live-provider extraction run with the same benchmark (then extraction and E2E
  numbers separate).
- A small internal usability study measuring assisted review time (n reported
  descriptively, no significance claims).
- External evidence re-verified against primary sources before any business-case
  figure is published.
