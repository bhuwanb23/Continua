# Dataset card — continua-synth-v1

## Summary

- **Dataset name:** continua-synth-v1
- **Generator version:** 1.0.0
- **Seed:** 20261117
- **Evaluation date:** 2026-06-05
- **Patients:** 80
- **Providers:** 26
- **Documents:** 485
- **Positive patients:** 42
- **Negative patients:** 38
- **Ground-truth gaps:** 66 (26 missed follow-up / 20 duplicate test / 20 medication monitoring)
- **Hard-negative families:** 15 (13 negative + 2 adversarial-positive)
- **Extraction-gold events:** 130 across 12 patients

## Intended use

- Developing and evaluating continuity-gap detection.
- Training or validating document-level event extraction.
- Benchmarking retrieval and reasoning over messy longitudinal records.
- Reproducibility testing of clinical-NLP pipelines.

## Not intended for

- Clinical decision-making.
- Training diagnostic or treatment models.
- Estimating real-world gap prevalence.
- Any use that treats synthetic patients as real people.

## Origin

Generated entirely by template. No real PHI, no real health system, no real provider. Names, dates, medications, and lab values are fictional.

## Known limitations

- Synthetic prose is templated and repetitive despite controlled messiness.
- Provider-name variants are limited to a small alias set.
- Date formats cover a handful of common patterns.
- No imaging of real documents; text only.
- Gap truth is planted, so metrics reflect detection of planted cases, not real-world recall.

## Reproducibility

`npm run generate:data` reproduces byte-equivalent output. `content_hash` is stored in `manifest.json` and re-verified by `npm run hash:dataset`.

## License

Synthetic data released for Continua development and evaluation. See repository license.
