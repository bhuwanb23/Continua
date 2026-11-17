# Continua — Master Build Plan

> **This is the single source of truth for execution.** Not a strategy document. Every phase file in `plans/` is authoritative for its own scope; this file is authoritative for order, gates, and the contracts that cannot drift.
>
> Status: Strategy ✅ · Research ✅ · Define ✅ · Refine ✅ · Ideation ✅ · Architecture ✅ · Build Readiness ✅ (frozen, 6 corrections) · **Master Plan ✅ locked** · Implementation ⏭️ **Phase 0 (spec freeze gate) — active**

---

## 1. North Star

**80 patients → the 5 who need attention today → why → evidence → next coordinator action.**

| Dimension | Locked value |
|---|---|
| Primary user | Care Coordinator |
| Secondary user | Nurse Navigator |
| Demo vertical | Oncology |
| Core intelligence | Cross-provider record synthesis + deterministic continuity-gap detection + evidence grounding + explainable intervention prioritization |
| Core interaction | 80 patients → 5 actions |
| Working name | Continua (descriptor: continuity intelligence for care coordinators) |

### Locked gap types (three, no more)

1. Missed specialist follow-up
2. Duplicate diagnostic testing
3. Medication-monitoring gap

### Safety boundary

Continua is **decision support for coordinator verification**, not autonomous diagnosis or treatment. Actions are verify / contact / review / coordinate / confirm / reconcile. Never order / diagnose / treat / prescribe / discontinue.

---

## 2. Master Architecture

```
Synthetic messy records
        ↓
Structured LLM extraction
        ↓
Schema + provenance validation
        ↓
Clinical-event normalization
        ↓
Normalized longitudinal event store
        ↓
┌─────────────────────────────┐
│ Deterministic gap engines   │
│                             │
│ 1. Specialist follow-up     │
│ 2. Duplicate testing        │
│ 3. Medication monitoring    │
└─────────────────────────────┘
        ↓
Evidence verification
        ↓
Explainable intervention priority
        ↓
Coordinator queue
        ↓
Patient timeline + evidence + action
        ↓
Impact + benchmark results
```

**The architectural principle that must survive every phase:**

> The LLM extracts facts. It does not decide whether a care gap exists.

If a phase tempts you to let the model "judge" a gap, stop. That is the one thing the whole design is built to avoid.

---

## 3. Phase Map

| Phase | Name | Primary outcome | Gate |
|---|---|---|---|
| 0 | Specification Freeze & Contradiction Elimination | One internally consistent, versioned v1.0 contract set | Zero unresolved P0 contradictions + `CONTINUA SPECIFICATION v1.0: FROZEN` |
| 1 | Repository & Engineering Foundation | Reproducible development environment | Clean clone boots + tests pass |
| 2 | Synthetic Healthcare Dataset | Frozen 80-patient realistic dataset | Data validation passes |
| 3 | Ground Truth & Benchmark Set | Independent frozen evaluation corpus | Labels frozen before pipeline tuning |
| 4 | Clinical Event Model | Canonical typed representation | Schema/normalization tests pass |
| 5 | Extraction & Provenance Engine | Messy records → grounded events | Extraction benchmark passes |
| 6 | Deterministic Gap Engine | Detect exactly 3 continuity gaps | Unit + adversarial tests pass |
| 7 | Evidence & Trust Layer | Every surfaced gap is inspectably grounded | 100% citation validity |
| 8 | Intervention Priority Engine | Explainable panel prioritization | Deterministic ranking |
| 9 | Intelligence Benchmarking | Measure correctness end-to-end | Actual metrics published honestly |
| 10 | Persistence & Demo Cache | Fast deterministic judge demo | Works without live LLM |
| 11 | Backend / API Layer | Frozen contracts exposed reliably | Contract tests pass |
| 12 | Coordinator UX | Intelligence becomes usable workflow | Critical workflow ≤3 interactions |
| 13 | Oncology Flagship Experience | Maria story is unforgettable | Full demo path works |
| 14 | Impact & Evaluation Experience | Business + technical value visible | Claims trace to measured/modeled values |
| 15 | Safety, Privacy & Responsible AI | Explicit human-in-loop boundaries | Safety regression suite passes |
| 16 | Reliability & Failure Testing | Survive realistic failures | P0 regression suite green |
| 17 | Performance & Demo Hardening | Fast, deterministic experience | Demo < 90 s repeatedly |
| 18 | Product Polish & Visual Identity | Judge-ready design | UI/UX review passes |
| 19 | Documentation & Reproducibility | Evaluator can understand and run it | Fresh-machine reproduction |
| 20 | Submission Package | Complete hackathon deliverables | Checklist 100% |
| 21 | Demo, Storytelling & Judge Defense | Winning 90-second narrative | Rehearsal + red-team passes |
| 22 | Final Red-Team & Release Gate | Independent final acceptance | Go/no-go release |
| 23 | Future Production Path | Credible post-hackathon roadmap | Clearly separated from built MVP |

Each phase has its own file: `plans/phase_0.md` … `plans/phase_23.md`. Every phase file follows the same shape: **Objective → Sub-phases (numbered N.1, N.2, …) → Deliverables → Gate (exit criteria) → Risks & anti-patterns → Handoff**.

| Phase | File | Sub-phases |
|---|---|---|
| 0 | `plans/phase_0.md` | 0.0 gate + 0.1–0.19 |
| 1 | `plans/phase_1.md` | 1.1–1.7 |
| 2 | `plans/phase_2.md` | 2.1–2.7 |
| 3 | `plans/phase_3.md` | 3.1–3.5 |
| 4 | `plans/phase_4.md` | 4.1–4.6 |
| 5 | `plans/phase_5.md` | 5.1–5.7 |
| 6 | `plans/phase_6.md` | 6.A–6.D |
| 7 | `plans/phase_7.md` | 7.1–7.5 |
| 8 | `plans/phase_8.md` | 8.1–8.7 |
| 9 | `plans/phase_9.md` | 9.1–9.6 |
| 10 | `plans/phase_10.md` | 10.1–10.5 |
| 11 | `plans/phase_11.md` | 11.1–11.6 |
| 12 | `plans/phase_12.md` | 12.1–12.7 |
| 13 | `plans/phase_13.md` | 13.1–13.6 |
| 14 | `plans/phase_14.md` | 14.1–14.5 |
| 15 | `plans/phase_15.md` | 15.1–15.6 |
| 16 | `plans/phase_16.md` | 16.1–16.4 |
| 17 | `plans/phase_17.md` | 17.1–17.5 |
| 18 | `plans/phase_18.md` | 18.1–18.6 |
| 19 | `plans/phase_19.md` | 19.1–19.6 |
| 20 | `plans/phase_20.md` | 20.1–20.6 |
| 21 | `plans/phase_21.md` | 21.1–21.5 |
| 22 | `plans/phase_22.md` | 22.1–22.6 |
| 23 | `plans/phase_23.md` | 23.1–23.7 |

---

## 4. Execution Order

**Intelligence core** — no UI until this is credible:

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

**Product:**

```
10 → 11 → 12 → 13 → 14
```

**Trust, reliability, polish:**

```
15 → 16 → 17 → 18
```

**Winning submission:**

```
19 → 20 → 21 → 22
```

**Phase 23 is future-facing only.** It must never bleed into the build.

### Why this order is non-negotiable

A beautiful Next.js/Tailwind dashboard over a weak, unmeasured backend is a weak project with better fonts. Phases 0–9 produce a measured, grounded, deterministic intelligence layer. Only then does a screen make sense.

---

## 5. Canonical Values (shared across all phases)

These appear in many documents. They must never disagree.

### Demo patient: Maria Chen (`P-001-maria`)

| Item | Value |
|---|---|
| Demo "today" (`evaluation_as_of_date`) | 2026-06-05 |
| Referral to medical oncology (R4) | 2026-03-25 |
| Window | 45 days → elapsed 2026-05-09 |
| Overdue | **27 days** |
| Gap score | `gap_priority_score = 70` (CRITICAL) |
| Patient score | `patient_priority_score = 74` (CRITICAL) |
| Duplicate CBC (R6, R8) | 2026-04-20 / 2026-04-28 → 8 days, score 11 (LOW) |
| Metformin → A1c/BMP (R1) | start 2026-02-10, due 2026-05-11, **25 days overdue**, score 37 (MEDIUM) |
| Tamoxifen | context only — **not** a detected gap (365-day window not elapsed; 321 days remaining) |

### Benchmark (`continua-eval-v1`)

| Property | Value |
|---|---|
| Patients | 80 (40 positive / 40 negative) |
| Gaps | 70 total — 28 follow-up, 22 duplicate, 20 monitoring |
| Hard negatives | 10 mandatory families (completed referral, wrong-specialty neighbour, referral inside window, explicit series, same-day duplicate, imaging different region, med stopped early, alias-covered monitoring, boundary monitoring, malformed event) — defined in Phase 0 |
| Positive traps | specialty mismatch (cardiology referral + PCP visit) — must flag |

### Terminology (frozen)

| Use | Never use |
|---|---|
| Intervention priority | Clinical risk score |
| `patient_priority_score` | bare `priority_score` |
| `gap_priority_score` | `risk_level` |
| `priority_band` | "patient risk" |

### Claim discipline (frozen)

| Category | Example | Rule |
|---|---|---|
| `baseline` | 12 min manual review | Always `baseline_type: "scenario_assumption"` |
| `measured` | 8.1 s synthesis latency | Produced by a real run, never hardcoded |
| `modeled` | ~15 h saved per panel | Always labeled modeled, formula shown |

---

## 6. Master Gates

Progression stops if any gate fails.

| Gate | Name | Requirement | Enforced at |
|---|---|---|---|
| **0** | Specification Frozen | Zero unresolved contradictions; `CONTINUA SPECIFICATION v1.0: FROZEN` | Phase 0 |
| **A** | Data Integrity | Frozen synthetic benchmark internally correct; every planted gap explainable by a human without detector output | Phase 2–3 |
| **B** | Intelligence | Three detectors work against genuine negatives, not only planted easy positives | Phase 6 |
| **C** | Grounding | Every surfaced claim traceable to a document + span; ungrounded claims suppressed | Phase 7 |
| **D** | Evaluation | Actual metrics exist; no invented performance anywhere | Phase 9 |
| **E** | Demo | 90-second path succeeds repeatedly (20 consecutive runs) | Phase 17 |
| **F** | Safety | No autonomous diagnosis/treatment claims; action language passes the linter | Phase 15 |
| **G** | Submission | Every CodeForDFW deliverable ready before release | Phase 20 |

---

## 7. Definition of Done (whole project)

- [ ] Gate 0 (spec frozen) and gates A–G all passed.
- [ ] Detectors measured on `continua-eval-v1`; actual P/R/F1 reported, whatever they are.
- [ ] Grounding accuracy 100% (or the failure honestly explained).
- [ ] Demo runs in < 90 s, 20× consecutively, with no LLM key required.
- [ ] Maria is rank #1 **because the rules put her there**, not because anything was rigged.
- [ ] No `risk_level`, no bare `priority_score`, no fake Epic integration, no real PHI.
- [ ] Fresh machine can clone, install, seed, and run the demo from the README.
- [ ] Submission checklist 100%.

---

## 8. Reference Documents

- **`docs/spec/` + `data/spec/` — the canonical, versioned contract set produced by Phase 0.** Implementation depends on these, not on research drafts.
- `research/build-readiness/` — pre-Phase-0 specs (data, event schema, gap rules, priority, eval, API, seed case, acceptance tests). Input to Phase 0; historical afterwards.
- `research/architecture/` — PRD, UX flow, pipeline, schema, demo storyboard, build plan.
- `research/refine/` — competitor analysis, gap types, coordinator workflow, locked thesis.
- `research/ideation/` — red-team, alternative visions, judge simulation, memorability, naming.
- `research/define/`, `research/problems/` — problem evidence base.
- `plans/phase_*.md` — execution detail.

If a phase file and a frozen spec disagree, **the spec wins** and the phase file must be corrected. The specs are the contract; the plan is the route. After Phase 0, "the spec" means `docs/spec/`, never a research draft.
