# CONTINUA SPECIFICATION v1.0: FROZEN

> **CONTINUA SPECIFICATION v1.0: FROZEN**
>
> Frozen on 2026-11-17. This folder (`docs/spec/`) plus `data/spec/` is the canonical contract set. `research/build-readiness/` is historical input only and must not be used as a source of truth after this stamp.

## Canonical files

**docs/spec/** (15 files)

1. `contradiction-register.md` — 25 contradictions, all FROZEN.
2. `terminology.md` — vocabulary freeze.
3. `temporal-semantics.md` — `evaluation_as_of_date`, window state machine.
4. `clinical-event-schema.md` — frozen event schema.
5. `gap-contracts.md` — shared + per-type gap shape.
6. `gap-rules.md` — three deterministic detectors.
7. `evidence-contract.md` — Level A/B, suppression, naming.
8. `priority-engine.md` — formula, factors, bands.
9. `evaluation-spec.md` — benchmark, matching rule v2, empty results table.
10. `api-contract-v1.md` — frozen v1 API.
11. `acceptance-tests.md` — reconciled ATs.
13. `safety-contract.md` — MAY/MUST NOT/human gate + claim classes.
14. `audit-report.md` — cross-doc mechanical audit.
15. `SPEC-v1.0.md` — this entry point (stamp).

`CHANGELOG.md` (this folder) records state transitions 0.0–0.19.

**data/spec/**

- `maria-golden-case.json` — golden case (70/11/37, 74; 27 d / 25 d).
- `benchmark-manifest.json` — 80 patients, 40/40, 70 gaps, 10 hard-negative families.
- `versions.json` — version constants.

## Key frozen constants

- `evaluation_as_of_date = 2026-06-05`
- Gap counts: 70 total (28 missed_followup / 22 duplicate_test / 20 med_monitoring) across 40 positive / 40 negative patients.
- Maria: gap_priority_score 70, patient_priority_score 74, 27 days overdue (referral), 25 days (metformin).
- Action verbs: verify, contact, review, coordinate, schedule, confirm, reconcile.
- Claim classes: baseline, measured, modeled, sourced.

## Change control

Any change to a frozen contract requires a new spec version (v1.1+) and a new stamp. The contradiction register must record the change. No silent edits.