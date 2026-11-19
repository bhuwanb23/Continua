# Human Oversight Contract

**Safety version:** `continua-safety-v1`
**Source of truth:** `HUMAN_OVERSIGHT` in `lib/safety/authority.ts`

## Contract

Every surfaced gap is reviewed by a human coordinator before any patient-facing, clinical, or scheduling action. The system can prioritize and present evidence. It cannot act.

## Checkpoints

1. **Candidate review** — the coordinator sees only verified gaps, each with a gap card labeled "For coordinator verification".
2. **Evidence inspection** — the coordinator can open the evidence drawer to read quoted source spans, absence checks, and policy checks.
3. **Workflow action approval** — the coordinator may record `acknowledged`, `contacted`, or `reviewed`. These records are intent, not execution.
4. **Release sign-off** — a human approves the safety gate and release artifacts.

## Prohibited autonomous actions

- Contacting a patient or provider.
- Ordering tests or prescribing treatment.
- Scheduling care without coordinator approval.
- Suppressing a verified gap without a recorded reason.

## Overrides and suppression

A coordinator override requires a recorded actor, reason, and timestamp. Automated suppression occurs only for evidence failures and is visible in the evidence audit trail; it is not a clinical judgment.

## Interface support for oversight

- Priority badges show both band and workflow label; color is never the only signal.
- The synthetic banner is persistent and labeled for assistive technology.
- The evidence drawer is a labeled modal dialog with keyboard focus, Escape handling, and visible focus styles.
- Absence copy states "in the available records" so the coordinator does not read it as a complete history.
- Recommendation copy uses "verify" and "coordinate", never "order", "prescribe", or "contact".

## Automation-bias controls

- The gap card says "For coordinator verification".
- Priority copy says "Workflow priority, not clinical risk".
- The evidence drawer exposes raw quoted spans rather than model summaries.
- The action set contains no approve-and-send path.

## Verification

`tests/safety/accessibility-oversight.test.ts` asserts the labeled surfaces, keyboard-operable dialog, and workflow labels. Residual risk `RS-04` records that the accessibility audit is static, not assistive-technology tested.
