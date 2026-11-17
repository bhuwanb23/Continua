# Phase 13 — Oncology Flagship Experience

> Depends on: Phase 12 (UX) · Unblocks: Phase 14, 17
> Gate: **full demo path works end-to-end from cache**

## Objective

Make Maria's story unforgettable without bending the truth. The emotional climax is a real, grounded, computed result — not a staged one.

## Sub-phases

### 13.1 Flagship regression case

- `tests/flagship/maria.test.ts` asserts: 8 events, exactly 3 gaps, 1 missed follow-up (27 days overdue), 1 duplicate CBC, 1 metformin monitoring gap, **no tamoxifen gap**, scores 70 / 11 / 37, patient 74.
- This test is the canary for Phases 5–8. If it breaks, the demo breaks.

### 13.2 Beats (90 s)

| Time | Beat |
|---|---|
| 0–15 s | Sarah's panel: 80 patients, 3 hours of chart review. |
| 15–30 s | 80 → 5. Queue appears; Maria is rank 1. |
| 30–50 s | Open Maria. Header + priority 74 with the "why" line. |
| 50–65 s | Timeline: 8 events across 4 providers — fragmentation becomes visible. |
| 65–75 s | Reveal: referral 2026-03-25, window 45 days, no oncology consult. |
| 75–85 s | Evidence drawer: verbatim span, provider, date, 0.96 verification. |
| 85–90 s | Impact: measured latency + modeled savings, clearly separated. |

### 13.3 Visual storytelling in the timeline

- The absence must be *visible*: the Oncology phase shows the referral and a labeled empty slot ("no consult recorded in window") rather than nothing.
- Provider color/labels make multi-provider fragmentation legible in one glance.
- No animation may obscure the evidence; motion serves comprehension, never spectacle.

### 13.4 Copy (final)

- Climax line: *"Sarah reviewed Maria's chart yesterday. She missed this. Continua surfaced the unresolved follow-up in seconds."*
- Use the **measured** processing time only once Phase 9 has it; never hardcode "8 seconds" into the UI copy — pull from `measured_summary_latency_sec`.
- Language check: "surfaced the unresolved follow-up for verification", never "knew she needed treatment".

### 13.5 No-rig guarantee

- Maria's rank is produced by Phase 8 on frozen data.
- Document her computed position. If she is not #1, either the data is wrong (fix Phase 2) or the story changes — the formula does not move.

### 13.6 Demo mode toggles (dev only)

- `?scene=queue|patient|evidence` deep links for rehearsal.
- A `?slow=1` flag to simulate latency and verify loading states.
- These flags exist for rehearsal only and are documented as such.

## Deliverables

| Artifact | Purpose |
|---|---|
| `tests/flagship/maria.test.ts` | flagship canary |
| `docs/DEMO_SCRIPT.md` | beat-by-beat script with timings |
| `components/oncology-phase.tsx` | timeline phase with visible absence |
| deep-link handlers | rehearsal support |

## Gate — exit criteria

- [ ] Flagship test green: 3 gaps, no tamoxifen gap, 70/11/37, patient 74.
- [ ] Full path from empty state → queue → Maria → evidence → impact runs without a dead end.
- [ ] The visible-absence element renders and is explained in the script.
- [ ] Measured latency is read from data, not typed into copy.
- [ ] Maria's rank is confirmed computed (test asserts derivation, not a hardcoded rank).
- [ ] Script timings sum to ≤90 s.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Hardcoding Maria to rank 1 | Rank derived; test asserts derivation path |
| "8 seconds" typed into UI copy | Pull from `measured_summary_latency_sec` |
| Over-animating the reveal | Motion budget: one transition per beat |
| Story drifting into clinical claims | Copy reviewed against the language allowlist |

## Handoff to Phase 14

Phase 14 makes the numbers behind the story visible and honestly labeled.
