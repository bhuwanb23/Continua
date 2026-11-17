# Phase 22 — Final Red-Team & Release Gate

> Depends on: Phase 21 (pitch) · Unblocks: release
> Gate: **go/no-go decision with zero open blockers**

## Objective

One independent pass, fresh eyes, four attack surfaces. Ship only when blockers are closed — not when time runs out.

## Sub-phases

### 22.1 Technical attack

- Can a detector be broken by a plausible record set? (Try: consult in a different specialty, consult before referral, series stated ambiguously, lab exactly at window boundary.)
- Can the verifier be fooled by a near-verbatim span?
- Does any path surface an ungrounded gap?
- Does the demo still work with the LLM key removed?

**Blockers:** any ungrounded gap displayed, any crash on a plausible input, any demo dependence on live LLM.

### 22.2 Clinical / safety attack

- Can any screen, explanation, or doc be read as diagnosis or treatment advice?
- Is the "for coordinator verification" cue present on every gap?
- Is the synthetic-data disclaimer unmissable?
- Does any artifact imply EHR integration or HIPAA compliance by deployment?

**Blockers:** any autonomous-action phrasing, any implied clinical validation, any implied live integration.

### 22.3 Product attack

- Can a coordinator understand the first screen in 5 seconds?
- Is the top patient's "why" self-explanatory without a caption?
- Is the evidence one click away from the claim?
- Does anything look like a dashboard rather than a workbench?

**Blockers:** the primary action is unclear, or evidence is more than one click from the claim.

### 22.4 Judge attack

- Three questions from the Q&A bank, delivered cold.
- One question nobody prepared for.
- Score the answers: credible / shaky / unsupported.

**Blockers:** any "shaky" answer on accuracy, differentiation, or safety.

### 22.5 Release decision

```
GO     — all four attack surfaces pass, no open blockers
NO-GO  — any blocker open; list it, fix, re-run that surface only
```

Record the decision, the date, and the evidence for it in `docs/RELEASE.md`.

### 22.6 Final consistency sweep

- Version tag matches the deployed build.
- README numbers == eval report numbers == slides numbers.
- No `risk_level`, no bare `priority_score`, no "12 min → 8 sec" presented as measured.
- Maria's numbers: 70 / 74 / 27 days overdue, three gaps, no tamoxifen gap.
- Submission checklist still 100%.

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/REDTEAM_FINAL.md` | four attacks, findings, resolutions |
| `docs/RELEASE.md` | go/no-go decision + evidence |
| fixed blockers | commits linked from the red-team doc |

## Gate — exit criteria

- [ ] Four attack surfaces documented with findings.
- [ ] Zero open blockers.
- [ ] Consistency sweep clean.
- [ ] Release decision recorded with a named owner.
- [ ] Deployed artifact matches the tagged commit.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Rubber-stamping because the deadline is close | Each attack surface requires written findings, even if "none found" |
| Fixing a blocker without re-testing | Re-run only the affected surface, then re-sweep |
| Red-teaming your own work alone | At least one reviewer who did not build the feature |

## Handoff

Release. Phase 23 begins only after the hackathon, as a separate effort.
