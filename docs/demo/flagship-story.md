# Flagship story

## Narrative

1. Sarah, a care coordinator, has 80 synthetic patients.
2. Continua reconstructs their care journeys and verifies continuity gaps.
3. It ranks five coordination issues for review first.
4. Maria is opened — real rank 27, not #1.
5. Her records contain a medical-oncology referral asking for scheduling within 45 days.
   That window passed and no qualifying completed oncology consult (or follow-up) was
   found in the available records for 2026-03-25 → 2026-05-09.
6. One click shows the exact referral quote, the referral-window policy
   (`followup_window_days=45`), the absence check (matching events: 0), and the
   verification status.
7. The evaluation screen proves the hybrid architecture and the frozen benchmark.

## Frozen ids

| Item | Id |
| --- | --- |
| Flagship patient | `6fc752d8-8b56-5977-b41d-0b77c8ecea28` |
| Demo flagship gap (missed oncology follow-up) | `77c292e1-e3d2-52f8-9e5c-d7fdd38cee41` |
| `maria.json` `flagship_gap_id` (duplicate CBC) | `6c55444c-b2fb-5f94-aabf-8f2905c141e0` |
| Backup patient | `2e747376-7b45-5793-802a-247bc9ccd60f` |
| Backup gap | `8ece28d5-1220-5f60-9f2e-b4dc5ff6b94b` |

The two gap pointers disagree because the frozen Phase 10 cache build stored
`mariaGaps[0]`, which is the duplicate CBC gap. Phase 13 does not rewrite frozen
artifacts or ranking. The demo reveals Maria's high-severity missed-followup gap,
read live from `continua-api-v1`, and the manifest records the difference.

## Claim discipline

- Maria's actual panel rank is 27 under priority-v1; the demo shows that value from
  the API and never claims she is #1.
- "No qualifying completed oncology consultation was found in the available
  records" is the exact, supportable phrasing. We never say Maria never saw oncology.
- The LLM extracts facts only. Deterministic rules detect gaps. Evidence verification
  gates what is shown. Intervention priority ranks verified issues.
- All data is synthetic. No real patient data. No clinical validation is claimed.
