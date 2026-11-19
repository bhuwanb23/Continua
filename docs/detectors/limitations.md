# Phase 6 Limitations

## Extracted benchmark is a fixture run

The committed extracted benchmark uses `extractor-v1` in fixture mode. It proves
the extraction → canonical store → detector path and ID alignment, but it is not a
live LLM extraction quality result. A live-model run must use the Phase 5 LLM
extractor and must be reported separately.

## Oracle results are rule-engine results

Oracle mode uses frozen truth events canonicalized through the same ClinicalEvent
contract. Perfect oracle metrics show rule/policy consistency with the benchmark;
they are not generalization evidence.

## Benchmark-only duplicate policy

The frozen `continua-eval-v1` contracts use a 14-day duplicate window for both lab
and imaging duplicates. Phase 6 follows that frozen contract. The older
`lib/policies/duplicate-windows.ts` still contains a 30-day imaging entry for
separate downstream policy use; it is not used by the detector. This discrepancy
should be reconciled in a future versioned policy change rather than changed
silently.

## Frozen Maria timeline

The Phase 6 plan text describes a 2026-04-18 oncology referral. The frozen
canonical Maria fixture and `continua-eval-v1` truth use **2026-03-25**, due
**2026-05-09**, overdue **27 days**. The implementation follows the frozen
artifact. The plan text is stale on this point.

## No patient-specific logic

Maria is used only in regression tests. Detector source contains no Maria ID,
fixture key, or patient-specific branch.

## No clinical authority

Severity and coordinator actions are workflow labels. They do not diagnose,
recommend treatment, prescribe, determine medical necessity, or estimate clinical
risk.

## Current scope

- No evidence verification or suppression; that is Phase 7.
- No priority queue; that is a later phase.
- No cross-detector patient aggregation; that is Phase 8.
- No live model benchmark in this phase.
- No real PHI; the dataset is synthetic.
