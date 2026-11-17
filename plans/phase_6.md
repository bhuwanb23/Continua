# Phase 6 — Deterministic Gap Engine

> Depends on: Phase 4 (event store), Phase 5 (grounded events) · Unblocks: Phase 7
> Gate: **each detector passes its own corpus, including adversarial cases**

## Objective

Implement the three gap engines as pure, deterministic, independently testable functions. No LLM here. This is the phase that earns the sentence *"the LLM extracts information, but it does not decide whether a care gap exists."*

## Sub-phases

### 6.A Missed specialist follow-up

**Logic**
1. For each `referral` event (specialty S, date D, window W — default 30, oncology 45):
2. Search `consult` / `followup` events with the same normalized specialty in [D, D+W].
3. None found → candidate gap; `overdue_days = today − (D+W)` when positive.
4. Severity: high if `overdue > W` **or** specialty ∈ {oncology, cardiology}; med if `0 < overdue ≤ W`; low if window closes within 7 days.

**Adversarial corpus (must pass all)**

| Case | Expected |
|---|---|
| Referral + consult inside window | no gap |
| Cardiology referral + PCP visit only | **gap** |
| Consult dated before referral | no credit → gap |
| Two referrals, same specialty | one deduped gap |
| Telehealth/phone consult documented | satisfies the referral |
| Referral with no window | default 30 applied |
| Referral explicitly `status: completed` | no gap |

### 6.B Duplicate diagnostic testing

**Logic**
1. Group `lab_result` / `imaging` events by `test_name_normalized`.
2. Pairs within N=14 days, distinct providers or distinct dates → candidate.
3. `days_between` drives the urgency proxy; 3+ repeats collapse into one gap with a count.
4. Severity: high if ≥3 repeats or imaging modality; med if 2× within 7 days; low if 8–14 days.

**Adversarial corpus**

| Case | Expected |
|---|---|
| CBC 8 days apart, two providers | gap |
| Either event `series_status: explicit_series` | no gap |
| Same day, same provider, same test | not a duplicate |
| Three CBMs in 10 days | one gap, count noted |
| CT chest + CT abdomen in 10 days | no gap (different region) |
| Alias variants ("CBC w/ diff" vs "Complete Blood Count") | normalized → gap |

### 6.C Medication monitoring

**Logic**
1. For each `medication_start` in the drug→lab map:
2. Expected labs with windows (metformin → a1c + bmp, 90 d; warfarin → inr, 7 d; tamoxifen → annual oncology follow-up, 365 d).
3. Lab absent **after** window elapsed → gap; missing multiple labs from one trigger → one gap citing all.
4. **Hard rule:** if `start + window` is in the future → no gap, at most `pending_monitoring`.

**Adversarial corpus**

| Case | Expected |
|---|---|
| Metformin 2026-02-10, no A1c by 2026-06-05 | gap, 25 days overdue |
| Metformin + A1c at day 30 | no gap |
| Tamoxifen 44 days in, 365-day window | **no gap** (Phase 0 bug) |
| Medication stopped inside window | no gap |
| Metformin missing both A1c and BMP | one gap, not two |
| Lab exists 5 days after window | gap with lower confidence ("possibly overdue") |

### 6.D Engine harness

- `lib/detectors/index.ts` — `runDetectors(patientId, ctx) → CandidateGap[]`.
- Every candidate carries `trigger_event_ids`, `window_days`, `overdue_days`, `evidence[]`, `detector` id + version.
- Pure functions: same inputs + same `today` → identical output (test asserts deep equality).
- No detector imports the LLM client. Enforced by a lint rule or import check.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/detectors/referral.ts` | follow-up engine |
| `lib/detectors/duplicate.ts` | duplicate engine |
| `lib/detectors/monitoring.ts` | monitoring engine |
| `lib/detectors/config.ts` | windows, severity tables, drug→lab map |
| `lib/detectors/index.ts` | orchestration |
| `tests/detectors/*.test.ts` | one suite per detector + adversarial cases |

## Gate — exit criteria

- [ ] All three suites green, including every adversarial row above.
- [ ] Determinism test: two runs produce identical gap ids and payloads.
- [ ] No detector imports the LLM client (import check).
- [ ] Not-yet-elapsed window produces zero gaps (explicit regression test named after the Phase 0 bug).
- [ ] Detectors run on the full 80-patient store in < 1 s.
- [ ] Each detector reports a `detector` id + version in its output.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Adding an LLM "judge" to improve precision | Forbidden. Fix the rule or the extraction instead. |
| Over-tuning thresholds to the eval set | Thresholds are documented constants; changes require a changelog entry and an eval re-run |
| Detectors reading raw text | Store-only access; review check |
| Merging detectors too early | Each passes its own suite before `runDetectors` combines them |

## Handoff to Phase 7

Phase 6 produces *candidate* gaps. Phase 7 decides which survive verification. Nothing is shown to a user until it passes Phase 7.
