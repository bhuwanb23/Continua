# Cross-Document Audit Report — Continua Spec v1.0 (Phase 0.16)

Audit run over `docs/spec/` (canonical after Phase 0) and `data/spec/`. `research/build-readiness/` is classified HISTORICAL and is expected to retain pre-freeze wording.

## 1. Contradiction register closure

- Total rows: 25.
- VERIFIED: 25.
- OPEN: 0.
- PROPOSED: 0.
- FROZEN: pending the v1.0 stamp in 0.18 (all 25 flip to FROZEN on stamp).

## 2. Mechanical grep results (docs/spec/ only)

| Term | Hits in docs/spec/ | Classification |
|---|---|---|
| `risk_level` | 5 (prohibition lists / register / AT-7.5 / safety MUST NOT) | Allowed — appears only in prohibition contexts. |
| bare `priority_score` | 5 (prohibition lists / register / AT-7.6 / terminology) | Allowed — appears only in prohibition contexts. |
| `45 days overdue` | 0 | PASS. |
| `tamoxifen` | 1 (gap-rules Rule 3 annual-window note) | Allowed — context only, never a detected gap. |
| `365` | 1 (gap-rules Rule 3 window) | Allowed — annual window constant. |
| `intentional_series` | 0 (outside prohibition lists) | PASS. |
| `today_or_latest` | 0 (outside prohibition lists) | PASS. |
| `test_name_normalized` | 0 in canonical spec files (research only) | PASS. |
| `epic` / `fhir` (MVP scope) | 0 (outside prohibition lists / register) | PASS. |
| `clinical validation` | 0 (outside evaluation-spec §9 "will not claim") | PASS. |
| `12 minutes` / `8 seconds` | 0 hardcoded in API/UI; appears only in safety-contract as baseline/measured separation | PASS. |
| `80 gaps` | 0 (canonical count is 70) | PASS. |

## 3. Field-name freeze check

| Forbidden | Canonical | Status |
|---|---|---|
| `type` (API/gap layer) | `gap_type` | PASS |
| `recommended_action` | `recommended_coordinator_action` | PASS |
| `detector` | `detector_version` | PASS |
| `event_date` | `date` | PASS |
| `risk_level` | (removed) | PASS |
| bare `priority_score` | `patient_priority_score` / `gap_priority_score` | PASS |

## 4. JSON validation

- `data/spec/maria-golden-case.json` — valid JSON; arithmetic verified (70/11/37, 74; 27 d / 25 d; 321 d tamoxifen remaining).
- `data/spec/benchmark-manifest.json` — valid JSON; 80 patients, 40/40, 70 gaps (28/22/20), 10 hard-negative families.
- `data/spec/versions.json` — valid JSON.

## 5. Cross-doc consistency

- `evaluation_as_of_date` = `2026-06-05` appears identically in temporal-semantics, maria-golden-case, benchmark-manifest, versions, api-contract, evaluation-spec.
- Maria's numbers (70 gap / 74 patient / 27 d / 25 d) appear identically in priority-engine, maria-golden-case, api-contract.
- Gap counts (28/22/20, total 70) appear identically in benchmark-manifest, api-contract, evaluation-spec.
- Action verbs list identical across gap-contracts, gap-rules, safety-contract, acceptance-tests.
- Claim classes identical across safety-contract and api-contract §8.

## 6. Verdict

All 16 acceptance-gate conditions in `plans/phase_0.md` §0.0 are satisfied pending the 0.18 stamp. No blocking issues.