# Phase 19 — Documentation & Reproducibility

> Depends on: Phase 18 (final product) · Unblocks: Phase 20
> Gate: **fresh-machine reproduction in under 10 minutes**

## Objective

An evaluator should be able to understand what this is, why it is built this way, and how to run it — without asking a question. Documentation is part of the product at a hackathon.

## Sub-phases

### 19.1 README (the front door)

Order matters:

1. One-paragraph what + who + why.
2. The 90-second demo path (what a judge will see).
3. Screenshot or GIF of the queue + evidence.
4. Quickstart (`install → seed → dev`), with the synthetic-data disclaimer.
5. Architecture diagram (the frozen pipeline).
6. "Why hybrid AI + deterministic rules" — three sentences.
7. Benchmark: actual numbers + link to `docs/BENCHMARK.md`.
8. Limitations and non-claims.
9. Roadmap (clearly labeled as not built).

### 19.2 Architecture documentation

`docs/ARCHITECTURE.md`:

- Stage-by-stage: ingestion → extraction → validation → normalization → event store → detectors → verification → priority → UI.
- Where the LLM is used and where it explicitly is not.
- Data model summary (no `risk_level`; the two priority fields).
- Failure handling at each stage.

### 19.3 Method documentation

`docs/METHOD.md`:

- The three gap rules in plain language, with the windows and thresholds.
- Why deterministic rules decide gaps (auditability, reproducibility, defensibility).
- What "grounding" means operationally (doc id + span + verification score).

### 19.4 Benchmark documentation

`docs/BENCHMARK.md` (from Phase 9):

- Dataset composition, version, seed, checksum.
- Metric table with actual values.
- Confusion counts per type.
- Limitations: synthetic, small labeled subset, heuristic windows.

### 19.5 Reproducibility script

`scripts/verify-setup.sh` (bash-compatible):

- Check Node version, install deps, run `check`, seed data, build cache, run eval, start dev.
- Fails with a clear message at the first broken step.
- Test it in a clean directory (ideally a fresh clone on another machine or a container).

### 19.6 Onboarding doc

`docs/CONTRIBUTING.md`:

- Directory map, where to add a detector, where to add a screen.
- The rule: specs win over code; a spec change is a separate, explicit commit.
- How to run the flagship test before committing.

## Deliverables

| Artifact | Contents |
|---|---|
| `README.md` | front door + quickstart |
| `docs/ARCHITECTURE.md` | pipeline detail |
| `docs/METHOD.md` | rules + grounding |
| `docs/BENCHMARK.md` | measured results |
| `docs/CONTRIBUTING.md` | repo map + conventions |
| `scripts/verify-setup.sh` | one-command reproduction |

## Gate — exit criteria

- [ ] Fresh clone → demo running in < 10 minutes following only the README.
- [ ] `verify-setup.sh` passes end-to-end in a clean environment.
- [ ] README's benchmark numbers match `eval-report.json`.
- [ ] Non-claims section present and explicit.
- [ ] No broken links, no references to files that do not exist.
- [ ] Architecture doc matches the implemented pipeline (not the aspirational one).

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Docs describing an older design | Written after Phase 18, verified against code |
| Benchmark numbers copied from a draft | Generated from `eval-report.json`, never typed from memory |
| Quickstart that assumes a pre-existing `.env` | `verify-setup.sh` proves the path from zero |

## Handoff to Phase 20

Phase 20 packages these docs into the submission.
