# Incident Response Playbooks

**Safety version:** `continua-safety-v1`
**Source of truth:** `lib/safety/incident.ts` (`INCIDENT_PLAYBOOKS`)

Six playbooks cover the incidents this prototype can plausibly produce. Each names severity, detection, immediate containment, evidence to preserve, and the release path back.

## IP-01 — Prompt injection or unsafe model output

- **Severity:** high
- **Detection:** language-guard rejection, schema rejection, unexpected gap/copy, safety corpus failure.
- **Contain:** stop the affected extraction or display surface; keep the frozen cache serving only validated data.
- **Preserve:** document text, prompt version, model output, detector and verifier audit steps.
- **Recover:** add the case to `data/safety-cases/prompt_injection/`, fix the control, re-run `test:safety`, regenerate artifacts.

## IP-02 — Wrong-patient evidence or identity leak

- **Severity:** critical
- **Detection:** `EV-002` failure, cache cross-reference failure, report of mismatched patient identity.
- **Contain:** stop the surface; invalidate the affected cache; do not serve the gap.
- **Preserve:** gap id, evidence ids, source doc ids, patient ids, validation report.
- **Recover:** fix ownership verification or cross-reference logic; add a regression case; require a clean cache validation.

## IP-03 — Benchmark or truth leakage

- **Severity:** high
- **Detection:** leakage-token scan, runtime import audit, unexpected label field in an API response.
- **Contain:** remove the route or import; rotate any exposed artifact; stop the release.
- **Preserve:** response body, route, commit, artifact hashes.
- **Recover:** restore isolation, re-run `audit:runtime-imports` and `check:leakage`, regenerate the release report.

## IP-04 — Cache tampering or integrity failure

- **Severity:** high
- **Detection:** manifest or artifact hash mismatch, cross-reference failure, store state `INVALID`.
- **Contain:** keep the store fail-closed; return 503; do not bypass validation.
- **Preserve:** validation report, file hashes, manifest, git status.
- **Recover:** rebuild from the frozen dataset, re-freeze, verify all artifacts, then restart the service.

## IP-05 — Secret or credential exposure

- **Severity:** high
- **Detection:** `scan:secrets`, logger review, repository scan.
- **Contain:** revoke the credential, remove the exposure, invalidate logs or artifacts containing it.
- **Preserve:** location, commit, exposure window (never the secret itself).
- **Recover:** rotate, add a scanner rule, re-run the security suite.

## IP-06 — Accessibility or oversight failure

- **Severity:** medium
- **Detection:** missing label, keyboard trap, color-only priority, inaccessible dialog, report from a reviewer.
- **Contain:** mark the surface as degraded; provide an accessible alternative.
- **Preserve:** page, viewport, assistive technology, steps to reproduce.
- **Recover:** fix the component, add a static or interaction check, update the accessibility audit.

## General rules

- Never claim HIPAA compliance or "HIPAA-safe" in an incident report.
- Never describe synthetic-data incidents as PHI incidents unless real PHI was actually introduced; if it was, treat as critical and follow legal/privacy escalation.
- The release gate remains `FAIL` until the incident is closed with evidence.
- Incident response has not been rehearsed; this is residual risk `RS-05`.
