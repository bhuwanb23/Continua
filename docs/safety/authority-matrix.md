# AI Authority Matrix

**Safety version:** `continua-safety-v1`
**Source of truth:** `lib/safety/authority.ts` (`AI_AUTHORITY_MATRIX`)

Authority is split between the model, deterministic pipeline, and human coordinator. The model extracts facts; it never decides that a gap exists. Every patient-facing, clinical, or scheduling decision belongs to a human.

| Capability | Owner | Decision | Rationale |
| --- | --- | --- | --- |
| Extract clinical events from a document | model | allowed | Extraction only; no inference of gaps or risk |
| Normalize and dedupe extracted events | pipeline | allowed | Deterministic, reproducible transformation |
| Detect candidate care gaps | pipeline | allowed | Rule-based detector over canonical events |
| Verify gap evidence | pipeline | allowed | Deterministic evidence checks |
| Assign priority band | pipeline | allowed | Formula over verified gaps only |
| Display a candidate or unverified gap | pipeline | forbidden | Only `VerifiedGap` may reach users |
| Diagnose a patient | model | forbidden | Out of intended use |
| Prescribe or adjust treatment | model | forbidden | Out of intended use |
| Order tests or schedule care | pipeline | forbidden | No autonomous action |
| Contact a patient or provider | human_coordinator | human required | Workflow action records intent only |
| Override a verified gap | human_coordinator | human required | Requires documented coordinator decision |
| Approve release | human_coordinator | human required | Safety gate and release sign-off |

## Enforcement

- **Prompt boundary.** The system prompt states that document text is untrusted data, never instructions, and that the model never decides whether a gap exists.
- **Schema boundary.** The extraction response is a closed schema. Fields such as `gap`, `priority`, `risk_score`, and `recommended_action` are rejected.
- **Pipeline boundary.** Detectors and evidence verification are deterministic TypeScript; they do not accept model-authored conclusions.
- **Display boundary.** APIs serialize `VerifiedGap` only. Candidate gaps never cross the boundary.
- **Action boundary.** The only mutations are coordinator action records with an allowed enum. No order, prescription, message, or scheduling endpoint exists.

## Human oversight contract

Every surfaced gap is reviewed by a human coordinator before any patient-facing, clinical, or scheduling action. Checkpoints: candidate review, evidence inspection, workflow action approval, release sign-off. Overrides require a recorded actor, reason, and timestamp.

See `human-oversight.md` for the operational contract and `tests/safety/authority.test.ts` for the executable checks.
