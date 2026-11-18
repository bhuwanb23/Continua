# ClinicalEvent rejection taxonomy

| Code | Meaning |
|---|---|
| CE-001 | Candidate schema invalid |
| CE-002 | Unknown event type |
| CE-003 | Invalid or disallowed date |
| CE-004 | Source document missing |
| CE-005 | Source belongs to another patient |
| CE-006 | Source span cannot be verified |
| CE-007 | Confidence is outside `[0, 1]` |
| CE-008 | Event and payload are incompatible |
| CE-009 | Normalization failed or has an unsupported version |
| CE-010 | Unsupported value |

Only accepted events are placed in the canonical event store. Rejection
records preserve the candidate and stage for Phase 5 diagnostics.
