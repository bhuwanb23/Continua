# Phase 23 — Future Production Path

> Depends on: hackathon release · **Not part of the MVP** · Not built, not claimed as built
> Gate: **roadmap is clearly separated from the shipped prototype everywhere it appears**

## Objective

Preserve the vision without polluting the build. This phase is a roadmap document and, at most, exploratory prototypes kept out of the judge path.

## Sub-phases

### 23.1 FHIR / HL7 ingestion path

- Scope: replace synthetic ingestion with standards-based feeds (FHIR R4 resources: Patient, Encounter, DocumentReference, Observation, MedicationRequest, ServiceRequest).
- Prerequisites: a real integration environment, a data-use agreement, a security review.
- Explicitly **not** part of the hackathon build; no code in `app/` claims it.

### 23.2 EHR-embedded coordinator workflow

- Scope: run inside the coordinator's existing EHR context rather than a separate tab.
- Requires vendor partnership / app-platform approval; out of scope for the prototype.
- Keeps the same principle: synthesize, ground, prioritize — do not replace the record system.

### 23.3 Referral-loop actions

- Scope: from "verify" to a closed loop (send referral, track completion, confirm consult).
- Requires write access, audit trails, and clinical governance.
- This is where the measurable ROI compounds: recovered referrals become a tracked percentage.

### 23.4 Clinical validation

- Retrospective validation on de-identified real data.
- Prospective study of coordinator decisions and outcomes.
- Pre-registered metrics; independent review; published limitations.
- **No clinical claim is valid before this step.**

### 23.5 Real coordinator pilot

- Small cohort, defined success criteria (time-to-identification, gap closure rate, false-positive tolerance).
- Safety monitoring and an escalation path.
- Human-in-the-loop remains mandatory.

### 23.6 Specialty expansion

- Oncology → cardiology, endocrinology, post-surgical transitions.
- Each expansion requires its own rule set, windows, and benchmark — not a generic "AI finds gaps" claim.
- Rule-based core makes expansion auditable per specialty.

### 23.7 Separation guardrail

- Roadmap content lives only in `docs/ROADMAP.md` and the final slide.
- The app must not contain feature flags, stubs, or "coming soon" UI for any of the above.
- Every mention uses future tense and states "not implemented".

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/ROADMAP.md` | the six-step path above, with prerequisites |
| final slide (one) | vision without overclaim |
| explicit non-implementation note | in README limitations |

## Gate — exit criteria

- [ ] Roadmap exists only in `docs/ROADMAP.md` + one slide.
- [ ] No code path, flag, or UI stub references FHIR, EHR embedding, or write-back.
- [ ] Every roadmap mention is future-tense and labeled "not implemented".
- [ ] README limitations section links the roadmap without implying progress.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Roadmap quietly becoming a promise | Future tense + "not implemented" in every mention |
| Half-built FHIR client left in the repo | Layer rule: integration code lives outside the MVP tree; not started |
| Judges reading the plan as the product | The demo never shows unmade features |

## Closing note

The hackathon deliverable is Phases 0–22. Phase 23 exists so the idea has a credible future — and so nobody confuses that future with what was actually built.
