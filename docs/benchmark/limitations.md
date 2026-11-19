# Benchmark Limitations

- Synthetic dataset only.
- Artificial gap prevalence.
- Limited specialties.
- Controlled document templates.
- Narrow internal normalization vocabulary.
- Benchmark monitoring policies.
- Not clinically validated.
- No real EHR or PHI evaluation.
- No patient outcome measurement.
- No FDA or clinical-device claims.
- Extraction metrics are fixture replay, not live model quality.
- No live provider was configured, so live extraction and the LLM-only baseline are not measured.
- Dollar cost is not measured and is reported as null.
- Top-5 metrics are measured on one fixed panel.
- Demographic invariance is an input-invariance test, not population fairness validation.
- The dev extraction uses a regenerated fixture store because the older fixture predates current normalization.
- The worktree was dirty during benchmarking; provenance is recorded in metadata and artifact hashes.
