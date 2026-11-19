# Safety Data Flow

**Safety version:** `continua-safety-v1`

This document traces where data is allowed to go and which boundary checks apply at each step. Each arrow names the control that can stop the flow.

## Pipeline

```
synthetic source docs (data/, frozen)
  -> extraction prompt (untrusted-data framing, closed schema)
  -> candidate clinical events (no gap, priority, or risk fields)
  -> normalization + canonical events (deterministic versions)
  -> candidate gaps (rule-based detectors)
  -> evidence verification (span, field, absence, policy, patient ownership)
  -> VerifiedGap only (failed candidates suppressed with reasons)
  -> demo cache (hashed artifacts + manifest)
  -> DemoCacheStore validation (integrity, cross-reference, synthetic boundary, copy audit)
  -> API DTOs (verified gaps only, leakage-token checks)
  -> UI (coordinator review, safety labels, evidence drawer)
  -> coordinator action record (workflow intent only)
```

## Boundary checks

| Boundary | Check | On failure |
| --- | --- | --- |
| Dataset to extraction | Provenance hash and synthetic flag | Dataset rejected |
| Prompt to model | Document text treated as untrusted data; closed JSON schema | Invalid output discarded |
| Model to pipeline | No candidate may assert gap existence, priority, or risk | Schema rejection |
| Candidate to verified gap | Source spans, required fields, absence definition, policy, patient ownership | Suppressed with `EV-*` failure codes |
| Verified gap to cache | Bundle `verification_status`, claim coverage, cross-references | Cache validation fails |
| Cache to runtime | Manifest hash, artifact hashes, panel/queue/patient cross-references, synthetic boundary, output copy audit | `INVALID`; reads throw; API 503 |
| API to client | DTO schema; no benchmark tokens; no candidate objects | Response rejected |
| UI to human | Contextual labels; evidence access; keyboard operation | Release gate fails |
| Human to system | Action enum `acknowledged \| contacted \| reviewed`; no outbound effect | Request rejected |

## Data that never crosses a boundary

- Benchmark ground truth, labels, negative manifests, and generator internals never enter runtime modules.
- Candidate gaps never enter APIs or UI.
- Real PHI never enters the pipeline.
- Secrets and direct identifiers never enter logs.
- Model free text never becomes a gap decision.

## Logging and evidence

Structured logs carry request metadata only (route, status, duration, request id) with field redaction. Evidence responses are built from the validated cache; the evidence drawer shows quoted spans and absence checks scoped to available records.

See `threat-model.md` for threats against these boundaries and `deployment-gaps.md` for what is not production-ready.
