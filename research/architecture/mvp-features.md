# MVP Feature List — Continua

Prioritization rule: a feature ships only if it directly serves the demo's 6 scenes and the core outcome (80 → 5). Anything else is Should/Nice or out of scope (`out-of-scope.md`).

## Must Have (ship in MVP — demo depends on these)

1. **Synthetic oncology panel data** (≈80 patients) with planted gaps guaranteeing the wow line. (FR-9)
2. **One-click "Load demo data."** (FR-6 setup)
3. **Panel dashboard** with top-5 queue + one-line "why" + severity. (FR-4, FR-7)
4. **Patient detail** with unified timeline (cross-provider, chronological). (FR-2, FR-8)
5. **Gap detection for all 3 types** with evidence citations. (FR-3)
6. **Prioritization / risk ranking** producing top-5. (FR-4)
7. **Evidence deep-dive** (source snippet + doc id). (FR-5)
8. **Impact summary** (time saved, gaps caught, cost avoided). (FR-7)
9. **"Synthetic data" banner** (always visible). (NFR-1)
10. **LLM response caching** for the demo panel (deterministic demo). (NFR-3)
11. **Basic loading + error states.** (NFR-4)
12. **Eval harness (P0, not optional)** with precision/recall/F1 per gap type + macro F1 + grounding/citation accuracy + extraction accuracy + latency, run against a frozen ground-truth set. (FR-10) — required to answer "how do you know the AI found the right gaps?"
13. **Structured clinical-event extraction** (LLM) feeding deterministic detectors. (FR-2/FR-3)

## Should Have (ship if time permits; strengthens judging)

14. **Panel patients list** with filter/search. (FR-5 screen)
15. **Custom data upload** (CSV/JSON) for a non-demo panel.
15. **"Mark actioned" / action recording** (local state).
16. **About/Method page.** (Screen 9)

## Nice to Have (only if ahead of schedule)

17. Second demo vertical (e.g., diabetes monitoring) to prove generality.
18. Export recommended actions to CSV.
19. Simple trend view (gaps over time) — needs multi-snapshot data, skip unless trivial.
20. Keyboard shortcuts for queue navigation.

## Explicitly NOT in MVP (see out-of-scope.md)

Patient portal, EHR write-back, real PHI, multi-tenant, scheduling, chatbot, symptom checker, interoperability network, multi-hospital.

## Build priority order (if time runs short)

1. Demo data + caching (without this, nothing demoable).
2. Timeline reconstruction (the visual "wow" engine).
3. Gap detection (the intelligence).
4. Prioritization + dashboard (the product).
5. Evidence grounding (the credibility).
6. Impact summary + eval (the judging narrative).

If forced to cut, cut in reverse: custom upload → patient list → impact metrics polish → evidence deep-dive polish. **Never cut** timeline, extraction, gap detection, evidence grounding, top-5 queue, or the eval harness (P0).