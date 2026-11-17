# User Journey — Continua

## Persona

**Sarah**, Care Coordinator at a primary-care / multi-specialty clinic. Panel of ~80 patients, many with cancer histories or on high-risk protocols. 3 hours/day of chart review. Uses an EHR that shows one patient at a time; records from specialists arrive as PDFs/notes she must open manually.

## Journey A — Current state (the pain)

| Step | Sarah does | Time | Failure mode |
|---|---|---|---|
| 1 | Opens EHR patient list (80 names, no risk signal). | — | No prioritization; treats all equally. |
| 2 | Picks a patient "due for review." | — | Selection is arbitrary / recency-driven. |
| 3 | Opens chart → reads PCP note → opens referral PDF → reads specialist note → opens labs → opens imaging → opens med list. | ~12 min | Reads, but misses cross-document gaps (e.g., referral exists, no consult note). |
| 4 | Decides "looks fine," moves on. | — | Missed follow-up goes unnoticed. |
| 5 | Repeats × 80. | ~16 hours | Cannot finish; skips patients. |
| 6 | Duplicate CBC gets reordered because nobody saw the prior one. | — | Cost + patient burden. |
| 7 | Metformin started; A1c never rechecked. | — | Monitoring gap. |

**Outcome:** 3–5 gaps per panel go undetected per week; Sarah feels behind; patients leak.

## Journey B — With Continua

| Step | Sarah does | Time | System does |
|---|---|---|---|
| 1 | Opens Continua dashboard. Panel (80) already loaded (demo data) or one-click load. | 0 sec | Shows panel size, flagged count, gap-type counts. |
| 2 | Sees **Top 5 patients needing attention today**, each with a one-line "why." | 0 sec | Prioritized queue rendered. |
| 3 | Reads: "Maria Chen — missed oncology follow-up (45 days since imaging). Last seen: 2026-09-12 imaging. No oncology consult note." | 5 sec | Gap + evidence + recency. |
| 4 | Clicks Maria → patient detail: unified timeline (surgery → radiology → labs → meds) + gaps + evidence snippets + recommended action. | 10 sec | Timeline reconstructed, gaps cited. |
| 5 | Clicks "Mark as actioned / schedule follow-up" (or copies the recommended action). | 5 sec | Action recorded (demo: local state). |
| 6 | Returns to queue; handles #2, #3. | — | — |
| 7 | Views impact summary: "1 referral recovered, 1 duplicate CBC avoided, 1 monitoring gap caught. Chart review 12 min → 8 sec." | 0 sec | ROI metric. |

**Total time to identify + understand top 5:** ~1–2 minutes (vs. hours). Sarah catches the patient she missed yesterday — the wow moment.

## Emotional arc (demo)

1. **Recognition:** Sarah's daily reality (overwhelmed, 80 patients).
2. **Frustration:** a real miss (Maria, 45 days, no oncology visit) — Sarah "spent 12 minutes on this chart yesterday."
3. **Relief:** the system found it in 8 seconds, with evidence.
4. **Trust:** every claim cites a source record; eval metric reported.
5. **Impact:** quantified outcome (time, cost, recovered referral).

## Touchpoints

- Dashboard (entry) → Patient detail (drill-down) → Action (mark/contact) → Impact summary.
- No patient portal, no EHR write-back in MVP (out of scope). Export/copy of recommended action only.