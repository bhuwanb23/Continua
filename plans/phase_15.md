# Phase 15 — Safety, Privacy & Responsible AI

> Depends on: Phase 14 (surfaces complete) · Unblocks: Phase 16
> Gate: **safety regression suite passes**

## Objective

Make the human-in-the-loop boundary explicit everywhere it can be violated: UI copy, API fields, generated explanations, docs, and the pitch.

## Sub-phases

### 15.1 Disclosure layer

- Persistent banner on every screen: *"Synthetic demo data — no real patient information."*
- Every clinical API response carries `disclaimer`.
- Data provenance note: synthetic records only; production path (FHIR/HL7) is roadmap, not built.

### 15.2 Action-language enforcement

- Allowlist: verify, contact, review, coordinate, confirm, reconcile, schedule, follow up.
- Blocklist: order, prescribe, diagnose, treat, discontinue (outside negated disclaimers).
- Implemented as `lib/safety/actionLanguage.ts`, used by:
  - the explanation layer (blocks generated text),
  - a lint-style test over the demo cache,
  - a CI check over static UI copy.

### 15.3 Human-in-the-loop affordances

- Every gap card ends with a verification prompt ("for coordinator verification").
- "Mark actioned" records a coordinator decision; it never takes an action.
- No auto-send, no auto-schedule, no write-back to any system.

### 15.4 Privacy posture

- No PHI: no real names, MRNs, SSNs, phone numbers, addresses, real institutions.
- `scripts/check-no-phi.ts` greps the repo and generated data for PHI-like patterns.
- No analytics/tracking third parties in the demo build.
- No secrets in the repo; `.env.example` only.

### 15.5 Responsible-AI documentation

`docs/RESPONSIBLE_AI.md` covering:

- What the system does / does not do.
- Why deterministic rules decide gaps (and the LLM does not).
- Known bias and coverage limits (synthetic data, three gap types, small rule set).
- No clinical validation, no regulatory clearance, not for clinical use.
- Human coordinator remains the decision-maker.
- Roadmap prerequisites for real deployment: validation, security review, integration, prospective study.

### 15.6 Safety regression suite

Tests asserting:

- No UI string contains a blocked verb in an actionable context.
- No generated explanation violates the allowlist.
- Every API clinical response includes `disclaimer`.
- No gap is displayed without "for coordinator verification".
- Patterns for PHI-like strings return zero matches.

## Deliverables

| Artifact | Purpose |
|---|---|
| `lib/safety/actionLanguage.ts` | allowlist/blocklist enforcement |
| `scripts/check-no-phi.ts` | PHI pattern scan |
| `docs/RESPONSIBLE_AI.md` | responsible-AI statement |
| `tests/safety/*.test.ts` | regression suite |

## Gate — exit criteria

- [ ] Safety suite green across UI copy, generated explanations, and API responses.
- [ ] PHI scan clean.
- [ ] Banner present on 100% of screens (test enumerates routes).
- [ ] `docs/RESPONSIBLE_AI.md` states all non-claims explicitly.
- [ ] No code path writes to any external clinical system.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| A generated sentence implies treatment advice | Blocklist + fallback template |
| Banner removed during polish for aesthetics | Route-enumerating test fails if missing |
| Overclaiming in the pitch, not the app | CLAIMS.md + Phase 21 rehearsal |

## Handoff to Phase 16

Phase 16 deliberately tries to break the system, including these safety guarantees.
