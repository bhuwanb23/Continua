# Claim audit

Spoken lines live in `SCENES` (`lib/demo/flagship.ts`) so the script and the screen
cannot drift. Classification:

| Claim | Class | Source |
| --- | --- | --- |
| Care coordinators lack time, not data | SCENARIO ASSUMPTION | workflow framing, not measured |
| 80 synthetic patients | PRODUCT FACT | `panel.patient_count` |
| Ranked review queue, 5 review first | PRODUCT FACT | frozen queue, k=5 |
| Highest-priority verified coordination issues | PRODUCT FACT | priority-v1 |
| Maria is rank 27 | PRODUCT FACT | `patient.priority_rank` (27) |
| Records across primary care/surgery/imaging/labs/meds | PRODUCT FACT | timeline providers |
| Referral asked for follow-up within 45 days | PRODUCT FACT | referral quote + `referral-window` policy |
| No qualifying completed oncology consult found in available records | PRODUCT FACT | absence check, matching events 0, 2026-03-25 → 2026-05-09 |
| Verify referral status and coordinate follow-up | PRODUCT FACT | `recommended_coordinator_action` |
| Unverified gaps are suppressed | PRODUCT FACT | API exposes verified gaps only |
| AI extracts facts; rules detect; evidence verifies; priority ranks | PRODUCT FACT | architecture |
| Frozen synthetic benchmark, held-out and adversarial negatives | PRODUCT FACT | `/api/v1/evaluation` |

Unsupported factual claims: 0. Clinical-treatment claims: 0. Fake integration
claims: 0. Latency, dollar, and outcome claims: none spoken.

Benchmark framing: the frozen benchmark is synthetic and planted. High scores are
reported as plumbing/integrity checks over planted truth, and extraction is fixture
replay — not live model quality. Never present these numbers as clinical accuracy.
