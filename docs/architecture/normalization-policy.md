# Normalization policy

Normalization is deterministic and versioned as `normalization-v1`.

Raw extracted values are always retained beside their normalized values.
Unknown aliases become explicit `unknown` values or remain unmapped; they are
never silently treated as a known clinical concept.

The maps are intentionally narrow for the synthetic benchmark:

- laboratory aliases map to internal codes such as `cbc`, `a1c`, `bmp`, `inr`,
  `tsh`, and `lipid`;
- medications map common generic and brand spellings;
- specialties map values such as Medical Oncology, Med Onc, and PCP;
- imaging modality and body-region mappings remain separate.

Referral windows, duplicate windows, and monitoring expectations live under
`lib/policies/`. They are benchmark reasoning policy, not event facts.
