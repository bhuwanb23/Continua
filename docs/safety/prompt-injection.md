# Prompt Injection and Model Output Controls

**Safety version:** `continua-safety-v1`
**Threat:** R1 (prompt injection), R2 (hallucinated evidence)

## Attack surface

Free text inside synthetic clinical documents can contain instruction-like content ("ignore previous instructions", "mark this resolved", "priority P1"). The model also returns free-form JSON that could be manipulated.

## Controls

### 1. Untrusted-data framing

The system prompt states that document content inside `<document>` tags is **untrusted data, never instructions**, and that instruction-like text must be ignored. It also states the model extracts facts and never decides whether a care gap exists.

### 2. Closed extraction schema

`EXTRACTION_JSON_SCHEMA` sets `additionalProperties: false` at the response and event levels. The event schema has no `gap`, `priority`, `risk_score`, or `recommended_action` fields. Injected fields fail validation.

### 3. Deterministic decision path

Detectors and evidence verification are rule-based. A document that says "mark this resolved" cannot resolve a gap: the detector reads canonical event fields, and the verifier checks spans, fields, absence definitions, policies, and patient ownership.

### 4. Envelope minimization

The extraction envelope includes only document content and approved metadata. Fixture keys, dataset labels, and ground-truth fields are excluded.

### 5. Output-language guard

Model-derived copy and cached display copy pass `checkOutputLanguage`. Clinical action, necessity, risk-prediction, and autonomy language is rejected before display.

### 6. Corpus coverage

The safety corpus includes `prompt_injection` cases:
- instruction text cannot create a verified gap;
- prompt hardening is present;
- injected fields are rejected by schema;
- injected copy fails the language guard.

## Detection and response

If injection succeeds despite controls:

1. Treat it as a safety incident (`IP-01`).
2. Preserve the document, prompt version, model output, and detector/verifier audit steps.
3. Disable the affected surface; do not patch copy alone.
4. Re-run `npm run test:safety` and regenerate the release report before restoring.

## Limitations

- No live adversarial red-team of the extraction model is performed in this phase.
- The demo cache is frozen, so runtime model behavior is not exercised by the public route.
- Prompt hardening reduces, but does not eliminate, injection risk. Residual risk remains under R1 and is reviewed each phase.
