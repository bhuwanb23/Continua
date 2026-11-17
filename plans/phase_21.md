# Phase 21 — Demo, Storytelling & Judge Defense

> Depends on: Phase 20 (package) · Unblocks: Phase 22
> Gate: **rehearsal + red-team passes**

## Objective

Deliver the 90 seconds with conviction and survive the three questions that can kill any healthcare AI project.

## Sub-phases

### 21.1 Narrative structure

1. **Person** — Sarah, 80 patients, three hours of chart review. (10 s)
2. **Failure** — Maria, 27 days past a 45-day oncology window. (10 s)
3. **Product** — 80 → 5, with why and next action. (20 s)
4. **Proof** — evidence drawer + measured benchmark. (25 s)
5. **Credibility** — "the LLM extracts; deterministic rules decide." (15 s)
6. **Close** — the ask: continuity intelligence for coordinators. (10 s)

### 21.2 Q&A bank (write full answers, then shorten)

| Question | Answer shape |
|---|---|
| "Doesn't Epic do this?" | Epic exchanges and organizes records. Continua works on the synthesis layer after arrival: unresolved cross-provider signals, grounded, prioritized for verification. |
| "Is this just an LLM wrapper?" | No. LLM does structured extraction only. Deterministic engines detect gaps; a verifier checks provenance; the system is benchmarked on frozen ground truth. |
| "How do you know it's accurate?" | Open `/eval`: per-type precision/recall/F1, grounding rate, hard-negative pass rate. |
| "Would you deploy this clinically?" | Not in this form. Synthetic data prototype; needs clinical validation, security review, integration, prospective evaluation. |
| "What's the business model?" | Coordinator time and recovered referrals; per-seat for clinics/population-health teams. Modeled, not validated — stated as such. |
| "Why only three gap types?" | Depth over breadth: three high-value, rule-verifiable gaps that can be measured honestly. Expansion is roadmap. |
| "What happens when the model is wrong?" | Nothing is shown ungrounded; coordinator verifies everything; drops are counted as misses in the benchmark. |
| "How is this different from Navina / Innovaccer?" | They prioritize by risk measures and panel analytics. We surface unresolved cross-provider *events* with citation-level evidence for a specific coordinator workflow. |

### 21.3 Delivery rehearsal

- 5 timed run-throughs, 2 recorded and reviewed.
- Trim to 90 s; cut adjectives before cutting evidence.
- Practice the evidence moment as a beat with a pause, not a scroll.

### 21.4 Hostile rehearsal

- One person plays a skeptical technical judge, one plays a clinician, one plays a generalist.
- Each gets 3 questions from the Q&A bank plus one improvised attack.
- Log any answer that wobbles; rewrite and re-rehearse.

### 21.5 Claim discipline on stage

- Say "measured" only for measured values.
- Say "modeled from a 12-minute assumption" for savings.
- Never say "diagnoses", "predicts risk", "integrates with Epic", or "HIPAA-compliant" (we are HIPAA-safe by using synthetic data — a different claim).

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/PITCH.md` | script with timings |
| `docs/QA.md` | full question bank + answers |
| rehearsal notes | wobble log + fixes |

## Gate — exit criteria

- [ ] Script delivered in ≤90 s, five times consecutively.
- [ ] Every Q&A answer is ≤30 seconds and grounded in a fact from the build.
- [ ] Hostile rehearsal survived with no answer requiring a retraction.
- [ ] No claim on stage that `docs/CLAIMS.md` cannot support.
- [ ] Backup video ready if the live demo fails.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Memorizing a script that breaks on one interruption | Beat-based structure, not word-perfect |
| Overselling under pressure | Pre-written honest answers; "not in this form" is a strength |
| Demo drifting past 90 s | Timed rehearsals with hard cuts |

## Handoff to Phase 22

Phase 22 attacks everything one last time with fresh eyes.
