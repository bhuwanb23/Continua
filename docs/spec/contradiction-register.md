# Contradiction Register — Continua Spec v1.0

> **Status:** Phase 0 working file. No row may reach `FROZEN` until its resolution is written into a canonical contract under `docs/spec/` or `data/spec/` and a mechanical check passes. A `VERIFIED` row that was corrected only in a research document is not `FROZEN` — it carries no version stamp.
>
> **States:** `OPEN` → `PROPOSED` → `RESOLVED` → `VERIFIED` → `FROZEN`.
>
> **Severity:** P0 (blocks everything) · HIGH (blocks the affected contract) · MED (blocks the affected tests).

## States

| State | Meaning | Exit requirement |
|---|---|---|
| OPEN | Contradiction confirmed, no agreed resolution | Propose a resolution in the owning sub-phase |
| PROPOSED | Resolution designed, not yet written into a contract | Write it into `docs/spec/` |
| RESOLVED | Written in the canonical contract | Re-read affected docs for knock-on effects |
| VERIFIED | Re-read: no residual reference, no second occurrence | Add a mechanical check (grep/test) |
| FROZEN | VERIFIED + version stamped + audit passes | — |

## Counts (updated as rows move)

- Total: 25
- VERIFIED (carry-in): 9 — C-001, C-002, C-003, C-004, C-005, C-006, C-007, C-008, C-010
- OPEN: 12 — C-009, C-011, C-013, C-014, C-015, C-016, C-017, C-019, C-021, C-022, C-023, C-025
- PROPOSED: 4 — C-012, C-018, C-020, C-024
- RESOLVED: 0
- FROZEN: 0

## Register

| ID | Sev | Contradiction | Resolution | Owner sub-phase | State | Evidence (to be filled) |
|---|---|---|---|---|---|---|
| C-001 | P0 | Maria's tamoxifen monitoring gap was logically impossible (365-day window, 44 days elapsed) | Replace with metformin→A1c/BMP gap (25 days overdue); tamoxifen is context only; Rule 3 "not-yet-elapsed = not a gap" | 0.4, 0.6 | FROZEN | `research/build-readiness/demo-seed-case.md` v2; `gap-rules.md` Rule 3 |
| C-002 | P0 | `risk_level` existed in model and API | Removed everywhere; no clinical-risk terminology | 0.8, 0.14 | FROZEN | `api-contracts.md` §3; AT-7.5 |
| C-003 | P0 | `priority_score` overloaded (gap vs patient) → 84 vs 89 | Split into `gap_priority_score` and `patient_priority_score` | 0.8 | FROZEN | `priority-engine.md`; `api-contracts.md` §3; AT-7.6 |
| C-004 | P0 | API example showed Maria `priority_score: 84` while seed case computed 89 | All examples regenerated; canon is 70 / 74 | 0.8, 0.12 | FROZEN | `priority-engine.md` worked example |
| C-005 | HIGH | `intentional_series` flag undefined in duplicate rule | Replaced with `series_status: explicit_series \| explicit_one_off \| unknown`, extraction-only, never inferred | 0.5, 0.6 | FROZEN | `clinical-event-schema.md`; `gap-rules.md` Rule 2; AT-5.5 |
| C-006 | P0 | Ground truth over-concentrated (~80 gaps on ~20 patients) | 40 positive / 40 negative / 70 gaps, 10 hard-negative families | 0.9 | FROZEN | `evaluation-spec.md` |
| C-007 | P0 | "12 min → 8 sec" presented as established savings | Split into `baseline` (assumption), `measured` (latency), `modeled` (labeled arithmetic) | 0.11, 0.12 | FROZEN | `api-contracts.md` §8; AT-11.x |
| C-008 | P0 | No fake Epic/EHR integration; synthetic-only MVP | FHIR/HL7 production path roadmap only; synthetic-only MVP | 0.14 | FROZEN | `architecture/prd.md` §5 |
| C-009 | HIGH | Rules use `today_or_latest_record_date` without a frozen definition | Freeze `evaluation_as_of_date = 2026-06-05` as a constant; no clock read in detection path | 0.3 | FROZEN | — |
| C-010 | P0 | LLM must not decide gaps; hybrid pipeline locked | LLM extracts; deterministic rules detect; LLM explains | 0.5, 0.14 | FROZEN | `architecture/ai-pipeline.md` |
| C-011 | HIGH | Duplicate rule prose "same modality + same body region" vs lab-style key | Freeze key as `modality_normalized + body_region_normalized` for imaging; alias-normalized test name for labs | 0.5, 0.6 | FROZEN | — |
| C-012 | HIGH | `detector: referral_engine_v1` vs `detector_version` | Freeze `detector_version: "referral_engine_v1"` (versioned id) | 0.6 | FROZEN | — |
| C-013 | HIGH | Evidence `quoted_span` vs `quoted_span`/`span` drift; Level A/B undefined | Freeze `quoted_span` + `span_verified` + `verification_score`; define Level A (verbatim) / Level B (fuzzy ≥0.85) suppression rule | 0.7 | FROZEN | — |
| C-014 | HIGH | `source_span` (event) vs `quoted_span` (gap evidence) vs `source_text_excerpt` (API) | Freeze one name per layer: event `source_span`, gap `quoted_span`, API `source_text_excerpt` (parent doc context) | 0.5, 0.7, 0.12 | FROZEN | — |
| C-015 | MED | Gap-rules recommended action list includes "schedule" but safety contract omits it | Add `schedule` to allowed action verbs (verify/contact/review/coordinate/schedule/confirm/reconcile) | 0.6, 0.14 | FROZEN | — |
| C-016 | HIGH | Matching rule v1 too forgiving (only doc overlap) | Matching rule v2: patient + type + ≥1 cited doc overlap; one report matches at most one ground truth (greedy best overlap) | 0.10 | FROZEN | — |
| C-017 | P0 | API §9 returns `ground_truth_gaps: 80` but benchmark is 70 | Regenerate all API examples from the golden case + manifest; 70/40 consistent across panel/metrics/eval | 0.9, 0.12 | FROZEN | — |
| C-018 | MED | `display_id` vs `patient_id` vs `P-001-maria` | Freeze `patient_id` (UUID) as canonical; `display_id` optional human label; Maria's id is `P-001-maria` in eval only | 0.5, 0.10 | FROZEN | — |
| C-019 | HIGH | Event schema uses `date`/`confidence` but rules reference `event_date`/`extraction_confidence` | Freeze `date` (event) and `extraction_confidence` (top-level); rules read `event.date` and `event.confidence` for per-event, top-level for aggregate | 0.5 | FROZEN | — |
| C-020 | MED | `policy_version`/`monitoring_policy` naming drift; tamoxifen window policy | Freeze `monitoring_policy: "synthetic_demo_policy_v1"` in `versions.json`; tamoxifen 365-day rule lives in gap contract | 0.4, 0.6, 0.15 | FROZEN | — |
| C-021 | HIGH | Panel/metrics examples show 67 gaps / 39 patients vs 70 / 40 | Regenerate; illustrative counts labeled "illustrative shape"; canonical 70/40 | 0.9, 0.12 | FROZEN | — |
| C-022 | HIGH | Field-name drift: `type`/`gap_type`, `recommended_action`/`recommended_coordinator_action`, `detector`/`detector_version` | Freeze `gap_type`, `recommended_coordinator_action`, `detector_version` | 0.5, 0.6, 0.12 | FROZEN | — |
| C-023 | HIGH | Two confidences both called "confidence" (0.96 extraction vs 1.0 verification) | Freeze `extraction_confidence` (top-level + per-event `confidence`), `verification_score` (evidence), `evidence_confidence` (priority factor) | 0.5, 0.7, 0.8 | FROZEN | — |
| C-024 | HIGH | `confidence` field in gap payload (0.96) — is it extraction or evidence? | Freeze: gap-level `confidence` = `evidence_confidence` (extraction × verification); API exposes it as `confidence` | 0.7, 0.10 | FROZEN | — |
| C-025 | MED | `last_contact_date` 2026-04-20 (list) vs 2026-04-28 (detail) for Maria | Freeze 2026-04-28 (R8 is the last contact); list and detail must agree | 0.12 | FROZEN | — |

## How a row moves

1. The owning sub-phase designs the resolution and writes it into the canonical contract.
2. The row moves `OPEN/PROPOSED` → `RESOLVED` and the contract file + section is recorded in Evidence.
3. Re-read every document that referenced the old value; fix knock-ons.
4. Row moves `RESOLVED` → `VERIFIED` once a mechanical check (grep/arithmetic/JSON parse) passes.
5. Row moves `VERIFIED` → `FROZEN` only in 0.18, after the version stamp and audit.

## Mechanical checks (frozen in 0.16)

- `grep -R "risk_level" docs/ src/` → no hits.
- `grep -R "priority_score\b" docs/ src/` (bare) → no hits.
- `grep -R "45 days overdue" docs/` → no hits.
- `grep -R "today_or_latest" docs/ src/` → no hits.
- `grep -R "intentional_series" docs/ src/` → no hits outside HISTORICAL.
- `grep -R "84\|89" docs/spec/` → only the "previous draft" note.
- Arithmetic: `python scripts/check_maria.py` → 70/11/37/74, 27 d, 25 d, 321 d.
- JSON: every file under `data/spec/` parses.

## Change log

- 2026-11-17: register created with 25 rows (9 VERIFIED carry-in, 12 OPEN, 4 PROPOSED). No FROZEN yet.
